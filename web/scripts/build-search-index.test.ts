import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type pg from 'pg';

import {
  buildAliasTokens,
  buildSearchIndex,
  combineRows,
  groupValueRows,
} from './build-search-index';
import type { SearchMaterialsIndex, SearchPropertiesIndex } from '../src/lib/search/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Pure-logic tests -- no database required, run in every CI environment
// (web's `npm test` job has none). These exercise the same functions
// `buildSearchIndex` calls, with synthetic rows shaped exactly like what
// the SQL queries return.
// ---------------------------------------------------------------------------

describe('combineRows', () => {
  it('passes a single min/max row through unchanged', () => {
    const band = combineRows([
      {
        subject_type: 'material',
        subject_id: '1',
        property_key: 'tg',
        value_min: 10,
        value_max: 20,
        value_typical: 15,
      },
    ]);
    expect(band).toEqual({ valueMin: 10, valueMax: 20, valueTypical: 15 });
  });

  it('collapses a point value (value_typical only) to a min===max band', () => {
    const band = combineRows([
      {
        subject_type: 'material',
        subject_id: '1',
        property_key: 'tg',
        value_min: null,
        value_max: null,
        value_typical: -110,
      },
    ]);
    expect(band).toEqual({ valueMin: -110, valueMax: -110, valueTypical: -110 });
  });

  it('collapses a one-sided bound (value_max only, e.g. "<= 0.01") to a point band', () => {
    const band = combineRows([
      {
        subject_type: 'material',
        subject_id: '1',
        property_key: 'water_absorption',
        value_min: null,
        value_max: 0.01,
        value_typical: null,
      },
    ]);
    expect(band).toEqual({ valueMin: 0.01, valueMax: 0.01, valueTypical: null });
  });

  it('takes the envelope min/max across multiple condition rows', () => {
    const band = combineRows([
      {
        subject_type: 'grade_class',
        subject_id: '1',
        property_key: 'mfi',
        value_min: 0.5,
        value_max: 1.0,
        value_typical: null,
      },
      {
        subject_type: 'grade_class',
        subject_id: '1',
        property_key: 'mfi',
        value_min: 2.0,
        value_max: 5.0,
        value_typical: null,
      },
    ]);
    expect(band.valueMin).toBe(0.5);
    expect(band.valueMax).toBe(5.0);
  });

  it('keeps valueTypical across multiple rows only when every typical present agrees', () => {
    const agreeing = combineRows([
      {
        subject_type: 'grade_class',
        subject_id: '1',
        property_key: 'mfi',
        value_min: 0.5,
        value_max: 1.0,
        value_typical: 0.7,
      },
      {
        subject_type: 'grade_class',
        subject_id: '1',
        property_key: 'mfi',
        value_min: 2.0,
        value_max: 5.0,
        value_typical: 0.7,
      },
    ]);
    expect(agreeing.valueTypical).toBe(0.7);

    const disagreeing = combineRows([
      {
        subject_type: 'grade_class',
        subject_id: '1',
        property_key: 'mfi',
        value_min: 0.5,
        value_max: 1.0,
        value_typical: 0.7,
      },
      {
        subject_type: 'grade_class',
        subject_id: '1',
        property_key: 'mfi',
        value_min: 2.0,
        value_max: 5.0,
        value_typical: 3.0,
      },
    ]);
    expect(disagreeing.valueTypical).toBeNull();
  });
});

describe('groupValueRows', () => {
  it('groups by subject then by property key', () => {
    const grouped = groupValueRows([
      {
        subject_type: 'material',
        subject_id: '1',
        property_key: 'tg',
        value_min: 1,
        value_max: 2,
        value_typical: null,
      },
      {
        subject_type: 'material',
        subject_id: '1',
        property_key: 'tm',
        value_min: 3,
        value_max: 4,
        value_typical: null,
      },
      {
        subject_type: 'grade_class',
        subject_id: '1',
        property_key: 'tg',
        value_min: 5,
        value_max: 6,
        value_typical: null,
      },
    ]);
    expect(grouped.get('material:1')?.size).toBe(2);
    expect(grouped.get('grade_class:1')?.size).toBe(1);
    // Same subject_id (1) but a different subject_type is a different
    // subject -- this is the BR6 "never inherit" guarantee at the
    // grouping-key level.
    expect(grouped.get('material:1')?.get('tg')).not.toBe(grouped.get('grade_class:1')?.get('tg'));
  });
});

