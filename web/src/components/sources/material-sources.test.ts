import { describe, expect, it } from 'vitest';
import { buildMaterialSourceData } from './material-sources';
import type {
  Citation,
  GradeClass,
  MaterialDetail,
  PropertyDefinition,
  PropertyGroup,
  PropertyValue,
} from '../../lib/api/types';

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

function fixtureCitation(overrides: Partial<Citation> = {}): Citation {
  return {
    id: 'c1',
    locator: { page: 233 },
    role: 'primary',
    extractionMethod: 'manual',
    sourceTitle: 'Polymer Handbook',
    sourceEdition: '4th',
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

function fixtureGradeClass(overrides: Partial<GradeClass> = {}): GradeClass {
  return {
    key: 'film',
    nameFa: 'فیلم',
    nameEn: 'Film',
    descriptionFa: null,
    descriptionEn: null,
    status: 'published',
    propertyGroups: [],
    processingTechniques: [],
    ...overrides,
  };
}

function fixtureMaterial(overrides: Partial<MaterialDetail> = {}): MaterialDetail {
  return {
    slug: 'ldpe',
    nameFa: 'پلی‌اتیلن سبک',
    nameEn: 'LDPE',
    code: null,
    status: 'published',
    overviewFa: null,
    overviewEn: null,
    discoveryYear: null,
    chainType: null,
    field: { key: 'polymers', nameFa: 'پلیمرها', nameEn: 'Polymers' },
    family: { key: 'polyolefins', nameFa: 'پلی‌الفین‌ها', nameEn: 'Polyolefins' },
    coverage: { totalValues: 0, citedValues: 0, coveragePct: 0 },
    identifiers: {},
    propertyGroups: [],
    chemicalResistance: [],
    marketShare: [],
    structure: null,
    processingTechniques: [],
    gradeClasses: [],
    ...overrides,
  };
}

describe('buildMaterialSourceData', () => {
  it('carries a cited material-level value through with its citations intact', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      { key: 'physical', nameFa: 'فیزیکی', nameEn: 'Physical', properties: [fixtureProperty()] },
    ];
    const material = fixtureMaterial({
      propertyGroups: [
        {
          key: 'physical',
          nameFa: 'فیزیکی',
          nameEn: 'Physical',
          properties: [fixtureValue({ citations: [fixtureCitation()] })],
        },
      ],
    });
    const data = buildMaterialSourceData(registry, material);
    expect(data.materialGroups).toHaveLength(1);
    const row = data.materialGroups[0]!.rows[0]!;
    expect(row.state).toBe('cited');
    expect(row.citations).toHaveLength(1);
    expect(row.citations[0]!.sourceTitle).toBe('Polymer Handbook');
  });

  it('still produces a row for a missing candidate property, in the missing state', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      { key: 'physical', nameFa: 'فیزیکی', nameEn: 'Physical', properties: [fixtureProperty()] },
    ];
    const material = fixtureMaterial();
    const data = buildMaterialSourceData(registry, material);
    expect(data.materialGroups[0]!.rows).toHaveLength(1);
    expect(data.materialGroups[0]!.rows[0]!.state).toBe('missing');
    expect(data.materialGroups[0]!.rows[0]!.citations).toEqual([]);
  });

  it('drops a section entirely when it has no candidate rows for this material (never an empty group)', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      {
        key: 'physical',
        nameFa: 'فیزیکی',
        nameEn: 'Physical',
        properties: [fixtureProperty({ appliesToFields: ['composites'] })],
      },
    ];
    const material = fixtureMaterial();
    const data = buildMaterialSourceData(registry, material);
    expect(data.materialGroups).toHaveLength(0);
  });

  it('includes grade-class values, uncited or cited, never as "missing" (D46: no candidate list at that level)', () => {
    const material = fixtureMaterial({
      gradeClasses: [
        fixtureGradeClass({
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
          ],
        }),
      ],
    });
    const data = buildMaterialSourceData([], material);
    expect(data.gradeClasses).toHaveLength(1);
    const rows = data.gradeClasses[0]!.groups[0]!.rows;
    expect(rows.map((r) => r.state)).toEqual(['cited', 'uncited']);
    expect(rows.some((r) => r.state === 'missing')).toBe(false);
  });

  it('folds conditions into a distinct row key so two same-property grade-class rows never collide', () => {
    const material = fixtureMaterial({
      gradeClasses: [
        fixtureGradeClass({
          propertyGroups: [
            {
              key: 'mechanical',
              nameFa: 'مکانیکی',
              nameEn: 'Mechanical',
              properties: [
                fixtureValue({
                  key: 'tensile_strength',
                  conditions: { basis: 'yield' },
                  citations: [fixtureCitation()],
                }),
                fixtureValue({
                  key: 'tensile_strength',
                  conditions: { basis: 'break' },
                  citations: [fixtureCitation()],
                }),
              ],
            },
          ],
        }),
      ],
    });
    const data = buildMaterialSourceData([], material);
    const rowKeys = data.gradeClasses[0]!.groups[0]!.rows.map((r) => r.rowKey);
    expect(new Set(rowKeys).size).toBe(2);
  });

  it('totalRowCount sums material-level and grade-class rows together', () => {
    const registry: PropertyGroup<PropertyDefinition>[] = [
      { key: 'physical', nameFa: 'فیزیکی', nameEn: 'Physical', properties: [fixtureProperty()] },
    ];
    const material = fixtureMaterial({
      gradeClasses: [
        fixtureGradeClass({
          propertyGroups: [
            {
              key: 'physical',
              nameFa: 'فیزیکی',
              nameEn: 'Physical',
              properties: [fixtureValue({ citations: [fixtureCitation()] })],
            },
          ],
        }),
      ],
    });
    const data = buildMaterialSourceData(registry, material);
    expect(data.totalRowCount).toBe(2);
  });

  it('returns totalRowCount 0 for a material with no candidate properties and no grade classes', () => {
    const data = buildMaterialSourceData([], fixtureMaterial());
    expect(data.totalRowCount).toBe(0);
    expect(data.materialGroups).toEqual([]);
    expect(data.gradeClasses).toEqual([]);
  });
});
