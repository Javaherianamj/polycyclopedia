import { describe, expect, it } from 'vitest';
import { classifyPhase, isAmorphous, percentAlong, sliderRange } from './thermal';

const semiCrystalline = { tg: -110, tm: 130, degradationTemp: 300 };
const amorphous = { tg: 100, tm: null, degradationTemp: 380 };

describe('isAmorphous', () => {
  it('is true when tm is absent', () => {
    expect(isAmorphous({ tg: 100, tm: null, degradationTemp: null })).toBe(true);
  });

  it('is true when tm is at or below tg (not a real crystalline melt)', () => {
    expect(isAmorphous({ tg: 100, tm: 100, degradationTemp: null })).toBe(true);
    expect(isAmorphous({ tg: 100, tm: 50, degradationTemp: null })).toBe(true);
  });

  it('is false for a real semi-crystalline material', () => {
    expect(isAmorphous(semiCrystalline)).toBe(false);
  });
});

describe('classifyPhase', () => {
  it('classifies below Tg as glass', () => {
    expect(classifyPhase(-150, semiCrystalline)).toBe('glass');
  });

  it('classifies between Tg and Tm as rubber for a semi-crystalline material', () => {
    expect(classifyPhase(0, semiCrystalline)).toBe('rubber');
  });

  it('classifies between Tm and Td as melt', () => {
    expect(classifyPhase(200, semiCrystalline)).toBe('melt');
  });

  it('classifies at/above Td as burn', () => {
    expect(classifyPhase(300, semiCrystalline)).toBe('burn');
    expect(classifyPhase(400, semiCrystalline)).toBe('burn');
  });

  it('skips the rubber zone entirely for an amorphous material', () => {
    expect(classifyPhase(150, amorphous)).toBe('melt');
    expect(classifyPhase(50, amorphous)).toBe('glass');
  });

  it('never returns burn when degradationTemp is unmeasured', () => {
    const noDegradation = { tg: -110, tm: 130, degradationTemp: null };
    expect(classifyPhase(10000, noDegradation)).toBe('melt');
  });
});

describe('percentAlong', () => {
  it('clamps below the minimum to 0', () => {
    expect(percentAlong(-500, -150, 300)).toBe(0);
  });

  it('clamps above the maximum to 100', () => {
    expect(percentAlong(500, -150, 300)).toBe(100);
  });

  it('places the midpoint at 50', () => {
    expect(percentAlong(75, -150, 300)).toBeCloseTo(50, 0);
  });

  it('returns 0 rather than dividing by zero when max <= min', () => {
    expect(percentAlong(10, 50, 50)).toBe(0);
  });
});

describe('sliderRange', () => {
  it('anchors the upper bound on degradationTemp when present', () => {
    const { max } = sliderRange(semiCrystalline);
    expect(max).toBeGreaterThanOrEqual(semiCrystalline.degradationTemp + 80);
  });

  it('falls back to tm, then tg + 150, when degradationTemp is absent', () => {
    const { max: maxWithTm } = sliderRange({ tg: -110, tm: 130, degradationTemp: null });
    expect(maxWithTm).toBeGreaterThanOrEqual(130 + 80);

    const { max: maxNeither } = sliderRange({ tg: -110, tm: null, degradationTemp: null });
    expect(maxNeither).toBeGreaterThanOrEqual(-110 + 150 + 80);
  });

  it('gives generous headroom below tg', () => {
    const { min } = sliderRange(semiCrystalline);
    expect(min).toBeLessThanOrEqual(-150);
  });
});
