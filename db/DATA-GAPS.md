# Data gaps — things the prototype shows that the database cannot yet store

**Created**: 2026-08-03, during the frontend-rebuild Inception.
**Why**: the rebuilt frontend renders from the database, not from
`src/data/polymersData.ts`. Every prototype element that has no home in the
schema is a section of the new site that cannot exist. This file is the list.

**Read this before your next database session.** Each item says what breaks, and
what the fix looks like. Nothing here is urgent for LDPE/HDPE curation — it is
urgent before the corresponding screen is built.

---

## Legend

| Mark | Meaning                                                                 |
| ---- | ----------------------------------------------------------------------- |
| 🔴   | Blocks a screen the frontend plan commits to. Needs a migration or seed |
| 🟠   | Degrades a screen. Workaround exists                                    |
| 🟡   | Curation hazard — same thing enterable in two places, or unenforced     |

---

## 🔴 G0. Four of the prototype's six materials are not in the database

Only **LDPE and HDPE** are seeded. **PP, PVC, PET and PS exist only in
`src/data/polymersData.ts`** — the frozen prototype.

The rebuilt site renders from the database. On the day it replaces the
prototype, it would therefore ship with **2 materials instead of 6**, and the
catalog's four family accordions would collapse to one.

This is not a schema problem — the ETL in `tools/etl/` can parse them. It is
blocked on the source-data defect already recorded in `aidlc-docs/aidlc-state.md`:
seven values in PVC, PET and PS cram **two different grades into one string**
(e.g. PVC tensile `'40 - 60 (Rigid) / 10 - 25 MPa'`, PET HDT
`'70 - 80 (بدون الیاف) / 220'`). The parser correctly refuses to guess which
number belongs to which material, and it is right to refuse.

**Breaks**: the entire catalog, at launch.

**Fix shape**: not code. For each of the seven values, decide by hand which grade
each number describes, then either (a) enter them as separate values with a
`qualifier`, or (b) hold the rigid/glass-filled variants back until `grade`
exists (U6) and seed only the unfilled/general grade now. Everything else in
PP/PVC/PET/PS parses cleanly, so this is roughly a day of domain judgement, not a
migration.

**Do this before FE-3 is considered done**, or the datasheet screen is being
built and reviewed against a two-row catalog.

---

## 🔴 G1. Manufacturers are not linked to materials

The LDPE page shows "تولیدکنندگان ایرانی" (5 companies) and "شرکت‌های چندملیتی
شاخص" (9 companies). `organization` exists and **is seeded** with these companies
(`db/seeds/0001_fields_families.sql`), and its own table comment claims it
"Replaces the legacy iranianManufacturers[]/multinationalManufacturers[] string
arrays" — but the only foreign key to it anywhere is `grade.organization_id`.

There is **no `material ↔ organization` link**. A generic material cannot name
its producers.

**Breaks**: the producers section of the material page — one of the few things on
the site nobody else has for the Iranian market.

**Fix shape**: a join table.

```sql
CREATE TABLE material_organization (
    material_id      bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    organization_id  bigint NOT NULL REFERENCES organization (id),
    role             text NOT NULL DEFAULT 'producer',
    status           value_status NOT NULL DEFAULT 'unsourced',
    PRIMARY KEY (material_id, organization_id, role)
);
```

Note: do **not** add an `is_iranian` flag. `organization.country_code = 'IR'`
already carries it, and the prototype's two-list split is a presentation choice,
not data.

---

## 🔴 G2. Trade names have nowhere to live

The prototype shows `tradeNames: ['Lupolen (LyondellBasell)', 'Alathon (Dow)',
'Lotrene (QAPCO)']` — a producer's brand for a material. There is no column, no
table, and `material_identifier`'s `type` CHECK does not include a trade-name
value.

**Breaks**: the "نام‌های تجاری معروف" line on every material page.

**Fix shape**: a small table rather than stuffing it into `material_identifier`,
because a trade name belongs to a *producer* as well as a material — and that is
the same shape `grade` will need, so it pre-stages U6.

