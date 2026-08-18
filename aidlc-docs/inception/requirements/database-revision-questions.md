# Database Revision (U1 v2) — Requirements Verification Questions

**Created**: 2026-08-05T17:12:14Z
**Stage**: INCEPTION — Requirements Analysis (comprehensive depth)
**Scope**: revision of U1 `database-core` — the "first brick"

---

## Why this file exists

The datasheet cannot be made both *general* and *reliable* while the schema
treats a property as a single number owned by a single material. Three things
in the current schema make that impossible, and one thing you asked for
(authorship) does not exist at all:

1. **There is no rung between `material` and `grade`.** "Injection LDPE" and
   "film LDPE" have nowhere to live, so every source describing one of them is
   forced into the LDPE row, where it looks like a contradiction.
2. **`uq_property_value_live` (in `db/migrations/0005_property_values.sql`)
   permits exactly one live value per (subject, property, conditions).** Your
   ten density sources cannot coexist as rows. Reconciliation therefore happens
   in your head, off the record, before anything reaches the database — which
   is precisely the thing this project exists to stop.
3. **`property_definition` treats all properties as equally variable.** Density
   is nearly intrinsic; tensile strength is not. Nothing in the schema says so,
   so there is no rule telling you when you have found enough data and may stop
   looking.
4. **Nothing records who contributed a value.** `property_value.created_by` is
   a free-text column with no table behind it and no display path.

There is also a complication I found in the live schema that the earlier
consultation did not account for: **`material_process` already exists**
(migrations 0010/0011) and already forks processing off both `material` and
`grade`, with `subject_type = 'material_process'` owning property values. Some
of what "injection LDPE" means is already modellable. Question 1 decides how
that interacts with a grade-class rung instead of duplicating it.

**How to answer**: put a letter after each `[Answer]:` tag. Every question has
a **[Recommended]** option. If you agree with all of them, you can simply reply
"go with the recommendations" and I will record that as the answer set.

---

## Question 1 — How should "injection LDPE" be recognizable?

Today the schema has two rungs (`material` → `grade`) plus a process fork
(`material_process`). "Injection LDPE" is ambiguous between three real things:

- a **resin class** sold for injection moulding (has its own MFI band, density
  band, tensile band — properties of the *material*, not of the machine);
- a **process** applied to LDPE (melt temperature, mould temperature, injection
  pressure — properties of the *processing*), which `material_process` already
  covers;
- a **specific commercial product** (Lupolen 2420H), which `grade` covers.

Which structure should carry it?

A) **Add a `grade_class` rung** between `material` and `grade` (e.g.
`ldpe/film`, `ldpe/injection`, `ldpe/extrusion-coating`), extend `subject_type`
with `grade_class`, and keep `material_process` for genuine machine/processing
parameters. A grade class may also have its own processes. **[Recommended]**

B) **Reuse `material_process` only** — treat "injection LDPE" as
`material_process(ldpe, injection_moulding)` and hang tensile/density/MFI off
that. No new rung, no migration to the subject model. Cheaper, but it means
resin properties are stored as if they were properties of a machine setting.

C) **Add `grade_class` and fold `material_process` into it** — a single
"variant" rung that covers both resin classes and processing routes, with a
`kind` discriminator. Fewer concepts, but it merges two things that answer
different questions.

D) **Neither** — express it only through `property_value.conditions`
(e.g. `{"grade_class":"injection"}`) with no new table.

X) Other (please describe after [Answer]: tag below)

[Answer]: A
---

## Question 2 — How should several sources for one property be stored?

You have ~10 density ranges for LDPE, mostly overlapping. Today only one can be
stored as a live value.

A) **Two roles on `property_value` (`value_role`: `observation` | `editorial`).**
Each source becomes its own `observation` row with its own evidence — no
uniqueness constraint between them. One `editorial` row per (subject, property,
conditions) is what the site shows, and it cites all the observations beneath
it. `uq_property_value_live` is narrowed to `WHERE value_role = 'editorial'`.
**[Recommended]**

B) **Keep one value row, attach many citations** (what
`tools/curation/import_values.py` does today). Simple, already built — but the
differing *numbers* from each source are lost; only the fact that a source
agreed is kept.

C) **Separate `property_observation` table**, with `property_value` holding only
the published number. Cleaner separation, but duplicates the whole
unit/qualifier/conditions/test-method column set and splits every query in two.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3 — How is the published (editorial) range derived from the observations?

A) **Computed by default, curator may override.** A view proposes
envelope = (min of mins, max of maxes) and typical = median of reported
typicals; the curator accepts it or writes a different number with a recorded
reason. The rule used is stored on the row. **[Recommended]**

B) **Always computed** — the editorial value is a view, never a stored row.
Maximally honest, but leaves no place for domain judgement (e.g. excluding one
obviously wrong source).

C) **Always hand-entered** — the curator writes the published range and the
observations exist only as supporting evidence.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4 — Should each property declare how variable it is?

The proposal is a `variance_class` column on `property_definition`, which tells
both the UI how to render a value and the curator when to stop hunting:

| class | examples | curation rule |
|---|---|---|
| `intrinsic` | density, Tm, Tg, dielectric constant | narrow; safe at material level; 3 overlapping sources then stop |
| `grade_dependent` | MFI, tensile strength, elongation | material level publishes the envelope **and names the driver**; tight numbers only at grade-class/grade level |
| `process_dependent` | shrinkage, impact, HDT | must not be published at material level without a process qualifier; requires a `test_method` |

