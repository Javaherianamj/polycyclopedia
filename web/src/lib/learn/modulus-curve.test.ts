import { describe, expect, it } from 'vitest';
import { buildModulusCurve, curveLogEAt, fmtModulus } from './modulus-curve';
import type { ThermalThresholds } from './thermal';

// HDPE-shaped: real Tg/Tm/Td, semicrystalline (tm present and above tg).
const semiCrystalline: ThermalThresholds = { tg: -120, tm: 135, degradationTemp: 400 };

// PMMA-shaped: real Tg above room temperature, amorphous (no tm on record),
// real degradation temp.
const amorphousGlassyAtRoom: ThermalThresholds = { tg: 115, tm: null, degradationTemp: 220 };

// A material with a Tg on record but nothing else — the common case (10 of
// 17 seeded materials have zero property values; several more that DO have
// data still lack tm/degradationTemp).
const tgOnly: ThermalThresholds = { tg: -20, tm: null, degradationTemp: null };

describe('buildModulusCurve — schematic default (no real young modulus)', () => {
  it('draws a glassy plateau at log10(1 GPa) = 0 when unanchored', () => {
    const model = buildModulusCurve(semiCrystalline, null);
    expect(model.anchoredPhase).toBeNull();
    expect(curveLogEAt(model, model.tMin)).toBeCloseTo(0, 5);
  });

  it('holds a shallow plateau between Tg and Tm for a semicrystalline material', () => {
    const model = buildModulusCurve(semiCrystalline, null);
    expect(model.amorphous).toBe(false);
    // Well inside the Tg-Tm gap, away from either transition window, the
    // curve should be flat -- sampling twice a good distance apart inside
    // the gap must agree almost exactly.
    const a = curveLogEAt(model, 0);
    const b = curveLogEAt(model, 100);
    expect(Math.abs(a - b)).toBeLessThan(0.05);
  });

  it('drops roughly one decade through Tg and three-plus decades through Tm', () => {
    const model = buildModulusCurve(semiCrystalline, null);
    const glassy = curveLogEAt(model, model.tMin);
    const plateau = curveLogEAt(model, 0);
    const flow = curveLogEAt(model, 300);
    expect(glassy - plateau).toBeCloseTo(1, 1);
    expect(plateau - flow).toBeGreaterThanOrEqual(3);
  });

  it('never draws a crystalline plateau for an amorphous material', () => {
    const model = buildModulusCurve(amorphousGlassyAtRoom, null);
    expect(model.amorphous).toBe(true);
    // The curve should be monotonically non-increasing with temperature --
    // no shelf held up by crystallites that do not exist for this material.
    const samples = [-50, 0, 50, 100, 150, 250, 350].map((t) => curveLogEAt(model, t));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThanOrEqual(samples[i - 1] + 1e-9);
    }
  });

  it('is monotonically ascending in temperature (well-ordered control points)', () => {
    const model = buildModulusCurve(semiCrystalline, null);
    for (let i = 1; i < model.points.length; i++) {
      expect(model.points[i].t).toBeGreaterThan(model.points[i - 1].t);
    }
  });

  it('never crashes when landmarks are packed unusually close together', () => {
    const tight: ThermalThresholds = { tg: 50, tm: 52, degradationTemp: 53 };
    const model = buildModulusCurve(tight, null);
    expect(model.points.length).toBeGreaterThan(1);
    for (let i = 1; i < model.points.length; i++) {
      expect(model.points[i].t).toBeGreaterThan(model.points[i - 1].t);
    }
  });
});

describe('buildModulusCurve — anchored by a real young modulus', () => {
  it('anchors the glassy plateau directly when room temperature is glassy', () => {
    // PMMA: Tg 115 > 25, so 25C is glassy. Real young modulus ~3.1 GPa.
    const model = buildModulusCurve(amorphousGlassyAtRoom, 3.1);
    expect(model.anchoredPhase).toBe('glass');
    expect(curveLogEAt(model, model.tMin)).toBeCloseTo(Math.log10(3.1), 5);
  });

  it('anchors the crystalline plateau, one decade below the glassy shelf, when room temperature sits on it', () => {
    // HDPE: Tg -120 < 25 < Tm 135, so 25C sits on the crystalline plateau.
    // young_modulus ~1.0 GPa is THIS material's own value for that plateau.
    const model = buildModulusCurve(semiCrystalline, 1.0);
    expect(model.anchoredPhase).toBe('rubber');
    const plateau = curveLogEAt(model, 25);
    const glassy = curveLogEAt(model, model.tMin);
    expect(plateau).toBeCloseTo(Math.log10(1.0), 5);
    expect(glassy - plateau).toBeCloseTo(1, 5);
  });

  it('falls back to the schematic default for a non-positive or missing modulus', () => {
    expect(buildModulusCurve(semiCrystalline, null).anchoredPhase).toBeNull();
    expect(buildModulusCurve(semiCrystalline, 0).anchoredPhase).toBeNull();
    expect(buildModulusCurve(semiCrystalline, -1).anchoredPhase).toBeNull();
  });
});

describe('buildModulusCurve — degradation dashing', () => {
  it('sets dashFrom to the real degradation temperature when known', () => {
    const model = buildModulusCurve(semiCrystalline, null);
    expect(model.dashFrom).toBe(400);
  });

  it('leaves dashFrom null when degradation temperature is unmeasured (the common case)', () => {
    const model = buildModulusCurve(tgOnly, null);
    expect(model.dashFrom).toBeNull();
    // The curve must still be fully defined out to tMax even with no
    // degradation landmark -- R7 is about not inventing a number, not about
    // refusing to render.
    expect(() => curveLogEAt(model, model.tMax)).not.toThrow();
  });
});

describe('curveLogEAt', () => {
  it('clamps below tMin and above tMax rather than extrapolating', () => {
    const model = buildModulusCurve(semiCrystalline, null);
    expect(curveLogEAt(model, model.tMin - 1000)).toBe(curveLogEAt(model, model.tMin));
    expect(curveLogEAt(model, model.tMax + 1000)).toBe(curveLogEAt(model, model.tMax));
  });
});

describe('fmtModulus', () => {
  it('formats >= 1 GPa in GPa', () => {
    expect(fmtModulus(0)).toBe('1.00 GPa');
    expect(fmtModulus(Math.log10(3.1))).toBe('3.10 GPa');
  });

  it('formats sub-GPa, >= 1 kPa in MPa', () => {
    expect(fmtModulus(-1)).toBe('100 MPa');
  });

  it('formats very small values in scientific notation', () => {
    expect(fmtModulus(-8)).toMatch(/e-/);
  });
});
