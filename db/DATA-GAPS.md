# Data gaps — things the prototype shows that the database cannot yet store

**Created**: 2026-08-03, during the frontend-rebuild Inception.
**Last worked**: 2026-08-05 — G0–G8 and G10 closed; two new gaps found while
auditing (N1, N2). Same day, U1 v2 revision closed N1 and gave N3 a resolution
path (`grade_class`); see `aidlc-docs/inception/requirements/database-revision-requirements.md`.
**Why**: the rebuilt frontend renders from the database, not from
`src/data/polymersData.ts`. Every prototype element that has no home in the
schema is a section of the new site that cannot exist. This file is the list.

**Read this before your next database session.** Each item says what breaks, and
what the fix looks like.

---

## Status at a glance

| #      | Item                                             | State                                   |
| ------ | ------------------------------------------------ | --------------------------------------- |
| G0     | PP, PVC, PET, PS missing from the database       | ✅ Closed 2026-08-05                    |
| G1     | Manufacturers not linked to materials            | ✅ Closed 2026-08-05                    |
| G2     | Trade names have nowhere to live                 | ✅ Closed 2026-08-05                    |
| G3     | Property scoping never populated                 | ✅ Closed 2026-08-05                    |
| G4     | Quiz questions have no table                     | ✅ Closed 2026-08-05                    |
| G5     | Simulator reference data hardcoded in components | ✅ Closed 2026-08-05                    |
| G6     | English content does not exist                   | ✅ Closed 2026-08-05                    |
| G7     | Section-level narrative text has no column       | ✅ Closed 2026-08-05                    |
| G8     | `unit_cell` enterable in two places              | ✅ Closed 2026-08-05                    |
| G10    | `property_group.ui_tab` encodes a retired layout | ✅ Closed 2026-08-05                    |
| **G9** | **No search endpoint exists yet**                | 🟡 **Open — deferred by owner**         |
| N1     | Five tables say "unsourced" but cannot be cited  | ✅ Closed 2026-08-05 (U1 v2 FR-5)       |
| **N2** | **`updated_at` was never maintained**            | ✅ Closed 2026-08-05 (found in audit)   |
| **N3** | **Seven two-grade value strings still unparsed** | 🟠 **Open — resolution path landed (U1 v2 `grade_class`), re-curation not done** |

Migrations 0010–0014 and seeds 0007–0008 did this work. Everything below the
"Closed" divider is kept as a record of what was decided and why, because the
reasoning matters more than the checkbox.

---

# 🔴 Open

## ✅ N1. Five tables carry a `value_status` they can never leave

**Found 2026-08-05, while auditing. Closed 2026-08-05** in the U1 v2 revision
(`database-revision-requirements.md` FR-5), via route (a) below — the
recommended one. `db/migrations/0020_evidence_polymorphic.sql` replaced
`evidence.property_value_id` / `material_section_note_id` with
`subject_type`/`subject_id` plus an integrity trigger
(`evidence_check_subject()`) and seven cascade-cleanup triggers (one per
citable table, since a polymorphic reference can't use a plain FK's `ON
DELETE CASCADE`). `chemical_resistance`, `market_share_datum`,
`material_organization`, `trade_name`, and `material_process` can now all
actually receive evidence — proved by a schema test
(`db/tests/verify_constraints.sql`, "EVIDENCE POLYMORPHISM" section) that
cites a `chemical_resistance` row and confirms the cleanup trigger fires on
delete. `tools/curation/import_values.py` and
`api/src/routes/materials.ts`'s citation join were updated for the new shape;
all three test suites (schema, curation pytest, API) pass.

The original write-up is kept below as the record of what was decided and
why.

`value_status` is the enum whose values include `unsourced` and `published` —
the citation workflow's state machine. Six tables carry it. Only **two** of
them can actually attach a citation, because `evidence` can only point at a
`property_value` or (since 0012) a `material_section_note`:

| Table                   | Has `status value_status` | Can attach evidence? |
| ----------------------- | ------------------------- | -------------------- |
| `property_value`        | yes                       | ✅ yes               |
| `material_section_note` | yes                       | ✅ yes               |
| `chemical_resistance`   | yes                       | ❌ **no**            |
| `market_share_datum`    | yes                       | ❌ **no**            |
| `material_organization` | yes                       | ❌ **no**            |
| `trade_name`            | yes                       | ❌ **no**            |
| `material_process`      | yes                       | ❌ **no**            |

So five tables have a column that says "this has not been sourced yet" and no
mechanism that could ever change it to sourced. Worse, `market_share_datum`'s
own table comment asserts the opposite in as many words — it claims market
share "gets first-class citation support like any other value via
evidence/citation". That is not true and never was.

This matters more than a tidiness complaint because market share is, by the
schema's own admission, "currently the least defensible data in the app
(uncited percentages presented as fact)". It is exactly the data the citation
architecture exists to discipline, and it is structurally excluded from it.

