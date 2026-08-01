# AI-DLC State Tracking

## Project Information
- **Project Name**: Polypedia
- **Project Type**: Brownfield
- **Start Date**: 2026-07-31T19:39:43Z
- **Current Stage**: INCEPTION - Workspace Detection
- **Branch**: `feat/polypedia-database`

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript, TSX (React 19)
- **Build System**: Vite 6 (bun.lock present; npm-compatible)
- **Project Structure**: Single-page application (static SPA, no backend)
- **Reverse Engineering Needed**: Yes (no prior artifacts in aidlc-docs/)
- **Workspace Root**: `/home/amirmahdi/Projects/polymer-encyclopedia`

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Extension Configuration
| Extension | Enabled | Rationale |
|---|---|---|
| Security Baseline | Yes (default applied) | System will hold citation provenance and, per roadmap Phase 4, eventual multi-tenant company data. Roadmap explicitly flags tenant isolation failure as business-ending. Defaulted to enforced. |
| Resiliency Baseline | No (default applied) | Roadmap specifies a deliberately boring single-host Docker Compose deployment for a 1-3 person team at pre-revenue stage. Directional AWS Well-Architected resiliency guidance is out of scope at this stage. |
| Property-Based Testing | Partial (default applied) | The Phase 1 value-string parser (ranges, inequalities, superscripts, unit repair) and unit normalizer are exactly the pure-function/round-trip surface PBT is strongest on. Applied to parsers and serialization round-trips only. |

**Note**: Defaults were applied rather than blocking on opt-in questions, per the user's explicit instruction to proceed continuously. User may override any of these at any time.

## Scope of This Run
Phase 1 of the approved roadmap: stand up the real database and data model, seeded with LDPE and HDPE, with the property registry deliberately extensible so further properties and materials are data inserts rather than code changes.

## Stage Progress

### INCEPTION
- [x] Workspace Detection — complete (2026-07-31T19:39:43Z)
- [x] Reverse Engineering — complete. 9 artifacts in `inception/reverse-engineering/`
- [x] Requirements Analysis — complete (Standard depth). `inception/requirements/requirements.md`
- [x] User Stories — SKIPPED. Persistence layer only; no new user-facing surface in this unit
- [x] Workflow Planning — complete. `inception/plans/workflow-plan.md`
- [x] Application Design — SKIPPED. Covered by the previously approved project roadmap
- [x] Units Generation — complete (minimal). U1 `database-core` in scope; U2–U4 deferred

### CONSTRUCTION — U1 `database-core`
- [x] Functional Design — `construction/database-core/functional-design/schema-design.md`
- [x] NFR Requirements — folded into `requirements.md` §4 (NFR-1 … NFR-6)
- [x] NFR Design — least-privilege roles, RLS, env-var secrets (`db/migrations/0009`, `db/.env.example`)
- [x] Infrastructure Design — `db/docker-compose.yml`, `db/run.sh`
- [x] Code Generation — migrations 0001–0009, seeds 0001–0005, `tools/etl/`
- [~] Build and Test — schema suite passing (16/16); ETL test suite in progress

### OPERATIONS
- [ ] Operations (placeholder — not started, out of scope)

## Success Criteria Status

| # | Criterion | Status |
|---|---|---|
| 1 | Migrations apply cleanly to an empty database | **PASS** — Postgres 16.14, 24 tables + 3 views, 9 migrations |
| 2 | Registry contains every property from `src/types/polymer.ts`, grouped as the UI expects | **PASS** — 55 definitions across 6 groups |
| 3 | Adding a new property requires only an INSERT | **PASS** — proven by test inserting a hydrogel swelling ratio with zero DDL |
| 4 | LDPE and HDPE seeded with numeric, unit-normalised values | **PASS** — 54 + 55 property values |
| 5 | ETL output agrees with the legacy shadow numeric fields | **PASS** — 45/46 agree; the 1 disagreement is a genuine source-data defect (see below) |
| 6 | A citation cannot be inserted without a locator | **PASS** — `{}`, `null`, `{"foo":"bar"}` all rejected |
| 7 | Unsourced values are queryable as a work list | **PASS** — `v_unsourced_values`, 109 rows |
| 8 | Parser tests including property-based tests pass | In progress |
| 9 | Setup reproducible from a documented command sequence | **PASS** — `db/README.md`, `db/run.sh`, `db/test.sh` |

## Data Defects Found (real findings, not parser bugs)

1. **PET density range disagrees with itself.** The sourced display string gives
   1.38–1.40 g/cm³ while the shadow slider field `minDensity` is 1.33. Amorphous
   PET is ≈1.33 and crystallised PET ≈1.38–1.40, so the displayed range silently
   omits amorphous PET. PET is not seeded in this unit; recorded for the citation campaign.

2. **Seven values cram two distinct materials into one string.** e.g. PVC tensile
   strength `'40 - 60 (Rigid) / 10 - 25 MPa'`, PS `'35 - 55 (GPPS) / 20 - 35 MPa'`,
   PET HDT `'70 - 80 (بدون الیاف) / 220'`. These are separate grades and belong in
   the `grade` table. The parser correctly refuses to guess. Affects PVC/PET/PS
   only — LDPE and HDPE parse 100% cleanly — so it does not block this unit.
   **This independently validates the decision to build `grade` now.**

3. **`mnDefaultValue` is not a duplicate of the Mn range.** It is the DP
   calculator's default slider position. An initial oracle that compared it to the
   range midpoint reported six false defects. Corrected to a containment check.

## Citation Status (deliberate)

All 109 seeded property values are `status='unsourced'` and both materials are
`status='draft'`. No citation was fabricated. Real citations require page-level
locators from the actual handbooks, which are not available in this environment;
inventing them would defeat the project's entire purpose and would have been
caught by nothing, since the schema cannot tell a real page number from a
plausible one.

FR-5.4 ("prove the citation path end to end") is satisfied by
`db/tests/verify_constraints.sql`, which inserts a real citation with a valid
locator and asserts it is accepted, rather than by seeding fake provenance.

Materials are `draft` rather than `published` for the same reason: publishing a
material whose every value is uncited would reproduce exactly the problem this
schema exists to fix.