```sql
CREATE TABLE trade_name (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id      bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    organization_id  bigint REFERENCES organization (id),
    name             text NOT NULL,
    status           value_status NOT NULL DEFAULT 'unsourced'
);
```

---

## 🔴 G3. `applies_to_fields` is empty for all 55 properties

The column exists and `export_gaps.py` honours it. It is never populated — every
row keeps the `'{}'` default, which the schema defines as "applies to all
fields".

This was harmless while only thermoplastics existed. It stops being harmless
because of a frontend decision just made: **empty properties are rendered as a
call to action** ("no data yet — add a source"). With `applies_to_fields` empty,
a hydrogel or an elastomer page would display ~55 calls to action, including
melt-flow index and resin code, which are meaningless for it. The page would be
mostly noise, and `export_gaps.py --include-missing` produces the same noise as
curation work.

**Breaks**: the empty-state design, and the gap CSV for any non-thermoplastic.

**Fix shape**: a seed `UPDATE` per property. Only properties that genuinely apply
everywhere keep `'{}'`. Requires a domain pass — it is your call, not a
mechanical one. Roughly: `mfi`, `bur`, `process_temp`, `vicat`, `hdt` are
thermoplastic-only; `crystallinity`, `tm`, `lamella_thickness`, `spherulite_size`
are semi-crystalline-only; `tg`, `density`, `tensile_strength` apply to
everything.

---

## 🔴 G4. Quiz questions have no table

`PolymerData.quiz[]` (question, options, correct index, feedback) feeds
`DynamicQuiz.tsx`. It exists nowhere in the schema; the ETL parser reads past it.
The frontend plan keeps the quiz (your answer to question 14), and the Learn
surface is built from the database like everything else.

**Breaks**: the quiz on the Learn/Lab surface for every material.

**Fix shape**: `quiz_question (material_id, prompt_fa, prompt_en, options jsonb,
correct_index, feedback_fa, feedback_en, sort_order)`. Deliberately *not*
citation-tracked — a quiz question is authored content, not a measured value.

---

## 🟠 G5. Simulator reference data is hardcoded in components

Two tools carry per-polymer numbers inside the React source rather than the
database:

- `ProcessingWindowSimulator.tsx` — melt/mould temperature and pressure
  min/max windows, plus the ISO/ASTM references it names, per polymer id.
- `LCACircularEconomy.tsx` — `baseCo2Map`, the kg CO₂e baseline per polymer.

Both are **presented to the reader as facts with standards references**, and
neither can be cited, corrected, or extended to a new material without a code
change. The CO₂ figures are the more serious of the two: they are exactly the
kind of number the whole citation architecture exists to discipline.

**Breaks**: nothing today; both simulators keep working for the six legacy
polymers. But every new material added by curation gets no processing window and
no LCA panel, silently.

**Fix shape**: they are properties. `process_temp` already exists;
add `mould_temp`, `injection_pressure`, `co2_footprint_virgin` to
`property_definition` (an `INSERT`, no migration — this is what the registry is
for) and let the simulators read them like any other value, rendering nothing
when they are absent.

---

## 🟠 G6. English content does not exist yet — but the tooling does

Bilingual from the start, Persian primary (D13), and you chose to **put the
English text in the database** rather than fall back or machine-translate (Q30).
Good news: nothing needs building for that.

- Schema is ready: `name_en`, `overview_en`, `description_en`, `note_en`.
- Property `description_en` is already populated for all 55 definitions.
- `tools/curation/import_materials.py` already reads an `overview_en` column
  **and already updates existing materials**, not just new ones. So English
  overviews for LDPE and HDPE are entered exactly the way a new material is:
  fill `new_materials.csv` with the existing slug plus `overview_en`, re-import.

What is missing is only the text itself:

- `overview_en` is empty for both seeded materials.
- `organization.name_fa` is NULL for all multinational companies (deliberate and
  correct — "Dow Chemical" has no Persian name).

**Breaks**: an English material page would have a title and numbers but no prose.

