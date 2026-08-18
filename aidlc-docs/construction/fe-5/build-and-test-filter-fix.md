# FE-5 filter-persistence fix — the gate record

**Run**: 2026-08-15 (Sonnet, verification + one additional fix, on top of a
prior uncommitted pass)
**Scope**: the owner's report — "when a polymer is removed by a filter,
after bringing the filter back to where it was, the polymer does not go
back… when I add too many filters, the search will not work at all anymore
before refreshing." Confined to the search surface
(`web/src/islands/SearchIsland.tsx`, `web/src/lib/search/*`,
`web/src/components/search/*`, `web/src/styles/search.css`).
**Verdict**: **PASS** — root cause confirmed and fixed, a second bug found
during verification and fixed, refresh mystery resolved empirically, no
regressions (348/348 `vitest`, 0 `astro check` errors).

---

## 0. Starting state — most of this fix already existed, uncommitted

Before touching anything, `web/src/lib/search/slider-filters.ts`,
`SearchIsland.tsx`'s `handleSliderChange`/`handleSliderClear`/
`handleClearAllFilters`, the chip list and "clear all" control in
`PropertySliderPanel.tsx`, the per-slider reset in `PropertySlider.tsx`, and
the `missingData` bucket in `match.ts`/`ResultsList.tsx` were **already
present** on disk (all of `web/` is uncommitted in this repo — `git status`
shows it as a single untracked tree, so there's no commit history to diff
against). This looks like a prior session did the bulk of the implementation
work described in the brief and stopped short of verification and the gate
record. This run's job was therefore: verify the diagnosis and the fix
against the running app with real data, resolve the owner's "refresh fixes
it" claim, and — per the brief's instruction to follow the evidence — look
for anything the prior pass missed. It found one real bug (§3).

## 1. Diagnosis, verified

Reproduced live against the running dev server (`polypedia-api` :3001,
`fe1-web` :4321), using a material chosen specifically to isolate the bug:
**LLDPE › Blow Molding** (a `grade_class`), which carries a real `density`
value but **no** `tensile_strength` value at all.

1. Regenerated `web/public/search-materials.json`/`search-properties.json`
   (`npm run build:search-index`) — the checked-in copies were stale (7
   materials, from an earlier DB state) and understated the sparsity the fix
   brief describes. Against the live DB: **17 materials, 10 with zero
   property values at all** (`abs`, `epoxy`, `epdm`, `pa6`, `pa66`, `pc`,
   `pla`, `pom`, `ps`, `ptfe`), matching the brief's numbers exactly.
2. With `density` narrowed to `[0.9, 1.4]` (still covering LLDPE Blow
   Molding), baseline primary result set = **14** subjects.
3. Narrowed `tensile_strength` to `[10, 72.5]` — a range that excludes
   *no* subject with a real tensile value (the smallest real value in the
   dataset is 12.8) but is no longer the property's full `[8, 72.5]`
   extent. Primary set dropped to **11** — LLDPE/LDPE/HDPE Blow Molding
   (the three grade classes with no tensile value) disappeared, correctly
   relocated to the new `missingData` bucket, not silently dropped.
4. Dragged `tensile_strength` back to exactly `[8, 72.5]` (its full observed
   range). Primary set returned to **14**, byte-identical (same
   `data-testid` set, same order) to step 2's baseline. This is the owner's
   exact scenario and the fix's core acceptance test — confirmed **PASS**.
5. Stacked 4 filters (`density`, `tg`, `hdt`, `elongation_at_break`) down to
   0 results, clicked **Clear all filters** — full recovery to the cold-load
   start-prompt state, URL reset to the bare path, **without a page
   reload**. **PASS**.
6. Per-slider reset control: narrowed `tg`, clicked its own reset button —
   filter removed, URL param removed, reset button itself disappears once
   the slider has nothing to reset (`isActive` gates it). **PASS**.

## 2. The refresh mystery, resolved empirically

