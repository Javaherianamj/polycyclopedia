import { describe, expect, it } from 'vitest';
import {
  CAUSE_DEFAULTS,
  CAUSE_KEYS,
  CAUSE_LAYOUT,
  DERIVED_KEYS,
  EDGES,
  OUTCOME_KEYS,
  causePuckY,
  causeValueFromY,
  computeOutcomes,
  computeTrend,
  downstreamOf,
  measuredPointFor,
  nodePoint,
  provenanceMark,
  type CauseState,
} from './causal-graph';
import type { LearnMaterial } from './fetch-learn-materials';

// Minimal LearnMaterial fixture builder — only the fields causal-graph.ts
// actually reads, mirrors fetch-learn-materials.test.ts's own fixture style.
function material(overrides: Partial<LearnMaterial> = {}): LearnMaterial {
  return {
    slug: 'test',
    nameFa: 'تست',
    nameEn: 'Test',
    family: { key: 'polyolefins', nameFa: '', nameEn: '' },
    chainType: null,
    thermal: null,
    molecular: null,
    density: null,
    crystallinity: null,
    hansen: null,
    hspCorrelation: null,
    youngModulus: null,
    tensileStrength: null,
    elongationAtBreak: null,
    izodImpact: null,
    mfi: null,
    processTemp: null,
    ...overrides,
  };
}

