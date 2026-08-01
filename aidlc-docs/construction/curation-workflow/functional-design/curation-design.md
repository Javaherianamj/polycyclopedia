# Functional Design — U5 `curation-workflow`

**Created**: 2026-08-02
**Depends on**: U1 `database-core` (complete)
**Relationship to U4** `ingestion-engine`: this is the **manual precursor**. U4
automates extraction from documents; U5 is the human loop that must exist and be
understood _first_, because you cannot sensibly automate a review process that
has never been performed by hand.

---

## 1. Problem

109 property values are `status='unsourced'`. The person who can fix that is a
polymer domain expert, not a programmer. Requiring them to write SQL would make
the citation campaign — already the project's slowest and highest-risk activity —
slower still, and would put write access to the production schema in the hands of
someone explicitly self-describing as new to software.

**Constraint that shapes everything below**: the curator is a domain expert with
low software familiarity. Every design decision favours their throughput and
error-recovery over engineering elegance.

---

## 2. The generic/grade distinction (drives sourcing strategy)

This was raised directly by the project owner and is worth recording, because it
determines which sources are even applicable:

|                 | `material` (generic)                                             | `grade` (product)                      |
| --------------- | ---------------------------------------------------------------- | -------------------------------------- |
| Example         | LDPE as a class of matter                                        | Lupolen 2420H                          |
| Value shape     | ranges (density 0.910–0.925)                                     | single measured values (density 0.923) |
| Correct sources | handbooks, encyclopedias, textbooks, open-access review articles | manufacturer datasheets                |
| Wrong source    | a datasheet — it describes one product, not the class            | a handbook — too generic to buy from   |

A producer typically offers 10+ LDPE grades. Averaging their datasheets does
**not** produce the generic material value; it produces an arbitrary number
reflecting that producer's portfolio. Generic ranges must come from sources that
are themselves generalising over the literature.

**U5 targets `material` (generic) only.** Grade-level datasheet import is
deferred to U6 at the owner's explicit instruction ("no concerns now").

---

## 3. Workflow

```
  [1] export_gaps.py  ──>  gaps.csv + sources.csv
                                 |
                                 v
  [2]                    curator fills in Excel / Sheets
                                 |
                                 v
  [3] import_values.py --dry-run  ──>  plain-language error report
                                 |
                                 v  (fix and repeat)
  [4] import_values.py            ──>  database, inside one transaction
```

**Why a spreadsheet rather than a web admin UI**: an admin UI is roughly two
weeks of work and cannot be used offline, in a library, or next to a physical
book. A CSV round-trip is buildable now, works everywhere, gives the curator
undo/sort/filter/comments for free, and produces a reviewable artifact that can
be version-controlled. If curation volume ever justifies an admin UI, this
workflow is what it would be modelled on.

---

## 4. `gaps.csv`

One row per unsourced value. Pre-filled columns give context so the curator never
has to look anything up; blank columns are what they fill.

| Column                                     | Filled by | Notes                                       |
| ------------------------------------------ | --------- | ------------------------------------------- |
| `material_slug`                            | export    | e.g. `ldpe` — do not edit                   |
| `property_key`                             | export    | e.g. `density` — do not edit                |
| `property_name_en` / `_fa`                 | export    | context only, ignored on import             |
| `unit`                                     | export    | canonical unit expected                     |
| `plausible_min` / `plausible_max`          | export    | context: sanity bounds from the registry    |
| `current_value`                            | export    | what is in the database now, for comparison |
| **`value_min`**                            | curator   | bottom of range                             |
| **`value_max`**                            | curator   | top of range                                |
| **`value_typical`**                        | curator   | single value, if not a range                |
| **`qualifier`**                            | curator   | one of `< > ~ >= <=`, optional              |
| **`source_key`**                           | curator   | short key from `sources.csv`                |
| **`page`**                                 | curator   | at least one locator required               |
| **`table`** / **`figure`** / **`section`** | curator   | alternative locators                        |
| **`test_method`**                          | curator   | e.g. `ASTM D1238`, optional                 |
| **`conditions`**                           | curator   | e.g. `190C/2.16kg`, optional                |
| **`note_en`** / **`note_fa`**              | curator   | optional                                    |
| **`confidence`**                           | curator   | 0–1, defaults to 0.9                        |
| **`skip`**                                 | curator   | `y` to leave this row alone                 |

