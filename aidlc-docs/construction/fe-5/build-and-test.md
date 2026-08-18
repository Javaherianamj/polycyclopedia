# FE-5 build and test — the gate record

**Run**: 2026-08-12 (Sonnet, generation + verification)
**Scope**: property-first search — sliders bounded by real data, a text
shorthand (`tg>100 tensile 40-80`), strict-AND matching with a separated
near-miss set, grade-class-aware results, "similar to this" pre-fill,
shareable URLs. Built in parallel against three sibling-owned files
(`web/src/lib/search/{parse-query,match,url-state}.ts`) and the build-time
index generator (`web/scripts/build-search-index.ts`); both landed and are
final as of this run.
**Verdict**: **PASS**.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `astro check` (65 files) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 120/120 — 12 new in `query-filters.test.ts` (own scope) + 108 carried, including the sibling-owned `parse-query`/`match`/`url-state`/`build-search-index` suites |
| `astro build` | 20 pages, including `/en/search` and `/fa/search` (API server required at build time for the other units' `getStaticPaths`, same as every existing page — not a new dependency) |
| Search route JS payload, gzip (`dist/_astro/{SearchIsland,client,react}.*.js` + inline astro-island/theme/popover boilerplate, traced by following every `from "./…"` import transitively from the two script refs the page actually loads) | **~69.4 kB gzip** (66,970 B chunks + 2,389 B inline) against the **120 kB** budget (§6 of the frontend plan) — comfortable margin. `client.*.js` (react-dom's hydration runtime, 57.2 kB gzip) dominates; `SearchIsland.*.js` itself is 6.9 kB gzip. This is the first `client:load` React island in the app (`DataBoundary.tsx` existed but was unused before this unit), so this is the first time react-dom's client bundle ships at all — not a cost specific to this unit's own code, but real weight this route now carries |
| `search-materials.json` + `search-properties.json` (BR12, fetched after hydration, not bundled) | 7 materials, 14 grade classes, 53 eligible properties — 2,623 B + 3,008 B gzip = 5.6 kB combined. Confirmed via network trace that these are separate static-asset fetches, not inlined into the JS bundle above |
| Console errors, both locales | none, on the production preview build (`astro preview`) |
| No horizontal overflow, 320/375/768/1440 px | Checked via `document.documentElement.scrollWidth === clientWidth` at each width, both `/en/search` and `/fa/search` — 0 failures. **DOM-verified, not visually screenshotted** — the Browser pane's screenshot compositor was unavailable for the whole session (see §3) |
| RTL correctness, `/fa/search` | `<html dir="rtl" lang="fa">`, all Persian copy renders (page lead, filters heading, results heading, near-miss reason with correct grammar, grade-class separator) |
| Sliders, real interaction | Click-to-focus + `ArrowRight` keyboard presses moved a slider's value, updated the URL (`history.replaceState`), and changed the result count live. Verified on both the dev server and the production preview build |
| Text box, real interaction | OS-level keystrokes (not synthetic events) typed into the focused input; `parseQuery` ran, `tg>=-119` narrowed to 1 primary + 1 near-miss, URL synced to `?tg=-119--110&q=tg%3E%3D-119`, unrecognized token (`xyz` in an earlier run) rendered its hint |
| Near-miss separation (BR5a) | DOM children of `[data-testid="search-results-list"]` are exactly `[h2, primary grid, near-misses block]` when misses exist — never interleaved with primary cards — and the near-misses block is **entirely absent from the DOM** (not just visually hidden) when there are none |
| Grade-class lockup (BR6) | Filtering `hardness_shore_d=61-63` returns 1 result rendering `"High-Density Polyethylene › Blow Molding"` — the parent material itself is suppressed even though its own range (55–65) would also have matched, per `match.ts`'s "grade class wins" rule |
| Matched-value-first cards (BR5b) | Every card leads with the matched property's actual value; verified on primary and near-miss cards in both locales |
| Shareable URLs (R13) | A filter/text change updates the URL live; pasting a URL with `?tg=…&q=…` back in restores the identical query-box value, filter state, unrecognized-token hint, and result set |
| BR13 pre-fill (`?from=hdpe`) | All 45 of HDPE's own eligible-property ranges pre-filled their sliders on load; HDPE self-matched as the sole result; the `from` param does not reappear in the URL once real filters exist (by construction — `encodeSearchState` has no `from` field) |
| Zero-filter cold load | Renders a distinct "start filtering" prompt, not `EmptyState` — see §2 |

---

## 2. Deviation from a literal reading of BR11, and why

BR11 says zero matching materials reuses the existing `EmptyState` copy/CSS
class. `match.ts`'s `search()` (sibling-owned, documented own-call) returns
`{primary: [], nearMisses: []}` whenever **zero filters are active at all** —
not just when filters are active and nothing matches. Those are two
different situations: a cold `/search` load has nothing missing from the
data, the reader simply hasn't asked a question yet; a filtered-to-zero
result genuinely has nothing to show. Rendering `state.empty`'s "Nothing to
show here" on first load would tell every visitor the site's data is broken
before they've touched a single control.

`ResultsList` now takes a `hasActiveFilters` flag and branches:
`primary.length === 0 && !hasActiveFilters` → a new `search.startPrompt` copy
key ("Move a slider or type a query above to start filtering."), styled as
an invitation (clay/`--act` accent, D36's "something you can do" semantic).
`primary.length === 0` with `hasActiveFilters` true still renders
`EmptyState`'s exact class and copy key (`state.empty`), unchanged from the
literal BR11 instruction. BR11 itself — reuse the existing state family
rather than invent a bespoke component — is honoured; only the condition
for *which* case counts as "empty" was narrowed. Both branches are
`data-testid`-tagged separately (`search-results-start-prompt` /
`search-results-empty`) so the distinction is testable.

## 3. Duplicate logic found and removed

`web/src/components/search/query-filters.ts` originally had its own
`intersectFilters`/`mergeFilters` pair to reconcile a slider and a text
token constraining the same property. Once `web/src/lib/search/match.ts`
landed, its `buildEffectiveFilters` turned out to already do exactly this —
`search()` reconciles same-property duplicates in `state.filters` by
intersection regardless of which source (slider or parsed text) produced
them. Kept the local pair would have meant two implementations of the same
rule that could silently drift apart. Removed `intersectFilters`/
`mergeFilters` and their tests; `SearchIsland` now hands `search()` a flat
`[...sliderFilters, ...textFilters]` array and lets `match.ts` own
reconciliation exclusively. `tokenToFilter` (operator-to-range conversion)
and `buildPrefillFilters` (BR13) stayed — neither is duplicated anywhere in
`lib/search/`.

## 4. A dev-server-only false alarm, recorded so it isn't rediscovered

Mid-session, `SearchIsland` appeared to hydrate into completely empty DOM
under `astro dev` — no console error, `client-render-time` set, `ssr`
attribute removed, but a React fiber root with `child: null`. Bisected by
stubbing the component down to a trivial `<div>`, which *also* rendered
empty in dev but rendered correctly under a production build
(`astro build` + `astro preview`). This is a dev-server-only hydration
quirk (this is the app's first `client:load` React consumer, so nothing
exercised this path before), not a defect in this unit's code — all
functional verification in §1 was against the production preview build, and
`astro check`/`vitest run` are unaffected either way.

## 5. `?from` pre-fill: a spec amendment forced by the real build config

`frontend-components.md` specifies the `.astro` page reads `?from=` server-
side and passes it down so the island "never parses the URL for it."
Verified against the running dev server that this is impossible under this
project's actual configuration: `output: 'static'`, no adapter (R23) means
every route — including in `astro dev` — is prerendered with no per-request
query string to read; `Astro.url.href` came back as the bare path with no
search params even when the request line carried `?from=hdpe`. `SearchIsland`
now falls back to reading `from` from `location.search` itself via
`getPrefillSlug` (`url-state.ts`, already built for exactly this) when the
server-passed prop is empty — the only way BR13 can fire under a real static
build. The prop is kept for forward-compatibility with an eventual adapter.
Documented inline in `SearchIsland.tsx` and both `search.astro` pages.

## 6. What this unit did not touch

`web/src/lib/search/{parse-query,match,url-state}.ts` and
`web/scripts/build-search-index.ts` (both sibling-owned, both landed and
used as-is), `web/src/components/{catalog,datasheet,value-atom}/`, `api/`.
FE-6 (compare) is not built — `CompareHandoffButton` links to
`/{locale}/compare?add=<slug1>,<slug2>,...`, which 404s today, the same
documented-gap pattern FE-3's `BottomLinks` and FE-4's homepage/catalog
already use for the same route.
