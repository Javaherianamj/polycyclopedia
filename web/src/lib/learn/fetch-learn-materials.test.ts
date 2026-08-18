import { describe, expect, it, vi } from 'vitest';
import { fetchLearnMaterials } from './fetch-learn-materials';
import type { MaterialDetail, PropertyValue } from '../api/types';

vi.mock('../api/client', () => ({
  getMaterials: vi.fn(),
  getMaterial: vi.fn(),
}));

import { getMaterial, getMaterials } from '../api/client';

function pv(overrides: Partial<PropertyValue> & { key: string }): PropertyValue {
  return {
    nameFa: overrides.key,
    nameEn: overrides.key,
    symbol: null,
    dataType: 'numeric',
    valueMin: null,
    valueMax: null,
    valueTypical: null,
    valueTextFa: null,
    valueTextEn: null,
    valueEnum: null,
    valueBool: null,
    qualifier: null,
    unit: null,
    display: null,
    status: 'unsourced',
    citations: [],
    ...overrides,
  };
}

function detail(slug: string, propertyGroups: MaterialDetail['propertyGroups']): MaterialDetail {
  return {
    slug,
    nameFa: `${slug}-fa`,
    nameEn: `${slug}-en`,
    code: null,
    status: 'draft',
    overviewFa: null,
    overviewEn: null,
    discoveryYear: null,
    chainType: null,
    field: { key: 'thermoplastics', nameFa: '', nameEn: '' },
    family: { key: 'polyolefins', nameFa: '', nameEn: '' },
    coverage: { totalValues: 0, citedValues: 0, coveragePct: 0 },
    identifiers: {},
    propertyGroups,
    chemicalResistance: [],
    marketShare: [],
    structure: null,
    processingTechniques: [],
    gradeClasses: [],
  };
}

