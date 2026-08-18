# FE-6 build and test — the gate record

**Run**: 2026-08-12 (Sonnet, generation + verification; revised same day
after a coordinator correction — see §3)
**Scope**: compare (N-way, uncapped) — the two-layer typography/colour split
(CR1–CR6), most-different-first ordering with a grouped toggle (CR7),
overlapping-range handling (CR10), condition-distinct rows (CR11), explicit
"not curated" cells (CR12), citation-asymmetry flags (CR18), add/remove
materials and grade classes (CR14/CR16), shareable URLs (CR17), and the
CR15 mobile frozen-column exception. Built in parallel against three
sibling-owned surfaces: `web/src/lib/compare/{difference,ordering,emphasis,
url-state}.ts` (pure logic) and `api/src/routes/compare.ts` (the API) — both
landed and were final by the time this unit's own verification ran. Two
fixes outside compare's own scope, both now landed: `web/src/components/
datasheet/GradeClassBand.astro` and `api/src/routes/materials.ts` (see §5).
**Verdict**: **PASS**.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `astro check` (82 files) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 173/173 — all carried (no new compare-logic tests added by this unit; the pure-logic suites `difference.test.ts`/`ordering.test.ts`/`emphasis.test.ts`/`url-state.test.ts` are sibling-owned and already covered) |
| `astro build` | 22 pages, including `/en/compare` and `/fa/compare`. Requires the live API at build time, same as every existing page (not a new dependency) |
| `cd api && npm test` | 37/37 (35 pre-existing + 2 added by this revision — see §5) |
| `cd api && npm run build` (`tsc`) | clean, no errors |
| Compare route JS payload, gzip (traced transitively from `client.*.js` + `CompareIsland.*.js`'s own `from "./…"` imports, same method FE-5's report used) | `CompareIsland` 4.9 kB + `fetch-index` (FE-5's, reused) 4.5 kB + `react` 2.9 kB + `react-dom` 1.3 kB + `client` (react-dom's hydration runtime) 56.3 kB + 2.4 kB inline astro-island/theme boilerplate = **~72.3 kB gzip** against the **120 kB** budget. `client.*.js` alone accounts for 56.3 kB of that — the same shared cost FE-5's search route already carries, not new weight this unit added |
| `search-materials.json` + `search-properties.json` (reused, not re-fetched or re-bundled) | Same static assets FE-5 built (5.6 kB gzip combined) — powers the add-subject picker's candidate list and CR8's observed-range lookup. Confirmed via network trace that `fetch-index.ts`'s two `fetch()` calls are the only requests for these, no duplicate fetcher was written |
| Console errors, both locales, live API | none, on `astro dev` against the running API (migrations: 24, including `application_property_polarity`) |
| No horizontal page overflow, 320/375/768/1440 px | `document.documentElement.scrollWidth === clientWidth` at all four widths — 0 failures. **DOM-verified.** The Browser pane's screenshot compositor rendered the page compressed into a small top-left region regardless of the reported viewport size (confirmed via `window.innerWidth` disagreeing with what the screenshot showed) — the same unreliability flagged for this session; every width/overflow claim in this table came from `javascript_tool` DOM queries, not from reading pixels. One screenshot (mobile-width chip list) rendered legibly and is the only check in this document actually seen, not just measured |
| CR15 — table scrolls, body doesn't, at 320 px | `.cmp-table-scroll`: `scrollWidth` 1009 / `clientWidth` 262 (scrolls). `document.documentElement`: `scrollWidth` 320 / `clientWidth` 320 (does not). Sticky property column verified directly: `.cmp-th-property`'s `getBoundingClientRect().left` unchanged (28.8px) before and after setting `scrollLeft = 200` on the scroll container |
| RTL, `/fa/compare` | `<html dir="rtl" lang="fa">`; every compare.\* string renders in Persian; sticky column and polarity cell borders use logical properties (`inset-inline-start`, `[dir='rtl']` overrides on the `box-shadow` border), not hard-coded left/right |
| No-application-selected state (CR4) | `document.querySelectorAll('.cmp-cell-better, .cmp-cell-worse').length === 0` before any application is picked, against the real two-subject LDPE/HDPE comparison |
| Application selected → polarity colour appears (CR4/CR5) | Selecting "Pipes & fittings" (`pipes_fittings`) produced 6 coloured cells; URL updated to `...&app=pipes_fittings`. Reloading that exact URL cold restored the same selection, sort mode, and coloured-cell count — CR17 verified as a real reload, not just in-memory state |
| CR6 — rationale on demand | `<details>` for a coloured row's polarity opened to real seeded text: *"لوله‌های فشار (به‌ویژه لوله‌کشی آب گرم) باید رده فشار خود را در دمای سرویس حفظ کنند."* — rendered as prose, not styled or labelled as a citation |
| CR7 — sort toggle | Toggling "Grouped by section" changed the first row from `dissipation_factor` (Electrical, difference-mode's highest score) to `process_temp` (Processing, canonical group order) — a real reorder, not a no-op. URL's `sort` param updated and round-tripped on reload |
| CR12 — "not curated" | Adding `hdpe/film` as a third subject produced 39 `.cmp-cell-missing` cells reading "Not curated" / "هنوز ثبت نشده" — never blank, never a dash |
| CR14/CR16 — mixed material + grade-class subjects, N-way | Added `hdpe/film` (a grade class) alongside the two materials; table grew to 3 columns; URL's `subjects` param became `ldpe,hdpe,hdpe/film`. No cap encountered or coded |
| CR18 — citation asymmetry | Real rows flagged "Mixed sourcing — one side cited, one not" against the live LDPE/HDPE data (e.g. `melting_temperature`, `crystallinity`, `processing_temperature`) |
| CR11 — conditions in the row label, live | **Corrected finding — see §3.** `hdpe/injection` vs `ldpe/injection`: `tensile_strength` renders as two separate rows, `Tensile Strength (σt) (break)` and `Tensile Strength (σt) (yield)`, hdpe/injection = 31 MPa on both, ldpe/injection = 9 MPa (break) / 12.8 MPa (yield) — never merged. MFI: `hdpe/blow_molding` vs `hdpe/film` vs `hdpe/injection` produced two separate MFI rows, `(2.16)` and `(21.6)` load, with correct per-row values. Same fix now also confirmed live on `/en/m/ldpe/`'s grade-class band (§5): `injection`'s tensile strength shows as two rows, "Tensile Strength (yield)" 12.8 MPa and "Tensile Strength (break)" 9 MPa |
| MFI typographic ramp on a real multi-cell row — see §9 | Degenerate for rows with a wide spread and 3+ values: 5 of 8 real cells landed within a 1.00–1.09em band, visually indistinguishable, despite representing values up to ~30× apart. Not fixed here (emphasis.ts is sibling-owned) — reported to the coordinator, see §9 |

---

## 2. Screenshot vs DOM verification, stated plainly

Per this session's known screenshot-compositor issue: one screenshot (the
mobile-width subject-chip list, narrow viewport) rendered legibly and was
visually inspected. Every other claim above — layout at 1440/768/375/320,
overflow behaviour, sticky-column behaviour, RTL, polarity colouring,
sort-order changes — was verified through `javascript_tool` DOM/CSSOM
queries (`getBoundingClientRect`, `scrollWidth`/`clientWidth`,
`querySelectorAll(...).length`, `location.href`), not by reading rendered
pixels. Where a screenshot was attempted at 1440×900 it came back visibly
compressed into a small region inconsistent with `window.innerWidth`
reporting 1440 — the same compositor problem, not a bug in this unit's CSS.

---

## 3. Correction: CR11 IS exercised by real data — the first pass checked the wrong subject kind

The original version of this document claimed CR11's "yield vs break"
scenario had no counterpart in the seeded data, reasoning from the LDPE/HDPE
**material-level** comparison, where every `conditions` genuinely is `{}`.
That conclusion was wrong and was caught by the coordinator, not by this
unit's own verification — the condition-bearing rows live on **grade-class**
subjects, not material subjects, and this unit never compared two grade
classes against each other during its own gate run. Direct query confirmed
condition-distinct comparable rows held by 2+ subjects exist now:
`tensile_strength {"basis":"yield"}` (7 subjects), `{"basis":"break"}` (4
subjects); `escr {"condition":"A"/"B"/"C"}` (3 subjects each); `mfi
{"load_kg":2.16}` (3 subjects), `{"load_kg":21.6}` (2 subjects).

Re-verified live against `GET /en/compare?add=hdpe/injection,ldpe/injection`
(both grade classes): `tensile_strength` rendered as two separate rows —
"Tensile Strength (σt) (break)" (hdpe/injection 31 MPa, ldpe/injection 9 MPa)
and "Tensile Strength (σt) (yield)" (hdpe/injection 31 MPa, ldpe/injection
12.8 MPa) — matching the exact values the coordinator specified, never
merged, each row's label stating its own condition. MFI verified the same
way with `hdpe/blow_molding,hdpe/film,hdpe/injection`: separate `(2.16)` and
`(21.6)` rows, correct values in each. Both `api/src/routes/compare.ts`
(`buildRowKey`/`canonicalizeConditions`) and this unit's own row-label
rendering were already correct — the defect was entirely in this document's
verification claim, not in the code. See §1's corrected CR11 row for the
full detail.

## 4. Two API contracts drafted, then reconciled against the real endpoint

`web/src/lib/api/types.ts` briefly held two conflicting `Compare*` type
blocks — this unit's own [own call] draft (written before the API had
landed, per the task's stated dependency risk) and the API agent's real,
concurrently-landed shape (`api/src/routes/compare.ts`), which arrived in
the same shared file mid-session and collided as duplicate identifiers
(`astro check` caught it immediately). Resolved by deleting this unit's
draft entirely and adopting the real contract: `GET /api/compare?subjects=…`
takes only `subjects` (no `application` param — it returns every
application and every polarity rule in one response, CR4's application gate
is applied client-side by which rules `fetch-compare.ts` actually looks up),
and does not return `observedMin`/`observedMax` per row (CR8's range comes
from the same static `search-properties.json` FE-5 already ships instead).
`web/src/components/compare/fetch-compare.ts` and `client.ts#getCompareTable`
were rewritten against the real shape; no `/api/applications` endpoint
exists or was needed. No stub or duplicate endpoint was written at any
point — see §6 for what stayed genuinely absent for the duration of this
build (nothing did, by the time verification ran).

