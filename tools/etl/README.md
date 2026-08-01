# Polypedia ETL

One-shot migration tooling that converts the legacy `src/data/polymersData.ts`
(a hand-written TypeScript object literal) into seed SQL for the Polypedia
Postgres schema. **This is not part of the app runtime** — nothing here is
imported by the frontend or any server. It exists to do the LDPE/HDPE data
migration once and then be run again only when the legacy source data or the
target schema changes.

## Pipeline

```
src/data/polymersData.ts
        |  ts_object_parser.py   (mini recursive-descent JS/TS literal parser
        v                         -- no Node.js available in this environment)
   raw Python dicts
        |  value_parser.py       (parses legacy SourcedValue strings into
        v                         numeric min/max/typical/qualifier/unit,
   parsed values                  or classifies as text; never guesses --
        |                         raises ValueParseError on anything it
        |  parse_polymers.py      can't confidently classify)
        v  (cross-checks parsed numbers against legacy "shadow" scalar
   ParsedMaterial per polymer     fields like tgValue/minDensity as an
        |                          oracle, and reports every disagreement)
        v
   emit_sql.py
        |
        v
db/seeds/0005_materials_ldpe_hdpe.sql
```

## Setup

A `.venv/` with `pytest` and `hypothesis` already exists in this directory.
If it needs to be recreated:

```bash
cd tools/etl
python3 -m venv .venv
./.venv/bin/pip install pytest hypothesis
```

Always invoke the venv's interpreter directly (no `pip` module is bundled in
the current venv, and there's nothing to `pip install -e` — these are plain
scripts, not a package):

```bash
./.venv/bin/python <script>.py
./.venv/bin/pytest
```

## Running the parser report

```bash
cd tools/etl
./.venv/bin/python parse_polymers.py
```

Prints, for all six polymers in `polymersData.ts`:
- every legacy value string that failed to parse (with the reason)
- every oracle cross-check between a parsed value and its legacy "shadow"
  scalar field, and whether they agree
- a property/chemical-resistance/market-share row count per material

Exits non-zero if there are any unresolved parse failures or oracle
disagreements anywhere in the file. `emit_sql.py` applies its own narrower
gate (`require_clean`), scoped only to the materials it's about to emit.

## Regenerating the seed SQL

```bash
cd tools/etl
./.venv/bin/python emit_sql.py
```

Writes `db/seeds/0005_materials_ldpe_hdpe.sql` (LDPE and HDPE only — see
"Known data defects" below for why the other four polymers aren't seeded).
Refuses to write anything if LDPE or HDPE have any unresolved parse failure
or oracle disagreement. Every `property_value` row is written with
`status='unsourced'`; the tool never invents a citation.

Apply it (idempotent — safe to run more than once):

```bash
docker exec -i polypedia-pg psql -U polypedia -d polypedia -v ON_ERROR_STOP=1 \
    < db/seeds/0005_materials_ldpe_hdpe.sql
```

## Tests

```bash
cd tools/etl
./.venv/bin/pytest
```

- `tests/test_value_parser.py` — example-based tests against real strings
  copied from `polymersData.ts`, one per legacy value grammar form, plus the
  seven known-bad two-variant strings (must raise, not silently parse).
- `tests/test_value_parser_properties.py` — Hypothesis property tests:
  range round-tripping, the `min <= max` invariant, and "a numeric result
  always has at least one real field set".
- `tests/test_oracle.py` — regression guard. Asserts `parse_all_materials()`
  is still zero-failure / zero-disagreement for `ldpe`/`hdpe` specifically,
  and that every property key they parse is registered in the live
  `property_definition` table. This is what stops a future edit to the
  parser or the legacy data from silently reintroducing a defect in the two
  materials that are actually seeded.

`pyproject.toml` sets `pythonpath = ["."]` so `tests/` can `import
parse_polymers` etc. directly without a package install.

## Known data defects (not bugs in this tool)

1. **Seven values in PVC/PET/PS cram two distinct material variants into one
   string** — e.g. `'40 - 60 (Rigid) / 10 - 25 MPa'` (rigid vs. flexible
   PVC), `'35 - 55 (GPPS) / 20 - 35 MPa'` (GPPS vs. HIPS), `'70 - 80 (بدون
   الیاف) / 220'` (unfilled vs. glass-filled PET). These correctly refuse to
   parse — splitting them apart belongs in separate `grade` rows, which is
   out of scope for this migration. PVC, PET and PS are not seeded, so this
   doesn't block anything.
2. **PET density disagrees with its own legacy oracle**: the sourced range
   parses `density.min` to 1.38, but the legacy shadow field `minDensity` is
   1.33 — amorphous vs. crystallized PET, a genuine inconsistency in the
   original data, not a parsing error. PET is not seeded.

Only `ldpe` and `hdpe` are emitted by `emit_sql.py`; both parse and
cross-check 100% cleanly.
