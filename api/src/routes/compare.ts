import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { toCamelCase } from '../case.js';
import { fetchCitationsByValueId } from '../citations.js';
import { badRequestError } from '../errors.js';

// ---------------------------------------------------------------------------
// GET /api/compare -- FE-6. Serves the raw material needed to build a
// comparison table: resolved subjects (materials and/or grade classes,
// CR14), rows keyed by (property, conditions) (CR11), only the cells a
// subject actually has a value for (CR12 -- absence is never a cell, never a
// coerced 0), citedness per cell (CR18, reusing ../citations.ts), plus the
// application list and polarity rules for CR4/CR5/CR6.
//
// This route deliberately does NOT compute differenceScore/deltaKind/
// emphasis/isOverlapping -- those are FE-6's pure client-logic package's
// job (CR1/CR7/CR8/CR9/CR10), built from the raw rows this endpoint returns.
// Read-only, unauthenticated, CORS-restricted like every other route (R40) --
// no new auth/CORS wiring needed here.
// ---------------------------------------------------------------------------

interface CompareQuery {
  subjects?: string;
}

const compareQuerySchema = {
  type: 'object',
  properties: {
    // Comma-separated refs, e.g. "ldpe,hdpe/film,pp". CR16: N is uncapped,
    // so this is a generous length bound against abuse, not a subject-count
    // cap.
    subjects: { type: 'string', maxLength: 5000 },
  },
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------- ref parsing

type ParsedRef =
  | { ok: true; ref: string; materialSlug: string; gradeClassKey?: string }
  | { ok: false; ref: string };

// "ldpe" -> a material subject. "ldpe/film" -> a grade class subject
// (CR14). Anything else (empty, >1 slash, empty segment) is malformed.
function parseSubjectRef(ref: string): ParsedRef {
  const parts = ref.split('/');
  if (parts.length === 1 && parts[0]) {
    return { ok: true, ref, materialSlug: parts[0] };
  }
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { ok: true, ref, materialSlug: parts[0], gradeClassKey: parts[1] };
  }
  return { ok: false, ref };
}

// ---------------------------------------------------------------- SQL

const RESOLVE_MATERIALS_SQL = `
  SELECT m.id, m.slug, m.name_fa, m.name_en, fam.key AS family_key
  FROM material m
  JOIN family fam ON fam.id = m.family_id
  WHERE m.slug = ANY($1::text[])
`;

// Multi-arg unnest() as a FROM-clause table function, matching requested
// (materialSlug, gradeClassKey) pairs positionally -- avoids an N-query
// resolve loop for N grade-class subjects.
const RESOLVE_GRADE_CLASSES_SQL = `
  SELECT
    gc.id,
    gc.key AS grade_class_key,
    m.slug AS material_slug,
    gc.name_fa,
    gc.name_en,
    fam.key AS family_key
  FROM unnest($1::text[], $2::text[]) AS want(material_slug, grade_class_key)
  JOIN material m ON m.slug = want.material_slug
  JOIN grade_class gc ON gc.material_id = m.id AND gc.key = want.grade_class_key
  JOIN family fam ON fam.id = m.family_id
`;

// CR13's eligibility gate (is_comparable = true) applied here, at the
// source, rather than filtered out later in JS. Restricted to numeric/range
// data types: CompareCell.representative is a number and CompareCell.band is
// a numeric ValueBand (web/src/lib/compare/types.ts), which a text-typed
// comparable property (e.g. `bur`, Blow-Up Ratio) cannot populate -- same
// restriction FE-5's search-index builder already applies for the same
// reason (build-search-index.ts).
//
// Both subject kinds are fetched in one query: subject_id spaces for
// 'material' and 'grade_class' are independent sequences that can collide in
// value, so each arm is matched against its own id list rather than a single
// combined ANY($ids).
const COMPARE_PROPERTY_VALUES_SQL = `
  SELECT
    pv.subject_type,
    pv.subject_id,
    pgr.key AS group_key,
    pgr.name_fa AS group_name_fa,
    pgr.name_en AS group_name_en,
    pd.key AS property_key,
    pd.name_fa AS property_name_fa,
    pd.name_en AS property_name_en,
    pd.symbol AS property_symbol,
    pv.id AS property_value_id,
    pv.value_min,
    pv.value_max,
    pv.value_typical,
    pv.unit_display,
    pv.conditions
  FROM property_value pv
  JOIN property_definition pd ON pd.id = pv.property_id
  JOIN property_group pgr ON pgr.id = pd.group_id
  WHERE pd.is_comparable = true
    AND pd.data_type IN ('numeric', 'range')
    AND pv.value_role = 'editorial'
    AND pv.superseded_by IS NULL
    AND pv.status <> 'superseded'
    AND (
      (pv.subject_type = 'material' AND pv.subject_id = ANY($1::bigint[]))
      OR (pv.subject_type = 'grade_class' AND pv.subject_id = ANY($2::bigint[]))
    )
  ORDER BY pgr.sort_order, pd.sort_order, pd.key, pv.conditions::text
`;

