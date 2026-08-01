# Polypedia Curation Tools

CSV export/import workflow so a polymer domain expert can add citations to
`unsourced` property values without writing SQL. See
[`aidlc-docs/construction/curation-workflow/functional-design/curation-design.md`](../../aidlc-docs/construction/curation-workflow/functional-design/curation-design.md)
for the full design (columns, validation rules V1-V10, what gets written).
The curator-facing guide is `docs/CURATION-GUIDE.md` (written separately) --
this README is for whoever maintains the tool itself.

**Scope**: `material` (generic) subjects only. Grade-level datasheet import
is a separate, later unit (U6) -- see curation-design.md section 2 for why
grades need a different sourcing strategy (datasheets) than materials
(handbooks/encyclopedias).

## Pipeline

```
export_gaps.py  -->  curation/gaps.csv + curation/sources.csv
                            |  curator fills in, in Excel/Sheets
                            v
import_values.py --dry-run -->  plain-language error report (fix, repeat)
import_values.py           -->  database, one transaction
```

`curation/*.csv` is gitignored -- it's a working scratchpad, not source.

## Setup

Reuses `tools/etl/.venv` (already has pytest + hypothesis). It needs
`psycopg` added -- that venv shipped without a `pip` executable, so bootstrap
one first if `.venv/bin/pip` doesn't exist:

```bash
tools/etl/.venv/bin/python -m ensurepip   # only if .venv/bin/pip is missing
tools/etl/.venv/bin/python -m pip install "psycopg[binary]"
```

Connection settings come from `db/.env` (`APP_DB_USER`, `APP_DB_PASSWORD`,
`POSTGRES_PORT`, `POSTGRES_DB`; `DB_HOST` defaults to `localhost`) -- the
same variable names `api/.env.example` uses, for the same reason: **both
scripts connect as `polypedia_app`, never as the schema owner.**
`polypedia_app` already has INSERT/UPDATE/DELETE on every table this tool
touches (verified against the live grants: `source`, `source_document`,
`citation`, `property_value`, `evidence`, plus the reference tables it only
reads) and cannot run DDL, so a bug here can't drop a table. No grant was
found missing.

## Running

```bash
cd tools/curation
../etl/.venv/bin/python export_gaps.py --material ldpe   # pilot: one material
../etl/.venv/bin/python export_gaps.py                    # or: everything

# curator edits curation/gaps.csv and curation/sources.csv in Excel/Sheets

../etl/.venv/bin/python import_values.py --dry-run   # validate, write nothing
../etl/.venv/bin/python import_values.py              # validate + write
```

Both scripts accept `--gaps-csv` / `--sources-csv` path overrides (used by
the test suite to avoid clobbering a real in-progress worksheet).

## Files

| File               | Role                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.py`        | DB connection (as `polypedia_app`), CSV column contracts (`GAPS_FIELDNAMES` / `SOURCES_FIELDNAMES`), slugging/formatting helpers shared by both scripts |
| `export_gaps.py`   | `property_value` (status=unsourced, material subjects) + `property_definition` → `gaps.csv`; `source` → `sources.csv`                                   |
| `import_values.py` | Validates (V1-V10) and writes `gaps.csv` + `sources.csv` → `source` / `source_document` / `citation` / `property_value` / `evidence`, one transaction   |
| `tests/`           | pytest, against the live database (see below)                                                                                                           |

## Design notes -- where the spec left a call to the code

`curation-design.md` specifies the CSV shape and the ten validation rules
precisely, but a few implementation decisions were left open. Recorded here
so a future reader doesn't have to reverse-engineer them from the diff:

- **`current_value` isn't just for comparison -- it's the fallback.** All
  109 currently-unsourced values already have their number (or text) from
  the legacy ETL import; the campaign is about _citing_ them, not
  re-authoring them. If a curator leaves `value_min`/`value_max`/
  `value_typical` blank but fills in a citation, the importer keeps the
  existing value and only adds the citation. This is also the _only_ way
  the 20 text-typed properties (`appearance`, `monomer_formula`, ...) can
  ever be cited through this workflow, since `gaps.csv` has no column for
  entering a new text value -- see `validate_row`'s V1/V3 handling.

- **V8 matches against the current _live_ value, not strictly
  `status='unsourced'`.** Read literally, "must exist and match a real gap"
  would make the supersede path (re-citing an already-published value)
  unreachable through the normal export → import loop, since a published
  value no longer appears in a fresh `gaps.csv` export. Matching against
  whichever row is currently live for that (material, property) --
  unsourced _or_ already published -- makes both the first citation and a
  later re-citation resolve correctly. See `load_live_values`.

- **`sources.csv` has no `source_key` column in the database** (by design,
  not an oversight -- `db/` was not to be modified). It's a CSV-only
  bookkeeping convenience. The importer matches a `source_key` to an
  existing `source` row by `(title, edition)`, the same natural key the
  database's own `uq_source_title_edition` constraint uses, so a
  `source_key` that's new in the file but whose title/edition already
  exists is matched, not duplicated. Confirmed against the exact worked
  example in curation-design.md section 5 (`"Polymer Handbook"` + `"4th
