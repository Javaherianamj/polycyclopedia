# Functional Design — U1 `database-core`

**Created**: 2026-07-31T19:39:43Z
**Engine**: PostgreSQL 16
**Migration format**: plain SQL, numbered, forward-only

---

## 1. Design Principles

1. **The registry is the schema.** Properties are rows, not columns. Adding a property for a new polymer field is an `INSERT`. This is the single most important property of this design and directly implements the user's "leave the space for later properties added."
2. **Numerics are primary, display strings are derived.** The legacy model had it backwards (`'0.910 - 0.925'` as truth, `minDensity` as a bolt-on). Here `value_min`/`value_max`/`value_typical` are the truth and any display string is rendered from them.
3. **Invariants are enforced by constraints, not conventions.** "Every citation has a locator" is a `CHECK`, not a code review rule. The `src_default` situation happened because nothing structurally prevented it.
4. **Cheap now, expensive later.** `grade` and `tenant_id` cost one table and one nullable column today; retrofitting them after hundreds of materials exist is a rewrite.
5. **Honest provenance.** A value is either cited, or visibly marked unsourced. There is no third state where an uncited number renders as fact.

---

## 2. Entity Overview

```
   field ──< family ──< material ──< grade
                            |          |
                            +----------+
                            |
                            v
                     property_value >── property_definition >── property_group
                            |    |
                            |    +──> test_method
                            v
                        evidence ──> citation ──> source_document ──> source
```

---

## 3. Enumerated Types

```
material_status    : draft | in_review | published | archived
value_status       : draft | in_review | published | superseded | unsourced
property_data_type : numeric | range | text | enum | boolean
evidence_role      : primary | corroborating | conflicting | derived_from
extraction_method  : manual | llm | table_parser | computed | legacy_import
source_kind        : handbook | textbook | standard | datasheet | journal_article
                     | encyclopedia | website | internal
source_tier        : peer_reviewed_handbook | standard | manufacturer_datasheet
                     | vendor_marketing | community
subject_type       : material | grade
resistance_rating  : excellent | very_good | good | fair | poor | not_recommended
```

`resistance_rating` replaces the legacy `colorClass: 'text-status-success'` — presentation moves to the frontend.

---

## 4. Taxonomy Tables

### 4.1 `field`

Top-level polymer domain. Seeded: Thermoplastics, Thermosets, Elastomers, Biopolymers, Composites, High-Performance Polymers. Extensible by insert.

| Column                             | Type                                   | Notes                       |
| ---------------------------------- | -------------------------------------- | --------------------------- |
| `id`                               | bigint GENERATED ALWAYS AS IDENTITY PK |                             |
| `key`                              | text UNIQUE NOT NULL                   | slug, e.g. `thermoplastics` |
| `name_fa`, `name_en`               | text NOT NULL                          |                             |
| `description_fa`, `description_en` | text                                   |                             |
| `sort_order`                       | int NOT NULL DEFAULT 0                 |                             |

### 4.2 `family`

Nested taxonomy under a field. Replaces today's free-text `PolymerData.family`.

| Column               | Type                              | Notes                    |
| -------------------- | --------------------------------- | ------------------------ |
| `id`                 | bigint identity PK                |                          |
| `field_id`           | bigint NOT NULL REFERENCES field  |                          |
| `parent_id`          | bigint NULL REFERENCES family(id) | self-referential nesting |
| `key`                | text NOT NULL                     |                          |
| `name_fa`, `name_en` | text NOT NULL                     |                          |
| `sort_order`         | int NOT NULL DEFAULT 0            |                          |
|                      | UNIQUE (`field_id`, `key`)        |                          |

Seeded: `polyolefins` (under Thermoplastics), plus `vinyls`, `polyesters`, `styrenics` for the other four legacy materials.

### 4.3 `organization`

Manufacturers, publishers, standards bodies. Replaces the string arrays `iranianManufacturers[]` / `multinationalManufacturers[]`.

