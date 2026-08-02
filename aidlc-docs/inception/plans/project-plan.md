# Project Plan — Polypedia (whole-project Inception)

**Created**: 2026-08-02
**Status**: written retroactively

## Why this document exists, and a correction

The project owner asked: _"based on aidlc, did you make the inception plan for
the whole project?"_

**No.** What existed was:

- a roadmap produced in the first session, before AI-DLC was adopted
- per-unit Inception artifacts for **U1** (database), **U2** (API) and **U5**
  (curation)

AI-DLC's Inception phase is meant to run **once for the whole system** —
producing the full unit decomposition and dependency map — and then per-unit
Construction follows. That project-level step was skipped. Units were defined
reactively, one at a time, as each was started.

This has not caused damage: the units built so far are the ones any sane
sequencing would have picked first, and each has its own requirements and design
on record. But it does mean nobody could answer "what is left?" from a document,
which is exactly the question being asked. This file closes that gap.

---

## 1. The product

Three products sharing one database:

| #      | Product                          | Audience                                   | State                                                            |
| ------ | -------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| **P1** | Public encyclopedia              | Students, engineers, researchers (Persian) | Prototype UI live; database not yet connected to it              |
| **P2** | Ingestion / data-checking engine | Internal curators                          | Manual version built (U5); automated version not started         |
| **P3** | Licensable B2B core              | Polymer producers and their customers      | Schema primitives in place (`grade`, `tenant_id`); nothing built |

The differentiator across all three is the same: **every value traceable to a
page in a real document.** That is the thing competitors do not have and the
reason the schema refuses uncited citations.

---

## 2. Unit map

```
  U0  repo-hygiene ....................... DONE
   |
  U1  database-core ...................... DONE   (24 tables, 3 views, 16 checks)
   |
   +-- U2  core-api ...................... DONE   (read endpoints, 17 tests)
   |    |
   |    +-- U3  frontend-api-swap ........ NOT STARTED   <-- next code unit
   |         |
   |         +-- U7  target-property-search ... NOT STARTED
   |         +-- U8  comparison-rewrite ...... NOT STARTED
   |         +-- U9  citation-ui ............. NOT STARTED
   |
   +-- U5  curation-workflow ............. DONE   (CSV round-trip, 84 tests)
   |    |
   |    +-- U5b new-material-curation ..... IN PROGRESS
   |         |
   |         +-- U6  datasheet-grade-import .. NOT STARTED
   |         +-- U10 ingestion-engine ........ NOT STARTED
   |
   +-- U11 deployment ................... NOT STARTED  (blocked: hosting undecided)
        |
        +-- U12 auth-and-admin ........... NOT STARTED
             |
             +-- U13 multi-tenancy ........ NOT STARTED  (P3)
```

### Completed

| Unit                     | Delivered                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **U0** repo-hygiene      | Removed duplicated `src/src/` tree, archived 87 one-off scripts, added lint/format/CI, extracted shared `SourcedValue`                                  |
| **U1** database-core     | PostgreSQL 16 schema, registry-driven properties, citation chain with DB-enforced locator, LDPE + HDPE migrated (109 values), least-privilege role, RLS |
| **U2** core-api          | Fastify read API: materials list/detail, property registry, coverage. Server-side display formatting                                                    |
| **U5** curation-workflow | CSV export/import, 10 validation rules, transactional, plain-language errors                                                                            |

### Remaining