**Fix shape**: pure content work, on the same CSV path you already use. No
migration, no code.

---

## 🟠 G7. Section-level narrative text has no column

Three prototype fields are prose attached to a *section*, not to a value:

| Prototype field                                   | What it is                                             |
| ------------------------------------------------- | ------------------------------------------------------ |
| `processing.specialNoteTitle` / `specialNoteContent` | The extrusion-coating note on the LDPE page          |
| `mechanical.description`                          | A paragraph introducing the mechanical block           |
| `academic.reactorTypes[]`                         | List of reactor types (autoclave, tubular, …)          |

`property_value.note_fa` covers notes on a *single value*, which is a different
thing. `kinetic_notes`, `rheology_notes` and `thermo_notes` **are** registry
properties, so the academic prose blocks are covered — these three are not.

**Fix shape**: either a `material_section_note (material_id, group_key,
title_fa, body_fa, …)` table, or accept the loss and fold this prose into
`overview_fa`. The second is cheaper and probably right; the note is good writing
but it is not structured data.

---

## 🟡 G8. `unit_cell` is enterable in two places

`material_structure.unit_cell` (a text column) and `property_definition.key =
'unit_cell'` (a registry property) both hold the same thing. A curator filling in
the workbook and a curator filling in the structure row would produce two values
that nothing reconciles.

**Fix shape**: pick one and delete the other. Recommendation: keep the registry
property (it gets citation tracking for free; `material_structure.unit_cell`
does not) and drop the column, leaving `material_structure` purely for `atoms`.

---

## 🟡 G9. No search endpoint exists yet

Not a schema gap — the indexes are built — but recording it here because it is
the dependency people forget. The frontend plan makes property-first search
("Tg > 100 AND tensile 40–80") a homepage-level feature, and `api/` currently
exposes only list / detail / registry / coverage. `GET /api/search` does not
exist and is a backend unit of its own.

---

## 🟡 G10. `property_group.ui_tab` encodes a layout that no longer exists

`ui_tab` holds `'ind'` / `'eng'` / `'aca'` — the prototype's three tabs. The
rebuilt datasheet is one scrolling page with section anchors, and the interactive
tools live on a separate Learn surface, so those three values no longer describe
anything real.

Nothing breaks: the frontend can ignore the column and order sections by
`sort_order` alone. Recording it so it does not quietly become a "why does the
database say `aca`?" question in six months, and so nobody builds tabs *because*
the column implies them.

**Fix shape**: either drop the column, or repurpose it to `surface`
(`'datasheet'` / `'learn'`) once the Learn surface actually needs to ask which
groups it draws from. Decide at FE-8, not before.

---

## Summary — what to do when you are next in the database

| #  | Item                                        | Type            | Blocks                       |
| -- | ------------------------------------------- | --------------- | ---------------------------- |
| G0 | **Migrate PP, PVC, PET, PS**                | curation + ETL  | **the whole catalog**        |
| G3 | Populate `applies_to_fields`                | seed UPDATE     | empty-state UI, gap CSV      |
| G1 | `material_organization` join table          | migration       | producers section            |
| G2 | `trade_name` table                          | migration       | trade names line             |
| G4 | `quiz_question` table                       | migration       | Learn surface quiz           |
| G5 | 3 new `property_definition` rows            | seed INSERT     | simulators on new materials  |
| G8 | Drop `material_structure.unit_cell`         | migration       | curation ambiguity           |
| G7 | Decide: section-note table, or fold in prose | decision        | LDPE special note            |
| G6 | English overviews (tooling already exists)  | content         | bilingual pages              |
| G9 | `GET /api/search`                           | API unit        | the headline feature         |
| G10| Decide fate of `property_group.ui_tab`      | decision        | nothing — hygiene            |

**Fully covered, no action needed**: all 55 property values (thermal, mechanical,
physical, electrical, processing, academic), chemical resistance, market share,
applications, processing techniques, 3D atoms, chain type, CAS, resin code,
family, discovery year, Persian overview.