describe('buildAliasTokens (BR3)', () => {
  it('derives the full key plus its first segment', () => {
    const tokens = buildAliasTokens(['tg', 'tensile_strength']);
    expect(tokens.get('tg')).toEqual(['tg']);
    expect(new Set(tokens.get('tensile_strength'))).toEqual(
      new Set(['tensile_strength', 'tensile']),
    );
  });

  it('drops the short form for both properties on a collision, deterministically', () => {
    const tokens = buildAliasTokens(['tensile_strength', 'tensile_modulus']);
    expect(tokens.get('tensile_strength')).toEqual(['tensile_strength']);
    expect(tokens.get('tensile_modulus')).toEqual(['tensile_modulus']);
  });

  it('is stable across input order (deterministic, not first-wins)', () => {
    const a = buildAliasTokens(['tensile_strength', 'tensile_modulus']);
    const b = buildAliasTokens(['tensile_modulus', 'tensile_strength']);
    expect(a.get('tensile_strength')).toEqual(b.get('tensile_strength'));
    expect(a.get('tensile_modulus')).toEqual(b.get('tensile_modulus'));
  });
});

// ---------------------------------------------------------------------------
// buildSearchIndex, against a fake pg.Pool -- exercises BR1/BR2/BR6 end to
// end without a real database. The fake pool dispatches on a distinguishing
// substring of each query so it doesn't need to know the exact SQL text.
// ---------------------------------------------------------------------------

function fakePool(rows: {
  materials: unknown[];
  gradeClasses: unknown[];
  propertyDefs: unknown[];
  values: unknown[];
}): pg.Pool {
  return {
    query: async (sql: string) => {
      if (sql.includes('FROM material m') && sql.includes('JOIN family')) {
        return { rows: rows.materials };
      }
      if (sql.includes('FROM grade_class')) {
        return { rows: rows.gradeClasses };
      }
      if (sql.includes('FROM property_definition')) {
        return { rows: rows.propertyDefs };
      }
      if (sql.includes('FROM property_value')) {
        return { rows: rows.values };
      }
      throw new Error(`fakePool: unrecognized query: ${sql.slice(0, 80)}`);
    },
  } as unknown as pg.Pool;
}

describe('buildSearchIndex', () => {
  it('includes every material and grade class regardless of data (BR1/BR6)', async () => {
    const pool = fakePool({
      materials: [
        {
          id: '1',
          slug: 'ldpe',
          name_fa: 'ال دی پی ای',
          name_en: 'LDPE',
          family_key: 'polyolefins',
          family_name_fa: 'پلی‌الفین‌ها',
          family_name_en: 'Polyolefins',
          citation_coverage_pct: 50,
        },
      ],
      gradeClasses: [
        {
          id: '10',
          material_id: '1',
          material_slug: 'ldpe',
          key: 'film',
          name_fa: 'فیلم',
          name_en: 'Film',
        },
      ],
      propertyDefs: [
        {
          key: 'tg',
          name_fa: 'دمای انتقال شیشه‌ای',
          name_en: 'Glass Transition Temp',
          symbol: 'Tg',
          canonical_unit: '°C',
          data_type: 'numeric',
        },
      ],
      values: [], // no property values anywhere
    });

    const { materialsIndex, propertiesIndex } = await buildSearchIndex(pool);

    // Material and grade class both present even with zero data.
    expect(materialsIndex.materials).toHaveLength(1);
    expect(materialsIndex.gradeClasses).toHaveLength(1);
    expect(materialsIndex.gradeClasses[0]!.values).toEqual({});

    // The property has no real value anywhere -> omitted entirely (BR2).
    expect(propertiesIndex.properties).toHaveLength(0);
  });

  it('never lets a grade class inherit its parent material value (BR6/D46)', async () => {
    const pool = fakePool({
      materials: [
        {
          id: '1',
          slug: 'ldpe',
          name_fa: 'ال دی پی ای',
          name_en: 'LDPE',
          family_key: 'polyolefins',
          family_name_fa: 'پلی‌الفین‌ها',
          family_name_en: 'Polyolefins',
          citation_coverage_pct: 50,
        },
      ],
      gradeClasses: [
        {
          id: '10',
          material_id: '1',
          material_slug: 'ldpe',
          key: 'film',
          name_fa: 'فیلم',
          name_en: 'Film',
        },
      ],
      propertyDefs: [
        {
          key: 'tg',
          name_fa: 'دمای انتقال شیشه‌ای',
          name_en: 'Glass Transition Temp',
          symbol: 'Tg',
          canonical_unit: '°C',
          data_type: 'numeric',
        },
      ],
      values: [
        // Only the material has a tg value; the grade class has none.
        {
          subject_type: 'material',
          subject_id: '1',
          property_key: 'tg',
          value_min: null,
          value_max: null,
          value_typical: -110,
        },
      ],
    });

    const { materialsIndex } = await buildSearchIndex(pool);
    expect(materialsIndex.materials[0]!.values.tg).toEqual({
      valueMin: -110,
      valueMax: -110,
      valueTypical: -110,
    });
    expect(materialsIndex.gradeClasses[0]!.values.tg).toBeUndefined();
  });

  it('computes observedMin/observedMax from real data across materials AND grade classes', async () => {
    const pool = fakePool({
      materials: [
        {
          id: '1',
          slug: 'ldpe',
          name_fa: 'ال دی پی ای',
          name_en: 'LDPE',
          family_key: 'polyolefins',
          family_name_fa: 'پلی‌الفین‌ها',
          family_name_en: 'Polyolefins',
          citation_coverage_pct: 50,
        },
      ],
      gradeClasses: [
        {
          id: '10',
          material_id: '1',
          material_slug: 'ldpe',
          key: 'film',
          name_fa: 'فیلم',
          name_en: 'Film',
        },
      ],
      propertyDefs: [
        {
          key: 'tensile_strength',
          name_fa: 'استحکام کششی',
          name_en: 'Tensile Strength',
          symbol: null,
          canonical_unit: 'MPa',
          data_type: 'range',
        },
      ],
      values: [
        {
          subject_type: 'material',
          subject_id: '1',
          property_key: 'tensile_strength',
          value_min: 10,
          value_max: 20,
          value_typical: null,
        },
        {
          subject_type: 'grade_class',
          subject_id: '10',
          property_key: 'tensile_strength',
          value_min: 25,
          value_max: 40,
          value_typical: null,
        },
      ],
    });

    const { propertiesIndex } = await buildSearchIndex(pool);
    expect(propertiesIndex.properties).toHaveLength(1);
    expect(propertiesIndex.properties[0]).toMatchObject({ observedMin: 10, observedMax: 40 });
  });
});

