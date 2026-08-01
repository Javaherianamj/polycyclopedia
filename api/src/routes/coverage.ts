import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { toCamelCase } from '../case.js';

// Wraps v_citation_coverage -- the data-quality dashboard in embryo.
// total_values / cited_values are bigint counts in the view; cast to int
// here so node-postgres returns real JSON numbers rather than strings.
const COVERAGE_SQL = `
  SELECT
    material_slug,
    material_name_fa,
    material_name_en,
    total_values::int AS total_values,
    cited_values::int AS cited_values,
    coverage_pct
  FROM v_citation_coverage
  ORDER BY material_slug
`;

interface CoverageRow {
  materialSlug: string;
  materialNameFa: string;
  materialNameEn: string;
  totalValues: number;
  citedValues: number;
  coveragePct: number;
}

export function registerCoverageRoute(app: FastifyInstance, pool: pg.Pool): void {
  app.get('/api/coverage', async (_req, reply) => {
    const result = await pool.query(COVERAGE_SQL);
    const data = result.rows.map((r) => {
      const camel = toCamelCase<CoverageRow>(r);
      return {
        slug: camel.materialSlug,
        nameFa: camel.materialNameFa,
        nameEn: camel.materialNameEn,
        totalValues: camel.totalValues,
        citedValues: camel.citedValues,
        coveragePct: camel.coveragePct,
      };
    });
    return reply.send({ data });
  });
}
