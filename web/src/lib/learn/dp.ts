// FE-8 step 1 — DPCalculator's pure arithmetic. Ported from the legacy
// `DPCalculator.tsx` (root `src/components/`), which computed this inline
// in the render body; extracted here so it is testable without React and so
// the island stays a thin view over it (same split as thermal.ts).
//
// DATA REALITY (frontend-plan.md FE-8 build brief, verified 2026-08-13): the
// database holds 3 `mn` and 3 `mw` values total. The legacy prop
// `mnDefaultValue` was a slider *default*, never a measurement, so this is a
// genuine calculator driven by whatever the reader types in -- Mn and PDI are
// always user input, never read from a material as fact. A material's real
// Mn may only ever *seed* the input field's starting number (DataBoundary
// bonus in the island), which is a UI convenience, not this module's concern.

export interface DPResult {
  /** Number-average degree of polymerisation: Mn / M0, rounded. */
  dpN: number;
  /** Weight-average molar mass: Mn x PDI, rounded. Derived, not measured --
   * this calculator's whole point is showing how PDI spreads Mw away from Mn. */
  mw: number;
  /** Weight-average degree of polymerisation: Mw / M0, rounded. */
  dpW: number;
}

/**
 * @param mn Number-average molar mass the reader entered, g/mol.
 * @param pdi Polydispersity index (Mw/Mn) the reader entered, dimensionless.
 * @param monomerMolarMass The repeat unit's molar mass, M0, g/mol -- always
 *   a real, cited-or-not database value for the chosen material, never
 *   user input (unlike Mn/PDI, this is a chemical constant, not a measurement
 *   sample).
 */
export function computeDP(mn: number, pdi: number, monomerMolarMass: number): DPResult {
  if (!(mn > 0) || !(monomerMolarMass > 0)) {
    return { dpN: 0, mw: 0, dpW: 0 };
  }
  const dpN = Math.round(mn / monomerMolarMass);
  const mw = pdi > 0 ? Math.round(mn * pdi) : 0;
  const dpW = mw > 0 ? Math.round(mw / monomerMolarMass) : 0;
  return { dpN, mw, dpW };
}