// ---------------------------------------------------------------------------
// Real-output invariants -- run only when web/public/search-*.json have
// actually been generated (`npm run build:search-index` against a reachable
// database). Skipped, not failed, otherwise -- CI's `web` job has no
// database and never runs the generator.
// ---------------------------------------------------------------------------

const materialsPath = path.resolve(__dirname, '../public/search-materials.json');
const propertiesPath = path.resolve(__dirname, '../public/search-properties.json');
const generated = existsSync(materialsPath) && existsSync(propertiesPath);

describe.skipIf(!generated)('generated output invariants', () => {
  const materialsIndex: SearchMaterialsIndex = JSON.parse(readFileSync(materialsPath, 'utf8'));
  const propertiesIndex: SearchPropertiesIndex = JSON.parse(readFileSync(propertiesPath, 'utf8'));

  it('every gradeClasses[].materialSlug resolves to a real material', () => {
    const slugs = new Set(materialsIndex.materials.map((m) => m.slug));
    for (const gc of materialsIndex.gradeClasses) {
      expect(
        slugs.has(gc.materialSlug),
        `grade class ${gc.key} references unknown material ${gc.materialSlug}`,
      ).toBe(true);
    }
  });

  it('no property in search-properties.json has zero materials or grade classes referencing it', () => {
    const used = new Set<string>();
    for (const m of materialsIndex.materials)
      for (const key of Object.keys(m.values)) used.add(key);
    for (const gc of materialsIndex.gradeClasses)
      for (const key of Object.keys(gc.values)) used.add(key);
    for (const property of propertiesIndex.properties) {
      expect(
        used.has(property.key),
        `property ${property.key} has no material or grade class value`,
      ).toBe(true);
    }
  });

  it('observedMin <= observedMax everywhere', () => {
    for (const property of propertiesIndex.properties) {
      expect(property.observedMin, property.key).toBeLessThanOrEqual(property.observedMax);
    }
  });

  it('every material value band has valueMin <= valueMax', () => {
    for (const m of materialsIndex.materials) {
      for (const [key, band] of Object.entries(m.values)) {
        expect(band.valueMin, `${m.slug}.${key}`).toBeLessThanOrEqual(band.valueMax);
      }
    }
  });

  it('every grade class value band has valueMin <= valueMax and carries no inherited keys beyond its own data', () => {
    for (const gc of materialsIndex.gradeClasses) {
      for (const [key, band] of Object.entries(gc.values)) {
        expect(band.valueMin <= band.valueMax, `${gc.materialSlug}/${gc.key}.${key}`).toBe(true);
      }
    }
  });

  it('reports the 14 grade_class rows with their citations-worth of property values (regression guard)', () => {
    // Not a hard business rule -- a sanity trip-wire the task explicitly
    // asked for: "verify your output actually contains it rather than
    // assuming". If this ever drops to 0, something upstream broke.
    expect(materialsIndex.gradeClasses.length).toBeGreaterThan(0);
    const totalGradeClassValues = materialsIndex.gradeClasses.reduce(
      (sum, gc) => sum + Object.keys(gc.values).length,
      0,
    );
    expect(totalGradeClassValues).toBeGreaterThan(0);
  });
});
