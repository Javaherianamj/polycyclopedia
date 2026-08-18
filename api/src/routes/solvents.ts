import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { toCamelCase } from '../case.js';

// ---------------------------------------------------------------------------
// FE-8 step 4 -- GET /api/solvents: the solvent reference datasheet (owner's
// words: "a solvent page too as a datasheet of solvents (all in one)").
//
// One route, no pagination. Contrast materials.ts's LIMIT/OFFSET list: a
// solvent row is five short fields (name, three Hansen numbers, a molar
// volume) with no property groups, grade classes or processing techniques
// underneath it, so even at the ~700-row target this is a low-double-digit
// kB JSON payload -- and both consumers (SolventsIsland's searchable table
// and Learn's HansenSpaceIsland scatter plot) need every point at once, not
// one page of them, so a LIMIT/OFFSET contract would just move the
// pagination problem into the frontend for no benefit.
//
// `solvent` is populated by a sibling curation pass running concurrently in
// tools/curation/ (see db/migrations/0027_solvent.sql's header) and is
// EMPTY at the time this route was written -- `data: []` is therefore a
// real, expected response today, not a bug, and every consumer of this
// endpoint must render that honestly (R4/R7) rather than assume rows exist.
// ---------------------------------------------------------------------------

const SOLVENTS_LIST_SQL = `
  SELECT
    s.id,
    s.key,
    s.name_en,
    s.name_fa,
    s.systematic_name,
    s.cas_number,
    s.hansen_d,
    s.hansen_p,
    s.hansen_h,
    s.molar_volume,
    s.status,
    COALESCE(ec.citation_count, 0)::int AS citation_count
  FROM solvent s
  LEFT JOIN (
    -- evidence is polymorphic (0020); a solvent's Hansen numbers are its
    -- own columns, not property_value rows, so its evidence is attached
    -- directly via evidence.subject_type = 'solvent' / subject_id = solvent.id
    -- (0027), not through the property_value indirection
    -- fetchCitationsByValueId (../citations.ts) uses for materials.
    SELECT subject_id, COUNT(*) AS citation_count
    FROM evidence
    WHERE subject_type = 'solvent'
    GROUP BY subject_id
  ) ec ON ec.subject_id = s.id
  ORDER BY s.name_en
`;

interface SolventRow {
  id: string;
  key: string;
  nameEn: string;
  nameFa: string | null;
  systematicName: string | null;
  casNumber: string | null;
  hansenD: number;
  hansenP: number;
  hansenH: number;
  molarVolume: number | null;
  status: string;
  citationCount: number;
}

export function registerSolventsRoutes(app: FastifyInstance, pool: pg.Pool): void {
  app.get('/api/solvents', async (_req, reply) => {
    const result = await pool.query(SOLVENTS_LIST_SQL);
    const data = result.rows.map((row) => {
      const camel = toCamelCase<SolventRow>(row);
      return {
        key: camel.key,
        nameEn: camel.nameEn,
        nameFa: camel.nameFa,
        systematicName: camel.systematicName,
        casNumber: camel.casNumber,
        hansenD: camel.hansenD,
        hansenP: camel.hansenP,
        hansenH: camel.hansenH,
        molarVolume: camel.molarVolume,
        status: camel.status,
        // Boolean, not the raw count: same "is this backed by at least one
        // source" contract R11/D5 give every other provenance mark on the
        // site (value-atom's mark-cited, sources.ts's coverageOf) -- a
        // reader never needs to know it was 3 citations rather than 1.
        cited: camel.citationCount > 0,
      };
    });
    return reply.send({ data, total: data.length });
  });
}
