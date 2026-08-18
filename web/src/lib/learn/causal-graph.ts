// L3 — «شبکه» / GRAPH (lab-concepts-spec.md). Pure causal-graph model: no
// React, no fetch, no i18n — mirrors thermal.ts/modulus-curve.ts's split so
// the propagation relations (the part a reader will trust most on this
// page) are unit-testable without a DOM. GraphIsland.tsx only turns these
// numbers into pixels and DOM events.
//
// PORTED FROM `design/fe-0/lab/graph.js`, NOT COPIED VERBATIM — three
// deliberate departures from the prototype, each forced by this app's own
// build brief rather than a stylistic preference:
//
// 1. NO `mfi` NODE. The FE-0 prototype had six derived nodes (crystallinity,
//    MFI, density, Tm, modulus, tensile) because MFI was the mechanism that
//    linked molecular weight to the film/injection outcomes. This build's
//    spec (lab-concepts-spec.md, "L3 — «شبکه» / GRAPH") lists exactly five
//    derived properties — "crystallinity, density, Tm, modulus, tensile" —
//    and does not mention MFI. Rather than silently add a sixth node the
//    spec never named (node count is meant to stay "~12", legible), Mw's
//    edges to the film/injection outcomes are drawn DIRECTLY. This is not a
//    physics downgrade: Mw genuinely IS the direct lever on melt viscosity
//    that MFI would otherwise stand in for (a high-Mw melt is inherently
//    more viscous — MFI is just the standard instrument for measuring that
//    viscosity, not a separate cause), so removing the intermediate node
//    loses a unit label, not a causal step.
//
// 2. TREND VALUES ARE UNITLESS FRACTIONS, NOT FABRICATED PHYSICAL NUMBERS.
//    The FE-0 prototype interpolated its illustrative formulas between the
//    REAL min/max property bounds it found in `data.js` for its one
//    hardcoded material (LDPE) — e.g. density's schematic trend was scaled
//    into LDPE's real 0.910–0.925 g/cm³ band. That was defensible for a
//    single-material mock: every bound belonged to the one polymer on the
//    page. This build generalises GRAPH to ANY material in the catalogue
//    (build brief: "`?material=hdpe` must open the graph on HDPE ... provide
//    a picker when no param") — there is no longer one fixed real band to
//    anchor an arbitrary material's illustrative interpolation to.
//    Presenting, say, a fabricated "108 °C" trend reading on a PMMA-bound
//    graph (PMMA has no true crystalline Tm at all) would be exactly the
//    "plausible-looking number with no basis" R5 exists to prevent — the
//    same category of error the spec's own tacticity correction records.
//    So `computeTrend` below returns dimensionless 0–1 fractions ("this
//    property's illustrative position on its own schematic scale"), never a
//    unit-bearing number. The MEASURED value — this material's actual
//    property row, real units, real provenance mark — is a completely
//    separate fact, read via `measuredPointFor` from the live catalogue, and
//    the island renders the two as visually distinct rows. Never merged
//    into one figure (build brief: "Do not blur those two into one number").
//
// 3. KEYBOARD Home/End. The FE-0 prototype only bound ArrowUp/ArrowDown to
//    each cause's puck. This build's R30 explicitly asks for Home/End too
//    (jump to a track's extremes) — CAUSE_STEP/clamp01 here are shaped so
//    the island's keydown handler can implement both with the same helpers.

import type { LearnMaterial, LearnNumericPoint } from './fetch-learn-materials';

// --------------------------------------------------------------- node keys

export type CauseKey = 'branching' | 'cooling' | 'mw';
export type DerivedKey = 'cryst' | 'density' | 'tm' | 'modulus' | 'tensile';
export type OutcomeKey = 'film' | 'inj' | 'cable';
export type GraphNodeKey = CauseKey | DerivedKey | OutcomeKey;

export const CAUSE_KEYS: readonly CauseKey[] = ['branching', 'cooling', 'mw'];
export const DERIVED_KEYS: readonly DerivedKey[] = ['cryst', 'density', 'tm', 'modulus', 'tensile'];
export const OUTCOME_KEYS: readonly OutcomeKey[] = ['film', 'inj', 'cable'];

export type CauseState = Record<CauseKey, number>;
export type TrendState = Record<DerivedKey, number>;
export type OutcomeState = Record<OutcomeKey, boolean>;

/** Every cause slider lives on the same normalised [0, 1] track — 0 = the
 * "low" end printed on the track, 1 = the "high" end. Kept abstract (not
 * "branching count" or "°C/min") on purpose: none of the three causes has a
 * single canonical unit a reader would recognise on sight (branching is
 * usually reported as branches/1000 C, cooling rate in °C/min, Mw in
 * kg/mol), and inventing round numbers for all three would itself read as
 * more precision than this illustrative model has. */
