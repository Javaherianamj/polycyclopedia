// FE-8 foundation layer, Part 2 — the 10⁻⁶-station (spherulite) content the
// FE-0 spec named and nobody built: "crystallinity ↔ density readout"
// (lab-concepts-spec.md's Stations table). Owner, verbatim: "where are the
// figures and plots you talked about!"
//
// WHY A READOUT MODULE AND NOT A SIMULATOR: unlike BranchingSimulator or
// TacticitySimulator, there is no mechanism to let a reader manipulate here
// — crystallinity and density are properties OF a specific measured grade,
// not something a slider varies. The station's own sentence
// (`learn.scale.station.spherulite.sentence`) already makes the causal
// claim ("more ordered packing -> higher density"); what was missing is
// simply SHOWING the real numbers side by side so that claim is checkable
// against real materials instead of asserted and left unverified. So this
// is a filter + sort over the live catalog, not a model — same shape as
// `family-scope.ts`, no physics to test beyond "did it pick the right rows
// in the right order."
//
// DATA REALITY (checked against the live API before writing this, FE-8
// build brief's own verification posture): of the catalog's materials,
// only THREE carry both a `density` and an `academic.crystallinity` value
// today (HDPE, LDPE, PET) — most materials have density alone, and most
// have neither. A material with only one of the two is excluded here
// rather than shown with a blank second column: this readout's whole
// point is the density-crystallinity RELATIONSHIP, and a single-sided row
// would invite a reader to infer a pairing that isn't in the data (R7).
// The island reports the "N of M" count so the gap that DOES exist (most
// materials still missing one or both values) is stated, not hidden.

import type { LearnMaterial, LearnNumericPoint } from './fetch-learn-materials';

export interface SpheruliteReadoutRow {
  slug: string;
  nameFa: string;
  nameEn: string;
  density: LearnNumericPoint;
  crystallinity: LearnNumericPoint;
}

/**
 * Materials that carry BOTH a density and a crystallinity value, sorted
 * highest-crystallinity-first. The sort is not cosmetic: HDPE (high
 * crystallinity, high density) landing above LDPE (low, low) with PET
 * somewhere between lets the density-tracks-crystallinity trend the
 * station's sentence claims read directly off the row order, before a
 * reader even looks at the numbers.
 */
export function spheruliteReadoutRows(materials: readonly LearnMaterial[]): SpheruliteReadoutRow[] {
  const rows: SpheruliteReadoutRow[] = [];
  for (const m of materials) {
    if (m.density == null || m.crystallinity == null) continue;
    rows.push({
      slug: m.slug,
      nameFa: m.nameFa,
      nameEn: m.nameEn,
      density: m.density,
      crystallinity: m.crystallinity,
    });
  }
  return rows.sort((a, b) => b.crystallinity.value - a.crystallinity.value);
}
