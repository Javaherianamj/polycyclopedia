# Requirements — Polypedia Database (Phase 1a)

**Stage**: Requirements Analysis
**Depth**: Standard
**Created**: 2026-07-31T19:39:43Z
**Branch**: `feat/polypedia-database`

---

## 1. Intent Analysis

| Aspect | Assessment |
|---|---|
| **User request** | "start building the project database in another branch, use data for ldpe and hdpe and leave the space for later properties added. find issues and fix on go to reach the final proper result." |
| **Request clarity** | Clear — scope, data subset, and extensibility requirement are all stated, and a detailed roadmap was approved in the prior session. |
| **Request type** | New Feature (net-new persistence layer) + Migration (static TypeScript file → relational database). |
| **Scope estimate** | Multiple Components — new `db/` layer, new ETL tooling, no changes to existing UI components in this unit. |
| **Complexity estimate** | Moderate-to-Complex — the schema must serve three future products at once (public encyclopedia, internal ingestion, B2B core), and the source data requires non-trivial parsing. |

### Prior context
The user approved a full project roadmap in the previous session (`~/.claude/plans/zany-cuddling-flamingo.md`). That document supplies the target architecture, the three-level material hierarchy, the citation model, and the phasing. This requirements document narrows that roadmap to the single unit being built now.

---

## 2. Environmental Constraints (discovered, materially shape this unit)

| Tool | Status | Consequence |
|---|---|---|
| Docker daemon | **Available and running** | PostgreSQL 16 can be run, migrated, seeded, and queried in this session. The database layer is fully verifiable. |
| Node.js / npm / bun | **Not installed** | A TypeScript API cannot be installed, built, run, or tested here. Any TS written now would be unverifiable. |
| Python 3.14 | Available | Usable for the one-shot ETL that parses the legacy dataset, and testable with pytest/hypothesis. |
| sqlite3, go, cargo | Available | Not needed. |

**Decision driven by this**: this unit delivers the database as **plain SQL migrations** (ORM-agnostic, runnable today) plus a **Python ETL tool** that parses `src/data/polymersData.ts` into seed SQL. The Fastify/Drizzle API from the roadmap becomes the next unit, to be started when Node is available. Writing unverifiable TypeScript now would violate the "find issues and fix on go" instruction — there would be no way to find the issues.

---

## 3. Functional Requirements

### FR-1 — Extensible property registry
- **FR-1.1** Properties MUST be defined as data rows (`property_definition`), not as columns or TypeScript interface fields.
- **FR-1.2** Adding a new property (e.g. "swelling ratio" for hydrogels, "compression set" for elastomers) MUST be an `INSERT`, requiring no schema migration and no application code change. *This is the direct implementation of "leave the space for later properties added."*
- **FR-1.3** Each property definition MUST carry: key, bilingual name and description, property group, data type, canonical unit, allowed units, plausibility bounds, and which material fields it applies to.
- **FR-1.4** The registry MUST be seeded with all ~70 properties currently present in `src/types/polymer.ts`, preserving their existing group structure (thermal / mechanical / physical / electrical / processing / academic), because that structure drives the existing UI's tab layout.

### FR-2 — Three-level material hierarchy
- **FR-2.1** The schema MUST model `field` → `family` → `material` → `grade` as distinct entities.
- **FR-2.2** `field` and `family` MUST be first-class extensible rows, not free-text strings (today `family` is free text on each polymer).
- **FR-2.3** `grade` MUST exist as a first-class table from the start, even though no commercial grades are seeded in this unit, so the future B2B unit does not require re-architecting.
- **FR-2.4** `family` MUST support nesting (self-referential parent) to accommodate sub-families.

### FR-3 — Numeric, searchable property values
- **FR-3.1** Property values MUST be stored as real numerics in a canonical unit — `value_min`, `value_max`, `value_typical` — not as display strings.
- **FR-3.2** Qualifiers (`<`, `>`, `~`, `≥`) MUST be preserved in a dedicated column rather than embedded in the value.
- **FR-3.3** Non-numeric values (text, enum, boolean) MUST also be representable.
- **FR-3.4** Test conditions (e.g. MFI at 190 °C / 2.16 kg) and test method (ASTM/ISO) MUST be attachable to a value, since a value without its conditions is not comparable across materials.
- **FR-3.5** The schema MUST support efficient range queries (`Tg > 100 AND tensile BETWEEN 40 AND 80`) — this is the prerequisite for the roadmap's Phase 2 target-property search.
- **FR-3.6** The shadow numeric fields in the legacy data (`tgValue`, `minDensity`, `maxCrystallinity`, `mnDefaultValue`, …) MUST NOT be carried over as separate fields; they are duplicates that can drift. They MUST instead be used as a **correctness oracle** to validate the ETL parser.

### FR-4 — Citation model
- **FR-4.1** The chain `property_value → evidence → citation → source_document → source` MUST be implemented.
- **FR-4.2** A citation MUST NOT be storable without a locator (page / table / section). This constraint is the entire difference from the current `src_default` placeholder and MUST be enforced by the database, not by convention.
- **FR-4.3** `evidence` MUST record a role (`primary` / `corroborating` / `conflicting` / `derived_from`) so computed values are not presented as measured.
- **FR-4.4** `source` MUST carry a quality tier (handbook / standard / manufacturer datasheet / vendor marketing / community).
- **FR-4.5** A value's publication status MUST be explicit (`draft` / `in_review` / `published` / `superseded` / `unsourced`), so unsourced values are visibly flagged rather than silently presented as fact.
- **FR-4.6** The bibliography currently hand-written in `src/components/ResourcesModal.tsx` MUST be seeded into the `source` table.

