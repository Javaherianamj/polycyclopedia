# Functional Design — U2 `core-api`

**Created**: 2026-08-01
**Unblocked by**: Node.js 22.22.1 + npm now installed
**Depends on**: U1 `database-core` (complete, verified)

---

## 1. Scope

A read-only HTTP API over the Polypedia database. Write paths (the ingestion
engine, roadmap Phase 3) are explicitly out of scope — nothing in this unit
mutates data.

**In scope**: list materials, fetch one material with its grouped properties,
list the property registry, report citation coverage, health check.

**Out of scope**: target-property search (roadmap Phase 2), authentication,
multi-tenant request context, write endpoints, the frontend swap (U3).

---

## 2. Technology Decisions

| Decision | Choice | Why |
|---|---|---|
| Runtime | Node.js 22 (installed) | Matches the roadmap; now actually available. |
| Framework | Fastify 5 | Roadmap choice. Schema-based validation and serialisation are built in, which matters because responses are large and nested. |
| DB driver | `pg` (node-postgres) | No ORM. The schema is plain SQL and the queries are read-only joins; an ORM would add a translation layer over SQL that is already written and tested. Drizzle can be introduced later for the write paths if it earns its place. |
| Language | TypeScript, ESM | Matches the frontend. |
| Tests | `node:test` + `supertest`-style injection via `fastify.inject()` | No extra test runner dependency; Fastify's `inject()` exercises the full routing/serialisation stack without binding a port. |
| Validation | JSON Schema via Fastify | Response schemas double as documentation and strip unexpected fields. |

**Placement**: `api/` at the workspace root, its own `package.json`. Keeping it
out of the frontend's dependency tree means the browser bundle can never
accidentally import `pg`.

---

## 3. Endpoints

### `GET /health`
Liveness plus a real database round-trip. Returns migration count so a deploy
can assert the schema is at the expected version.

```json
{ "status": "ok", "database": "connected", "migrations": 9 }
```

### `GET /api/materials`
List, for the catalog page. Deliberately does NOT include property values — the
catalog does not need them and including them would make the payload ~50x larger.

Query parameters:
| Param | Type | Notes |
|---|---|---|
| `field` | string | filter by field key |
| `family` | string | filter by family key |
| `q` | string | trigram search over names, code, trade names |
| `status` | string | defaults to all; the UI will pass `published` |
| `limit`, `offset` | int | `limit` defaults 50, capped at 200 |

```json
{
  "data": [
    { "slug": "ldpe", "nameFa": "...", "nameEn": "Low-Density Polyethylene",
      "code": "LDPE", "field": "thermoplastics", "family": "polyolefins",
      "status": "draft", "citationCoverage": 0.0 }
  ],
  "total": 2, "limit": 50, "offset": 0
}
```

### `GET /api/materials/:slug`
Full detail. Properties are returned **grouped by `property_group`, in
`sort_order`**, which is exactly the shape the existing UI tabs consume — so U3
becomes a data-source swap rather than a rewrite.

```json
{
  "slug": "ldpe",
  "nameFa": "...", "nameEn": "...", "code": "LDPE",
  "field": { "key": "thermoplastics", "nameFa": "...", "nameEn": "..." },
  "family": { "key": "polyolefins", "nameFa": "...", "nameEn": "..." },
  "identifiers": { "cas": "9002-88-4", "resin_code": "4" },
  "propertyGroups": [
    {
      "key": "thermal", "nameFa": "...", "nameEn": "Thermal", "uiTab": "eng",
      "properties": [
        { "key": "tg", "nameEn": "Glass Transition Temperature",
          "symbol": "Tg", "dataType": "numeric",
          "valueMin": null, "valueMax": null, "valueTypical": -110,
          "qualifier": null, "unit": "°C", "display": "-110 °C",
          "status": "unsourced", "citations": [] }
      ]
    }
  ],
  "chemicalResistance": [...],
  "marketShare": [...],
  "structure": { "unitCell": "...", "atoms": [...] }
}
```

**`display` is computed server-side**, from the numerics — the inverse of the
legacy model where the string was the truth. One formatter, one place, and the
frontend stops re-deriving it in five copies.

**`citations`** is present and empty on every value today. The field exists now
so the UI can render a provenance marker as soon as the citation campaign
produces data, without an API change.

### `GET /api/properties`
The registry, grouped. Lets the frontend build property pickers and comparison
rows from data instead of hardcoding them (`CompareModal` currently hardcodes
~9 rows in JSX).

### `GET /api/coverage`
Wraps `v_citation_coverage`. The data-quality dashboard in embryo.

---

## 4. Cross-cutting

**Errors**: RFC 7807-ish JSON — `{ error: { code, message } }`. 404 for unknown
slug, 400 for bad query params (Fastify schema validation), 500 otherwise. No
stack traces or SQL in responses.

**Connection pooling**: one `pg.Pool`, size from env, closed on `SIGTERM`.

**Config**: environment only, read from `db/.env`-compatible variable names so
one file configures both. No credentials in code, no defaults that are real
secrets.

**Security posture** (security extension enabled):
- Connects as `polypedia_app`, the least-privilege role — it cannot run DDL,
  so an injection or logic bug cannot drop a table.
- All SQL uses parameterised queries. No string interpolation of user input
  anywhere, including the `q` search parameter.
- `limit` is capped server-side regardless of what the client asks for.
- No `SELECT *` in responses — every field is explicitly projected, so adding a
  sensitive column to a table later cannot silently leak it through an endpoint.
- CORS restricted to configured origins.

**Naming**: SQL is `snake_case`, the API is `camelCase`. Mapping happens in one
place (the row mappers), not scattered through route handlers.

---

## 5. Testing

Integration tests against the real seeded database — the same container U1 uses.
Mocking the database would test the mock, and the value of this unit is almost
entirely in whether the SQL is right.

| Test | Asserts |
|---|---|
| health | 200, migrations = 9 |
| list materials | returns ldpe + hdpe |
| filter by family | `polyolefins` returns both |
| search `q` | matches on English and Persian names |
| get by slug | 200, all 6 property groups present, groups in sort order |
| property count | ldpe = 54, hdpe = 55 (regression guard on the seed) |
| numeric fidelity | `density` returns min 0.910 / max 0.925 as numbers, not strings |
| qualifier fidelity | `water_absorption` returns `qualifier: "<"`, max 0.01 |
| unicode fidelity | `volume_resistivity` returns 1e16/1e18, and Persian text round-trips |
| unknown slug | 404 with an error body, not a 500 |
| limit cap | `?limit=99999` is clamped, not honoured |
| SQL injection | `?q=' OR 1=1 --` returns no rows and does not error |
| registry | 55 definitions across 6 groups |
| coverage | reports 0% for both materials |

---

## 6. Deliverables

```
api/
  package.json
  tsconfig.json
  .env.example
  src/
    server.ts        app factory (exported for tests) + listen
    db.ts            pool, config, graceful shutdown
    format.ts        numerics -> display string (the one formatter)
    routes/
      health.ts
      materials.ts
      properties.ts
      coverage.ts
  test/
    api.test.ts
  README.md
```
