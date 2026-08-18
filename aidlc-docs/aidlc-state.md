# AI-DLC State Tracking

## Project Information

- **Project Name**: Polypedia
- **Project Type**: Brownfield
- **Start Date**: 2026-07-31T19:39:43Z
- **Current Stage**: CONSTRUCTION — release readiness (2026-08-14). FE-0 … FE-8 all COMPLETE and gate-passed except FE-8 step 2, which is blocked on data. The stack runs end to end locally (Postgres + API + Astro, all suites green). The three owner-reported UI defects (Hansen 3D, search sliders, Learn structure) are FIXED. Remaining work is **data and deployment**, not new units. Nothing has been published (D10)
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

| Extension              | Enabled                   | Rationale                                                                                                                                                                                                                          |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security Baseline      | Yes (default applied)     | System will hold citation provenance and, per roadmap Phase 4, eventual multi-tenant company data. Roadmap explicitly flags tenant isolation failure as business-ending. Defaulted to enforced.                                    |
| Resiliency Baseline    | No (default applied)      | Roadmap specifies a deliberately boring single-host Docker Compose deployment for a 1-3 person team at pre-revenue stage. Directional AWS Well-Architected resiliency guidance is out of scope at this stage.                      |
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
- [x] Build and Test — schema suite passing (16/16); ETL test suite passing (27/27, `tools/etl/tests/`)

### INCEPTION — frontend rebuild (FE-0 … FE-9) — COMPLETE

- [x] Workspace Detection — SKIPPED. Brownfield established, artifacts current
- [x] Reverse Engineering — SKIPPED. No frontend code drift since the artifacts were written
- [x] Requirements Analysis — COMPLETE (standard depth). 34 questions across two rounds, all answered (`inception/requirements/frontend-questions.md`, `frontend-questions-2.md`). Requirements are recorded as decisions D1–D34 and rules R1–R32 in the frontend plan rather than a separate requirements document, consistent with U5/U5b
- [x] Findings — `inception/requirements/frontend-prototype-findings.md` (§3 superseded by the plan)
- [x] User Stories — COMPLETE. `inception/user-stories/frontend-stories.md`: 4 personas, 14 stories with acceptance criteria, coverage check. Executed rather than skipped because D1 commits to four distinct audiences
- [x] Workflow Planning — COMPLETE. `inception/plans/frontend-plan.md`
- [x] Application Design — SKIPPED. No new service boundary; the API contract (U2) is unchanged and the frontend is a client of it
- [x] Units Generation — COMPLETE. FE-0 … FE-9, replacing U3/U7/U8/U9 in `project-plan.md`
- [x] Prototype-vs-database coverage audit — `db/DATA-GAPS.md`, 11 gaps (G0–G10)

**Technology decision**: Astro with React islands. Reasoning in frontend-plan.md §4.
**Approval gate cleared 2026-08-03**: Estedad accepted as the Persian face (IRANSansX
licence question closed, not deferred); Q3 and Q21 interpretations confirmed; G0 deferred
by owner decision — the rebuild ships with LDPE and HDPE.

### CONSTRUCTION — FE-0 `visual-identity`

- [x] Functional Design — SKIPPED. No data model or business logic; the deliverable is the design system itself
- [x] NFR Requirements / NFR Design — folded into the frontend plan (§6 performance budgets, R27/R30 responsive and a11y gates)
- [x] Infrastructure Design — SKIPPED. No infrastructure
- [x] Code Generation — COMPLETE
  - [x] Four datasheet treatments (A–D) → merged house style **E "Press"** (D35)
  - [x] Semantic colour system, five hues five jobs (D36, R33/R34)
  - [x] Both modes both surfaces: datasheet cream/ember, lab blue/`#3E436F` (D39–D43) — both confirmed by measurement in the gate run
  - [x] Four Learn concepts (L1–L4) built; verdict recorded (D50–D53)
  - [x] Close-out: contrast audit · type scale · motion spec — three parallel Sonnet agents, spec in `construction/fe-0/closeout-spec.md`
  - [x] Token export for FE-1 — `design/fe-0/tokens/` (colour, type, motion + README), frozen
- [x] Build and Test — **PASS**. `construction/fe-0/build-and-test.md`. 10 pages × 6 widths × 2 themes = 120 measurements, 0 failures. Six layout defects found and fixed first, the material one being `.rail` losing its section links on every phone-width viewport (a grid item's default `min-inline-size: auto` made its scroller inert, and the root's `overflow-x: hidden` hid the evidence). One recorded exception: `index.html`, the treatment picker, has no dark theme and is not a surface FE-1 ports

### CONSTRUCTION — FE-1 `app-shell`

- [x] Functional Design — SKIPPED. No data model owned by this unit
- [x] NFR Requirements / NFR Design — SKIPPED. Tech stack (D26, Astro + React islands) and performance budgets already decided in `frontend-plan.md` §4/§6
- [x] Infrastructure Design — SKIPPED. Hosting is U11, deliberately undecided (R23)
- [x] Code Generation — COMPLETE. Plan: `construction/plans/fe-1-code-generation-plan.md`. Owner approved the plan and additionally approved self-hosting fonts (originally deferred) mid-plan
  - [x] `web/` scaffolded: Astro 7 + `@astrojs/react`, static output, `/fa/`+`/en/` i18n routing (both prefixed, D28), TypeScript strict
  - [x] FE-0 tokens imported verbatim (`colour.css`, `type.css`, `motion.css`) — byte-identical to `design/fe-0/tokens/`, plus one bug fix shared with the source (see Build and Test)
  - [x] Estedad Variable + Newsreader self-hosted (SIL OFL, licences included) — same files/subsets the FE-0 type-scale derivation measured against, not the prototypes' CDN references
  - [x] i18n layer: `fa.json` authored first (R15), `en.json` verified against it, build-time-throwing `t()` (R14 backstop)
  - [x] API client: hand-typed against the real route handlers in `api/src/routes/`, isomorphic, `{ok,data}`/`{ok,error}` result shape
  - [x] Four states (R4): `Loading`/`ErrorState`/`EmptyState.astro` for build time, `DataBoundary.tsx` for client islands, sharing CSS classnames rather than a component file (the two runtimes can't share one)
  - [x] Placeholder shell pages proving the wiring end-to-end (not the homepage — FE-4 owns that)
  - [x] Tests: 11 vitest (API client + i18n), `astro check` clean
  - [x] CI: `web` job added to `.github/workflows/ci.yml`; `.claude/launch.json` entry `fe1-web`
  - [x] `web/README.md`, root `README.md` repository-layout table corrected (`src/` relabelled frozen prototype)
- [x] Build and Test — **PASS**. `construction/fe-1/build-and-test.md`. 0 overflow at 320/375/768 across both locales and themes, 0 console errors, build produces both locale trees, both build-time and client-time API calls verified live in-browser. One real bug found and fixed in FE-0's "frozen" `colour.css` (an unterminated comment silently deleted the light-datasheet `--act` and `--ok-soft` declarations) — fixed in both the FE-0 source and the FE-1 copy, still byte-identical to each other. One environment defect found and fixed in this unit's own tooling (a corrupted `lightningcss` native binary from an earlier interrupted `npm install`), unrelated to FE-0

### CONSTRUCTION — FE-2 `value-atom`

- [x] Functional Design — SKIPPED. No new data model; R1/R5/R10/R11/R12/R22 + D5/D21 are the spec, and FE-0's `render.js`/`base.css` already prototyped and gate-tested the interaction pattern
- [x] NFR Requirements / NFR Design — SKIPPED, unchanged from FE-1
- [x] Infrastructure Design — SKIPPED, unchanged from FE-1
- [x] Code Generation — COMPLETE. Plan: `construction/plans/fe-2-code-generation-plan.md`. Owner approved the plan including the in-scope API fix
  - [x] API fix: `materials.ts`'s citation query joined through to `source` (work/edition — R11 was previously unsatisfiable). Tested against a real inserted-and-cleaned-up fixture, not a mock
  - [x] `web/src/lib/api/types.ts` `Citation` gains `sourceTitle`/`sourceEdition`, `locator` typed as `CitationLocator`
  - [x] i18n: value-atom strings, Persian ported verbatim from FE-0's `data.js` (D21's exact wording)
  - [x] `web/src/components/value-atom/`: `ValueAtom.astro`, `value-atom.css`, `logic.ts` (provenance derivation, locator formatting), `popover-hover.ts` (desktop-hover progressive enhancement)
  - [x] Popovers on the native Popover API + CSS anchor positioning (enhancement) with a full-width sheet baseline — per the FE-0 gate record's explicit recommendation, not hand-managed `position: absolute`
  - [x] Placeholder pages render three real LDPE rows (uncited numeric, uncited mixed-script text, genuinely-missing) — R9
  - [x] Tests: 7 new vitest (`logic.test.ts`) + 1 new API integration test; 18/18 vitest total
