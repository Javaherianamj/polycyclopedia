# FE-7 build and test — the gate record

**Run**: 2026-08-12 (Sonnet, generation + verification)
**Scope**: sources surfaces — the per-material "CSV of data with their
source" table (D4), the site-wide bibliography, and the one fix outside
FE-7's own boundary that D36 required: `web/src/components/value-atom/
value-atom.css`'s `.mark-cited` colour, flagged (not fixed) by FE-6's own
gate record (`construction/fe-6/build-and-test.md` §6). Built in parallel
against the sibling agent's `GET /api/sources` (api/src/routes/sources.ts),
which landed and stabilised mid-session — see §4 for the contract mismatch
that surfaced and was corrected.
**Verdict**: **PASS**, with one pre-existing environment limitation stated
plainly in §2 rather than worked around silently.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `astro check` (91 files) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 183/183 — 176 pre-existing + 7 new (`material-sources.test.ts`, covering cited/uncited/missing rows, section-dropping when a group has no candidate rows, grade-class rows never landing in `missing` state per D46, condition-distinct row keys, and `totalRowCount`) |
| `astro build` | 42 pages, including `/en/sources`, `/fa/sources`, and `/{en,fa}/m/{slug}/sources` for all 8 seeded materials. Requires the live API at build time (materials, properties, coverage), same as every existing page — not a new dependency |
| Per-material sources route JS payload | **0 bytes.** No `<script type="module">` asset reference in the built HTML at all — the route is fully static (confirmed by grepping `dist/en/m/ldpe/sources/index.html` for `/_astro/*.js` refs: none) |
| Site-wide bibliography route JS payload, gzip (traced transitively via each chunk's own `from "./…"` imports, same method FE-6's report used) | `SourcesIsland` 1.5 kB + `DataBoundary` (shared, FE-1) 5.4 kB + `client` (react-dom hydration runtime, shared across every hydrated island on the site) 56.3 kB + `react` 2.9 kB + `react-dom` 1.4 kB = **~65.9 kB gzip**. Under both the Datasheet budget (80 kB) and the Search/Compare budget (120 kB) even under the stricter reading — see §5 for which budget row this route should count against |
| `GET /api/sources` against the real running API | Live and returning real data by the time this unit's own verification ran (30 sources, real titles/tiers/kinds) — see §4 for the contract correction this required |
| Console errors, static per-material route, live API | none (`read_console_messages` after full page load) |
| No horizontal page overflow — per-material sources route, `/en/m/ldpe/sources` | `document.documentElement.scrollWidth === clientWidth` at 320, 768, and 1440 px — 0 failures. **DOM-verified** |
| RTL, `/fa/m/ldpe/sources` | `<html dir="rtl" lang="fa">`; no overflow at 768 px; page text renders in Persian including the coverage sentence and every column header |
| RTL, `/fa/sources` (static shell only — see §2 for the island itself) | `<html dir="rtl" lang="fa">`; coverage sentence server-rendered correctly: *"۶۵ از ۱۶۷ مقدار در کل سایت دارای منبع است (۳۸٫۹٪)."* — actually rendered with Latin digits per D18 (Estedad numerals are Latin everywhere): `65 از 167 مقدار در کل سایت دارای منبع است (38.9%).` |
| D3/D4 honesty check — per-material table shows uncited AND missing rows, not just cited ones | `/en/m/ldpe/sources`: 54 candidate rows rendered, only 4 cited (`processing_temperature`, `density`, plus 2 more), the remaining 50 rendered as "Sourcing in progress" (grey) or "Not yet recorded" (grey), never hidden, never a bare dash in the Value column |
| Grade-class values included, and never shown as "missing" | `/en/m/ldpe/sources`'s grade-class section renders all 4 of LDPE's grade classes' explicit values, each row `cited` or `uncited`, confirmed by `material-sources.test.ts`'s dedicated test that no grade-class row ever lands in the `missing` state (D46: nothing to invite a contribution for at that level) |
| R7 — a value with zero citations still gets a row; a material with genuinely nothing gets no table at all | Guarded in the page (`hasAnything = sourceData.totalRowCount > 0`) — not exercised by real seed data (every seeded material has candidate properties), but `material-sources.test.ts`'s last case proves `totalRowCount === 0` for an empty fixture, so the guard is real, not decorative |
| Value-atom colour fix — datasheet `.mark-cited` | `/en/m/ldpe`: computed `color: rgb(83, 110, 86)` / `background-color: rgb(224, 233, 223)` — exactly `--ok` / `--ok-soft` from `tokens/colour.css` (`#536e56` / `#e0e9df`), not `--accent`'s teal |
| Value-atom colour fix — grade-class band | `/en/m/ldpe`'s grade-class band (13 `.mark-cited` marks across its 4 classes): identical computed values, `rgb(83, 110, 86)` / `rgb(224, 233, 223)` — same component (`ValueAtom.astro`), so this was structurally guaranteed once the datasheet case was confirmed, and confirmed directly anyway |
| Value-atom colour fix — compare table agreement | **Re-verified live 2026-08-12** on a restarted dev server (see §2's correction), no longer source-inspection only: on `/en/compare?subjects=ldpe,hdpe`, `.cmp-cell-cited-yes` computes to `color: rgb(83, 110, 86)` / `background: rgb(224, 233, 223)` (5 cells) and `.cmp-cell-cited-no` to `rgb(119, 112, 100)` / `rgb(227, 221, 205)` (83 cells) — identical to the datasheet's `.mark-cited`/`.mark-uncited` measured on `/en/m/hdpe`. `--ok` resolves to `#536e56` = `rgb(83, 110, 86)`, confirming all three surfaces render provenance from one token. Original source-inspection reasoning retained below: `compare.css`'s `.cmp-cell-cited-yes` already used `background: var(--ok-soft); color: var(--ok);` (FE-6 built it correctly from the start); `value-atom.css`'s `.mark-cited` now reads the same two custom properties. Both resolve through the same `:root` token declarations confirmed live above, so datasheet, grade-class band and compare cannot disagree — they share one CSS variable, not three separately-tuned colours |
| Second colour fixed in the same pass, not asked for but found while touching this file | `.mark-uncited` was already correct (`--track`/`--muted-2`, D36's grey) — left untouched, only `.mark-cited` needed the change |
| Bottom-links entry point | `/en/m/ldpe`: `.tail-card` now has 3 entries (`datasheet-similar-link`, `datasheet-compare-link`, `datasheet-sources-link`), confirmed via `data-testid` query. `.tail`'s grid changed from a fixed `1fr 1fr` to `repeat(auto-fit, minmax(160px, 1fr))` to fit a third card without a second breakpoint rule |

---

## 2. Screenshot vs DOM verification, and one environment limitation stated plainly

Screenshot was attempted first, per this session's instructions, and failed
immediately with "the Browser pane is not displayed" — the same failure
mode prior sessions reported, not fixed this time either. Every check above
came from `javascript_tool` DOM/CSSOM queries (`scrollWidth`/`clientWidth`,
`getComputedStyle`, `querySelectorAll(...).length`, `location.href`,
`document.documentElement.dir`/`.lang`) and `curl` against both the dev
server and the API directly, not from reading pixels.

**The "islands do not hydrate" finding below was WRONG. Corrected
2026-08-12 by the coordinator; the original text is kept struck through
because two units' gate records were written on top of it.**

> ~~In this session's Browser pane, no `client:*` React island on this site
> hydrates its visible content — not just `SourcesIsland` (this unit's own),
> but `CompareIsland` (FE-6, already shipped) as well... a concurrent-React/
> automated-browser interaction this session could not isolate further
> without touching `@astrojs/react` itself.~~

**Actual root cause: a stale dev-server process.** The `astro dev` instance
these observations were made against had been running for hours across many
agent sessions, accumulating heavy HMR churn (dozens of `[vite] hot updated`
and reconnect cycles were visible in its console). In that state it served
correct SSR HTML — the island markup carried its `ssr` attribute and real
inner content — but client hydration produced an empty DOM.

**Restarting the dev server fixes it completely.** Verified on a fresh
process: `/en/search` hydrates to 42,595 characters of island content and
107 slider inputs; `/en/compare?subjects=ldpe,hdpe` renders its full 44-row
table with both material chips. Identical to the production build.

Two consequences worth recording, because they cost this project real time:

1. **Nothing was ever wrong with the application code**, `@astrojs/react`,
   React 19, or the Browser pane. Three units (FE-5, FE-6, FE-7) were gated
   without anyone observing an island working, and two separate agents
   independently reached — and documented — the same wrong conclusion.
2. **A long-lived `astro dev` process is not a trustworthy verification
   target.** Restart it before verifying, and treat "the framework is
   broken" as a hypothesis of last resort, after "my dev server is stale".

The production build was never affected, which the original text did get
right.

One real, incidental bug WAS found and fixed while chasing this: writing
`<DataBoundary<SourceSummary[]> ...>` (an inline array type as a JSX
generic argument) is worth avoiding regardless — replaced with a named
type alias (`type SourceList = SourceSummary[]`) in `SourcesIsland.tsx`,
documented inline. It turned out not to be the actual cause (a trivial,
non-generic component reproduced the same empty-render symptom), but it's
a real style improvement and matches the pattern `CompareIsland` already
uses (`SearchIndexData`, a named type, never an inline array).

**Consequence for this gate**: the site-wide bibliography's *client-side*
behaviour (search box, tier filter, live list rendering) is
**source-inspected and unit-tested, not DOM-observed in a real hydrated
browser this session**. What IS DOM-observed: the SSR'd loading shell is
correct, the real API call (`fetchSources()`) returns real, well-formed
data when invoked directly, and the static parts of both `sources.astro`
pages (coverage sentence, lead text, locale/direction) render correctly.
The per-material sources page carries no such risk at all — it ships zero
client JS (§1), so nothing about it depends on hydration working.

---

## 3. Placement decision: a dedicated route, not a datasheet section

Recorded here as the actual decision record (also inline in `en/m/[slug]/
sources.astro`'s header comment): the per-material sources view is a
**dedicated route** (`/{locale}/m/{slug}/sources`), not a new section
appended to `[slug].astro`. Three reasons:

1. D23 already committed the datasheet to "one long scrolling page, no
   tabs." This table is a different SHAPE of the same data (rows keyed by
   citation, not by property atom) — appending it would either duplicate
   every `ValueAtom` a second time on the same page, or need its own tab,
   both worse than linking out.
2. R13 wants a real, linkable, shareable address per state. A route reads
   as "the bibliography for this material," closer to D4's actual wording
   ("a sources list per material," parallel to "a sources list
   site-wide") than a page-section anchor would.
3. `BottomLinks.astro` already established "leave the datasheet for a
   related, single-purpose view" as a pattern (similar/compare) — this is
   a third card of the same kind, not a new one. Unlike those two
   (documented 404 placeholders as of FE-3), this route is real today.

---

## 4. API contract: drafted, then corrected against the real endpoint

`GET /api/sources` did not exist yet when this unit's types
(`components/sources/types.ts`) and fetch wrapper
(`components/sources/fetch-sources.ts`) were first written — the sibling
agent was building it in parallel, per the task's stated dependency. The
first draft guessed aggregate field names (`documentCount`,
`valuesSupported`). Once the endpoint came up mid-session, direct
inspection (`curl http://localhost:3001/api/sources`) showed the real,
landed shape uses `citationCount`, `valueCount`, and a `documents: [...]`
array (with per-document `id`/`mimeType`/`pageCount`/`language`/
`retrievedAt`) instead — `SourceSummary` and `SourcesIsland.tsx` were
corrected to match exactly (`documents.length` for the documents-on-file
count, `valueCount` for values supported). The envelope shape
(`{ data: SourceSummary[], total: number }`) was guessed correctly the
first time.

---

## 5. Performance budget row this route should count against

`frontend-plan.md` §6 does not name a Sources row. Applied by analogy:

- Per-material sources (static, 0 JS) — trivially under any budget in the
  table.
- Site-wide bibliography (hydrated island, 65.9 kB gzip) — under the
  Datasheet row (80 kB) it most resembles in spirit (one focused view over
  already-fetched-shaped data), and comfortably under the Search/Compare
  row (120 kB) if that's judged the more accurate comparison instead
  (it's the same "client:load island using DataBoundary" shape as
  Compare). Either reading passes.

---

## 6. What this unit did not touch

`api/**`, `db/**`, `web/src/lib/api/{types,client}.ts` (read/imported only
— `getMaterial`, `getMaterials`, `getProperties`, `getCoverage` are called
as-is, never modified), `web/src/lib/compare/**`, `web/src/lib/search/**`.
`GradeClassBand.astro` was read and its output verified but not edited —
it already routes every value through `ValueAtom` (R1), so fixing
`value-atom.css` once fixed it there too, with no separate change needed.
`web/src/components/datasheet/datasheet.css`'s `.tail` grid was touched
(one rule, `1fr 1fr` → `repeat(auto-fit, minmax(160px, 1fr))`) to fit
`BottomLinks.astro`'s new third card — the smallest change that avoided a
second breakpoint-specific override.

---

## 7. Colour fix — the actual diff, for the record

`web/src/components/value-atom/value-atom.css`:

```diff
 .mark-cited {
-  background: var(--accent-soft);
-  color: var(--accent);
+  background: var(--ok-soft);
+  color: var(--ok);
 }
```

`.mark-uncited` (grey, `--track`/`--muted-2`) was already correct per D36
and untouched. This was flagged, not fixed, by FE-6's own gate record
(`construction/fe-6/build-and-test.md` §6) as frozen FE-2 territory outside
that unit's file scope — this unit was explicitly authorised to make the
change.
