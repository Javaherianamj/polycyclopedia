# Adding data by hand

The full curator workflow, column meanings, validator messages, and citation
rules are in [docs/CURATION-GUIDE.md](../../docs/CURATION-GUIDE.md) — read that
first if you're new. This file gives the exact commands/paths for this tool and,
below "For developers", the internals.

## Where do I type the 109 values?

**In this file:**

```
curation/gaps.csv
```

It already exists. Open it with **LibreOffice Calc** (double-click it). It has
109 rows — one per value that still needs a source. 55 for HDPE, 54 for LDPE.

You type into the empty columns. That is the whole thing.

> **If Persian looks like `Ø¨Ø§Ù„Ø§`**: don't double-click. Open LibreOffice
> Calc first, then _File → Open_, pick the file, and set **Character set:
> Unicode (UTF-8)** in the dialog that appears.

There is a second file, `curation/sources.csv`, listing the books you cite. You
only touch it when you start using a new book.

---

## The four steps

**1. Get the file** (already done — only needed again if you want to start over)

```bash
tools/etl/.venv/bin/python tools/curation/export_gaps.py
```

**2. Type your data into `curation/gaps.csv`.** Save as CSV when LibreOffice asks.

**3. Check it**

```bash
tools/etl/.venv/bin/python tools/curation/import_values.py --dry-run
```

This changes nothing. It just tells you what is wrong. Run it as often as you like.

**4. Save it into the database**

```bash
tools/etl/.venv/bin/python tools/curation/import_values.py
```

---

## Which columns do I fill?

Full column-by-column reference (which are pre-filled, which are yours to type,
and what each one means) is in
[docs/CURATION-GUIDE.md](../../docs/CURATION-GUIDE.md), Step 2 — same columns,
same rule that `page` is required. **Most rows need only four things: a
number, a `source_key`, a `page`, and nothing else.** You do not have to fill
the whole file; blank rows are simply ignored.

### Adding a new book

Add a row to `curation/sources.csv` — see CURATION-GUIDE.md's `sources.csv`
section for the column table, an example row, and what each `tier` value
means. This tool also reads a `kind` column, not covered there: one of
`handbook`, `textbook`, `standard`, `datasheet`, `journal_article`,
`encyclopedia`, `website`, `internal`.

---

## What the checker will tell you

Real messages from step 3:

```
Row 14 (ldpe / density): value 920 is far outside the plausible range
  0.8-2.3 g/cm³. Did you enter kg/m³ instead of g/cm³?

Row 7 (ldpe / tg): no citation locator given. Fill in at least one of
  page, table, figure, or section -- a citation without a location in
  the source isn't verifiable.

Row 26 (ldpe / crystallinity): value_min (55) is greater than
  value_max (40) -- the range is inverted. Swap them, or fix the typo.
```

**The most common mistake is units off by 1000** — kg/m³ instead of g/cm³. That
is what the plausibility check is for.

**Nothing is saved unless every row is correct.** You never end up with half your
work loaded.

---

## Adding a brand-new polymer

`gaps.csv` only lists polymers that are **already** in the database. To add a new
one (PP, PLA, anything), you first declare it in a different small file — then it
shows up in `gaps.csv` like everything else.

**1. Get a blank form**

```bash
tools/etl/.venv/bin/python tools/curation/import_materials.py --template
```

That writes `curation/new_materials.csv` with a header and one example row
(commented out with `#`, so it is ignored).

**2. Fill in one row per new polymer**

Only five things are required: `slug`, `field_key`, `family_key`, `name_fa`,
`name_en`. Everything else is optional.

| Column                                                                                    | What to type                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `slug`                                                                                    | short id, lowercase, no spaces — `pla`, `pp`                                                                                        |
| `field_key`                                                                               | one of: `thermoplastics`, `thermosets`, `elastomers`, `biopolymers`, `composites`, `high_performance_polymers`                      |
| `family_key`                                                                              | e.g. `polyolefins`. If it doesn't exist yet, it will be created — but then you must also fill `family_name_fa` and `family_name_en` |
| `name_fa` / `name_en`                                                                     | the polymer's name                                                                                                                  |
| `code`, `cas`, `resin_code`, `discovery_year`, `overview_fa`, `overview_en`, `chain_type` | optional                                                                                                                            |

