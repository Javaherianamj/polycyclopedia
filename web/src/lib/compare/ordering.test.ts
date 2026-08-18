import { describe, expect, it } from 'vitest';
import { filterHiddenRows, sortRows } from './ordering';
import type { CompareCell, CompareRow } from './types';

function cell(subjectRef: string, representative: number): CompareCell {
  return {
    subjectRef,
    representative,
    isCited: false,
    band: { valueMin: representative, valueMax: representative, valueTypical: representative },
  };
}

function row(overrides: Partial<CompareRow> & { rowKey: string }): CompareRow {
  return {
    propertyKey: overrides.rowKey,
    nameFa: overrides.rowKey,
    nameEn: overrides.rowKey,
    symbol: null,
    unit: null,
    conditions: {},
    groupKey: 'group-a',
    groupNameFa: 'گروه الف',
    groupNameEn: 'Group A',
    cells: [cell('a', 0), cell('b', 1)],
    differenceScore: 0,
    deltaKind: 'absolute',
    deltaValue: 0,
    isOverlapping: false,
    hasCitationAsymmetry: false,
    ...overrides,
  };
}

describe('sortRows', () => {
  describe("mode: 'grouped'", () => {
    it('returns the given order verbatim (a copy, not a mutation)', () => {
      const rows = [row({ rowKey: 'c' }), row({ rowKey: 'a' }), row({ rowKey: 'b' })];
      const result = sortRows(rows, 'grouped');
      expect(result.map((r) => r.rowKey)).toEqual(['c', 'a', 'b']);
      expect(result).not.toBe(rows);
    });
  });

  describe("mode: 'difference'", () => {
    it('sorts by differenceScore descending', () => {
      const rows = [
        row({ rowKey: 'low', differenceScore: 0.2 }),
        row({ rowKey: 'high', differenceScore: 0.9 }),
        row({ rowKey: 'mid', differenceScore: 0.5 }),
      ];
      const result = sortRows(rows, 'difference');
      expect(result.map((r) => r.rowKey)).toEqual(['high', 'mid', 'low']);
    });

    it('does not mutate the input array', () => {
      const rows = [row({ rowKey: 'a', differenceScore: 0.1 }), row({ rowKey: 'b', differenceScore: 0.9 })];
      const original = [...rows];
      sortRows(rows, 'difference');
      expect(rows).toEqual(original);
    });

    it('sinks overlapping rows below non-overlapping rows regardless of differenceScore', () => {
      const rows = [
        row({ rowKey: 'overlapping-but-high-score', differenceScore: 0.99, isOverlapping: true }),
        row({ rowKey: 'clear-winner-low-score', differenceScore: 0.05, isOverlapping: false }),
      ];
      const result = sortRows(rows, 'difference');
      expect(result.map((r) => r.rowKey)).toEqual(['clear-winner-low-score', 'overlapping-but-high-score']);
    });

    it('sorts zero-span rows last, below overlapping-but-different rows', () => {
      const rows = [
        row({ rowKey: 'zero-span', differenceScore: 0, isOverlapping: true }),
        row({ rowKey: 'overlapping', differenceScore: 0.3, isOverlapping: true }),
        row({ rowKey: 'clear', differenceScore: 0.7, isOverlapping: false }),
      ];
      const result = sortRows(rows, 'difference');
      expect(result.map((r) => r.rowKey)).toEqual(['clear', 'overlapping', 'zero-span']);
    });

    it('is stable and deterministic for equal scores across repeated calls, independent of input order', () => {
      const a = row({ rowKey: 'x-tie', differenceScore: 0.5 });
      const b = row({ rowKey: 'y-tie', differenceScore: 0.5 });

      const result1 = sortRows([a, b], 'difference').map((r) => r.rowKey);
      const result2 = sortRows([b, a], 'difference').map((r) => r.rowKey);
      const result3 = sortRows([a, b], 'difference').map((r) => r.rowKey);

      // Deterministic tie-break (rowKey ascending) means both input orders
      // converge on the same output, and repeated calls agree with
      // themselves — no reordering between renders.
      expect(result1).toEqual(['x-tie', 'y-tie']);
      expect(result2).toEqual(['x-tie', 'y-tie']);
      expect(result3).toEqual(result1);
    });

    it('handles an empty row list', () => {
      expect(sortRows([], 'difference')).toEqual([]);
    });
  });
});

describe('filterHiddenRows', () => {
  it('keeps everything when hideIdenticalRows is false', () => {
    const rows = [row({ rowKey: 'a', differenceScore: 0 }), row({ rowKey: 'b', differenceScore: 0.5 })];
    expect(filterHiddenRows(rows, false).map((r) => r.rowKey)).toEqual(['a', 'b']);
  });

  it('drops only zero-span (differenceScore === 0) rows when true', () => {
    const rows = [
      row({ rowKey: 'identical', differenceScore: 0 }),
      row({ rowKey: 'overlapping-but-different', differenceScore: 0.1, isOverlapping: true }),
      row({ rowKey: 'clear', differenceScore: 0.8 }),
    ];
    const result = filterHiddenRows(rows, true);
    expect(result.map((r) => r.rowKey)).toEqual(['overlapping-but-different', 'clear']);
  });

  it('does not mutate the input array', () => {
    const rows = [row({ rowKey: 'a', differenceScore: 0 })];
    const original = [...rows];
    filterHiddenRows(rows, true);
    expect(rows).toEqual(original);
  });
});
