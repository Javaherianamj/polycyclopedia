# What your extraction agent should hand you, and how to insert it

Companion to `EXTRACTION-TARGET.md` (which says *what* to look for). This file
says *what shape to return it in* and *how you insert it without me*.

---

## The one command

```bash
./tools/curation/ingest.sh extracted.csv            # validate only — writes nothing
./tools/curation/ingest.sh extracted.csv --commit   # actually write
```

Dry-run is the default. `--commit` is a flag you have to type, not something
that happens if you forget one.

After a successful `--commit`, the importer **rewrites your CSV**: imported rows
are deleted from it, rejected rows stay with the reason in an `import_error`
column. So the workflow is: run → fix what's left → run again → repeat until the
file is empty. You never have to track what already landed.

---

## Format 1 — the data CSV (this is 95% of it)

**Ask the agent for exactly this. Nothing more.**

```csv
material_slug,grade_class,grade_class_name_fa,grade_class_name_en,property_key,value_min,value_max,value_typical,qualifier,source_key,page,table,figure,section,test_method,conditions,note_en,confidence,role
```

The three `grade_class*` columns may be left off entirely for material-level
work — the reader matches on column *name*, not position, so a file without
them behaves exactly as before.

You do **not** need the other nine columns the exporter writes
(`property_name_en`, `unit`, `plausible_min`, `current_value`, …). Verified: a
CSV with only the columns above imports fine. Fewer columns = less for an agent
to get wrong.

### Column rules

| Column | Rule |
| --- | --- |
| `material_slug` | one of `ldpe` `hdpe` `lldpe` `pp` `pvc` `pet` `ps` |
| `property_key` | must exist in the registry — see `EXTRACTION-TARGET.md` §3 |
| `value_min` + `value_max` | for a range (`0.915`–`0.935`) |
| `value_typical` | for a single number. Use this **or** min/max, never both |
| `qualifier` | `<` `>` `~` `>=` `<=` — for "less than 0.01" style values |
| `source_key` | must match a row in `curation/sources.csv` |
| `page`/`table`/`figure`/`section` | **at least one is mandatory** |
| `test_method` | `ASTM D1238` — no space inside the code (`ASTM D 150` is rejected) |
| `conditions` | `190 °C, 2.16 kg` / `at 1 MHz` / `@ 1.8 MPa` |
| `note_en` | the verbatim quote it came from |
| `confidence` | 0–1; blank = 0.9 |
| `role` | `primary` / `corroborating` / `conflicting` / `derived_from`; blank is fine |

### Several sources for one property

Emit several rows with the same `material_slug` + `property_key`:

```csv
ldpe,density,0.915,0.935,,,handbook-industrial-pe,111,,,,,,"commercial range",,primary
ldpe,density,,,,,polymer-handbook-4e,V/10,C,,,,,"agrees, wider bound",,corroborating
ldpe,density,,,,,some-datasheet,7,,,,,,"disagrees: gives 0.92-0.94",,conflicting
```

**Exactly one** row carries the number; the rest leave all three value columns
blank and contribute only a citation. Two rows both setting a value for the same
property is **rejected as ambiguous** — that is deliberate, so a disagreement
between sources surfaces to you instead of being silently resolved by row order.

---

## Format 2 — new sources

If the agent cites a book not already in `curation/sources.csv`, it appends a row:

```csv
source_key,title,authors,publisher,edition,year,isbn,doi,url,kind,tier
```

- `kind`: `handbook` `textbook` `standard` `datasheet` `journal_article` `encyclopedia` `website` `internal`
- `tier`: `peer_reviewed_handbook` `standard` `manufacturer_datasheet` `vendor_marketing` `community`

Multi-volume works are one source row **per volume**, matching the existing
convention (`Encyclopedia of Polymer Science and Technology, Vol. 2`), so the
volume lives in the title and the locator stays page/table.

---

## Format 3 — things that DON'T fit (agent must report, you handle manually)

Tell the agent to return these in a **separate section, never mixed into the
CSV**. Each is a real category that will come up:

1. ~~grade-class data~~ — **no longer belongs here.** It goes straight through
   the CSV via the `grade_class` column; see the grade_class section below.
2. **properties with no registry key** — append to `curation/new_properties.md`;
   they need a `property_definition` row before they can be imported.
3. **unit mismatches** — source says `kg/m³`, registry wants `g/cm³`. The agent
   must NOT convert. Report both; you decide.
4. **values outside the plausible envelope** — nearly always a unit error, which
   is exactly why the importer rejects them by default.
5. **non-numeric properties** (`appearance`, `mechanism`, `unit_cell`, the
   `*_notes` ones) — these can be *cited* through the CSV (blank value columns +
   citation) but their text value can't be *set* through it.

---

## grade_class — supported since 2026-08-12

Per-processing-grade values now go through this same CSV. Three columns:

| Column | Rule |
| --- | --- |
| `grade_class` | blank = the value describes the polymer as a class (`subject_type='material'`, the old behaviour). A key like `injection` / `film` / `bopp_film` = it describes **one** processing family |
| `grade_class_name_fa` / `grade_class_name_en` | required **only** when the key is new for that material — `grade_class.name_fa/name_en` are NOT NULL. Existing key → leave both blank |

A table headed *"HDPE: Injection | Blow molding | Film"* is now expressible
directly: three rows, same `property_key`, different `grade_class`. They do not
collide, because the uniqueness rule is per `(material, grade_class, property)`.
PP currently carries `mfi` at 12 g/10min material-level, 12 at `injection` and
3.3 at `bopp_film` — three coexisting truths, which is the point.

Existing keys: `injection`, `blow_molding`, `film`, `bopp_film`,
`rotational_molding`, `thermoforming`, `rotational_molding_gas_phase`,
`rotational_molding_solution`. A typo'd key is **rejected**, not silently
created, unless you also supply both names — that guard is deliberate: a typo
that auto-created a grade would quietly split one grade's data across two.

**Still do not flatten grade data to material level.** That is how a polymer
ends up with three contradictory densities.

---

## Start from the generated template, not from a blank spec

```bash
./tools/etl/.venv/bin/python tools/curation/make_extraction_template.py pvc
```

This writes one row per property that actually applies to that material, with
`property_key` already filled in and `unit` / `plausible_min` / `plausible_max`
shown as context. Hand **that file** to the extraction agent.

This is not a convenience — it removes the two error classes that cost the most
on the first PP/PVC/PMMA pass:

1. **Invented property keys.** `k_value`, `specific_gravity`, `tensile_modulus`,
   `durometer_hardness` are not registry keys. Rows using them are rejected on
   import, so the data is simply lost unless someone re-maps it by hand.
2. **Silent under-coverage.** The agent can't skip a property group it was never
   told existed. Pre-filled rows make every gap visible as an empty row.

---

## Safety net built into `ingest.sh`

After every `--commit` the script counts `published` property values with **no
citation attached** and warns if any exist. That check is there because it has
already caught a real bug: a raw-SQL insert on 2026-08-12 created nine
`published` PET values with zero evidence — the exact "claims to be sourced but
isn't" failure the citation architecture exists to prevent. Going through
`ingest.sh` makes that structurally impossible; the check is belt-and-braces for
anything that bypasses it.

If it ever prints a warning, something wrote to the database outside this
pipeline. Investigate before publishing.