const APPLICATIONS_SQL = `
  SELECT key, name_fa, name_en
  FROM application
  ORDER BY id
`;

// application_property_polarity (db/migrations/0024) is owned by a sibling
// unit working in parallel; it may not exist yet. Queried fresh on every
// request (not cached at startup) so this endpoint picks it up the moment
// the migration lands, with no restart required. A missing table degrades
// to an empty rules list rather than a 500 -- see the catch in the handler
// below.
const POLARITY_RULES_SQL = `
  SELECT
    a.key AS application_key,
    pd.key AS property_key,
    app.polarity,
    app.rationale_fa,
    app.rationale_en
  FROM application_property_polarity app
  JOIN application a ON a.id = app.application_id
  JOIN property_definition pd ON pd.id = app.property_id
  ORDER BY a.key, pd.key
`;

// Postgres SQLSTATE for "undefined_table" -- the specific, narrow error this
// degrades on. Any other error (a real connectivity/permission problem)
// still propagates and becomes the usual 500.
const UNDEFINED_TABLE = '42P01';

async function fetchPolarityRules(pool: pg.Pool): Promise<Record<string, unknown>[]> {
  try {
    const result = await pool.query(POLARITY_RULES_SQL);
    return result.rows;
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === UNDEFINED_TABLE) {
      return [];
    }
    throw err;
  }
}

// ---------------------------------------------------------------- row keys

// Deterministic serialization of the conditions JSONB into the row's true
// identity (CR11): sort keys, then stringify. Conditions values are always
// primitives (string | number), so key order is the only source of
// nondeterminism JSON.stringify would otherwise introduce.
function canonicalizeConditions(conditions: Record<string, unknown>): string {
  const sortedKeys = Object.keys(conditions).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of sortedKeys) sorted[key] = conditions[key];
  return JSON.stringify(sorted);
}

function buildRowKey(propertyKey: string, conditions: Record<string, unknown>): string {
  return `${propertyKey}::${canonicalizeConditions(conditions)}`;
}

// ---------------------------------------------------------------- value shaping

interface Band {
  valueMin: number;
  valueMax: number;
  valueTypical: number | null;
}

// Same "collapse to a point" reading as web/scripts/build-search-index.ts's
// combineRows() and web/src/components/search/format.ts: a row missing
// value_min or value_max degrades to a point band using whichever numeric
// column is present, rather than being dropped. Returns null only when NONE
// of the three numeric columns is set -- i.e. there is genuinely no value
// here (should not happen for a numeric/range-typed property_value row, but
// handled rather than assumed).
function buildBand(
  valueMin: number | null,
  valueMax: number | null,
  valueTypical: number | null,
): Band | null {
  const min = valueMin ?? valueTypical ?? valueMax;
  const max = valueMax ?? valueTypical ?? valueMin;
  if (min == null || max == null) return null;
  return { valueMin: min, valueMax: max, valueTypical: valueTypical ?? null };
}

// Validation notes, business-rules.md: value_typical when present,
// otherwise the midpoint of value_min/value_max. Point bands (min === max)
// need no special case -- the midpoint of a point is itself.
function representativeOf(band: Band): number {
  return band.valueTypical ?? (band.valueMin + band.valueMax) / 2;
}

// ---------------------------------------------------------------- row types

interface CompareRowAccumulator {
  rowKey: string;
  propertyKey: string;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  unit: string | null;
  conditions: Record<string, unknown>;
  groupKey: string;
  groupNameFa: string;
  groupNameEn: string;
  cells: Array<{
    subjectRef: string;
    band: Band;
    representative: number;
    propertyValueId: string;
  }>;
}

