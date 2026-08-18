// FE-8 step 3 — the family-scoping gate for the two FAMILY-SPECIFIC
// simulators (BranchingSimulatorIsland, TacticitySimulatorIsland). Pure
// functions, no React/fetch/i18n, same split as thermal.ts/dp.ts: the
// science lives here where it can be unit tested; the island just calls it.
//
// R7 in the step-3 brief: "a tool renders NOTHING when its family scope does
// not apply, rather than an empty shell." The two tools have different
// scopes, and getting them right is the whole risk of this step:
//
// BRANCHING — chain architecture is the defining axis of the polyethylenes
// (HDPE/LDPE/LLDPE) and is also a real comonomer/copolymer-architecture
// concern for PP. All four members of the `polyolefins` family qualify, so
// this one IS a clean family-key gate.
//
// TACTICITY — isotactic/syndiotactic/atactic describes the arrangement of a
// substituent on a stereocentre. Ethylene (CH2=CH2) is symmetric and has NO
// stereocentre, so tacticity is scientifically meaningless for HDPE, LDPE
// and LLDPE -- offering the tool for them would put false teaching on the
// site. Propylene (CH2=CH-CH3) DOES have one, so PP qualifies. Both HDPE and
// PP carry `family.key === 'polyolefins'`, so unlike branching, tacticity
// CANNOT be gated on family key alone without either hiding it from PP or
// wrongly offering it for the PE grades -- the commercial-family taxonomy
// groups a symmetric-monomer polymer and an asymmetric-monomer one together,
// which chain-architecture teaching doesn't care about but stereochemistry
// teaching does. This is the one deliberate, documented exception to
// "scope by family key, not material slug" (step-3 brief, FAMILY DATA
// section): everywhere the family IS homogeneous on this axis (styrenics,
// vinyls, acrylics), the gate stays family-key-only.
//
// The other three vinyl-type families the brief calls out (styrenics: ABS
// and PS; vinyls: PVC; acrylics: PMMA) are homogeneous -- every member has a
// substituted stereocentre -- so no per-material exception is needed there.

export const BRANCHING_FAMILY_KEY = 'polyolefins';

export const TACTICITY_FAMILY_KEYS: readonly string[] = ['styrenics', 'vinyls', 'acrylics'];

/** The one material inside `polyolefins` that has a stereocentre. See the
 * file header for why this can't be a family-key check. */
export const TACTICITY_POLYOLEFIN_EXCEPTION_SLUG = 'pp';

export interface FamilyRef {
  key: string;
}

/** Branching/chain-architecture teaching applies to the whole polyolefins
 * family (B in the step-3 brief: HDPE, LDPE, LLDPE define the concept; PP is
 * the comonomer-architecture bonus case). */
export function materialHasBranchingRelevance(family: FamilyRef): boolean {
  return family.key === BRANCHING_FAMILY_KEY;
}

/** Tacticity teaching applies to vinyl-type monomers with a substituted
 * carbon: pp (polyolefins, by exception), ps and abs (styrenics), pvc
 * (vinyls), pmma (acrylics). Never hdpe/ldpe/lldpe (A in the step-3 brief). */
export function materialHasTacticity(family: FamilyRef, slug: string): boolean {
  if (TACTICITY_FAMILY_KEYS.includes(family.key)) return true;
  return family.key === BRANCHING_FAMILY_KEY && slug === TACTICITY_POLYOLEFIN_EXCEPTION_SLUG;
}
