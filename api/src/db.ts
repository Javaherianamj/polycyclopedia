import pg from 'pg';
import type { Config } from './config.js';

const { Pool, types } = pg;

// Postgres NUMERIC (e.g. property_value.confidence, market_share_datum.percentage,
// v_citation_coverage.coverage_pct) is returned as a string by node-postgres by
// default, to avoid silently losing precision on values too large for a JS
// number. Every NUMERIC column this API surfaces is a small percentage or
// confidence score, well within float64 precision, and the spec requires JSON
// numbers rather than strings in every response -- so we opt in to parsing
// NUMERIC (OID 1700) as a JS number for the whole process.
//
// DOUBLE PRECISION (OID 701, used for value_min/value_max/value_typical) is
// already parsed as a number by node-postgres and needs no change here.
types.setTypeParser(1700, (value: string) => Number.parseFloat(value));

export function createPool(config: Config): pg.Pool {
  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    max: config.db.poolMax,
    idleTimeoutMillis: config.db.idleTimeoutMs,
    connectionTimeoutMillis: config.db.connectionTimeoutMs,
  });

  return pool;
}
