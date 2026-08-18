import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { toCamelCase } from '../case.js';

// ---------------------------------------------------------------------------
// GET /api/hsp-correlations: the Table A.2 correlation datasheet, sibling to
// solvents.ts's GET /api/solvents (Table A.1). Same reasoning applies here:
// one route, no pagination -- a correlation row is six short fields (name,
// three Hansen numbers, an interaction radius, an optional catalog link)
// with no property groups or grade classes underneath it, so even at the
// ~458-row imported count this is a small JSON payload, and the intended
// consumer (Learn's HansenSpaceIsland sphere rendering, via
// fetch-learn-materials.ts) needs every linked correlation at once.
//
// `hsp_correlation` is populated by tools/curation/import_hsp_correlations.py
// (see db/migrations/0032_hsp_correlation.sql's header) from Appendix A
// Table A.2 of the same Hansen handbook already backing `solvent`.
// ---------------------------------------------------------------------------

const HSP_CORRELATIONS_LIST_SQL = `
  SELECT
    h.id,
    h.key,
    h.handbook_number,
    h.name_raw,
    h.name_en,
    h.name_fa,
    h.section,
    h.uncertainty,
    h.hansen_d,
    h.hansen_p,
    h.hansen_h,
    h.r0,
    h.status,
    m.slug AS material_slug,
    COALESCE(ec.citation_count, 0)::int AS citation_count
  FROM hsp_correlation h
  LEFT JOIN material m ON m.id = h.material_id
  LEFT JOIN (
    -- evidence is polymorphic (0020); a correlation's Hansen numbers are its
    -- own columns, not property_value rows, so its evidence is attached
    -- directly via evidence.subject_type = 'hsp_correlation' / subject_id =
    -- hsp_correlation.id (0031/0032), the same pattern solvent.ts uses.
    SELECT subject_id, COUNT(*) AS citation_count
    FROM evidence
    WHERE subject_type = 'hsp_correlation'
    GROUP BY subject_id
  ) ec ON ec.subject_id = h.id
  ORDER BY h.handbook_number NULLS LAST, h.name_raw
`;

interface HspCorrelationRow {
  id: string;
  key: string;
  handbookNumber: number | null;
  nameRaw: string;
  nameEn: string | null;
  nameFa: string | null;
  section: string | null;
  uncertainty: string | null;
  hansenD: number;
  hansenP: number;
  hansenH: number;
  r0: number;
  status: string;
  materialSlug: string | null;
  citationCount: number;
}

export function registerHspCorrelationsRoutes(app: FastifyInstance, pool: pg.Pool): void {
  app.get('/api/hsp-correlations', async (_req, reply) => {
    const result = await pool.query(HSP_CORRELATIONS_LIST_SQL);
    const data = result.rows.map((row) => {
      const camel = toCamelCase<HspCorrelationRow>(row);
      return {
        key: camel.key,
        handbookNumber: camel.handbookNumber,
        nameRaw: camel.nameRaw,
        nameEn: camel.nameEn,
        nameFa: camel.nameFa,
        section: camel.section,
        uncertainty: camel.uncertainty,
        hansenD: camel.hansenD,
        hansenP: camel.hansenP,
        hansenH: camel.hansenH,
        r0: camel.r0,
        status: camel.status,
        materialSlug: camel.materialSlug,
        // Boolean, not the raw count -- same provenance-mark contract
        // solvents.ts follows (R11/D5): a reader never needs to know it
        // was 3 citations rather than 1.
        cited: camel.citationCount > 0,
      };
    });
    return reply.send({ data, total: data.length });
  });
}
