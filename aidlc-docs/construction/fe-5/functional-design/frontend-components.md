# FE-5 — Frontend Components

Follows the pure-logic / thin-DOM-wiring split FE-4 already established
(`filter-logic.ts` vs `catalog-filter.ts`) and reuses R4's four-state
components rather than inventing new ones. Routes: `web/src/pages/{fa,en}/search.astro`.

## Component hierarchy

```
search.astro (page, per locale)
└─ SearchIsland (React, hydrated client:load — sliders + text need JS)
   ├─ DataBoundary<{materials, properties}>   (reused unmodified from states/DataBoundary.tsx)
   │  ├─ Loading.astro-equivalent state        (R4, existing CSS classes)
   │  ├─ ErrorState-equivalent state           (index fetch failed)
   │  └─ on data:
   │     ├─ QueryTextBox
   │     ├─ PropertySliderPanel
   │     │   └─ PropertySlider × N (one per eligible SearchIndexProperty, BR2)
   │     ├─ UnrecognizedTokenHints
   │     ├─ ResultsList
   │     │   ├─ EmptyState.astro-equivalent    (BR11, zero matches)
   │     │   └─ SearchResultCard × N
   │     └─ CompareHandoffButton               (BR7, uncapped)
```

## `SearchIsland` (new, `web/src/islands/SearchIsland.tsx`)

- **Props**: `{ locale: Locale; prefillSlug?: string }` — `prefillSlug` comes
  from the page reading `?from=` server-side (Astro) and passing it down;
  the island itself never parses the URL for that param.
- **State**: the `SearchState` domain shape (`filters`, `rawQueryText`,
  `unrecognizedTokens`), plus the loaded index (`materials`, `properties`)
  once `DataBoundary`'s fetcher resolves.
- **Fetcher passed to `DataBoundary`**: `fetchSearchIndex(): Promise<ApiResult<{materials: SearchIndexMaterial[]; properties: SearchIndexProperty[]}>>` —
  a thin wrapper around `fetch('/search-materials.json')` +
  `fetch('/search-properties.json')` that maps HTTP/parse failure to
  `{ok:false}`, so `DataBoundary` needs zero changes to serve a build-time
  static asset instead of a live `/api/...` route (BR12's "streamed, not
  blocking" is exactly what deferring this fetch until the island hydrates
  already buys for free).
- On mount, if `prefillSlug` is set, looks it up in the loaded
  `materials` and applies BR13's pre-fill before rendering the rest.

## `PropertySliderPanel` / `PropertySlider`

- **Props** (`PropertySlider`): `{ property: SearchIndexProperty; value: {min: number; max: number}; onChange: (v: {min:number; max:number}) => void }`.
- Dual-handle range input bounded by `property.observedMin`/`observedMax`
  (BR2 — never `plausible_min/max`). `data-testid="search-slider-{key}"` per
  the automation-friendly-code rule.
- One `PropertySlider` per property present in `search-properties.json` —
  the panel never hardcodes a property list (mirrors R2's "no property list
  in JSX" rule, already established for the registry-driven datasheet).

## `QueryTextBox`

- **Props**: `{ value: string; onChange: (raw: string) => void; unrecognizedTokens: string[] }`.
- Plain controlled text input (`data-testid="search-query-input"`); parsing
  (business-logic-model.md §3) runs in a pure function
  (`web/src/lib/search/parse-query.ts`) called from `onChange`, not inline
  in the component — same pure-logic-first pattern as `filter-logic.ts`.
- Renders `UnrecognizedTokenHints` beneath itself when
  `unrecognizedTokens.length > 0` (BR9).

## `ResultsList` / `SearchResultCard`

- `ResultsList` **props**: `{ results: SearchResult[]; locale: Locale }`.
  Renders `EmptyState` (existing component, existing copy key) when
  `results.length === 0` — no new empty-state variant (BR11).
- `SearchResultCard` **props**: `{ result: SearchResult; locale: Locale }`.
  Reuses `MaterialCard`'s visual language (FE-4) but additionally renders
  `result.matchedProperties` as a small value list under the card — the
  "material plus the properties that were filtered on" D25 asks for. Not a
  raw reuse of `MaterialCard` since that component has no slot for
  per-search matched-property display; a sibling component sharing
  `catalog.css` tokens where they already match.
- `data-testid="search-result-card-{slug}"`.

## `CompareHandoffButton`

- **Props**: `{ resultSlugs: string[]; locale: Locale }`. Disabled
  (`aria-disabled`) when `resultSlugs.length === 0`. Links to FE-6's
  (not yet built) compare route with slugs as a query param — BR7, no cap.
  `data-testid="search-compare-all-button"`.

## URL sync (`web/src/lib/search/url-state.ts` + thin wiring script)

Same split as FE-4's `filter-logic.ts`/`catalog-filter.ts`: a pure
`encodeSearchState(state): URLSearchState` / `decodeSearchState(params): SearchState`
pair (unit-testable, no DOM), plus a thin script that calls
`history.replaceState` on every filter change and reads `location.search`
on mount — R13's shareable-URL requirement, same mechanism FE-4 already
proved out, applied to a richer state shape.

## Form validation

- Slider values are always in-range by construction (native range input
  bounded to `observedMin`/`observedMax` — no separate validation step).
- Text-box input has no "invalid" state to block on — BR9 means
  unrecognized tokens degrade to a hint, never a form error. There is
  nothing to submit; every keystroke updates results live.

## API integration points

None. Per D54/R39, this entire unit reads two build-time-generated static
JSON files (§1 of business-logic-model.md) — no `/api/...` call anywhere in
FE-5's v1 scope.
