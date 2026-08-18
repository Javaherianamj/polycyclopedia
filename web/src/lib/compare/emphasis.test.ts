import { describe, expect, it } from 'vitest';
import { computeEmphasis } from './emphasis';
import type { CompareCell, CompareRow } from './types';

function cell(subjectRef: string, representative: number): CompareCell {
  return {
    subjectRef,
    representative,
    isCited: false,
    band: { valueMin: representative, valueMax: representative, valueTypical: representative },
  };
}

function row(cells: CompareCell[]): CompareRow {
  return {
    rowKey: 'test-row',
    propertyKey: 'test_property',
    nameFa: 'خاصیت',
    nameEn: 'Property',
    symbol: null,
    unit: null,
    conditions: {},
    groupKey: 'group-a',
    groupNameFa: 'گروه الف',
    groupNameEn: 'Group A',
    cells,
    differenceScore: 0,
    deltaKind: 'absolute',
    deltaValue: 0,
    isOverlapping: false,
    hasCitationAsymmetry: false,
  };
}

describe('computeEmphasis', () => {
  it('returns an empty array for a row with no cells', () => {
    expect(computeEmphasis(row([]))).toEqual([]);
  });

  it('a single cell gets full emphasis and isLargest true', () => {
    const result = computeEmphasis(row([cell('a', 42)]));
    expect(result).toEqual([{ subjectRef: 'a', emphasis: 1, isLargest: true }]);
  });

  it('two distinct values: smaller gets 0, larger gets 1', () => {
    const result = computeEmphasis(row([cell('a', 10), cell('b', 30)]));
    expect(result).toEqual([
      { subjectRef: 'a', emphasis: 0, isLargest: false },
      { subjectRef: 'b', emphasis: 1, isLargest: true },
    ]);
  });

  it('a middle value gets a fractional linear position', () => {
    const result = computeEmphasis(row([cell('a', 0), cell('b', 25), cell('c', 100)]));
    expect(result).toEqual([
      { subjectRef: 'a', emphasis: 0, isLargest: false },
      { subjectRef: 'b', emphasis: 0.25, isLargest: false },
      { subjectRef: 'c', emphasis: 1, isLargest: true },
    ]);
  });

  it('all values equal: every cell gets emphasis 0 and isLargest false (documented tie behaviour)', () => {
    const result = computeEmphasis(row([cell('a', 5), cell('b', 5), cell('c', 5)]));
    expect(result).toEqual([
      { subjectRef: 'a', emphasis: 0, isLargest: false },
      { subjectRef: 'b', emphasis: 0, isLargest: false },
      { subjectRef: 'c', emphasis: 0, isLargest: false },
    ]);
  });

  it('a tie for the maximum among otherwise-differing values marks both isLargest', () => {
    const result = computeEmphasis(row([cell('a', 1), cell('b', 5), cell('c', 5)]));
    expect(result[1]).toEqual({ subjectRef: 'b', emphasis: 1, isLargest: true });
    expect(result[2]).toEqual({ subjectRef: 'c', emphasis: 1, isLargest: true });
    expect(result[0].isLargest).toBe(false);
  });

  it('a 100x spread produces finite, in-range, correctly ordered emphasis (no degenerate NaN/Infinity)', () => {
    const result = computeEmphasis(row([cell('a', 1), cell('b', 2), cell('c', 100)]));
    for (const r of result) {
      expect(Number.isFinite(r.emphasis)).toBe(true);
      expect(r.emphasis).toBeGreaterThanOrEqual(0);
      expect(r.emphasis).toBeLessThanOrEqual(1);
    }
    expect(result[0].emphasis).toBeLessThan(result[1].emphasis);
    expect(result[1].emphasis).toBeLessThan(result[2].emphasis);
    expect(result[2].isLargest).toBe(true);
  });

  it('handles negative values (e.g. brittleness_temp -140..-76) with correct linear ordering', () => {
    const result = computeEmphasis(row([cell('a', -140), cell('b', -108), cell('c', -76)]));
    expect(result[0]).toEqual({ subjectRef: 'a', emphasis: 0, isLargest: false });
    expect(result[1].emphasis).toBeCloseTo(0.5);
    expect(result[2]).toEqual({ subjectRef: 'c', emphasis: 1, isLargest: true });
  });

  // --------------------------------------------------------------------
  // Logarithmic ramp for orders-of-magnitude rows.
  //
  // These exist because the original all-linear ramp was measured as
  // degenerate on real data: MFI across HDPE grade classes put 5 of 8 cells
  // inside a 1.00-1.09em band for values ~30x apart, i.e. the type carried
  // no magnitude information across most of the row.
  // --------------------------------------------------------------------

  it('real MFI row (0.25..37.5) spreads the small end instead of clumping it at zero', () => {
    // The actual seeded HDPE grade-class MFI values that exposed the defect.
    const result = computeEmphasis(
      row([
        cell('hdpe/blow_molding', 0.25),
        cell('hdpe/film', 0.31),
        cell('hdpe/thermoforming', 0.35),
        cell('hdpe/injection', 33.59),
        cell('hdpe/blow_molding@21.6', 37.5),
      ]),
    );
    const byRef = Object.fromEntries(result.map((r) => [r.subjectRef, r.emphasis]));

    // Under the old linear ramp these three sat at 0, 0.0016 and 0.0027 —
    // indistinguishable. They must now occupy visibly different positions.
    expect(byRef['hdpe/film'] - byRef['hdpe/blow_molding']).toBeGreaterThan(0.02);
    expect(byRef['hdpe/thermoforming'] - byRef['hdpe/film']).toBeGreaterThan(0.02);

    // Ordering and bounds still hold.
    expect(byRef['hdpe/blow_molding']).toBe(0);
    expect(byRef['hdpe/blow_molding@21.6']).toBe(1);
    expect(result.find((r) => r.subjectRef === 'hdpe/blow_molding@21.6')?.isLargest).toBe(true);
  });

  it('does not switch to log below the ratio threshold — ordinary rows keep linear behaviour', () => {
    // max/min = 3, well under LOG_SCALE_MIN_RATIO: unchanged from before.
    const result = computeEmphasis(row([cell('a', 10), cell('b', 20), cell('c', 30)]));
    expect(result[1].emphasis).toBeCloseTo(0.5);
  });

  it('never uses log when a value is zero or negative, even across orders of magnitude', () => {
    // min <= 0 makes log undefined; real data crosses zero (brittleness_temp).
    const withZero = computeEmphasis(row([cell('a', 0), cell('b', 1), cell('c', 1000)]));
    for (const r of withZero) {
      expect(Number.isFinite(r.emphasis)).toBe(true);
    }
    expect(withZero[1].emphasis).toBeCloseTo(0.001);

    const negative = computeEmphasis(row([cell('a', -500), cell('b', -5)]));
    for (const r of negative) {
      expect(Number.isFinite(r.emphasis)).toBe(true);
    }
    expect(negative[0].emphasis).toBe(0);
    expect(negative[1].emphasis).toBe(1);
  });

  it('never includes anything resembling a polarity/goodness field — magnitude only', () => {
    const result = computeEmphasis(row([cell('a', 1), cell('b', 2)]));
    for (const r of result) {
      expect(Object.keys(r).sort()).toEqual(['emphasis', 'isLargest', 'subjectRef']);
    }
  });
});