**3. Check, then create**

```bash
tools/etl/.venv/bin/python tools/curation/import_materials.py --dry-run
tools/etl/.venv/bin/python tools/curation/import_materials.py
```

**4. Now get its properties**

```bash
tools/etl/.venv/bin/python tools/curation/export_gaps.py --include-missing
```

`--include-missing` is the important part: a new polymer has no values yet, so a
normal export would show nothing for it. With the flag, `gaps.csv` gets a blank
row for **every** property that applies to it — all 55 for a thermoplastic.

Then fill in `gaps.csv` and run `import_values.py` exactly as before.

> For a brand-new row you **must** type a number. When citing a polymer that is
> already in the database you can leave the value blank and just add the
> citation, because the number is already there — but a new row has nothing to
> fall back on.

New polymers are created as `draft`, same as LDPE and HDPE.

---

## The rules

Same as CURATION-GUIDE.md's "The rules that matter" (never invent a page
number, cite the book you actually read, prefer ranges, record disagreements)
— nothing tool-specific to add.

## Checking your progress

```bash
docker exec polypedia-pg psql -U polypedia -d polypedia \
  -c "SELECT * FROM v_citation_coverage;"
```

Today it says 0% — see CURATION-GUIDE.md for what that number means.

---

# For developers

Everything below is maintenance detail. A curator does not need it.

There is also an optional Excel version (`export_workbook.py` /
`import_workbook.py`) that produces an annotated `.xlsx` with dropdowns. The CSV
path above is the primary one; the workbook converts to the same CSVs and runs
the same validation.

## Setup

Reuses `tools/etl/.venv`. It needs `psycopg` and `openpyxl`:

```bash
tools/etl/.venv/bin/python -m ensurepip   # only if .venv/bin/pip is missing
tools/etl/.venv/bin/python -m pip install "psycopg[binary]" openpyxl
```

Connection settings come from `db/.env` (`APP_DB_USER`, `APP_DB_PASSWORD`,
`POSTGRES_PORT`, `POSTGRES_DB`; `DB_HOST` defaults to `localhost`). Both scripts
connect as `polypedia_app`, never as the schema owner — it has DML on the tables
this tool touches and cannot run DDL, so a bug here cannot drop a table.

`curation/*.csv` and `curation/*.xlsx` are gitignored: working scratchpads, not
source.

## Files

| File                  | Role                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `common.py`           | DB connection, CSV column contracts (`GAPS_FIELDNAMES` / `SOURCES_FIELDNAMES` / `NEW_MATERIALS_FIELDNAMES`), shared helpers           |
| `export_gaps.py`      | unsourced (+ `--include-missing`: value-less) `property_value` + `property_definition` → `gaps.csv`; `source` → `sources.csv`         |
| `family_presets.py`   | Curated property-key lists per family (`polyolefins`, `thermoset-resins`), consumed by `export_gaps.py --preset`                      |
| `import_values.py`    | Validates (V1–V10) and writes → `source` / `source_document` / `citation` / `property_value` / `evidence`, one transaction            |
| `import_materials.py` | `curation/new_materials.csv` → `field` (lookup only) / `family` (create if new) / `material` / `material_identifier`, one transaction |
| `export_workbook.py`  | Optional `.xlsx` front-end over the same data                                                                                         |
| `import_workbook.py`  | `.xlsx` → CSVs → `import_values.main()`                                                                                               |

Both export scripts accept `--material` and `--gaps-csv` / `--sources-csv`
overrides. Full design, including all ten validation rules:
[`curation-design.md`](../../aidlc-docs/construction/curation-workflow/functional-design/curation-design.md).

### `--preset` — one file per polymer, a shorter property list

