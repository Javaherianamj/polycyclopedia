import { describe, expect, it } from 'vitest';
import { materialHasBranchingRelevance, materialHasTacticity } from './family-scope';

describe('materialHasBranchingRelevance', () => {
  it('is true for every polyolefin (hdpe/ldpe/lldpe/pp all qualify)', () => {
    expect(materialHasBranchingRelevance({ key: 'polyolefins' })).toBe(true);
  });

  it('is false for every other family', () => {
    for (const key of ['styrenics', 'vinyls', 'acrylics', 'polyamides', 'polyesters']) {
      expect(materialHasBranchingRelevance({ key })).toBe(false);
    }
  });
});

describe('materialHasTacticity', () => {
  it('is false for hdpe/ldpe/lldpe -- ethylene has no stereocentre', () => {
    for (const slug of ['hdpe', 'ldpe', 'lldpe']) {
      expect(materialHasTacticity({ key: 'polyolefins' }, slug)).toBe(false);
    }
  });

  it('is true for pp -- the one polyolefin with a stereocentre (propylene)', () => {
    expect(materialHasTacticity({ key: 'polyolefins' }, 'pp')).toBe(true);
  });

  it('is true for every member of styrenics/vinyls/acrylics regardless of slug', () => {
    expect(materialHasTacticity({ key: 'styrenics' }, 'abs')).toBe(true);
    expect(materialHasTacticity({ key: 'styrenics' }, 'ps')).toBe(true);
    expect(materialHasTacticity({ key: 'vinyls' }, 'pvc')).toBe(true);
    expect(materialHasTacticity({ key: 'acrylics' }, 'pmma')).toBe(true);
  });

  it('is false for families outside the scoped set', () => {
    expect(materialHasTacticity({ key: 'polyamides' }, 'pa6')).toBe(false);
    expect(materialHasTacticity({ key: 'polyesters' }, 'pet')).toBe(false);
    expect(materialHasTacticity({ key: 'polycarbonates' }, 'pc')).toBe(false);
  });

  it('does not fall into the polyolefins exception for a non-pp slug even if hypothetically renamed', () => {
    // Guards against a future polyolefin (e.g. a PP copolymer variant) being
    // silently swept in by family key alone -- the exception is the exact
    // slug 'pp', not "any polyolefin that isn't PE".
    expect(materialHasTacticity({ key: 'polyolefins' }, 'pp-copolymer')).toBe(false);
  });
});
