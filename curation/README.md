# curation/ — layout

How data actually reaches the site:

```
authored CSV/MD (csv/, md/)  --hand-transform-->  gaps.csv + sources.csv
        (raw extraction)                          (importer input, root)
                                                          |
                                    tools/curation/import_values.py
                                                          |
                                                          v
                                                    PostgreSQL  --> api/ --> web/ (site)
```

**The site never reads these CSVs.** `import_values.py` writes them into the
database; the API serves the database; the frontend reads the API. A CSV in
this folder is a staging artifact, not something the site consumes.

## Folders

| Path | What | Consumed by |
|---|---|---|
| `sources.csv` (root) | Source registry — one row per document, **holds the `url`** that becomes the on-site citation link. | `import_values.py` (hardcoded path) |
| `new_materials.csv` (root) | New-material definitions. | `import_materials.py` (hardcoded path) |
| `hsp-*.csv`, `hsp.pdf` (root) | Hansen solubility inputs. | `extract_hsp*.py`, `import_hsp*.py` (hardcoded paths) |
| `gaps.csv` (root, generated) | **The actual importer input.** Produced by `export_gaps.py`, filled by curator, read by `import_values.py`. | `import_values.py` |
| `md/` | Human/LLM authored per-polymer curation writeups (ABS, PS, PE, PMMA, PP, PVC, PET). Reference only. | humans |
| `csv/` | Raw per-polymer extraction CSVs. **NOT in importer schema** — must be transformed into `gaps.csv` + `sources.csv` before import. | staging only |
| `spec/` | Extraction contracts: `EXTRACTION-TARGET.md`, `AGENT-OUTPUT-FORMAT.md`. | humans / LLM agents |
| `reports/` | Verification + recovery reports. | humans |
| `templates/` | Blank per-material extraction templates. | humans |

> ⚠️ Files at the root are path-coupled to tools in `tools/curation/common.py`.
> Do not move them.

## Importer schema (what `gaps.csv` rows must look like)

`material_slug, property_key, value_min, value_max, value_typical, qualifier,
source_key, page, table, figure, section, test_method, conditions, note_en,
note_fa, confidence, skip, role` — plus the pre-filled export columns.

The authored CSVs in `csv/` use **different, inconsistent column sets** and are
not importable as-is. Use the transform tool below.

## Bulk workflow (authored CSV → DB), with an accuracy gate

```bash
V=tools/etl/.venv/bin/python

# 1. fresh gap template from the DB (pre-fills plausible bounds for V4)
$V tools/curation/export_gaps.py

# 2. transform one or many authored files -> gaps.csv + sources.csv (adds URLs,
#    auto-skips login-walled/pirate citations, de-dupes sources across files)
$V tools/curation/authored_to_gaps.py curation/csv/*.csv

# 3. ACCURACY GATE: re-fetch every source, check the value/quote is really there.
#    Fails on any hallucination; exit code gates CI / a pre-import hook.
$V tools/curation/verify_sources.py curation/gaps.csv

# 4. validate against the DB (writes nothing), then commit in one transaction
$V tools/curation/import_values.py --dry-run
$V tools/curation/import_values.py

# audit what is ALREADY in the DB (catches inaccurate data already committed):
$V tools/curation/verify_sources.py --from-db --material hdpe
```

The extraction contract that keeps `verify_sources.py` able to do its job is
[spec/GEMINI-EXTRACTION-SKILL.md](spec/GEMINI-EXTRACTION-SKILL.md) — the anti-
hallucination rules for the first data-gathering pass (verbatim quotes, public
URLs only, no unit/property confusion).