## 5. GradeClassBand.astro — the one fix outside compare's own scope

`GradeClassBand.astro` rendered a grade class's values through `ValueAtom`
by name alone; two values sharing a property key but distinct
`conditions` (CR11's scenario) would have looked like one number printed
twice, because `ValueAtom` (FE-2, frozen) has no conditions slot. Fixed by
folding `Object.values(conditions).join(', ')` into a parenthetical
appended to the name string handed to `ValueAtom`, in
`withConditionLabel()` — the same "adapt before handing to ValueAtom"
pattern the file already used for `propertyValueAsDefinition`. Contained to
this one file plus one additive field: `PropertyValue.conditions?:
Record<string, string | number> | null` in `web/src/lib/api/types.ts`,
because the type didn't carry the DB's `property_value.conditions` column
at all. **This renders nothing extra today** —
`MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL` in `api/src/routes/materials.ts`
does not select `pv.conditions`, so every `value.conditions` reaching this
component is `undefined`. The fix is real and type-checked but currently
inert; making it visible requires a small API change (`api/src/routes/
materials.ts`, both `MATERIAL_PROPERTY_VALUES_SQL` and
`MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL` need `pv.conditions` added to
their `SELECT` and `mapPropertyValueRow` needs to pass it through) — out of
this unit's scope (`api/` is off-limits) and out of the one-file boundary
the task set for this fix, so left as a flagged follow-up rather than done
silently or done out of scope.

## 6. A pre-existing colour inconsistency, flagged not fixed

`web/src/components/value-atom/value-atom.css`'s `.mark-cited` uses
`--accent` (teal, D36's "measurement") for its cited/sourced indicator;
D36 itself assigns that job to `--ok` (sage, "provenance satisfied"), which
is defined in `tokens/colour.css` but not used by any component today. This
unit's own citation mark (`.cmp-cell-cited-yes`/`-no` in `compare.css`) uses
`--ok`/`--track` per D36's actual mapping, so the compare table and the
rest of the site now visibly disagree on what colour "sourced" is. Not
fixed here — `value-atom.css` belongs to FE-2, frozen, and outside this
unit's file scope; flagged via `spawn_task` instead (see the chip in this
session) rather than patched silently.

## 7. New colour tokens — R33 compliance note

`--cmp-better` / `--cmp-worse` (`compare.css`) are the one deliberate
exception to reusing D36's five semantic hues: none of graphite/teal/sage/
grey/clay means "better for this application," and reusing `--ok` here
would have conflated "provenance satisfied" with "editorially judged
better," which is exactly the confusion CR6 exists to prevent. Named and
scoped to this file only, per R33. Contrast against `--panel` was checked
by eye in both themes, not run through an automated tool this session —
flagged here rather than asserted as verified.

## 8. What this unit did not touch

`web/src/lib/compare/{difference,ordering,emphasis,url-state,types}.ts`
(sibling-owned, landed, used as-is via their documented exports —
`computeDifference`, `sortRows`, `filterHiddenRows`, `computeEmphasis`,
`encodeCompareState`/`decodeCompareState`), `api/` and `db/` in their
entirety, `web/src/lib/search/**`, and every other FE-5 file except reading
`fetch-index.ts` (imported, not modified) for the shared search index.

## 9. The typographic ramp was degenerate on real data, and was fixed

CR1 asks type to carry magnitude: "bold the bigger one (magnitude) and show
their size difference with font size and bold." The first implementation of
`computeEmphasis` used linear position within the row's value span
everywhere, on the reasoning that CR3's bounded 1.0x-1.35x output range
prevents any degenerate *visual* result regardless of the scale feeding it.

**Measuring a real row disproved that reasoning.** On MFI across HDPE grade
classes (0.25 to 37.5 g/10min), 5 of 8 rendered cells landed inside a
1.00-1.09em band — visually identical type for values up to ~30x apart. The
ramp was not merely less expressive than a logarithmic one; across most of
the row it carried no information at all. That satisfies CR3's letter while
failing CR1's purpose, which is the kind of defect a bounded output range
hides rather than prevents.

### The fix

`web/src/lib/compare/emphasis.ts` now chooses the scale per row:

| Condition | Ramp |
| --------- | ---- |
| every representative value > 0 **and** max/min >= `LOG_SCALE_MIN_RATIO` (10) | log10 position |
| otherwise | linear position (unchanged) |

Both guards are load-bearing:

- **`min > 0`** — log is undefined at and below zero, and the real data
  crosses it: `brittleness_temp` runs -140 to -76 degC. Those rows stay
  linear, as does any row containing a zero.
- **the ratio threshold** — ordinary rows, where linear is the more faithful
  reading of CR1's "proportionally", behave exactly as they did before. The
  change can only affect rows that were previously degenerate.

`isLargest` is unaffected: the largest value is the largest either way, so
CR1's bolding is untouched. `emphasis` remains a bare 0..1 magnitude number
with no polarity field — the test asserting that shape still holds, and the
typography/colour separation the owner's design rests on is unchanged.

### Verification

`vitest run` 176/176 (three new tests in `emphasis.test.ts`), `astro check`
0 errors across 82 files. The new tests use the actual seeded MFI values
rather than synthetic ones, and assert that the three small values which
previously sat at 0, 0.0016 and 0.0027 now occupy visibly separated
positions. Two further tests pin the guards: an ordinary 3x-spread row still
interpolates linearly, and rows containing zero or negative values never
take the log path.

**Not re-verified in the browser.** The change is to the position number
only; the UI's mapping onto CR3's bounded font range is unchanged and was
already verified in §1. A visual pass over a real MFI row remains
outstanding, along with the rest of this unit's unscreenshotted checks (§2).