| Column               | Type                 | Notes                                           |
| -------------------- | -------------------- | ----------------------------------------------- |
| `id`                 | bigint identity PK   |                                                 |
| `key`                | text UNIQUE NOT NULL |                                                 |
| `name_fa`, `name_en` | text                 | at least one NOT NULL (CHECK)                   |
| `country_code`       | char(2)              | ISO 3166-1 alpha-2                              |
| `kind`               | text NOT NULL        | `manufacturer` / `publisher` / `standards_body` |

### 4.4 `application`, `processing_technique`

Taxonomies replacing `applications[]` and `processing.techniques[]` string arrays. Same shape: `id`, `key` UNIQUE, `name_fa`, `name_en`. Joined to materials via `material_application` / `material_processing_technique`.

---

## 5. Material Tables

### 5.1 `material`

The generic material (LDPE as a class of matter). Textbook ranges, cited to handbooks.

| Column                       | Type                                     | Notes                                   |
| ---------------------------- | ---------------------------------------- | --------------------------------------- |
| `id`                         | bigint identity PK                       |                                         |
| `slug`                       | text UNIQUE NOT NULL                     | e.g. `ldpe` — stable public identifier  |
| `field_id`                   | bigint NOT NULL REFERENCES field         |                                         |
| `family_id`                  | bigint NOT NULL REFERENCES family        |                                         |
| `name_fa`, `name_en`         | text NOT NULL                            |                                         |
| `code`                       | text                                     | e.g. `LDPE`                             |
| `discovery_year`             | text                                     | free text — legacy holds `'1933 (ICI)'` |
| `overview_fa`, `overview_en` | text                                     |                                         |
| `chain_type`                 | text                                     | legacy enum, used by the 3D viewer      |
| `status`                     | material_status NOT NULL DEFAULT 'draft' |                                         |
| `version`                    | int NOT NULL DEFAULT 1                   | bumped on publish                       |
| `published_at`               | timestamptz                              |                                         |
| `tenant_id`                  | bigint NULL REFERENCES tenant            | NULL = Polypedia master data            |
| `created_at`, `updated_at`   | timestamptz NOT NULL DEFAULT now()       |                                         |

### 5.2 `material_identifier`

CAS number, resin code, SMILES, InChI, EC number — extensible key/value rather than fixed columns, because resin code is meaningless outside thermoplastics.

| Column        | Type                                                             |
| ------------- | ---------------------------------------------------------------- |
| `id`          | bigint identity PK                                               |
| `material_id` | bigint NOT NULL REFERENCES material ON DELETE CASCADE            |
| `type`        | text NOT NULL (`cas` / `resin_code` / `smiles` / `inchi` / `ec`) |
| `value`       | text NOT NULL                                                    |
|               | UNIQUE (`material_id`, `type`, `value`)                          |

### 5.3 `grade`

A commercial product (e.g. "Lupolen 2420H"). **Seeded empty in this unit** — exists so the B2B unit does not require re-architecting.

| Column                  | Type                                     | Notes                         |
| ----------------------- | ---------------------------------------- | ----------------------------- |
| `id`                    | bigint identity PK                       |                               |
| `material_id`           | bigint NOT NULL REFERENCES material      |                               |
| `organization_id`       | bigint REFERENCES organization           | manufacturer                  |
| `tenant_id`             | bigint NULL REFERENCES tenant            | NULL = public Polypedia grade |
| `name`                  | text NOT NULL                            |                               |
| `slug`                  | text NOT NULL                            |                               |
| `status`                | material_status NOT NULL DEFAULT 'draft' |                               |
| `datasheet_document_id` | bigint REFERENCES source_document        |                               |
|                         | UNIQUE (`material_id`, `slug`)           |                               |

### 5.4 `material_structure`

3D atom coordinates and crystal structure. `atoms` stays `jsonb` — normalising atom coordinates into rows would be pure overhead.

| Column        | Type                                            |
| ------------- | ----------------------------------------------- |
| `material_id` | bigint PK REFERENCES material ON DELETE CASCADE |
| `atoms`       | jsonb                                           |
| `unit_cell`   | text                                            |

