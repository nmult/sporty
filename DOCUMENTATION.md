# Documentation & Design Decisions

Brief: an SPA built on top of TheSportsDB API — list leagues, display `strLeague`, `strSport`,
and `strLeagueAlternate`, support filtering by name and sport, use a component-based responsive
UI, and fetch a season badge when a league is selected.

## Architecture

```text
src/
├── components/
│   ├── SearchBar.vue          # Name filter input
│   ├── LeagueFilters.vue      # Sport dropdown, options derived from data
│   ├── ResultsSummary.vue     # Result count and active-filter reset
│   ├── LeagueList.vue         # Main container: loading / error / empty / grid
│   ├── LeagueCard.vue         # Individual league display, click loads badge
│   └── SeasonBadge.vue        # Season badge in its four states
├── stores/
│   └── leagues.ts             # Pinia store: data, filters, caching
├── api/
│   └── sportsdb.ts            # API layer, no state
├── composables/
│   └── useDebounce.ts         # Debounced copy of a ref
├── types/
│   └── league.ts              # League/Season interfaces, statuses, BadgeEntry
├── styles/
│   ├── _tokens.scss           # Design tokens as CSS custom properties
│   ├── _mixins.scss           # Skeleton shimmer mixin
│   └── main.scss              # Global styles
├── App.vue                    # Root component
└── main.ts                    # Application bootstrap
```

## Key Decisions

- **State lives in one Pinia store.** Shared data, request status, filter values, and the badge
  cache have a single owner. Components stay focused on rendering and user interaction rather
  than coordinating shared state.

- **Both filters are derived in one computed value.** `filteredLeagues` combines them with AND:
  sport must match exactly (empty means all), while the query must appear in `strLeague` or
  `strLeagueAlternate`, case-insensitively. `hasActiveFilters` derives whether any filter is
  currently applied, allowing the result summary and reset behavior to stay consistent with
  the same source of truth.

- **The sport dropdown is derived from API data.** `uniqSports` is a sorted `Set` of `strSport`
  values, so the available options always reflect the leagues in the current payload rather than
  relying on a hardcoded list that could drift from the API.

- **Search is debounced, while the input remains immediate.** The field updates on every
  keystroke, while filtering reads a 250 ms-delayed value through the reusable `useDebounce`
  composable. This reduces unnecessary recalculation without making the input itself feel
  unresponsive.

- **Badges are cached per league and are not re-fetched unnecessarily.** `badges` is a
  `Map<string, BadgeEntry>` keyed by `idLeague`. A `loading` entry is written *before* awaiting
  the request, so the same `badges.has(id)` check used for cached results also prevents duplicate
  requests from repeated clicks. Successful responses with no artwork are cached as
  `success` with `url: null`. Errors are retained so the UI can expose an explicit retry action;
  `retryBadge()` clears the entry before trying again. The league list has a simpler policy:
  successfully loaded data is reused for five minutes before the next call may refresh it.

- **The card displays the first season that actually has a badge.** The seasons endpoint may
  return entries with `strBadge: null`, so selecting `[0]` blindly could produce no image. The
  store instead selects the first season with artwork and retains its season label for the
  caption.

- **The UI is responsive using plain SCSS.** Cards use an
  `auto-fill, minmax(280px, 1fr)` grid, while the filter row stacks below 640 px. Colours,
  spacing, and badge dimensions are represented as CSS custom properties, with no UI framework.
  The badge container reserves the same space across all states, preventing layout shift when
  an image finishes loading.

- **Tests focus on store and product behavior rather than the DOM.** 21 Vitest tests cover
  search and debounce behavior, combined filters, filter reset state, derived sport options,
  league-list caching and TTL behavior, request deduplication, empty and error responses,
  retry flows, badge caching, missing badges, and explicit badge retries. Stubbed API calls
  and fake timers keep the suite fast and deterministic. `npm run build` runs `vue-tsc`
  before the Vite production build, while ESLint and Prettier provide static and formatting
  checks.

- **AI tools: Claude Code (Anthropic).** Used to accelerate scaffolding, component
  implementation, and styling iterations. Architecture, state ownership, caching strategy,
  filter semantics, and implementation trade-offs were reviewed and decided by me.

## Open Questions

- The free API key currently returns 10 leagues, all Soccer, with no `strLeagueAlternate`.
  The implementation follows the documented contract: the field is optional and rendered when
  present, while sport options are derived from the response. These paths are therefore exercised
  through test fixtures rather than the current live payload.

- Whether five minutes is the appropriate freshness window for the league list, and whether a
  badge request error should expire automatically rather than waiting for an explicit retry.

- Both caches are in memory, so a page reload starts with an empty cache. `sessionStorage` would
  provide session-scoped persistence, but it also introduces a rehydration path and additional
  invalidation considerations that are not necessary for the current scope.

## Possible Improvements

- Sorting by league name or sport.
- Client-side pagination for larger datasets.
- Season selection using already fetched season data.
- Extended component and interaction tests.
- A lightweight CI pipeline for pull requests covering install, lint, tests, type-checking,
  and production build.