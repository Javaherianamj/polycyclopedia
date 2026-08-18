import type pg from 'pg';
import { toCamelCase } from './case.js';

// Shared citation/evidence lookup, extracted out of materials.ts so FE-6's
// compare endpoint (CR18 -- "citation asymmetry is visible") reuses the same
// notion of "this value is cited" rather than inventing a second one.
//
// evidence is polymorphic (subject_type/subject_id, 0020 U1 v2 FR-5).
// property_value_id here maps to the EDITORIAL row's id -- the id every
// consumer (material detail, grade classes, compare) already keys values by
// -- and this returns citations attached either directly to that editorial
// row, or to any observation row linked underneath it via
// editorial_value_id (U1 v2 FR-2): an editorial value "cites all the
// observations beneath it" without requiring citations to be physically
// re-inserted against the editorial row too.
const CITATIONS_FOR_PROPERTY_VALUES_SQL = `
  SELECT
    pv_for_evidence.editorial_id AS property_value_id,
    c.id AS citation_id,
    c.locator,
    e.role,
    e.extraction_method,
    s.title AS source_title,
    s.edition AS source_edition,
    s.tier AS source_tier,
    s.kind AS source_kind
  FROM evidence e
  JOIN (
    SELECT id AS editorial_id, id AS evidence_subject_id FROM property_value
      WHERE id = ANY($1::bigint[]) AND value_role = 'editorial'
    UNION ALL
    SELECT editorial_value_id AS editorial_id, id AS evidence_subject_id FROM property_value
      WHERE editorial_value_id = ANY($1::bigint[]) AND value_role = 'observation'
  ) pv_for_evidence ON pv_for_evidence.evidence_subject_id = e.subject_id
  JOIN citation c ON c.id = e.citation_id
  JOIN source_document sd ON sd.id = c.source_document_id
  JOIN source s ON s.id = sd.source_id
  WHERE e.subject_type = 'property_value'
`;

export interface CitationEntry {
  id: string;
  locator: unknown;
  role: string;
  extractionMethod: string;
  sourceTitle: string;
  sourceEdition: string | null;
  /** source.tier (source_tier enum) -- added for FE-7's sources surfaces,
   * which need to show a reader how credible each backing source is (a
   * peer_reviewed_handbook vs. vendor_marketing citing the same number is
   * not the same claim). Existing consumers (materials.ts, compare.ts)
   * simply don't reference this field; nothing about their response shape
   * changes by its addition. */
  sourceTier: string;
  /** source.kind (source_kind enum), same rationale as sourceTier above. */
  sourceKind: string;
}

/**
 * One round trip covering every property_value id passed in, bucketed back
 * onto its owning id -- the same "one query, not N" discipline
 * MATERIAL_CITATIONS_SQL already used before this was extracted.
 */
export async function fetchCitationsByValueId(
  pool: pg.Pool,
  propertyValueIds: string[],
): Promise<Map<string, CitationEntry[]>> {
  const citationsByValueId = new Map<string, CitationEntry[]>();
  if (propertyValueIds.length === 0) return citationsByValueId;

  const result = await pool.query(CITATIONS_FOR_PROPERTY_VALUES_SQL, [propertyValueIds]);
  for (const row of result.rows) {
    const camel = toCamelCase<{
      propertyValueId: string;
      citationId: string;
      locator: unknown;
      role: string;
      extractionMethod: string;
      sourceTitle: string;
      sourceEdition: string | null;
      sourceTier: string;
      sourceKind: string;
    }>(row);
    const list = citationsByValueId.get(camel.propertyValueId) ?? [];
    list.push({
      id: camel.citationId,
      locator: camel.locator,
      role: camel.role,
      extractionMethod: camel.extractionMethod,
      sourceTitle: camel.sourceTitle,
      sourceEdition: camel.sourceEdition,
      sourceTier: camel.sourceTier,
      sourceKind: camel.sourceKind,
    });
    citationsByValueId.set(camel.propertyValueId, list);
  }
  return citationsByValueId;
}
