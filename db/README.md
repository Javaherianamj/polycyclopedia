# Polypedia Database

PostgreSQL 16 schema for the polymer encyclopedia. Plain SQL migrations, no ORM
— Drizzle or Prisma can be layered on later by introspection without a rewrite.

> **Before your next schema session, read [DATA-GAPS.md](DATA-GAPS.md).** It
> lists everything the prototype UI shows that this schema cannot yet store —
> producers, trade names, quiz questions, simulator reference data — plus the
> unpopulated `applies_to_fields` column, which the rebuilt frontend now depends
> on. Each item says what it breaks and what the fix looks like.

## Quick start

```bash
cp db/.env.example db/.env      # then edit the passwords
docker compose -f db/docker-compose.yml up -d
./db/run.sh                     # migrations + seeds
./db/test.sh                    # 16 constraint checks
```

`run.sh --reset` drops and recreates the schema first. `run.sh --migrate` skips
seeds.

**Already set up, container just isn't running?** `docker start polypedia-pg`
is all you need — this is by far the most common error (`connection refused`)
across every script in `db/`, `tools/etl/`, and `tools/curation/`. If that
doesn't bring it back (rare — the container's port publishing can get stuck),
rebuild it against the same data volume, no data lost:
`docker stop polypedia-pg && docker rm polypedia-pg && docker compose -f db/docker-compose.yml up -d`.

## Neon is the database, going forward — where that stands today

The owner has confirmed Neon (managed Postgres) as the project's database
going forward. As of 2026-08-12, here is what is actually true, verified
directly against the Neon project rather than assumed:

- A Neon project exists (`holy-thunder-19020457`, org `org-muddy-poetry-59888412`),
  one branch, `production` (`br-autumn-water-a2ohn0bb`), created 2026-08-06.
  Its identifiers live in `.neon` at the repo root — safe to commit, org/project
  IDs only, no secret.