interface CompareValueRow {
  subjectType: string;
  subjectId: string;
  groupKey: string;
  groupNameFa: string;
  groupNameEn: string;
  propertyKey: string;
  propertyNameFa: string;
  propertyNameEn: string;
  propertySymbol: string | null;
  propertyValueId: string;
  valueMin: number | null;
  valueMax: number | null;
  valueTypical: number | null;
  unitDisplay: string | null;
  conditions: Record<string, unknown>;
}

export function registerCompareRoute(app: FastifyInstance, pool: pg.Pool): void {
  app.get<{ Querystring: CompareQuery }>(
    '/api/compare',
    { schema: { querystring: compareQuerySchema } },
    async (req, reply) => {
      const raw = req.query.subjects;
      if (!raw || raw.trim() === '') {
        return reply
          .code(400)
          .send(badRequestError('subjects is required: a comma-separated list of refs, e.g. "ldpe,hdpe/film"'));
      }

      // De-duplicated, order-preserving: cells are keyed by subjectRef, so a
      // repeated ref would just overwrite itself -- silently accepting one
      // instance of it is more useful than erroring on a client that, say,
      // built the list from two overlapping selections.
      const requestedRefs = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];

      const parsed = requestedRefs.map(parseSubjectRef);
      const malformed = parsed.filter((p): p is Extract<ParsedRef, { ok: false }> => !p.ok);
      if (malformed.length > 0) {
        return reply.code(400).send(
          badRequestError(
            `malformed subject ref(s): ${malformed.map((m) => m.ref).join(', ')} -- expected "materialSlug" or "materialSlug/gradeClassKey"`,
          ),
        );
      }
      const okParsed = parsed as Extract<ParsedRef, { ok: true }>[];

      const materialOnlyRefs = okParsed.filter((p) => p.gradeClassKey === undefined);
      const gradeClassRefs = okParsed.filter((p) => p.gradeClassKey !== undefined);

      const [materialsResult, gradeClassesResult, applicationsResult, polarityRows] = await Promise.all([
        materialOnlyRefs.length
          ? pool.query(RESOLVE_MATERIALS_SQL, [materialOnlyRefs.map((p) => p.materialSlug)])
          : { rows: [] as Record<string, unknown>[] },
        gradeClassRefs.length
          ? pool.query(RESOLVE_GRADE_CLASSES_SQL, [
              gradeClassRefs.map((p) => p.materialSlug),
              gradeClassRefs.map((p) => p.gradeClassKey),
            ])
          : { rows: [] as Record<string, unknown>[] },
        pool.query(APPLICATIONS_SQL),
        fetchPolarityRules(pool),
      ]);

      // Resolve back onto refs (materials by slug, grade classes by
      // "slug/key") so unresolved refs (unknown slug, or unknown grade class
      // under a known material) can be reported precisely.
      const materialBySlug = new Map(
        materialsResult.rows.map((r) => [r.slug as string, toCamelCase<Record<string, unknown>>(r)]),
      );
      const gradeClassByRef = new Map(
        gradeClassesResult.rows.map((r) => {
          const camel = toCamelCase<{ materialSlug: string; gradeClassKey: string }>(r);
          return [`${camel.materialSlug}/${camel.gradeClassKey}`, toCamelCase<Record<string, unknown>>(r)];
        }),
      );

      const unresolved: string[] = [];
      for (const p of okParsed) {
        if (p.gradeClassKey === undefined) {
          if (!materialBySlug.has(p.materialSlug)) unresolved.push(p.ref);
        } else if (!gradeClassByRef.has(p.ref)) {
          unresolved.push(p.ref);
        }
      }
      if (unresolved.length > 0) {
        return reply
          .code(400)
          .send(badRequestError(`unknown subject(s): ${unresolved.join(', ')}`));
      }

      // Subjects, in the caller's requested order (not DB return order).
      const subjects = okParsed.map((p) => {
        if (p.gradeClassKey === undefined) {
          const m = materialBySlug.get(p.materialSlug) as {
            nameFa: string;
            nameEn: string;
            familyKey: string;
          };
          return {
            kind: 'material' as const,
            ref: p.ref,
            materialSlug: p.materialSlug,
            nameFa: m.nameFa,
            nameEn: m.nameEn,
            familyKey: m.familyKey,
          };
        }
        const gc = gradeClassByRef.get(p.ref) as {
          nameFa: string;
          nameEn: string;
          familyKey: string;
        };
        return {
          kind: 'grade_class' as const,
          ref: p.ref,
          materialSlug: p.materialSlug,
          gradeClassKey: p.gradeClassKey,
          nameFa: gc.nameFa,
          nameEn: gc.nameEn,
          familyKey: gc.familyKey,
        };
      });

      // subject_type:subject_id -> ref, so property_value rows (which only
      // carry the DB-side subject identity) can be mapped back to the
      // caller's requested ref.
      const subjectKeyToRef = new Map<string, string>();
      for (const row of materialsResult.rows) {
        subjectKeyToRef.set(`material:${row.id}`, row.slug as string);
      }
      for (const row of gradeClassesResult.rows) {
        const camel = toCamelCase<{ materialSlug: string; gradeClassKey: string; id: string }>(row);
        subjectKeyToRef.set(`grade_class:${camel.id}`, `${camel.materialSlug}/${camel.gradeClassKey}`);
      }

      const materialIds = materialsResult.rows.map((r) => r.id as string);
      const gradeClassIds = gradeClassesResult.rows.map((r) => r.id as string);

      const valuesResult =
        materialIds.length || gradeClassIds.length
          ? await pool.query(COMPARE_PROPERTY_VALUES_SQL, [materialIds, gradeClassIds])
          : { rows: [] as Record<string, unknown>[] };

      const rowsByKey = new Map<string, CompareRowAccumulator>();
      for (const raw of valuesResult.rows) {
        const camel = toCamelCase<CompareValueRow>(raw);
        const subjectRef = subjectKeyToRef.get(`${camel.subjectType}:${camel.subjectId}`);
        if (!subjectRef) continue; // defensive; every id queried came from a resolved subject

        const band = buildBand(camel.valueMin, camel.valueMax, camel.valueTypical);
        if (!band) continue; // defensive; see buildBand's comment

        const rowKey = buildRowKey(camel.propertyKey, camel.conditions);
        let row = rowsByKey.get(rowKey);
        if (!row) {
          row = {
            rowKey,
            propertyKey: camel.propertyKey,
            nameFa: camel.propertyNameFa,
            nameEn: camel.propertyNameEn,
            symbol: camel.propertySymbol,
            unit: camel.unitDisplay,
            conditions: camel.conditions,
            groupKey: camel.groupKey,
            groupNameFa: camel.groupNameFa,
            groupNameEn: camel.groupNameEn,
            cells: [],
          };
          rowsByKey.set(rowKey, row);
        }
        row.cells.push({
          subjectRef,
          band,
          representative: representativeOf(band),
          propertyValueId: camel.propertyValueId,
        });
      }

      // CR18: citedness, via the same evidence join materials.ts uses.
      const allPropertyValueIds = [...rowsByKey.values()].flatMap((r) =>
        r.cells.map((c) => c.propertyValueId),
      );
      const citationsByValueId = await fetchCitationsByValueId(pool, allPropertyValueIds);

      // CR13: a row only one subject can answer is not a comparison.
      // Excluded, but counted, so the UI can say so.
      let excludedRowCount = 0;
      const rows = [];
      for (const row of rowsByKey.values()) {
        if (row.cells.length < 2) {
          excludedRowCount += 1;
          continue;
        }
        rows.push({
          rowKey: row.rowKey,
          propertyKey: row.propertyKey,
          nameFa: row.nameFa,
          nameEn: row.nameEn,
          symbol: row.symbol,
          unit: row.unit,
          conditions: row.conditions,
          groupKey: row.groupKey,
          groupNameFa: row.groupNameFa,
          groupNameEn: row.groupNameEn,
          cells: row.cells.map((c) => ({
            subjectRef: c.subjectRef,
            band: c.band,
            representative: c.representative,
            isCited: (citationsByValueId.get(c.propertyValueId)?.length ?? 0) > 0,
          })),
        });
      }

      const applications = applicationsResult.rows.map((r) => {
        const camel = toCamelCase<{ key: string; nameFa: string; nameEn: string }>(r);
        return { key: camel.key, nameFa: camel.nameFa, nameEn: camel.nameEn };
      });

      const polarityRules = polarityRows.map((r) => {
        const camel = toCamelCase<{
          applicationKey: string;
          propertyKey: string;
          polarity: string;
          rationaleFa: string;
          rationaleEn: string;
        }>(r);
        return {
          applicationKey: camel.applicationKey,
          propertyKey: camel.propertyKey,
          polarity: camel.polarity,
          rationaleFa: camel.rationaleFa,
          rationaleEn: camel.rationaleEn,
        };
      });

      return reply.send({
        subjects,
        rows,
        excludedRowCount,
        applications,
        polarityRules,
      });
    },
  );
}