**Honest disclosure**: three of the five (`material_organization`,
`trade_name`, `material_process`) were added on 2026-08-05 by this same
session, following the existing pattern without noticing the pattern was
broken. They made an existing problem bigger.

**Fix shape** — a decision is needed, because there are two defensible routes:

- **(a) Make `evidence` polymorphic**, the way `property_value` already is:
  replace the per-table FK columns with `subject_type` / `subject_id` plus an
  integrity trigger. Consistent with the existing design, one query answers
  "what does this source support?", and any future citable table is free.
  Costs a rewrite of `evidence`, the coverage views, `import_values.py` and
  the citation join in `api/src/routes/materials.ts`.
- **(b) Keep adding nullable FK columns** (`chemical_resistance_id`,
  `market_share_datum_id`, …) with the same "exactly one is non-NULL" CHECK
  0012 already uses. Smaller change per table, but the constraint grows an arm
  every time, and it does not scale to grade-level data in U6.

Recommendation: **(a)**. The polymorphic pattern is already in the schema and
already understood; (b) is the cheaper first step and the more expensive third
one. Either way, if the answer is "these genuinely are not citable", then the
right fix is to **drop `status` from those five tables** rather than leave a
column that lies.

---

## 🟠 N3. Seven prototype values cram two grades into one string

Carried over from `aidlc-docs/aidlc-state.md`; **the structural fix landed
2026-08-05** in U1 v2 (`database-revision-requirements.md` FR-1), the seven
values themselves are not yet re-curated.

PVC, PET and PS have seven values where the prototype put two different grades
in one string — e.g. PVC tensile `'40 - 60 (Rigid) / 10 - 25 MPa'`, PET HDT
`'70 - 80 (بدون الیاف) / 220'`. The ETL parser correctly refuses to guess which
number belongs to which material.

**Resolution path, now available**: the `grade_class` table
(`db/migrations/0016_grade_class.sql`) is exactly the rung this needed — PVC
rigid and PVC plasticised are two different resin populations, the same shape
as `hdpe/injection` vs `hdpe/film` created during the U1 v2 PE-family data
import. Each of the seven becomes two `grade_class`-scoped `property_value`
rows (e.g. `pvc/rigid` tensile 40–60 MPa, `pvc/plasticised` tensile 10–25 MPa)
instead of one ambiguous material-level string.