### 5.5 `market_share_datum`

Replaces `marketShare[]`. Currently the least defensible data in the app (uncited percentages presented as fact), so it gets first-class citation support like any other value.

| Column                     | Type                                                  |
| -------------------------- | ----------------------------------------------------- |
| `id`                       | bigint identity PK                                    |
| `material_id`              | bigint NOT NULL REFERENCES material ON DELETE CASCADE |
| `segment_fa`, `segment_en` | text                                                  |
| `percentage`               | numeric(5,2) NOT NULL CHECK (0 <= percentage <= 100)  |
| `region`, `year`           | text / int                                            |
| `status`                   | value_status NOT NULL DEFAULT 'unsourced'             |

### 5.6 `chemical_resistance`

Replaces `chemicalResistance[]`, with the Tailwind class removed.

| Column                     | Type                                                  |
| -------------------------- | ----------------------------------------------------- |
| `id`                       | bigint identity PK                                    |
| `material_id`              | bigint NOT NULL REFERENCES material ON DELETE CASCADE |
| `reagent_fa`, `reagent_en` | text NOT NULL                                         |
| `rating`                   | resistance_rating NOT NULL                            |
| `note_fa`, `note_en`       | text                                                  |
| `status`                   | value_status NOT NULL DEFAULT 'unsourced'             |

---

## 6. Property Registry — the core of the design

### 6.1 `property_group`

Seeded to exactly match the existing UI tab structure so the frontend can keep its layout: `processing`, `thermal`, `mechanical`, `physical`, `electrical`, `academic`.

| Column               | Type                   |
| -------------------- | ---------------------- |
| `id`                 | bigint identity PK     |
| `key`                | text UNIQUE NOT NULL   |
| `name_fa`, `name_en` | text NOT NULL          |
| `ui_tab`             | text                   | `ind` / `eng` / `aca` — mirrors App.tsx's tab keys |
| `sort_order`         | int NOT NULL DEFAULT 0 |

### 6.2 `property_definition`

**The extensibility mechanism.** ~55 rows seeded from `src/types/polymer.ts`.

| Column                             | Type                                      | Notes                                                          |
| ---------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `id`                               | bigint identity PK                        |                                                                |
| `group_id`                         | bigint NOT NULL REFERENCES property_group |                                                                |
| `key`                              | text UNIQUE NOT NULL                      | e.g. `tg`, `tensile_strength`, `hansen_d`                      |
| `name_fa`, `name_en`               | text NOT NULL                             |                                                                |
| `description_fa`, `description_en` | text                                      | seeded from `InfoTooltip` strings — glossary text becomes data |
| `data_type`                        | property_data_type NOT NULL               |                                                                |
| `canonical_unit`                   | text                                      | NULL for text/boolean types                                    |
| `allowed_units`                    | text[] NOT NULL DEFAULT '{}'              | for the unit normaliser                                        |
| `plausible_min`, `plausible_max`   | double precision                          | ingestion sanity bounds                                        |
| `applies_to_fields`                | text[] NOT NULL DEFAULT '{}'              | empty = applies to all fields                                  |
| `is_searchable`                    | boolean NOT NULL DEFAULT true             |                                                                |
| `is_comparable`                    | boolean NOT NULL DEFAULT true             |                                                                |
| `always_review`                    | boolean NOT NULL DEFAULT false            | ingestion policy                                               |
| `symbol`                           | text                                      | e.g. `Tg`, `M_w` — for UI rendering                            |
| `sort_order`                       | int NOT NULL DEFAULT 0                    |                                                                |

**CHECK**: `data_type IN ('numeric','range')` implies `canonical_unit IS NOT NULL` — a numeric property without a unit is meaningless.

### 6.3 `test_method`

ASTM/ISO methods already referenced in `ResourcesModal.tsx`.

| Column          | Type                                   |
| --------------- | -------------------------------------- |
| `id`            | bigint identity PK                     |
| `standard_body` | text NOT NULL (`ASTM` / `ISO` / `DIN`) |
| `code`          | text NOT NULL (e.g. `D1238`)           |
| `title`         | text                                   |
|                 | UNIQUE (`standard_body`, `code`)       |

