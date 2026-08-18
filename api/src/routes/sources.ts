import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { toCamelCase } from '../case.js';
import { groupConsecutiveBy } from '../group.js';
import { formatValue } from '../format.js';
import { notFoundError } from '../errors.js';
import { fetchCitationsByValueId, type CitationEntry } from '../citations.js';

// ---------------------------------------------------------------------------
// FE-7 -- sources surfaces. Two read-only capabilities, both in this file:
//
//   GET /api/materials/:slug/sources  -- the per-material "CSV of data with
//     their source" (frontend-plan.md D4): every live property value for
//     the material AND every one of its grade classes, each carrying the
//     citation(s) that back it -- or an empty citations array when it has
//     none, so the reader can see what is NOT sourced (CR-style honesty)
//     instead of that gap being silently invisible.
//
//   GET /api/sources -- the site-wide bibliography: every `source` row
//     (cited or not yet cited), its documents, and how many values it
//     backs.
//
// Both reuse fetchCitationsByValueId (../citations.ts) for "is this value
// cited, and by what" -- the one notion of citedness FE-6's compare
// endpoint and FE-2's popover already share -- rather than inventing a
// second query that could disagree with it about editorial/observation
// resolution.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /api/materials/:slug/sources
// ---------------------------------------------------------------------------

const slugParamsSchema = {
  type: 'object',
  properties: {
    slug: { type: 'string', minLength: 1, maxLength: 200 },
  },
  required: ['slug'],
} as const;

const SOURCES_MATERIAL_BY_SLUG_SQL = `
  SELECT id, slug, name_fa, name_en
  FROM material
  WHERE slug = $1
`;

// Same shape/filters as materials.ts's MATERIAL_PROPERTY_VALUES_SQL
// (editorial, live, not superseded) -- duplicated rather than imported,
// matching the project's existing convention of a route-local query per
// consumer (see MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL right next to its
// material-level sibling in materials.ts).
const SOURCES_MATERIAL_PROPERTY_VALUES_SQL = `
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
    pv.value_text,
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

// Grade classes carry the best-cited data in the project (per the FE-7
// brief) -- they must appear in this endpoint's rows, not just the
// material-level values. Same evidence-polymorphism note as materials.ts:
// this is property_value.subject_type = 'grade_class' (0016), a different
// axis from evidence.subject_type (0020, always 'property_value' here).
const SOURCES_GRADE_CLASS_PROPERTY_VALUES_SQL = `
  SELECT
    gc.id AS grade_class_id,
    gc.key AS grade_class_key,
    gc.name_fa AS grade_class_name_fa,
    gc.name_en AS grade_class_name_en,
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
    pv.value_text,
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

interface SourcesPropertyValueRow {
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
  conditions: Record<string, string | number>;
  valueStatus: string;
}

