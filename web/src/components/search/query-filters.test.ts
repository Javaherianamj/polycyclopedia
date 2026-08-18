import { describe, expect, it } from 'vitest';
import { buildPrefillFilters, tokenToFilter } from './query-filters';
import type { SearchIndexMaterial, SearchIndexProperty } from '../../lib/search/types';

const tg: SearchIndexProperty = {
  key: 'tg',
  nameFa: 'دمای انتقال شیشه‌ای',
  nameEn: 'Glass transition temperature',
  symbol: 'Tg',
  unit: '°C',
  dataType: 'numeric',
  observedMin: -120,
  observedMax: 260,
  aliasTokens: ['tg'],
};

const tensile: SearchIndexProperty = {
  key: 'tensile_strength',
  nameFa: 'استحکام کششی',
  nameEn: 'Tensile strength',
  symbol: null,
  unit: 'MPa',
  dataType: 'numeric',
  observedMin: 5,
  observedMax: 90,
  aliasTokens: ['tensile_strength', 'tensile'],
};

describe('tokenToFilter', () => {
  it('returns null for an unrecognized token', () => {
    expect(tokenToFilter({ kind: 'unrecognized', raw: 'wat' }, [tg])).toBeNull();
  });

  it('returns null when the property is not in the eligible set', () => {
    expect(
      tokenToFilter({ kind: 'comparison', propertyKey: 'density', op: '>', value: 1 }, [tg]),
    ).toBeNull();
  });

  it('passes a range token through unchanged', () => {
    expect(
      tokenToFilter({ kind: 'range', propertyKey: 'tensile_strength', min: 40, max: 80 }, [tensile]),
    ).toEqual({ propertyKey: 'tensile_strength', min: 40, max: 80 });
  });

  it('bounds a > comparison at the property observed max', () => {
    expect(tokenToFilter({ kind: 'comparison', propertyKey: 'tg', op: '>', value: 100 }, [tg])).toEqual({
      propertyKey: 'tg',
      min: 100,
      max: 260,
    });
  });

  it('bounds a < comparison at the property observed min', () => {
    expect(tokenToFilter({ kind: 'comparison', propertyKey: 'tg', op: '<', value: 100 }, [tg])).toEqual({
      propertyKey: 'tg',
      min: -120,
      max: 100,
    });
  });

  it('turns = into a single-point range', () => {
    expect(tokenToFilter({ kind: 'comparison', propertyKey: 'tg', op: '=', value: 100 }, [tg])).toEqual({
      propertyKey: 'tg',
      min: 100,
      max: 100,
    });
  });
});

describe('buildPrefillFilters', () => {
  const ldpe: SearchIndexMaterial = {
    slug: 'ldpe',
    nameFa: 'پلی‌اتیلن با چگالی پایین',
    nameEn: 'LDPE',
    familyKey: 'polyolefins',
    familyNameFa: 'پلی‌اولفین‌ها',
    familyNameEn: 'Polyolefins',
    citationCoveragePct: 80,
    values: {
      tg: { valueMin: -30, valueMax: -20, valueTypical: -25 },
      density: { valueMin: 0.91, valueMax: 0.94, valueTypical: 0.92 },
    },
  };

  it('builds one filter per eligible property the material has a value for', () => {
    expect(buildPrefillFilters(ldpe, [tg])).toEqual([{ propertyKey: 'tg', min: -30, max: -20 }]);
  });

  it('excludes properties the material has no value for, even if eligible', () => {
    expect(buildPrefillFilters(ldpe, [tensile])).toEqual([]);
  });

  it('excludes values for properties not in the eligible set', () => {
    // `density` is on the material but not passed in as an eligible property.
    expect(buildPrefillFilters(ldpe, [tg])).not.toContainEqual(
      expect.objectContaining({ propertyKey: 'density' }),
    );
  });
});