export const CAUSE_STEP = 0.05;

/** Starting position for all three sliders — a "typical branched,
 * moderately-cooled, mid-Mw" starting point, chosen only so the graph opens
 * on a mid-range, not-all-zero-or-one state that has visible room to move in
 * both directions. Not read from any material; every material opens on the
 * same default (the causes are illustrative regardless of which material's
 * measured nodes are showing alongside them). */
export const CAUSE_DEFAULTS: CauseState = { branching: 0.55, cooling: 0.4, mw: 0.5 };

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ----------------------------------------------------------- causal model
//
// Every coefficient below is a teaching decision, not a citation — same
// posture graph.js's header already declared, restated here per-formula so
// nobody mistakes a slope for a measurement (R5/R7 constraint 7 & 8: "never
// invent a citation, a source, or a number presented as measured").

/**
 * Crystallinity's illustrative position on its own 0–1 scale.
 *
 * Branching disrupts the regular chain packing crystallites need to form —
 * a long side-branch is a defect a growing lamella cannot fold around, so
 * more branching means less crystallinity. This is textbook polymer physics
 * (it is precisely why HDPE — almost unbranched — crystallises far more
 * than LDPE, which is heavily branched) and is the one relation this whole
 * page exists to teach.
 *
 * Faster cooling gives chains less time to find their lowest-energy folded
 * arrangement before the melt locks up — quenched samples are measurably
 * less crystalline than slow-cooled ones of the same resin. Weighted less
 * than branching (0.35 vs 0.55) because, for a fixed resin, chain
 * architecture is the dominant lever industrially; cooling rate is the
 * secondary one a process engineer tunes on top of it.
 *
 * clamp01 rather than a formula that can hit exactly 0 or 1: crystallinity
 * in real semicrystalline resins never fully vanishes just from branching or
 * quench rate, and never reaches "perfectly ordered" either — the clamp is
 * a floor/ceiling, not a claim that either extreme is achievable.
 */
function crystTrend(state: CauseState): number {
  return clamp01(1 - 0.55 * state.branching - 0.35 * state.cooling);
}

/**
 * `computeTrend`: every derived node's illustrative fraction, driven purely
 * by the three cause sliders. Called on every drag/keypress — cheap, no
 * memoisation needed (five multiplications and a clamp each).
 */
export function computeTrend(state: CauseState): TrendState {
  const cryst = crystTrend(state);
  return {
    cryst,
    // Bulk density rises with crystalline fraction: crystallites pack chains
    // tighter than the amorphous regions between them, so a resin with more
    // crystalline volume is measurably denser. Direct 1:1 reading of cryst —
    // no separate mechanism of its own.
    density: cryst,
    // A lower crystalline fraction is associated with thinner, less perfect
    // lamellae, which melt at a lower apparent Tm than thick, well-ordered
    // ones (Hoffman–Weeks-style reasoning, simplified to a single-parameter
    // reading here — the real relationship is not linear, but the SIGN is
    // correct and that is what this page teaches). Direct 1:1 reading of
    // cryst, same as density.
    tm: cryst,
    // Modulus (stiffness) rises with crystallinity — crystallites act as
    // rigid, load-bearing regions and effective physical crosslinks between
    // amorphous chains — and rises mildly with Mw via more chain
    // entanglement. Weighted 0.7/0.3: crystallinity is the dominant lever
    // for stiffness in a semicrystalline resin, Mw a secondary one.
    modulus: clamp01(0.7 * cryst + 0.3 * state.mw),
    // Tensile strength benefits from BOTH crystallinity (load-bearing
    // crystallites resist necking) and Mw (more entanglement resists chain
    // pull-out and scission under load) at roughly comparable weight —
    // unlike modulus, tensile strength is not dominated by either factor
    // alone in the literature this page is summarising.
    tensile: clamp01(0.55 * cryst + 0.45 * state.mw),
  };
}

/**
 * Outcome suitability, read off the trend fractions and the raw Mw slider.
 * Booleans, not scores — matches the FE-0 prototype's own "suited / out of
 * range" framing, which this file keeps because it is the honest thing to
 * say about a two-bucket illustrative rule of thumb: a suitability SCORE
 * would imply a precision ("62% suited") this model does not have.
 *
 * `mw >= 0.5` / `mw < 0.5` are deliberately complementary (never both true,
 * never both false) — a single melt-viscosity axis genuinely can't favour
 * both a high-melt-strength blown-film process AND a low-viscosity,
 * fast-fill injection process at the same time; that mutual exclusivity is
 * real, not a coincidence of the threshold picked.
 */