- `neon env pull` (or equivalent) writes `.env.local` at the repo root:
  `NEON_BRANCH`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`. This file is
  gitignored (`*.local` in root `.gitignore`) and has never been committed —
  treat it exactly like `db/.env`: real credentials, never pasted anywhere.
- **The Neon branch has no schema yet.** Queried directly: `neondb` on that
  branch has zero tables in the public schema. None of the 23 migrations in
  `migrations/` have been applied there. Nothing has been rewired to point at
  it — `db/run.sh`, `db/test.sh`, `db/backup.sh`, and `api/src/config.ts` all
  still read the discrete `POSTGRES_*`/`DB_HOST`/`APP_DB_*` variables and talk
  to the local Docker container on `:55432`, not a `DATABASE_URL`.
- **The local Docker Postgres described below remains the actual working
  database** — it is what every script here connects to, what the curated
  216 property values and 12 citations live in today, and what the API and
  CI (see next paragraph) use. Nothing in this repository currently reads
  from or writes to Neon.
- **CI does not spin up its own Postgres.** `.github/workflows/ci.yml` runs
  typecheck/lint/build for the root package and for `web/` (which has no
  database dependency — `web`'s tests are `vitest`, no DB). It does **not**
  run `api`'s test suite (`api/test/api.test.ts`, which needs a live,
  seeded Postgres) at all right now — that gap predates Neon and is
  independent of it.
- Migrating this project onto Neon for real needs, at minimum: running
  `migrations/*.sql` against the Neon branch, and either teaching
  `api/src/config.ts` to accept a `DATABASE_URL` connection string (it
  currently only accepts the discrete variables above) or translating the
  Neon connection string into those variables by hand. Neither has been done.
  Treat this section as the honest starting point for that work, not a
  description of a completed migration.

## Layout

| Path | Purpose |
|---|---|
| `migrations/` | Forward-only, numbered, immutable once applied. `run.sh` skips versions already recorded in `schema_migration`. |
| `seeds/` | Idempotent reference data. Safe to re-run. |
| `tests/` | Schema verification, run inside a rolled-back transaction. |
| `.env` | Local credentials. **Gitignored — never commit.** |

## Why the schema looks like this

The previous model was a 1278-line TypeScript file where every value was a
display string (`'0.910 - 0.925'`, `'~ 1.51'`, `'10¹⁶ - 10¹⁸'`) and all 269
`sourceId` fields held the same placeholder, `'src_default'`. Three consequences
drove this design:

**Properties are rows, not columns.** Adding "swelling ratio" for a hydrogel is
an `INSERT` into `property_definition` — no migration, no code change. The
alternative (a column per property, or a fixed TypeScript interface) means every
new polymer class is a schema change. `tests/verify_constraints.sql` proves this
by adding a property and a value against it with zero DDL.

**Values are numeric.** `value_min` / `value_max` / `value_typical` plus a
separate `qualifier` column for `<`, `>`, `~`. You cannot answer "find me
polymers with Tg above 100 °C and tensile strength between 40 and 80 MPa"
against strings. A composite GiST index on `(property_id, numrange(...))`
supports the range queries.

**A citation cannot exist without a locator.** `citation.locator` is a `jsonb`
with a `CHECK` requiring at least one of `page`, `table`, `figure`, `section`.
`{}`, `null`, and `{"foo":"bar"}` are all rejected by the database. This is the
structural reason `src_default` cannot happen again — it is enforced by a
constraint, not by a code-review convention.

Values with no citation yet are marked `status='unsourced'` rather than given a
fabricated source. `v_unsourced_values` is the citation work list — note that
since 0026 it derives "uncited" from the `evidence` table rather than from
`status`, because attaching evidence never updated `status` and the two had
drifted apart. `v_citation_coverage` reports per-material coverage.

## Things that exist before they are needed

Two pieces are seeded empty on purpose, because retrofitting them later is a
rewrite rather than a migration:

- **`grade`** — a commercial product (e.g. "Lupolen 2420H") as distinct from the
  generic material. The legacy data already strains against its absence: PVC
  tensile strength is stored as `'40 - 60 (Rigid) / 10 - 25 MPa'`, which is two
  different materials in one string.
- **`tenant_id`** — nullable on `material`, `grade`, `property_value`, with RLS
  policies already active and verified against a non-owner role. NULL means
  Polypedia master data.

## Roles

| Role | Can | Cannot |
|---|---|---|
| `POSTGRES_USER` (owner) | DDL, migrations | — |
| `polypedia_app` | SELECT/INSERT/UPDATE/DELETE | any DDL; write to `schema_migration` |

RLS constrains `polypedia_app` genuinely, because policies do not apply to a
table's owner unless `FORCE ROW LEVEL SECURITY` is set — and the app role is
deliberately not the owner.

## Seeded content

**As of 2026-08-12** (query the live database for current figures — this table
drifts as curation and schema work continues):

| Table | Rows | Source |
|---|---|---|
| `field` / `family` | 6 / 8 | Taxonomy replacing the free-text `family` string |
| `property_group` | 6 | Mirrors the existing UI tab structure |
| `property_definition` | 73 | Transcribed from `src/types/polymer.ts` (55), grown by later curation work |
| `source` | 13 | Transcribed from `src/components/ResourcesModal.tsx`, plus citation-campaign additions |
| `test_method` | 32 | ASTM/ISO methods |
| `organization` | 25 | Manufacturers named in the legacy data, plus publishers |
| `material` | 7 (LDPE, HDPE, LLDPE, PP, PVC, PET, PS) | Generated by `tools/etl/`, then extended via `tools/curation/` |

Nothing in `source` is invented. Bibliographic fields the original component did
not state (ISBN, DOI, exact year) are `NULL` rather than guessed — a wrong ISBN
is worse than a missing one.

## Regenerating material seeds

`db/seeds/0005_materials_ldpe_hdpe.sql` is generated, not hand-written. See
[`tools/etl/`](../tools/etl/) for the parser that converts the legacy
TypeScript into it, and for the known data defects it surfaced.

## Adding citations

Do not write `INSERT` statements by hand for curation work. Use the spreadsheet
workflow in [`tools/curation/`](../tools/curation/), which validates values
against the registry's plausibility bounds, refuses a citation with no page
reference, and applies the whole file in one transaction.

The current work list is the `v_unsourced_values` view:

```sql
SELECT * FROM v_unsourced_values;
```

102 rows as of 2026-08-13 (`SELECT count(*) FROM v_unsourced_values`) — down
from the original 109 seeded uncited values as the citation campaign has
landed real sources for some of them. It read 106 until 0026, which found four
`grade_class` values that already had evidence but still carried a stale
`status='unsourced'`, and which the view had been listing with no subject name
at all because it predated the `grade_class` rung. The curator-facing
instructions are [`docs/CURATION-GUIDE.md`](../docs/CURATION-GUIDE.md), and
[`docs/SOURCING-GUIDE.md`](../docs/SOURCING-GUIDE.md) covers which sources are
appropriate for generic `material` ranges versus grade-level datasheets.
