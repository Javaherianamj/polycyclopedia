# FE-8 `learn-surface` — L3 «شبکه» / GRAPH, build and test

**Unit**: FE-8, the third of the four Learn concepts `lab-concepts-spec.md`
designed (L1 SCALE / L2 MAP / L3 GRAPH / L4 NOTEBOOK). This document covers
GRAPH only. SCALE's own record is `build-and-test.md` /
`build-and-test-restructure.md`; MAP's is `build-and-test-map.md`; NOTEBOOK
will get its own from the next agent.

**Why this shipped now**: same standing owner instruction MAP's record
already quotes — *"i want those four parts!!!"* — and this is the one the
owner specifically named an existing taste for: *"the owner named
Obsidian-style graph views and Wikidata as things they enjoy (round-1
Q16)"* (lab-concepts-spec.md, L3's own "why this one"). SCALE and MAP are
built; this is step 3 of 4.

---

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/lib/learn/causal-graph.ts` (+ `.test.ts`, 24 tests) | Pure causal-graph model: node keys, hand-placed layout coordinates (normalised, direction-agnostic), the `computeTrend`/`computeOutcomes` propagation relations, `downstreamOf` reachability for the pulse, and the `measuredPointFor`/`provenanceMark` bridge into the live catalogue. No React, no DOM, no i18n. |
| `web/src/islands/GraphIsland.tsx` | The one island: SVG diagram (edges, derived nodes, outcome nodes, cause tracks), three HTML `<button role="slider">` puck overlays (drag + keyboard), the live reading panel, the outcomes strip, and the accessible `<details>` relations list. |
| `web/src/components/learn/LearnGraph.astro` | Page shell (hero + concept nav + the island) — same shape as `LearnMap.astro`. |
| `web/src/components/learn/LearnConceptNav.astro` | GRAPH's entry flipped from `href: null` to `/{locale}/learn/graph`; NOTEBOOK stays inert for the next agent. |
| `web/src/pages/{fa,en}/learn/graph.astro` | The two locale routes. |
| `web/src/styles/learn-graph.css` | New stylesheet, imported by `global.css` right after `learn-map.css`. |
| `web/src/i18n/{fa,en}.json` | 62 new `learn.graph.*` keys, both locales, verified in sync (452/452, set-equal not just count-equal). |

Ported **from** `design/fe-0/lab/graph.html` + `graph.css` + `graph.js` (read,
not edited) — ~90% of the class names, the shape grammar (rect-track =
draggable cause, circle = read-only derived, hexagon = terminal outcome),
and the quadratic-bezier edge/pulse mechanics carry straight across. No new
dependency, no graph/force library — hand-rolled SVG, as the spec requires
("~12 nodes, hand-placed rather than randomly simulated").

`causal-graph.ts`'s own header records three deliberate departures from the
prototype, each forced by generalising from one hardcoded material (LDPE) to
the live 17-material catalogue — summarised in §3 below.

## 2. Route decision (stated, per the build brief)

**A separate route, `/{locale}/learn/graph`, sibling to `/{locale}/learn`
(SCALE) and `/{locale}/learn/map` (MAP)** — the exact seam
`LearnMap.astro`'s own header laid out for this agent: "one Astro page per
file, nested directory coexisting with the top-level file, no new routing
pattern invented." `LearnConceptNav.astro`'s `graph` entry now has a real
`href`; verified live that it renders as an `<a>` on `/learn` (SCALE),
`/learn/map` (MAP) and `/learn/graph` itself, in both locales, while
`notebook` still renders as an inert `<span>` with the "coming soon" tag —
never a live link to a route that would 404.

## 3. Three departures from the FE-0 prototype, and why

1. **No `mfi` node.** The prototype's causal graph had six derived nodes
   (crystallinity, MFI, density, Tm, modulus, tensile) because MFI was the
   mechanism linking molecular weight to the film/injection outcomes. The
   spec's own L3 section lists exactly five derived properties —
   "crystallinity, density, Tm, modulus, tensile" — and does not mention
   MFI. Rather than silently add a sixth node the spec never named (and
   push the node count past its stated "~12"), Mw's edges reach the
   film/injection outcomes directly. This is not a physics downgrade: a
   high-Mw melt genuinely IS more viscous by itself — MFI is the standard
   *instrument* for measuring that viscosity, not a separate cause — so
   removing the intermediate node loses a unit label, not a causal step.
   Final graph: **11 nodes** (3 causes + 5 derived + 3 outcomes), 10 edges.
2. **Trend values are unitless 0–100% fractions, never fabricated physical
   numbers.** The prototype interpolated its illustrative formulas between
   the REAL min/max property bounds it found in `data.js` for its one
   hardcoded material. That was defensible for a single-material mock —
   every bound belonged to the one polymer on the page. This build points
   GRAPH at *any* catalogue material (`?material=hdpe` opens on HDPE, a
   picker covers the no-param case), so there is no longer one fixed real
   band an arbitrary material's illustrative interpolation could honestly
   borrow. Presenting, say, a fabricated "108 °C" trend reading on a
   PMMA-bound graph (PMMA has no true crystalline Tm) would be exactly the
   "plausible-looking number with no basis" R5 exists to prevent — the same
   category of error the spec's own tacticity correction records. So
   `computeTrend` returns dimensionless 0–1 fractions; the SVG and panel
   render them as a bare `%`, with no unit. The MEASURED value — this
   material's actual property row, real units, real provenance mark — is a
   completely separate fact read via `measuredPointFor`, shown in its own
   row, never merged into the trend number (build brief: "Do not blur those
   two into one number").
3. **Home/End keyboard support**, on top of the prototype's Up/Down-only
   pucks — R30's explicit ask, not something FE-0 had.

## 4. The measured/illustrative split — verified against real data

Checked what the live API actually holds for HDPE and PA6 before designing
this (per the build brief's own instruction), rather than guessing:

- **HDPE** (`?material=hdpe`): `crystallinity` 70–90 (uncited), `density`
  0.975 g/cm³ (**cited**), `tm` 133–138 °C (**cited**), `young_modulus`
  0.5–1.5 GPa (uncited), `tensile_strength` 25–40 MPa (uncited) — a good mix
  of sourced/unsourced states to exercise the provenance mark. Verified live:
  each derived node's "Measured" row shows the real value with the correct
  §/? mark, completely independent of that same node's "Illustrative trend"
  row and its own bare percentage.
- **PA6** (`?material=pa6`): zero property groups on the live API (matches
  the build brief's "10 of 17 materials have zero property values" — PA6 is
  one of them). Verified live: all five derived nodes show `learn.graph.
  measuredMissing` ("PA6 has no row for this property on the datasheet")
  with the dashed `×` "no datasheet row" mark — never a fabricated number —
  while every node's illustrative trend keeps working normally (the trend is
  a property of the CAUSES, not of the bound material, so it has no reason
  to go blank just because this material's datasheet is empty).
- **No `?material=`**: the picker defaults to unselected, `learn.graph.
  noSelectionNote` explains that every derived node is trend-only without a
  real material bound, and every "Measured" cell reads `learn.graph.
  measuredNoMaterial` ("No material selected") rather than an empty gap.

The provenance mark itself deliberately mirrors the FE-0 prototype's
three-way sourced/unsourced/nodata read (a small circular §/?/× badge, both
in the SVG node and the panel row) rather than the plain "(uncited)" text
suffix the OTHER Learn islands (BranchingSimulator, CrystallinityDensity)
use — the spec asks specifically for "its provenance mark exactly as on the
datasheet," and the datasheet's own `ValueAtom` mark already distinguishes
"no value at all" from "a value with no citation"; losing that third state
here would be a regression from what the datasheet shows for the same fact.

## 5. RTL / flow-direction decision (stated, per the build brief)

**The diagram mirrors per locale** — unlike MAP's modulus-temperature axis
(forced `dir="ltr"` always, because that specific chart type has one
universal reading convention every engineer already knows), a causal
graph's left/right arrangement has no such convention. It is a narrative
device — "causes first, outcomes last" — the same framing the FE-0
prototype's own header used ("the same direction the reader's eye already
moves in"). So in `/fa/learn/graph` the three causes sit on the RIGHT
(reading-first, matching the FE-0 prototype's own layout exactly) and the
outcomes on the left; in `/en/learn/graph` the whole layout flips so causes
are reading-first on the LEFT. `causal-graph.ts` keeps every coordinate in
direction-agnostic "reading order" (`col` 0 = read first, 3 = read last);
`GraphIsland.tsx`'s `xForCol` is the only place that decides which physical
side that is, so the two locales share one coordinate table rather than
needing two.

Verified live: fa's three puck buttons render at `left: 92%` (near the
right edge); en's render at `left: 8%` (near the left edge) — for the exact
same `causeState`, on the exact same node layout.

## 6. Accessibility (R30)

- **Every cause is a real `<button role="slider">`**, not an SVG shape —
  same reasoning as MAP's marker (44px CSS pointer target is trivial on an
  HTML element, fragile on an SVG shape under a responsive viewBox; native
  focus/`:focus-visible` is simpler to get right). Verified: all three
  puck buttons are 44×44px.
- **Dragging is never the only way to operate this.** Each puck accepts
  `ArrowUp`/`ArrowDown` (±5%) and `Home`/`End` (jump to 0%/100%) —
  Home/End is new versus the FE-0 prototype (§3). Verified live by
  dispatching real `KeyboardEvent`s at each of the three focused puck
  buttons: `ArrowUp` → +5, two `ArrowDown` → back to start, `End` → 100,
  `Home` → 0, for all three causes.
- **An accessible parallel representation**, per R30's own suggested
  wording ("consider ... a described list of the causal relations"): a
  native `<details><summary>` — no ARIA needed, keyboard-operable by
  default, collapsed so sighted readers pay nothing for it — listing all
  ten edges as plain sentences ("More Branching → less Crystallinity", …).
  The SVG itself carries `role="img"` with one summary `aria-label`
  (screen readers do not need to enumerate individual `<text>` nodes one at
  a time); the full causal structure lives in the `<details>` list instead.
  Verified live: opened the `<details>`, read all 10 generated sentences —
  correct direction, correct node names, both locales.

## 7. Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (155 files) |
| `vitest run` | **372/372** passed (348 baseline + 24 new in `causal-graph.test.ts`) |
| i18n key parity | 452 keys, fa === en (set-equal, not just count-equal) |
| Console errors | none, on a fresh tab, either locale, either empty-state (a handful of `setPointerCapture: NotFoundError` messages seen mid-session came from this run's own synthetic-`PointerEvent` drag tests reusing pointer IDs with no genuine active pointer session — a known limitation of dispatching fully synthetic pointer events, not a bug in the shipped code; reproduced and confirmed absent on a fresh tab with no synthetic dispatch) |
| No horizontal overflow | 320×900, 375×900, 768×1000 (fa, RTL) — `scrollWidth === clientWidth` at all three |
| Dark theme | `data-theme="dark"` → `.graph-panel` background `rgb(47,51,87)` (exactly `--panel` #2f3357, the lab dark token), puck `::before` border `rgb(255,193,153)` (exactly `--act` #ffc199) — confirms token-driven, no hardcoded hex |
| Geometry sanity | 11 `.gnode` groups rendered (5 derived + 3 outcome + 3 cause, matching the model exactly), zero `NaN` in any SVG coordinate/path/points attribute |

### Driven verification (real DOM events, not just static reads)

Per this surface's own constraint (the Browser pane cannot screenshot-verify
reliably here), every interactive claim above was driven with real dispatched
`PointerEvent`/`KeyboardEvent` objects and confirmed via
`getAttribute`/`getBoundingClientRect`/`getComputedStyle`/`textContent`
reads, not assumed from source:

1. **HDPE** (`?material=hdpe`) — bound correctly from the URL param; a full
   real pointer sequence (`pointerdown`→`pointermove`→`pointerup`) on the
   branching puck moved it from 55% to 100% and correctly dropped
   crystallinity's trend from 56% to 31% (and density's identically, per
   its direct 1:1 formula); the edge pulse animation fired and completed
   (observed the dot's `cx`/`cy` moving along the quadratic path, then
   settling to `opacity: 0`). Keyboard `Home`/`End`/Arrow verified on all
   three pucks independently (see §6); `Home` on branching with cooling
   also at 0 produced crystallinity = 100% exactly (`1 - 0.55·0 - 0.35·0`),
   `End` produced 45% exactly (`1 - 0.55·1 - 0.35·0`) — the formula in
   `causal-graph.ts` and the rendered DOM agree to the percentage point.
2. **PA6** (`?material=pa6`, zero property values) — honest "no datasheet
   row" mark on all five derived nodes, no fabricated numbers, trend still
   fully functional (see §4).
3. **No param** — honest "no selection" note on both the field and every
   measured cell (see §4).
4. **Both locales** (`/fa/learn/graph`, `/en/learn/graph`) — content,
   labels, mirrored layout (see §5) and the relations list (see §6) all
   correctly translated; concept nav present and correct on SCALE, MAP and
   GRAPH itself.

## 8. Judgement calls made without stopping to ask

- **The causal model stays universal across families, not gated to
  semicrystalline polymers.** Considered scoping the whole tool to
  `polyolefins`/other semicrystalline families the way `family-scope.ts`
  gates tacticity — an amorphous polymer (PMMA, PS, ABS, epoxy) doesn't
  truly "have" a crystallinity axis. Decided against a family gate: the
  build brief's own verification steps ask for PA6 (semicrystalline nylon,
  zero data) to show an *honest empty state*, not to be hidden entirely —
  confirming the intended failure mode is per-NODE honesty (§4), not
  whole-tool suppression. A family gate would also have needed a second,
  separate causal model for amorphous polymers to be worth building, which
  the spec does not ask for. Mitigated instead by keeping every trend value
  unitless (§3.2) and by the closing note's explicit "not a validated
  model" framing applying to every material equally, not just crystallinity.
- **Two mutually-exclusive outcome thresholds for film/injection**
  (`mw >= 0.5` / `mw < 0.5`), rather than three independent thresholds —
  chosen because a single melt-viscosity axis genuinely cannot favour both
  a high-melt-strength blown-film process and a low-viscosity fast-fill
  injection process at once; the exclusivity is a real physical fact, not
  an artifact of the cutoff picked. Verified in `causal-graph.test.ts`
  ("film and injection are never both suited... never both unsuited
  either").
- **The provenance mark is the FE-0 three-way badge, not the other Learn
  islands' two-way text suffix** — see §4's last paragraph for the full
  reasoning.
- **Pulse animation stays imperative** (direct `ref`-based `setAttribute`
  in a `requestAnimationFrame` loop, ported near-verbatim from `graph.js`'s
  own `pulse()`), not React state — a 60fps loop re-rendering the whole
  island on every frame would be wasted work when only a few circle
  attributes actually change; matches `MapIsland.tsx`'s own imperative drag
  math for the same reason.
- **Small mid-verification layout fix**: the branching cause's label
  initially clipped ~6px above the SVG's own top edge (caught via
  `getBoundingClientRect()`, not by eye) — `CAUSE_LAYOUT`'s track-top
  margins were tightened (0.04→0.07 etc.) to give the label room; re-verified
  live that all three cause nodes now sit fully inside the SVG bounds.

## 9. What was NOT touched

`web/src/lib/learn/family-scope.ts` was read (per the build brief's explicit
instruction) but not modified or re-derived — GRAPH's causes are branching,
cooling rate and Mw, never tacticity, so the family-scope question that
module answers never arises here. `web/src/lib/learn/fetch-learn-materials.ts`
was read and reused as-is — every field GRAPH needed (`crystallinity`,
`density`, `thermal.tm`, `youngModulus`, `tensileStrength`) already existed
from MAP's own extension of it; no second fetcher was written, and the
fetcher itself was not extended further. `web/src/components/learn/
LearnMap.astro`, `web/src/islands/MapIsland.tsx`, and every SCALE file were
not modified.