export function computeOutcomes(trend: TrendState, state: CauseState): OutcomeState {
  return {
    // Higher Mw → higher melt viscosity → more melt strength to resist
    // sagging/tearing as a blown film bubble is drawn down — the classic
    // reason high-Mw grades are chosen for film.
    film: state.mw >= 0.5,
    // Lower Mw → lower melt viscosity → faster, more complete mould filling
    // before the melt front freezes — the classic reason injection grades
    // skew toward lower Mw than film grades of the same resin.
    inj: state.mw < 0.5,
    // Lower density (more amorphous fraction, per the density trend above)
    // means a more flexible, more easily-bent jacket — cable insulation
    // needs to survive repeated flexing without cracking, which is why the
    // lowest-density polyethylene grades (not the stiffest, most crystalline
    // ones) are the ones actually used for it.
    cable: trend.density < 0.5,
  };
}

// -------------------------------------------------------------- the edges

export interface GraphEdge {
  from: GraphNodeKey;
  to: GraphNodeKey;
  /** +1 = "more of `from` means more of `to`"; -1 = the inverse. This is the
   * ↑/↓ label drawn on the edge — see this file's header for why it is the
   * one thing on this page NOT flagged illustrative: R5's target is
   * fabricated MAGNITUDES, not the DIRECTION of a well-established causal
   * relationship, and every sign below is standard polymer-science teaching
   * (see each formula's comment above for the citation-free but
   * textbook-standard reasoning). */
  sign: 1 | -1;
}

export const EDGES: readonly GraphEdge[] = [
  { from: 'branching', to: 'cryst', sign: -1 },
  { from: 'cooling', to: 'cryst', sign: -1 },
  { from: 'cryst', to: 'density', sign: 1 },
  { from: 'cryst', to: 'tm', sign: 1 },
  { from: 'cryst', to: 'modulus', sign: 1 },
  { from: 'cryst', to: 'tensile', sign: 1 },
  { from: 'mw', to: 'tensile', sign: 1 },
  { from: 'mw', to: 'film', sign: 1 },
  { from: 'mw', to: 'inj', sign: -1 },
  { from: 'density', to: 'cable', sign: -1 },
];

/**
 * Every node reachable from `key` by following edges forward — used to
 * decide which edges get the pulse animation when a cause is dragged.
 * Breadth-first over a small, fixed, acyclic graph (11 nodes, 10 edges) —
 * no need for anything smarter.
 */
export function downstreamOf(key: GraphNodeKey): Set<GraphNodeKey> {
  const seen = new Set<GraphNodeKey>([key]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of EDGES) {
      if (seen.has(e.from) && !seen.has(e.to)) {
        seen.add(e.to);
        grew = true;
      }
    }
  }
  seen.delete(key);
  return seen;
}

// ------------------------------------------------------------------ layout
//
// Hand-placed, not force-simulated — the spec's own words ("~12 nodes,
// hand-placed rather than randomly simulated so it is legible and stable").
// Coordinates are normalised fractions of a notional [0,1] × [0,1] box, in
// READING-ORDER terms (col 0 = read first, col 1 = read last), not physical
// left/right — GraphIsland.tsx maps `col` to an actual x pixel depending on
// locale, mirroring for RTL. See that file's header for the full RTL
// decision; keeping direction out of this module is what lets the same
// layout serve both locales without a second coordinate set.

export interface CauseLayout {
  /** Reading-order column, 0–3 (see module header). */
  col: number;
  /** Fraction of the track's usable vertical band where the "low" end sits
   * (closer to 1, i.e. lower on the page) and the "high" end (closer to 0).
   * `trackTop`/`trackBottom` bound the puck's drag range within the shared
   * [0,1] vertical box. */
  trackTop: number;
  trackBottom: number;
}

export interface NodeLayout {
  col: number;
  /** Fixed vertical position, fraction of [0,1]. */
  y: number;
}

export const CAUSE_LAYOUT: Record<CauseKey, CauseLayout> = {
  // trackTop starts at 0.07, not right at the viewBox edge — the cause name
  // label sits ABOVE the track top (see GraphIsland.tsx's cause label y
  // offset), and a smaller margin here left that label's ascent clipping
  // past the SVG's own top edge at narrow widths (caught while verifying
  // in-browser: the branching node's bounding box read y=-6px relative to
  // the SVG top).
  branching: { col: 0, trackTop: 0.07, trackBottom: 0.3 },
  cooling: { col: 0, trackTop: 0.38, trackBottom: 0.61 },
  mw: { col: 0, trackTop: 0.69, trackBottom: 0.92 },
};

export const DERIVED_LAYOUT: Record<DerivedKey, NodeLayout> = {
  // crystallinity sits in its own middle column — every other derived node
  // reads FROM it, so it is drawn as the hub between the causes and the
  // rest of the derived layer, exactly like the FE-0 prototype's layout.
  cryst: { col: 1, y: 0.5 },
  density: { col: 2, y: 0.12 },
  tm: { col: 2, y: 0.38 },
  modulus: { col: 2, y: 0.64 },
  tensile: { col: 2, y: 0.9 },
};