Rows left entirely blank are skipped silently — the curator is expected to work
through the file incrementally over days, not in one sitting.

## 5. `sources.csv`

The bibliography, exported editable so the curator can add a handbook without
touching the database. Columns: `source_key`, `title`, `authors`, `publisher`,
`edition`, `year`, `isbn`, `doi`, `url`, `kind`, `tier`.

`source_key` is a short human-chosen slug (`polymer-handbook-4e`). New rows are
created on import; existing ones are matched, not duplicated.

---

## 6. Validation rules

The importer must reject rather than guess. Every rejection names the CSV row
number and states the fix in plain language.

| #   | Rule                                                             | Rationale                                                                                                 |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| V1  | A value must be supplied (min/max, or typical)                   | An empty row with a citation is meaningless                                                               |
| V2  | `value_min <= value_max`                                         |                                                                                                           |
| V3  | Values must parse as numbers for numeric properties              |                                                                                                           |
| V4  | Value must lie within `plausible_min`/`plausible_max`            | Catches unit slips and typos — the single most common curation error (g/cm³ vs kg/m³ is a factor of 1000) |
| V5  | **At least one locator (page/table/figure/section) is required** | Mirrors the database CHECK. Caught early with a readable message rather than as a constraint violation    |
| V6  | `source_key` must exist in `sources.csv` or the database         |                                                                                                           |
| V7  | `qualifier` must be one of the permitted symbols                 |                                                                                                           |
| V8  | `material_slug` + `property_key` must exist and match a real gap | Guards against edited identifier columns                                                                  |
| V9  | `test_method` must resolve to a seeded `test_method` row         |                                                                                                           |
| V10 | `confidence` must be within 0–1                                  |                                                                                                           |

V4 is a **warning that blocks by default** but can be overridden per row with
`confidence` explicitly set and a note explaining why — some genuine values do sit
outside typical bounds, and the curator is the expert, not the script.

---

## 7. What the importer writes

Per accepted row, inside a single transaction:

1. `source` — created if `source_key` is new, else matched
2. `source_document` — one per source (`storage_key` NULL when no PDF is held;
   the schema permits this deliberately, so a printed book can be cited)
3. `citation` — with the locator jsonb assembled from page/table/figure/section
4. `property_value` — numerics updated, `status` moved `unsourced` → `published`
5. `evidence` — links value to citation, `extraction_method='manual'`,
   `role='primary'`

**Supersede rather than overwrite**: if a value already has evidence, the old row
is marked `superseded_by` the new one rather than being updated in place, per
FR-7.1. History is never destroyed.

**Transactional**: any failure rolls back the entire import. A half-applied
citation campaign is worse than none, because the curator cannot tell which rows
landed.

---

## 8. Testing

| Test               | Asserts                                                            |
| ------------------ | ------------------------------------------------------------------ |
| round-trip         | export → import unchanged → no spurious writes                     |
| missing locator    | rejected with a readable message, not a DB constraint error        |
| implausible value  | density 920 (kg/m³ mistaken for g/cm³) rejected by V4              |
| inverted range     | rejected                                                           |
| unknown source key | rejected                                                           |
| new source row     | creates `source` + `source_document` + `citation`                  |
| status transition  | `unsourced` → `published`, coverage view reflects it               |
| supersede          | re-citing an already-cited value supersedes rather than overwrites |
| dry-run            | writes nothing, reports the same errors                            |
| transactional      | one bad row late in the file rolls back earlier good rows          |
| Persian text       | notes round-trip without mojibake                                  |

---

## 9. Deliverables

```
tools/curation/
  export_gaps.py       DB  -> gaps.csv + sources.csv
  import_values.py     CSV -> DB, validating, transactional, --dry-run
  common.py            shared connection + CSV helpers
  tests/
  README.md
docs/CURATION-GUIDE.md  the curator-facing guide (plain language, Persian-aware)
docs/SOURCING-GUIDE.md  where to legitimately obtain generic-material data
```

Python, reusing the `tools/etl/.venv` toolchain — the curator already has it, and
this is data tooling rather than application runtime.
