# Functional Design — U5c `family-preset-curation`

**Created**: 2026-08-04
**Superseded a same-day earlier draft of this file** that specified a wide,
one-row-per-material pivoted CSV with per-cell `@page` override syntax. That
design was built partway, then explicitly rejected by the project owner:
*"i think you misunderstood. one polymer per file! keep the way we entered
data with min max and source and note and... want the reference file to be
similar for whole family."* The rejected files (`presets.py`, `export_wide.py`,
`import_wide.py`) were deleted rather than kept as dead code. This document
describes what was actually built.

**Depends on**: U5 (complete), U5b (complete)

## 1. Problem

`gaps.csv` mixes every material into one file and offers every property in
the registry (61 keys) whether or not it is relevant. For someone filling in
dozens of properties across several materials, that is both too long to
navigate and too wide with irrelevant columns before the ones they touch —
the user's own words: "too many columns before the values I fill."

## 2. What was actually wanted

Not a different file *shape*. The existing `gaps.csv` shape — one row per
property, `value_min`/`value_max`/`value_typical`/`qualifier`/`source_key`/
`page`/`note_en`/`note_fa`/etc as separate columns — was explicitly endorsed
("keep the way we entered data"). Two things were wrong, both fixable without
touching the shape at all:

1. **One file per polymer**, not all materials mixed into rows of one file.
2. **A shorter, curated property list per family** ("these features are
   solid between polyolefins"), reused identically for every material in
   that family ("the reference file to be similar for whole family") —
   instead of showing all 61 registry properties regardless of relevance.

Both of these already had 90% of their machinery in place:
`export_gaps.py --material <slug>` already scopes to one material.
`import_values.py` already validates and writes the exact file shape
unchanged. Nothing about validation, the citation chain, or the transaction
guarantee needed to change.

## 3. What was built

### `family_presets.py`
Two plain `list[str]` of property keys, defined once and imported by
`export_gaps.py` — no display-label dict, no pivot-table shape, because
`GAPS_FIELDNAMES` already carries `property_name_en`/`property_name_fa`/`unit`
from the database per row.

- **`POLYOLEFINS_PROPERTIES`** (28 keys) — every property that is not in the
  `academic` group (mw, mn, pdi, Hansen parameters, monomer identity, etc. —
  grade-sensitive, belongs to the full `gaps.csv` workflow once a specific
  citation is being weighed carefully) and not scoped to `thermosets` only.
- **`THERMOSET_RESINS_PROPERTIES`** (17 keys) — the 6 new cure-specific
  properties from `db/seeds/0006_thermoset_taxonomy_and_properties.sql`
  (`gel_time`, `pot_life`, `cure_time`, `cure_temperature`,
  `peak_exotherm_temperature`, `hardness_barcol`), plus the subset of the
  existing registry that still applies to a material that cures instead of
  melting. Explicitly excludes `tm` (no melting point) and `mfi` (no melt
  flow after cure).

### `export_gaps.py --preset {polyolefins,thermoset-resins}`
Filters `GAPS_QUERY` and `GAPS_MISSING_QUERY` (when `--include-missing` is
also passed) to `pd.key = ANY(preset_keys)`, on top of whatever `--material`
filter is active. Same columns, fewer rows — nothing else about the export
changed.

### One file per polymer
When `--material` is given and `--gaps-csv` is not explicitly passed, the
output filename defaults to `curation/{material_slug}.csv` instead of the
shared `curation/gaps.csv`. An explicit `--gaps-csv` always wins, unchanged
from before. `curation/sources.csv` stays exactly as it was — one shared
bibliography file, not material-specific, which is what "the reference file
similar for whole family" actually meant once the property-list question was
separated out from it.

### `import_values.py` — unchanged
Deliberately not touched. A preset-filtered, single-material file has the
identical column contract as `gaps.csv` always had; it round-trips through
the existing importer with no new code path, so every guarantee that file
already had (locator-required citations, one transaction per file,
plausibility bounds, `polypedia_app` least privilege, `--dry-run` performing
the writes then rolling back) applies unchanged.

## 4. Deliverables

```
tools/curation/
  family_presets.py                the two preset lists
  export_gaps.py                   +--preset flag, +one-file-per-polymer default
  tests/test_family_presets.py
```

No new importer, no new validation path, no wide-pivot format.
