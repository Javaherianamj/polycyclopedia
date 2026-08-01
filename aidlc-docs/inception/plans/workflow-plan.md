# Workflow Plan — Polypedia Database (Phase 1a)

**Created**: 2026-07-31T19:39:43Z
**Branch**: `feat/polypedia-database`

## Stage Execution Decisions

| Stage | Decision | Rationale |
|---|---|---|
| Workspace Detection | **EXECUTED** | Always. Brownfield confirmed. |
| Reverse Engineering | **EXECUTED** | Brownfield with no prior artifacts. |
| Requirements Analysis | **EXECUTED** (Standard depth) | Roadmap supplied most content; environment constraints added materially new requirements. |
| User Stories | **SKIPPED** | This unit is a persistence layer with no new user-facing surface. Existing UI is untouched. Roadmap Phase 2 (search/compare) is where stories add value. |
| Workflow Planning | **EXECUTED** | Always. This document. |
| Application Design | **SKIPPED** | The approved roadmap already performed component identification and service-layer design. Reproducing it would be duplication. |
| Units Generation | **EXECUTED** (minimal) | See below — one unit in scope, with successors named for sequencing clarity. |

## Units of Work

Only **U1** is in scope for this run. U2–U4 are named so dependencies are explicit.

```
  U1: database-core          [THIS UNIT]
        |
        +--> U2: core-api            (blocked: needs Node.js runtime)
        |         |
        |         +--> U3: frontend-api-swap
        |
        +--> U4: ingestion-engine    (roadmap Phase 3)
```

| Unit | Name | Status | Blocker |
|---|---|---|---|
| U1 | `database-core` | **In scope** | None |
| U2 | `core-api` | Deferred | Node.js/npm not installed in this environment |
| U3 | `frontend-api-swap` | Deferred | Depends on U2 |
| U4 | `ingestion-engine` | Deferred | Roadmap Phase 3; depends on U1 |

## U1 Construction Stages

| Stage | Decision | Rationale |
|---|---|---|
| Functional Design | **EXECUTE** | New data model and schema — the core deliverable. Highest-value design work in the unit. |
| NFR Requirements | **EXECUTE** (minimal) | Tech stack largely fixed by the roadmap; security extension is enabled and needs explicit treatment. |
| NFR Design | **EXECUTE** (minimal) | Security patterns (roles, RLS, secret handling) need concrete design. |
| Infrastructure Design | **EXECUTE** (minimal) | Local Docker Compose Postgres definition. Production hosting is an open question and stays out. |
| Code Generation | **EXECUTE** | Always. |
| Build and Test | **EXECUTE** | Always — and NFR-2 makes this the unit's credibility test. |

## Execution Sequence

1. Functional Design — schema specification (tables, columns, constraints, indexes)
2. NFR Requirements + NFR Design — security posture, roles, RLS, secrets
3. Infrastructure Design — Docker Compose, migration runner
4. Code Generation:
   - 4a. SQL migrations
   - 4b. Property registry seed (the ~70 definitions from `src/types/polymer.ts`)
   - 4c. Source/bibliography seed (from `ResourcesModal.tsx`)
   - 4d. ETL: parse `polymersData.ts` → seed SQL for LDPE + HDPE
   - 4e. Tests (schema constraints, ETL parser incl. property-based)
5. Build and Test — apply against real Postgres 16, run the full test suite, verify all 9 success criteria

## Model Delegation (per user instruction)

| Work type | Model |
|---|---|
| Schema design, requirements, architecture decisions, issue diagnosis | Opus |
| Migration authoring, ETL implementation, test authoring | Sonnet |
| Repetitive/mechanical transcription (e.g. 70 property-definition rows) | Haiku |
| Escalation when a subagent stalls or produces incorrect output twice | Fable |

## Risks

| Risk | Mitigation |
|---|---|
| Legacy value strings parse incorrectly and silently corrupt seed data | Cross-validate every parsed numeric against the legacy shadow fields (`tgValue`, `minDensity`, …); fail loudly on any unparseable input rather than guessing |
| Schema over-engineering for products that may never be built | Every table traces to a specific roadmap requirement; `grade` and `tenant_id` are the only speculative additions and both are cheap now / expensive later |
| Persian text quoting defects in generated SQL | Generate via parameterised statements or a properly escaping serialiser; verify by round-tripping seeded text out of the database |
| Cannot verify the TS API layer in this environment | Descoped to U2 rather than written blind |