### 6.4 `property_value`

| Column                                    | Type                                           | Notes                                   |
| ----------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| `id`                                      | bigint identity PK                             |                                         |
| `subject_type`                            | subject_type NOT NULL                          | `material` or `grade`                   |
| `subject_id`                              | bigint NOT NULL                                | polymorphic — see integrity note below  |
| `property_id`                             | bigint NOT NULL REFERENCES property_definition |                                         |
| `value_min`, `value_max`, `value_typical` | double precision                               | canonical unit                          |
| `value_text`                              | text                                           | DEPRECATED by 0030 — see the pair below |
| `value_text_fa`, `value_text_en`          | text                                           | for `text` data_type (0030)             |
| `value_enum`                              | text                                           | for `enum` data_type                    |
| `value_bool`                              | boolean                                        | for `boolean` data_type                 |
| `unit_display`                            | text                                           | what to show, may differ from canonical |
| `qualifier`                               | text                                           | `<`, `>`, `~`, `≥`, `≤`                 |
| `test_method_id`                          | bigint REFERENCES test_method                  |                                         |
| `conditions`                              | jsonb NOT NULL DEFAULT '{}'                    | e.g. `{"temp_c":190,"load_kg":2.16}`    |
| `note_fa`, `note_en`                      | text                                           | legacy `SourcedValue.note`              |
| `confidence`                              | numeric(3,2) CHECK (0 <= confidence <= 1)      |                                         |
| `status`                                  | value_status NOT NULL DEFAULT 'draft'          |                                         |
| `superseded_by`                           | bigint REFERENCES property_value(id)           | append-with-supersede                   |
| `tenant_id`                               | bigint NULL REFERENCES tenant                  |                                         |
| `created_by`, `created_at`, `updated_at`  |                                                |                                         |

**Constraints:**

- `CHECK`: at least one of `value_min`, `value_max`, `value_typical`, `value_text`, `value_text_fa`, `value_text_en`, `value_enum`, `value_bool` is NOT NULL — an empty value row is meaningless. (`value_text_fa`/`value_text_en` added to the check by 0030, so a row carrying only the bilingual pair is valid.)
- `CHECK`: `value_min <= value_max` when both are present.
- **Partial unique index**: one live value per (subject, property, conditions) — `WHERE superseded_by IS NULL AND status <> 'superseded'`.
- Polymorphic `subject_id` cannot use a plain FK. Integrity is enforced by a trigger validating existence in the target table. _(Alternative considered: separate `material_property_value`/`grade_property_value` tables. Rejected — it doubles every query and every index for the same guarantee.)_

**Indexes:**

- `(subject_type, subject_id)` — the material detail page's primary access path
- `(property_id)`
- GiST on `numrange(value_min, value_max, '[]')` — range search for roadmap Phase 2
- Partial index `WHERE status = 'unsourced'` — the citation work list

---

## 7. Citation Chain

### 7.1 `source`

A work. Seeded from `ResourcesModal.tsx`'s bibliography.

| Column                                               | Type                               |
| ---------------------------------------------------- | ---------------------------------- |
| `id`                                                 | bigint identity PK                 |
| `kind`                                               | source_kind NOT NULL               |
| `tier`                                               | source_tier NOT NULL               |
| `title`                                              | text NOT NULL                      |
| `authors`                                            | text                               |
| `publisher`, `edition`, `year`, `isbn`, `doi`, `url` |                                    |
| `created_at`                                         | timestamptz NOT NULL DEFAULT now() |

### 7.2 `source_document`

A specific file/edition of a source.

| Column                                | Type                              | Notes                                                     |
| ------------------------------------- | --------------------------------- | --------------------------------------------------------- |
| `id`                                  | bigint identity PK                |                                                           |
| `source_id`                           | bigint NOT NULL REFERENCES source |                                                           |
| `storage_key`                         | text                              | object-storage path; NULL until the file is actually held |
| `sha256`                              | char(64)                          | dedupe key                                                |
| `mime_type`, `page_count`, `language` |                                   |                                                           |
| `retrieved_at`                        | timestamptz                       |                                                           |

