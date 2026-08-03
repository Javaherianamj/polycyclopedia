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

| #      | Product                          | Audience                                                      | State                                                                                                       |
| ------ | -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **P1** | Public encyclopedia              | Students, engineers, researchers (bilingual, Persian-primary) | Prototype frozen as reference; full rebuild specified and ready for Construction (`plans/frontend-plan.md`) |
| **P2** | Ingestion / data-checking engine | Internal curators                                             | Manual version built (U5); automated version not started                                                    |
| **P3** | Licensable B2B core              | Polymer producers and their customers                         | Schema primitives in place (`grade`, `tenant_id`); nothing built                                            |

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
   |    +-- FE  frontend-rebuild ......... INCEPTION DONE, ready for Construction
   |         |                              (FE-0 .. FE-9; see frontend-plan.md)
   |         |  Replaces U3/U7/U8/U9, which assumed an in-place refactor of the
   |         |  prototype. The prototype is now frozen and rebuilt from scratch.
   |         |
   |         +-- FE-0 visual identity ....... next
   |         +-- FE-1 app shell (Astro)
   |         +-- FE-2 value atom .......... was U9 citation-ui
   |         +-- FE-3 datasheet ........... was U3 frontend-api-swap
   |         +-- FE-4 homepage + catalog
   |         +-- FE-5 property search ..... was U7
   |         +-- FE-6 compare ............. was U8
   |         +-- FE-7 sources surfaces
   |         +-- FE-8 learn surface
   |         +-- FE-9 hardening + launch
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

| Unit                          | What it is                                                                     | Blocked by                                   | Rough size  |
| ----------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------- | ----------- |
| **U5b** new-material-curation | Add a brand-new polymer via CSV; export properties that have no value yet      | —                                            | in progress |
| **G0** migrate PP/PVC/PET/PS  | 4 of the 6 prototype polymers are not in the database (`db/DATA-GAPS.md`)      | 7 two-grade value strings needing your call  | ~1 day      |
| **FE** frontend-rebuild       | New Astro app in 10 units — replaces U3/U7/U8/U9. See `plans/frontend-plan.md` | FE-3 wants G0–G3 and G6; FE-8 wants G4, G5   | see FE plan |
| **U6** datasheet-grade-import | Populate `grade` from manufacturer datasheets                                  | Having datasheets                            | ~1 week     |
| **U10** ingestion-engine      | AI-assisted extraction from PDFs + human review queue                          | U5b, and having done curation manually first | 2–3 weeks   |
| **U11** deployment            | Hosting, backups, migrations in CI, monitoring                                 | **Hosting decision**                         | 3–5 days    |
| **U12** auth-and-admin        | Login, roles, admin screens for curators                                       | U11                                          | ~1 week     |
| **U13** multi-tenancy         | Activate tenant isolation; the B2B product                                     | U12                                          | 2+ weeks    |

### Deliberately not planned yet

Mobile app, public API for third parties, recommendation features. All premature
while citation coverage is 0%.

**Changed 2026-08-03**: English/bilingual is no longer deferred. The frontend
rebuild carries the i18n seam and `/fa/` + `/en/` routes from FE-1, and English
prose is entered into the database during curation rather than faked at render
time (frontend-plan.md D13, D28, D29).

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

