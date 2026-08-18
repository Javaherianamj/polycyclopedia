# FE-3b `grade-class-band` — code generation plan

**Unit**: FE-3b, an extension of FE-3's datasheet surface per
`inception/plans/frontend-plan.md` — not in the original unit map, added by
owner decision (2026-08-12) once curation produced 14 real `grade_class`
rows (~100 published, cited property values) that the shipped FE-3 surface
had no way to show: `api/src/routes/materials.ts` only ever queried
`subject_type = 'material'`, and `GradeSelectorSlot.astro` checks the
(0-row) `grade` table, not `grade_class`.
**Scope**: expose each material's grade classes and their own cited
property values + processing techniques through the API, and render them as
an inline-expandable band at the bottom of the datasheet — explicitly not a
top selector that swaps the page and not a dedicated per-class route (owner
decision, recorded in §5).
**Depends on**: FE-3 (datasheet surface, closed) — this unit extends its
API response shape and reuses its components (`ValueAtom`,
`ProcessingTechniqueList`) rather than duplicating them.
**Blocks**: nothing.
**Stages skipped**: NFR/Infra unchanged from FE-3. Functional Design —
folded into §1–2 below, since it is "which existing table backs the new
section," the same shape as FE-3's own §1–2.

---

## 1. API expansion

`GET /api/materials/:slug` did not return grade classes at all. Checked
directly against the database (not assumed):

| Addition | Backing tables | Real rows today |
| --- | --- | --- |
| `gradeClasses[].{key,nameFa,nameEn,descriptionFa,descriptionEn,status}` | `grade_class` | 14 rows, 3 of 7 materials (ldpe, hdpe, lldpe) |
| `gradeClasses[].propertyGroups` | `property_value` where `subject_type = 'grade_class'`, `value_role = 'editorial'`, not superseded | 100 rows, all `status = 'published'`, all cited |
| `gradeClasses[].processingTechniques` | `material_process` where `grade_class_id IS NOT NULL` | 0 rows today (schema ready since migration 0016, uncurated) |

- [x] `api/src/routes/materials.ts`: `MATERIAL_GRADE_CLASSES_SQL`,
      `MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL`,
      `MATERIAL_GRADE_CLASS_PROCESSING_SQL` — same column shapes as FE-3's
      material-level equivalents, scoped to `subject_type = 'grade_class'`
      / `grade_class_id`, joined back to `grade_class.material_id = $1` so
      one query per row-set covers every class on the material. Added to
      the handler's existing `Promise.all`; the citations query
      (`MATERIAL_CITATIONS_SQL`) now receives both the material's and every
      grade class's property-value ids in one call, since
      `property_value.id` is globally unique and that query doesn't care
      which subject a value belongs to.
- [x] `buildGradeClasses()` helper: buckets the two flat row-sets back onto
      their owning class via `groupConsecutiveBy` (both queries are ordered
      by `grade_class.sort_order, grade_class.key` so this is one linear
      pass, not N queries for N classes), reusing `mapPropertyValueRow` —
      a grade class's cited value is shaped identically to a material's.
- [x] `web/src/lib/api/types.ts`: new `GradeClass` interface; `MaterialDetail`
      gains `gradeClasses: GradeClass[]`.
- [x] `api/test/api.test.ts`: real-data assertions against ldpe/injection
      (density = 0.923 g/cm³, cited), a disjointness check proving a
      grade-class value never leaks onto the material's own
      `propertyGroups` and vice versa (D46 as an API-level guarantee, not
      just a convention), and an empty-array assertion for `pet` (0 real
      rows — R7: absence renders as an empty array, not a missing field).

## 2. D46 (no value inheritance) as the content model, not just a UI rule

`MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL` selects only rows whose
`subject_id` **is** the grade class — it never falls back to or merges in
the parent material's `property_value` rows. This means the frontend has
nothing to reconcile against the property registry the way FE-3's
`buildMaterialSections` does for the material itself (which fills in every
*candidate* property from `/api/properties`, present or "missing"). A grade
class's `propertyGroups` is already exactly "what to show" — there is no
missing-value invitation state for a grade class row, because inviting a
contribution for a property nobody has scoped to this specific resin
population isn't a real gap to fill (that invitation already exists on the
material page).

## 3. Frontend: the band

