import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import type { Config } from '../config.js';
import { toCamelCase } from '../case.js';
import { groupConsecutiveBy } from '../group.js';
import { formatValue } from '../format.js';
import { notFoundError } from '../errors.js';

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

const MATERIALS_LIST_SQL = `
  SELECT
    m.slug,
    m.name_fa,
    m.name_en,
    m.code,
    f.key AS field_key,
    fam.key AS family_key,
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

const MATERIAL_BY_SLUG_SQL = `
  SELECT
    m.id,
    m.slug,
    m.name_fa,
    m.name_en,
    m.code,
    m.status,
    f.key AS field_key,
    f.name_fa AS field_name_fa,
    f.name_en AS field_name_en,
    fam.key AS family_key,
    fam.name_fa AS family_name_fa,
    fam.name_en AS family_name_en
  FROM material m
  JOIN field f ON f.id = m.field_id
  JOIN family fam ON fam.id = m.family_id
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
    pgr.ui_tab AS group_ui_tab,
    pd.key AS property_key,
    pd.name_fa AS property_name_fa,
    pd.name_en AS property_name_en,
    pd.symbol AS property_symbol,
    pd.data_type AS property_data_type,
    pv.id AS property_value_id,
    pv.value_min,
    pv.value_max,
    pv.value_typical,
    pv.value_text,
    pv.value_enum,
    pv.value_bool,
    pv.unit_display,
    pv.qualifier,
    pv.status AS value_status
  FROM property_value pv
  JOIN property_definition pd ON pd.id = pv.property_id
  JOIN property_group pgr ON pgr.id = pd.group_id
  WHERE pv.subject_type = 'material'
    AND pv.subject_id = $1
    AND pv.superseded_by IS NULL
    AND pv.status <> 'superseded'
  ORDER BY pgr.sort_order, pd.sort_order, pd.key
`;

const MATERIAL_CITATIONS_SQL = `
  SELECT
    e.property_value_id,
    c.id AS citation_id,
    c.locator,
    e.role,
    e.extraction_method
  FROM evidence e
  JOIN citation c ON c.id = e.citation_id
  WHERE e.property_value_id = ANY($1::bigint[])
`;

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
  SELECT unit_cell, atoms
  FROM material_structure
  WHERE material_id = $1
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
  valueText: string | null;
  valueEnum: string | null;
  valueBool: boolean | null;
  unitDisplay: string | null;
  qualifier: string | null;
  valueStatus: string;
}

interface CitationEntry {
  id: string;
  locator: unknown;
  role: string;
  extractionMethod: string;
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
  if (camel.propertyDataType === 'text') return camel.valueText;
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
    valueText: camel.valueText,
    valueEnum: camel.valueEnum,
    valueBool: camel.valueBool,
    qualifier: camel.qualifier,
    unit: camel.unitDisplay,
    display: computeDisplay(camel),
    status: camel.valueStatus,
    citations: citationsByValueId.get(camel.propertyValueId) ?? [],
  };
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

      const [identifiersResult, propertyRowsResult, chemResult, marketResult, structureResult] =
        await Promise.all([
          pool.query(MATERIAL_IDENTIFIERS_SQL, [materialId]),
          pool.query(MATERIAL_PROPERTY_VALUES_SQL, [materialId]),
          pool.query(MATERIAL_CHEMICAL_RESISTANCE_SQL, [materialId]),
          pool.query(MATERIAL_MARKET_SHARE_SQL, [materialId]),
          pool.query(MATERIAL_STRUCTURE_SQL, [materialId]),
        ]);

      const propertyValueIds = propertyRowsResult.rows.map((r) => r.property_value_id as string);
      const citationsResult = propertyValueIds.length
        ? await pool.query(MATERIAL_CITATIONS_SQL, [propertyValueIds])
        : { rows: [] as Record<string, unknown>[] };

      const citationsByValueId = new Map<string, CitationEntry[]>();
      for (const row of citationsResult.rows) {
        const camel = toCamelCase<{
          propertyValueId: string;
          citationId: string;
          locator: unknown;
          role: string;
          extractionMethod: string;
        }>(row);
        const list = citationsByValueId.get(camel.propertyValueId) ?? [];
        list.push({
          id: camel.citationId,
          locator: camel.locator,
          role: camel.role,
          extractionMethod: camel.extractionMethod,
        });
        citationsByValueId.set(camel.propertyValueId, list);
      }

      const groupedProperties = groupConsecutiveBy(
        propertyRowsResult.rows,
        (r) => r.group_key as string,
      );
      const propertyGroups = groupedProperties.map(({ rows }) => {
        const first = toCamelCase<{
          groupKey: string;
          groupNameFa: string;
          groupNameEn: string;
          groupUiTab: string | null;
        }>(rows[0]!);
        return {
          key: first.groupKey,
          nameFa: first.groupNameFa,
          nameEn: first.groupNameEn,
          uiTab: first.groupUiTab,
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

      const materialCamel = toCamelCase<{
        slug: string;
        nameFa: string;
        nameEn: string;
        code: string | null;
        status: string;
        fieldKey: string;
        fieldNameFa: string;
        fieldNameEn: string;
        familyKey: string;
        familyNameFa: string;
        familyNameEn: string;
      }>(materialRow);

      return reply.send({
        slug: materialCamel.slug,
        nameFa: materialCamel.nameFa,
        nameEn: materialCamel.nameEn,
        code: materialCamel.code,
        status: materialCamel.status,
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
        identifiers,
        propertyGroups,
        chemicalResistance,
        marketShare,
        structure,
      });
    },
  );
}
