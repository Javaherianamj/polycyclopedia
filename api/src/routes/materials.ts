import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import type { Config } from '../config.js';
import { toCamelCase } from '../case.js';
import { groupConsecutiveBy } from '../group.js';
import { formatValue } from '../format.js';
import { notFoundError } from '../errors.js';
import { fetchCitationsByValueId, type CitationEntry } from '../citations.js';

// ---------------------------------------------------------------------------
// GET /api/materials -- catalog list. Deliberately excludes property values.
// ---------------------------------------------------------------------------

interface MaterialsListQuery {
  field?: string;
  family?: string;
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

const materialsListQuerySchema = {
  type: 'object',
  properties: {
    field: { type: 'string', maxLength: 200 },
    family: { type: 'string', maxLength: 200 },
    q: { type: 'string', maxLength: 200 },
    status: { type: 'string', maxLength: 50 },
    limit: { type: 'integer', minimum: 1 },
    offset: { type: 'integer', minimum: 0 },
  },
  additionalProperties: false,
} as const;

// Every filter is applied via a bound parameter ($1..$4). None of `field`,
// `family`, `status`, or `q` is ever concatenated into the SQL text itself --
// including `q`, which is the parameter the SQL-injection test targets.
// `q` is compared with a parameterised ILIKE built via SQL-side
// concatenation ('%' || $4 || '%'), not JS string interpolation, so a value
// like `' OR 1=1 --` is matched as a literal search string and can neither
// break out of the query nor short-circuit the WHERE clause.
const MATERIALS_LIST_WHERE = `
  WHERE ($1::text IS NULL OR f.key = $1)
    AND ($2::text IS NULL OR fam.key = $2)
    AND ($3::text IS NULL OR m.status::text = $3)
    AND (
      $4::text IS NULL
      OR m.name_en ILIKE '%' || $4 || '%'
      OR m.name_fa ILIKE '%' || $4 || '%'
      OR m.code ILIKE '%' || $4 || '%'
    )
`;

// FE-4: family display names, for the catalog's filter chips. Both columns
// were already reachable through the existing family join -- fam.key alone
// (a taxonomy identifier, not prose) isn't something a Persian reader
// should see rendered as a chip label, and R2's "no property list in JSX"
// principle extends the same way to not hardcoding taxonomy translations in
// the frontend when the database already has them.
const MATERIALS_LIST_SQL = `
  SELECT
    m.slug,
    m.name_fa,
    m.name_en,
    m.code,
    f.key AS field_key,
    fam.key AS family_key,
    fam.name_fa AS family_name_fa,
    fam.name_en AS family_name_en,
    m.status,
    COALESCE(vc.coverage_pct, 0) AS citation_coverage
  FROM material m
  JOIN field f ON f.id = m.field_id
  JOIN family fam ON fam.id = m.family_id
  LEFT JOIN v_citation_coverage vc ON vc.material_id = m.id
  ${MATERIALS_LIST_WHERE}
  ORDER BY m.name_en
  LIMIT $5 OFFSET $6
`;

const MATERIALS_COUNT_SQL = `
  SELECT count(*)::int AS total
  FROM material m
  JOIN field f ON f.id = m.field_id
  JOIN family fam ON fam.id = m.family_id
  ${MATERIALS_LIST_WHERE}
`;

interface MaterialListRow {
  slug: string;
  nameFa: string;
  nameEn: string;
  code: string | null;
  fieldKey: string;
  familyKey: string;
  familyNameFa: string;
  familyNameEn: string;
  status: string;
  citationCoverage: number;
}

function mapMaterialListRow(row: Record<string, unknown>) {
  const camel = toCamelCase<MaterialListRow>(row);
  return {
    slug: camel.slug,
    nameFa: camel.nameFa,
    nameEn: camel.nameEn,
    code: camel.code,
    field: camel.fieldKey,
    family: camel.familyKey,
    familyNameFa: camel.familyNameFa,
    familyNameEn: camel.familyNameEn,
    status: camel.status,
    citationCoverage: camel.citationCoverage,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// GET /api/materials/:slug -- full detail, properties grouped by
// property_group in sort_order.
// ---------------------------------------------------------------------------

const slugParamsSchema = {
  type: 'object',
  properties: {
    slug: { type: 'string', minLength: 1, maxLength: 200 },
  },
  required: ['slug'],
} as const;

// FE-3: identity (overview/discoveryYear/chainType were already columns on
// `material`, just never projected here -- no schema change) plus coverage,
// joined the same way MATERIALS_LIST_SQL already joins it for the catalog.
// D3/R12: every material page states its own coverage above the fold.
const MATERIAL_BY_SLUG_SQL = `
  SELECT
    m.id,
    m.slug,
    m.name_fa,
    m.name_en,
    m.code,
    m.status,
    m.overview_fa,
    m.overview_en,
    m.discovery_year,
    m.chain_type,
    f.key AS field_key,
    f.name_fa AS field_name_fa,
    f.name_en AS field_name_en,
    fam.key AS family_key,
    fam.name_fa AS family_name_fa,
    fam.name_en AS family_name_en,
    COALESCE(vc.total_values, 0)::int AS coverage_total_values,
    COALESCE(vc.cited_values, 0)::int AS coverage_cited_values,
    COALESCE(vc.coverage_pct, 0) AS coverage_pct
  FROM material m
  JOIN field f ON f.id = m.field_id
  JOIN family fam ON fam.id = m.family_id
  LEFT JOIN v_citation_coverage vc ON vc.material_id = m.id
  WHERE m.slug = $1
`;

const MATERIAL_IDENTIFIERS_SQL = `
  SELECT type, value
  FROM material_identifier
  WHERE material_id = $1
  ORDER BY type
`;

// Grouped and ordered exactly the way the existing UI tabs consume: by
// property_group.sort_order, then property_definition.sort_order. The
// convenience view v_material_properties does NOT expose either sort_order
// column, so this queries the base tables directly rather than the view.
const MATERIAL_PROPERTY_VALUES_SQL = `
  SELECT
    pgr.key AS group_key,
    pgr.name_fa AS group_name_fa,
    pgr.name_en AS group_name_en,
    pd.key AS property_key,
    pd.name_fa AS property_name_fa,
    pd.name_en AS property_name_en,
    pd.symbol AS property_symbol,
    pd.data_type AS property_data_type,
    pv.id AS property_value_id,
    pv.value_min,
    pv.value_max,
    pv.value_typical,
    pv.value_text_fa,
    pv.value_text_en,
    pv.value_enum,
    pv.value_bool,
    pv.unit_display,
    pv.qualifier,
    pv.conditions,
    pv.status AS value_status
  FROM property_value pv
  JOIN property_definition pd ON pd.id = pv.property_id
  JOIN property_group pgr ON pgr.id = pd.group_id
  WHERE pv.subject_type = 'material'
    AND pv.subject_id = $1
    AND pv.value_role = 'editorial'
    AND pv.superseded_by IS NULL
    AND pv.status <> 'superseded'
  ORDER BY pgr.sort_order, pd.sort_order, pd.key
`;

// R11: a citation popover shows work, edition and page -- nothing else.
// The actual query (joining evidence -> citation -> source_document ->
// source, and reaching observation rows underneath an editorial one via
// editorial_value_id) now lives in ../citations.ts, shared with FE-6's
// compare endpoint (CR18) so both use the same notion of "this value is
// cited" rather than two possibly-disagreeing ones.

const MATERIAL_CHEMICAL_RESISTANCE_SQL = `
  SELECT reagent_fa, reagent_en, rating, note_fa, note_en, status
  FROM chemical_resistance
  WHERE material_id = $1
  ORDER BY reagent_en
`;

const MATERIAL_MARKET_SHARE_SQL = `
  SELECT segment_fa, segment_en, percentage, region, year, status
  FROM market_share_datum
  WHERE material_id = $1
  ORDER BY id
`;

const MATERIAL_STRUCTURE_SQL = `
  SELECT atoms
  FROM material_structure
  WHERE material_id = $1
`;

// FE-3 "processing" rail section. material_process, not the bare junction
// table material_processing_technique -- this one carries notes, sort_order
// and status, and is wired into the citation-cleanup trigger system the
// same way chemical_resistance/market_share_datum are.
const MATERIAL_PROCESSING_TECHNIQUES_SQL = `
  SELECT
    pt.key,
    pt.name_fa,
    pt.name_en,
    mp.note_fa,
    mp.note_en,
    mp.status
  FROM material_process mp
  JOIN processing_technique pt ON pt.id = mp.processing_technique_id
  WHERE mp.material_id = $1
  ORDER BY mp.sort_order, pt.key
`;

// ---------------------------------------------------------------------------
// FE-3b: grade classes -- the resin-population rung between material and a
// specific commercial grade (db/migrations/0016_grade_class.sql). A material
// with grade classes is sold as several distinct populations for different
// end uses (ldpe/film vs. ldpe/injection), each with its own cited
// density/MFI/tensile band. 3 of 7 seeded materials have any (ldpe, hdpe,
// lldpe); the other 4 (pet, pp, ps, pvc) have none -- an empty array here,
// not an error, per R7's "absence renders as nothing" and this unit's own
// requirement to render no band at all when the array is empty.
// ---------------------------------------------------------------------------

const MATERIAL_GRADE_CLASSES_SQL = `
  SELECT id, key, name_fa, name_en, description_fa, description_en, status
  FROM grade_class
  WHERE material_id = $1
  ORDER BY sort_order, key
`;

// D46: no value inheritance. This selects ONLY property_value rows whose
// subject IS the grade_class itself -- never the parent material's rows --
// so a grade class carries exactly what someone explicitly cited for that
// resin population and nothing copied down. Same column shape and same
// editorial/superseded/status filter as MATERIAL_PROPERTY_VALUES_SQL, with
// grade_class_id carried through so the JS layer can bucket rows back to
// their owning class after a single query (one round trip for every class
// on the material, not one query per class).
const MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL = `
  SELECT
    gc.id AS grade_class_id,
    pgr.key AS group_key,
    pgr.name_fa AS group_name_fa,
    pgr.name_en AS group_name_en,
    pd.key AS property_key,
    pd.name_fa AS property_name_fa,
    pd.name_en AS property_name_en,
    pd.symbol AS property_symbol,
    pd.data_type AS property_data_type,
    pv.id AS property_value_id,
    pv.value_min,
    pv.value_max,
    pv.value_typical,
    pv.value_text_fa,
    pv.value_text_en,
    pv.value_enum,
    pv.value_bool,
    pv.unit_display,
    pv.qualifier,
    pv.conditions,
    pv.status AS value_status
  FROM property_value pv
  JOIN grade_class gc ON gc.id = pv.subject_id AND gc.material_id = $1
  JOIN property_definition pd ON pd.id = pv.property_id
  JOIN property_group pgr ON pgr.id = pd.group_id
  WHERE pv.subject_type = 'grade_class'
    AND pv.value_role = 'editorial'
    AND pv.superseded_by IS NULL
    AND pv.status <> 'superseded'
  ORDER BY gc.sort_order, gc.key, pgr.sort_order, pd.sort_order, pd.key
`;

// The owner's stated priority: "processing content is the more important
// half" of a grade class. Same table/shape as MATERIAL_PROCESSING_TECHNIQUES_SQL,
// scoped to grade_class_id instead of material_id -- 0 rows today for every
// seeded grade class (checked directly against the database), rendered the
// same explicit-empty way ProcessingTechniqueList.astro already renders 0
// rows for a material, not hidden.
const MATERIAL_GRADE_CLASS_PROCESSING_SQL = `
  SELECT
    gc.id AS grade_class_id,
    pt.key,
    pt.name_fa,
    pt.name_en,
    mp.note_fa,
    mp.note_en,
    mp.status
  FROM material_process mp
  JOIN grade_class gc ON gc.id = mp.grade_class_id AND gc.material_id = $1
  JOIN processing_technique pt ON pt.id = mp.processing_technique_id
  ORDER BY gc.sort_order, gc.key, mp.sort_order, pt.key
`;

interface PropertyValueRow {
  propertyKey: string;
  propertyNameFa: string;
  propertyNameEn: string;
  propertySymbol: string | null;
  propertyDataType: string;
  propertyValueId: string;
  valueMin: number | null;
  valueMax: number | null;
  valueTypical: number | null;
  valueTextFa: string | null;
  valueTextEn: string | null;
  valueEnum: string | null;
  valueBool: boolean | null;
  unitDisplay: string | null;
  qualifier: string | null;
  /** property_value.conditions (db/migrations/0005) -- what makes two rows
   * of the "same" property distinct measurements (e.g. {basis: "yield"} vs
   * {basis: "break"}). Always an object, `{}` when unconditioned -- jsonb
   * NOT NULL DEFAULT '{}' at the schema level, never null here. Surfaced
   * for FE-6 (business-rules.md CR11) and GradeClassBand.astro, which both
   * need it to keep condition-distinct values from looking like the same
   * value repeated. */
  conditions: Record<string, string | number>;
  valueStatus: string;
}

function computeDisplay(camel: PropertyValueRow): string | null {
  if (camel.propertyDataType === 'numeric' || camel.propertyDataType === 'range') {
    return formatValue({
      valueMin: camel.valueMin,
      valueMax: camel.valueMax,
      valueTypical: camel.valueTypical,
      qualifier: camel.qualifier,
      unit: camel.unitDisplay,
    });
  }
  // `display` is the single convenience string, and this API takes no locale
  // parameter anywhere -- exactly like nameFa/nameEn and reagentFa/reagentEn,
  // both halves ship in the response and the caller picks the one matching
  // its locale (valueTextFa / valueTextEn below). Persian is preferred here
  // only because it is what `display` has always returned; the fallback
  // covers a value translated on one side but not the other.
  if (camel.propertyDataType === 'text') return camel.valueTextFa ?? camel.valueTextEn;
  if (camel.propertyDataType === 'enum') return camel.valueEnum;
  if (camel.propertyDataType === 'boolean') {
    return camel.valueBool == null ? null : String(camel.valueBool);
  }
  return null;
}

function mapPropertyValueRow(
  row: Record<string, unknown>,
  citationsByValueId: Map<string, CitationEntry[]>,
) {
  const camel = toCamelCase<PropertyValueRow>(row);
  return {
    key: camel.propertyKey,
    nameFa: camel.propertyNameFa,
    nameEn: camel.propertyNameEn,
    symbol: camel.propertySymbol,
    dataType: camel.propertyDataType,
    valueMin: camel.valueMin,
    valueMax: camel.valueMax,
    valueTypical: camel.valueTypical,
    valueTextFa: camel.valueTextFa,
    valueTextEn: camel.valueTextEn,
    valueEnum: camel.valueEnum,
    valueBool: camel.valueBool,
    qualifier: camel.qualifier,
    unit: camel.unitDisplay,
    display: computeDisplay(camel),
    status: camel.valueStatus,
    citations: citationsByValueId.get(camel.propertyValueId) ?? [],
    conditions: camel.conditions,
  };
}

interface GradeClassRow {
  id: string;
  key: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  status: string;
}

// Buckets the flat property/processing row sets back onto their owning
// grade class (both queries are ordered by grade_class so this is a single
// linear pass via groupConsecutiveBy, not N queries for N classes) and
// reuses mapPropertyValueRow/the same citation map the material-level
// values already go through -- a grade class's cited value looks exactly
// like a material's cited value to the frontend, same ValueAtom shape.
function buildGradeClasses(
  gradeClassRows: Record<string, unknown>[],
  propertyRows: Record<string, unknown>[],
  processingRows: Record<string, unknown>[],
  citationsByValueId: Map<string, CitationEntry[]>,
) {
  const propertyRowsByGradeClass = new Map(
    groupConsecutiveBy(propertyRows, (r) => r.grade_class_id as string).map((g) => [g.key, g.rows]),
  );
  const processingRowsByGradeClass = new Map(
    groupConsecutiveBy(processingRows, (r) => r.grade_class_id as string).map((g) => [g.key, g.rows]),
  );

  return gradeClassRows.map((row) => {
    const camel = toCamelCase<GradeClassRow>(row);
    const ownPropertyRows = propertyRowsByGradeClass.get(camel.id) ?? [];
    const propertyGroups = groupConsecutiveBy(ownPropertyRows, (r) => r.group_key as string).map(
      ({ rows }) => {
        const first = toCamelCase<{
          groupKey: string;
          groupNameFa: string;
          groupNameEn: string;
        }>(rows[0]!);
        return {
          key: first.groupKey,
          nameFa: first.groupNameFa,
          nameEn: first.groupNameEn,
          properties: rows.map((r) => mapPropertyValueRow(r, citationsByValueId)),
        };
      },
    );
    const ownProcessingRows = processingRowsByGradeClass.get(camel.id) ?? [];

    return {
      key: camel.key,
      nameFa: camel.nameFa,
      nameEn: camel.nameEn,
      descriptionFa: camel.descriptionFa,
      descriptionEn: camel.descriptionEn,
      status: camel.status,
      propertyGroups,
      processingTechniques: ownProcessingRows.map((r) => toCamelCase(r)),
    };
  });
}

export function registerMaterialsRoutes(app: FastifyInstance, pool: pg.Pool, config: Config): void {
  app.get<{ Querystring: MaterialsListQuery }>(
    '/api/materials',
    { schema: { querystring: materialsListQuerySchema } },
    async (req, reply) => {
      const { field, family, q, status } = req.query;

      // Cap enforced here regardless of what the client asked for or what
      // the schema alone would allow -- a request for ?limit=99999 is
      // clamped, not honoured.
      const limit = clamp(req.query.limit ?? config.limits.default, 1, config.limits.max);
      const offset = Math.max(req.query.offset ?? 0, 0);

      const whereParams = [field ?? null, family ?? null, status ?? null, q ?? null];

      const [listResult, countResult] = await Promise.all([
        pool.query(MATERIALS_LIST_SQL, [...whereParams, limit, offset]),
        pool.query<{ total: number }>(MATERIALS_COUNT_SQL, whereParams),
      ]);

      return reply.send({
        data: listResult.rows.map(mapMaterialListRow),
        total: countResult.rows[0]?.total ?? 0,
        limit,
        offset,
      });
    },
  );

  app.get<{ Params: { slug: string } }>(
    '/api/materials/:slug',
    { schema: { params: slugParamsSchema } },
    async (req, reply) => {
      const { slug } = req.params;

      const materialResult = await pool.query(MATERIAL_BY_SLUG_SQL, [slug]);
      const materialRow = materialResult.rows[0];
      if (!materialRow) {
        return reply.code(404).send(notFoundError(`No material with slug '${slug}'`));
      }
      const materialId = materialRow.id as string;

      const [
        identifiersResult,
        propertyRowsResult,
        chemResult,
        marketResult,
        structureResult,
        processingTechniquesResult,
        gradeClassesResult,
        gradeClassPropertyRowsResult,
        gradeClassProcessingResult,
      ] = await Promise.all([
        pool.query(MATERIAL_IDENTIFIERS_SQL, [materialId]),
        pool.query(MATERIAL_PROPERTY_VALUES_SQL, [materialId]),
        pool.query(MATERIAL_CHEMICAL_RESISTANCE_SQL, [materialId]),
        pool.query(MATERIAL_MARKET_SHARE_SQL, [materialId]),
        pool.query(MATERIAL_STRUCTURE_SQL, [materialId]),
        pool.query(MATERIAL_PROCESSING_TECHNIQUES_SQL, [materialId]),
        pool.query(MATERIAL_GRADE_CLASSES_SQL, [materialId]),
        pool.query(MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL, [materialId]),
        pool.query(MATERIAL_GRADE_CLASS_PROCESSING_SQL, [materialId]),
      ]);

      // One citations query covers both the material's own values and every
      // grade class's values -- property_value.id is globally unique, so
      // fetchCitationsByValueId (which keys purely off that id) does not need
      // to know or care which subject a value belongs to.
      const propertyValueIds = [
        ...propertyRowsResult.rows.map((r) => r.property_value_id as string),
        ...gradeClassPropertyRowsResult.rows.map((r) => r.property_value_id as string),
      ];
      const citationsByValueId = await fetchCitationsByValueId(pool, propertyValueIds);

      const groupedProperties = groupConsecutiveBy(
        propertyRowsResult.rows,
        (r) => r.group_key as string,
      );
      const propertyGroups = groupedProperties.map(({ rows }) => {
        const first = toCamelCase<{
          groupKey: string;
          groupNameFa: string;
          groupNameEn: string;
        }>(rows[0]!);
        return {
          key: first.groupKey,
          nameFa: first.groupNameFa,
          nameEn: first.groupNameEn,
          properties: rows.map((r) => mapPropertyValueRow(r, citationsByValueId)),
        };
      });

      const identifiers: Record<string, string> = {};
      for (const idRow of identifiersResult.rows) {
        identifiers[idRow.type as string] = idRow.value as string;
      }

      const chemicalResistance = chemResult.rows.map((r) => toCamelCase(r));
      const marketShare = marketResult.rows.map((r) => toCamelCase(r));
      const structureRow = structureResult.rows[0];
      const structure = structureRow ? toCamelCase(structureRow) : null;
      const processingTechniques = processingTechniquesResult.rows.map((r) => toCamelCase(r));
      const gradeClasses = buildGradeClasses(
        gradeClassesResult.rows,
        gradeClassPropertyRowsResult.rows,
        gradeClassProcessingResult.rows,
        citationsByValueId,
      );

      const materialCamel = toCamelCase<{
        slug: string;
        nameFa: string;
        nameEn: string;
        code: string | null;
        status: string;
        overviewFa: string | null;
        overviewEn: string | null;
        discoveryYear: string | null;
        chainType: string | null;
        fieldKey: string;
        fieldNameFa: string;
        fieldNameEn: string;
        familyKey: string;
        familyNameFa: string;
        familyNameEn: string;
        coverageTotalValues: number;
        coverageCitedValues: number;
        coveragePct: number;
      }>(materialRow);

      return reply.send({
        slug: materialCamel.slug,
        nameFa: materialCamel.nameFa,
        nameEn: materialCamel.nameEn,
        code: materialCamel.code,
        status: materialCamel.status,
        overviewFa: materialCamel.overviewFa,
        overviewEn: materialCamel.overviewEn,
        discoveryYear: materialCamel.discoveryYear,
        chainType: materialCamel.chainType,
        field: {
          key: materialCamel.fieldKey,
          nameFa: materialCamel.fieldNameFa,
          nameEn: materialCamel.fieldNameEn,
        },
        family: {
          key: materialCamel.familyKey,
          nameFa: materialCamel.familyNameFa,
          nameEn: materialCamel.familyNameEn,
        },
        coverage: {
          totalValues: materialCamel.coverageTotalValues,
          citedValues: materialCamel.coverageCitedValues,
          coveragePct: materialCamel.coveragePct,
        },
        identifiers,
        propertyGroups,
        chemicalResistance,
        marketShare,
        structure,
        processingTechniques,
        gradeClasses,
      });
    },
  );
}
