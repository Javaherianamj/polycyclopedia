# FE-2 build and test — the gate record

**Run**: 2026-08-05 (Sonnet, generation + verification)
**Scope**: the value atom — value display, provenance mark + citation
popover, property-explanation popover. No datasheet page, no property
registry assembly, no compare/sources/simulator integration.
**Verdict**: **PASS**.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `api/test/api.test.ts` (new citation-join test + full suite) | New test passes; 2 pre-existing failures confirmed unrelated (see §2) |
| `astro check` (22 files) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 18/18 — 7 new (`logic.test.ts`: provenance derivation, multi-citation, conflicting role, locator formatting) + 11 carried from FE-1 |
| `astro build` | succeeds against the live API; both locale trees produced |
| `npm run format:check` | clean |
| No horizontal overflow at 320/375/768 (R27), both locales, both themes | 0 of 12 measurements exceed 1px |
| Console errors, both locales | none |
| Popover open/close, real browser | native `popovertarget` click works; anchor-positioned popover engages at ≥640px with correct collision-avoidance flip when the trigger is near the viewport edge; full-width bottom sheet confirmed at 375px |
| Rendered against real data | `/fa/` and `/en/`, all three provenance states, live against LDPE — see §3 |

## 2. The two pre-existing API test failures are not from this unit

`GET /api/properties -- 55 definitions` (now 61) and `GET /api/coverage --
reports 0% for both materials` (now 3 rows, a third material `lldpe` exists)
were confirmed failing identically on `git stash` — unmodified tree, before
any FE-2 change. Data/test drift from earlier work, not something this unit
touched or should fix in passing.

## 3. Proven against real data, per R9 — and what that ruled out

`/fa/index.astro` and `/en/index.astro` fetch `getMaterial('ldpe')` and
`getProperties()` at build time and render three real rows:

| Property | Real state | Why it was picked |
| --- | --- | --- |
| `density` | uncited, numeric | Present, real value, the majority case (0% coverage — see below) |
| `appearance` | uncited, text | Present, mixed Persian/Latin display (`نیمه‌شفاف (Translucent)`) — proves the LTR-wrapping decision doesn't force direction on naturally mixed prose |
| `izod_impact` | missing | Genuinely absent for LDPE, found by diffing `/api/properties` against the material's own `propertyGroups` — not asserted, checked |

**Citation coverage is genuinely 0%** (`SELECT count(*) FROM evidence` → 0)
— confirmed by query, not assumed from the README. There is no real "cited"
row anywhere in the database to demonstrate live. Fabricating one on a page
that claims to render real data would contradict R9 and the project's stated
no-fabrication stance, so the cited-state rendering (multiple citations, a
`conflicting`-role flag, work/edition/page formatting) is proven in
`logic.test.ts` against clearly-labelled fixture data instead, not on the
live page.

## 4. A prerequisite fix, planned and executed: the API couldn't satisfy R11

Flagged and approved before generation (see the plan). `materials.ts`'s
citation query joined only `evidence` + `citation`, never reaching
`source_document`/`source` — the API could not supply "work" or "edition,"
only "page," against R11's explicit three-field requirement. Fixed with a
two-table join and two new response fields (`sourceTitle`, `sourceEdition`),
no migration. Tested against a real inserted-and-cleaned-up fixture
(`api/test/api.test.ts`), not a mock, matching the API package's own stated
testing discipline ("the value of this code is almost entirely in whether
the SQL is right").

## 5. Design decisions worth restating for FE-3 onward

- **Provenance is `citations.length > 0`, not `value_status`.** The editorial
  workflow enum (draft/in_review/published/unsourced) has no reader-facing
  meaning anywhere in the rules; `v_citation_coverage` already defines
  citedness the same way this component does. A future unit introducing a
  reader-facing use for `value_status` should treat that as a new decision,
  not an extension of what's here.
- **The four states aren't literally shared** between build time and client
  time, same as FE-1's states — `ValueAtom.astro`'s popovers and a future
  React-island version (if a simulator ever needs one) would share
  `value-atom.css`'s classnames, not a component file.
- **Popovers are native (Popover API), not hand-managed**, per the FE-0 gate
  record's explicit instruction. A native `[popover]`, once shown, is
  promoted to the top layer and is **not** inside its DOM parent's containing
  block — the FE-0 gate's "make the row `position: relative`" fix (used
  repeatedly there) does not transfer to a real Popover-API element for
  exactly this reason. Worth knowing before reaching for that fix again.
- **CSS anchor positioning is enhancement, not the baseline.** Full-width
  bottom sheet is what every browser gets by default; anchor positioning
  (`@supports (anchor-name: --a)`, ≥640px) upgrades to a small
  trigger-adjacent popover only where supported. No JS positioning fallback
  was written for "anchor unsupported + desktop width" — that combination
  gets the sheet, which is a defensible degraded experience, not broken one.
- **`anchor-name`/`position-anchor` are inline styles, generated per
  instance** (`crypto.randomUUID()`-derived), because a CSS custom-ident
  can't be generated from a shared class the way scoped styling can. This is
  the one place in this unit inline styles are the right tool, not a smell.

## 6. What this unit did not touch

No datasheet page (FE-3), no `/api/properties`-vs-material diff logic beyond
the one hand-picked example proving `ValueAtom` handles `value: null`
correctly (the general-purpose version of that diff is FE-3's job), no
compare surface, no sources list, no simulator integration, no font/token
changes beyond FE-1's existing set.

## 7. Addendum (2026-08-05, later same day) — §3's "0% coverage" no longer holds

A parallel session landed substantial database/API work after this gate ran:
evidence polymorphism (0020), an editorial/observation value model
(0017–0018), property scoping (`appliesToFields`/`appliesToFamilies`), and
real citations — `SELECT count(*) FROM evidence` is now 114, not 0, and
`density` on the live `/fa/` and `/en/` pages now renders **cited**, for
real. §3's account of why the cited state could only be proven via fixtures
was accurate when written; it no longer is, and the page comments have been
corrected. Nothing about the component's code changed — the cited-state
rendering was already correct and is now additionally confirmed against a
real citation (`Handbook of Industrial Polyethylene and Technology`, p. 577)
rather than only against `logic.test.ts`'s fixtures. Also reconciled:
`web/src/lib/api/types.ts` had `PropertyGroup.uiTab` and
`MaterialStructure.unitCell`, both removed from the API by the same parallel
work (G10, G8) — dropped from the types; `astro check` and the full test
suite were re-run clean afterward. `PropertyDefinition` gained
`appliesToFields`/`appliesToFamilies`, which FE-3 will need for the
missing-vs-not-applicable distinction (see that unit's plan).