| Risk                                        | Severity                                                                                                         | Mitigation                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Citation campaign stalls**                | **Highest.** It is slow, unglamorous, and only the owner can do it. An uncited encyclopedia is the old prototype | Pilot 10 values to get a real rate; track `v_citation_coverage` weekly; consider paying a student for bulk entry once the workflow is proven |
| Hosting undecided                           | Blocks all deployment; sanctions/latency constraints are real for Iran                                           | Decide before U11; it affects nothing built so far                                                                                           |
| Scope spread across 3 products              | Small team, pre-revenue                                                                                          | P1 only until coverage is meaningful. P3 primitives exist but stay dormant                                                                   |
| Merging this branch changes the live site   | 266 files, deletes ~87 root scripts                                                                              | Merge deliberately after UI testing, not casually                                                                                            |
| ~~Copyright on snippets~~                   | **Closed 2026-08-03**                                                                                            | Citation metadata only — no verbatim text, no scans (frontend-plan.md D5)                                                                    |
| **Catalog regresses from 6 materials to 2** | **High.** Only LDPE and HDPE are in the database. The rebuilt site renders from the database                     | G0: resolve the 7 two-grade value strings and migrate PP/PVC/PET/PS. ~1 day of domain judgement, must land before FE-3 is reviewed           |
| Webfont licence (IRANSansX)                 | Medium. Commercial terms unresolved for a public site with B2B ambitions                                         | Buy a licence, or ship Estedad (SIL OFL). The swap is a token change, not a redesign                                                         |

---

## 5. Open decisions (owner only)

**Updated 2026-08-03** — two of the original five are now settled.

1. ~~**Hosting**~~ — **narrowed**. Static or free host now, domestic Iranian
   provider later; VPS abroad ruled out. Nothing may assume a Node runtime
   (frontend-plan.md D27, R23). The final provider is still open, but it no
   longer blocks design or build.
2. **Who curates** — only the owner, or can a student be trained on the CSV flow?
3. ~~**Snippet policy**~~ — **settled**: citation metadata only (work, edition,
   page). No verbatim source text, no page scans. This removes the copyright risk
   from the public site entirely (frontend-plan.md D5).
4. **Taxonomy scope** — which polymer fields to cover first beyond thermoplastics?
   Now also gates `applies_to_fields` (`db/DATA-GAPS.md` G3).
5. **License** — for the code, and separately for the curated data.
6. **New: the IRANSansX webfont licence** — chosen for the rebuild, but its
   commercial terms are unresolved. Estedad (SIL OFL) is the working fallback
   (frontend-plan.md §3).

---

## 6. Work that can proceed in parallel with curation

Ordered by value. None require writing code.

1. **Gather Iranian producer datasheets.** Highest strategic value in the whole
   project. A relationship task, not a technical one, and nobody else has this
   data organised. Feeds U6 directly.
2. ~~Test the existing UI and write down every defect.~~ **Done** — captured in
   `requirements/frontend-prototype-findings.md` and in the owner's answer to
   round-2 question 34, and turned into rules R27, R28 and R32.
3. **Resolve the 7 two-grade value strings** so PP, PVC, PET and PS can be
   migrated. Highest-value non-code task now: without it the rebuilt site ships
   with two materials instead of six (`db/DATA-GAPS.md` G0).
4. **Draft overview text** for materials, in **both** Persian and English —
   content, not code. `import_materials.py` already accepts `overview_en` and
   already updates existing materials, so this needs no tooling work.
5. **List properties needed by other polymer classes** (elastomers: compression
   set, rebound resilience; biopolymers: degradation rate; composites: fibre
   volume fraction). Each is one `INSERT` into `property_definition` — no code
   change — so this list is directly actionable.
6. **Decide the field/family taxonomy** beyond the four seeded families.

---

## 7. Suggested order

**Revised 2026-08-03** after the frontend Inception.

**Now** — curation campaign and the G0 migration (owner) ‖ FE-0 visual identity
and FE-1 app shell (code). These do not compete: FE-0 needs your attention in
design reviews, not your database time.

**Then** — FE-2 value atom → FE-3 datasheet. The citation work becomes visible in
the product here, which is where the curation campaign starts paying back.

**Then** — FE-4 homepage, FE-5 search, FE-6 compare, FE-7 sources.

**Then** — FE-8 Learn surface, FE-9 hardening, and launch. Nothing is published
before this point by explicit decision (frontend-plan.md D10).

**Then** — U11 deployment, once the host is chosen.

**Later** — U6 grades and U10 ingestion, once there are datasheets and a proven
manual process to automate.

The parallelism insight from §3 is unchanged and now sharper: **curation and
frontend never block each other**, and the frontend gets more useful the more
curation has landed.