### FR-5 — Seed data
- **FR-5.1** LDPE and HDPE MUST be fully migrated from `src/data/polymersData.ts`, including all property groups.
- **FR-5.2** The ETL parser MUST be exercised against **all six** existing polymers (LDPE, HDPE, PP, PVC, PET, PS) to prove generality, even though only LDPE and HDPE are seeded as published in this unit.
- **FR-5.3** Values that cannot be sourced MUST be seeded with `status='unsourced'`, never with fabricated citations.
- **FR-5.4** At least a few values MUST carry a real citation to a real handbook (from the existing bibliography) to prove the citation path works end to end.

### FR-6 — Bilingual content
- **FR-6.1** Every human-readable field MUST have `_fa` and `_en` variants. Retrofitting i18n after hundreds of materials exist is far more expensive than carrying two columns now.

### FR-7 — Audit and versioning
- **FR-7.1** Property values MUST be append-with-supersede rather than updated in place.
- **FR-7.2** An audit log MUST record actor, entity, action, and before/after state.

### FR-8 — Multi-tenancy readiness
- **FR-8.1** A nullable `tenant_id` MUST be present on tenant-scopable tables from day one (NULL = Polypedia master data), so opening the system to company-private data later is a permissions change rather than a migration.

---

## 4. Non-Functional Requirements

### NFR-1 — Portability / no premature lock-in
- Migrations MUST be plain SQL, so any ORM (Drizzle, Prisma) can be layered on later by introspection.
- No ORM-specific migration format in this unit.

### NFR-2 — Verifiability (explicit user instruction: "find issues and fix on go")
- Every deliverable in this unit MUST be executable and tested in this session against a real PostgreSQL 16 container.
- Migrations MUST be idempotent-safe to apply to a fresh database and MUST be verified by actually applying them.
- The ETL MUST have automated tests, including property-based tests for the parser (per the PBT extension, Partial mode).

### NFR-3 — Security (extension enabled)
- No credentials committed to the repository. Local development credentials MUST come from environment variables with clearly non-production defaults.
- Least-privilege database roles MUST be defined (an application role that cannot DDL, separate from the migration/owner role).
- Row-level security MUST be enabled on tenant-scopable tables, with the master-data policy in place, so the enforcement mechanism exists before the first tenant does.
- Input to the ETL is a trusted local file; nonetheless, generated SQL MUST be parameterised or properly escaped to avoid quoting defects with Persian text and apostrophes.

### NFR-4 — Data integrity
- Foreign keys, `CHECK` constraints, and `NOT NULL` MUST be used to make the invariants in FR-4.2 and FR-3.1 structurally impossible to violate.
- Unit conversion MUST be lossless and reversible for the units in use.

### NFR-5 — Maintainability
- The property registry MUST be seeded from a single declarative source file, not scattered inserts.
- Migration files MUST be numbered, immutable once applied, and forward-only.

### NFR-6 — Performance (sized for the roadmap, not for today)
- Schema MUST support hundreds to low thousands of materials and tens of thousands of property values without redesign.
- Range and text search paths MUST be indexed (GiST on numeric ranges, trigram/full-text on names and trade names).

---

## 5. Explicitly Out of Scope for This Unit

| Item | Why deferred |
|---|---|
| Fastify REST API | No Node.js runtime available in this environment; would be unverifiable. Next unit. |
| Frontend swap to API calls | Depends on the API unit. |
| Target-property search UI | Roadmap Phase 2. |
| N-way comparison rewrite | Roadmap Phase 2. |
| Ingestion / data-checking engine | Roadmap Phase 3. |
| Multi-tenant enforcement beyond the schema primitives | Roadmap Phase 4. |
| Seeding PP, PVC, PET, PS as published materials | User scoped this unit to LDPE + HDPE. The ETL will parse all six to prove generality; the other four remain unseeded or draft. |
| Real citation campaign for all 269 values | Requires source documents and a domain expert; roadmap identifies this as a non-developer task. |

---

## 6. Success Criteria

This unit is complete when all of the following are demonstrably true:

1. A PostgreSQL 16 container starts, all migrations apply cleanly to an empty database, and the schema matches the design.
2. The property registry contains every property from `src/types/polymer.ts`, grouped as the UI expects.
3. Adding a hypothetical new property for a new polymer field requires only an `INSERT` — demonstrated by an actual test that inserts one.
4. LDPE and HDPE are seeded with numeric, unit-normalised property values.
5. The ETL parser's output agrees with the legacy shadow numeric fields (`tgValue`, `minDensity`, …) for every material where those fields exist — any disagreement is investigated and either fixed or documented as a genuine defect in the source data.
6. A citation cannot be inserted without a locator (proven by a test that expects the insert to fail).
7. Unsourced values are queryable as a work list.
8. Parser tests, including property-based tests, pass.
9. The full setup is reproducible from a documented command sequence.

---

## 7. Requirements Traceability

| Requirement | Roadmap origin | Verified by |
|---|---|---|
| FR-1 (registry) | Part 2 §2.3 "Registry-driven properties" | Success criteria 2, 3 |
| FR-2 (hierarchy) | Part 2 "three-level hierarchy" | Success criterion 1 |
| FR-3 (numerics) | Part 1 "values are display strings" | Success criteria 4, 5 |
| FR-4 (citations) | Part 2 "citation model" | Success criteria 6, 7 |
| FR-5 (seed) | User instruction "use data for ldpe and hdpe" | Success criteria 4, 5 |
| FR-8 (tenancy) | Part 2 §2.3 "tenant_id nullable from day one" | Success criterion 1 |
| NFR-2 (verifiability) | User instruction "find issues and fix on go" | Success criteria 1, 5, 8, 9 |
