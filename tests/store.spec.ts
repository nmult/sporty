import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLeaguesStore } from '@/stores/leagues'
import * as api from '@/api/sportsdb'
import { FIXTURE_LEAGUES, FIXTURE_SEASONS, FIXTURE_SEASONS_NO_BADGE } from './fixtures/leagues'

function seededStore() {
  const store = useLeaguesStore()
  store.leagues = [...FIXTURE_LEAGUES]
  store.status = 'success'
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
  vi.restoreAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('search', () => {
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

describe('league list caching', () => {
  it('fetches once per session', async () => {
    const spy = vi.spyOn(api, 'fetchLeagues').mockResolvedValue({ leagues: FIXTURE_LEAGUES })
    const store = useLeaguesStore()

    await store.loadLeagues()
    await store.loadLeagues()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('success')
  })

  it('records an error state with its message on failure', async () => {
    vi.spyOn(api, 'fetchLeagues').mockRejectedValue(new Error('network down'))
    const store = useLeaguesStore()

    await store.loadLeagues()

    expect(store.status).toBe('error')
    expect(store.error).toBe('network down')
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
    expect(store.badges.get('4328')).toEqual({ status: 'loading', url: null, season: null })
    const second = store.loadBadge('4328')

    await Promise.all([first, second])

    expect(spy).toHaveBeenCalledTimes(1)
    expect(store.badges.get('4328')).toEqual({
      status: 'success',
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

    expect(store.badges.get('5555')).toEqual({ status: 'success', url: null, season: null })
  })

  it('caches errors but allows an explicit retry', async () => {
    const spy = vi.spyOn(api, 'fetchSeasonBadges').mockRejectedValue(new Error('boom'))
    const store = useLeaguesStore()

    await store.loadBadge('4328')
    expect(store.badges.get('4328')).toEqual({ status: 'error', url: null, season: null, message: 'boom' })

    await store.loadBadge('4328')
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockResolvedValue({ seasons: FIXTURE_SEASONS })
    await store.retryBadge('4328')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(store.badges.get('4328')).toMatchObject({ status: 'success' })
  })
})
