// FE-8 step 1 — StateSimulator's pure physics logic. No React, no fetch, no
// i18n: everything here is a plain function of numbers so it can be unit
// tested without a DOM (mirrors lib/compare/difference.ts's split between
// "the arithmetic" and "the island that renders it").
//
// R7's per-dependency reading (frontend-plan.md FE-8): the CONCEPT — a
// polymer moves through glassy -> rubbery/viscoelastic -> melt ->
// degradation as temperature rises — is true of every polymer and needs no
// database value at all. Tg/Tm/Td are the three thresholds that place the
// zone BOUNDARIES on a specific material's real axis; when a threshold is
// missing the zone it would have introduced is simply not offered, never
// invented (R5).

export type ThermalPhase = 'glass' | 'rubber' | 'melt' | 'burn';

export interface ThermalThresholds {
  /** Glass transition temperature, °C. The one threshold every classification
   * needs — without it there is no glassy/not-glassy line to draw at all. */
  tg: number;
  /** Crystalline melting point, °C. `null` for an amorphous polymer (LDPE,
   * ABS...) or when unmeasured — the semi-crystalline "rubbery plateau" zone
   * only exists when this is a real number. */
  tm: number | null;
  /** Thermal degradation onset, °C. `null` when unmeasured — the "burn" zone
   * and its marker are simply absent, not defaulted to a guess. */
  degradationTemp: number | null;
}

/** LDPE-style amorphous behaviour: no real crystalline melt, so `tm` is
 * either absent or (rarely, in raw data) sits at/below `tg`, which is not a
 * physically meaningful melt for classification purposes. */
export function isAmorphous(thresholds: ThermalThresholds): boolean {
  return thresholds.tm == null || thresholds.tm <= thresholds.tg;
}

/** The classification legacy `StateSimulator.tsx` (root `src/components/`)
 * hand-rolled per-instance; ported once here as a pure decision table. Same
 * four phases, same ordering, generalised to tolerate `tm`/`degradationTemp`
 * being absent instead of assuming both always exist. */
export function classifyPhase(tempC: number, thresholds: ThermalThresholds): ThermalPhase {
  const { tg, tm, degradationTemp } = thresholds;
  const amorphous = isAmorphous(thresholds);

  if (tempC < tg) return 'glass';

  if (degradationTemp != null && tempC >= degradationTemp) return 'burn';

  if (!amorphous && tm != null) {
    // Semi-crystalline: a real rubbery plateau between Tg and Tm, then melt.
    if (tempC < tm) return 'rubber';
    return 'melt';
  }

  // Amorphous: no crystalline plateau -- straight from glass into
  // viscoelastic melt flow once past Tg.
  return 'melt';
}

/** Where a value sits on [min, max] as a 0-100 percentage, clamped. Shared by
 * every marker (Tg/Tm/Td) and the fill itself so they stay pixel-consistent. */
export function percentAlong(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/** The slider's own bounds. Generous headroom below Tg and above whichever
 * of Td/Tm is highest, so every marker sits comfortably inside the track
 * rather than jammed against an edge -- same margins the legacy component
 * used (60 below, 80 above), just derived from whatever thresholds are
 * actually available instead of assuming all three exist. */
export function sliderRange(thresholds: ThermalThresholds): { min: number; max: number } {
  const { tg, tm, degradationTemp } = thresholds;
  const upperAnchor = degradationTemp ?? tm ?? tg + 150;
  const min = Math.min(-150, Math.floor(tg - 60));
  const max = Math.max(min + 40, Math.ceil(upperAnchor + 80));
  return { min, max };
}
