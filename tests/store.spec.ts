import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLeaguesStore } from '@/stores/leagues'
import * as api from '@/api/sportsdb'
import { Statuses } from '@/types/league'
import { FIXTURE_LEAGUES, FIXTURE_SEASONS, FIXTURE_SEASONS_NO_BADGE } from './fixtures/leagues'

function seededStore() {
  const store = useLeaguesStore()
  store.leagues = [...FIXTURE_LEAGUES]
  store.status = Statuses.success
  return store
}

const names = (store: ReturnType<typeof seededStore>) =>
  store.filteredLeagues.map((l) => l.strLeague)

// query -> filteredLeagues goes through a 250ms debounce (useDebounce), so
// tests that change `query` must advance fake timers before asserting.
const DEBOUNCE_DELAY = 250
const flushDebounce = () => vi.advanceTimersByTimeAsync(DEBOUNCE_DELAY)

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('search', () => {
  it('applies the query only after the debounce delay', async () => {
    const store = seededStore()
    store.query = 'prem'

    // Still unfiltered: the debounced copy has not caught up yet.
    expect(store.filteredLeagues).toHaveLength(FIXTURE_LEAGUES.length)

    await flushDebounce()
    expect(names(store)).toEqual(['English Premier League'])
  })

  it('matches substrings case-insensitively', async () => {
    const store = seededStore()
    store.query = 'prem'
    await flushDebounce()
    expect(names(store)).toEqual(['English Premier League'])
    store.query = 'PREMIER'
    await flushDebounce()
    expect(names(store)).toEqual(['English Premier League'])
  })

  it('trims the query and treats an empty query as a no-op', async () => {
    const store = seededStore()
    store.query = '  prem  '
    await flushDebounce()
    expect(names(store)).toEqual(['English Premier League'])
    store.query = ''
    await flushDebounce()
    expect(store.filteredLeagues).toHaveLength(FIXTURE_LEAGUES.length)
  })

  it('matches strLeagueAlternate as well as strLeague', async () => {
    const store = seededStore()
    store.query = 'EPL'
    await flushDebounce()
    expect(names(store)).toEqual(['English Premier League'])
  })
})

describe('sport filter', () => {
  it('matches exactly, and the empty default returns everything', () => {
    const store = seededStore()
    store.selectedSport = 'Soccer'
    expect(names(store)).toEqual(['English Premier League', 'German Bundesliga'])
    store.selectedSport = ''
    expect(store.filteredLeagues).toHaveLength(FIXTURE_LEAGUES.length)
  })

  it('combines search and sport with AND', async () => {
    const store = seededStore()
    store.selectedSport = 'Soccer'

    // Both clauses hold: a Soccer league whose name contains the query.
    store.query = 'bundes'
    await flushDebounce()
    expect(names(store)).toEqual(['German Bundesliga'])

    // The name matches a league, but not one whose sport is Soccer.
    store.query = 'NBA'
    await flushDebounce()
    expect(store.filteredLeagues).toEqual([])
  })

  it('derives distinct sorted sport options from the data', () => {
    const store = seededStore()
    expect(store.uniqSports).toEqual(['Basketball', 'Motorsport', 'Soccer'])
  })
})

describe('clearing filters', () => {
  it('reports an active filter for a query or a sport', async () => {
    const store = seededStore()
    expect(store.hasActiveFilters).toBe(false)

    // Reads the undebounced query, so the flag flips on the first keystroke.
    store.query = 'prem'
    expect(store.hasActiveFilters).toBe(true)

    store.query = '   '
    expect(store.hasActiveFilters).toBe(false)

    store.selectedSport = 'Soccer'
    expect(store.hasActiveFilters).toBe(true)

    await flushDebounce()
  })

  it('resets both filters and restores the full list', async () => {
    const store = seededStore()
    store.query = 'prem'
    store.selectedSport = 'Soccer'
    await flushDebounce()
    expect(names(store)).toEqual(['English Premier League'])

    store.clearFilters()
    await flushDebounce()

    expect(store.query).toBe('')
    expect(store.selectedSport).toBe('')
    expect(store.hasActiveFilters).toBe(false)
    expect(store.filteredLeagues).toHaveLength(FIXTURE_LEAGUES.length)
  })
})