- [x] Build and Test — **PASS**. `construction/fe-2/build-and-test.md`. 0 overflow at 320/375/768 across both locales/themes, 0 console errors, popover open/close and anchor-positioning collision-avoidance verified live in-browser, both build succeeding against the live API. Two pre-existing API test failures confirmed unrelated (data drift from earlier work, verified via `git stash`). Citation coverage confirmed genuinely 0% by query at the time — a parallel session subsequently closed G0–G8/G10/N1 and added real citations; see the addendum in `construction/fe-2/build-and-test.md` §7 and the reconciliation logged 2026-08-05T19:55 below

**Reconciliation, 2026-08-05**: a parallel session landed evidence polymorphism, the editorial/observation value model, property scoping (`appliesToFields`/`appliesToFamilies`), and closed G0–G8/G10/N1 while FE-2 was in progress — 7 materials now (was 2), 114 real citations (was 0). It preserved FE-2's citation-join fix correctly. `web/src/lib/api/types.ts` reconciled (`PropertyGroup.uiTab` and `MaterialStructure.unitCell` removed, both dropped from the API by G8/G10); both test suites re-verified clean (18/18 API, 18/18 web).

### CONSTRUCTION — FE-3 `datasheet-surface`

- [x] Functional Design — folded into the plan (§1–2: which tables back which rail section, and the registry-scoping diff), not a separate document
- [x] NFR Requirements / NFR Design — SKIPPED, unchanged from FE-1/FE-2
- [x] Infrastructure Design — SKIPPED, unchanged from FE-1/FE-2
- [x] Code Generation — COMPLETE. Plan: `construction/plans/fe-3-code-generation-plan.md`. Owner approved with a scope reduction: producers/trade-names/applications cut (0 real rows); `processingTechniques` kept
  - [x] API expansion: `/api/materials/:slug` gains `overviewFa`/`overviewEn`, `discoveryYear`, `chainType`, `coverage` (join to `v_citation_coverage`, matching the list endpoint), `processingTechniques` (`material_process`, not the bare junction table)
  - [x] `web/src/lib/pages/material-detail.ts`: the registry-scoping diff (S4) — `appliesToFields`/`appliesToFamilies` decide candidacy, presence among candidates decides missing vs. shown, never conflated
  - [x] `web/src/lib/datasheet/learn-bridge-map.ts`: R28/S10's "declared once, in data" mapping — only the 3 of 6 groups the owner actually specified a tool for; the rest stay silent rather than guessing
  - [x] `web/src/components/datasheet/`: `SectionRail` (+ scroll-spy, ported from FE-0's already-working `IntersectionObserver`), `CoverageBadge`, `PropertySection`, `ProcessingTechniqueList`, `LearnBridge`, `GradeSelectorSlot` (inert — 0 real grades, checked), `BottomLinks` (similar/compare entry points only, per S6/S7's actual acceptance criteria — not FE-3's features)
  - [x] `web/src/pages/{fa,en}/m/[slug].astro`: 14 static material pages (7 materials × 2 locales), `getStaticPaths` from the live API
  - [x] Tests: 6 new vitest (registry-scoping diff) + 4 new API integration tests; 24/24 web, 21/21 API
- [x] Build and Test — **PASS**. `construction/fe-3/build-and-test.md`. Two real defects found and fixed: (1) `.sec-body`/`.col` grid containers with no explicit column track, sizing to content instead of their constrained container — same bug class as FE-0's `.rail` fix, one level deeper; (2) a genuine defect in FE-2's own `ValueAtom` — `white-space: nowrap` breaks on a long `text`-type value (LDPE's `rheology_notes`, 131 characters), never caught by FE-2's own demo since it only ever showed short values. Fixed in the shared component, not just here; FE-1/FE-2's pages re-verified clean afterward. 60 overflow checks total (320–1440px, both themes, 6+ pages), 0 failures after fixes. Scroll-spy, a real citation, and real coverage all verified live in-browser

**FE-0 `visual-identity` is CLOSED** (2026-08-04). FE-1 consumes `design/fe-0/tokens/`
and does not re-derive it. Carried forward: rebuild popovers on the Popover API with
CSS anchor positioning rather than porting the prototypes' containing-block workarounds.

### CONSTRUCTION — FE-4 `homepage-catalog`

- [x] Functional Design — SKIPPED. No data model; presentation over `/api/materials` and `/api/coverage`, both already built
- [x] NFR Requirements / NFR Design — SKIPPED, unchanged from FE-1–3
- [x] Infrastructure Design — SKIPPED, unchanged from FE-1–3
- [x] Code Generation — COMPLETE. Plan: `construction/plans/fe-4-code-generation-plan.md`
  - [x] Homepage (`{fa,en}/index.astro`) replaces FE-1's placeholder entirely: hero, real stats (7 materials/73 properties, checked against the live API), browse + search CTAs as visual equals (D6)
  - [x] Catalog (`{fa,en}/catalog.astro`): family-grouped cards, client-side text+family filter (`filter-logic.ts`), URL-reflected (`?q=`/`?family=`, R13)
  - [x] `MaterialCard.astro` shared between homepage preview and catalog
  - [x] API: `/api/materials` gains `familyNameFa`/`familyNameEn` (additive)
  - [x] Dead code removed: `web/src/islands/HealthCheck.tsx` (FE-1's proof island), orphaned once the homepage's placeholder content was replaced
  - [x] Tests: 8 new vitest (filter logic) + 1 new API test; 32/32 web, 22/22 API
- [x] Build and Test — **PASS**. `construction/fe-4/build-and-test.md`. 40 overflow checks (320–1440px, both themes, 4 pages), 0 failures. Homepage JS: 130 bytes gzip against a 60 kB budget. Two fixes found by testing: the homepage's hero was a sibling of `<main>`, not inside it (wrong for the accessibility landmark, invisible on screen — caught by text-extraction, not a visual check); the now-dead `HealthCheck.tsx` island removed. Filter interactions (text, family chip, empty state, URL reflection) verified live. Flagged honestly: FE-0's co-design process never covered a homepage, so this is a strong first pass on the existing tokens, not an owner-reviewed "beauty wow" the way the datasheet's design was

### CONSTRUCTION — FE-1b `site-chrome` — 2026-08-12 — COMPLETE

Opened on direct owner report while reviewing the running site ("in each
polymer page, there is no site name, and i can not go home"). FE-1 shipped an
app shell without a site header.

- [x] Code Generation — `components/chrome/{SiteHeader,ThemeToggle,Wordmark}.astro`, `styles/chrome.css`, wired into `BaseLayout`
- [x] Build and Test — **PASS**. `construction/fe-1b/build-and-test.md`

### CONSTRUCTION — FE-3b `grade-class-surfacing` — 2026-08-12 — COMPLETE

Surfaces `grade_class` (14 curated rows under U1 v2, `db/migrations/0015`/`0016`)
as an inline-expandable band at the bottom of the datasheet — the owner's
decision, taken over a top selector that swaps the page or a per-class route.

- [x] Functional Design — folded into the plan (`construction/plans/fe-3b-code-generation-plan.md`)
- [x] Code Generation — API expansion (`gradeClasses` on `GET /api/materials/:slug`) + `GradeClassBand.astro`, `<details>`/`<summary>` per row, no JS, no new island. D46 (no value inheritance) enforced at the query: `subject_type = 'grade_class'` alone, never falling back to the parent material's rows
- [x] Build and Test — **PASS**. `construction/fe-3b/build-and-test.md`

### CONSTRUCTION — FE-5 `property-first-search` — 2026-08-12 — COMPLETE

The stale "awaiting approval" entry that stood here until 2026-08-14 described
the Functional Design gate only; the unit went on to complete Code Generation
and Build and Test the same week.

- [x] Functional Design — `construction/fe-5/functional-design/{business-logic-model,business-rules,domain-entities,frontend-components}.md`. Plan + 8 clarifying questions in `construction/plans/fe-5-functional-design-plan.md`, all 8 recorded as **A** under Auto Mode rather than blocking, mirroring `database-revision-questions.md`'s 12/12 precedent. **Why this unit gets Functional Design, unlike FE-2–4**: those three were presentation over data the API already returned; FE-5 introduces a build-time static-index generator, an alias-derivation rule, a text-query parser and a client-side filter/match/rank algorithm. Key finding folded into BR2: `property_definition.is_searchable` already exists (migration 0004) as the schema's own slider-eligibility mechanism, so FE-5 uses it rather than inventing a parallel one
- [x] NFR Requirements / NFR Design / Infrastructure Design — SKIPPED, unchanged from FE-1–4
- [x] Code Generation — `scripts/build-search-index.ts` (build-time static index), `lib/search/{parse-query,match,url-state}.ts`, `components/search/*` (slider panel, query box, results, unrecognized-token hints, compare handoff)
- [x] Build and Test — **PASS**. `construction/fe-5/build-and-test.md`. Sliders bounded by real data, `tg>100 tensile 40-80` shorthand, strict-AND matching with a separated near-miss set, grade-class-aware results, "similar to this" pre-fill

**Already closed by earlier units, not re-litigated**: static index over live API
(D54/§12), interface shape (D24/D25), shareable URLs (R13), perf budget ≤120 kB
gzip (§6).

### CONSTRUCTION — FE-6 `compare` — 2026-08-12 — COMPLETE

- [x] Functional Design — folded into the unit's own artifacts (`construction/fe-6/functional-design/`)
- [x] Code Generation — N-way uncapped compare, `lib/compare/{difference,emphasis,ordering,url-state}.ts`, `components/compare/*`, `/api/compare` route. Two-layer typography/colour split (CR1–CR6), most-different-first ordering with a grouped toggle (CR7), application-polarity colouring, hide-identical, shareable `?subjects=` URLs (CR17). Materials and grade classes are both first-class subjects
- [x] Build and Test — **PASS**. `construction/fe-6/build-and-test.md` (revised same day after a coordinator correction — see §3)

### CONSTRUCTION — FE-7 `sources-surface` — 2026-08-12 — COMPLETE

- [x] Code Generation — per-material "CSV of data with their source" table (D4) at `/{locale}/m/[slug]/sources`, site-wide bibliography at `/{locale}/sources`, `/api/sources` route, plus one fix outside FE-7's boundary that D36 required in `value-atom`
- [x] Build and Test — **PASS**. `construction/fe-7/build-and-test.md`

### CONSTRUCTION — FE-8 `learn-surface` — 2026-08-12 — STEPS 1 AND 3 COMPLETE, STEP 2 BLOCKED

- [x] Step 1 + Step 3 — Code Generation and Build and Test **PASS**, both recorded in `construction/fe-8/build-and-test.md` (step 3's record is appended at the end of that file). Five concept tools shipped: state simulator, DP calculator, chain-branching simulator, tacticity simulator, Hansen 3D. Each optionally seeds from a real material's data and is family-scoped (`lib/learn/family-scope.ts` — tacticity hidden for the polyethylenes, branching shown only for polyolefins). `/api/solvents` and the solvents surface landed alongside
- [ ] **Step 2 — BLOCKED ON DATA**, not on effort. Documented separately in `construction/fe-8/step-2-data-requirements.md`

**Open defects reported by the owner 2026-08-14, not yet fixed** (delegated,
see the release-readiness entry below): the Hansen 3D spheres are opaque and
have no spatial reference geometry; the search sliders are hard to grab and
their filter cards shift horizontally inside the grid; and the Learn
environment reads as the legacy prototype rather than the structure FE-0
designed for it.

### CONSTRUCTION — release readiness — 2026-08-14

Owner asked for the final publishable whole and a hole-list. The stack was run
end to end and verified: Postgres (29 migrations, schema suite all-pass), API
(53/53 tests, 7 route groups all 200), web (82 pages built, 267/267 vitest,
`astro check` 0 errors, 0 console errors).

- [x] **Inert grade selector retired.** `GradeSelectorSlot.astro` (a `disabled` `<select>` reading "Choose a grade (coming soon)") was still rendering at the top of every datasheet *above* FE-3b's working grade band. Replaced with `GradeClassJumpLink.astro` — an anchor to `#grade-classes` captioned with the real class count, rendering nothing for the 14 materials that have no grade classes. Deliberately not a selector: that question was closed by FE-3b's owner decision
- [x] **`material.status` is no longer decorative.** `lib/publish.ts` + `DraftBadge.astro`: a draft notice on every datasheet whose material is not `published` (all 17 today), plus a build-time gate `PUBLIC_PUBLISHED_ONLY` that drops non-published materials from static paths, catalog, homepage and sitemap. **Off by default** — turning it on today builds a site with zero material pages, which is worse than an honest badge; it becomes useful the moment the first material is promoted. Verified in both positions (default 82 pages, gate on 0 material pages). 5 new vitest, documented in `web/README.md`
- [ ] **The publishing blocker is data, not code**: 10 of 17 materials (ABS, PA6, PA66, PC, PLA, POM, PS, PTFE, EPDM, Epoxy) have **zero** property values and render as ~68 consecutive "Not yet recorded" rows. Grade classes exist for LDPE/HDPE/LLDPE only
- [x] **Three owner-reported UI defects fixed (2026-08-14), each by a delegated agent, each with a root cause found by measurement rather than guessed:**
  - **Hansen 3D** — the reported "can't see inside the spheres" was two defects, not one. Transparency was missing (now `fill-opacity` 0.55–0.65, chosen over the `opacity` shorthand so stroke and hit-testing/tooltips are not faded with the fill), AND the polymer marker was painted unconditionally last, so it occluded solvents that were actually nearer the camera. Points are now merged and sorted far-to-near before painting. Added HSPiP-style reference geometry: `gridPlaneLines()` (gridded floor + two back walls, 3 of 6 faces — the far ones are clutter from any normal angle) and `dropLine()` per point, plus ±30% depth-scaled radii. `hansen-space.ts`, `HansenSpaceIsland.tsx`, `learn.css`, +5 tests
  - **Search sliders and the "loose" filter grid** — sliders: thumb hit target was 16×16 px against WCAG 2.5.5/R30's 44×44, and the two overlapping range inputs had a *static* z-index, so at close or equal values one handle was physically unreachable (clicks always landed on the DOM-later element). Hit box now 44×44 via radial-gradient (visible dot unchanged), z-index now dynamic per grabbed handle, `touch-action: none`, focus-visible outline added. Grid shift: `.search-slider-head` had `flex-wrap: wrap`, so a wide value label (this domain spans 0.02 to 1e18) pushed the head to a second line, changing list height, crossing the scroll container's threshold and **toggling the scrollbar** — whose 15 px changed every card's width. Reproduced exactly (258px→243px) before fixing: `nowrap`, truncating label, tabular-nums non-flexing value, `scrollbar-gutter: stable`. `PropertySlider.tsx`, `search.css`
  - **Learn surface restructured onto D50** — the shipped page had regressed into precisely what `fe-0/lab-concepts-spec.md` opens by rejecting ("a vertical stack of eight identical numbered cards... the default output shape of a language model asked to present a list"). Rebuilt as FE-0's zoom, ported from `design/fe-0/lab/scale.*`: sticky magnification readout, a scale rail whose tick spacing is proportional to log-distance, and six stations from 10⁻¹⁰ m to 10⁰ m, each carrying the tool that belongs at its length scale (tacticity 10⁻¹⁰, DP + Hansen 10⁻⁹, branching 10⁻⁸, state simulator 10⁻³). Structure is Astro + CSS (`components/learn/*`, `styles/learn-scale.css`); the five islands, `lib/learn/*` and `learn.css` were NOT edited, so the concurrent Hansen work survived. Two empty stations (10⁻⁶, 10⁰) kept deliberately, each stating its reason — deleting them would hide a step in the zoom. Two defects found and fixed in passing: the prototype's IntersectionObserver readout never fired, and rail ticks were 17 px on mobile (R30 fail). Gate record: `construction/fe-8/build-and-test-restructure.md`
  - **After all three**: 272/272 web vitest, `astro check` 0 errors, 82 pages built, 0 overflow at 320/375/768/1280, both themes, both locales, no console errors
  - **Open, deliberately not fixed**: tool titles are `<h2>` like the station headings, so the heading hierarchy is flat. Fixing it means editing all five islands — left for an owner call
- [ ] **Citation coverage is inverted on the flagship materials**: PMMA/PVC/PP/PET are 100% cited; LDPE is 4/54 and HDPE 3/55, because the original 2026-07-31 seed values were never revisited. The two polymers a visitor is most likely to open are the two least sourced

### CONSTRUCTION — `learn-surface` foundation layer (step 1 of 4: MAP/GRAPH/NOTEBOOK to follow) — 2026-08-15

Owner, two corrections: "pay attention, when entering from a polymer
datasheet, all defaults must be this polymer" and "where are the figures and
plots you talked about!" — both addressed in one pass, since the second
depends on the material-context work the first required.

- [x] **Shared material context**: `lib/learn/material-context.ts`'s
  `useLearnMaterialContext()` — one hook, reused by all five existing tools
  plus the two new ones below, exported for MAP/GRAPH/NOTEBOOK to consume
  unchanged. Every tool now seeds itself from a bound datasheet material,
  with scoping (family AND property) winning over seeding by construction —
  verified live: `?material=hdpe` seeded State/DP/Branching/ChainCoil/Hansen
  and correctly left Tacticity unseeded (HDPE has no stereocentre);
  `?material=ldpe` seeded Branching to "long-chain branched" and still left
  Tacticity unseeded; no param and an unknown slug both degrade to the
  original illustrative defaults, no error, no console error
- [x] **The FE-0 spec's required 10⁻⁹ live element, built**: `ChainCoilIsland`
  — a seeded, deterministic 2D random-walk chain (`lib/learn/random-walk.ts`),
  DP slider 100–20 000, reports end-to-end distance and Rg in bond lengths
  (never nm — no excluded-volume/persistence-length data exists to justify a
  real unit). Physics checked against an independent Node re-implementation
  at three DP values; render scale proven (not guessed) to contain the walk
  at every DP via a same-seed-prefix bound
- [x] **10⁻⁶ (spherulite) filled with real data**: `CrystallinityDensityIsland`
  — a table of the 3 (of 17) materials with both density AND crystallinity on
  record (hdpe, ldpe, pet), checked against the live API before building,
  not assumed
- [x] **10⁰ (lifecycle) gap note sharpened**, still a stated gap, not a
  chart: confirmed via the live API that `co2_footprint_virgin` is a
  registered property with **zero** values across all 17 materials; the note
  now names it
- 301/301 vitest (272 baseline + 29 new pure-module tests), `astro check` 0
  errors, 0 console errors, 0 overflow at 320/375/768, both themes/locales.
  Gate record appended to `construction/fe-8/build-and-test-restructure.md`
- [ ] Pre-existing, found but out of scope: `.learn-reset` buttons are 35px
  tall (R30 wants 44px) across the whole Learn surface, not introduced here;
  DPCalculator's monomer-name note shows Persian text even on `/en/` because
  `academic.monomer_name` has one `valueText` field, not separate fa/en

### CONSTRUCTION — L2 «نقشه» / MAP ships, reversing D52 — 2026-08-15

**Reverses D52** (2026-08-03: map deferred — "it is a per-material view and
wants more than two materials to be worth its space", 2 materials at the
time). The catalog now holds 17, and the owner has since said, verbatim:
*"we had a early draft on learning phase had 4 parts! a map, and two others
and fourth one was this one you are showing as the learning interface. i
want those four parts!!!"* — naming the map first. D52's stated condition
lapsed and the ask is now explicit, so this is step 2 of the four-part
learning surface (SCALE shipped 2026-08-15 above; GRAPH and NOTEBOOK follow).

- [x] **New route**: `/{locale}/learn/map`, sibling to `/{locale}/learn`
  (SCALE) — not a station inside SCALE's zoom (MAP organises by temperature,
  SCALE by length scale). `LearnConceptNav.astro` is the shared four-part
  switcher on both pages; GRAPH/NOTEBOOK render as inert "coming soon"
  entries until their own routes exist — the seam the next two agents follow.
- [x] **The modulus–temperature master curve**, drawn from each material's
  REAL Tg/Tm/degradation-onset (`lib/learn/modulus-curve.ts`, reusing
  `thermal.ts`'s phase classification rather than re-deriving it) — never
  from illustrative constants. A real `young_modulus`, when on record,
  anchors the curve's absolute height on whichever schematic plateau room
  temperature actually falls into for that material; when absent, the whole
  height (not just the shape) is labelled illustrative in visible copy. No
  Tm is ever invented for an amorphous material (verified with PMMA: real
  Tg + Td, no Tm — no plateau drawn, none invented).
- [x] **Draggable AND keyboard-operable marker** (R30): a real 44px
  `<button role="slider">` overlay (not a scaled SVG shape) tracks the curve;
  Arrow/Shift+Arrow/Home/End all verified via real dispatched
  Pointer/KeyboardEvents, not just read from source.
- [x] **Region-gated tray, greyed not hidden**: 7 fixed chips
  (`lib/learn/map-tray.ts`), only `is-active`/`is-dim` toggling as the marker
  crosses glass/rubber/melt/burn — verified live across all four regions for
  HDPE. A separate always-visible section holds the four genuinely
  non-temperature-dependent tools (Hansen, DP, chain coil, tacticity) rather
  than forcing them onto the curve.
- [x] **Honest empty state is the common case**: a material with no Tg (10 of
  17 have zero property values) shows a named "no Tg on record" state, no
  curve — verified live with PS. A picker covers the no-`?material=` case.
- 348/348 vitest (301 baseline + 23 new pure-module tests + parity fixes to 3
  existing test fixtures for the extended `LearnMaterial` shape), `astro
  check` 0 errors, 0 console errors, 0 overflow at 320/375/768 (RTL and LTR),
  both themes. `MapIsland` bundle: 4.7 kB gzipped. Gate record:
  `construction/fe-8/build-and-test-map.md`.
- One bug found and fixed during this unit's own verification: the
  "arrived from a datasheet" bound-note originally rendered even when the
  bound material had no Tg, directly contradicting the empty state shown
  right below it — fixed by gating the note on a curve actually existing.

### CONSTRUCTION — L3 «شبکه» / GRAPH ships — 2026-08-15

Step 3 of the four-part learning surface (SCALE and MAP shipped 2026-08-15
above; NOTEBOOK follows). The owner specifically named this concept's own
taste for it: *"the owner named Obsidian-style graph views and Wikidata as
things they enjoy (round-1 Q16)"* (lab-concepts-spec.md).

- [x] **New route**: `/{locale}/learn/graph`, sibling to `/{locale}/learn`
  (SCALE) and `/{locale}/learn/map` (MAP). `LearnConceptNav.astro`'s `graph`
  entry flipped from `href: null` to the real route; `notebook` stays inert
  for the next agent.
- [x] **Hand-placed SVG causal graph, 11 nodes** (3 draggable structural
  causes — branching, cooling rate, Mw — feeding 5 read-only derived
  properties — crystallinity, density, Tm, modulus, tensile — feeding 3
  terminal outcomes — film, injection moulding, cable insulation), no
  graph/force library. Honours the spec's own inline correction: tacticity
  is NOT a structural cause here (cooling rate replaced it, per the
  documented LDPE-has-no-stereocentre error) and never appears as a GRAPH
  input.
- [x] **Measured vs. illustrative, never blurred into one number** (R5):
  each derived node shows its REAL value (when the bound material has one),
  real units, real §/?/× provenance mark — separately from a unitless 0–100%
  "illustrative trend" that responds live to the three drag inputs. Verified
  with HDPE (real cited density/Tm, real uncited crystallinity/modulus/
  tensile) and PA6 (zero property values — all five nodes show "no
  datasheet row," never a fabricated number).
- [x] **Draggable AND keyboard-operable inputs** (R30): three real 44px
  `<button role="slider">` pucks; Up/Down nudge, Home/End jump — Home/End is
  new versus the FE-0 prototype this ports from. A native `<details>`
  "described list of the causal relations" gives screen-reader/keyboard
  users a full text parallel to the diagram, per R30's own suggested
  approach.
- [x] **RTL decision stated and implemented**: unlike MAP's fixed-`ltr`
  temperature axis (one universal chart convention), a causal graph's
  left/right arrangement is a pure narrative device with no such
  convention — so THIS diagram mirrors per locale (causes reading-first:
  right in fa, left in en), verified live via puck position (`left: 92%`
  fa vs. `left: 8%` en for identical state).
- [x] **Departed from the FE-0 prototype in one documented way**: no `mfi`
  node (the spec's own derived-property list doesn't have one; Mw's edges
  reach film/injection directly instead, preserving the real melt-viscosity
  mechanism without a 6th derived node the spec never named).
- 372/372 vitest (348 baseline + 24 new in `causal-graph.test.ts`), `astro
  check` 0 errors, i18n 452/452 keys (fa === en, set-equal), 0 console
  errors, 0 overflow at 320/375/768, both themes verified against real
  design tokens (not hardcoded hex). Gate record:
  `construction/fe-8/build-and-test-graph.md`.
- One mid-verification fix: the branching cause's label initially clipped
  ~6px past the SVG's own top edge (caught via `getBoundingClientRect()`,
  not by eye) — `CAUSE_LAYOUT`'s track-top margins tightened; re-verified.

### CONSTRUCTION — L4 «دفترچه» / NOTEBOOK ships — all four Learn concepts now live — 2026-08-15

Step 4 of 4, and the last one. Closes the owner's standing four-parts
request in full: *"we had a early draft on learning phase had 4 parts!... i
want those four parts!!!"* — SCALE, MAP, GRAPH and now NOTEBOOK are all real
routes; `LearnConceptNav.astro` has zero inert entries left, verified live
(`.concept-nav-link` on `/fa/learn` returns 4 real `<a>` elements, none
`is-disabled`).

- [x] **New route**: `/{locale}/learn/notebook`, sibling to `/{locale}/learn`
  (SCALE), `/{locale}/learn/map` (MAP) and `/{locale}/learn/graph` (GRAPH).
  `LearnConceptNav.astro`'s `notebook` entry flipped from `href: null` to the
  real route — the last flip; the component's own "GRAPH/NOTEBOOK before
  they exist" comment no longer describes any live case on this page.
- [x] **The spec's real point, not just a fourth page**: the lab is "a
  publication with live figures," so the deliverable is a **reusable
  document template** demonstrated by one real article, not a one-off. Built
  as a typed content module (`content/notebook/`, `NotebookArticle` +
  `ProseSegment` builders) rather than i18n strings or hardcoded JSX — a
  second article is `articles/<new-slug>.ts` plus one line in
  `NOTEBOOK_ARTICLES`; nothing in `LearnNotebook.astro`, `ProseSegments.astro`,
  `NotebookFigureIsland` or `reading-time.ts` needs to change. Full reasoning
  in `content/notebook/index.ts`'s header and the gate record's §2.
  One stated, narrower gap: no multi-article index page exists yet — building
  one for a collection of one would be speculative.
- [x] **Article #1**, "Why LDPE Never Packs as Tightly as HDPE": the
  branching → crystallinity → density → application mechanism GRAPH and
  SCALE already encode, in prose — zero hardcoded numbers, every quoted
  value a `liveValue` pointer resolved server-side against the live API with
  its real provenance mark (`InlineCitedValue.astro`, extracted from
  `ValueAtom.astro`'s own value+mark+popover markup so R1's component is
  reused, not reimplemented, mid-sentence). Checked against the running API
  before writing: LDPE's density and crystallinity are `published`/cited,
  its Tg/Tm are unsourced — the article shows BOTH provenance states for
  real, not a cherry-picked one.
- [x] **Review block** (D5, metadata only, no quoted body text): uses the
  `نمونهٔ طراحی` / `DESIGN SAMPLE` object `design/fe-0/lab/data.js`'s `vicat`
  entry already committed to. A real citation was deliberately NOT attached
  — `GET /api/sources` (1,290 rows) was checked, but this agent never
  verified any specific real paper actually supports the claim the block
  paraphrases, and attaching a real citation id to an unverified claim would
  be a false attribution — the same failure class R5 exists to prevent, just
  aimed at a source instead of a number.
- [x] **One live figure mid-article** (spec requirement): density +
  crystallinity for a picked material, real provenance marks, verified with
  `?material=hdpe` (real cited density, real uncited crystallinity) and
  `?material=pa6` (zero property rows — both stats show an honest "no value
  on record" note, never a fabricated number) — the same measured-vs-honest
  discipline GRAPH's own live figure already established, deliberately NOT
  a generalised version of the FE-0 prototype's slider (that would need a
  fabricated density range for materials whose real range isn't carried at
  the shared `LearnMaterial` shape — R5 again).
- [x] **Tufte sidenotes + alternating spread + TOC/progress**, ported from
  `notebook.css` onto this app's token vocabulary, all classes renamed
  `nb-`/`nbv-`-prefixed (the FE-0 prototype's bare `.mark`/`.pop`/`.term`/
  `.note` names collide with `value-atom.css`'s own already-global classes —
  caught before shipping, not after). Mobile collapses sidenotes behind a
  44px toggle button (a real fix mid-build: `border-box` sizing meant the
  first attempt's padding never actually grew the hit target — caught via
  `getBoundingClientRect()`, not by eye). TOC scroll-spy and the reading-
  progress bar are a plain script (`notebook-chrome.ts`), not a React
  island — reusing `SectionRail.astro`'s already-shipped scroll-spy pattern
  rather than a second one.
- [x] **Term hover-definition keyboard-operable, verified with real key
  presses** (R30) — confirmed the difference directly between a scripted
  `.focus()` call (leaves `:focus-visible` false, Chromium correctly ignores
  synthetic focus for this heuristic) and a real dispatched Tab keypress
  (sets it true, popover's computed style flips to visible) — the kind of
  distinction that is easy to get wrong in automated verification and worth
  recording so it isn't re-litigated.
- 389/389 vitest (372 baseline + 17 new across 4 pure modules —
  `chain-schematic`, `reading-time`, `units`, `figure-density`), `astro
  check` 0 errors/0 warnings, `npm run build` 88 pages clean, i18n 479/479
  keys (fa === en, set-equal), `prettier --check` clean, 0 console errors on
  a fresh tab, both themes verified against real design tokens. Gate record:
  `construction/fe-8/build-and-test-notebook.md`.
- One real bug caught and fixed mid-build, the exact hazard class the build
  brief warned about: `learn-notebook.css`'s own header comment contained a
  literal `-*/` sequence, closing the block comment early and leaving real
  prose to be parsed as CSS — caught via `preview_logs`, fixed, and (a
  separate follow-on issue) the dev server's postcss-import cache needed a
  full restart, not just a file touch, to stop replaying the stale error.
  Full account in the gate record §8.

### CONSTRUCTION — FE-5 filter-persistence fix — 2026-08-15

Owner: "the search tool has a huge problem. when a polymer is removed by a
filter, after bringing the filter back to where it was, the polymer does not
go back! so when i add too many filters, the search will not work at all
anymore before refreshing!" Gate record:
`construction/fe-5/build-and-test-filter-fix.md`.

- [x] **Root cause confirmed live**: `sliderFilters` never removed an entry
  once a slider was touched, and `match.ts`'s "no value never matches"
  (BR2+BR5, correct on its own) made that permanent for any material with no
  recorded value for the touched property — 10 of 17 materials have zero
  values at all. Most of the fix (`slider-filters.ts`'s full-range-deletes-
  the-entry rule, the chip list + per-slider reset + "clear all", the
  `missingData` disclosure bucket) was **already present, uncommitted**, at
  the start of this run — a prior pass had done the implementation and
  stopped short of verification and the gate record
- [x] **Owner's exact scenario reproduced then proven fixed**: baseline 14
  results → narrow a property a target material has no value for → 11 →
  drag back to full range → 14, byte-identical. 4-filter stack cleared to
  full recovery without a reload. Verified live against the running dev
  server, not eyeballed — real result sets diffed
- [x] **Refresh mystery resolved empirically, not just reasoned about**:
  temporarily reverted `applySliderChange` to the pre-fix naive version,
  reproduced the bug, then reloaded the *exact same URL* — still broken (11,
  not 14). This rules out "`decodeSearchState` drops filters" and "full-range
  filters serialize differently" (both disproven by the same test) and
  points at the mundane explanation: the owner's "refresh" was very likely
  not a literal same-URL reload, or the version they hit predates the
  URL-sync effect existing at all — either way the operational fact is the
  same one item 2 of the brief closes: pre-fix, the only way to recover was
  to lose the whole search, not repair it
- [x] **A second, real bug found during verification and fixed**: the URL
  sync encoded the merged `[...sliderFilters, ...textFilters]`, so a
  text-typed filter (`tg>100`) also wrote its own `tg=100-120` URL param.
  Reloading that URL fabricated a `sliderFilters.tg` entry the reader never
  earned by touching a slider — it got a chip and a reset button, and
  clicking the chip's "×" deleted the fabricated entry while the text (still
  in the query box) silently regenerated the identical constraint next
  render. Chip disappears, filter keeps working — the exact "invisible
  constraint" failure the brief warned against. Fixed in
  `SearchIsland.tsx`: the URL sync now encodes `sliderFilters` only; `q`
  stays the single source of truth for text-derived filters. Documented as
  a new own call in `business-rules.md`'s post-launch amendments
- [x] **BR13 `?from=` pre-fill re-verified against the new rule**: bypasses
  `applySliderChange` by construction (writes `sliderFilters` directly in
  `useState`'s initializer), so it can't be wiped by the full-range rule.
  Confirmed live: `?from=hdpe` still pre-fills all 45 of its own ranges
- [x] Regenerated `web/public/search-{materials,properties}.json` — stale
  at the start of this run (7 materials, an earlier DB state); now matches
  the live DB (17 materials, matching the brief's "10 of 17 have zero
  values" exactly)
- 348/348 `vitest` (301 baseline noted in the brief, 346 actual at this
  run's start, +2 new for the second bug), `astro check` 0 errors, both
  themes/locales, 0 overflow at 320/375/768, no console errors
- Incidental: an unrelated `learn-map.css` comment-syntax break (from the
  concurrently-running Learn MAP session) took the whole dev server down
  mid-run; applied a one-space unblocking fix, superseded moments later by
  that session's own proper fix. No Learn-surface file otherwise touched

### INCEPTION — deployment (U11) — 2026-08-04

- [x] Workspace Detection — SKIPPED. Brownfield established, artifacts current
- [x] Reverse Engineering — SKIPPED. No code drift; this unit adds infrastructure, not features
- [x] Requirements Analysis — COMPLETE (standard depth). `inception/requirements/deployment-requirements.md`, FR-D1 … FR-D21 and NFR-D1 … NFR-D7. Seven open questions in `deployment-questions.md` (Q-D1 … Q-D7); the document proceeds on the recommended answer for each, marked **[assumed]**, per the owner's standing instruction not to halt
- [x] User Stories — SKIPPED. Infrastructure only; no new user-facing surface
- [x] Workflow Planning — COMPLETE. `inception/plans/deployment-plan.md`
- [x] Application Design — SKIPPED. No new service boundary. The API contract (U2) is unchanged
- [x] Units Generation — COMPLETE. U11 splits into U11a `static-hosting` (in scope), U11b `api-hosting` (deferred), U11c `email`, U11d `mirror`

**Owner decisions**: D54 hybrid build split by volatility · D55 the wordmark animates the domain · D56 ArvanCloud is the host. New rules R38–R40 (hybrid-build safety), recorded in `plans/frontend-plan.md` §12.

**This closes open decision §5.1 "Hosting"** in `project-plan.md`, and closes §4's
"static index or live API" question in `frontend-plan.md` — the answer is both,
static first, so FE-5 starts with nothing left to decide.

**New blocker found during this analysis**: there are no database backups of any
kind. The curated database is the project's entire asset and citation work is
unrecoverable manual effort. An automated `pg_dump` plus one verified restore is
now Phase 4 of U11a and must land before launch.

### CONSTRUCTION — U11a `static-hosting` (in progress) — 2026-08-06

Owner-side progress since the plan was written: `polycyclopedia.ir`
registered, ArvanCloud CDN created, TLS connected via free Let's Encrypt.
Object storage (ابر آروان) setup in progress.

- [x] `db/backup.sh` — `pg_dump` + `--verify` (restore into a throwaway DB,
      compare row counts). Run for real 2026-08-06: 7 materials, 216
      property values, 12 citations, 114 evidence rows, all matched. Closes
      Phase 4's manual case — the highest-severity gap in the whole unit
- [x] `web/deploy.sh` — FR-D12's single-command sync, FR-D11's two-tier
      cache policy (hashed assets 1-year immutable, everything else
      revalidate-on-request). Not yet run against a real bucket — blocked on
      the owner finishing object-storage setup
- [x] `web/public/robots.txt` (FR-D23) — named AI-training crawlers
      disallowed, backs `docs/legal/ai-usage-policy.md`
- [x] `web/src/pages/sitemap.xml.ts` — generated from the same
      `getMaterials()` call `getStaticPaths` already uses, not hand-maintained
- [x] `astro.config.mjs` gains `site: 'https://polycyclopedia.ir'`
- [x] Root `README.md` Deployment section rewritten: corrected status (was
      stale — said "nothing is deployed" after the domain/CDN/SSL were
      already done), the ابر آروان setup runbook, the deploy/backup commands
- [ ] **CI deploy job (FR-D15) — explicitly not built yet.** CI's Postgres
      would be freshly seeded from `db/seeds/*.sql`, which carries none of
      the real citation data (that only exists via live `tools/curation/`
      imports directly into the running database) — a CI-built site would
      show 0% coverage, not the real number. Needs "restore the latest
      backup into CI before building" first. Flagged, not silently skipped
- [ ] Object-storage bucket, CDN origin pointing at it, `www` redirect,
      SPF/DMARC placeholder records — owner-side panel actions, blocked on
      bucket creation finishing
- [ ] Scheduled backup + off-machine (object storage) upload — the remaining
      half of NFR-D4; today's backup is real but local-only

**Nothing has been published.** No deploy has been run against a real
bucket; `web/dist/` has been built locally with real data as the artifact
ready for the owner to run `deploy.sh` against once the bucket exists. D10
(no publish until FE-9) still governs — what exists now is infrastructure
readiness, not a live site.

### LEGAL AND LICENSING — 2026-08-04

Owner decisions on ownership, licensing and brand. Canonical overview and the
file-by-file boundary: `docs/legal/README.md`.

- [x] Project identity — independent platform; Scientific Association of Polymer Engineering acknowledged as **founding academic partner**, not owner. Approved wording fixed in `docs/legal/README.md` §2
- [x] Six-layer separation — source code / database / scientific content / APIs / branding / trademark, each with its own owner and licence. Never mixed
- [x] Source code — **Apache License 2.0**. `LICENSE` installed verbatim, verified against two independent copies. Scope limited to source code, **never repo-wide**
- [x] `NOTICE` — enumerates every exclusion from the code licence
- [x] Database — proprietary, not open data. Claim rests on compilation copyright plus contract, **not** on owning physical facts; Iran has no _sui generis_ database right
- [x] Documents written — terms of service, API terms, database licence, AI usage policy, branding/trademark policy, copyright policy, privacy policy, contributor licence agreement
- [x] Deployment consequences — FR-D22 … FR-D27 in `deployment-requirements.md` §8

**Two findings from this analysis, neither previously tracked:**

1. **`db/seeds/0005_materials_ldpe_hdpe.sql` mixes the layers** — 26 structural
   inserts and 109 curated value/citation inserts in one file. A file cannot be
   half Apache-2.0. Must be split before the code licence is advertised (FR-D26).
   Treated as wholly proprietary until then.
2. **The GitHub repository is public and always has been**, while carrying no
   licence file. Nothing was granted away — unlicensed publication is all rights
   reserved — but the curated data has been publicly cloneable throughout, and
   history cannot be un-published. D10 ("no publish until FE-9") governs the
   site; it never governed the repository.

**Open**: every document in `docs/legal/` is a draft and **has not been reviewed
by a qualified lawyer**. That review is now the blocker, not the decisions. It
must happen before publication and before any commercial agreement.

### INCEPTION + CONSTRUCTION — U1 revision `database-core v2` — 2026-08-05 — COMPLETE

Triggered by the owner: the datasheet must be **general and reliable at the same
time**, which the v1 schema cannot express. Four drivers, three structural and
one missing feature:

1. No rung between `material` and `grade` — "injection LDPE" / "film LDPE" have
   nowhere to live, so every source describing one is forced into the LDPE row
   and reads as a contradiction.
2. `uq_property_value_live` (`db/migrations/0005_property_values.sql`) allows one
   live value per (subject, property, conditions) — ten density sources cannot
   coexist, so reconciliation happens off the record.
3. `property_definition` treats every property as equally variable, so there is
   no stopping rule for curation.
4. No authorship model — `property_value.created_by` is free text with no table
   behind it and no display path. The owner asked to be credited as author of
   the data they supply.

- [x] Workspace Detection — SKIPPED (auto). Brownfield established; reverse-engineering artifacts current, no code drift
- [x] Reverse Engineering — SKIPPED. Same reason
- [x] Requirements Analysis — COMPLETE. Owner's follow-up instruction ("using aidlc, fix the issue... i will fetch you some data... afterwards", then immediately "inject all of my cited data") read as authorization to proceed on the recommended answer for all 12 questions rather than wait — Auto Mode's standing bias toward a reasonable default over a blocking question. All 12 recorded as **A** in `inception/requirements/database-revision-questions.md`. Requirements: `inception/requirements/database-revision-requirements.md` (FR-1…FR-12, NFR-1…NFR-5)
- [x] User Stories — SKIPPED. Persistence layer; no new user-facing surface in this unit (public credit rendering deferred, FR-7/FR-11)
- [x] Workflow Planning — folded into this state entry (single unit, no multi-package sequencing needed)
- [x] Application Design / Units Generation — SKIPPED. Extends the existing U1 unit boundary, no new service

**Live-schema finding that reshaped the question set**: `material_process`
already exists (migrations 0010/0011) and already forks processing off both
`material` and `grade`, with `subject_type = 'material_process'` owning property
values. It overlaps the proposed grade-class rung, so Q1 asks how the two relate
rather than assuming a new rung is needed.

**Folds in**: `db/DATA-GAPS.md` N1 (five tables carry an uncitable
`value_status`, closed) and N3 (seven two-grade value strings, resolution
path landed).

### CONSTRUCTION — U1 v2 schema, tooling, and first citation-backed dataset

- [x] Functional Design — folded into `database-revision-requirements.md`'s Architectural Decisions section (no separate schema-design.md v2 document; the migrations themselves carry the design commentary, matching the existing 0001-0014 style)
- [x] Code Generation — 9 migrations, `db/migrations/0015`–`0023`:
  - 0015/0016: `grade_class` rung + `subject_type` extension (FR-1)
  - 0017: `value_role` (observation/editorial), `editorial_value_id`, `derivation_rule`, narrowed `uq_property_value_live_editorial` (FR-2, FR-3, FR-10)
  - 0018: `variance_class` on `property_definition`, classified for all 64 seeded properties (FR-4)
  - 0019: `contributor` + `contribution`, owner seeded as contributor #1 (FR-6, FR-7)
  - 0020: evidence made polymorphic (`subject_type`/`subject_id`), 7 cascade-cleanup triggers, `v_citation_coverage` updated (FR-5, closes N1)
  - 0021 + 0023: publish-threshold trigger per `variance_class`, with a `derivation_rule IN (single_source, manual_override)` bypass added after the trigger blocked the pre-existing single-citation curation workflow — see 0023's header for why (FR-9)
  - 0022: `v_property_editorial_proposal` / `v_property_value_disagreement` views (FR-3, FR-8)
  - `tools/curation/import_values.py`, its test suite (3 files), and `api/src/routes/materials.ts`/`api.test.ts` updated for the new evidence shape and editorial scoping (FR-11)
- [x] Build and Test — all three suites green: schema (`db/test.sh`, new GRADE CLASS / OBSERVATION-EDITORIAL / VARIANCE CLASS / EVIDENCE POLYMORPHISM / PUBLISH THRESHOLD sections), curation (111 pytest), API (18 vitest via `tsx --test`)
- [x] Data injection (FR-12) — `tools/curation/scripts/import_pe_cited_data.py`, a one-off script (not the CSV pipeline, which doesn't yet model grade_class/observations) shaping `curation/cited data-by author-p1-PE.md` into the database: **69 property_value rows** (62 editorial, 7 observations linked under 5 pre-existing uncited editorial rows via `editorial_value_id` — LDPE/HDPE density and unit_cell already existed unsourced from the original 2026-07-31 seed, and this import cited them for the first time rather than overwriting them), **14 `grade_class` rows** across ldpe/hdpe/lldpe (film, injection, blow_molding, thermoforming, rotational_molding + gas-phase/solution variants), **9 citations** (Handbook of Industrial Polyethylene and Technology p577; Encyclopedia of Polymer Science and Technology vol2 pp392/397/448/477/518, vol tables 3/9/10/11), all attributed to contributor #1 (the owner) with role `author`. 8 source facts deliberately not imported — logged in `curation/new_properties.md` (missing property_definition: brittleness temp, ESCR, comonomer %, tensile impact, heat resistance temp, specific heat, heat of combustion, temp coefficient of expansion) and one genuine unit mismatch (izod_impact canonical J/m vs source's kJ/m², not force-converted)

### OPERATIONS

- [ ] Operations (placeholder — not started, out of scope)

## Success Criteria Status

Columns 1-7 and 9 describe U1 v1's original scope (LDPE/HDPE only, 2026-08-01)
and are kept as the historical record of that milestone. The "Current" column
reflects the live local database as queried directly on 2026-08-12, after G0
(PP/PVC/PET/PS migrated) and the v2 schema revision landed -- query the
database yourself for anything beyond this date, these numbers will have
moved again.

**Re-queried 2026-08-14** (the 2026-08-12 column below is now itself stale, and
is kept as that day's record rather than edited): 29 migrations applied ·
**17 materials**, all `status='draft'` · 14 grade classes (LDPE/HDPE/LLDPE
only) · **307 property values** (203 material, 104 grade_class) · 85 property
definitions · **1,290 citations** · 1,392 evidence rows (1,180 solvent, 212
property_value) · 29 sources · 1,180 solvents. Per-material values:
`hdpe 55 · ldpe 54 · pmma 29 · pvc 25 · pp 23 · pet 14 · lldpe 3`, and **zero
for the other ten**.

| #   | Criterion                                                                               | Status at U1 v1 (2026-08-01)                                                            | Current (queried 2026-08-12)                                                                             |
| --- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Migrations apply cleanly to an empty database                                           | **PASS** — Postgres 16.14, 24 tables + 3 views, 9 migrations                           | **PASS** — 23 migrations applied, local Docker Postgres 16.14                                            |
| 2   | Registry contains every property from `src/types/polymer.ts`, grouped as the UI expects | **PASS** — 55 definitions across 6 groups                                              | **PASS** — 73 definitions across 6 groups (grown by curation, beyond the original transcription)         |
| 3   | Adding a new property requires only an INSERT                                           | **PASS** — proven by test inserting a hydrogel swelling ratio with zero DDL            | Unchanged — still true, same test                                                                        |
| 4   | LDPE and HDPE seeded with numeric, unit-normalised values                               | **PASS** — 54 + 55 property values                                                     | **PASS, scope grew** — 7 materials (LDPE, HDPE, LLDPE, PP, PVC, PET, PS), 216 property values total       |
| 5   | ETL output agrees with the legacy shadow numeric fields                                 | **PASS** — 45/46 agree; the 1 disagreement is a genuine source-data defect (see below) | Unchanged — same finding, not re-run against materials added after U1 v1                                 |
| 6   | A citation cannot be inserted without a locator                                         | **PASS** — `{}`, `null`, `{"foo":"bar"}` all rejected                                  | Unchanged — still true                                                                                    |
| 7   | Unsourced values are queryable as a work list                                           | **PASS** — `v_unsourced_values`, 109 rows                                              | **PASS** — `v_unsourced_values`, 106 rows (12 citations / 114 evidence rows now exist against the rest)   |
| 8   | Parser tests including property-based tests pass                                        | In progress                                                                             | **PASS** — 27/27, `tools/etl/tests/` (`test_value_parser_properties.py` included)                         |
| 9   | Setup reproducible from a documented command sequence                                   | **PASS** — `db/README.md`, `db/run.sh`, `db/test.sh`                                   | Unchanged — still true                                                                                    |

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

## Citation Status update — U1 v2, 2026-08-05

The above is no longer the whole picture. `import_pe_cited_data.py` gave 5 of
the original 109 unsourced values (LDPE/HDPE density and unit_cell) their
first real citations — not by editing the original row, but by inserting a
new `observation` row linked to it via `editorial_value_id`, so the original
uncited number is still visible and now sits alongside a cited one, per U1 v2
FR-2/FR-3. 62 more property values were added directly with citations and
immediately `published` (single-source, `derivation_rule='single_source'`).
The publish-threshold trigger (FR-9) means anything added from here on for a
`grade_dependent`/`process_dependent` property needs either 2 independent
observations + a named driver, or an explicit `single_source`/
`manual_override` assertion — the "citation without a locator" discipline
FR-5.4 proved now has a second layer: a citation without *enough of them*
(for its property's `variance_class`) cannot silently become `published`
either.
