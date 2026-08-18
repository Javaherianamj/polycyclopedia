// FE-8 step 3 — TacticitySimulator's pure teaching model. Ported from the
// legacy `src/components/TacticitySimulator.tsx` (frozen reference, not
// edited) for the interaction (an 8-unit chain of clickable side groups,
// auto-classifying atactic/isotactic/syndiotactic from the arrangement) --
// `classifyArrangement` below is that same decision rule, extracted so it is
// testable without a DOM.
//
// What did NOT get ported: the legacy component's specific numeric
// crystallinity/Tm RANGES per material ("iPP نیمه‌بلوری 50-70%", "sPS 270°C",
// ...). Those look exactly like the site's real cited datasheet numbers but
// are not backed by any citation -- rendered in the site's normal numeric
// style they would violate the step-3 brief's §C (never present an invented
// number in the same visual language as a measured one) on the one surface
// whose entire premise is trustworthy provenance. This module returns only
// relative bands, same as branching.ts, for the island to render as
// qualitative bars/arrows with no unit attached.
//
// SCOPE (family-scope.ts materialHasTacticity): only offered for materials
// with a substituted, stereogenic carbon -- pp, abs, ps, pvc, pmma. Never
// hdpe/ldpe/lldpe (symmetric ethylene monomer, no stereocentre to arrange).

export type TacticityMode = 'atactic' | 'isotactic' | 'syndiotactic';

export const TACTICITY_MODES: readonly TacticityMode[] = [
  'atactic',
  'isotactic',
  'syndiotactic',
];

/** +1 / -1 = which side of the backbone the substituent points to. Same
 * encoding as the legacy component's `rings` array. */
export type SideGroupSequence = readonly (1 | -1)[];

export const DEFAULT_SEQUENCE: SideGroupSequence = [1, 1, -1, 1, -1, -1, 1, -1]; // atactic
export const ISOTACTIC_SEQUENCE: SideGroupSequence = [1, 1, 1, 1, 1, 1, 1, 1];
export const SYNDIOTACTIC_SEQUENCE: SideGroupSequence = [1, -1, 1, -1, 1, -1, 1, -1];

/**
 * Classifies a side-group sequence the same way the legacy component did:
 * isotactic when every unit points the same way, syndiotactic when it
 * strictly alternates, atactic otherwise (including the degenerate
 * length-0/1 cases, which are trivially "all the same side" -- treated as
 * isotactic, matching `Array.prototype.every`'s vacuous-true behaviour, the
 * same as the legacy code did implicitly).
 */
export function classifyArrangement(sequence: SideGroupSequence): TacticityMode {
  if (sequence.length === 0) return 'isotactic';
  const first = sequence[0];
  const isIsotactic = sequence.every((v) => v === first);
  if (isIsotactic) return 'isotactic';
  const isSyndiotactic = sequence.every((v, i) => (i % 2 === 0 ? v === first : v === -first));
  if (isSyndiotactic) return 'syndiotactic';
  return 'atactic';
}

/** Flips one position and returns a new sequence -- pure, so the island's
 * click handler stays a one-line `setSequence(toggleAt(sequence, i))`. */
export function toggleAt(sequence: SideGroupSequence, index: number): SideGroupSequence {
  return sequence.map((v, i) => (i === index ? ((v * -1) as 1 | -1) : v));
}

export type TrendBand = 'none' | 'low' | 'medium' | 'high';

export interface TacticityTrend {
  crystallinity: TrendBand;
  /** Whether stereoregularity gives the chain a real crystalline melting
   * point at all -- never a number (see file header). Atactic has none;
   * either stereoregular form has one ('present'). */
  meltingPoint: 'none' | 'present';
  clarity: 'clear' | 'hazy' | 'opaque';
}

// Atactic: no long-range stereoregularity -> chains cannot pack into a
// crystal lattice -> amorphous, optically clear, no true Tm.
// Isotactic: every substituent on the same side -> regular helix -> packs
// into a semi-crystalline structure -> real Tm, some haze.
// Syndiotactic: substituents strictly alternate -> also regular (a different
// regular repeat than isotactic) -> often the highest crystallinity of the
// three for a given polymer -> real Tm (commonly higher), most opaque.
const TRENDS: Record<TacticityMode, TacticityTrend> = {
  atactic: { crystallinity: 'none', meltingPoint: 'none', clarity: 'clear' },
  isotactic: { crystallinity: 'medium', meltingPoint: 'present', clarity: 'hazy' },
  syndiotactic: { crystallinity: 'high', meltingPoint: 'present', clarity: 'opaque' },
};

export function tacticityTrend(mode: TacticityMode): TacticityTrend {
  return TRENDS[mode];
}
