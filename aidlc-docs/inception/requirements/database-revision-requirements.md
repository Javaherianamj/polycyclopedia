# Requirements — U1 Revision: `database-core` v2

**Created**: 2026-08-05T17:12:14Z
**Depth**: Comprehensive (touches the citation core, the value model, and
curation policy)
**Extends**: `requirements.md` (Phase 1a, v1) and
`aidlc-docs/construction/database-core/functional-design/schema-design.md`
(v1), folding in `db/DATA-GAPS.md` N1 and N3

## Intent Analysis Summary

- **User request**: fix the schema so a datasheet can be general (one
  headline number per material) and reliable (backed by several disagreeing
  real sources) at the same time; make grade/process ("injection LDPE" etc.)
  recognizable as data, not prose; re-issue the U1 inception since it is the
  project's "first brick" and has accumulated known issues; add authorship so
  data the owner supplies is credited to them.
- **Request type**: Enhancement / schema revision of an existing, working unit.
- **Scope**: System-wide within U1 — every table using `value_status`,
  `property_value`, and `evidence` is touched; `tools/curation/` and
  `api/src/routes/materials.ts` follow.
- **Complexity**: Complex — five interacting structural changes plus a data
  migration of the 109 existing values.
- **Answers**: all 12 questions in
  `inception/requirements/database-revision-questions.md` answered **A**
  (recommended), per Auto Mode's bias toward a reasonable default over a
  blocking question, given the owner's follow-up instruction to proceed
  straight to injecting real data.

## Functional Requirements

**FR-1 (Q1, grade-class rung).** Add a `grade_class` table
(`material_id`, `key`, bilingual name/description, `sort_order`, `status`).
Extend `subject_type` with `grade_class`. `material_process` is unchanged and
continues to model genuine processing parameters (melt temperature, mould
temperature); a grade class may itself have processes.

**FR-2 (Q2, multi-source values).** Add `value_role` (`observation` |
`editorial`) to `property_value`. Every source becomes its own `observation`
row with its own evidence; no uniqueness constraint between them. One
`editorial` row per (subject, property, conditions) is what the API/frontend
reads; it is linked from its supporting observations via a new
`editorial_value_id` FK on the observation rows. `uq_property_value_live` is
narrowed to `value_role = 'editorial'` rows only.

**FR-3 (Q3, derivation).** A view proposes the editorial range as
`envelope(value_min) .. envelope(value_max)` and `typical = median(typical)`
over its linked observations. The curator may accept or override; the rule
used (`envelope_min_max_median_typical` | `manual_override` | `single_source`)
is stored on the editorial row. Averaging across sources is never used.

**FR-4 (Q4, variance_class).** Add `variance_class`
(`intrinsic` | `grade_dependent` | `process_dependent`) to
`property_definition`, seeded for all 64 existing definitions. Drives both the
publishing rule (FR-9) and, later, frontend rendering.

**FR-5 (Q5 / N1, evidence polymorphism).** Replace `evidence`'s
`property_value_id` / `material_section_note_id` pair with a polymorphic
`subject_type` (text) / `subject_id` (bigint) pair plus an integrity trigger,
covering `property_value`, `material_section_note`, `chemical_resistance`,
`market_share_datum`, `material_organization`, `trade_name`, and
`material_process`. Closes N1: those five tables can now actually leave
`unsourced`.

**FR-6 (Q6, authorship).** Add `contributor` (`display_name`, `email`) and
`contribution` (`contributor_id`, `subject_type`, `subject_id`, `role` —
`author` | `curator` | `reviewer` | `importer`). Seed contributor #1 as the
owner (Amirmahdi). Every value/citation/observation the owner supplies is
recorded with a `contribution` row, `role = 'author'`.

**FR-7 (Q7, public credit).** Contributor identity is queryable by the API
(joined onto property values and citations); public rendering is deferred to
the frontend unit that consumes it (FR-11), not built here.

**FR-8 (Q8, disagreement).** When linked observations for one editorial row do
not overlap, the editorial row is withheld (`status` stays below `published`)
and a view surfaces it as needing a split to `grade_class` or
`material_process`. The observations remain visible as evidence.

