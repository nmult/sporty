import type { LeaguesResponse, SeasonsResponse } from '@/types/league'

const BASE = 'https://www.thesportsdb.com/api/v1/json/3'

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${BASE}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const fetchLeagues = async (): Promise<LeaguesResponse> => {
  return request<LeaguesResponse>('/all_leagues.php')
}

export const fetchSeasonBadges = async (id: string): Promise<SeasonsResponse> => {
  return request<SeasonsResponse>(`/search_all_seasons.php?badge=1&id=${encodeURIComponent(id)}`)
}
