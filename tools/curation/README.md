# Curation tooling

CSV round-trip so a domain expert can fill in citations without writing SQL.

**The curator-facing instructions are [`docs/CURATION-GUIDE.md`](../../docs/CURATION-GUIDE.md).**
This file is for developers.

## Usage

```bash
VENV=tools/etl/.venv/bin/python

# Export the gaps (all materials, or one)
$VENV tools/curation/export_gaps.py
$VENV tools/curation/export_gaps.py --material ldpe

# Validate without writing
$VENV tools/curation/import_values.py --dry-run

# Import
$VENV tools/curation/import_values.py
```

Writes to / reads from `curation/gaps.csv` and `curation/sources.csv`. Override
with `--gaps-csv` / `--sources-csv` (the tests use this to work in a temp dir).

`curation/*.csv` is gitignored: it is a working scratchpad, and committing a
half-filled worksheet invites someone to treat it as authoritative.

## Design notes

**Connects as `polypedia_app`**, the least-privilege role — it can write data but
cannot run DDL.

**One transaction for the whole file.** Any validation error or database failure
rolls everything back. A half-applied import is worse than none, because the
curator cannot tell which half landed.

**`--dry-run` actually performs the writes, then rolls back.** This is stronger
than validating in isolation: it proves the inserts really would succeed, and it
lets the summary report accurately whether a row would create a new source or
supersede an existing value.

**Supersede, never overwrite.** Re-citing a value inserts a new `property_value`
and points the old row's `superseded_by` at it (FR-7.1). History is never
destroyed.

**Validation happens before the database sees anything**, so the curator gets
`"value 920 is far outside the plausible range 0.8-2.3 g/cm³. Did you enter
kg/m³ instead of g/cm³?"` rather than `CheckViolation:
property_value_plausible_chk`. The database constraints remain as the final
backstop — validation exists for the error message, not to replace them.

**UTF-8 with BOM** on export, so Excel renders Persian correctly instead of
mojibake. This is not cosmetic; the curator works in Persian.

**Plausibility (V4) blocks by default but is overridable** per row when
`confidence` is set explicitly *and* a note is given. Some real values sit
outside typical bounds and the curator is the domain expert.

## Tests

```bash
tools/etl/.venv/bin/python -m pytest tools/curation/tests/ -q
```

14 tests, run against the live database via the real CLI entry points —
subprocess calls, not imported functions — because the value of this tool is
almost entirely in whether it talks to Postgres correctly.

**Tests must leave the database exactly as they found it.** The `clean_db`
fixture removes anything created, and every fixture source uses an obviously
fake title (`__test_source__ ...`).

This matters more than usual here. An earlier build of this tool was verified by
importing a citation to *"Polymer Handbook, page 45"* and leaving it committed —
an invented page number sitting in the one table whose entire purpose is
verifiable provenance, indistinguishable from real curation work. If you add a
test that writes, make it clean up, and never use a plausible-looking real source.

Verify after any test-suite change:

```bash
docker exec polypedia-pg psql -U polypedia -d polypedia \
  -c "SELECT count(*) FROM citation;"   # expect 0 on a freshly seeded DB
```
