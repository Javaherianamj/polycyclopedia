# FE-3b build and test — the gate record

**Run**: 2026-08-12 (Sonnet, generation + verification)
**Scope**: grade-class surfacing — API expansion (`gradeClasses` on
`GET /api/materials/:slug`) plus an inline-expandable band at the bottom of
the datasheet (`GradeClassBand.astro`), per the owner's confirmation-prompt
decision (inline expand, not dedicated per-class routes, not a top
selector).
**Verdict**: **PASS**.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `api/test/api.test.ts` (25 tests: 3 new for grade classes + 22 carried) | 25/25 pass |
| `astro check` (65 files — up from FE-3's 63; two new files landed from a concurrent FE-5 session in the same window) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 120/120 — 9 new in `material-detail.test.ts` (`propertyValueAsDefinition`, `gradeClassValueCounts`) + 111 carried (includes FE-5's own new suites, unaffected by this unit) |
| `astro build` | succeeds; all 7 materials × 2 locales = 14 material pages generated, plus catalog/search/home/sitemap (20 total) |
| Real cited values render in the built output | see §2 — verified against the actual `dist/` HTML, not a mock |
| No grade-class band for materials with 0 grade classes | see §2 — verified for all 4 (pet, pp, ps, pvc) in both locales |
| Console errors | none, on any page loaded live (LDPE fa/en, HDPE fa/en, PET fa) |
| No horizontal page overflow, 375px and 1280px | `document.body.scrollWidth` measured equal to `document.documentElement.clientWidth` at both widths — see §3 |

## 2. Verification method, and why it leans on the build output rather than screenshots

The Browser pane in this session exhibited two problems independent of this
unit's code, confirmed not to be real product defects before being worked
around:

1. **A stale-compositor screenshot artifact.** Screenshots taken through
   the `computer` tool sometimes showed a citation popover as visually
   open even immediately after a fresh navigation. Checked directly:
   `document.querySelectorAll('[popover]:popover-open').length` returned
   `0` on the same page at the same moment the screenshot showed one
   "open" — i.e. no popover was actually open in the DOM; the screenshot
   was compositing a stale frame. This reproduced identically on `pet`
   (untouched by this unit), so it predates and is unrelated to
   `GradeClassBand`.
2. **Wheel-scroll gestures occasionally triggered browser back-navigation**
   inside the pane (large `scroll_amount` values landed on a different
   route than the one being tested). Worked around by driving the page
   with `scrollIntoView()`/`click()` via `javascript_tool` instead of
   simulated wheel scrolling, which was reliable throughout.

Given that, verification for this gate leaned on three independent,
higher-fidelity sources instead of trusting screenshots alone:

- **Live DOM queries** (`javascript_tool`) against the running dev server
  (`localhost:4321`, API on `localhost:3001` against the real, populated
  local Docker Postgres on port 55432 — confirmed via `GET /health` ->
  `"migrations": 23` before testing; the Neon `DATABASE_URL` some `.env`
  files reference is a separate, empty database and was not used).
- **The actual static build output** (`web/dist/**/index.html`) — the
  literal HTML a real visitor's browser receives, grepped directly.
- **`get_page_text`**, which reads the live accessibility text content
  independent of visual compositing.

Live-DOM findings, LDPE (`/fa/m/ldpe`, `/en/m/ldpe` — 4 grade classes:
`blow_molding`, `film`, `injection`, `thermoforming`) and HDPE
(`/en/m/hdpe` — 5 grade classes: `blow_molding`, `film`, `injection`,
`rotational_molding`, `thermoforming`):

- `document.querySelectorAll('.grade-row').length` = 4 (ldpe) / 5 (hdpe).
- Each `<details>` starts closed (`hasAttribute('open') === false`);
  clicking its `<summary>` sets `open` and reveals that class's real
  values — e.g. clicking `ldpe`'s `injection` row revealed `چگالی` (density)
  `0.923 g/cm³`, marked cited (`§`), popover text `Encyclopedia of Polymer
  Science and Technology, Vol. 2 · صفحه 477 · جدول 9` — matching the
  database row exactly (verified independently against
  `docker exec polypedia-pg psql` before implementation).
