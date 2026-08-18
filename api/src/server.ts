import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import type pg from 'pg';
import { loadConfig, type Config } from './config.js';
import { createPool } from './db.js';
import { registerHealthRoute } from './routes/health.js';
import { registerMaterialsRoutes } from './routes/materials.js';
import { registerPropertiesRoute } from './routes/properties.js';
import { registerCoverageRoute } from './routes/coverage.js';
import { registerCompareRoute } from './routes/compare.js';
import { registerSourcesRoutes } from './routes/sources.js';
import { registerSolventsRoutes } from './routes/solvents.js';
import { registerHspCorrelationsRoutes } from './routes/hsp-correlations.js';
import { badRequestError, internalError, notFoundError } from './errors.js';

export interface BuildAppOptions {
  config?: Config;
  pool?: pg.Pool;
  logger?: boolean;
}

export interface BuiltApp {
  app: FastifyInstance;
  pool: pg.Pool;
  config: Config;
}

/**
 * Builds the Fastify app WITHOUT binding a port, so tests can exercise it
 * with `app.inject()`. `listen()` is called separately, only from `main()`
 * below, and only when this module is run directly.
 */
export function buildApp(options: BuildAppOptions = {}): BuiltApp {
  const config = options.config ?? loadConfig();
  const pool = options.pool ?? createPool(config);
  const app = Fastify({ logger: options.logger ?? true });

  // Minimal, dependency-free CORS restricted to configured origins. No
  // @fastify/cors dependency is used -- this API's dependency surface is
  // deliberately just `fastify` + `pg`.
  app.addHook('onRequest', async (req, reply) => {
    const origin = req.headers.origin;
    if (origin && config.cors.origins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      reply.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
      reply.code(204).send();
    }
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send(notFoundError('Route not found'));
  });

  app.setErrorHandler((err: FastifyError, req, reply) => {
    // Fastify schema validation failures land here with `err.validation` set.
    if (err.validation) {
      reply.code(400).send(badRequestError(err.message));
      return;
    }
    req.log.error({ err }, 'unhandled error');
    // Never leak a stack trace or SQL back to the client.
    reply.code(500).send(internalError());
  });

  registerHealthRoute(app, pool);
  registerMaterialsRoutes(app, pool, config);
  registerPropertiesRoute(app, pool);
  registerCoverageRoute(app, pool);
  registerCompareRoute(app, pool);
  registerSourcesRoutes(app, pool);
  registerSolventsRoutes(app, pool);
  registerHspCorrelationsRoutes(app, pool);

  return { app, pool, config };
}

async function main(): Promise<void> {
  const { app, pool, config } = buildApp();

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      await pool.end();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: config.server.port, host: config.server.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only listen when this file is run directly (`node dist/server.js` /
// `tsx src/server.ts`), never when imported by tests.
const isMainModule =
  process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  void main();
}
