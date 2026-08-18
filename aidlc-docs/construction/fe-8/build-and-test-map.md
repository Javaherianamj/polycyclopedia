# FE-8 `learn-surface` — L2 «نقشه» / MAP, build and test

**Unit**: FE-8, the second of the four Learn concepts `lab-concepts-spec.md`
designed (L1 SCALE / L2 MAP / L3 GRAPH / L4 NOTEBOOK). This document covers
MAP only. SCALE's own record is `build-and-test.md` /
`build-and-test-restructure.md`; GRAPH and NOTEBOOK will each get their own.

**Why this shipped now, reversing D52**: D52 (2026-08-03) deferred MAP with
the stated reason "it is a per-material view and wants more than two
materials to be worth its space" — at the time the database held 2 curated
materials. It now holds 17. The owner has also since said, verbatim: *"we
had a early draft on learning phase had 4 parts! a map, and two others and
fourth one was this one you are showing as the learning interface. i want
those four parts!!!"* — naming the map first. D52's stated condition lapsed
and the owner has explicitly asked for the part it was blocking.

---

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/lib/learn/modulus-curve.ts` (+ `.test.ts`, 15 tests) | Pure curve model: builds the schematic log(E)-vs-T control-point curve from a material's real `ThermalThresholds`, optionally anchored by a real Young's modulus. Reuses `thermal.ts`'s `classifyPhase`/`isAmorphous`/`sliderRange` rather than re-deriving them. |
| `web/src/lib/learn/map-tray.ts` (+ `.test.ts`, 8 tests) | Pure "which tool belongs to which thermal region" table — the tray's active/dim gating logic, physics not presentation. |
| `web/src/lib/learn/fetch-learn-materials.ts` (extended) | Six new independently-nullable fields (`youngModulus`, `tensileStrength`, `elongationAtBreak`, `izodImpact`, `mfi`, `processTemp`) on `LearnMaterial`, same `numericPoint()`/`cited` pattern as the existing `density`/`crystallinity` fields. No second fetcher was written — the build brief was explicit about that. |
| `web/src/islands/MapIsland.tsx` | The one island: SVG plot, HTML marker button (drag + keyboard), readout, region-gated tray, off-curve section. |
| `web/src/components/learn/LearnMap.astro` | Page shell (hero + concept nav + the island). |
| `web/src/components/learn/LearnConceptNav.astro` | Shared four-part switcher (SCALE / MAP / GRAPH / NOTEBOOK), used by both `LearnMap.astro` and `LearnScale.astro`. |
| `web/src/pages/{fa,en}/learn/map.astro` | The two locale routes. |
| `web/src/styles/learn-map.css`, `learn-nav.css` | New stylesheets, imported by `global.css`. |
| `web/src/i18n/{fa,en}.json` | 65 new `learn.map.*`/`learn.nav.*` keys, both locales, verified in sync (390/390). |

Ported **from** `design/fe-0/lab/map.html` + `map.css` + `map.js` (read, not
edited) — the FE-0 prototype's exact concept and visual language, rebuilt
against this app's real API, tokens, i18n and island conventions instead of
the prototype's hardcoded single LDPE example.

## 2. Route decision (stated, per the build brief)

**A separate route, `/{locale}/learn/map`, sibling to `/{locale}/learn`
(SCALE)** — the same file-plus-nested-directory pattern this codebase
already uses for `m/[slug].astro` + `m/[slug]/sources.astro`. Not a station
inside SCALE's zoom: SCALE organises by length scale (D50), MAP organises by
temperature, and forcing MAP's plot into one of SCALE's six fixed-height
scroll-stations would compress it into a box sized for a molecule diagram.

**The seam for GRAPH/NOTEBOOK**: `LearnConceptNav.astro` already lists all
four parts. GRAPH and NOTEBOOK render today as inert, dashed, "coming soon"
entries (never a live link to a route that 404s — same grammar
`ScaleStation.astro` already uses for a known-but-unbuilt gap). The next two
agents should each add `/{locale}/learn/graph` and `/{locale}/learn/notebook`
following this exact pattern — one route, one `Learn{Concept}.astro`, one
`<LearnConceptNav current="...">` — and flip that entry's `href` from `null`
to the real route in `LearnConceptNav.astro`'s `items` array. Nothing else
about the integration should change.

## 3. The modulus-honesty problem, and how it was handled

The database has real Tg/Tm/degradation-onset for some materials and often a
real Young's modulus, but **no measured modulus-vs-temperature curve for any
material** — that curve does not exist as data anywhere in this project.

- **Landmarks are always real.** Tg, Tm and Td come straight from
  `LearnMaterial.thermal` (the same object `StateSimulatorIsland` already
  builds), carrying the same `cited`/uncited provenance marks the rest of
  Learn uses. The readout's landmarks line
  (`data-testid="map-landmarks"`) prints exactly these, with `(uncited)`
  appended per-value where `cited` is false — verified live for HDPE: `Tg:
  -120 °C (uncited) · Tm: 133 - 138 °C · Td: 350 - 450 °C (uncited)`.
- **The curve's shape between landmarks is explicitly labelled schematic.**
  `learn.map.shapeNote` is always visible under the readout: *"The curve's
  exact shape and slope between these points is illustrative, not measured —
  only the transition temperatures themselves ... are real."*
- **The curve's absolute height is honest about whether it is anchored.**
  When a material has a real `young_modulus`, `modulus-curve.ts` uses it to
  pin whichever schematic plateau room temperature (25°C) actually falls on
  (via `classifyPhase(25, thresholds)`), and derives every other plateau from
  that one real number using the spec's own qualitative rules ("one decade
  through Tg", "three-plus decades through Tm") — never a second invented
  absolute number. `learn.map.anchoredNote` names the real value used; when
  no `young_modulus` exists, `learn.map.unanchoredNote` says the entire
  height, not just the shape, is illustrative. Verified: HDPE (semicrystalline,
  Tg below room temp) anchors on the crystalline plateau at 1.00 GPa (its
  real `young_modulus` midpoint); PMMA (amorphous, Tg above room temp)
  anchors the GLASSY plateau directly at 3.10 GPa (its real value) — the
  anchor logic correctly detects which regime 25°C falls into per material
  rather than assuming one fixed answer.
- **No default/illustrative material.** Unlike `StateSimulatorIsland` (which
  has a textbook-plausible unattributed fallback), MAP never draws a curve
  without a real, selected material — `learn.map.noSelectionNote` covers the
  "nothing picked yet" state honestly rather than falling back to invented
  numbers.
- **Amorphous materials never get an invented Tm.** `isAmorphous()` (reused
  from `thermal.ts`) gates both the SVG's `Tm` reference line/label and the
  "semicrystalline plateau" region entirely off when `tm` is `null` — no
  plateau band is drawn, no plateau label is shown, and the curve goes
  straight from the glassy plateau into one wide schematic transition to
  flow. Verified live with PMMA (`Tg: 110 - 120 °C · Td: 220 °C` — no `Tm` in
  the landmarks line, no plateau label, no plateau-region tray chips ever
  reachable).
- **The empty case is handled as the common case, not an edge case.** A
  material with no `tg` on record at all (10 of 17 have zero property
  values) renders `learn.map.noThermalTitle`/`Body` — naming the material,
  explaining precisely why no point of the curve can be drawn — instead of
  a curve. Verified live with PS (zero property values): no plot, no
  readout, no tray; only the honest empty-state text and the always-present
  off-curve section. The material `<select>` groups materials into two
  `<optgroup>`s (with Tg / without) so this is discoverable before picking,
  not just after.
- **One bug found and fixed during verification**: the "arrived from a
  datasheet" bound-note originally rendered unconditionally on `selected`,
  independent of whether a curve could actually be drawn — so visiting
  `?material=ps` showed *"this map is drawn from Polystyrene's real
  data"* directly above an empty state saying no data exists, which is a
  direct self-contradiction. Fixed by gating that note on `thresholds` (not
  just `selected`) — see `MapIsland.tsx`'s comment at that branch for the
  full account.

## 4. The tray / off-curve split

The tray (`ALL_MAP_TOOLS`, `map-tray.ts`) renders **seven chips, always, in
fixed order** — `izodImpact`, `crystallinityDensity`, `branchingSimulator`,
`tensileElongation`, `mfi`, `processTemp`, `burnNote` — and only ever toggles
`is-active`/`is-dim` on them; none is removed from the DOM as the marker
moves. `.mchip.is-dim` is opacity-only (`learn-map.css`), never
`display:none`. Verified live by driving the marker through all four HDPE
regions: glass → only `izodImpact` active (others dimmed); rubber/plateau →
the three plateau tools active; melt → `mfi`+`processTemp` active; burn →
only `burnNote` active — 7 total chips present at every step, only the
active count changed.

Chips whose backing property is missing for the current material render
`is-locked` (dashed border, ⊘ prefix, real per-value reason) rather than a
fabricated number — verified with PMMA's `izodImpact` chip (no izod value on
record for PMMA): *"This value is not yet on record for Poly(methyl
methacrylate)."* `crystallinityDensity`/`branchingSimulator` are navigation
links into SCALE's own already-built tools rather than a second "locked"
layer, since those tools already render their own honest empty state.

A separate, always-visible **off-curve section** (`learn.map.offcurveTitle`)
holds the four genuinely non-temperature-dependent tools — Hansen solubility,
DP calculator, chain coil, tacticity simulator — each linking into
`/{locale}/learn?material={slug}#{tool-id}` so the material context carries
across surfaces. The spec's own words, reused verbatim in copy: *"do not
force them onto the curve. Being honest about what does not fit is part of
the design."*