- HDPE/en row summaries read: `Blow Molding | 20 of 20 values sourced`,
  `Film | 17 of 17`, `Injection Molding | 21 of 21`, `Rotational Molding |
  5 of 5`, `Thermoforming | 1 of 1` — every grade-class value in the
  seeded dataset is cited (§4 explains why).
- `pet` (`/fa/m/pet`): `document.querySelector('.grade-band')` is `null`.
  No band, no empty shell — confirmed for `pet`/`pp`/`ps`/`pvc` in the
  static build too (§ below).

Static-build findings (`web/dist/`, from a real `astro build` run against
the live API):

```
$ grep -o 'کلاس‌های گرید' dist/fa/m/ldpe/index.html      -> present
$ grep -o 'Grade classes' dist/en/m/hdpe/index.html       -> present
$ grep -c 'class="grade-row"' dist/fa/m/ldpe/index.html   -> 4
$ grep -c 'class="grade-row"' dist/en/m/hdpe/index.html   -> 5
$ grep -c 'grade-band' dist/fa/m/pet/index.html           -> 0
$ grep -c 'grade-band' dist/en/m/pet/index.html           -> 0
$ grep -c 'grade-band' dist/fa/m/{pp,ps,pvc}/index.html   -> 0, 0, 0
$ grep -o '0.923 g/cm³' dist/fa/m/ldpe/index.html         -> present (ldpe/injection density)
```

Within the grade-band region of `ldpe`'s built HTML specifically:
`mark-cited` (the sage "§ Sourced" provenance mark) appears **13** times,
`mark-uncited` **0** times — matching the 13 real, all-cited grade-class
values LDPE carries (§4).

## 3. Overflow check (R27)

`document.body.scrollWidth` vs. `document.documentElement.clientWidth`,
measured live via `javascript_tool` with every `.grade-row` forced open
(worst case — all four classes' full content rendered at once, not just
the default-collapsed state):

| Width | `clientWidth` | `body.scrollWidth` | Page-level overflow |
| --- | --- | --- | --- |
| 375px (mobile) | 375 | 375 | none |
| 1280px (desktop) | 1265–1280 | 1265–1280 | none |

One `<ul>` (`.rail`'s mobile chip bar) has `scrollWidth` 721 at 375px —
this is `.rail ul`'s pre-existing, intentional `overflow-x: auto` (FE-0's
gate-tested sticky nav, ported into FE-3, unmodified by this unit), a
scoped horizontal scroller inside its own bounded box, not a page-level
overflow. `document.body.scrollWidth` staying at exactly the viewport
width confirms it does not leak.

## 4. A data-shape fact worth recording, not a defect

Every one of the 100 grade-class property values in the seeded database is
`status = 'published'`, `value_role = 'editorial'`, and carries direct
evidence — so every row summary in the band reads `N of N sourced`, and
`mark-uncited` never appears inside the band today. This is real, not
simulated: the API query filters to `value_role = 'editorial'` only (the
same filter `MATERIAL_PROPERTY_VALUES_SQL` already applies at the material
level), which is why the 4 rows with `value_role = 'observation'`,
`status = 'unsourced'` seen directly in the database
(`property_value.subject_type = 'grade_class'`) never reach the API
response at all — they are the un-editorialized raw observations behind
some of the 100 published values, not a fifth citedness state to render.
The uncited-mark CSS path (`.mark-uncited`) is exercised elsewhere on the
same page (material-level values, e.g. LDPE's own `mfi`), so it is proven
to work — grade classes simply do not exhibit it in the current dataset.

## 5. What this unit did not touch

`GradeSelectorSlot.astro` (the `grade`-table slot, still 0 rows, still
correctly inert — a different future concept from `grade_class`, per the
plan's §4). Per-class routing or a top-of-page selector — ruled out by the
owner's decision, not attempted. `material_process` rows scoped to a grade
class — the query and rendering path exist and are wired in, but 0 such
rows exist in the seeded data today (checked directly), so
`ProcessingTechniqueList` never actually renders non-empty content inside
the band yet; this mirrors FE-3's own note about the material-level
processing section at the time of its gate.