Edition"` → `polymer-handbook-4e` — see `test_slugify_source_key_matches_design_doc_example`).

- **`conditions` is stored as `{"text": "<raw string>"}`.** The schema
  defines `property_value.conditions` as an open `jsonb` column with no
  prescribed shape, and no seeded row uses it yet, so there was no existing
  convention to match. Worth revisiting if conditions ever need to be
  queried structurally (e.g. "find all values measured at 190°C").

- **`confidence` is written to both `property_value.confidence` and
  `evidence.confidence`**, identically. The design says the CSV column
  "defaults to 0.9" without saying which DB column(s) it feeds; writing
  both keeps them consistent.

- **The transactional guarantee is stronger than "roll back on the first
  bad row."** Every non-blank row is validated _before_ any row is
  written, so a file with one bad row never touches the database at all.
  This satisfies "one bad row late in the file rolls back earlier good
  rows" (nothing commits either way) with a simpler, safer implementation
  than write-then-rollback.

- **The V4 unit-slip hint** (`"Did you enter kg/m³ instead of g/cm³?"`) is
  a heuristic: it fires when the offending value is ~10x, ~100x, or ~1000x
  either plausible bound, and names the matching unit mistake. A value
  that's merely somewhat out of range gets the plain message without a
  guessed cause.

## Tests

```bash
cd tools/curation
../etl/.venv/bin/python -m pytest -q
```

Runs against the live `polypedia-pg` database (as `polypedia_app`) -- no
mocking, so it also exercises the real trigger, the partial unique index
that supersede depends on, and the `citation.locator` CHECK constraint.
Two layers:

- `test_common.py`, `test_validation.py` -- pure logic, no database
  (`validate_row` is exercised with hand-built `LiveValue`/`sources_by_key`
  fixtures). Fast, most of the V1-V10 coverage lives here.
- `test_integration.py` -- against the live database. Every test either
  (a) calls `execute_plan` directly on a connection the `db_conn` fixture
  rolls back in teardown, so nothing it does is ever committed, or (b)
  drives the real CLI via `subprocess` in a scenario that provably never
  commits (`--dry-run`, or a CSV engineered so every row fails validation).
  A run leaves the database exactly as it found it, which the test suite
  itself confirms by comparing `v_unsourced_values`/`source`/`evidence`/
  `citation` counts before and after.

Any row written for test purposes uses the source title `__test_source__`,
chosen to be unmistakably not real curation output -- never a plausible
handbook title, so a leftover row can't be confused with genuine work.

To spot-check the database is clean after running the suite:

```bash
docker exec polypedia-pg psql -U polypedia -d polypedia \
  -c "SELECT (SELECT count(*) FROM v_unsourced_values) unsourced, (SELECT count(*) FROM evidence) evid, (SELECT count(*) FROM citation) cit;"
# expect unsourced=109, evid=0, cit=0 on a freshly seeded DB
```