describe('fetchLearnMaterials', () => {
  it('propagates a list-fetch error without calling per-material detail', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: false,
      error: { code: 'NETWORK_ERROR', message: 'down' },
    });
    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(false);
    expect(getMaterial).not.toHaveBeenCalled();
  });

  it('extracts a full thermal + molecular profile when every property is present', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'ldpe',
            nameFa: 'ldpe-fa',
            nameEn: 'ldpe-en',
            code: 'LDPE',
            field: 'thermoplastics',
            family: 'polyolefins',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({
      ok: true,
      data: detail('ldpe', [
        {
          key: 'thermal',
          nameFa: '',
          nameEn: '',
          properties: [
            pv({ key: 'tg', valueTypical: -110, display: '-110 °C' }),
            pv({ key: 'tm', valueMin: 105, valueMax: 115, display: '105 - 115 °C' }),
            pv({ key: 'degradation_temp', valueMin: 300, valueMax: 400, display: '300 - 400 °C' }),
          ],
        },
        {
          key: 'academic',
          nameFa: '',
          nameEn: '',
          properties: [
            pv({ key: 'mn', valueMin: 20000, valueMax: 80000 }),
            pv({ key: 'monomer_molar_mass', valueTypical: 28.05 }),
            pv({
              key: 'monomer_name',
              dataType: 'text',
              valueTextFa: 'اتیلن',
              valueTextEn: 'Ethylene',
            }),
          ],
        },
      ]),
    });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(1);
    const [ldpe] = result.data;
    expect(ldpe.thermal).toEqual({
      tg: { value: -110, cited: false, display: '-110 °C' },
      tm: { value: 110, cited: false, display: '105 - 115 °C' },
      degradationTemp: { value: 350, cited: false, display: '300 - 400 °C' },
    });
    expect(ldpe.molecular).toEqual({
      mn: { value: 50000, cited: false, display: null },
      monomerMolarMass: { value: 28.05, cited: false, display: null },
      monomerNameFa: 'اتیلن',
      monomerNameEn: 'Ethylene',
    });
  });

  it('falls back to the other half when a monomer name is translated on one side only', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'ldpe',
            nameFa: 'ldpe-fa',
            nameEn: 'ldpe-en',
            code: 'LDPE',
            field: 'thermoplastics',
            family: 'polyolefins',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({
      ok: true,
      data: detail('ldpe', [
        {
          key: 'academic',
          nameFa: '',
          nameEn: '',
          properties: [
            pv({ key: 'mn', valueMin: 20000, valueMax: 80000 }),
            pv({ key: 'monomer_molar_mass', valueTypical: 28.05 }),
            pv({ key: 'monomer_name', dataType: 'text', valueTextFa: 'اتیلن' }),
          ],
        },
      ]),
    });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [ldpe] = result.data;
    expect(ldpe.molecular?.monomerNameFa).toBe('اتیلن');
    expect(ldpe.molecular?.monomerNameEn).toBe('اتیلن');
  });

  it('leaves thermal null when tg is absent, even if tm is present', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'abs',
            nameFa: '',
            nameEn: '',
            code: null,
            field: 'thermoplastics',
            family: 'styrenics',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({
      ok: true,
      data: detail('abs', [
        {
          key: 'thermal',
          nameFa: '',
          nameEn: '',
          properties: [pv({ key: 'tm', valueTypical: 105 })],
        },
      ]),
    });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]?.thermal).toBeNull();
    expect(result.data[0]?.molecular).toBeNull();
  });

  it('skips a material whose detail fetch fails rather than failing the whole batch', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'broken',
            nameFa: '',
            nameEn: '',
            code: null,
            field: 'thermoplastics',
            family: 'polyolefins',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({
      ok: false,
      error: { code: 'HTTP_500', message: 'boom' },
    });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([]);
  });

  it('step 4: hansen is populated only when all three of d/p/h are present', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'ldpe',
            nameFa: '',
            nameEn: '',
            code: null,
            field: 'thermoplastics',
            family: 'polyolefins',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({
      ok: true,
      data: detail('ldpe', [
        {
          key: 'academic',
          nameFa: '',
          nameEn: '',
          properties: [
            pv({ key: 'hansen_d', valueTypical: 16.0, display: '16.0' }),
            pv({ key: 'hansen_p', valueTypical: 0, display: '0' }),
            pv({ key: 'hansen_h', valueTypical: 0, display: '0' }),
          ],
        },
      ]),
    });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]?.hansen).toEqual({
      d: { value: 16.0, cited: false, display: '16.0' },
      p: { value: 0, cited: false, display: '0' },
      h: { value: 0, cited: false, display: '0' },
    });
  });

  it('step 4: hansen is null when only two of three parameters are present', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'hdpe',
            nameFa: '',
            nameEn: '',
            code: null,
            field: 'thermoplastics',
            family: 'polyolefins',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({
      ok: true,
      data: detail('hdpe', [
        {
          key: 'academic',
          nameFa: '',
          nameEn: '',
          properties: [
            pv({ key: 'hansen_d', valueTypical: 16.5 }),
            pv({ key: 'hansen_p', valueTypical: 0 }),
          ],
        },
      ]),
    });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0]?.hansen).toBeNull();
  });

  it('L2/MAP: extracts young modulus, tensile/elongation, izod, mfi and process temp independently', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'hdpe',
            nameFa: '',
            nameEn: '',
            code: null,
            field: 'thermoplastics',
            family: 'polyolefins',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({
      ok: true,
      data: detail('hdpe', [
        {
          key: 'mechanical',
          nameFa: '',
          nameEn: '',
          properties: [
            pv({ key: 'young_modulus', valueMin: 0.5, valueMax: 1.5, display: '0.5 - 1.5 GPa' }),
            pv({ key: 'tensile_strength', valueMin: 25, valueMax: 40 }),
            pv({ key: 'elongation_at_break', valueMin: 50, valueMax: 600 }),
            // izod_impact deliberately absent -- must resolve to null, not
            // throw or fall back to a neighbouring property.
          ],
        },
        {
          key: 'processing',
          nameFa: '',
          nameEn: '',
          properties: [pv({ key: 'mfi', valueMin: 0.02, valueMax: 20 })],
          // process_temp deliberately absent from this group too.
        },
      ]),
    });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [hdpe] = result.data;
    expect(hdpe.youngModulus).toEqual({ value: 1, cited: false, display: '0.5 - 1.5 GPa' });
    expect(hdpe.tensileStrength).toEqual({ value: 32.5, cited: false, display: null });
    expect(hdpe.elongationAtBreak).toEqual({ value: 325, cited: false, display: null });
    expect(hdpe.izodImpact).toBeNull();
    expect(hdpe.mfi).toEqual({ value: 10.01, cited: false, display: null });
    expect(hdpe.processTemp).toBeNull();
  });

  it('L2/MAP: every new field is null for a material with zero property values (the common case)', async () => {
    vi.mocked(getMaterials).mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            slug: 'ps',
            nameFa: '',
            nameEn: '',
            code: null,
            field: 'thermoplastics',
            family: 'styrenics',
            familyNameFa: '',
            familyNameEn: '',
            status: 'draft',
            citationCoverage: 0,
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      },
    });
    vi.mocked(getMaterial).mockResolvedValue({ ok: true, data: detail('ps', []) });

    const result = await fetchLearnMaterials();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [ps] = result.data;
    expect(ps.youngModulus).toBeNull();
    expect(ps.tensileStrength).toBeNull();
    expect(ps.elongationAtBreak).toBeNull();
    expect(ps.izodImpact).toBeNull();
    expect(ps.mfi).toBeNull();
    expect(ps.processTemp).toBeNull();
  });
});
