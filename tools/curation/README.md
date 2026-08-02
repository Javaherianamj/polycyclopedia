# Adding data by hand

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

The first 8 columns are **already filled in**. Don't touch them — they tell the
script which value you mean.

| Already filled                          | Meaning                                            |
| --------------------------------------- | -------------------------------------------------- |
| `material_slug`                         | `ldpe` or `hdpe`                                   |
| `property_key`                          | which property, e.g. `density`                     |
| `property_name_en` / `property_name_fa` | the readable name                                  |
| `unit`                                  | the unit your number must be in                    |
| `plausible_min` / `plausible_max`       | if your number is outside this, something is wrong |
| `current_value`                         | what the old site claimed, for comparison          |

These are **yours to fill**:

| Column                         | What to type                               | Example               |
| ------------------------------ | ------------------------------------------ | --------------------- |
| `value_min`                    | bottom of a range                          | `0.910`               |
| `value_max`                    | top of a range                             | `0.925`               |
| `value_typical`                | a single number (use instead of min/max)   | `-110`                |
| `qualifier`                    | only for "less than" / "about"             | `<` or `~`            |
| `source_key`                   | short name of the book, from `sources.csv` | `polymer-handbook-4e` |
| `page`                         | **required** — the page you read it on     | `45`                  |
| `table` / `figure` / `section` | instead of, or as well as, a page          | `3-2`                 |
| `test_method`                  | if the book says one                       | `ASTM D1238`          |
| `conditions`                   | if the book says                           | `190C/2.16kg`         |
| `note_en` / `note_fa`          | anything worth remembering                 |                       |
| `confidence`                   | leave blank (defaults to 0.9)              |                       |
| `skip`                         | type `y` to ignore this row                |                       |

**Most rows need only four things: a number, a `source_key`, a `page`, and
nothing else.**

You do not have to fill the whole file. Do ten rows, run steps 3 and 4, come
back tomorrow. Empty rows are ignored.

### Adding a new book

Add a row to `curation/sources.csv`:

| source_key                   | title              | authors      | publisher             | edition | year | kind       | tier                     |
| ---------------------------- | ------------------ | ------------ | --------------------- | ------- | ---- | ---------- | ------------------------ |
| `brydson-plastics-materials` | Plastics Materials | J.A. Brydson | Butterworth-Heinemann | 7th     | 1999 | `handbook` | `peer_reviewed_handbook` |

`source_key` is a short nickname you invent. Use it in `gaps.csv`.

`tier` is one of: `peer_reviewed_handbook`, `standard`, `manufacturer_datasheet`,
`vendor_marketing`, `community`.

`kind` is one of: `handbook`, `textbook`, `standard`, `datasheet`,
`journal_article`, `encyclopedia`, `website`, `internal`.

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

## Two rules

**Never invent a page number.** If you cannot find it, leave the row blank. A
made-up citation cannot be detected later and destroys the point of the project.

**Cite the book you actually read.** If Brydson quotes a 1963 paper and you read
Brydson, cite Brydson.

---

## Checking your progress

```bash
docker exec polypedia-pg psql -U polypedia -d polypedia \
  -c "SELECT * FROM v_citation_coverage;"
```

Today it says 0%. That number going up is the best measure of the project
becoming real.

---

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

| File                 | Role                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `common.py`          | DB connection, CSV column contracts (`GAPS_FIELDNAMES` / `SOURCES_FIELDNAMES`), shared helpers                             |
| `export_gaps.py`     | unsourced `property_value` + `property_definition` → `gaps.csv`; `source` → `sources.csv`                                  |
| `import_values.py`   | Validates (V1–V10) and writes → `source` / `source_document` / `citation` / `property_value` / `evidence`, one transaction |
| `export_workbook.py` | Optional `.xlsx` front-end over the same data                                                                              |
| `import_workbook.py` | `.xlsx` → CSVs → `import_values.main()`                                                                                    |

Both export scripts accept `--material` and `--gaps-csv` / `--sources-csv`
overrides. Full design, including all ten validation rules:
[`curation-design.md`](../../aidlc-docs/construction/curation-workflow/functional-design/curation-design.md).

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

84 tests. Pure-logic tests (`test_common.py`, `test_validation.py`) plus
integration tests against the live database, which exercise the real trigger, the
partial unique index behind supersede, and the `citation.locator` CHECK.

**Tests must leave the database exactly as they found it** — verify with
`SELECT count(*) FROM citation;` (expect 0 on a freshly seeded database). An
earlier build of this tool was verified by importing a citation to _"Polymer
Handbook, page 45"_ and leaving it committed: an invented page number in the one
table whose entire purpose is verifiable provenance. Use obviously-fake source
titles and clean up.