### 7.3 `citation`

**Where the `src_default` problem is structurally fixed.**

| Column               | Type                                       | Notes                            |
| -------------------- | ------------------------------------------ | -------------------------------- |
| `id`                 | bigint identity PK                         |                                  |
| `source_document_id` | bigint NOT NULL REFERENCES source_document |                                  |
| `locator`            | jsonb NOT NULL                             | `{page, table, figure, section}` |
| `snippet`            | text                                       | verbatim supporting text         |
| `snippet_lang`       | text                                       |                                  |
| `created_at`         | timestamptz NOT NULL DEFAULT now()         |                                  |

**CHECK (the critical constraint)**: `locator` must be a non-empty object containing at least one of `page`, `table`, `figure`, `section`. A citation that cannot say _where_ in the document is not a citation.

### 7.4 `evidence`

Many-to-many link between a value and its citations.

| Column                     | Type                                                        |
| -------------------------- | ----------------------------------------------------------- |
| `id`                       | bigint identity PK                                          |
| `property_value_id`        | bigint NOT NULL REFERENCES property_value ON DELETE CASCADE |
| `citation_id`              | bigint NOT NULL REFERENCES citation                         |
| `role`                     | evidence_role NOT NULL DEFAULT 'primary'                    |
| `extraction_method`        | extraction_method NOT NULL                                  |
| `confidence`               | numeric(3,2)                                                |
| `formula_ref`              | text                                                        | for `derived_from` — which formula produced this |
| `created_by`, `created_at` |                                                             |
|                            | UNIQUE (`property_value_id`, `citation_id`, `role`)         |

---

## 8. Tenancy, Audit, Migration Bookkeeping

### 8.1 `tenant`

| Column   | Type                           |
| -------- | ------------------------------ |
| `id`     | bigint identity PK             |
| `slug`   | text UNIQUE NOT NULL           |
| `name`   | text NOT NULL                  |
| `status` | text NOT NULL DEFAULT 'active' |

Seeded empty. Row-level security is enabled on `material`, `grade`, `property_value` with a policy admitting master data (`tenant_id IS NULL`) plus rows matching the session's `app.tenant_id` setting.

### 8.2 `audit_log`

| Column                          | Type                               |
| ------------------------------- | ---------------------------------- |
| `id`                            | bigint identity PK                 |
| `actor`                         | text                               |
| `entity`, `entity_id`, `action` | text / bigint / text               |
| `before`, `after`               | jsonb                              |
| `at`                            | timestamptz NOT NULL DEFAULT now() |

### 8.3 `schema_migration`

| Column       | Type                               |
| ------------ | ---------------------------------- |
| `version`    | text PK                            |
| `applied_at` | timestamptz NOT NULL DEFAULT now() |
| `checksum`   | text                               |

---

## 9. Convenience Views

| View                    | Purpose                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `v_material_properties` | Flattened material + property + value + group, live rows only. The read path a `GET /materials/:slug` will use.    |
| `v_unsourced_values`    | Every live value that no `evidence` row supports (since 0026 — not `status='unsourced'`, which drifts), joined to its subject and property names across all four subject types. **The citation campaign work list.** |
| `v_citation_coverage`   | Per material: total values, cited values, coverage percentage. The roadmap's data-quality dashboard in embryo.     |

---

## 10. Property Registry Seed Content

~55 definitions transcribed from `src/types/polymer.ts`, preserving group membership:

