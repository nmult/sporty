// tests/fixtures/leagues.ts
import type { League, Season } from '@/types/league'

export const FIXTURE_LEAGUES: League[] = [
  {
    idLeague: '4328',
    strLeague: 'English Premier League',
    strSport: 'Soccer',
    strLeagueAlternate: 'Premier League, EPL, England',
  },
  { idLeague: '4387', strLeague: 'NBA', strSport: 'Basketball', strLeagueAlternate: null },
  { idLeague: '4331', strLeague: 'German Bundesliga', strSport: 'Soccer' },
  { idLeague: '4370', strLeague: 'Formula 1', strSport: 'Motorsport' },
  { idLeague: '5555', strLeague: 'Badgeless Cup', strSport: 'Basketball' },
]

export const FIXTURE_SEASONS: Season[] = [
  { strSeason: '1992-1993', strBadge: null },
  { strSeason: '1993-1994', strBadge: 'https://example.test/badge-93.png' },
  { strSeason: '1994-1995', strBadge: 'https://example.test/badge-94.png' },
]

export const FIXTURE_SEASONS_NO_BADGE: Season[] = [
  { strSeason: '2024-2025', strBadge: null },
  { strSeason: '2025-2026', strBadge: null },
]