export const OUTCOME_LAYOUT: Record<OutcomeKey, NodeLayout> = {
  film: { col: 3, y: 0.18 },
  inj: { col: 3, y: 0.5 },
  cable: { col: 3, y: 0.82 },
};

/** Puck's y position on its track for a given slider value, same [0,1]
 * fraction space as the layout tables above — GraphIsland.tsx multiplies by
 * the SVG's actual pixel height. Higher `value` sits HIGHER on the page
 * (closer to `trackTop`), matching a physical "push the lever up" mental
 * model regardless of reading direction. */
export function causePuckY(key: CauseKey, value: number): number {
  const { trackTop, trackBottom } = CAUSE_LAYOUT[key];
  return trackBottom - clamp01(value) * (trackBottom - trackTop);
}

/** Inverse of `causePuckY` — converts a pointer's fractional y (already
 * clamped to the track by the caller) back to a [0,1] slider value. */
export function causeValueFromY(key: CauseKey, yFraction: number): number {
  const { trackTop, trackBottom } = CAUSE_LAYOUT[key];
  if (trackBottom === trackTop) return 0;
  return clamp01((trackBottom - yFraction) / (trackBottom - trackTop));
}

function isCauseKey(key: GraphNodeKey): key is CauseKey {
  return key === 'branching' || key === 'cooling' || key === 'mw';
}

function isDerivedKey(key: GraphNodeKey): key is DerivedKey {
  return key === 'cryst' || key === 'density' || key === 'tm' || key === 'modulus' || key === 'tensile';
}

/**
 * Node position lookup by key, in the same normalised {col, y} space — used
 * to compute edge paths, which run between ANY two node kinds. Causes are
 * the one kind whose `y` is not fixed (the whole point is that it moves as
 * the reader drags it), so this needs the live `causeState` to place them;
 * derived/outcome nodes ignore that argument and always return their fixed
 * hand-placed position.
 */
export function nodePoint(key: GraphNodeKey, causeState: CauseState): NodeLayout {
  if (isCauseKey(key)) {
    return { col: CAUSE_LAYOUT[key].col, y: causePuckY(key, causeState[key]) };
  }
  if (isDerivedKey(key)) return DERIVED_LAYOUT[key];
  return OUTCOME_LAYOUT[key as OutcomeKey];
}

// --------------------------------------------------------- measured points
//
// The OTHER half of the "measured vs illustrative" split (see module
// header, departure 2): a derived node's REAL value for whichever material
// is currently bound, straight from the live catalogue, completely
// independent of the trend formulas above. `null` covers both "this
// material has no row for this property" and "no material is bound at
// all" — the island distinguishes those two cases itself (it knows whether
// a material is selected; this function only knows about one, if given).

/**
 * Maps a derived node key to the `LearnMaterial` field that carries its real
 * measured value. A thin lookup, but worth its own function (rather than a
 * switch inlined in the island) so causal-graph.test.ts can assert the
 * mapping directly without mounting React.
 */
export function measuredPointFor(material: LearnMaterial | null, key: DerivedKey): LearnNumericPoint | null {
  if (!material) return null;
  switch (key) {
    case 'cryst':
      return material.crystallinity;
    case 'density':
      return material.density;
    case 'tm':
      return material.thermal?.tm ?? null;
    case 'modulus':
      return material.youngModulus;
    case 'tensile':
      return material.tensileStrength;
  }
}

/** Unit label for a derived node's MEASURED value — never applied to the
 * trend fraction, which is deliberately unitless (module header, departure
 * 2). Plain symbols, not translated: °C/g·cm⁻³/GPa/MPa/% read identically in
 * both locales' numeral runs, the same convention `fmtModulus` and the
 * datasheet's own `display` strings already use. */
export const DERIVED_UNIT: Record<DerivedKey, string> = {
  cryst: '%',
  density: 'g/cm³',
  tm: '°C',
  modulus: 'GPa',
  tensile: 'MPa',
};

/**
 * Provenance state for a derived node's SVG mark badge, deliberately mirrors
 * the FE-0 prototype's three-way sourced/unsourced/nodata read (not the
 * two-way cited/uncited text suffix the OTHER Learn islands use) because the
 * spec asks specifically for "its provenance mark exactly as on the
 * datasheet" and the datasheet's own mark badge (ValueAtom) already
 * distinguishes "no value at all" from "a value with no citation" — losing
 * that third state here would be a regression from what the datasheet shows
 * for the exact same fact.
 */
export type ProvenanceMark = 'sourced' | 'unsourced' | 'nodata';

export function provenanceMark(point: LearnNumericPoint | null): ProvenanceMark {
  if (!point) return 'nodata';
  return point.cited ? 'sourced' : 'unsourced';
}
