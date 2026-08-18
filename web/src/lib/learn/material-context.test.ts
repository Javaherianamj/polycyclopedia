import { describe, expect, it } from 'vitest';
import { resolveBoundMaterial } from './material-context';
import type { LearnMaterial } from './fetch-learn-materials';

// Minimal fixtures — only `slug` matters to resolveBoundMaterial, but the
// full shape is built out so a future field addition to LearnMaterial does
// not silently make this fixture stop type-checking.
function material(slug: string): LearnMaterial {
  return {
    slug,
    nameFa: slug,
    nameEn: slug,
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
  };
}

describe('resolveBoundMaterial', () => {
  const materials = [material('hdpe'), material('ldpe'), material('pp')];

  it('returns null when no slug was supplied (plain /learn visit)', () => {
    expect(resolveBoundMaterial(materials, undefined)).toBeNull();
  });

  it('resolves a slug present in the catalog', () => {
    expect(resolveBoundMaterial(materials, 'ldpe')).toBe(materials[1]);
  });

  it('returns null, never throws, for an unknown slug (stale/hand-edited URL)', () => {
    expect(resolveBoundMaterial(materials, 'nonsense')).toBeNull();
  });

  it('returns null for an unknown slug even against an empty catalog (fetch not yet ready)', () => {
    expect(resolveBoundMaterial([], 'hdpe')).toBeNull();
  });

  it('is case-sensitive — slugs are not normalised, matching every other Learn URL-state helper', () => {
    expect(resolveBoundMaterial(materials, 'HDPE')).toBeNull();
  });
});