| Group        | Count | Properties                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `processing` | 3     | process_temp, mfi, bur                                                                                                                                                                                                                                                                                                                                                                     |
| `thermal`    | 9     | tg, tm, enthalpy_exp, enthalpy_100_cryst, degradation_temp, hdt, vicat, conductivity, cte                                                                                                                                                                                                                                                                                                  |
| `mechanical` | 6     | tensile_strength, young_modulus, elongation_at_break, flexural_modulus, hardness_shore_d, izod_impact                                                                                                                                                                                                                                                                                      |
| `physical`   | 6     | density, water_absorption, refractive_index, oxygen_permeability, co2_permeability, appearance                                                                                                                                                                                                                                                                                             |
| `electrical` | 4     | dielectric_constant, dielectric_strength, volume_resistivity, dissipation_factor                                                                                                                                                                                                                                                                                                           |
| `academic`   | 27    | monomer_name, monomer_formula, monomer_molar_mass, repeating_unit, crystallinity, unit_cell, lamella_thickness, spherulite_size, mechanism, kinetic_notes, mw, mn, pdi, dp_range, entanglement_mw, radius_of_gyration, zero_shear_viscosity, power_law_index, rheology_notes, solubility_parameter, hansen_d, hansen_p, hansen_h, flory_huggins_chi, ffv, persistence_length, thermo_notes |

**Deliberately NOT carried over**: `tgValue`, `tmValue`, `degradationValue`, `minDensity`, `maxDensity`, `minCrystallinity`, `maxCrystallinity`, `mnDefaultValue`. These are shadow duplicates. They are instead used as the **ETL correctness oracle** (success criterion 5).

---

## 11. ETL Design — `tools/etl/`

Python 3 (the only runtime available here), clearly scoped as one-shot migration tooling, not part of the app runtime.

**Pipeline**: parse `src/data/polymersData.ts` → normalise values → validate against oracle → emit seed SQL.

### Value-string grammar to handle

| Legacy form         | Example                              | Parsed result                              |
| ------------------- | ------------------------------------ | ------------------------------------------ |
| plain number        | `-110`                               | typical = -110                             |
| range               | `'0.910 - 0.925'`                    | min = 0.910, max = 0.925                   |
| approximate         | `'~ 1.51'`                           | typical = 1.51, qualifier = `~`            |
| inequality          | `'< 0.01'`                           | max = 0.01, qualifier = `<`                |
| unicode superscript | `'10¹⁶ - 10¹⁸'`                      | min = 1e16, max = 1e18                     |
| ratio               | `'2:1 تا 4:1'`                       | text (not numeric)                         |
| mangled unit        | value `'150 - 200 µm/'`, unit `'°C'` | min=150, max=200, unit repaired to `µm/°C` |
| non-numeric         | `'نیمه‌شفاف (Translucent)'`          | text                                       |

**Hard rule**: anything the parser cannot confidently classify raises and aborts the run rather than guessing; unparseable inputs are reported as a list for human decision.

**Validation oracle**: for every material with shadow fields, assert parsed values agree — `tg.typical == tgValue`, `density.min == minDensity`, `density.max == maxDensity`, `crystallinity.min == minCrystallinity`, etc. Disagreement is either a parser bug or a genuine defect in the source data; both must be surfaced, not silently accepted.

**Scope**: parses all six materials to prove generality; emits published seed rows for LDPE and HDPE only.

### Testing (PBT extension — Partial mode)

- Property-based (hypothesis): for any generated numeric range, `parse(format(x)) == x` (round-trip); parsed `min <= max` always holds; unit conversion is reversible within floating-point tolerance.
- Example-based: every legacy form in the grammar table above.
- Negative: malformed inputs raise rather than returning a wrong value.

---

## 12. Deliverables

```
db/
  docker-compose.yml            Postgres 16, env-var credentials, no secrets committed
  migrations/
    0001_extensions_and_enums.sql
    0002_taxonomy.sql
    0003_materials.sql
    0004_property_registry.sql
    0005_property_values.sql
    0006_citations.sql
    0007_tenancy_audit_rls.sql
    0008_views_and_indexes.sql
  seeds/
    0001_fields_families.sql
    0002_property_groups_definitions.sql
    0003_sources.sql
    0004_test_methods.sql
    0005_materials_ldpe_hdpe.sql   (generated by ETL)
  README.md
  run.sh                        apply migrations + seeds against the container
tools/etl/
  parse_polymers.py
  value_parser.py
  emit_sql.py
  tests/
```
