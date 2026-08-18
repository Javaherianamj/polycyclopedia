// FE-5 -- build-time search index generator.
//
// Emits `web/public/search-materials.json` and `web/public/search-properties.json`,
// the two static assets `web/src/components/search/fetch-index.ts` fetches on
// the client (BR12). Connects DIRECTLY to PostgreSQL, per R39 ("the build
// never requires the API to be reachable") -- this mirrors the SQL shape
// already proven in `api/src/routes/materials.ts` / `properties.ts`, but
// deliberately drops that route's `subject_type = 'material'` restriction
// (BR6: grade classes are a first-class search subject too).
//
// Run with `npm run build:search-index` (see package.json).
//
// ---------------------------------------------------------------------------
// Business rules this file is responsible for (see
// aidlc-docs/construction/fe-5/functional-design/business-rules.md):
//
//   BR1  Every material, every property value, regardless of status.
//   BR2  A property is eligible iff `is_searchable` AND it has >=1 real
//        value in the index. observedMin/Max are the *actual* observed
//        bounds, never plausible_min/max.
//   BR3  aliasTokens derived mechanically from `key`, collisions dropped
//        deterministically, never hand-maintained.
//   BR6  grade_class rows carry only their own values (no inheritance from
//        the parent material, D46), and are emitted alongside materials.
//
// Two decisions below are *not* covered by an existing BR and are called
// out inline where they're made:
//
//   - `property_definition.is_searchable` is true for ten `data_type =
//     'text'` properties (e.g. `appearance`, `bur`) in the current
//     registry. The shared contract (`web/src/lib/search/types.ts`)
//     defines `SearchIndexProperty.dataType` as `'numeric' | 'range'` only
//     and `observedMin`/`observedMax` as plain numbers -- a text value has
//     no numeric band to report, so it cannot satisfy that shape. This
//     generator restricts eligibility to `data_type IN ('numeric',
//     'range')`, on top of BR2's `is_searchable` test.
//   - `property_value` allows several *editorial* rows per (subject,
//     property) when their `conditions` differ (e.g. MFI at two different
//     temperature/load combinations) -- 9 such groups exist in the seeded
//     data today, all on grade_class subjects. `ValueBand` has no room for
//     per-condition bands, so this generator collapses them: the envelope
//     min/max across all condition rows, and `valueTypical` kept only when
//     every row that has one agrees (otherwise null, rather than picking
//     one arbitrarily).
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import type {
  SearchIndexGradeClass,
  SearchIndexMaterial,
  SearchIndexProperty,
  SearchMaterialsIndex,
  SearchPropertiesIndex,
  ValueBand,
} from '../src/lib/search/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(WEB_ROOT, '..');
const PUBLIC_DIR = path.join(WEB_ROOT, 'public');

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------
//
// Same env-var names `api/src/config.ts` and `db/run.sh` already use, read
// from `db/.env` -- no new config mechanism invented. `DATABASE_URL` (the
// Neon convention documented for the repo root, `.env.local`, written by
// `neon env pull`) wins when a caller has actually exported it, so this
// script is ready for the Neon cutover once that database is populated.
// It is deliberately NOT auto-loaded from `.env.local` here: as of this
// writing that file points at a freshly-provisioned, empty `neondb` --
// auto-loading it would make this generator silently emit an empty index
// instead of failing loudly, which is worse than requiring an explicit
// `export DATABASE_URL=...` once Neon is the real source.

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const rawLine of readFileSync(filePath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadDbEnvIntoProcess(): void {
  const dbEnv = parseEnvFile(path.join(REPO_ROOT, 'db', '.env'));
  for (const [key, value] of Object.entries(dbEnv)) {
    if (!(key in process.env)) process.env[key] = value;
  }
}

function resolvePoolConfig(): pg.PoolConfig {
  loadDbEnvIntoProcess();

  if (process.env.DATABASE_URL) {
    const isManagedHost =
      process.env.DATABASE_URL.includes('neon.tech') ||
      process.env.DATABASE_URL.includes('amazonaws.com');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isManagedHost ? { rejectUnauthorized: false } : undefined,
    };
  }

  const password = process.env.APP_DB_PASSWORD;
  if (!password) {
    throw new Error(
      'No database connection configured. Copy db/.env.example to db/.env and fill it in ' +
        '(local Postgres), or export DATABASE_URL (Neon) before running this script.',
    );
  }
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 55432),
    database: process.env.POSTGRES_DB ?? 'polypedia',
    user: process.env.APP_DB_USER ?? 'polypedia_app',
    password,
  };
}

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

