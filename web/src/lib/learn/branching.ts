// FE-8 step 3 — BranchingSimulator's pure teaching model. Ported from the
// legacy `src/components/BranchingSimulator.tsx` (frozen reference, not
// edited) in CONCEPT only -- the legacy component drove four hardcoded
// linear formulas (`24 - (branchingLevel/30)*12`, etc.) off one continuous
// 2-30 slider that mixed short- and long-chain branching into a single
// "amount" axis. That is not what distinguishes LDPE from LLDPE (step-3
// brief §B): they differ in branch TYPE and polymerisation ROUTE, not in how
// far along the same axis they sit. A continuous slider that blurs that
// distinction is exactly the trap the brief calls "the single most commonly
// botched fact in this area," so step 3 replaces it with a discrete choice
// between the three real PE architectures. No numbers are invented here --
// this module returns only relative bands (low/medium/high), which the
// island renders as qualitative bars, never as a specific % or g/cm3
// (step-3 brief §C: real numbers, if shown at all, come from the database,
// per-material, via fetch-learn-materials.ts's `density`/`crystallinity`).

export type PEArchitecture = 'linear' | 'longChainBranched' | 'shortChainBranched';

export const PE_ARCHITECTURES: readonly PEArchitecture[] = [
  'linear',
  'longChainBranched',
  'shortChainBranched',
];

export type TrendBand = 'low' | 'medium' | 'high';

export interface TrendValue {
  /** The word shown in text. */
  band: TrendBand;
  /** Schematic bar magnitude, 0-1. See TRENDS below for where these come
   * from and why they are NOT all equal within one architecture. */
  level: number;
}

export interface BranchingTrend {
  /** How closely chains can pack into a lamella -- the mechanism the other
   * two follow from. */
  packing: TrendValue;
  crystallinity: TrendValue;
  density: TrendValue;
}

// HDPE: essentially linear (few short branches) -> dense packing -> high
// crystallinity/density/stiffness.
// LDPE: LONG-chain branching (high-pressure free-radical route, backbiting)
// -> poor packing -> low crystallinity/density, flexible.
// LLDPE: SHORT-chain branching (deliberate alpha-olefin comonomer --
// butene/hexene/octene -- NOT long-chain) -> intermediate packing/density,
// better toughness/tear than LDPE.
// Fix, 2026-08-14 (owner review): the first version gave all three columns
// the SAME band per architecture, so the three bars rendered at identical
// widths and read as one quantity drawn three times. Worse, that
// simplification hid the genuinely interesting fact about LDPE vs LLDPE.
//
// The three quantities do NOT track together across the PE family:
//
//   HDPE  crystallinity ~70-80 %   density ~0.941-0.965
//   LLDPE crystallinity ~35-55 %   density ~0.915-0.940
//   LDPE  crystallinity ~45-55 %   density ~0.910-0.935
//
// So LLDPE is typically LESS crystalline than LDPE -- its many short
// comonomer branches disrupt lamellar growth very efficiently -- while
// still being DENSER than LDPE, because LDPE's long-chain branching creates
// more free volume. Which property is depressed differs between the two,
// and that is the point worth teaching.
//
// `level` is a 0-1 schematic magnitude for the bar width, taken from the
// midpoint of the literature ranges above (density normalised over
// 0.90-0.97 g/cm3, crystallinity over 0-100 %). `band` is the word shown in
// text. Neither is a measured value for any specific grade -- real cited
// numbers for a chosen material are rendered separately by the island.
const TRENDS: Record<PEArchitecture, BranchingTrend> = {
  linear: {
    packing: { band: 'high', level: 0.9 },
    crystallinity: { band: 'high', level: 0.75 },
    density: { band: 'high', level: 0.76 },
  },
  longChainBranched: {
    packing: { band: 'low', level: 0.35 },
    crystallinity: { band: 'medium', level: 0.5 },
    density: { band: 'low', level: 0.31 },
  },
  shortChainBranched: {
    packing: { band: 'medium', level: 0.6 },
    crystallinity: { band: 'medium', level: 0.45 },
    density: { band: 'medium', level: 0.39 },
  },
};

export function branchingTrend(architecture: PEArchitecture): BranchingTrend {
  return TRENDS[architecture];
}

/** A single branch to draw on the schematic chain, in abstract (0-1 along
 * the backbone) coordinates so the island can scale it to any viewport
 * without recomputing the model. Deterministic (no `Math.random`) so a
 * screenshot or test is reproducible. */
export interface BranchPoint {
  /** Position along the backbone, 0 (start) to 1 (end). */
  position: number;
  /** Long branches are drawn longer AND coloured distinctly from short ones
   * -- the one visual encoding this tool must never blur (§B). */
  kind: 'long' | 'short';
  side: 1 | -1;
}

/**
 * The branch layout for a given architecture. Counts and spacing are
 * illustrative teaching geometry, not measured branch density (real branch
 * density is reported in branches-per-1000-carbons in the literature; this
 * function does not claim to reproduce that number, only to show FEWER,
 * LONGER branches for LDPE and MORE, evenly-spaced, SHORT branches for
 * LLDPE, which is the qualitative distinction that matters here).
 */
// FE-8 foundation layer, Part 1 — the one piece of material-context seeding
// logic that belongs in THIS file rather than in material-context.ts (see
// that file's header: family/property eligibility stays with whoever
// already owns the rule). Mapping a material's free-text `chainType`
// (`db/seeds`'s vocabulary: 'linear_pure', 'branched_long_short',
// 'linear_short_branched', ...) onto one of the three PE_ARCHITECTURES this
// module models is a BRANCHING-SPECIFIC interpretation of that text, so it
// lives beside the architectures it maps onto, not in the shared context
// hook. Only the three chain types this codebase's seed data actually uses
// for HDPE/LDPE/LLDPE are recognised; anything else (PP's 'isotactic', an
// unmapped or unknown string) returns `null` rather than guessing --
// PP is tacticity-described, not branching-architecture-described, and
// silently mapping it onto one of the three PE buckets would misteach the
// exact distinction `family-scope.ts`'s header spends a paragraph
// explaining. A `null` return means "seed the material picker only, leave
// the architecture toggle at its current setting" -- never "invent one".
const CHAIN_TYPE_TO_ARCHITECTURE: Readonly<Record<string, PEArchitecture>> = {
  linear_pure: 'linear',
  branched_long_short: 'longChainBranched',
  linear_short_branched: 'shortChainBranched',
};

export function chainTypeToArchitecture(chainType: string | null): PEArchitecture | null {
  if (!chainType) return null;
  return CHAIN_TYPE_TO_ARCHITECTURE[chainType] ?? null;
}

export function branchLayout(architecture: PEArchitecture): BranchPoint[] {
  if (architecture === 'linear') return [];

  if (architecture === 'longChainBranched') {
    // Few, irregularly spaced, long branches -- LDPE's long-chain branching
    // is itself branched and irregular, unlike LLDPE's comb-like regularity.
    return [0.18, 0.4, 0.68, 0.85].map((position, i) => ({
      position,
      kind: 'long',
      side: i % 2 === 0 ? 1 : -1,
    }));
  }

  // shortChainBranched: many, evenly spaced, short branches -- the comb
  // structure a regular alpha-olefin comonomer produces.
  const count = 9;
  return Array.from({ length: count }, (_, i) => ({
    position: (i + 1) / (count + 1),
    kind: 'short' as const,
    side: i % 2 === 0 ? 1 : -1,
  }));
}