## 5. RTL / axis-direction decision (stated, per the build brief)

**The plot itself is forced `dir="ltr"`, unconditionally, regardless of page
locale** — the SVG, its axis, its numeric labels, and the HTML marker-button
overlay all sit inside one `dir="ltr"` frame (`.map-plot-frame`). Temperature
increasing left-to-right and modulus increasing upward is the universal
convention this exact chart type is read in by every polymer engineer, in
either language; mirroring it for Persian would make the chart **wrong**, not
merely relocalised — the same principle R6 already applies to bare numerals,
one level up. This matches the precedent `StateSimulatorIsland`'s
`.state-sim-slider-wrap` already set. Everything surrounding the plot (hero,
material picker, readout prose, tray) stays fully logical-property/RTL-aware.
Verified: `/fa/learn/map` has `<html dir="rtl">` and `.map-plot-frame[dir=
"ltr"]` simultaneously, with 0 horizontal overflow at 320px in that
configuration.

## 6. Accessibility (R30)

The marker is a real `<button role="slider">`, not an SVG shape with a
hand-rolled hit box — chosen specifically because a fixed 44px CSS pointer
target is trivial to guarantee on an HTML element and would NOT be reliable
on a shape scaled by a responsive SVG viewBox (a circle sized to look right
at 900px does not stay 44px at 320px). Verified: `getBoundingClientRect()` on
the marker button returns exactly `{width: 44, height: 44}` at both 1280px
and 320px viewports.

