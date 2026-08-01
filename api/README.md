# Polypedia API

A read-only Fastify API over the Polypedia PostgreSQL database. Write paths
(the ingestion engine) are out of scope for this unit -- nothing here mutates
data.

Kept as its own `package.json`, separate from the frontend's, so `pg` can
never end up in the browser bundle.

## Configure

```bash
cp .env.example .env
# edit .env -- in particular APP_DB_PASSWORD must match db/.env's
# APP_DB_PASSWORD (the polypedia_app role), and POSTGRES_PORT must match the
# port the polypedia-pg container publishes.
```

The variable names intentionally match `db/.env.example` (`POSTGRES_PORT`,
`POSTGRES_DB`, `APP_DB_USER`, `APP_DB_PASSWORD`) so one set of values
configures both the database container and this API. See `.env.example` for
the full list, including HTTP port, CORS origins, and list-endpoint limits.

The API connects as `polypedia_app`, the least-privilege role -- it cannot
run DDL and cannot write to `schema_migration`. It must never connect as the
schema owner (`POSTGRES_USER` / `polypedia`).

## Run in dev

Requires the `polypedia-pg` container running with migrations and seeds
applied (see `db/README.md`).

```bash
npm install
npm run dev      # tsx watch, auto-restarts on change
```

Or build and run the compiled output:

```bash
npm run build
npm start
```

## Test

```bash
npm test
```

Runs `node:test` + `fastify.inject()` integration tests against the real
seeded database (the same container the app uses) -- nothing is mocked,
because the value of this unit is almost entirely in whether the SQL is
right. Requires `polypedia-pg` running and `.env` configured.

## Endpoints

| Method | Path                   | Description                                                                                                                                                                    |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/health`              | Liveness plus a real database round-trip. Returns applied migration count.                                                                                                     |
| GET    | `/api/materials`       | Catalog list. Query params: `field`, `family`, `q` (name/code search), `status`, `limit` (default 50, capped at 200), `offset`. Does not include property values.              |
| GET    | `/api/materials/:slug` | Full material detail: taxonomy, identifiers, properties grouped by `property_group` in `sort_order`, chemical resistance, market share, 3D structure. 404 for an unknown slug. |
| GET    | `/api/properties`      | The property registry, grouped the same way, for building pickers and comparison rows from data.                                                                               |
| GET    | `/api/coverage`        | Per-material citation coverage (`v_citation_coverage`) -- the data-quality dashboard in embryo.                                                                                |

### Errors

Every error is `{ "error": { "code": string, "message": string } }`. 404 for
an unknown slug, 400 for a query/param that fails schema validation, 500 for
anything else. No stack traces or SQL ever appear in a response body.

### Security posture

- Connects as `polypedia_app` only.
- Every query is parameterised -- no user input, including the `q` search
  parameter, is ever concatenated into SQL text.
- `limit` is clamped server-side to `LIMIT_MAX` regardless of what the
  client requests.
- No `SELECT *` anywhere -- every column is projected explicitly.
- CORS is restricted to the origins listed in `CORS_ORIGINS`.

### Naming convention

SQL is `snake_case`; the API is `camelCase`. The mapping happens in exactly
one place, `src/case.ts`, not scattered through route handlers.

### Display strings

`src/format.ts` is the only place a numeric property value
(`valueMin`/`valueMax`/`valueTypical`/`qualifier`/`unit`) is turned into a
display string, e.g. `-110 °C`, `0.910 - 0.925 g/cm³`, `~ 1.51`,
`< 0.01 %`, `1e+16 - 1e+18 Ω·cm`. This replaces the legacy model where the
string itself was the stored data.

## Layout

```
api/
  package.json
  tsconfig.json
  .env.example
  src/
    server.ts       app factory (buildApp, exported for tests) + listen (main)
    config.ts        environment variable loading
    db.ts             pg.Pool creation
    case.ts           snake_case -> camelCase mapping (the one place)
    group.ts          groups ordered rows into { group, properties[] } shape
    errors.ts         shared { error: { code, message } } bodies
    format.ts         numerics -> display string (the one formatter)
    routes/
      health.ts
      materials.ts
      properties.ts
      coverage.ts
  test/
    api.test.ts
```