| Unit                          | What it is                                                                | Blocked by                                   | Rough size  |
| ----------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- | ----------- |
| **U5b** new-material-curation | Add a brand-new polymer via CSV; export properties that have no value yet | —                                            | in progress |
| **U3** frontend-api-swap      | Frontend reads the API instead of `src/data/polymersData.ts`              | —                                            | 1–2 days    |
| **U9** citation-ui            | Show provenance: source marker per value, "unsourced" badge, source panel | U3, and real citations existing              | 2–3 days    |
| **U7** target-property-search | "Tg > 100 AND tensile 40–80" — the headline feature. Index already built  | U3                                           | ~1 week     |
| **U8** comparison-rewrite     | N-way compare driven by the registry instead of 2 hardcoded polymers      | U3                                           | 2–3 days    |
| **U6** datasheet-grade-import | Populate `grade` from manufacturer datasheets                             | Having datasheets                            | ~1 week     |
| **U10** ingestion-engine      | AI-assisted extraction from PDFs + human review queue                     | U5b, and having done curation manually first | 2–3 weeks   |
| **U11** deployment            | Hosting, backups, migrations in CI, monitoring                            | **Hosting decision**                         | 3–5 days    |
| **U12** auth-and-admin        | Login, roles, admin screens for curators                                  | U11                                          | ~1 week     |
| **U13** multi-tenancy         | Activate tenant isolation; the B2B product                                | U12                                          | 2+ weeks    |

### Deliberately not planned yet

English/bilingual public mode, mobile app, public API for third parties,
recommendation features. All are premature while citation coverage is 0%.

---

## 3. The critical path

**Nothing on the code side is blocked.** The genuine bottleneck is data.

```
citation campaign (weeks, domain expert)  ─┐
                                           ├─> credible product
U3 -> U9 -> U7 (about 2 weeks, code)    ───┘
```

Both halves are needed. A beautiful search UI over uncited numbers is the
prototype again with extra steps; a fully cited database with no search is a
spreadsheet. They can proceed **in parallel**, which is the main scheduling
insight: curation does not block development, and development does not block
curation.

---

## 4. Risks

| Risk                                      | Severity                                                                                                         | Mitigation                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Citation campaign stalls**              | **Highest.** It is slow, unglamorous, and only the owner can do it. An uncited encyclopedia is the old prototype | Pilot 10 values to get a real rate; track `v_citation_coverage` weekly; consider paying a student for bulk entry once the workflow is proven |
| Hosting undecided                         | Blocks all deployment; sanctions/latency constraints are real for Iran                                           | Decide before U11; it affects nothing built so far                                                                                           |
| Scope spread across 3 products            | Small team, pre-revenue                                                                                          | P1 only until coverage is meaningful. P3 primitives exist but stay dormant                                                                   |
| Merging this branch changes the live site | 266 files, deletes ~87 root scripts                                                                              | Merge deliberately after UI testing, not casually                                                                                            |
| Copyright on snippets                     | Unresolved                                                                                                       | Decide before showing verbatim source text publicly                                                                                          |

---

## 5. Open decisions (owner only)

1. **Hosting** — domestic Iranian provider, VPS abroad, or on-premises?
2. **Who curates** — only the owner, or can a student be trained on the CSV flow?
3. **Snippet policy** — how much verbatim source text may be shown publicly?
4. **Taxonomy scope** — which polymer fields to cover first beyond thermoplastics?
5. **License** — for the code, and separately for the curated data.

---

## 6. Work that can proceed in parallel with curation

Ordered by value. None require writing code.

1. **Gather Iranian producer datasheets.** Highest strategic value in the whole
   project. A relationship task, not a technical one, and nobody else has this
   data organised. Feeds U6 directly.
2. **Test the existing UI and write down every defect.** The owner has said it
   "needs formation and several fixes." A written list turns that into a
   workable unit instead of a vague feeling.
3. **Decide hosting.** Unblocks U11 entirely.
4. **Draft overview text** for materials — content, not code, and it is missing
   for everything except the six legacy polymers.
5. **List properties needed by other polymer classes** (elastomers: compression
   set, rebound resilience; biopolymers: degradation rate; composites: fibre
   volume fraction). Each is one `INSERT` into `property_definition` — no code
   change — so this list is directly actionable.
6. **Decide the field/family taxonomy** beyond the four seeded families.

---

## 7. Suggested order

**Now** — curation campaign starts (owner) ‖ U3 frontend-api-swap (code)
**Then** — U9 citation UI, so the coverage work becomes visible in the product
**Then** — U7 target-property search, the actual differentiator
**Then** — U11 deployment, once hosting is decided
**Later** — U6 grades and U10 ingestion, once there are datasheets and a proven
manual process to automate

U8 comparison-rewrite can slot in any time after U3; it is independent.