describe('computeTrend — monotonicity (the part a reader will trust)', () => {
  it('more branching strictly lowers crystallinity, all else equal', () => {
    const low = computeTrend({ branching: 0.1, cooling: 0.4, mw: 0.5 });
    const high = computeTrend({ branching: 0.9, cooling: 0.4, mw: 0.5 });
    expect(high.cryst).toBeLessThan(low.cryst);
  });

  it('faster cooling strictly lowers crystallinity, all else equal', () => {
    const slow = computeTrend({ branching: 0.5, cooling: 0.1, mw: 0.5 });
    const fast = computeTrend({ branching: 0.5, cooling: 0.9, mw: 0.5 });
    expect(fast.cryst).toBeLessThan(slow.cryst);
  });

  it('density, Tm, modulus and tensile all rise when crystallinity rises', () => {
    const lowCryst = computeTrend({ branching: 0.9, cooling: 0.9, mw: 0.5 });
    const highCryst = computeTrend({ branching: 0.1, cooling: 0.1, mw: 0.5 });
    expect(highCryst.density).toBeGreaterThan(lowCryst.density);
    expect(highCryst.tm).toBeGreaterThan(lowCryst.tm);
    expect(highCryst.modulus).toBeGreaterThan(lowCryst.modulus);
    expect(highCryst.tensile).toBeGreaterThan(lowCryst.tensile);
  });

  it('density and Tm always equal the crystallinity fraction exactly (direct 1:1 reading)', () => {
    const t = computeTrend({ branching: 0.3, cooling: 0.6, mw: 0.2 });
    expect(t.density).toBe(t.cryst);
    expect(t.tm).toBe(t.cryst);
  });

  it('higher Mw raises modulus and tensile even at fixed crystallinity', () => {
    const lowMw = computeTrend({ branching: 0.5, cooling: 0.5, mw: 0.1 });
    const highMw = computeTrend({ branching: 0.5, cooling: 0.5, mw: 0.9 });
    expect(highMw.modulus).toBeGreaterThan(lowMw.modulus);
    expect(highMw.tensile).toBeGreaterThan(lowMw.tensile);
  });

  it('every trend fraction stays within [0, 1] across the full input space', () => {
    for (const branching of [0, 0.25, 0.5, 0.75, 1]) {
      for (const cooling of [0, 0.25, 0.5, 0.75, 1]) {
        for (const mw of [0, 0.25, 0.5, 0.75, 1]) {
          const t = computeTrend({ branching, cooling, mw });
          for (const key of DERIVED_KEYS) {
            expect(t[key]).toBeGreaterThanOrEqual(0);
            expect(t[key]).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});

describe('computeOutcomes — mutually exclusive processing routes', () => {
  it('film and injection are never both suited at once', () => {
    for (const mw of [0, 0.2, 0.49, 0.5, 0.51, 0.8, 1]) {
      const state: CauseState = { branching: 0.5, cooling: 0.5, mw };
      const trend = computeTrend(state);
      const outcomes = computeOutcomes(trend, state);
      expect(outcomes.film && outcomes.inj).toBe(false);
    }
  });

  it('film and injection are never both UNsuited at once either — exactly one always holds', () => {
    for (const mw of [0, 0.3, 0.5, 0.7, 1]) {
      const state: CauseState = { branching: 0.5, cooling: 0.5, mw };
      const trend = computeTrend(state);
      const outcomes = computeOutcomes(trend, state);
      expect(outcomes.film || outcomes.inj).toBe(true);
    }
  });

  it('cable insulation favours the lower-density (less crystalline) regime', () => {
    const state: CauseState = { branching: 0.9, cooling: 0.9, mw: 0.5 }; // low crystallinity -> low density
    const outcomes = computeOutcomes(computeTrend(state), state);
    expect(outcomes.cable).toBe(true);

    const rigidState: CauseState = { branching: 0, cooling: 0, mw: 0.5 }; // high crystallinity -> high density
    const rigidOutcomes = computeOutcomes(computeTrend(rigidState), rigidState);
    expect(rigidOutcomes.cable).toBe(false);
  });
});

describe('downstreamOf — reachability drives the pulse animation', () => {
  it('branching reaches crystallinity and everything crystallinity feeds', () => {
    const reach = downstreamOf('branching');
    expect(reach.has('cryst')).toBe(true);
    expect(reach.has('density')).toBe(true);
    expect(reach.has('tm')).toBe(true);
    expect(reach.has('modulus')).toBe(true);
    expect(reach.has('tensile')).toBe(true);
    expect(reach.has('cable')).toBe(true);
    // branching never reaches Mw's own direct outcomes
    expect(reach.has('film')).toBe(false);
    expect(reach.has('inj')).toBe(false);
    // a node is never counted as downstream of itself
    expect(reach.has('branching')).toBe(false);
  });

  it('mw reaches tensile, film and inj but not crystallinity or density', () => {
    const reach = downstreamOf('mw');
    expect(reach.has('tensile')).toBe(true);
    expect(reach.has('film')).toBe(true);
    expect(reach.has('inj')).toBe(true);
    expect(reach.has('cryst')).toBe(false);
    expect(reach.has('density')).toBe(false);
  });

  it('a terminal outcome node reaches nothing', () => {
    expect(downstreamOf('film').size).toBe(0);
    expect(downstreamOf('cable').size).toBe(0);
  });
});

describe('EDGES — structural sanity', () => {
  const allKeys = new Set([...CAUSE_KEYS, ...DERIVED_KEYS, ...OUTCOME_KEYS]);

  it('every edge endpoint names a real node', () => {
    for (const e of EDGES) {
      expect(allKeys.has(e.from)).toBe(true);
      expect(allKeys.has(e.to)).toBe(true);
    }
  });

  it('no edge starts at an outcome (outcomes are terminal, per spec)', () => {
    for (const e of EDGES) {
      expect(OUTCOME_KEYS.includes(e.from as (typeof OUTCOME_KEYS)[number])).toBe(false);
    }
  });

  it('the graph is acyclic (downstreamOf terminates and never includes the origin)', () => {
    for (const key of allKeys) {
      const reach = downstreamOf(key);
      expect(reach.has(key)).toBe(false);
    }
  });
});

describe('causePuckY / causeValueFromY — the drag track is a clean round trip', () => {
  it('round-trips a mid-range value through the track geometry', () => {
    for (const key of CAUSE_KEYS) {
      for (const value of [0, 0.25, 0.5, 0.75, 1]) {
        const y = causePuckY(key, value);
        const back = causeValueFromY(key, y);
        expect(back).toBeCloseTo(value, 6);
      }
    }
  });

  it('a higher slider value sits closer to the track TOP (smaller y)', () => {
    for (const key of CAUSE_KEYS) {
      const yLow = causePuckY(key, 0);
      const yHigh = causePuckY(key, 1);
      expect(yHigh).toBeLessThan(yLow);
      expect(yHigh).toBeCloseTo(CAUSE_LAYOUT[key].trackTop, 6);
      expect(yLow).toBeCloseTo(CAUSE_LAYOUT[key].trackBottom, 6);
    }
  });

  it('clamps out-of-range y back onto the track', () => {
    for (const key of CAUSE_KEYS) {
      expect(causeValueFromY(key, -5)).toBeLessThanOrEqual(1);
      expect(causeValueFromY(key, 5)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('nodePoint — causes move with drag state, derived/outcome nodes never do', () => {
  it('a cause node y changes with its own state, not with a different cause’s state', () => {
    const a: CauseState = { ...CAUSE_DEFAULTS, branching: 0 };
    const b: CauseState = { ...CAUSE_DEFAULTS, branching: 1 };
    expect(nodePoint('branching', a).y).not.toBe(nodePoint('branching', b).y);
    expect(nodePoint('cooling', a).y).toBe(nodePoint('cooling', b).y);
  });

  it('derived and outcome nodes are fixed regardless of cause state', () => {
    const a: CauseState = { branching: 0, cooling: 0, mw: 0 };
    const b: CauseState = { branching: 1, cooling: 1, mw: 1 };
    for (const key of [...DERIVED_KEYS, ...OUTCOME_KEYS]) {
      expect(nodePoint(key, a)).toEqual(nodePoint(key, b));
    }
  });
});

describe('measuredPointFor / provenanceMark — the OTHER half of the honesty split', () => {
  it('returns null for every key when no material is bound', () => {
    for (const key of DERIVED_KEYS) {
      expect(measuredPointFor(null, key)).toBeNull();
      expect(provenanceMark(measuredPointFor(null, key))).toBe('nodata');
    }
  });

  it('reads crystallinity/density/youngModulus/tensileStrength straight from the material', () => {
    const m = material({
      crystallinity: { value: 80, cited: false, display: '70 - 90' },
      density: { value: 0.975, cited: true, display: '0.975' },
      youngModulus: { value: 1, cited: false, display: '0.5 - 1.5' },
      tensileStrength: { value: 32.5, cited: false, display: '25 - 40' },
    });
    expect(measuredPointFor(m, 'cryst')?.value).toBe(80);
    expect(provenanceMark(measuredPointFor(m, 'cryst'))).toBe('unsourced');
    expect(measuredPointFor(m, 'density')?.value).toBe(0.975);
    expect(provenanceMark(measuredPointFor(m, 'density'))).toBe('sourced');
    expect(measuredPointFor(m, 'modulus')?.value).toBe(1);
    expect(measuredPointFor(m, 'tensile')?.value).toBe(32.5);
  });

  it('reads Tm from thermal.tm, not a top-level field, and is null when thermal is absent', () => {
    const withTm = material({
      thermal: {
        tg: { value: -120, cited: false, display: null },
        tm: { value: 135.5, cited: true, display: '133 - 138' },
        degradationTemp: null,
      },
    });
    expect(measuredPointFor(withTm, 'tm')?.value).toBe(135.5);
    expect(provenanceMark(measuredPointFor(withTm, 'tm'))).toBe('sourced');

    const withoutThermal = material();
    expect(measuredPointFor(withoutThermal, 'tm')).toBeNull();
    expect(provenanceMark(measuredPointFor(withoutThermal, 'tm'))).toBe('nodata');
  });

  it('a zero-data material (the PA6 case) reports nodata for every derived node', () => {
    const zeroData = material(); // every field null, exactly like PA6's live API response
    for (const key of DERIVED_KEYS) {
      expect(measuredPointFor(zeroData, key)).toBeNull();
      expect(provenanceMark(measuredPointFor(zeroData, key))).toBe('nodata');
    }
  });
});
