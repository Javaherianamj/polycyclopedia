// Pure difference/spread computation for one compare row — CR8, CR9, CR10,
// CR12. No DOM, no fetch, no globals; matches the pure-logic/thin-DOM split
// `filter-logic.ts` and `search/match.ts` set for their own units.
//
// This module does NOT build a `CompareRow` (that's the table-assembly
// step, out of FE-6's pure-logic scope) — it computes the four
// difference-related fields (`differenceScore`, `deltaKind`, `deltaValue`,
// `isOverlapping`) from a row's cells plus the property's dataset-wide
// observed range, so the assembler can drop the result straight onto a
// `CompareRow`.

import type { CompareCell, DeltaKind } from './types';
import { RELATIVE_PERCENT_MIN_ABS } from './types';

export interface DifferenceResult {
  /** CR8 — range-normalised spread, 0..1 (see zero-denominator note below). */
  differenceScore: number;
  /** CR9 — whether the reader sees a percentage or an absolute delta. */
  deltaKind: DeltaKind;
  /** CR9 — the value to display, in the unit implied by `deltaKind`. */
  deltaValue: number;
  /** CR10 — true when any two subjects' value bands overlap. */
  isOverlapping: boolean;
}

/**
 * CR12 — absent values never participate. This function does not filter
 * `cells` itself: the caller (table assembly, out of scope here) is
 * responsible for only including cells for subjects that actually hold a
 * value for this (property, conditions) row. Whatever `cells` this function
 * receives, it treats as "the subjects present" — there is no separate
 * notion of an absent cell to guard against here.
 *
 * Fewer than two cells is not a real comparison (CR13 requires 2+ subjects
 * upstream), but this function stays defined and total rather than
 * throwing: zero or one cell reports a zero-span, non-overlapping,
 * `absolute`/0 result.
 */
export function computeDifference(
  cells: CompareCell[],
  observedMin: number,
  observedMax: number,
): DifferenceResult {
  if (cells.length < 2) {
    return { differenceScore: 0, deltaKind: 'absolute', deltaValue: 0, isOverlapping: false };
  }

  // CR8 — `representative` is already `value_typical ?? midpoint(min, max)`
  // per the `CompareCell` contract (types.ts), computed once upstream. Point
  // values (min === max === typical, 115 rows in the real data) fall out of
  // that contract with no special case needed here.
  const reps = cells.map((c) => c.representative);
  const minRep = Math.min(...reps);
  const maxRep = Math.max(...reps);
  const absDiff = maxRep - minRep;

  // Guard the zero-denominator case: a property whose entire observed
  // dataset is a single point (observedMin === observedMax) has no range to
  // normalise against. [own call] Treat that as "no measurable spread" —
  // differenceScore 0 — rather than dividing by zero or treating any
  // nonzero row spread as infinitely significant. This is a dataset
  // pathology (a property with exactly one distinct value ever observed),
  // not something the real data is expected to hit.
  const observedSpan = observedMax - observedMin;
  const differenceScore = observedSpan === 0 ? 0 : absDiff / observedSpan;

  // CR10 — bands overlap. [own call, generalising the two-subject example
  // to N subjects] Flagged when ANY pair of subjects' [valueMin, valueMax]
  // bands overlap, not only when all bands share one common point. Reasoning:
  // `differenceScore` above is driven by the two REPRESENTATIVE extremes,
  // but "is there a winner" is a claim about every subject in the row, and a
  // single ambiguous pair (any two subjects whose real ranges could tie) is
  // enough to make "row has a clear winner" false. This is the conservative
  // reading of CR10's "not meaningfully different" — it can only ever add
  // rows to the sunk set, never miss one.
  let isOverlapping = false;
  outer: for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i].band;
      const b = cells[j].band;
      if (a.valueMin <= b.valueMax && b.valueMin <= a.valueMax) {
        isOverlapping = true;
        break outer;
      }
    }
  }

  // CR9 — relative percent only when minRep/maxRep share a sign and are both
  // bounded away from zero. A zero-span row (minRep === maxRep) whose shared
  // value is itself 0 is neither positive nor negative, so it correctly
  // falls through to `absolute` (deltaValue 0) rather than a spurious
  // 0%-of-nothing percent; a zero-span row at a nonzero value (e.g. both
  // subjects at 42) legitimately reports `relative_percent` at exactly 0% —
  // "no difference" is itself a meaningful percentage there.
  const sameSign = (minRep > 0 && maxRep > 0) || (minRep < 0 && maxRep < 0);
  const boundedAwayFromZero =
    Math.abs(minRep) >= RELATIVE_PERCENT_MIN_ABS && Math.abs(maxRep) >= RELATIVE_PERCENT_MIN_ABS;

  let deltaKind: DeltaKind;
  let deltaValue: number;
  if (sameSign && boundedAwayFromZero) {
    deltaKind = 'relative_percent';
    // [own call] Percentage is relative to the smaller-magnitude of the two
    // representative extremes (i.e. the value closer to zero), so "60%
    // higher" always describes how much bigger the larger one is,
    // regardless of which sign the pair happens to share. For same-sign
    // values this is well-defined and symmetric under the sign: -140 vs -76
    // (both negative) reports relative to -76 (|76| < |140|) exactly as 100
    // vs 176 would report relative to 100.
    const base = Math.min(Math.abs(minRep), Math.abs(maxRep));
    deltaValue = (absDiff / base) * 100;
  } else {
    deltaKind = 'absolute';
    deltaValue = absDiff;
  }

  return { differenceScore, deltaKind, deltaValue, isOverlapping };
}
