# FE-3 build and test — the gate record

**Run**: 2026-08-05 (Sonnet, generation + verification)
**Scope**: the datasheet surface — `/{locale}/m/{slug}`, identity, coverage,
six property-group sections, processing techniques, Learn bridge, grade slot,
similar/compare entry points. Producers/trade-names/applications cut from
scope on approval (0 real rows; see the plan's scope-narrowing note).
**Verdict**: **PASS**, after fixing a real defect found in FE-2's shared
`ValueAtom` component — see §3.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `api/test/api.test.ts` (21 tests: 4 new + 17 carried) | 21/21 pass |
| `astro check` (35 files) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 24/24 — 6 new (`material-detail.test.ts`: registry-scoping diff) + 18 carried |
| `astro build` | succeeds; all 7 materials × 2 locales = 14 material pages generated, plus the 2 shell pages and the root redirect (16 total) |
| No horizontal overflow, 320/375/768, both themes | 6 pages × 3 widths × 2 themes = 36 checks, 0 failures, after the fixes in §2–3 |
| No horizontal overflow, 1024/1280/1440, both themes | 4 pages × 3 widths × 2 themes = 24 checks, 0 failures |
| Console errors | none, any page checked |
| Scroll-spy | verified live: scrolling to `#mechanical` updates the rail's active link to "خواص مکانیکی" |
| Real citation renders correctly | LDPE's process-temperature value: `Polymer Handbook · ویرایش 4th Edition · صفحه 1` — a genuine citation, not a fixture |
| Real coverage renders correctly | `4 از 54 مقدار دارای منبع (7.41%)`, independently cross-checked against `/api/coverage`'s own number for the same material in the API test |

## 2. Two real layout defects, found by testing against real content rather than a hand-picked demo — same class of bug as FE-0's gate, one level deeper

`.sec-body` and `.col` (both `display: grid`) had no explicit
`grid-template-columns`. Without one, CSS Grid creates a single implicit
column sized by the `auto` track algorithm, which grows to its content's
max-content width rather than being clamped to the container — the parent
(`.col`) measured a correct, externally-constrained 264px at 320px viewport
width, while its own child (`.sec`) measured 929px, because the CONTAINER's
outer size and its INTERNAL implicit track are sized independently. This is
the FE-0 gate's `.rail` bug (`aidlc-docs/construction/fe-0/build-and-test.md`
§3) one level removed: there, a grid item's default `min-inline-size: auto`
let it outgrow its track; here, a grid container's default implicit column
did the same to its own children. Fixed by adding
`grid-template-columns: minmax(0, 1fr)` to `.sec-body`, `.col`, and — found
while checking for the same pattern nearby — the mobile overrides for
`.main`, `.hero-main` and `.tail`, which used bare `1fr` rather than
`minmax(0, 1fr)` and so still carried `1fr`'s automatic min-width: auto.

This was masked during the FE-2 demo pages because those only ever rendered
a handful of hand-placed `ValueAtom`s directly in a page, never inside this
grid nesting — the bug needed FE-3's actual section/row structure to
surface, which is exactly why the frontend-plan calls this unit out as the
one that stress-tests the design system.

## 3. A defect in FE-2's own component, found the same way

`ValueAtom`'s `.value { white-space: nowrap; }` is correct for a numeric
display (`"0.910 - 0.925 g/cm³"`) and silently wrong for a text-type
property's display, which can be a full sentence — LDPE's `rheology_notes`
is 131 characters. `nowrap` forced it onto one unbroken 851px-wide line.
FE-2's own verification never exercised this path: its demo page used
`density` (numeric) and `appearance` (a six-word phrase, short enough by
chance not to trigger it) — never a long-form `text`-type property. Two
fixes, in `value-atom.css`/`ValueAtom.astro`:

- `.prop`'s second grid column changed from `auto` to `minmax(0, max-content)`.
  Plain `auto`'s automatic minimum is its own max-content size — the same
  §2 pattern again — which would keep the column exactly as wide as the
  unwrapped text even after wrapping was otherwise permitted, since the
  track itself was never willing to shrink.
- A new `.value-wrap` modifier class (`white-space: normal`, `flex-wrap: wrap`,
  `max-inline-size: 46ch`), applied by `ValueAtom.astro` only when
  `dataType` is `text` or `enum` — the two types `api/src/format.ts` does
  not guarantee are short. Numeric/range/boolean values are untouched.

Verified against the actual 131-character value: renders as ~5 wrapped
lines in a 420px box, not one 851px line. Both fixes are in shared
components (`value-atom.css`, `ValueAtom.astro`) — every consumer of
`ValueAtom`, not just the datasheet, gets the fix, and FE-1/FE-2's own
placeholder pages were re-verified clean after it (60 total overflow checks
across both units' pages plus FE-3's, 0 failures).

## 4. Scope cut on approval, and why it stayed cut

Producers, trade names and applications were removed from this pass — see
the plan's scope-narrowing note. `material_organization`, `trade_name` and
`material_application` are all genuinely 0 rows; the owner chose not to
build rail sections for uncurated tables. `processingTechniques`
(`material_process`) stayed in scope — not part of what was cut, and its row
count fluctuated between 0 and 9 during this session (a parallel session
appears to be actively curating it), which is itself evidence the empty
state matters: `web/src/components/datasheet/ProcessingTechniqueList.astro`
renders a real, explicit empty note rather than hiding the block, so
whichever count is true at any given moment renders correctly.

## 5. What this unit did not touch

Producers/trade-names/applications (§4), `/learn` routes (FE-8), a real
contribute page, real search or compare (FE-5/FE-6 — only the entry-point
links exist, pointing at routes that 404 today, documented in
`BottomLinks.astro`/`LearnBridge.astro`), grade data (0 real rows; R16's
inert slot is accurate, not a shortcut), `material_section_note` (0 rows,
same reasoning as FE-2's citation-coverage-at-the-time call).
