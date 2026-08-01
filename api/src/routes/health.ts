import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import { internalError } from '../errors.js';

// Every column is projected explicitly -- no SELECT *. count(*) is cast to
// int because Postgres returns COUNT(*) as bigint, which node-postgres
// parses as a string by default (to avoid precision loss on large counts).
// This count is always small, so casting is safe and keeps the response a
// real JSON number.
const MIGRATIONS_COUNT_SQL = `SELECT count(*)::int AS migrations FROM schema_migration`;

export function registerHealthRoute(app: FastifyInstance, pool: pg.Pool): void {
  app.get('/health', async (_req, reply) => {
    try {
      const result = await pool.query<{ migrations: number }>(MIGRATIONS_COUNT_SQL);
      const migrations = result.rows[0]?.migrations ?? 0;
      return reply.code(200).send({
        status: 'ok',
        database: 'connected',
        migrations,
      });
    } catch (err) {
      app.log.error({ err }, 'health check: database round-trip failed');
      return reply.code(500).send(internalError('Database round-trip failed'));
    }
  });
}