Keyboard: `ArrowRight`/`ArrowLeft` move ±5°C, `Shift+ArrowRight/Left` move
±25°C, `Home`/`End` jump to the axis extremes. `aria-valuemin`/`-valuemax`/
`-valuenow`/`-valuetext` update on every change; `aria-label` names the
control. Verified live by dispatching real `KeyboardEvent`s at the focused
button (see §7) — `Home` correctly reached `tMin` (-180 for HDPE), `End`
reached `tMax` (480), `ArrowLeft`/`Right` moved by exactly 5, `Shift+Arrow`
by exactly 25, and each move correctly re-derived the phase label, modulus
readout and tray active/dim state.

## 7. Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (149 files) |
| `vitest run` | **348/348** passed (up from the 301 baseline this unit started from — 23 new tests in `modulus-curve.test.ts`/`map-tray.test.ts`, plus 2 new + parity fixes in `fetch-learn-materials.test.ts`/`material-context.test.ts`/`spherulite-readout.test.ts`) |
| `astro build` | **84 pages** — includes the two new `/en/learn/map`, `/fa/learn/map` routes |
| i18n key parity | 390 keys, fa === en (set-equal) |
| `MapIsland` bundle | 14.5 kB raw / **4.7 kB gzipped** — second-largest Learn island behind `HansenSpaceIsland`, well inside the range the other 11 islands already sit in |
| Console errors, either locale, either empty-state | none |
| No horizontal overflow | 320×900 (fa, RTL): 320/320. 375×800 (en): 375/375. 768×1000 (en): 753/768 |
| Dark theme | `data-theme="dark"` → body `rgb(62,67,111)` (the indigo ground), `--ramp-glass` correctly resolves to the dark variant `#93aff5`, marker's `--region-c` correctly tracks the current phase's dark-mode ramp colour |

