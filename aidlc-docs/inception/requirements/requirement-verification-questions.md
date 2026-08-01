# Requirement Verification Questions

**Stage**: Requirements Analysis
**Created**: 2026-07-31T19:39:43Z

**How this file works**: Normally AI-DLC stops here and waits for you to fill in every `[Answer]:` tag. You asked to proceed continuously and report briefly, so each question below has a **pre-filled recommended answer** based on the roadmap you already approved. Work continues on those assumptions. Change any `[Answer]:` line and tell me, and I will revise the affected work.

---

## Question 1: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A — the database will hold citation provenance and, per the roadmap's Phase 4, eventual multi-tenant company data. The roadmap explicitly flags tenant-isolation failure as business-ending, so the schema should be built with those constraints from the start rather than retrofitted.

---

## Question 2: Resiliency Extensions
Should the resiliency baseline (AWS Well-Architected Reliability directional guidance) be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: B — the roadmap specifies a deliberately boring single-host Docker Compose deployment for a 1–3 person team at pre-revenue stage. Backup/restore discipline is still in scope (it is called out explicitly in the roadmap's Phase 1 exit criteria), but full Well-Architected resiliency work is premature.

---

## Question 3: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules

X) Other (please describe after [Answer]: tag below)

[Answer]: B — the value-string parser (ranges, inequalities, unicode superscripts, mangled units) and the unit normalizer are pure functions where PBT is genuinely strong. CRUD and schema wiring do not benefit enough to justify blocking constraints.

---

## Question 4: Scope of "the database" for this unit
The roadmap's Phase 1 covers schema + migration + API + frontend swap. Your request was "start building the project database ... use data for ldpe and hdpe."

A) Database only — schema, migrations, property registry, seed data for LDPE + HDPE, and the ETL that parses the existing dataset. No API, no frontend changes.

B) Database + read API — the above plus the Fastify read endpoints.

C) Full Phase 1 — the above plus swapping the frontend to call the API.

X) Other

[Answer]: A — with one environment-driven caveat: this machine has Docker (so Postgres and the SQL layer can actually be built and tested here) but has **no Node.js, npm, or bun installed**, so a TypeScript API cannot be run, built, or tested in this session. Doing A now keeps every deliverable verifiable. B and C are the natural next units once Node is available.

---

## Question 5: Citations for the seeded LDPE/HDPE data
Every value currently points at the placeholder `src_default`. Real citations need a page/table locator, which requires the actual source documents.

A) Seed values with `status='unsourced'` and a visible provenance gap, so the schema and constraints are exercised now and the citation campaign fills them in later against real documents.

B) Block seeding until real citations are available for every value.

C) Invent plausible-looking citations to fill the schema.

X) Other

[Answer]: A — C is not acceptable under any circumstances (fabricated citations are worse than none, and the entire point of the project is traceable provenance). B blocks all progress on documents I do not have. A exercises the constraints honestly and leaves an explicit, queryable list of what still needs sourcing. A small number of genuinely well-known values will be cited to the handbooks already listed in `ResourcesModal.tsx`, marked at the correct confidence, to prove the citation path end-to-end.

---

## Question 6: Database engine for local development
A) PostgreSQL 16 in Docker — matches the roadmap's target production engine exactly.

B) SQLite — simpler, no daemon, but different SQL dialect and no `numrange`/GiST/RLS.

X) Other

[Answer]: A — Docker is available and running on this machine. Using the real target engine now avoids a dialect migration later and lets the schema use Postgres features the roadmap depends on (range types, row-level security, trigram search).

---

## Open questions carried forward (NOT blocking this unit)

These are from the roadmap's Part 5 and remain genuinely open. They do not block database work but will need answers before deployment:

1. **Hosting** — where does Postgres actually live in production (VPS abroad, domestic Iranian provider, on-premises at the institution)?
2. **Domain expert availability** — who performs the citation campaign and, later, the ingestion review queue? This is the roadmap's slowest step and it is not a developer task.
3. **Source-tier sign-off** — confirm the ranking handbook > standard > manufacturer datasheet > marketing.
4. **Snippet copyright policy** — how much verbatim source text may be shown publicly vs. kept internal to reviewers?
5. **Bilingual depth** — is the eventual B2B product Persian-first or English-first? The schema carries `_fa`/`_en` on every human-readable field either way, so this is not blocking now.
