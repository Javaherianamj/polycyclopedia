// All configuration comes from environment variables only. No secrets are
// defaulted to a real value here -- see .env.example.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got: ${raw}`);
  }
  return parsed;
}

export interface Config {
  db: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    poolMax: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
  };
  server: {
    port: number;
    host: string;
  };
  cors: {
    origins: string[];
  };
  limits: {
    default: number;
    max: number;
  };
}

export function loadConfig(): Config {
  return {
    db: {
      host: process.env.DB_HOST ?? 'localhost',
      port: intEnv('POSTGRES_PORT', 55432),
      database: requireEnv('POSTGRES_DB'),
      user: requireEnv('APP_DB_USER'),
      password: requireEnv('APP_DB_PASSWORD'),
      poolMax: intEnv('DB_POOL_MAX', 10),
      idleTimeoutMs: intEnv('DB_IDLE_TIMEOUT_MS', 30_000),
      connectionTimeoutMs: intEnv('DB_CONNECTION_TIMEOUT_MS', 5_000),
    },
    server: {
      port: intEnv('PORT', 3001),
      host: process.env.HOST ?? '0.0.0.0',
    },
    cors: {
      origins: (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    },
    limits: {
      default: intEnv('LIMIT_DEFAULT', 50),
      max: intEnv('LIMIT_MAX', 200),
    },
  };
}
