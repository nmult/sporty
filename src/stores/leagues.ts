import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchLeagues, fetchSeasonBadges } from '@/api/sportsdb'
import { useDebounce } from '@/composables/useDebounce'
import { Statuses, type BadgeEntry, type League, type SeasonsResponse } from '@/types/league'

const TTL = 5 * 60 * 1000

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export const useLeaguesStore = defineStore('leagues', () => {
  const leagues = ref<League[]>([])
  const status = ref<Statuses>(Statuses.idle)
  const error = ref<string | null>(null)

  let leaguesFetchedAt: number | null = null

  const query = ref('') // what the input holds, updated on every keystroke
  const debouncedQuery = useDebounce(query, 250) // the debounced value the filter actually reads
  const selectedSport = ref('')

  // Cache badges once settled (success or error); only an explicit retry clears an entry.
  const badges = reactive(new Map<string, BadgeEntry>())

  const uniqSports = computed(() => {
    const sportsNames = leagues.value.map((l) => l.strSport)

    return [...new Set(sportsNames)].sort((left, right) => left.localeCompare(right))
  })

  const filteredLeagues = computed(() => {
    const query = debouncedQuery.value.trim().toLowerCase()

    return leagues.value.filter((league) => {
      const matchesSport = !selectedSport.value || league.strSport === selectedSport.value

      const matchesQuery =
        !query ||
        league.strLeague.toLowerCase().includes(query) ||
        (league.strLeagueAlternate ?? '').toLowerCase().includes(query)

      return matchesSport && matchesQuery
    })
  })

  function isLeaguesStale(): boolean {
    return leaguesFetchedAt === null || Date.now() - leaguesFetchedAt > TTL
  }

  async function loadLeagues(): Promise<void> {
    if (status.value === Statuses.loading) return
    if (status.value === Statuses.success && !isLeaguesStale()) return

    status.value = Statuses.loading
    error.value = null

    try {
      const data = await fetchLeagues()
      leagues.value = data.leagues ?? []
      leaguesFetchedAt = Date.now()
      status.value = Statuses.success
    } catch (e) {
      error.value = toMessage(e)
      status.value = Statuses.error
    }
  }

  function toBadgeEntry(data: SeasonsResponse): BadgeEntry {
    const firstWithBadge = data.seasons?.find((s) => s.strBadge)

    return {
      status: Statuses.success,
      url: firstWithBadge?.strBadge ?? null,
      season: firstWithBadge?.strSeason ?? null,
    }
  }

  async function loadBadge(id: string): Promise<void> {
    if (badges.has(id)) return

    badges.set(id, { status: Statuses.loading, url: null, season: null })

    try {
      const data = await fetchSeasonBadges(id)
      badges.set(id, toBadgeEntry(data)) // url may legitimately be null — still a cached success
    } catch (e) {
      badges.set(id, { status: Statuses.error, url: null, season: null, message: toMessage(e) })
    }
  }

  async function retryBadge(id: string): Promise<void> {
    badges.delete(id)
    await loadBadge(id)
  }

  function clearFilters(): void {
    query.value = ''
    selectedSport.value = ''
  }

  return {
    leagues,
    status,
    error,
    query,
    badges,
    selectedSport,
    uniqSports,
    filteredLeagues,
    loadLeagues,
    loadBadge,
    retryBadge,
    clearFilters,
  }
})