- [x] `web/src/lib/pages/material-detail.ts`: `propertyValueAsDefinition()`
      adapts a grade-class `PropertyValue` into the `PropertyDefinition`
      shape `ValueAtom` needs (no description, empty scoping arrays — a
      grade-class row is never rendered in the "missing" state, so there is
      nothing for the "(i)" button to explain beyond what the value's own
      name/symbol already says). `gradeClassValueCounts()` computes the
      per-class total/cited counts shown in each row's collapsed summary —
      same phrasing family as `CoverageBadge`'s material-level sentence,
      so the transparency requirement ("make clear that what's shown is
      what differs") is visible before a reader even expands a row.
- [x] `web/src/components/datasheet/GradeClassBand.astro`: one `<details>`
      per grade class (CSS/markup only — no JS, no island, R24), rendering
      each class's `propertyGroups` through the shared `ValueAtom` (R1) and
      its `processingTechniques` through the existing
      `ProcessingTechniqueList.astro` (reused, not duplicated).
- [x] `web/src/components/datasheet/datasheet.css`: `.grade-band`,
      `.grade-list`, `.grade-row` (+ `[open]`), `.grade-row-summary` (CSS
      chevron via `::after` + `transform`, not a default disclosure
      triangle — those are RTL-hostile and vary by engine),
      `.grade-row-body`, `.grade-group`. Ported the row-card language
      already established by `.sec-empty`/`.prop` rather than inventing a
      new visual vocabulary (D35). No `transition: all` anywhere (R35).
- [x] `web/src/pages/{fa,en}/m/[slug].astro`: import `GradeClassBand`,
      render it between the property-group sections and `BottomLinks`,
      gated on `material.gradeClasses.length > 0` — the guard lives in the
      page, not the component, so an empty band never reaches the DOM at
      all (R7/R4).
- [x] `web/src/i18n/{fa,en}.json`: four new `datasheet.gradeClasses.*` keys
      (heading, hint, per-row coverage sentence, empty-class note). Added
      only these keys; re-read both files immediately before each edit
      since they are shared with the FE-5 UI agent's concurrent work.
- [x] `web/src/lib/pages/material-detail.test.ts`: unit tests for
      `propertyValueAsDefinition` and `gradeClassValueCounts` (real-shape
      fixtures, not the live database — this file's existing tests are all
      pure-function fixture tests, matched here).

## 4. Explicitly not built, and why

- **No per-class route** (`/fa/m/{slug}/grade/{key}`) and **no top
  selector that swaps the whole datasheet**. Owner decision, taken
  directly in the confirmation prompt for this unit (2026-08-12) — noted
  because the owner's own prose leaning elsewhere is worth recording, not
  because it changes what got built. Cost, for the record: a grade class
  has no shareable URL of its own (an anchor on the band, not on the row,
  since D46/owner decision explicitly rules out dedicated addressing), and
  the processing-technique content the owner called "the more important
  half" sits inside a collapsed row rather than getting page-level room.
  Both are cheap to revisit later if the owner reconsiders — the API
  response and the `<details>` markup do not have to change, only the
  routing layer around them.
- **`GradeSelectorSlot.astro` is untouched.** It is a distinct, real
  concept (the `grade` table — a specific commercial product, still 0
  rows) from `grade_class` (a resin population). Wiring it to
  `grade_class` data would have built exactly the "selector that swaps"
  design the owner ruled out; the inert top slot and the new bottom band
  now both exist, correctly, for two different future features.
- **No coverage-badge-style "N of M grade classes have values" rollup at
  the material level.** Coverage.astro already reports the material's own
  values; a second, grade-class-scoped percentage was judged more noise
  than signal for a first pass, and nothing in D3/D46 requires it. Left as
  a candidate for a follow-up if curation on `material_process` for grade
  classes (currently 0 rows) ever lands.

## 5. Files touched

New: `web/src/components/datasheet/GradeClassBand.astro`.
Edited: `api/src/routes/materials.ts`, `api/test/api.test.ts`,
`web/src/lib/api/types.ts`, `web/src/lib/pages/material-detail.ts` (+ its
test file), `web/src/components/datasheet/datasheet.css`,
`web/src/pages/{fa,en}/m/[slug].astro`, `web/src/i18n/{fa,en}.json`.
