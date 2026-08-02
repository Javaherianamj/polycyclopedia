# Polypedia — پلی‌پدیا

A Persian-language polymer encyclopedia, and the database behind it.

The goal is a comprehensive, **citable** polymer reference: every property value
traceable to a page in a real document, searchable by target properties ("find me
a material with Tg above 100 °C and tensile strength between 40 and 80 MPa"), and
eventually licensable to companies as a core for communicating with their own
customers.

---

## Where the project is

| Layer                            | State                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** (`src/`)            | Working Persian/RTL SPA, 22 components, interactive simulators. **Still reads the legacy static data file**, not the API. |
| **Database** (`db/`)             | Complete. PostgreSQL 16, 24 tables, 3 views, 9 migrations. Verified against a live container.                             |
| **API** (`api/`)                 | Complete. Read-only Fastify service over the database.                                                                    |
| **ETL** (`tools/etl/`)           | Complete. Migrated LDPE + HDPE out of the legacy TypeScript file.                                                         |
| **Curation** (`tools/curation/`) | Complete. Spreadsheet workflow for the citation campaign.                                                                 |

**Honest status of the data**: 2 materials (LDPE, HDPE) and 109 property values
are in the database. **Citation coverage is 0%** — every value is marked
`unsourced` and both materials are `draft`. Nothing has been fabricated to make
that number look better. Filling it in is the current priority and is
domain-expert work, not programming work. See
[docs/CURATION-GUIDE.md](docs/CURATION-GUIDE.md).

The other four polymers (PP, PVC, PET, PS) are still only in the legacy file.

---

## Quick start

**Prerequisites**: Node.js 22+, Docker, Python 3.12+

```bash
# Frontend
npm install
npm run dev              # http://localhost:3000

# Database
cp db/.env.example db/.env    # then edit the passwords
docker compose -f db/docker-compose.yml up -d
./db/run.sh                   # apply migrations + seeds
./db/test.sh                  # 16 constraint checks

# API
cp api/.env.example api/.env
cd api && npm install && npm run dev    # http://localhost:3001
```

## Repository layout

| Path              | What it is                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- |
| `src/`            | React 19 + Vite 6 + TypeScript + Tailwind v4 frontend (Persian, RTL)                  |
| `api/`            | Fastify read API. Separate `package.json` so `pg` can never reach the browser bundle  |
| `db/`             | SQL migrations, seeds, schema tests, Docker Compose — [README](db/README.md)          |
| `tools/etl/`      | One-shot migration of the legacy data file — [README](tools/etl/README.md)            |
| `tools/curation/` | Spreadsheet workflow for adding citations — [README](tools/curation/README.md)        |
| `tools/legacy/`   | Archived prototype-era scripts, kept for reference — [README](tools/legacy/README.md) |
| `docs/`           | Guides written for humans, not developers                                             |
| `aidlc-docs/`     | AI-DLC process artifacts: requirements, designs, audit trail                          |

## Documentation

Start here depending on what you need:

| Document                                                 | For                                                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [docs/DATABASE-EXPLAINED.md](docs/DATABASE-EXPLAINED.md) | **Read this first.** What the database is and why, written for someone who knows polymers but not databases |
| [docs/CURATION-GUIDE.md](docs/CURATION-GUIDE.md)         | How to add citations using a spreadsheet. No SQL required                                                   |
| [docs/SOURCING-GUIDE.md](docs/SOURCING-GUIDE.md)         | Where to legitimately obtain polymer data, and what not to scrape                                           |
| [db/README.md](db/README.md)                             | Schema design decisions                                                                                     |
| [api/README.md](api/README.md)                           | Endpoints and configuration                                                                                 |

---

## Two ideas that shape everything

**Properties are data, not code.** There is no column named `density` and no
TypeScript field for it. Properties are rows in `property_definition` — 55 of
them. Adding "swelling ratio" for hydrogels is an `INSERT`, requiring no
migration, no code change, and no deploy. There is a test that proves this by
inserting a new property and storing a value against it with zero DDL.

**A citation cannot exist without a page.** `citation.locator` carries a database
`CHECK` requiring at least one of page, table, figure, or section. `{}` is
rejected. `{"foo":"bar"}` is rejected. `{"page":412}` is accepted.

That second rule exists because of what came before it: the prototype had a
`sourceId` field on all 269 values, every one of them containing the placeholder
`'src_default'`, and no component ever read it. Citations were an intention that
had never been wired up. Now the database refuses to store one that cannot say
where it came from — enforced structurally, not by convention.

## Testing

```bash
npm run typecheck && npm run lint && npm run build   # frontend
./db/test.sh                                          # 16 schema checks
cd api && npm test                                    # 17 API tests
tools/etl/.venv/bin/python -m pytest tools/etl/tests -q       # 27 ETL tests
tools/etl/.venv/bin/python -m pytest tools/curation/tests -q  # curation tests
```

Database tests run against a real PostgreSQL container rather than a mock — the
value of this code is almost entirely in whether the SQL is correct — and every
test leaves the database exactly as it found it.

## Deployment

The live site is served by Cloudflare from the `main` branch. Database and API
hosting is not yet decided; see `aidlc-docs/` for the open questions.

## License

Not yet determined. Note that sourced content carries the licensing terms of its
original publisher — see [docs/SOURCING-GUIDE.md](docs/SOURCING-GUIDE.md).