**FR-9 (Q9, publishing threshold).** A trigger blocks
`property_value.status → 'published'` on an editorial row unless: `intrinsic`
≥ 3 linked observations with distinct citations; `grade_dependent` ≥ 2 linked
observations, `test_method_id` set, and a note naming the driver;
`process_dependent` — same as `grade_dependent` and the subject must not be
`material` (must be `grade_class`, `grade`, or `material_process`).

**FR-10 (Q10, migration).** The 109 existing `property_value` rows become
`value_role = 'editorial'`, `status = 'unsourced'` (unchanged), no synthetic
observations invented.

**FR-11 (Q11, API/frontend).** In scope for this construction unit: extend
`api/src/routes/materials.ts`'s evidence join for the new polymorphic shape,
and update `web/src/components/value-atom/` minimally so it does not break
(existing behavior preserved). A full observation-list UI is out of scope and
tracked as a frontend follow-up.

**FR-12 (data injection, this session).** Shape
`curation/cited data-by author-p1-PE.md` (encyclopedia/handbook extracts —
density and MFI general figures, three grade-comparison tables for
LDPE/LLDPE/HDPE across injection/rotational/blow-moulding, one commercial HDPE
grade table across injection/blow/film, and material-level thermal/structural
facts) into `observation` rows with real citations (page-level locators) and
`editorial` rows derived per FR-3, attributed to the owner as `author` per
FR-6. Values whose unit does not cleanly map to an existing
`property_definition.canonical_unit` (e.g. notched impact strength in kJ/m²
against `izod_impact`'s canonical J/m — not a fixed conversion without
specimen geometry) are **not** force-converted; they are logged for a future
property or a confirmed conversion rather than guessed.

## Non-Functional Requirements

**NFR-1 (integrity).** Every new invariant (grade-class one-subject
consistency, evidence polymorphism, publish threshold) is a `CHECK` or
trigger, not a convention — consistent with design principle 3 in
`schema-design.md`.

**NFR-2 (no data loss on migration).** FR-10's migration is additive
(`ALTER TABLE ... ADD COLUMN ... DEFAULT`); no existing row is deleted or
renumbered.

**NFR-3 (idempotent migrations).** Same forward-only, numbered, idempotent
`schema_migration` pattern as 0001–0014.

**NFR-4 (testability).** `db/tests/*.sql` gains cases for: grade_class subject
integrity, the narrowed unique index (two observations + one editorial
coexisting), the publish-threshold trigger (reject/accept), and evidence
polymorphism across at least two of the five newly-citable tables.

**NFR-5 (extension configuration, Q12).** Carried forward unchanged: Security
Baseline enabled, Resiliency Baseline disabled, Property-Based Testing enabled
(partial).

## Architectural / Technical Decisions

- `grade_class` is a new first-class rung, not a `material_process` variant
  and not a `conditions` key — it answers "what kind of material is this" (a
  resin population), which `material_process` (a machine setting) does not.
- Observation/editorial is modelled as two rows on the **same table**
  (`property_value`), not a separate `property_observation` table — keeps one
  unit/qualifier/conditions/test-method column set instead of duplicating it.
- Evidence polymorphism reuses the `property_value_check_subject()` trigger
  pattern already proven in migrations 0005/0010/0011, rather than inventing a
  new integrity mechanism.

## Out of Scope (this unit)

- Full frontend observation-list UI and public credit rendering (FR-7, FR-11)
  — flagged for a frontend follow-up unit.
- Re-curating PP/PVC/PET/PS's N3 two-grade strings — unblocked by FR-1 but not
  executed here; this session's data injection is PE-family only, per the
  file the owner supplied.
- Resiliency Baseline — stays disabled per NFR-5.

## Traceability

| Requirement | Source |
|---|---|
| FR-1…FR-11 | `database-revision-questions.md` Q1–Q11 (all answered A) |
| FR-12 | Owner instruction, this session: inject `cited data-by author-p1-PE.md` |
| N1 closure | `db/DATA-GAPS.md` § N1, resolved via FR-5 |
| N3 resolution path | `db/DATA-GAPS.md` § N3, resolved via FR-1 (grade_class) |
