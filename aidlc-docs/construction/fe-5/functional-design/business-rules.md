# FE-5 — Business Rules

Each rule cites the question it answers (`fe-5-functional-design-plan.md`) or
is marked **[own call]** for a rule needed to make the plan buildable that
wasn't one of the 8 questions — those are deliberately narrow, reversible
implementation choices, not new open decisions.

| #    | Rule | Source |
| ---- | ---- | ------ |
| BR1  | The index includes every material regardless of `status`, and every property value regardless of citation/observation status. FE-5 is a build-time capability like FE-1–4; publish gating is FE-9's job | Q1 |
| BR2  | A property gets a slider iff `property_definition.is_searchable = true` **and** it has ≥1 real value in the index. Slider bounds are the *observed* min/max in the data, never `plausible_min/max`. Zero-data eligible properties render no slider (not a disabled one) | Q4 |
| BR3  | Text-box alias tokens are derived mechanically from `property_definition.key` (full key + its first `_`-delimited segment) — never hand-maintained | Q2 |
| BR4  | The text box accepts English tokens and canonical units only, on both `/fa/search` and `/en/search` — it is a power-user shortcut, not a translated mini-language | Q3 |
| BR5  | Filters combine with strict AND: sliders AND parsed text terms, and when both constrain the same property, their ranges intersect rather than one overriding the other. Strict AND defines the **primary** result set only — see BR5a | Q5 |
| BR5a | **Near misses are shown as a clearly-separated secondary set.** A subject that fails strict AND on **exactly one** active filter, by ≤20% of that filter's own span, is a near miss. Near misses never mix into the primary list, never affect its order, and are individually labelled with which constraint they missed and by how much. Zero near misses renders nothing at all — no empty secondary heading | Q5 (owner amendment) |
| BR5b | **The property the reader chose to filter on is what the result is about.** Every result card leads with the matched properties' actual values (D25), and near-miss cards lead with the missed one. A result never renders as a bare material name with the matched values buried | Q5 (owner amendment) |
| BR6  | **Search reports at grade-class granularity when the matched property is grade-dependent.** When a `grade_class` row carries its own value for a filtered property, the result is that grade class (rendered under its parent material, e.g. LDPE › Film), not the generic material. When only the material carries the value, the result is the material, exactly as before. A material and its own grade classes never both appear for the same matched property | Q6 = **B** (owner amendment) |
| BR7  | "Send to compare" (D25) passes the full current result set, uncapped. Any limit belongs to FE-6, not FE-5 | Q7 |
| BR8  | No build-staleness indicator on the search page — consistent with every other static page on the site | Q8 |
| BR9  | **[own call]** An unrecognized alias token or an unparseable number is dropped from the active filter set (not a hard query error) and shown as an "unrecognized: `<token>`" hint next to the text box | business-logic-model.md §3 |
| BR10 | **[own call]** Primary results preserve the index's natural (catalog) order — strict AND admits no degrees of matching, so there is nothing to rank. **Near misses (BR5a) are ordered by miss magnitude ascending**, closest first, which is the only ordering that means anything for that set | business-logic-model.md §5 |
| BR11 | **[own call]** Zero matching materials renders the existing `EmptyState` component (`web/src/components/states/EmptyState.astro`), not a bespoke one — same "no data yet" family of states R4 already defines | frontend-components.md |
| BR12 | **[own call]** The two index JSON files are fetched as static assets on navigating to the search page, never inlined into a page-JS bundle — the only way to keep §6's "≤120 kB gzip, index streamed not blocking" budget meaningful | frontend-plan.md §6 |
| BR13 | **[own call]** Landing on `/search?from=<slug>` pre-fills every eligible slider to that material's own value range (FE-3's `BottomLinks`/S7 contract) with no text tokens pre-filled | business-logic-model.md §7 |

## Validation / constraint notes

- A material with **no** value for a filtered property never matches (BR2 +
  BR5 together: only properties with real data are filterable, and a filter
  the material has no value for cannot intersect anything).
- Alias collisions: checked against the current 55-property registry at
  design time — no two `is_searchable` properties share a first-segment
  alias today. If a future property collides, the full key still
  disambiguates (BR3); this is a known, accepted limit of the short form,
  not a defect to design around now.
- Range filters are always inclusive on both ends (`[min, max]`), matching
  how `property_value.value_min`/`value_max` already work in the schema —
  no new open/closed-interval convention introduced.

## Post-launch amendments (filter-persistence fix, see `build-and-test-filter-fix.md`)

- BR2/BR5's "no value never matches" is unchanged and correct for a filter
  the reader actually intends. What was wrong was upstream of it: nothing
  ever removed a slider-derived entry from `sliderFilters`, so dragging a
  slider back to its full observed range didn't restore the "no constraint"
  state the reader expected — it kept writing a full-width filter that still
  hard-excluded every subject with no value for that property. **[own call,
  new]** A slider whose current value spans the property's full observed
  extent on both sides is now treated as identical to "never touched": its
  entry is deleted from `sliderFilters` rather than written as a full-width
  filter (`web/src/lib/search/slider-filters.ts`). "Untouched" and "reset to
  full range" are now the same state on every axis that matters — what
  `search()` sees, what the URL carries, and what the slider renders.
- **[own call, new]** `encodeSearchState` (url-state.ts) is unchanged and
  still just serializes whatever `ActiveFilter[]` it's given — but its
  caller (`SearchIsland`) now feeds it `sliderFilters` only, never the
  merged `[...sliderFilters, ...textFilters]` it hands to `search()`. A
  text-derived filter (e.g. `tg>100` typed in the query box) is represented
  in the URL exclusively by `q`, never by its own `propertyKey=min-max`
  param. Reasoning: the URL format has no way to mark a param's origin, so a
  merged encoding meant a *typed* constraint came back from a reload
  indistinguishable from a *dragged* one — it got a chip and a reset button
  the reader never earned by touching a slider, and clicking that chip's "x"
  deleted the fabricated `sliderFilters` entry while `rawQueryText` (still
  holding the same text) silently regenerated the identical constraint on
  the next render. `parseQuery`/`tokenToFilter` already deterministically
  reconstruct the same text-derived filter from `q` alone on every load, so
  nothing is lost from a shared URL (R13 still holds) — only the redundant,
  misattributed param is gone. Net effect: a filter chip is only ever shown
  for a constraint the chip's own "×" can actually turn off; a text-derived
  constraint is only ever removable by editing or clearing the text (or via
  "clear all", which does both).