// Mirrors materials.ts's computeDisplay -- kept as its own small copy
// rather than exported/imported, same reasoning as the SQL duplication
// above.
function computeDisplay(camel: SourcesPropertyValueRow): string | null {
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

interface SourceRowSubject {
  kind: 'material' | 'grade_class';
  key?: string;
  nameFa?: string;
  nameEn?: string;
}

function buildRow(
  row: Record<string, unknown>,
  subject: SourceRowSubject,
  citationsByValueId: Map<string, CitationEntry[]>,
) {
  const camel = toCamelCase<SourcesPropertyValueRow>(row);
  return {
    subject,
    group: groupOf(row),
    propertyValueId: camel.propertyValueId,
    property: {
      key: camel.propertyKey,
      nameFa: camel.propertyNameFa,
      nameEn: camel.propertyNameEn,
      symbol: camel.propertySymbol,
      dataType: camel.propertyDataType,
    },
    display: computeDisplay(camel),
    conditions: camel.conditions,
    status: camel.valueStatus,
    citations: citationsByValueId.get(camel.propertyValueId) ?? [],
  };
}

// group_key/group_name_fa/group_name_en aren't on SourcesPropertyValueRow
// (kept minimal there for computeDisplay's sake) -- pulled separately here
// so buildRow's caller can pass a fully-typed group object without
// widening the interface above for a field only used once per row.
function groupOf(row: Record<string, unknown>) {
  const camel = toCamelCase<{ groupKey: string; groupNameFa: string; groupNameEn: string }>(row);
  return { key: camel.groupKey, nameFa: camel.groupNameFa, nameEn: camel.groupNameEn };
}

function coverageOf(rows: Array<{ citations: unknown[] }>) {
  const totalValues = rows.length;
  const citedValues = rows.filter((r) => r.citations.length > 0).length;
  const coveragePct = totalValues === 0 ? 0 : Math.round((citedValues / totalValues) * 10000) / 100;
  return { totalValues, citedValues, uncitedValues: totalValues - citedValues, coveragePct };
}

export function registerSourcesRoutes(app: FastifyInstance, pool: pg.Pool): void {
  app.get<{ Params: { slug: string } }>(
    '/api/materials/:slug/sources',
    { schema: { params: slugParamsSchema } },
    async (req, reply) => {
      const { slug } = req.params;

      const materialResult = await pool.query(SOURCES_MATERIAL_BY_SLUG_SQL, [slug]);
      const materialRow = materialResult.rows[0];
      if (!materialRow) {
        return reply.code(404).send(notFoundError(`No material with slug '${slug}'`));
      }
      const materialCamel = toCamelCase<{
        id: string;
        slug: string;
        nameFa: string;
        nameEn: string;
      }>(materialRow);

      const [materialPropertyRowsResult, gradeClassPropertyRowsResult] = await Promise.all([
        pool.query(SOURCES_MATERIAL_PROPERTY_VALUES_SQL, [materialCamel.id]),
        pool.query(SOURCES_GRADE_CLASS_PROPERTY_VALUES_SQL, [materialCamel.id]),
      ]);

      // One round trip for every value on the page (material-level and
      // every grade class's), same discipline as materials.ts's
      // GET /api/materials/:slug.
      const propertyValueIds = [
        ...materialPropertyRowsResult.rows.map((r) => r.property_value_id as string),
        ...gradeClassPropertyRowsResult.rows.map((r) => r.property_value_id as string),
      ];
      const citationsByValueId = await fetchCitationsByValueId(pool, propertyValueIds);

      const materialRows = materialPropertyRowsResult.rows.map((r) =>
        buildRow(r, { kind: 'material' as const }, citationsByValueId),
      );

      const gradeClassRows = gradeClassPropertyRowsResult.rows.map((r) => {
        const gcCamel = toCamelCase<{
          gradeClassKey: string;
          gradeClassNameFa: string;
          gradeClassNameEn: string;
        }>(r);
        return buildRow(
          r,
          {
            kind: 'grade_class' as const,
            key: gcCamel.gradeClassKey,
            nameFa: gcCamel.gradeClassNameFa,
            nameEn: gcCamel.gradeClassNameEn,
          },
          citationsByValueId,
        );
      });

      const rows = [...materialRows, ...gradeClassRows];

      return reply.send({
        material: {
          slug: materialCamel.slug,
          nameFa: materialCamel.nameFa,
          nameEn: materialCamel.nameEn,
        },
        coverage: {
          ...coverageOf(rows),
          materialLevel: coverageOf(materialRows),
          gradeClassLevel: coverageOf(gradeClassRows),
        },
        rows,
      });
    },
  );

  registerBibliographyRoute(app, pool);
}

// ---------------------------------------------------------------------------
// GET /api/sources -- site-wide bibliography
// ---------------------------------------------------------------------------

// value_count resolves each evidence row's property_value up to its
// editorial id first (an observation row's evidence still counts toward
// the editorial value it supports -- same resolution fetchCitationsByValueId
// uses, just run in the opposite direction: source -> values, not
// values -> source). Without this, a source backing 5 observations that
// were merged into 1 editorial row would over-count as 5.
//
// Ordered by tier, then how much the source is actually used, then title.
// tier's declaration order in 0001_extensions_and_enums.sql IS the
// credibility ranking Postgres enums carry natively (peer_reviewed_handbook
// -> standard -> manufacturer_datasheet -> vendor_marketing -> community),
// so `ORDER BY s.tier` needs no CASE mapping to sort strongest first. A
// reader scanning the bibliography from the top sees the sources most
// worth trusting, with the ones doing the most work in this database
// (value_count) surfaced first within a tier.
const SOURCE_LIST_SQL = `
  SELECT
    s.id,
    s.kind,
    s.tier,
    s.title,
    s.authors,
    s.publisher,
    s.edition,
    s.year,
    s.isbn,
    s.doi,
    s.url,
    COALESCE(vc.citation_count, 0)::int AS citation_count,
    COALESCE(vc.value_count, 0)::int AS value_count
  FROM source s
  LEFT JOIN (
    SELECT
      sd.source_id,
      COUNT(DISTINCT c.id) AS citation_count,
      COUNT(DISTINCT pv_resolved.editorial_id) AS value_count
    FROM source_document sd
    JOIN citation c ON c.source_document_id = sd.id
    JOIN evidence e ON e.citation_id = c.id AND e.subject_type = 'property_value'
    JOIN (
      SELECT id AS editorial_id, id AS pv_id
        FROM property_value WHERE value_role = 'editorial'
      UNION ALL
      SELECT editorial_value_id AS editorial_id, id AS pv_id
        FROM property_value WHERE value_role = 'observation' AND editorial_value_id IS NOT NULL
    ) pv_resolved ON pv_resolved.pv_id = e.subject_id
    GROUP BY sd.source_id
  ) vc ON vc.source_id = s.id
  ORDER BY s.tier, value_count DESC, s.title
`;

// storage_key/sha256 deliberately excluded: internal object-storage
// bookkeeping (a bucket path, a dedupe hash), not something a reader of the
// bibliography needs. mime_type/page_count/language/retrieved_at describe
// the document itself and are worth showing.
const SOURCE_DOCUMENTS_SQL = `
  SELECT source_id, id, mime_type, page_count, language, retrieved_at
  FROM source_document
  ORDER BY source_id, id
`;

interface SourceListRow {
  id: string;
  kind: string;
  tier: string;
  title: string;
  authors: string | null;
  publisher: string | null;
  edition: string | null;
  year: number | null;
  isbn: string | null;
  doi: string | null;
  url: string | null;
  citationCount: number;
  valueCount: number;
}

interface SourceDocumentRow {
  sourceId: string;
  id: string;
  mimeType: string | null;
  pageCount: number | null;
  language: string | null;
  retrievedAt: string | null;
}

function registerBibliographyRoute(app: FastifyInstance, pool: pg.Pool): void {
  app.get('/api/sources', async (_req, reply) => {
    const [sourcesResult, documentsResult] = await Promise.all([
      pool.query(SOURCE_LIST_SQL),
      pool.query(SOURCE_DOCUMENTS_SQL),
    ]);

    const documentsBySourceId = new Map(
      groupConsecutiveBy(documentsResult.rows, (r) => r.source_id as string).map((g) => [
        g.key,
        g.rows,
      ]),
    );

    const data = sourcesResult.rows.map((row) => {
      const camel = toCamelCase<SourceListRow>(row);
      const ownDocuments = documentsBySourceId.get(camel.id) ?? [];
      return {
        id: camel.id,
        kind: camel.kind,
        tier: camel.tier,
        title: camel.title,
        authors: camel.authors,
        publisher: camel.publisher,
        edition: camel.edition,
        year: camel.year,
        isbn: camel.isbn,
        doi: camel.doi,
        url: camel.url,
        citationCount: camel.citationCount,
        valueCount: camel.valueCount,
        documents: ownDocuments.map((d) => {
          const docCamel = toCamelCase<SourceDocumentRow>(d);
          return {
            id: docCamel.id,
            mimeType: docCamel.mimeType,
            pageCount: docCamel.pageCount,
            language: docCamel.language,
            retrievedAt: docCamel.retrievedAt,
          };
        }),
      };
    });

    return reply.send({ data, total: data.length });
  });
}