```bash
python export_gaps.py --material ldpe --preset polyolefins
```

Filters both `GAPS_QUERY` and `GAPS_MISSING_QUERY` to
`family_presets.FAMILY_PRESETS[preset]` (a plain `list[str]` of property
keys — no separate importer, no new file shape). **`import_values.py` is
unchanged and unaware this flag exists**: a preset-filtered file has the
same `GAPS_FIELDNAMES` columns as always, just fewer rows, so it round-trips
through the existing importer with zero modifications.

When `--material` is given and `--gaps-csv` is not, the output filename
defaults to `curation/{slug}.csv` instead of the shared `curation/gaps.csv`
— that's the "one file per polymer" part. Passing `--gaps-csv` explicitly
always overrides this, exactly as before.

This replaces an earlier, abandoned design (a wide, one-row-per-material
pivoted format with per-cell `@page` override syntax) that solved a problem
the curator didn't actually have — they wanted the existing columns kept
exactly as they were, just split into a shorter file per polymer. If you
find references to that design elsewhere (e.g. in git history or an old
`aidlc-docs` file), it does not reflect what got built.

## Design decisions the spec left open

- **`current_value` is the fallback, not just context.** All 109 values already
  have their number from the legacy ETL; this campaign is about _citing_ them,
  not re-authoring them. A row with a citation and no new number keeps the
  existing value. It is also the only way the 20 text-typed properties
  (`appearance`, `monomer_formula`, …) can be cited, since `gaps.csv` has no
  column for entering new text.
- **V8 matches the currently-live value, not strictly `status='unsourced'`.**
  Read literally the spec would make re-citing an already-published value
  unreachable, since such a value no longer appears in a fresh export.
  Extended further so a row is only rejected if the material or the property
  genuinely doesn't exist -- if both are real but there's simply no
  `property_value` row yet (a material `import_materials.py` just created,
  or any property that material never had a row for), a new row is created
  instead of the row being rejected. The `current_value` fallback above
  explicitly does not extend to this case: a brand-new row has no existing
  value to fall back to, so it must supply one itself (V1).
- **`import_materials.py` is idempotent by `slug`, not append-only.**
  Re-running the same CSV updates the existing material in place (status is
  left untouched) rather than erroring or duplicating -- a curator fixing a
  typo in `new_materials.csv` shouldn't have to delete anything by hand
  first. `cas`/`resin_code` identifiers are replaced the same way (delete +
  insert for that type), so a corrected value doesn't leave the old one
  behind as an orphan.
- **`source_key` exists only in the CSV.** Sources are matched to existing rows
  by `(title, edition)` — the same natural key as `uq_source_title_edition` — so
  a new key over an existing title matches rather than duplicating.
- **`conditions` is stored as `{"text": "<raw>"}`.** The column is open `jsonb`
  with no seeded convention. Revisit if conditions ever need structured queries.
- **`confidence` is written to both** `property_value.confidence` and
  `evidence.confidence`.
- **Validation completes for every row before any row is written**, which is
  stronger than rolling back on first failure — a file with one bad row never
  touches the database.
- **The V4 unit-slip hint is a heuristic**: it fires at ~10×/100×/1000× either
  bound and names the matching unit mistake.

## Tests

```bash
tools/etl/.venv/bin/python -m pytest tools/curation/tests -q
```

95 tests. Pure-logic tests (`test_common.py`, `test_validation.py`) plus
integration tests against the live database, which exercise the real trigger, the
partial unique index behind supersede, and the `citation.locator` CHECK.
`test_import_materials.py` covers `import_materials.py` specifically (new
material, new family, unknown `field_key`, idempotent re-run, `--template`).

**Tests must leave the database exactly as they found it** — verify with
`SELECT count(*) FROM citation;` (expect 0 on a freshly seeded database). An
earlier build of this tool was verified by importing a citation to _"Polymer
Handbook, page 45"_ and leaving it committed: an invented page number in the one
table whose entire purpose is verifiable provenance. Use obviously-fake source
titles and clean up.