describe('league list caching', () => {
  it('fetches once per session', async () => {
    const spy = vi.spyOn(api, 'fetchLeagues').mockResolvedValue({ leagues: FIXTURE_LEAGUES })
    const store = useLeaguesStore()

    await store.loadLeagues()
    await store.loadLeagues()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(store.status).toBe(Statuses.success)
  })

  it('does not start a second request while one is in flight', async () => {
    const spy = vi.spyOn(api, 'fetchLeagues').mockResolvedValue({ leagues: FIXTURE_LEAGUES })
    const store = useLeaguesStore()

    // Not awaited: the second call lands while the first is still in flight.
    const first = store.loadLeagues()
    expect(store.status).toBe(Statuses.loading)
    const second = store.loadLeagues()

    await Promise.all([first, second])

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('treats a null payload as an empty list', async () => {
    vi.spyOn(api, 'fetchLeagues').mockResolvedValue({ leagues: null })
    const store = useLeaguesStore()

    await store.loadLeagues()

    expect(store.leagues).toEqual([])
    expect(store.status).toBe(Statuses.success)
  })

  it('records an error state with its message on failure', async () => {
    vi.spyOn(api, 'fetchLeagues').mockRejectedValue(new Error('network down'))
    const store = useLeaguesStore()

    await store.loadLeagues()

    expect(store.status).toBe(Statuses.error)
    expect(store.error).toBe('network down')
  })

  it('falls back to a generic message when the rejection is not an Error', async () => {
    vi.spyOn(api, 'fetchLeagues').mockImplementation(() => Promise.reject('kaboom'))
    const store = useLeaguesStore()

    await store.loadLeagues()

    expect(store.error).toBe('Something went wrong')
  })

  it('retries after a failure and clears the error', async () => {
    const spy = vi.spyOn(api, 'fetchLeagues').mockRejectedValue(new Error('network down'))
    const store = useLeaguesStore()

    await store.loadLeagues()
    expect(store.status).toBe(Statuses.error)

    spy.mockResolvedValue({ leagues: FIXTURE_LEAGUES })
    await store.loadLeagues()

    expect(spy).toHaveBeenCalledTimes(2)
    expect(store.status).toBe(Statuses.success)
    expect(store.error).toBeNull()
  })

  it('refetches once the TTL has elapsed', async () => {
    const spy = vi.spyOn(api, 'fetchLeagues').mockResolvedValue({ leagues: FIXTURE_LEAGUES })
    const store = useLeaguesStore()

    await store.loadLeagues()
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1)
    await store.loadLeagues()

    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('badge cache', () => {
  it('does not request a badge that is already loading', async () => {
    const spy = vi.spyOn(api, 'fetchSeasonBadges').mockResolvedValue({ seasons: FIXTURE_SEASONS })
    const store = useLeaguesStore()

    // Not awaited: the second call lands while the first is still in flight.
    const first = store.loadBadge('4328')
    expect(store.badges.get('4328')).toEqual({ status: Statuses.loading, url: null, season: null })
    const second = store.loadBadge('4328')

    await Promise.all([first, second])

    expect(spy).toHaveBeenCalledTimes(1)
    expect(store.badges.get('4328')).toEqual({
      status: Statuses.success,
      url: 'https://example.test/badge-93.png',
      season: '1993-1994',
    })
  })

  it('never refetches a settled badge', async () => {
    const spy = vi.spyOn(api, 'fetchSeasonBadges').mockResolvedValue({ seasons: FIXTURE_SEASONS })
    const store = useLeaguesStore()

    await store.loadBadge('4328')
    await store.loadBadge('4328')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('caches "no badge available" as success with a null url', async () => {
    vi.spyOn(api, 'fetchSeasonBadges').mockResolvedValue({ seasons: FIXTURE_SEASONS_NO_BADGE })
    const store = useLeaguesStore()

    await store.loadBadge('5555')

    expect(store.badges.get('5555')).toEqual({ status: Statuses.success, url: null, season: null })
  })

  it('caches errors but allows an explicit retry', async () => {
    const spy = vi.spyOn(api, 'fetchSeasonBadges').mockRejectedValue(new Error('boom'))
    const store = useLeaguesStore()

    await store.loadBadge('4328')
    expect(store.badges.get('4328')).toEqual({
      status: Statuses.error,
      url: null,
      season: null,
      message: 'boom',
    })

    await store.loadBadge('4328')
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockResolvedValue({ seasons: FIXTURE_SEASONS })
    await store.retryBadge('4328')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(store.badges.get('4328')).toMatchObject({ status: Statuses.success })
  })
})