### Driven verification (real DOM events, not just static reads)

Per this surface's own constraint (the Browser pane cannot screenshot-verify
reliably here), every interactive claim above was driven with real dispatched
`PointerEvent`/`KeyboardEvent` objects and confirmed via
`getAttribute`/`getBoundingClientRect`/`getComputedStyle` reads, not assumed
from source:

1. **HDPE** (`?material=hdpe`, semicrystalline, real Tg/Tm/Td) — bound
   correctly from the URL param; keyboard `Home`/`End`/`Arrow`/`Shift+Arrow`
   all moved the marker by the exact expected amounts; all four regions
   (glass/rubber/melt/burn) produced the correct phase label, modulus value
   and tray active-set as the marker crossed each boundary; pointer drag
   (`pointerdown`→`pointermove`→`pointerup`) moved the marker to the exact
   temperature implied by the synthetic pointer's fractional position across
   the frame; clicking the plot background (not the marker) also jumped the
   marker correctly.
2. **PMMA** (`?material=pmma`, amorphous, real Tg + real Td, no Tm) — no `Tm`
   reference line/label/landmark, no plateau band, no plateau-region tray
   chips ever active; room-temperature anchor correctly landed on the GLASSY
   plateau (3.10 GPa, matching its real `young_modulus`) rather than a
   nonexistent crystalline one.
3. **PS** (`?material=ps`, zero property values) — honest named empty state,
   no plot/readout/tray, off-curve section still present and functional.
4. **No param** — honest "no selection" note, no plot.
5. Both locales (`/fa/learn/map`, `/en/learn/map`) — content, landmarks,
   region labels and tray chips all correctly translated; concept nav present
   and correctly marks the current page on both `/learn` (SCALE) and
   `/learn/map` (MAP).

## 8. Judgement calls made without stopping to ask

- **Room-temperature anchoring logic** (§3): the spec only says a real
  Young's modulus should ground the curve; it does not say which plateau to
  anchor when Tg is above vs. below room temperature. Resolved via
  `classifyPhase(25, thresholds)` — whichever schematic region actually
  contains 25°C for THIS material gets the real number, and the other
  plateau is derived from it by the spec's own stated decade rule.
- **PS substituted for PMMA as the primary "amorphous, no Tm" verification
  case.** The build brief suggested PS; PS turned out to have zero property
  values at all (confirmed via the live API before building), so it instead
  became the "no thermal data" verification case, and PMMA (real Tg,
  real Td, no Tm) covers "amorphous, does not invent a Tm."
- **Tray content is real-data stat chips and cross-links, not re-embedded
  islands.** Embedding e.g. a second `BranchingSimulatorIsland` inside MAP's
  tray would duplicate SCALE's tool rather than route to it, doubling
  hydration cost for no teaching benefit; a labelled link into
  `/learn?material=...#branching-simulator` was judged the better shape,
  consistent with "tools belong to regimes" being taught by WHERE they are
  offered, not by re-rendering them twice.
- **`process_temp` only, not the fuller grade/technique-scoped
  `mould_temp`/`injection_pressure` `material_process` data** (closed G5) —
  those are scoped per technique, which this surface has no picker for;
  `process_temp` is the one processing number that is still material-level.
- **Fixed schematic transition widths (10°C through Tg, 8°C through Tm, 90°C
  for an amorphous polymer's single wide transition)** rather than deriving
  them from each property's real min/max range — `LearnNumericPoint`
  collapses a range to one midpoint number before `modulus-curve.ts` ever
  sees it, so borrowing "precision" from an already-collapsed range would be
  false precision; the real range is shown as text next to the landmark
  instead (already surfaced via each `LearnNumericPoint.display`).

## 9. What was NOT touched

Per an explicit constraint added mid-task (a concurrent session fixing a
filter bug): `web/src/islands/SearchIsland.tsx`, `web/src/components/search/`,
`web/src/lib/search/`, `web/src/styles/search.css` — none of these files were
opened for writing at any point in this unit.
