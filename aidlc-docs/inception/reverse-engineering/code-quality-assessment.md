# Code Quality Assessment

## Test Coverage

- **Overall**: **None.**
- **Unit Tests**: Not configured. No test runner (`vitest`, `jest`, etc.) appears in `package.json`, and no `*.test.ts(x)` / `*.spec.ts(x)` file exists anywhere in the repository (verified by filesystem search excluding `node_modules`).
- **Integration Tests**: Not configured. Nothing to integration-test in the traditional sense either, since there is no backend — but there is also no test coverage of the client-side derived-value math in the simulators (e.g. `BranchingSimulator`'s crystallinity/density formulas, `LCACircularEconomy`'s CO2 blend calculation, `StressStrainChart`'s regex-based numeric extraction from `SourcedValue` strings), which are exactly the kind of pure-function logic that's cheap to unit test and currently has zero coverage.
- **CI enforcement**: `.github/workflows/ci.yml` runs `typecheck`, `lint`, `format:check`, and `build` on every push to `main` and every pull request — a real and useful quality gate — but it has no test step, so CI cannot catch a logic regression in any simulator or in the data file, only type errors, lint violations, formatting drift, and build failures.

## Code Quality Indicators

- **Linting**: Configured (ESLint 9, flat config, `typescript-eslint` recommended + React Hooks + React Refresh plugins) and enforced in CI. `eslint-config-prettier` correctly defers style to Prettier rather than double-enforcing.
- **Code Style**: Mostly consistent — Prettier is configured and enforced in CI (`format:check`), so formatting drift should not occur on `main`. However, indentation is inconsistent between files at the raw-whitespace level: most `src/components/*.tsx` files and `src/App.tsx`/`src/data/*` use a single-space indent style (an unusual but internally consistent convention across most of the codebase), while a handful of files (`SourcedValue.tsx`, parts of `MarketShareChart.tsx`) use standard 2-space indentation — Prettier's `printWidth: 100` is respected in both cases, but the visual inconsistency suggests different authorship passes (consistent with heavy AI-assisted generation across many small edits, evidenced by the large number of `fix_*.cjs`/`generate_*.js` one-off scripts visible as deleted files in the current git status).
- **Documentation**: Fair. Inline comments are sparse but present at meaningful points (e.g. the `SourcedValue.tsx` doc comment explicitly flagging itself as the future citation-UI seam; comments in `vite.config.ts` explaining the `DISABLE_HMR` behavior). There is no top-level architecture doc, no CONTRIBUTING guide, and the committed `README.md` is a generic AI-Studio boilerplate ("Run and deploy your AI Studio app") that does not describe the actual product, its data model, or its constraints — this reverse-engineering artifact set is, as of this writing, the first real internal documentation of the codebase.

## Technical Debt

1. **Citation system is a type-level fiction.** `SourcedValue.sourceId: string` exists on every one of the ~269 sourced fields across the 6 records, and every single occurrence is the same literal placeholder `'src_default'` (`grep -c "sourceId" src/data/polymersData.ts` = 269; `grep -c "src_default"` = 269 — 100% coverage by the placeholder, zero real source IDs). No component reads `.sourceId` at all — `grep -rn "sourceId" src/ --include=*.tsx` matches only a doc comment in `src/components/SourcedValue.tsx`, not executable code. `ResourcesModal.tsx` (124 lines) is a completely separate, hand-written, static bibliography with no join key back to individual values — a user reading "Density: 0.910-0.925 g/cm³" has no way to click through to which of the 4 listed handbooks that number came from. This is the single largest gap between what the type system promises and what the running application delivers, and it is the explicit stated reason (per `aidlc-docs/audit.md`) the project's owner wants a real backend.

2. **Property values are display strings, not structured data.** Nearly every `SourcedValue.value` is a pre-formatted string rather than a number, making the entire dataset unsortable/unfilterable/unqueryable by value. Verified examples from `src/data/polymersData.ts` (LDPE record): `physical.density.value = '0.910 - 0.925'`, `physical.refractiveIndex.value = '~ 1.51'`, `physical.waterAbsorption.value = '< 0.01'`, `electrical.volumeResistivity.value = '10¹⁶ - 10¹⁸'` (Unicode superscript digits baked into the string, not a real exponent). One field is outright malformed: `thermal.cte = { value: '150 - 200 µm/', unit: '°C' }` — the unit descriptor was split mid-string, leaving a dangling `/` in `value` and an incomplete unit (`°C` alone, missing the `µm/` length component) in `unit`.

3. **Shadow numeric fields duplicate sourced values with no consistency guarantee.** `thermal.tgValue`, `thermal.tmValue`, `thermal.degradationValue`, `physical.minDensity`/`maxDensity`, `academic.minCrystallinity`/`maxCrystallinity`, `academic.mnDefaultValue` all exist purely so sliders (`StateSimulator.tsx`, `DPCalculator.tsx`) have real numbers to compute with. Nothing in the type system, a linter rule, or a test enforces that e.g. `thermal.tgValue: -110` stays in sync with `thermal.tg.value: -110` — a future edit to one and not the other would silently desynchronize the display value from the simulator's actual computed behavior.

4. **Presentation data embedded in the model.** `ChemicalResistanceItem.colorClass` stores literal Tailwind utility class strings (`'text-status-success'`, `'text-status-warning'`, `'text-status-error'`) directly in `polymersData.ts`, coupling the data file to a specific CSS framework and theme rather than deriving color from the `rating` value via a pure function.

5. **`family` is a free-text string, not a taxonomy.** `PolymerData.family` has no enum, no separate `Family` entity, and no controlled vocabulary — it is grouped and searched purely as opaque strings in `CatalogPage.tsx` (`Record<string, PolymerData[]>` keyed by the literal string) and `PolymerCombobox.tsx`. A typo in a new record's `family` value would silently create a new, unintended accordion group rather than erroring.

6. **`CompareModal.tsx` hardcodes exactly 2 polymers and 9 comparison rows in JSX** (`src/components/CompareModal.tsx` lines 80-124: nameEn, resinCode, density, Tg, Tm, tensileStrength, youngModulus, crystallinityRange, processTemp) rather than being data-driven from a configurable field list or supporting an arbitrary N-way comparison.

7. **`App.tsx` is a 991-line god component.** It owns hash routing, tab state, theme state, sidebar/FAB/modal layout, and hand-written JSX for essentially every property card across all 3 detail-page tabs, rather than being decomposed into `IndustrialTab`/`EngineeringTab`/`AcademicTab` components or a declarative "field list -> card" renderer. Adding a single new tracked property currently requires touching the type (`polymer.ts`), the data (all 6 records in `polymersData.ts`), and the markup (`App.tsx`) by hand, with no single point of change.

8. **Dead code / unreachable branches for a 7th material that doesn't exist.** `AlloyingSimulator.tsx`, `ProcessingWindowSimulator.tsx` (7 separate `polymer.id === 'abs'` conditionals), and `LCACircularEconomy.tsx`'s `baseCo2Map` all contain logic gated on `polymer.id === 'abs'` (ABS plastic), but no `'abs'` record exists in `polymersData` (only `ldpe`, `hdpe`, `pp`, `pvc`, `pet`, `ps`). This code is unreachable today.

9. **`src/components/ScrollToTop.tsx` (48 lines) is entirely orphaned** — defined, exported, but never imported by any other file. `App.tsx` independently reimplements the identical scroll-to-top-FAB behavior inline (lines ~967-988) instead of using it.

10. **Only 6 materials exist** (`ldpe`, `hdpe`, `pp`, `pvc`, `pet`, `ps`) against a stated product vision (per `aidlc-docs/audit.md`) of covering "all different fields" of polymers — the current dataset is a small proof-of-concept slice, not yet representative of the target catalog breadth.

11. **No tests and no CI test gate**, covered in detail under Test Coverage above — listed again here because it is itself a standing technical-debt item, not just an absence.

12. **Minor build-config redundancy/vestige**: `vite` is declared in both `dependencies` and `devDependencies` at the same version; `autoprefixer` is a devDependency with no discoverable PostCSS config wiring it in (Tailwind v4's `@tailwindcss/vite` plugin handles its own CSS pipeline), suggesting it is left over from a pre-Tailwind-v4 setup; the KaTeX CDN CSS link in `index.html` has no corresponding KaTeX JS engine loaded anywhere, making that entire CDN integration currently inert.

13. **`MolecularAcademicInfo.persistenceLength`** is defined in the type and populated with real values in every record, but is not rendered by any component (`grep` for `persistenceLength` outside `polymer.ts`/`polymersData.ts` finds no consumer) — a populated-but-unused data field, the inverse problem of the shadow-numeric-field issue above.

## Patterns and Anti-patterns

- **Good Patterns**:
  - Lazy-loading + manual chunk-splitting for the three heaviest dependencies (`chart.js`, `three`) via `React.lazy`/`Suspense` paired with `vite.config.ts`'s `manualChunks`, keeping the initial bundle smaller.
  - Consolidation of 5 duplicated `formatVal` helpers into the single shared `SourcedValue.tsx` component, explicitly documented as the intended future citation-UI seam — a concrete, in-progress refactor toward reducing the technical debt in item 1 above.
  - Consistent RTL/Farsi-first CSS handling (`dir="ltr"` spot-overrides on numeric/`en-mono` spans nested inside an otherwise RTL document) applied uniformly across all detail-page property cards.
  - CI gate (`typecheck` + `lint` + `format:check` + `build`) that would catch most mechanical regressions (type errors, lint violations, format drift, build breaks) before merge, even without tests.
  - Component-per-simulator decomposition (each interactive teaching tool — branching, tacticity, alloying, DP calculator, LCA, processing window, Hansen chart, molecular viewer — is its own self-contained file with a narrow, typed prop surface), which limits blast radius when modifying one simulator.

- **Anti-patterns** (locations, expanded above under Technical Debt items 1-13):
  - Type-level citation system with 100% placeholder data and zero consuming UI (`src/types/polymer.ts` `sourceId`, `src/data/polymersData.ts`).
  - Values-as-display-strings instead of structured numeric data (`src/data/polymersData.ts`, throughout).
  - Shadow numeric fields duplicating sourced-string values with no sync enforcement (`src/types/polymer.ts` `ThermalProperties`/`PhysicalProperties`/`MolecularAcademicInfo`).
  - Presentation (Tailwind class names) stored in the data model (`ChemicalResistanceItem.colorClass`).
  - Free-text taxonomy for `family` (`src/types/polymer.ts`, `src/data/polymersData.ts`).
  - Hardcoded, non-data-driven 2-way/9-row comparison (`src/components/CompareModal.tsx`).
  - God component (`src/App.tsx`, 991 lines).
  - Dead conditional branches for a non-existent 7th polymer (`src/components/AlloyingSimulator.tsx`, `src/components/ProcessingWindowSimulator.tsx`, `src/components/LCACircularEconomy.tsx`).
  - Fully orphaned component file (`src/components/ScrollToTop.tsx`).
  - Populated-but-never-rendered data field (`MolecularAcademicInfo.persistenceLength`).