interface MaterialRow {
  id: string;
  slug: string;
  name_fa: string;
  name_en: string;
  family_key: string;
  family_name_fa: string;
  family_name_en: string;
  citation_coverage_pct: number;
}

interface GradeClassRow {
  id: string;
  material_id: string;
  material_slug: string;
  key: string;
  name_fa: string;
  name_en: string;
}

interface PropertyDefinitionRow {
  key: string;
  name_fa: string;
  name_en: string;
  symbol: string | null;
  canonical_unit: string | null;
  data_type: 'numeric' | 'range';
}

// One editorial property_value row for a material or grade_class subject.
// `subject_type` is narrowed to the two BR6 cares about -- material and
// grade_class -- by the SQL WHERE clause below, never grade or
// material_process.
interface ValueRow {
  subject_type: 'material' | 'grade_class';
  subject_id: string;
  property_key: string;
  value_min: number | null;
  value_max: number | null;
  value_typical: number | null;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
//
// Reuses the shape of MATERIALS_LIST_SQL / MATERIAL_PROPERTY_VALUES_SQL from
// api/src/routes/materials.ts: same join to v_citation_coverage, same
// editorial/non-superseded value filter -- but with no `status` filter on
// `material` (BR1) and `subject_type` widened from the API's hardcoded
// 'material' to `('material', 'grade_class')` (BR6), which is exactly the
// restriction the task calls out not to copy.

const MATERIALS_SQL = `
  SELECT
    m.id,
    m.slug,
    m.name_fa,
    m.name_en,
    fam.key AS family_key,
    fam.name_fa AS family_name_fa,
    fam.name_en AS family_name_en,
    COALESCE(vc.coverage_pct, 0) AS citation_coverage_pct
  FROM material m
  JOIN family fam ON fam.id = m.family_id
  LEFT JOIN v_citation_coverage vc ON vc.material_id = m.id
  ORDER BY m.name_en
`;

// No status filter here either (BR1's "every material regardless of
// status" reasoning applies the same way to its grade classes -- FE-5 is a
// build-time capability like FE-1-4; publish gating is FE-9's job).
const GRADE_CLASSES_SQL = `
  SELECT
    gc.id,
    gc.material_id,
    m.slug AS material_slug,
    gc.key,
    gc.name_fa,
    gc.name_en
  FROM grade_class gc
  JOIN material m ON m.id = gc.material_id
  ORDER BY m.name_en, gc.sort_order, gc.key
`;

// BR2 (own-call addendum above): is_searchable AND numeric-shaped. Text
// is_searchable properties (appearance, bur, ...) are excluded here, not
// after the fact -- they never enter the eligibility computation at all.
const PROPERTY_DEFINITIONS_SQL = `
  SELECT key, name_fa, name_en, symbol, canonical_unit, data_type
  FROM property_definition
  WHERE is_searchable = true
    AND data_type IN ('numeric', 'range')
  ORDER BY key
`;

// The current, non-superseded editorial value for every material and
// grade_class subject, restricted to properties that could possibly be
// eligible (BR2). `value_role = 'editorial'` is "the single published
// value" (0017's own comment) -- observation rows are the evidence behind
// it, not additional search subjects, so they are correctly excluded here
// (this is about supersession, not about citation/observation *status*,
// which BR1 says to ignore).
const VALUES_SQL = `
  SELECT
    pv.subject_type,
    pv.subject_id,
    pd.key AS property_key,
    pv.value_min,
    pv.value_max,
    pv.value_typical
  FROM property_value pv
  JOIN property_definition pd ON pd.id = pv.property_id
  WHERE pv.subject_type IN ('material', 'grade_class')
    AND pv.value_role = 'editorial'
    AND pv.superseded_by IS NULL
    AND pv.status <> 'superseded'
    AND pd.is_searchable = true
    AND pd.data_type IN ('numeric', 'range')
`;

// ---------------------------------------------------------------------------
// Value-band aggregation
// ---------------------------------------------------------------------------

// Collapses a group of editorial rows sharing one (subject, property) --
// normally exactly one row, occasionally several when `conditions` differ
// (see the file header) -- into the single ValueBand the shared type
// requires. A row missing value_min or value_max (frequent: 115 of the
// seeded editorial numeric/range rows have only one or two of the three
// numeric columns set, e.g. a bare `valueTypical` or a qualifier-only
// bound like `water_absorption <= 0.01`) degrades to a point band using
// whichever of value_min/value_typical/value_max is present -- the same
// "collapse to a point" reading `web/src/components/search/format.ts`
// already gives a min === max band.
export function combineRows(rows: ValueRow[]): ValueBand {
  const mins = rows.map((r) => r.value_min ?? r.value_typical ?? r.value_max);
  const maxs = rows.map((r) => r.value_max ?? r.value_typical ?? r.value_min);

  const definedMins = mins.filter((v): v is number => v != null);
  const definedMaxs = maxs.filter((v): v is number => v != null);

  const valueMin = Math.min(...definedMins, ...definedMaxs);
  const valueMax = Math.max(...definedMins, ...definedMaxs);

  let valueTypical: number | null = null;
  if (rows.length === 1) {
    valueTypical = rows[0]!.value_typical ?? null;
  } else {
    const typicals = new Set(
      rows.map((r) => r.value_typical).filter((v): v is number => v != null),
    );
    valueTypical = typicals.size === 1 ? [...typicals][0]! : null;
  }

  return { valueMin, valueMax, valueTypical };
}

export function groupValueRows(rows: ValueRow[]): Map<string, Map<string, ValueRow[]>> {
  // subjectType:subjectId -> propertyKey -> rows
  const bySubject = new Map<string, Map<string, ValueRow[]>>();
  for (const row of rows) {
    const subjectKey = `${row.subject_type}:${row.subject_id}`;
    let byProperty = bySubject.get(subjectKey);
    if (!byProperty) {
      byProperty = new Map();
      bySubject.set(subjectKey, byProperty);
    }
    const list = byProperty.get(row.property_key) ?? [];
    list.push(row);
    byProperty.set(row.property_key, list);
  }
  return bySubject;
}

export function bandsForSubject(
  bySubject: Map<string, Map<string, ValueRow[]>>,
  subjectType: 'material' | 'grade_class',
  subjectId: string,
): Record<string, ValueBand> {
  const byProperty = bySubject.get(`${subjectType}:${subjectId}`);
  const values: Record<string, ValueBand> = {};
  if (!byProperty) return values;
  for (const [propertyKey, rows] of byProperty) {
    values[propertyKey] = combineRows(rows);
  }
  return values;
}

// ---------------------------------------------------------------------------
// Alias derivation (BR3)
// ---------------------------------------------------------------------------

function firstSegment(key: string): string | null {
  const idx = key.indexOf('_');
  return idx === -1 ? null : key.slice(0, idx);
}

// tokens(key) = { key } U { first_segment(key) if key contains "_" },
// de-duplicated, with a documented, deterministic collision rule: if two
// *eligible* properties' first segments collide, the short form is dropped
// from both (each keeps only its own full key), rather than arbitrarily
// keeping it on one and not the other.
export function buildAliasTokens(propertyKeys: string[]): Map<string, string[]> {
  const shortFormOwners = new Map<string, string[]>();
  for (const key of propertyKeys) {
    const short = firstSegment(key);
    if (short === null) continue;
    const owners = shortFormOwners.get(short) ?? [];
    owners.push(key);
    shortFormOwners.set(short, owners);
  }

  const result = new Map<string, string[]>();
  for (const key of propertyKeys) {
    const tokens = new Set<string>([key]);
    const short = firstSegment(key);
    if (short !== null && short !== key) {
      const owners = shortFormOwners.get(short) ?? [];
      if (owners.length === 1) tokens.add(short);
      // owners.length > 1: a genuine collision -- drop the short form for
      // every owner, deterministically, per BR3's documented limit.
    }
    result.set(key, [...tokens]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function buildSearchIndex(pool: pg.Pool): Promise<{
  materialsIndex: SearchMaterialsIndex;
  propertiesIndex: SearchPropertiesIndex;
}> {
  const [materialsResult, gradeClassesResult, propertyDefsResult, valuesResult] = await Promise.all(
    [
      pool.query<MaterialRow>(MATERIALS_SQL),
      pool.query<GradeClassRow>(GRADE_CLASSES_SQL),
      pool.query<PropertyDefinitionRow>(PROPERTY_DEFINITIONS_SQL),
      pool.query<ValueRow>(VALUES_SQL),
    ],
  );

  const bySubject = groupValueRows(valuesResult.rows);

  // Materials, with their own values.
  const materials: SearchIndexMaterial[] = materialsResult.rows.map((row) => ({
    slug: row.slug,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    familyKey: row.family_key,
    familyNameFa: row.family_name_fa,
    familyNameEn: row.family_name_en,
    citationCoveragePct: row.citation_coverage_pct,
    values: bandsForSubject(bySubject, 'material', row.id),
  }));

  // Grade classes (BR6): every row from grade_class, values ONLY from
  // subject_type = 'grade_class' rows -- never merged with the parent
  // material's values (D46, checked explicitly in the test suite below).
  const gradeClasses: SearchIndexGradeClass[] = gradeClassesResult.rows.map((row) => ({
    key: row.key,
    materialSlug: row.material_slug,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    values: bandsForSubject(bySubject, 'grade_class', row.id),
  }));

  // BR2: a property is eligible iff is_searchable (already enforced by
  // PROPERTY_DEFINITIONS_SQL) AND it has >=1 real value anywhere in the
  // index -- across materials AND grade classes, since grade-class sliders
  // reuse the same property registry (BR6).
  const propertyKeysWithData = new Set<string>();
  for (const material of materials)
    for (const key of Object.keys(material.values)) propertyKeysWithData.add(key);
  for (const gradeClass of gradeClasses)
    for (const key of Object.keys(gradeClass.values)) propertyKeysWithData.add(key);

  const eligibleDefs = propertyDefsResult.rows.filter((def) => propertyKeysWithData.has(def.key));
  const aliasTokensByKey = buildAliasTokens(eligibleDefs.map((def) => def.key));

  const properties: SearchIndexProperty[] = eligibleDefs.map((def) => {
    let observedMin = Number.POSITIVE_INFINITY;
    let observedMax = Number.NEGATIVE_INFINITY;
    for (const material of materials) {
      const band = material.values[def.key];
      if (!band) continue;
      observedMin = Math.min(observedMin, band.valueMin);
      observedMax = Math.max(observedMax, band.valueMax);
    }
    for (const gradeClass of gradeClasses) {
      const band = gradeClass.values[def.key];
      if (!band) continue;
      observedMin = Math.min(observedMin, band.valueMin);
      observedMax = Math.max(observedMax, band.valueMax);
    }

    return {
      key: def.key,
      nameFa: def.name_fa,
      nameEn: def.name_en,
      symbol: def.symbol,
      unit: def.canonical_unit,
      dataType: def.data_type,
      observedMin,
      observedMax,
      aliasTokens: aliasTokensByKey.get(def.key) ?? [def.key],
    };
  });

  return {
    materialsIndex: { materials, gradeClasses },
    propertiesIndex: { properties },
  };
}

function gzipSize(json: string): number {
  return gzipSync(Buffer.from(json, 'utf8')).length;
}

async function main(): Promise<void> {
  const pool = new pg.Pool(resolvePoolConfig());
  try {
    const { materialsIndex, propertiesIndex } = await buildSearchIndex(pool);

    mkdirSync(PUBLIC_DIR, { recursive: true });

    const materialsJson = JSON.stringify(materialsIndex);
    const propertiesJson = JSON.stringify(propertiesIndex);

    writeFileSync(path.join(PUBLIC_DIR, 'search-materials.json'), materialsJson);
    writeFileSync(path.join(PUBLIC_DIR, 'search-properties.json'), propertiesJson);

    const materialsGzip = gzipSize(materialsJson);
    const propertiesGzip = gzipSize(propertiesJson);

    console.log(
      `search-materials.json: ${materialsIndex.materials.length} materials, ` +
        `${materialsIndex.gradeClasses.length} grade classes`,
    );
    console.log(`  ${materialsJson.length} B raw, ${materialsGzip} B gzip`);
    console.log(`search-properties.json: ${propertiesIndex.properties.length} properties`);
    console.log(`  ${propertiesJson.length} B raw, ${propertiesGzip} B gzip`);
    console.log(`combined gzip: ${materialsGzip + propertiesGzip} B (budget: 120000 B, BR12/§6)`);
  } finally {
    await pool.end();
  }
}

// Only run when invoked directly (`npm run build:search-index`), not when
// imported by the test suite.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
