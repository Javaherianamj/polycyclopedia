import { describe, expect, it } from 'vitest';
import { computeDifference } from './difference';
import type { CompareCell } from './types';

function cell(overrides: Partial<CompareCell> & { subjectRef: string }): CompareCell {
  return {
    band: { valueMin: overrides.representative ?? 0, valueMax: overrides.representative ?? 0, valueTypical: null },
    representative: 0,
    isCited: false,
    ...overrides,
  };
}

describe('computeDifference', () => {
  it('scores the full observed range as 1.0 (CR8)', () => {
    const cells = [
      cell({ subjectRef: 'a', representative: 0, band: { valueMin: 0, valueMax: 0, valueTypical: 0 } }),
      cell({ subjectRef: 'b', representative: 100, band: { valueMin: 100, valueMax: 100, valueTypical: 100 } }),
    ];
    const result = computeDifference(cells, 0, 100);
    expect(result.differenceScore).toBe(1);
  });

  it('scores a partial spread proportionally to the observed range (CR8)', () => {
    const cells = [
      cell({ subjectRef: 'a', representative: 10, band: { valueMin: 10, valueMax: 10, valueTypical: 10 } }),
      cell({ subjectRef: 'b', representative: 30, band: { valueMin: 30, valueMax: 30, valueTypical: 30 } }),
    ];
    // Observed range 0..200: (30-10)/200 = 0.1
    const result = computeDifference(cells, 0, 200);
    expect(result.differenceScore).toBeCloseTo(0.1);
  });

  it('handles a real-world negative-range property (brittleness_temp, -140..-76) without going negative or >1', () => {
    const cells = [
      cell({ subjectRef: 'a', representative: -140, band: { valueMin: -140, valueMax: -140, valueTypical: -140 } }),
      cell({ subjectRef: 'b', representative: -76, band: { valueMin: -76, valueMax: -76, valueTypical: -76 } }),
    ];
    const result = computeDifference(cells, -140, -76);
    expect(result.differenceScore).toBe(1);
    expect(result.differenceScore).toBeGreaterThanOrEqual(0);
  });

  it('guards the zero-denominator case: observedMin === observedMax scores 0, never NaN/Infinity', () => {
    const cells = [
      cell({ subjectRef: 'a', representative: 5, band: { valueMin: 5, valueMax: 5, valueTypical: 5 } }),
      cell({ subjectRef: 'b', representative: 5, band: { valueMin: 5, valueMax: 5, valueTypical: 5 } }),
    ];
    const result = computeDifference(cells, 5, 5);
    expect(result.differenceScore).toBe(0);
    expect(Number.isFinite(result.differenceScore)).toBe(true);
  });

  it('is total for fewer than two cells (defensive, not expected in real data per CR13)', () => {
    expect(computeDifference([], 0, 100)).toEqual({
      differenceScore: 0,
      deltaKind: 'absolute',
      deltaValue: 0,
      isOverlapping: false,
    });
    const one = [cell({ subjectRef: 'a', representative: 5, band: { valueMin: 5, valueMax: 5, valueTypical: 5 } })];
    expect(computeDifference(one, 0, 100).differenceScore).toBe(0);
  });

  it('CR12: only participates over the cells it is given — a row with one subject absent still computes over the rest', () => {
    // Simulates the caller having already excluded an absent subject; a
    // 3-subject row where only 2 hold a value behaves exactly like a
    // 2-subject row.
    const cells = [
      cell({ subjectRef: 'a', representative: 0, band: { valueMin: 0, valueMax: 0, valueTypical: 0 } }),
      cell({ subjectRef: 'b', representative: 50, band: { valueMin: 50, valueMax: 50, valueTypical: 50 } }),
    ];
    const result = computeDifference(cells, 0, 100);
    expect(result.differenceScore).toBeCloseTo(0.5);
  });

  describe('isOverlapping (CR10)', () => {
    it('is false when bands are disjoint', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 0.92, band: { valueMin: 0.9, valueMax: 0.91, valueTypical: null } }),
        cell({ subjectRef: 'b', representative: 0.95, band: { valueMin: 0.94, valueMax: 0.96, valueTypical: null } }),
      ];
      expect(computeDifference(cells, 0.9, 0.96).isOverlapping).toBe(false);
    });

    it('is true for the canonical density example (0.918-0.925 vs 0.923-0.930)', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 0.9215, band: { valueMin: 0.918, valueMax: 0.925, valueTypical: null } }),
        cell({ subjectRef: 'b', representative: 0.9265, band: { valueMin: 0.923, valueMax: 0.93, valueTypical: null } }),
      ];
      const result = computeDifference(cells, 0.9, 0.93);
      expect(result.isOverlapping).toBe(true);
    });

    it('touching-at-a-point bands count as overlapping (inclusive bounds)', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 5, band: { valueMin: 0, valueMax: 5, valueTypical: null } }),
        cell({ subjectRef: 'b', representative: 5, band: { valueMin: 5, valueMax: 10, valueTypical: null } }),
      ];
      expect(computeDifference(cells, 0, 10).isOverlapping).toBe(true);
    });

    it('N-way: flags overlap when only ONE pair among several overlaps', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 1, band: { valueMin: 0, valueMax: 2, valueTypical: null } }),
        cell({ subjectRef: 'b', representative: 2, band: { valueMin: 1.5, valueMax: 2.5, valueTypical: null } }), // overlaps a
        cell({ subjectRef: 'c', representative: 10, band: { valueMin: 9, valueMax: 11, valueTypical: null } }), // disjoint from both
      ];
      const result = computeDifference(cells, 0, 11);
      expect(result.isOverlapping).toBe(true);
    });

    it('N-way: false when every pair is disjoint', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 1, band: { valueMin: 0, valueMax: 1, valueTypical: null } }),
        cell({ subjectRef: 'b', representative: 5, band: { valueMin: 4, valueMax: 5, valueTypical: null } }),
        cell({ subjectRef: 'c', representative: 10, band: { valueMin: 9, valueMax: 10, valueTypical: null } }),
      ];
      expect(computeDifference(cells, 0, 10).isOverlapping).toBe(false);
    });
  });

  describe('deltaKind / deltaValue (CR9)', () => {
    it('prints relative_percent when both reps share a positive sign, bounded away from zero', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 100, band: { valueMin: 100, valueMax: 100, valueTypical: 100 } }),
        cell({ subjectRef: 'b', representative: 150, band: { valueMin: 150, valueMax: 150, valueTypical: 150 } }),
      ];
      const result = computeDifference(cells, 0, 1000);
      expect(result.deltaKind).toBe('relative_percent');
      expect(result.deltaValue).toBeCloseTo(50); // 50/100 * 100
    });

    it('prints relative_percent for two negative reps, relative to the smaller-magnitude one', () => {
      // brittleness_temp: -140 vs -76. Relative to |-76| (the smaller magnitude).
      const cells = [
        cell({ subjectRef: 'a', representative: -140, band: { valueMin: -140, valueMax: -140, valueTypical: -140 } }),
        cell({ subjectRef: 'b', representative: -76, band: { valueMin: -76, valueMax: -76, valueTypical: -76 } }),
      ];
      const result = computeDifference(cells, -140, -76);
      expect(result.deltaKind).toBe('relative_percent');
      expect(result.deltaValue).toBeCloseTo((64 / 76) * 100);
    });

    it('falls back to absolute across a sign change, even though the percentage would be arithmetically real', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: -10, band: { valueMin: -10, valueMax: -10, valueTypical: -10 } }),
        cell({ subjectRef: 'b', representative: 10, band: { valueMin: 10, valueMax: 10, valueTypical: 10 } }),
      ];
      const result = computeDifference(cells, -10, 10);
      expect(result.deltaKind).toBe('absolute');
      expect(result.deltaValue).toBe(20);
    });

    it('falls back to absolute when one rep is within RELATIVE_PERCENT_MIN_ABS of zero', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 0, band: { valueMin: 0, valueMax: 0, valueTypical: 0 } }),
        cell({ subjectRef: 'b', representative: 10, band: { valueMin: 10, valueMax: 10, valueTypical: 10 } }),
      ];
      const result = computeDifference(cells, 0, 10);
      expect(result.deltaKind).toBe('absolute');
      expect(result.deltaValue).toBe(10);
    });

    it('a zero-span row at zero (identical reps, both exactly 0) is absolute with deltaValue 0 (sign undefined at 0)', () => {
      const cells = [
        cell({ subjectRef: 'a', representative: 0, band: { valueMin: 0, valueMax: 0, valueTypical: 0 } }),
        cell({ subjectRef: 'b', representative: 0, band: { valueMin: 0, valueMax: 0, valueTypical: 0 } }),
      ];
      const result = computeDifference(cells, 0, 100);
      expect(result.deltaKind).toBe('absolute');
      expect(result.deltaValue).toBe(0);
      expect(result.differenceScore).toBe(0);
    });

    it('a zero-span row at a nonzero value (identical reps, both 42) reports a genuine 0% difference', () => {
      // Same-sign and bounded away from zero, so relative_percent applies —
      // "0% difference" is itself a meaningful, correct reading here, unlike
      // the sign-undefined-at-zero case above.
      const cells = [
        cell({ subjectRef: 'a', representative: 42, band: { valueMin: 42, valueMax: 42, valueTypical: 42 } }),
        cell({ subjectRef: 'b', representative: 42, band: { valueMin: 42, valueMax: 42, valueTypical: 42 } }),
      ];
      const result = computeDifference(cells, 0, 100);
      expect(result.deltaKind).toBe('relative_percent');
      expect(result.deltaValue).toBe(0);
      expect(result.differenceScore).toBe(0);
    });
  });

  it('uses only the min/max representative extremes across N subjects, ignoring middle values', () => {
    const cells = [
      cell({ subjectRef: 'a', representative: 0, band: { valueMin: 0, valueMax: 0, valueTypical: 0 } }),
      cell({ subjectRef: 'b', representative: 40, band: { valueMin: 40, valueMax: 40, valueTypical: 40 } }),
      cell({ subjectRef: 'c', representative: 100, band: { valueMin: 100, valueMax: 100, valueTypical: 100 } }),
    ];
    const result = computeDifference(cells, 0, 100);
    expect(result.differenceScore).toBe(1); // (100-0)/100
    expect(result.deltaValue).toBe(100); // absolute (sign: 0 is neither +/-), 100-0
  });
});
