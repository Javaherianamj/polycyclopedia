import { describe, expect, it } from 'vitest';
import { computeDP } from './dp';

describe('computeDP', () => {
  it('computes DPn, Mw and DPw for a typical LDPE-scale input', () => {
    const result = computeDP(50000, 2.0, 28.05);
    expect(result.dpN).toBe(Math.round(50000 / 28.05));
    expect(result.mw).toBe(100000);
    expect(result.dpW).toBe(Math.round(100000 / 28.05));
  });

  it('returns all zeros when Mn is not positive (no crash on empty/invalid input)', () => {
    expect(computeDP(0, 2, 28.05)).toEqual({ dpN: 0, mw: 0, dpW: 0 });
    expect(computeDP(-10, 2, 28.05)).toEqual({ dpN: 0, mw: 0, dpW: 0 });
  });

  it('returns all zeros when the monomer molar mass is not positive', () => {
    expect(computeDP(50000, 2, 0)).toEqual({ dpN: 0, mw: 0, dpW: 0 });
  });

  it('returns dpN but zero Mw/dpW when PDI is zero (Mw is undefined for zero spread by this model)', () => {
    const result = computeDP(50000, 0, 28.05);
    expect(result.dpN).toBe(Math.round(50000 / 28.05));
    expect(result.mw).toBe(0);
    expect(result.dpW).toBe(0);
  });

  it('a PDI of 1 makes Mw equal Mn (monodisperse)', () => {
    const result = computeDP(50000, 1, 28.05);
    expect(result.mw).toBe(50000);
    expect(result.dpW).toBe(result.dpN);
  });
});
