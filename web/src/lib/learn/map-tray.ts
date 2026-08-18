// L2 — «نقشه» / MAP. Pure "which tool belongs to which thermal regime" table.
// Split out from MapIsland.tsx for the same reason modulus-curve.ts is its
// own module: this is a fact about polymer physics (a stress-strain curve is
// only meaningful once crystallites exist to strain; MFI is only meaningful
// once the material is actually flowing), not a rendering decision, and the
// build brief asks for region-boundary logic to live in lib/learn/ with
// tests beside it.
//
// THE TEACHING MECHANISM (lab-concepts-spec.md, L2): "a tray that swaps
// content as the marker moves ... with the others visibly greyed rather than
// hidden, so the reader learns that tools belong to regimes." That sentence
// is why `ALL_MAP_TOOLS` exists as a single fixed list rendered on every
// visit, and `trayToolsForPhase` only ever selects a SUBSET of it to
// highlight — MapIsland never removes a chip from the DOM when the marker
// leaves its region, it only toggles a dim class, and this module is what
// tells it which chips to toggle.
//
// `stateSimulator` (the SCALE surface's own phase-classifier tool) is
// deliberately NOT one of these tools: it already spans all four regions by
// itself (thermal.ts's classifyPhase is the shared engine behind both it and
// this curve), so gating it to one region here would misrepresent it. It
// gets a standing cross-link near the readout instead (MapIsland.tsx), not a
// slot in this region-exclusive tray.
import type { ThermalPhase } from './thermal';

export type MapToolKey =
  | 'izodImpact'
  | 'crystallinityDensity'
  | 'branchingSimulator'
  | 'tensileElongation'
  | 'mfi'
  | 'processTemp'
  | 'burnNote';

const TRAY_BY_PHASE: Record<ThermalPhase, readonly MapToolKey[]> = {
  // Below Tg: chains are frozen, so the physically meaningful question is
  // "how brittle is it" -- the classic low-temperature Izod story.
  glass: ['izodImpact'],
  // Between Tg and Tm (semicrystalline only -- `classifyPhase` never returns
  // 'rubber' for an amorphous material, so these three chips are simply
  // never reachable for e.g. PMMA/PS/PC, and stay permanently dimmed for
  // them. That is not a bug: it is itself a correct lesson about the
  // amorphous/semicrystalline distinction the spec asks this page to teach.
  rubber: ['crystallinityDensity', 'branchingSimulator', 'tensileElongation'],
  // Above Tm (or, for an amorphous material, anywhere past its single wide
  // Tg transition): the material flows, so the meaningful numbers are the
  // ones processing engineers actually read off a datasheet for this regime.
  melt: ['mfi', 'processTemp'],
  // At/above Td: nothing here is a "tool" in the sense the others are --
  // there is no instrument reading to show, only the fact that this is
  // irreversible chain scission, not a process step.
  burn: ['burnNote'],
};

/** Fixed render order for the tray grid — every chip in every region,
 * concatenated once. MapIsland renders exactly this list, always, and asks
 * `isToolActive` which ones to highlight for the current marker position. */
export const ALL_MAP_TOOLS: readonly MapToolKey[] = [
  ...TRAY_BY_PHASE.glass,
  ...TRAY_BY_PHASE.rubber,
  ...TRAY_BY_PHASE.melt,
  ...TRAY_BY_PHASE.burn,
];

/** Which tools are physically meaningful at the given phase — the ACTIVE
 * subset of `ALL_MAP_TOOLS` for a marker currently in that region. */
export function trayToolsForPhase(phase: ThermalPhase): readonly MapToolKey[] {
  return TRAY_BY_PHASE[phase];
}

/** Whether `tool` belongs to `phase` — MapIsland calls this once per chip,
 * per render, to decide `is-active` vs. `is-dim` (never to decide whether to
 * render the chip at all — see this module's header on why hiding is wrong
 * here). */
export function isToolActive(tool: MapToolKey, phase: ThermalPhase): boolean {
  return trayToolsForPhase(phase).includes(tool);
}