**Still open**: this is a naming/domain-judgement task (deciding each
`grade_class`'s key and bilingual name per material), not a schema gap
anymore. The curation files are already generated and waiting:
`curation/pp.csv`, `pvc.csv`, `pet.csv`, `ps.csv`. The PE-family import this
session (LDPE/LLDPE/HDPE only, per the source the owner supplied) did not
touch PP/PVC/PET/PS — out of scope by material, not by capability.

---

## 🟡 G9. No search endpoint exists yet

**Owner decision, 2026-08-05: deferred.** "Wait for a few complete entries then
we work on search engine." Recorded, not closed.

Not a schema gap — the indexes are built — but recording it because it is the
dependency people forget. The frontend plan makes property-first search
("Tg > 100 AND tensile 40–80") a homepage-level feature, and `api/` currently
exposes only list / detail / registry / coverage. `GET /api/search` does not
exist and is a backend unit of its own.

Note the frontend plan's own counter-proposal: a build-time static search index
may be the better v1 given the Astro/static-hosting decision (D26/D27), which
would make this unnecessary rather than merely deferred.

---

# ✅ Closed

## ✅ G0. Four of the prototype's six materials were not in the database

**Closed 2026-08-05.** PP, PVC, PET and PS are seeded via
`curation/new_materials.csv` → `import_materials.py`, with slug, field, family,
code, CAS, resin code, discovery year, chain type and **both** overviews. All
seven materials (LDPE, HDPE, LLDPE, PP, PVC, PET, PS) are `status='draft'`.

Their property values are deliberately *not* seeded — see N3. The blocker that
originally held G0 up was a value-parsing problem, and the fix was to separate
the two concerns: identity is mechanical and lands now, values need judgement
and go through curation like everything else.

---

## ✅ G1. Manufacturers are not linked to materials

**Closed 2026-08-05, migration 0011.** `material_organization` links a material
to an `organization` with a `role` (`producer` / `compounder` / `distributor` /
`licensor`) and a `note_fa` for the prototype's parenthetical qualifications
("(هموپلیمر و کوپلیمر)", "(گرید S-65)").

As specified, there is **no `is_iranian` flag**: `organization.country_code =
'IR'` already carries it, and the prototype's two-list split is a presentation
choice, not data.

Still to do: the rows themselves. The 25 seeded organizations are not yet
linked to any material — that is curation work.

---

## ✅ G2. Trade names have nowhere to live

**Closed 2026-08-05, migration 0011.** `trade_name (material_id,
organization_id, name, …)`, so `'Lupolen (LyondellBasell)'` becomes data rather
than a string with a company name in brackets.

**Joined to G1 per owner instruction.** A trigger
(`trg_trade_name_check_producer_link`) requires that when a trade name names a
producer, that producer is already linked to that material in
`material_organization`. So the two tables cannot disagree about who makes
what. `organization_id` stays nullable — a brand is sometimes known before its
owner is confirmed, and hard-FK-ing it to the join row would mean deleting a
producer link silently deletes brand history.

---

## ✅ G3. Property scoping was never populated

**Closed 2026-08-05, migration 0013 + seed 0008.** Reshaped by an owner
decision: *scope by family, not by material*.

The original plan was to populate `applies_to_fields`. That turned out to be
too coarse for the job. The job is the empty-state UI — an absent property
renders as "no data yet, add a source", so an inapplicable property becomes a
permanent unfixable to-do. And the distinction that actually matters is not
thermoplastic-vs-thermoset: **polyethylene and polystyrene are both
thermoplastics, and only one of them melts.** Field cannot express that.

So `applies_to_families` was added alongside `applies_to_fields`, and the two
are **ANDed**:

| Level                 | Expresses                       | Scoped keys                                                                      |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `applies_to_fields`   | melt-processed vs cure-processed | `{thermoplastics}`: mfi, bur, process_temp, mould_temp, injection_pressure, vicat |
|                       |                                 | `{thermosets}`: gel_time, pot_life, cure_time, cure_temperature, peak_exotherm_temperature, hardness_barcol |
| `applies_to_families` | semi-crystalline vs amorphous    | `{polyolefins, polyesters}`: tm, enthalpy_exp, enthalpy_100_cryst, crystallinity, unit_cell, lamella_thickness, spherulite_size |

Measured effect: a polyolefin or polyester page is offered 58 of 64 properties;
an amorphous vinyl or styrenic page is offered 51. In practice PVC and PS
curation files came out at 25 rows against PP and PET's 28 — the three
crystallinity-dependent thermal properties correctly absent.

`export_gaps.py` honours both levels, and `GET /api/properties` now returns
both arrays so the frontend can tell "unsourced" from "inapplicable" without
hardcoding polymer science.

**Known maintenance cost, stated plainly**: `applies_to_families` lists
families by key, so adding a semi-crystalline family (polyamides, polyacetals,
PEEK…) means editing seed 0008 or those seven properties will be silently
hidden from it. The alternative — an `is_semi_crystalline` boolean on `family`
— answers exactly one question; the array answers any future one. Seed 0008 has
a self-check that raises if a scoped key no longer exists, so a rename fails
loudly instead of silently reverting to "applies everywhere".

---

## ✅ G4. Quiz questions have no table

**Closed 2026-08-05, migration 0012.** `quiz_question (material_id, prompt_fa,
prompt_en, options_fa, options_en, correct_index, feedback_fa, feedback_en,
difficulty, sort_order, status)`.

Deliberately **not** citation-tracked: a quiz question is authored teaching
content, not a measured value. Three CHECK constraints do real work —
`options_fa` must be an array of ≥ 2, `options_en` must be the same length when
present (so one index addresses both languages), and `correct_index` must be in
range, which catches the classic off-by-one before the frontend renders
`undefined` as the right answer.

`difficulty` (`intro`/`applied`/`advanced`) was added beyond the original spec
so the Learn surface can build a graded run rather than dumping every question
at once.

**Frontend told**: `aidlc-docs/inception/plans/frontend-plan.md` §5 FE-8 now
carries the quiz-interface requirement, the column contract, and two rules —
never render a provenance marker on quiz content, and render nothing at all for
a material with no questions.

---

## ✅ G5. Simulator reference data is hardcoded in components

**Closed 2026-08-05, migration 0011 + seed 0007.** Reshaped by an owner
decision that went further than the original fix.

The original fix shape was "they are properties, add three definitions". That
was right but insufficient, because it kept the prototype's real mistake: one
`process_temp` per polymer. **LDPE's melt window for blown film is not LDPE's
melt window for extrusion coating.**

So processing became **the fork**. `material_process` is one row per (subject,
technique), where the subject is a material *or* a grade, and
`property_value.subject_type` gained a third value `'material_process'` so
those rows own property values with the full citation, supersede and
plausibility machinery behind them.

```
material ──┐
           ├── material_process (technique) ── property_value (melt temp, mould temp, pressure)
grade ─────┘
```

Three property definitions added (seed 0007): `mould_temp`,
`injection_pressure`, `co2_footprint_virgin`. The last is flagged
`always_review = true` — an LCA figure is regional, methodology-dependent and
ages badly, so it should surface in the review queue on every edit rather than
be trusted to stay correct silently.

**Frontend consequence**: `ProcessingWindowSimulator` should be driven by a
chosen technique, not by a polymer id alone.

---

## ✅ G6. English content does not exist yet

**Closed 2026-08-05.** All seven materials now have `overview_en`, entered
through the existing `new_materials.csv` path exactly as G6 predicted — no
migration, no code.

`organization.name_fa` remains NULL for multinational companies. That is
deliberate and correct: "Dow Chemical" has no Persian name.

**A data-loss bug was found and fixed doing this.** `import_materials.py`'s
UPDATE was unconditional, so a row filled in purely to add `overview_en` to an
existing material would blank its `overview_fa` — hand-written Persian prose
that exists nowhere else. Optional columns are now `COALESCE`d: on an update, a
blank cell means "leave alone", never "clear". Clearing a field back to empty
is no longer expressible through the CSV, which is the correct trade for a tool
whose other failure mode is silent destruction of curated prose. Regression
test: `test_update_with_blank_optional_column_does_not_erase_existing_value`.

---

## ✅ G7. Section-level narrative text has no column

**Closed 2026-08-05, migration 0012.** Owner chose the citable table over
folding the prose into `overview_fa`.

`material_section_note (material_id, group_key, kind, title_fa/en, body_fa/en,
sort_order, status)`, where `group_key` is a real FK to `property_group.key`,
so a note cannot be attached to a section that does not exist and the datasheet
renders notes by joining on the key it already orders sections by.

`kind` covers all three prototype fields with one table: `note` (the
processing special-note callout), `intro` (the mechanical block's introductory
paragraph), `list_item` (each `academic.reactorTypes[]` entry, several rows
sharing a `group_key`, ordered by `sort_order`).

**These get citations**, unlike quiz content, because they are factual claims
that happen to be written as sentences instead of numbers — "PVC releases HCl
above 140 °C, so Ca/Zn stabilizers are mandatory" is exactly the kind of
statement the whole architecture exists to make traceable. `evidence` was
widened accordingly: `property_value_id` became nullable, a
`material_section_note_id` column was added, and a CHECK enforces that exactly
one is set. A partial unique index protects the note side, which the existing
`UNIQUE (property_value_id, citation_id, role)` could not, because NULLs never
collide.

---

## ✅ G8. `unit_cell` was enterable in two places

**Closed 2026-08-05, migration 0013.** `material_structure.unit_cell` dropped;
the registry property `key = 'unit_cell'` kept, because it gets citation
tracking, plausibility and supersede behaviour for free.

Existing column values were migrated into the registry property before the drop
(LDPE and HDPE's orthorhombic cell parameters both verified present
afterwards). `material_structure` is now purely about atoms.
`tools/etl/emit_sql.py` updated to match.

---

## ✅ G10. `property_group.ui_tab` encoded a layout that no longer exists

**Closed 2026-08-05, migration 0013.** Owner instruction: *"remove these, no
tabs now. FE is linking to Learn with blocks and buttons, no tabs."*

Column dropped rather than repurposed to `surface`, specifically so nobody
builds tabs *because* the column implies them. Sections order by `sort_order`
alone. `v_material_properties` was dropped and recreated without it (no
CASCADE, so nothing else could be quietly taken with it), and both API routes
that selected it were updated.

---

## ✅ N2. `updated_at` was never actually maintained

**Found and closed 2026-08-05, migration 0014.**

Twenty-five tables carry `updated_at timestamptz NOT NULL DEFAULT now()`,
several added by explicit post-review defect fixes whose stated purpose was
"this is ongoing mutable data, so it gets an audit trail". Nothing ever
advanced the column. `DEFAULT now()` fires on INSERT only, so `updated_at` was
a second, less accurate copy of `created_at` on every row in the database:

```sql
UPDATE field SET sort_order = sort_order WHERE key = 'thermoplastics';
SELECT created_at = updated_at FROM field WHERE key = 'thermoplastics';
--  t     ← after an UPDATE. Should be false.
```

Two curation tools set `updated_at = now()` by hand, which was the tell: the
invariant was maintained by convention in the two places someone remembered and
violated everywhere else — the API, psql, any future writer. Schema design
principle 3 says invariants are enforced by constraints, not convention.

Fixed with a `set_updated_at()` trigger attached to every base table carrying
the column, by catalog-driven loop rather than 25 hand-written statements so
the list cannot drift. The hand-written assignments in the Python tools are now
redundant rather than wrong, so no coordination was needed.

---

## Still fully covered, no action needed

All 64 property definitions (thermal, mechanical, physical, electrical,
processing, academic, cure, LCA), chemical resistance, market share,
applications, processing techniques, 3D atoms, chain type, CAS, resin code,
family, discovery year, and both overviews in both languages.