The brief poses a real paradox: `encodeSearchState` writes every active
filter to the URL, the island restores from the URL on mount, so a reload
*should* reproduce the same broken state — yet the owner reports refresh
fixes it. Rather than reason about it in the abstract, this was tested
directly: `slider-filters.ts`'s `applySliderChange` was **temporarily**
reverted to the pre-fix naive behaviour (`next[propertyKey] = {...}`,
unconditional, no delete branch — see the file's own "THE BUG THIS FILE
FIXES" comment for the original), the exact owner scenario was reproduced
(14 → 11, drag back → **still 11**, confirming the bug), and then the
**literal same URL** (`?density=0.90005-1.4&tensile_strength=8-72.5` — note
`tensile_strength` explicitly serialized at its *full* range, because the
naive code writes an entry regardless) was reloaded via `navigate` (a full
document reload, equivalent to F5 — not a client-side route change).

**Result: still 11, not 14.** The reload reproduced the identical broken
state. `slider-filters.ts` was restored immediately after (diffed against a
backup to confirm an exact restore; `vitest run` re-confirmed 348/348
afterward).

This empirically eliminates two of the brief's candidate explanations:
- *"Does `decodeSearchState` drop some filters?"* — No. The reloaded page
  showed exactly the same 11-subject set the pre-reload state had, meaning
  `tensile_strength=8-72.5` was decoded and reapplied faithfully.
- *"Do full-range filters serialize differently?"* — No. `8-72.5` is a
  perfectly ordinary `min-max` param under the same `RANGE_RE` every other
  filter uses; nothing about being "full range" changes its encoding.

That leaves the third candidate the brief names — **the URL wasn't actually
carrying the reader's filters at the moment they hit refresh** — as the only
one consistent with both the owner's report and this test. Two ways that
happens, and either is far more mundane than a second logic bug:

- The owner's "refresh" was very plausibly not a literal same-URL reload —
  clicking a nav link back to *Search*, retyping the bare address, or
  reopening the page from a bookmark all discard the query string and
  restart the island with `sliderFilters = {}`. That reads as "it's fixed"
  because the whole broken accumulation is gone, but it's a full reset, not
  a repair — and it costs the reader every filter they'd set, which is
  exactly why they escalated ("too many filters and search stops working
  *at all*").
- Less charitably: if the version the owner tested reached production
  before the URL-sync `useEffect` was wired up (or `history.replaceState`
  wasn't firing for some other reason not reproducible now), the address
  bar would never have carried their filters in the first place, and *any*
  reload — same URL or not — would trivially "recover" by starting from
  nothing.

Both explanations converge on the same operational fact, which is what
matters for the fix: **pre-fix, the only way to recover was to lose the
entire search, not repair it.** That is the real bug the brief asked to
close, and item 2 (chips, per-filter clear, clear-all, all without a
reload) is what closes it. No separate URL-sync defect was found — the
mechanism (`encodeSearchState`/`decodeSearchState`/`history.replaceState`)
was verified correct in both directions (§1 step 4's URL check, §4 below).

## 3. A second bug found during verification, and fixed

While exercising the URL round-trip with a **text-derived** filter active
(`?density=...&tensile_strength=...&q=tg%3E100`, no `tg` slider ever
touched), reloading that URL revealed the app had **also** written
`tg=100-120` into the address bar on its own. That happened because the old
URL-sync effect encoded `searchState.filters` — the full
`[...sliderFilters, ...textFilters]` merge `search()` uses for matching —
into the URL, and the URL format has no field marking a param's origin.

On the *next* load, `decodeSearchState` read that `tg` param back as an
ordinary slider filter (nothing distinguishes it from a real drag), so
`sliderFilters.tg` got populated even though the reader never touched the
`tg` slider. That gave `tg` a chip and a per-slider reset button it hadn't
earned. Clicking that chip's "×" called `clearSliderFilter('tg')` — which
correctly deleted the fabricated `sliderFilters.tg` entry — but
`rawQueryText` still held `"tg>100"`, so `textFilters` regenerated the
identical `tg` constraint on the very next render, and the URL-sync effect
wrote `tg=100-120` straight back into the address bar. **The chip visibly
disappeared while the filter it claimed to remove kept working** — silently
leaving an invisible constraint active, precisely the failure mode the fix
brief warned against for typed filters.

Verified live (`javascript_tool`, real `Event('input'/'change')` dispatch):
before the fix, clicking the fabricated `tg` chip left `count` at
`"1 materials match"` and the URL unchanged. After the fix (below), the same
URL never produces a `tg` chip at all.

**Fix** (`web/src/islands/SearchIsland.tsx`): the URL-sync effect now
encodes a separate `urlSyncState` — `Object.values(sliderFilters)` plus
`rawQueryText` — instead of the merged `activeFilters` used for `search()`.
`q` remains the single source of truth for anything text-derived;
`parseQuery`/`tokenToFilter` regenerate the same filter from it on every
load, so nothing is lost from a shared URL (R13 still holds). A chip now
appears if and only if clicking its "×" can actually turn the constraint
off. This decision is written up as a new "own call" in
`business-rules.md`'s post-launch amendments section, per this project's
convention of recording decisions rather than silently changing behaviour.

## 4. What changed

| File | Change |
| --- | --- |
| `web/src/islands/SearchIsland.tsx` | URL-sync effect now encodes `sliderFilters` only (`urlSyncState`), not the merged `activeFilters` — fixes §3. Heavily commented with the bug's mechanism. |
| `web/src/lib/search/url-state.test.ts` | Two new tests pinning the §3 contract: a text-only constraint gets no range param, and a reload reconstructs the same effective filter via `q` + re-parsing, not a fabricated slider entry. |
| `aidlc-docs/construction/fe-5/functional-design/business-rules.md` | New "Post-launch amendments" section recording both `applySliderChange`'s full-range-deletes-the-entry rule and the sliderFilters-only URL encoding as own calls, cross-referenced to this file. |
| `web/public/search-materials.json`, `web/public/search-properties.json` | Regenerated (`npm run build:search-index`) against the current DB — were stale (7 materials) at the start of this run; now 17 materials / 55 properties, matching the brief's sparsity numbers. Build artifact, not hand-edited. |

Everything else — `slider-filters.ts`'s full-range-deletes-the-entry rule,
the chip list / clear-all / per-slider reset UI, the `missingData` bucket
and its disclosure UI, all `search.*` i18n keys — was already in place at
the start of this run (§0) and is verified, not authored, here.

## 5. Business rules re-checked, not just re-read

- **BR5 / BR5a** (strict AND, `buildEffectiveFilters` intersection, near-miss
  ≤20% threshold): unchanged by this work; `match.test.ts`'s 26 tests still
  pass unmodified.
- **BR13** (`?from=<slug>` pre-fill): `buildPrefillFilters` populates
  `sliderFilters` directly in `useState`'s initializer, **bypassing**
  `applySliderChange` entirely — so the "full range deletes the entry" rule
  never runs against it. Verified live: `?from=hdpe` pre-filled all 45 of
  HDPE's own eligible ranges (including single-point ones like
  `tg=-120--120`), every one rendered as a removable chip, 1 material
  (HDPE itself) matched. A pre-filled filter that happens to equal the
  property's full observed range would only collapse if the reader then
  actively dragged that exact slider to the same value — correct per the
  rule's own definition ("full range now" behaves like "no constraint"),
  not a violation of BR13.
- **Text shorthand / `query-filters.ts` / `parse-query.ts`**: unchanged.
  Verified live that `tg>100` still filters correctly, and — per §3 — is now
  correctly *not* independently removable via a chip; the only ways to clear
  a text-derived constraint are editing the text box directly or "clear
  all" (which clears both `sliderFilters` and `rawQueryText` together, so
  it never leaves a text-derived filter silently active — this was already
  correct in the pre-existing `handleClearAllFilters`).
- **R13** (shareable URLs): re-verified end to end after §3's fix — a URL
  with `density`, `tensile_strength`, and `q=tg%3E100` reproduces the exact
  same result count, chip set (2, not 3), and query-box text on load.

## 6. Verification log (browser, against the running app)

All checks below ran against the already-running `polypedia-api` (:3001)
and `fe1-web` (:4321) dev servers via the Browser pane's `javascript_tool`
(real `Event('input'/'change')` dispatch on the native `<input type=range>`
setters, not synthetic React props) and `read_page`/`get_page_text`, per the
brief's instruction — the pane's screenshot compositor was not used.

| Check | Result |
| --- | --- |
| Owner's exact scenario (§1.2–1.4) | **PASS** — byte-identical restore |
| 4-filter stack → clear all, no reload | **PASS** |
| Per-slider reset | **PASS** |
| URL round-trip after §3's fix | **PASS** — no fabricated params, shared URL still reproduces state |
| `?from=hdpe` pre-fill vs. the new rule | **PASS** — untouched, all 45 filters present |
| Text shorthand still filters | **PASS** |
| `/fa/search`, RTL | **PASS** — `dir="rtl"`, all `search.*` copy renders in Persian, aria-labels translated (e.g. `حذف فیلتر چگالی`) |
| Dark theme (`data-theme="dark"`) | **PASS** — chip/clear-all/panel colours all re-token, no hardcoded values found in `search.css` (`grep` for hex literals: none) |
| No horizontal overflow at 320 / 375 / 768 px | **PASS** — `document.body.scrollWidth === window.innerWidth` at all three, both locales |
| Pointer targets | **PASS** — chip and "clear all" measured at 44px `getBoundingClientRect().height` in the browser |
| Console errors | none, on `/en/search` and `/fa/search`, light and dark |
| `vitest run` | **348/348** (was 346 at the start of this run; +2 new in `url-state.test.ts` for §3) |
| `astro check` | 0 errors, 0 warnings, 0 hints (149 files) |

## 7. Incidental: an unrelated build break, fixed in passing

Mid-session, `astro dev` started 500ing on **every** route (not just
search) with `CssSyntaxError` in `web/src/styles/learn-map.css` — a
mismatched `/* */` comment (a stray `*/` inside prose reading `--dur-*/
--ease-*`) that prematurely closed the file's header comment, which
`global.css` imports unconditionally. This is unrelated to the search
surface — `learn-map.css` belongs to the Learn MAP unit another session was
actively building concurrently — but it blocked all browser verification
here, including for `/en/search`. Applied the minimal one-space fix needed
to unblock testing; the concurrent session subsequently landed its own,
better fix (renaming the tokens to `--dur-x`/`--ease-x` in the prose so the
ambiguity can't recur), which is what's on disk now. No Learn-surface file
was otherwise touched.

## 8. What's still open

- The refresh mystery (§2) is resolved to the extent the evidence allows —
  the code path was verified correct, and the pre-fix reload-doesn't-help
  behaviour was reproduced and confirmed. Which of the two mundane
  explanations actually matches what the owner did is not independently
  confirmable without asking them; either way it's now moot; a reload is no
  longer the only way to recover.
- `web/public/search-materials.json`/`search-properties.json` need
  regenerating again whenever the DB's curated data changes — same
  build-time-index caveat BR12 already documents, called out here only
  because this run found the checked-in copies stale enough to understate
  the bug's severity during testing.
- No new automated test exercises `SearchIsland.tsx` itself (React
  component/wiring layer) — consistent with this codebase's existing
  convention of testing the pure logic modules (`slider-filters.ts`,
  `match.ts`, `url-state.ts`, `query-filters.ts`) and verifying the thin
  island by hand against the running app, not a gap introduced by this fix.
