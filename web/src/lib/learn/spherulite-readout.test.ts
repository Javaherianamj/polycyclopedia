import { describe, expect, it } from 'vitest';
import { spheruliteReadoutRows } from './spherulite-readout';
import type { LearnMaterial } from './fetch-learn-materials';

function point(value: number, cited = false): LearnMaterial['density'] {
  return { value, cited, display: `${value}` };
}

function material(overrides: Partial<LearnMaterial> & { slug: string }): LearnMaterial {
  return {
    nameFa: overrides.slug,
    nameEn: overrides.slug,
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

describe('spheruliteReadoutRows', () => {
  it('excludes a material with density but no crystallinity', () => {
    const materials = [material({ slug: 'pp', density: point(0.9) })];
    expect(spheruliteReadoutRows(materials)).toEqual([]);
  });

  it('excludes a material with crystallinity but no density', () => {
    const materials = [material({ slug: 'x', crystallinity: point(50) })];
    expect(spheruliteReadoutRows(materials)).toEqual([]);
  });

  it('includes a material with both values', () => {
    const materials = [material({ slug: 'hdpe', density: point(0.96), crystallinity: point(80) })];
    const rows = spheruliteReadoutRows(materials);
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('hdpe');
  });

  it('sorts highest crystallinity first, so HDPE leads LDPE', () => {
    const materials = [
      material({ slug: 'ldpe', density: point(0.92), crystallinity: point(50) }),
      material({ slug: 'hdpe', density: point(0.96), crystallinity: point(80) }),
      material({ slug: 'pet', density: point(1.33), crystallinity: point(18) }),
    ];
    const rows = spheruliteReadoutRows(materials);
    expect(rows.map((r) => r.slug)).toEqual(['hdpe', 'ldpe', 'pet']);
  });

  it('returns an empty list, never throws, when nothing in the catalog has both values', () => {
    const materials = [material({ slug: 'a' }), material({ slug: 'b', density: point(1) })];
    expect(spheruliteReadoutRows(materials)).toEqual([]);
  });
});
