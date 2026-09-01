export interface League {
  idLeague: string
  strLeague: string
  strSport: string
  strLeagueAlternate?: string | null
}

export interface Season {
  strSeason: string
  strBadge: string | null
}

export const Statuses = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error',
} as const

export type Statuses = (typeof Statuses)[keyof typeof Statuses]

export interface BadgeEntry {
  status: Statuses
  url: string | null
  season: string | null
  message?: string | null
}

export interface LeaguesResponse {
  leagues: League[] | null
}

export interface SeasonsResponse {
  seasons: Season[] | null
}
