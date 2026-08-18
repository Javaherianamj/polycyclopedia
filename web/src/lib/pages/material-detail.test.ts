import { describe, expect, it } from 'vitest';
import {
  buildMaterialSections,
  gradeClassValueCounts,
  propertyValueAsDefinition,
} from './material-detail';
import type { Citation, GradeClass, PropertyDefinition, PropertyGroup, PropertyValue } from '../api/types';

function fixtureProperty(overrides: Partial<PropertyDefinition> = {}): PropertyDefinition {
  return {
    key: 'density',
    nameFa: 'چگالی',
    nameEn: 'Density',
    descriptionFa: null,
    descriptionEn: null,
    symbol: null,
    dataType: 'numeric',
    unit: null,
    allowedUnits: [],
    isSearchable: true,
    isComparable: true,
    appliesToFields: [],
    appliesToFamilies: [],
    ...overrides,
  };
}

function fixtureValue(overrides: Partial<PropertyValue> = {}): PropertyValue {
  return {
    key: 'density',
    nameFa: 'چگالی',
    nameEn: 'Density',
    symbol: null,
    dataType: 'numeric',
    valueMin: 0.91,
    valueMax: 0.925,
    valueTypical: null,
    valueTextFa: null,
    valueTextEn: null,
    valueEnum: null,
    valueBool: null,
    qualifier: null,
    unit: 'g/cm³',
    display: '0.910 - 0.925 g/cm³',
    status: 'unsourced',
    citations: [],
    ...overrides,
  };
}

const material = {
  field: { key: 'polymers', nameFa: 'پلیمرها', nameEn: 'Polymers' },
  family: { key: 'polyolefins', nameFa: 'پلی‌الفین‌ها', nameEn: 'Polyolefins' },
  propertyGroups: [] as PropertyGroup<PropertyValue>[],
};

describe('buildMaterialSections', () => {
  it('renders a present value against its real data, unmodified', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      { key: 'physical', nameFa: 'فیزیکی', nameEn: 'Physical', properties: [fixtureProperty()] },
    ];
    const withValue = {
      ...material,
      propertyGroups: [
        { key: 'physical', nameFa: 'فیزیکی', nameEn: 'Physical', properties: [fixtureValue()] },
      ],
    };
    const sections = buildMaterialSections(registry, withValue);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.rows).toHaveLength(1);
    expect(sections[0]!.rows[0]!.value?.display).toBe('0.910 - 0.925 g/cm³');
  });

  it('renders a candidate property with no value as missing (value: null), not omitted', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      { key: 'physical', nameFa: 'فیزیکی', nameEn: 'Physical', properties: [fixtureProperty()] },
    ];
    const sections = buildMaterialSections(registry, material);
    expect(sections[0]!.rows).toHaveLength(1);
    expect(sections[0]!.rows[0]!.value).toBeNull();
  });

  it('excludes a property entirely when its field scope does not include this material -- not rendered as missing', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      {
        key: 'physical',
        nameFa: 'فیزیکی',
        nameEn: 'Physical',
        properties: [fixtureProperty({ key: 'izod_impact', appliesToFields: ['composites'] })],
      },
    ];
    const sections = buildMaterialSections(registry, material);
    expect(sections[0]!.rows).toHaveLength(0);
  });

  it('excludes a property when its family scope excludes this material, even if field scope is empty (both are ANDed)', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      {
        key: 'physical',
        nameFa: 'فیزیکی',
        nameEn: 'Physical',
        properties: [fixtureProperty({ key: 'x', appliesToFamilies: ['thermosets'] })],
      },
    ];
    const sections = buildMaterialSections(registry, material);
    expect(sections[0]!.rows).toHaveLength(0);
  });

  it('includes a property whose scope names this material explicitly, alongside its family list', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      {
        key: 'physical',
        nameFa: 'فیزیکی',
        nameEn: 'Physical',
        properties: [
          fixtureProperty({ key: 'x', appliesToFamilies: ['polyolefins', 'elastomers'] }),
        ],
      },
    ];
    const sections = buildMaterialSections(registry, material);
    expect(sections[0]!.rows).toHaveLength(1);
  });

  it('preserves registry order for both groups and properties within a group', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      { key: 'thermal', nameFa: 'حرارتی', nameEn: 'Thermal', properties: [] },
      {
        key: 'mechanical',
        nameFa: 'مکانیکی',
        nameEn: 'Mechanical',
        properties: [fixtureProperty({ key: 'b' }), fixtureProperty({ key: 'a' })],
      },
    ];
    const sections = buildMaterialSections(registry, material);
    expect(sections.map((s) => s.key)).toEqual(['thermal', 'mechanical']);
    expect(sections[1]!.rows.map((r) => r.property.key)).toEqual(['b', 'a']);
  });
});

// ---------------------------------------------------------------------------
// FE-3b: grade classes
// ---------------------------------------------------------------------------

function fixtureCitation(overrides: Partial<Citation> = {}): Citation {
  return {
    id: '1',
    locator: { page: 1 },
    role: 'primary',
    extractionMethod: 'manual',
    sourceTitle: 'Polymer Handbook',
    sourceEdition: null,
    ...overrides,
  };
}

function fixtureGradeClass(overrides: Partial<GradeClass> = {}): GradeClass {
  return {
    key: 'injection',
    nameFa: 'تزریقی',
    nameEn: 'Injection',
    descriptionFa: null,
    descriptionEn: null,
    status: 'draft',
    propertyGroups: [],
    processingTechniques: [],
    ...overrides,
  };
}

describe('propertyValueAsDefinition', () => {
  it('adapts a grade-class value into the shape ValueAtom needs, with no description and no scoping', () => {
    const value = fixtureValue({ key: 'density', symbol: 'ρ', unit: 'g/cm³' });
    const def = propertyValueAsDefinition(value);
    expect(def.key).toBe('density');
    expect(def.nameFa).toBe(value.nameFa);
    expect(def.symbol).toBe('ρ');
    expect(def.unit).toBe('g/cm³');
    expect(def.descriptionFa).toBeNull();
    expect(def.descriptionEn).toBeNull();
    expect(def.appliesToFields).toEqual([]);
    expect(def.appliesToFamilies).toEqual([]);
  });
});

describe('gradeClassValueCounts', () => {
  it('counts total values and the cited subset across every property group', () => {
    const gradeClass = fixtureGradeClass({
      propertyGroups: [
        {
          key: 'physical',
          nameFa: 'فیزیکی',
          nameEn: 'Physical',
          properties: [
            fixtureValue({ key: 'density', citations: [fixtureCitation()] }),
            fixtureValue({ key: 'mfi', citations: [] }),
          ],
        },
        {
          key: 'mechanical',
          nameFa: 'مکانیکی',
          nameEn: 'Mechanical',
          properties: [fixtureValue({ key: 'tensile_strength', citations: [fixtureCitation()] })],
        },
      ],
    });
    expect(gradeClassValueCounts(gradeClass)).toEqual({ total: 3, cited: 2 });
  });

  it('returns zero/zero for a grade class with no explicit values', () => {
    expect(gradeClassValueCounts(fixtureGradeClass())).toEqual({ total: 0, cited: 0 });
  });
});
