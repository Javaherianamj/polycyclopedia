# Component Inventory

This repository is a **single npm/bun package** (`package.json` name: `react-example`, no `workspaces` field, no monorepo tooling) — there is exactly one deployable unit. The breakdown below lists that one Application package, then inventories its internal modules (there are no separate Infrastructure, Shared, or Test packages in this repository).

## Application Packages

- **Polypedia SPA** (repo root, `package.json` name `react-example`) — Farsi/RTL static single-page polymer encyclopedia. Vite 6 + React 19 + TypeScript. Builds to a static `dist/` bundle with no server component. See `business-overview.md` and `architecture.md` for full description.

## Infrastructure Packages

- None. No CDK/Terraform/CloudFormation, no IaC of any kind, no cloud deployment configuration in this repository.

## Shared Packages

None as separate installable packages, but within the single application package, the following modules are shared across multiple consumers and function as the de facto "shared" layer:

- `src/types/polymer.ts` - Models - the `PolymerData` data model and its 10 nested interfaces; imported by nearly every file in `src/components/` and by `src/App.tsx`.
- `src/data/polymersData.ts` - Static Data - the single dataset (6 records), imported directly by `App.tsx` and passed down as props from there.
- `src/components/SourcedValue.tsx` - Utility/Presentation - shared `{value, unit, note}` -> JSX formatter, replacing 5 previously-duplicated local `formatVal` helpers; consumer list and wrapper-pattern detail in `code-structure.md` "Shared Sourced-Value Formatter".
- `src/components/InfoTooltip.tsx` - Utility/Presentation - reusable hover/click info-icon tooltip, used by `App.tsx` and at least 6 simulator/calculator components.

## Test Packages

- None. No test framework installed (`package.json` has no `vitest`/`jest`/`@testing-library/*`/`playwright`/`cypress`), no `*.test.*`/`*.spec.*` files anywhere, and `.github/workflows/ci.yml` has no test step (runs `typecheck`, `lint`, `format:check`, `build` only) — see `code-quality-assessment.md` Test Coverage for implications.

## Full Module Inventory (single application package, by directory)

### `src/` (root modules)

| File        | Lines | Purpose                                                                                |
| ----------- | ----- | -------------------------------------------------------------------------------------- |
| `App.tsx`   | 991   | App shell: hash router, tab state, theme, layout, nearly all detail-page markup inline |
| `main.tsx`  | 10    | React 19 root bootstrap                                                                |
| `index.css` | 163   | Tailwind v4 entry, theme CSS custom properties, slider/KaTeX overrides                 |

### `src/types/`

| File         | Lines | Purpose                                                  |
| ------------ | ----- | -------------------------------------------------------- |
| `polymer.ts` | 144   | Entire data model (`PolymerData` + 10 nested interfaces) |

### `src/data/`

| File              | Lines | Purpose                                                        |
| ----------------- | ----- | -------------------------------------------------------------- |
| `polymersData.ts` | 1278  | The static "database": 6 fully-populated `PolymerData` records |

### `src/components/` (21 files)

