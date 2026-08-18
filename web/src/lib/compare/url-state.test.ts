import { describe, expect, it } from 'vitest';
import { decodeCompareState, encodeCompareState } from './url-state';
import type { CompareState } from './types';

function state(overrides: Partial<CompareState> = {}): CompareState {
  return { subjectRefs: [], sortMode: 'difference', hideIdenticalRows: false, ...overrides };
}

function roundTrip(s: CompareState): CompareState {
  return decodeCompareState(encodeCompareState(s));
}

describe('encodeCompareState', () => {
  it('encodes an empty state with no subjects/app params, default sort explicit', () => {
    const params = encodeCompareState(state());
    expect(params.has('subjects')).toBe(false);
    expect(params.has('app')).toBe(false);
    expect(params.get('sort')).toBe('difference');
    expect(params.has('hide')).toBe(false);
  });

  it('joins multiple subjectRefs with a comma', () => {
    const params = encodeCompareState(state({ subjectRefs: ['ldpe', 'hdpe', 'pp'] }));
    expect(params.get('subjects')).toBe('ldpe,hdpe,pp');
  });

  it('preserves a slash-bearing grade-class ref', () => {
    const params = encodeCompareState(state({ subjectRefs: ['ldpe/film'] }));
    expect(params.get('subjects')).toBe('ldpe/film');
  });

  it('omits app when applicationKey is undefined, includes it when set', () => {
    expect(encodeCompareState(state()).has('app')).toBe(false);
    const params = encodeCompareState(state({ applicationKey: 'chemical_tanks' }));
    expect(params.get('app')).toBe('chemical_tanks');
  });

  it('encodes hideIdenticalRows only when true', () => {
    expect(encodeCompareState(state({ hideIdenticalRows: false })).has('hide')).toBe(false);
    expect(encodeCompareState(state({ hideIdenticalRows: true })).get('hide')).toBe('1');
  });
});

describe('decodeCompareState', () => {
  it('decodes an empty URLSearchParams to the default state', () => {
    const result = decodeCompareState(new URLSearchParams());
    expect(result).toEqual({
      subjectRefs: [],
      applicationKey: undefined,
      sortMode: 'difference',
      hideIdenticalRows: false,
    });
  });

  it('falls back to difference for a missing or malformed sort param', () => {
    expect(decodeCompareState(new URLSearchParams('sort=bogus')).sortMode).toBe('difference');
    expect(decodeCompareState(new URLSearchParams()).sortMode).toBe('difference');
  });

  it('decodes a valid grouped sort mode', () => {
    expect(decodeCompareState(new URLSearchParams('sort=grouped')).sortMode).toBe('grouped');
  });

  it('drops empty ref entries from a malformed subjects param', () => {
    const result = decodeCompareState(new URLSearchParams('subjects=ldpe,,hdpe'));
    expect(result.subjectRefs).toEqual(['ldpe', 'hdpe']);
  });
});

describe('round-trip', () => {
  it('empty state', () => {
    expect(roundTrip(state())).toEqual(state());
  });

  it('single subject, no application, grouped sort', () => {
    const s = state({ subjectRefs: ['ldpe'], sortMode: 'grouped' });
    expect(roundTrip(s)).toEqual(s);
  });

  it('many subjects mixing materials and grade classes', () => {
    const s = state({ subjectRefs: ['ldpe', 'hdpe/injection', 'pp/film', 'pvc'] });
    expect(roundTrip(s)).toEqual(s);
  });

  it('a ref containing a slash round-trips exactly', () => {
    const s = state({ subjectRefs: ['ldpe/film'] });
    const result = roundTrip(s);
    expect(result.subjectRefs).toEqual(['ldpe/film']);
  });

  it('application selected, hideIdenticalRows true, difference sort', () => {
    const s = state({
      subjectRefs: ['ldpe/film', 'hdpe/film'],
      applicationKey: 'chemical_tanks',
      sortMode: 'difference',
      hideIdenticalRows: true,
    });
    expect(roundTrip(s)).toEqual(s);
  });

  it('full combination: many subjects, application, grouped, hide identical', () => {
    const s = state({
      subjectRefs: ['ldpe', 'ldpe/film', 'hdpe', 'hdpe/blow_molding', 'pp/injection'],
      applicationKey: 'food_packaging',
      sortMode: 'grouped',
      hideIdenticalRows: true,
    });
    expect(roundTrip(s)).toEqual(s);
  });

  it('is stable across two encode/decode round trips', () => {
    const s = state({ subjectRefs: ['ldpe/film', 'hdpe'], applicationKey: 'pipes', hideIdenticalRows: true });
    expect(roundTrip(roundTrip(s))).toEqual(s);
  });
});
