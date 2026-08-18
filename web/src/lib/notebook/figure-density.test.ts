import { describe, expect, it } from 'vitest';
import { notebookFigureState } from './figure-density';
import type { LearnMaterial } from '../learn/fetch-learn-materials';

// Minimal fixture builder, mirrors causal-graph.test.ts's own style —
// only the fields this module actually reads need real values.
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

describe('notebookFigureState', () => {
  it('returns both nulls when no material is selected (pa6-style zero-data honest degrade)', () => {
    expect(notebookFigureState(null)).toEqual({ density: null, crystallinity: null });
  });

  it('passes density and crystallinity through unchanged when both are present', () => {
    const density = { value: 0.92, cited: true, display: '0.910 - 0.925 g/cm³' };
    const crystallinity = { value: 50, cited: false, display: '40 - 55 %' };
    const m = material({ density, crystallinity });
    expect(notebookFigureState(m)).toEqual({ density, crystallinity });
  });

  it('reports crystallinity absent independently of density (HDPE-shaped: density cited, crystallinity absent)', () => {
    const density = { value: 0.975, cited: true, display: '0.975 g/cm³' };
    const m = material({ density, crystallinity: null });
    expect(notebookFigureState(m)).toEqual({ density, crystallinity: null });
  });
});