| File                            | Lines | Purpose                                                                            | Scope / gating                                                                      |
| ------------------------------- | ----- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `AlloyingSimulator.tsx`         | 145   | PP/ABS blend-ratio simulator with hardcoded empirical property formulas            | Renders only for `id === 'pp'` (`'abs'` branch is dead — no such polymer in data)   |
| `BranchingSimulator.tsx`        | 191   | LDPE chain-branching level slider affecting derived crystallinity/density/strength | LDPE only                                                                           |
| `CatalogPage.tsx`               | 164   | Catalog landing page: search + family accordions                                   | All 6 polymers                                                                      |
| `CompareModal.tsx`              | 131   | Fixed 2-polymer, 9-row comparison table                                            | All 6 polymers (any 2 at a time)                                                    |
| `DPCalculator.tsx`              | 160   | DPn/DPw/PDI calculator from Mn + PDI inputs                                        | All polymers (academic tab)                                                         |
| `DynamicQuiz.tsx`               | 157   | Per-polymer multiple-choice quiz runner                                            | Driven by each record's `quiz[]`                                                    |
| `Hansen3DChart.tsx`             | 245   | Hand-rolled draggable 3D Hansen solubility scatter plot                            | All polymers (academic tab)                                                         |
| `HeroChainAnimation.tsx`        | 165   | Scroll-linked SVG chain animation, shape varies by `chainType`                     | All polymers                                                                        |
| `InfoTooltip.tsx`               | 35    | Reusable info-icon hover/click tooltip                                             | Shared utility                                                                      |
| `LCACircularEconomy.tsx`        | 138   | PCR% slider -> blended CO2e/kg via hardcoded `baseCo2Map`                          | All polymers (map includes unreachable `abs` key)                                   |
| `MarketShareChart.tsx`          | 78    | Chart.js doughnut of `marketShare[]`                                               | All polymers (industrial tab), lazy-loaded                                          |
| `MolecularViewer3D.tsx`         | 622   | Three.js 3D ball-and-stick molecule viewer, own atom-geometry generator            | All polymers (academic tab), lazy-loaded, largest component in the repo             |
| `Navbar.tsx`                    | 96    | Fixed top bar: brand, Resources/Compare buttons, theme switcher                    | Global                                                                              |
| `PolymerCombobox.tsx`           | 110   | Searchable family-grouped polymer switcher                                         | Detail-page sidebar                                                                 |
| `ProcessingWindowSimulator.tsx` | 292   | Melt/mold/pressure sliders checked against hardcoded ISO/ASTM standard windows     | All polymers (includes unreachable `abs` branches)                                  |
| `ResinBadge.tsx`                | 93    | SPI/ASTM D7611 resin-code triangle badge                                           | Global                                                                              |
| `ResourcesModal.tsx`            | 124   | Static hand-written bibliography (no per-value linkage)                            | Global                                                                              |
| `ScrollToTop.tsx`               | 48    | Scroll-to-top FAB                                                                  | **Orphaned — not imported anywhere; App.tsx reimplements the same behavior inline** |
| `SourcedValue.tsx`              | 51    | Shared `SourcedValue` -> JSX formatter                                             | Shared utility, citation-UI seam                                                    |
| `StateSimulator.tsx`            | 206   | Temperature slider showing physical state vs. Tg/Tm/degradation                    | All polymers (engineering tab)                                                      |
| `StressStrainChart.tsx`         | 242   | Chart.js approximate stress-strain curve, regex-parses `SourcedValue` strings      | All polymers (engineering tab)                                                      |
| `TacticitySimulator.tsx`        | 291   | Isotactic/syndiotactic/atactic ring-sequence visualizer                            | PS only                                                                             |

## Total Count

- **Total Packages**: 1 (single npm/bun package, no monorepo)
- **Application**: 1
- **Infrastructure**: 0
- **Shared**: 0 (as separate packages) / 4 modules act as shared layer within the single package (`polymer.ts`, `polymersData.ts`, `SourcedValue.tsx`, `InfoTooltip.tsx`)
- **Test**: 0

## Additional Module Counts (within the single Application package)

- **Total source files analyzed**: 26 (`App.tsx`, `main.tsx`, `index.css`, `types/polymer.ts`, `data/polymersData.ts`, 21 files in `components/`)
- **React components**: 22 (`App.tsx` + 21 in `src/components/`)
- **Components actively wired into the render tree**: 21 of 22 App-level consumers (`ScrollToTop.tsx` is dead code, not imported by anything)
- **Polymer records in the dataset**: 6 (`ldpe`, `hdpe`, `pp`, `pvc`, `pet`, `ps`)
- **Polymer families represented**: 4 (`Polyolefins` [ldpe, hdpe, pp], `Vinyl Polymers` [pvc], `Polyesters` [pet], `Styrenic Polymers` [ps])