A) **Yes, these three classes**, with the publishing rules enforced by
constraint where possible and by the curation tooling otherwise. **[Recommended]**

B) **Yes, but advisory only** — record the class, do not let it block anything.

C) **No** — leave every property equally unconstrained.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5 — Gap N1: five tables can be "unsourced" but can never be cited

`chemical_resistance`, `market_share_datum`, `material_organization`,
`trade_name` and `material_process` each carry a `value_status` including
`unsourced`, but `evidence` can only point at `property_value` or
`material_section_note`. They can never become sourced. (Full write-up in
`db/DATA-GAPS.md` § N1.)

A) **Make `evidence` polymorphic** — `subject_type`/`subject_id` plus an
integrity trigger, mirroring what `property_value` already does. One query
answers "what does this source support?", and any future citable table is free.
Costs a rewrite of `evidence`, the coverage views, `import_values.py` and the
citation join in `api/src/routes/materials.ts`. **[Recommended]**

B) **Keep adding nullable FK arms** to `evidence` with the existing
"exactly one is non-NULL" CHECK. Smaller per table, grows an arm forever.

C) **Drop `status` from those five tables** — decide they are not citable, and
stop the column from lying.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6 — How should you be credited as the author of data you supply?

You asked to be marked as the author of the data you bring. Today
`property_value.created_by` is free text with no table behind it.

A) **A `contributor` table plus a `contribution` link** carrying a role
(`author` / `curator` / `reviewer` / `importer`), attachable to values,
observations, citations and section notes. You are seeded as contributor #1 and
everything you supply is attributed to you as `author`. Survives a second
contributor joining later. **[Recommended]**

B) **A `contributor` table, single `contributor_id` column** on the citable
tables — no role, no history. Simpler; cannot express "authored by you, reviewed
by someone else".

C) **Free text only** — set `created_by = 'Amirmahdi'` and leave the schema
alone.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7 — Is authorship shown publicly?

A) **Yes** — a visible credit on the material page ("curated by …") and in the
citation popover where relevant. **[Recommended]**

B) **Internal only** — stored for audit and provenance, never rendered.

C) **Yes, but aggregate only** — a site-level credits page, not per value.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8 — What happens when sources genuinely disagree (no overlap)?

E.g. two handbooks giving non-overlapping tensile ranges for the same subject.

A) **Escalate, do not merge.** The editorial value is withheld and the subject
is flagged for splitting to a lower rung (grade class or process). The
observations stay visible as conflicting evidence. **[Recommended]**

B) **Publish the envelope anyway**, marked as wide/low-confidence.

C) **Prefer the higher source tier** (`peer_reviewed_handbook` beats
`manufacturer_datasheet`) and record the loser as `conflicting` evidence.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9 — Should the publishing threshold be enforced or advisory?

Proposed rule: a value may reach `published` only when it has N independent
citations (default 3 for `intrinsic`, and a named driver plus a test method for
`grade_dependent` / `process_dependent`).

A) **Enforced in the database** — a trigger refuses `status = 'published'`
until the rule for that property's `variance_class` is met. **[Recommended]**

B) **Enforced in the curation tooling only** — the database stays permissive,
`tools/curation/` refuses to promote.

C) **Advisory** — a view lists what falls short; nothing blocks.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10 — What happens to the 109 already-seeded values?

They are all `status = 'unsourced'` with no citations (by deliberate policy —
see `aidlc-docs/aidlc-state.md` § Citation Status).

A) **Migrate them forward as `editorial` rows with `unsourced` status**, so the
site keeps rendering, and they get replaced observation-by-observation as you
supply real sourced data. **[Recommended]**

B) **Migrate them to `observation` rows** attributed to the legacy prototype as
a source, with no editorial value until curated.

C) **Delete them** and re-curate from scratch with the new model.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11 — May the API response shape change?

FE-2's value atom (`web/src/components/value-atom/`) consumes
`api/src/routes/materials.ts`. Adding observations, editorial values and
authorship changes what a "value" is.

A) **Yes, change it** — the API gains the observation list, the derivation rule
and the contributor, and FE-2 is updated in the same unit. Frontend is not yet
public (D10), so there is no compatibility burden. **[Recommended]**

B) **Additive only** — existing fields keep their exact meaning; new data
arrives in new optional fields; FE-2 untouched for now.

C) **No change in this unit** — database only; API and frontend follow later.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 12 — Extension configuration

`aidlc-docs/aidlc-state.md` currently records: Security Baseline **enabled**,
Resiliency Baseline **disabled**, Property-Based Testing **enabled (partial —
pure functions and round-trips)**. This unit touches the citation core and the
ETL/curation parsers.

A) **Carry the existing configuration forward unchanged.** **[Recommended]**

B) **Also enable Resiliency Baseline** for this unit.

C) **Raise Property-Based Testing to full enforcement** for this unit (the
envelope/median derivation and range merging are exactly the kind of logic PBT
is good at).

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Not asked, because it is not a question

These are being treated as decided by your instruction and will appear in the
requirements document rather than here:

- **Range modifiers on general data** — the qualifier/typical/min/max set stays,
  and gains the observation layer of Question 2. Averaging across sources will
  not be used anywhere; the envelope is the merge rule.
- **"Correct our database inception again"** — the U1 requirements and
  `schema-design.md` are re-issued as v2 rather than patched, with the open
  items in `db/DATA-GAPS.md` (N1, N3) folded in.
- **N3 (seven two-grade value strings)** — resolved by whatever Question 1
  decides; "40 - 60 (Rigid) / 10 - 25 MPa" is two rows on two rungs, not a
  parser problem.
