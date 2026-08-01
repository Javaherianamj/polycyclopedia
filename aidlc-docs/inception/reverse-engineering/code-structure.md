# Code Structure

## Build System

- **Type**: npm-compatible package, built with **Vite 6** (`vite.config.ts`), driven via **npm** scripts in `package.json`. CI (`.github/workflows/ci.yml`) installs and runs everything through **bun** instead (`bun install --frozen-lockfile`, `bun run <script>`) against the same `package.json` scripts and the committed `bun.lock` — so the project is bun-primary in CI but npm-compatible for local development (`README.md` still documents `npm install` / `npm run dev`).
- **Configuration**:
  - `package.json` — scripts: `dev` (`vite --port=3000 --host=0.0.0.0`), `build` (`vite build`), `preview`, `clean` (`rm -rf dist`), `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), `format` / `format:check` (`prettier`).
  - `vite.config.ts` — registers the `@vitejs/plugin-react` and `@tailwindcss/vite` (Tailwind v4's native Vite plugin, no separate `tailwind.config.js`/PostCSS config needed) plugins; defines a `@` path alias to the repo root; manually splits `chart.js`+`react-chartjs-2` and `three` into their own build chunks; conditionally disables Vite's file watcher/HMR when the `DISABLE_HMR` env var is set (a comment notes this is for an AI Studio agent-editing environment).
  - `tsconfig.json` — single tsconfig (no project references/build-info split), `target: ES2022`, `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit: true` (Vite/esbuild does the actual transpilation; `tsc` is type-checking only, run via the separate `typecheck` script).
  - `eslint.config.js` — flat-config ESLint 9 with `typescript-eslint` recommended rules, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, and `eslint-config-prettier` (disables stylistic rules that would conflict with Prettier). Ignores `dist`, `tools/legacy`, `graphify-out`.
  - `.prettierrc.json` — `singleQuote: true`, `semi: true`, `printWidth: 100`, `trailingComma: all`.
  - `index.html` — the single HTML entry point (see `architecture.md`).

## Key Classes/Modules

There are no classes in this codebase — it is 100% functional React components and plain data/type modules. The module hierarchy (by import direction, root to leaf) is:

```
index.html
  -> src/main.tsx                         (React root bootstrap)
    -> src/App.tsx                        (991 lines: router + layout + ~all tab UI)
      -> src/data/polymersData.ts         (1278 lines: the 6-record dataset)
        -> src/types/polymer.ts           (144 lines: PolymerData + 10 nested interfaces)
      -> src/components/Navbar.tsx
      -> src/components/CatalogPage.tsx
      -> src/components/CompareModal.tsx
      -> src/components/ResourcesModal.tsx
      -> src/components/HeroChainAnimation.tsx
      -> src/components/ResinBadge.tsx
      -> src/components/SourcedValue.tsx        (shared formatting seam, see below)
      -> src/components/PolymerCombobox.tsx
      -> src/components/InfoTooltip.tsx          (leaf, used by 6+ other components)
      -> src/components/StateSimulator.tsx
      -> src/components/BranchingSimulator.tsx   (rendered only when polymer.id === 'ldpe')
      -> src/components/TacticitySimulator.tsx   (rendered only when polymer.id === 'ps')
      -> src/components/ProcessingWindowSimulator.tsx
      -> src/components/AlloyingSimulator.tsx    (renders null unless id is 'pp' or 'abs')
      -> src/components/LCACircularEconomy.tsx
      -> src/components/DPCalculator.tsx
      -> src/components/DynamicQuiz.tsx
      -> src/components/Hansen3DChart.tsx
      -> [React.lazy] src/components/MarketShareChart.tsx    (chart.js)
      -> [React.lazy] src/components/StressStrainChart.tsx   (chart.js)
      -> [React.lazy] src/components/MolecularViewer3D.tsx   (three.js, 622 lines)
    -> src/index.css                      (Tailwind v4 entry + CSS custom properties theme)

  src/components/ScrollToTop.tsx          <- ORPHANED: defined, never imported (see below)
```

### Existing Files Inventory

- `index.html` - single HTML entry point; RTL/Farsi `<html>` attrs, Google Fonts + KaTeX CSS CDN links, mounts `#root`.
- `src/main.tsx` - React 19 `createRoot` bootstrap under `StrictMode`.
- `src/index.css` - Tailwind v4 `@import`, `@theme` token mapping, light/dark CSS custom properties (`:root` and `[data-theme="light"]`), custom range-slider styling, KaTeX display overrides.
- `src/App.tsx` - app shell: hash router, tab state (`ind`/`eng`/`aca`), theme toggle, sidebar/FAB/modal orchestration, and nearly all per-tab datasheet markup inline.
- `src/types/polymer.ts` - the entire data model (`PolymerData` and 10 nested interfaces); see `api-documentation.md` for the full field-by-field breakdown.
- `src/data/polymersData.ts` - the static dataset: 6 fully-populated `PolymerData` records (`ldpe`, `hdpe`, `pp`, `pvc`, `pet`, `ps`).
- `src/components/App.tsx` — n/a (App.tsx lives at `src/App.tsx`, listed above).
- `src/components/AlloyingSimulator.tsx` - interactive blend-ratio slider modeling PP/EPDM or ABS-family alloys; empirical property formulas hardcoded per blend type; renders `null` for any polymer id other than `'pp'` or `'abs'` (the latter does not exist in `polymersData`, so this branch is currently dead for all real data).
- `src/components/BranchingSimulator.tsx` - LDPE-only chain-branching level slider; derives crystallinity/density/yield-strength/melting-temp via hardcoded linear formulas as branching level changes.
- `src/components/CatalogPage.tsx` - catalog landing view: search box (client-side substring scan over 6 fields), family-grouped accordions, per-card Tg/Tm/Density preview via `SourcedValue`.
- `src/components/CompareModal.tsx` - two-polymer comparison modal; two `<select>` dropdowns plus a hardcoded 9-row JSX comparison table (not data-driven from a configurable field list).
- `src/components/DPCalculator.tsx` - degree-of-polymerization calculator (DPn, DPw, PDI) taking Mn/PDI numeric inputs and the polymer's monomer molar mass.
- `src/components/DynamicQuiz.tsx` - single-question-at-a-time multiple-choice quiz runner driven by `PolymerData.quiz[]`.
- `src/components/Hansen3DChart.tsx` - hand-rolled (no 3D library) mouse-draggable 3D scatter plot of a polymer's Hansen solubility parameters (D/P/H).
- `src/components/HeroChainAnimation.tsx` - scroll-linked SVG polymer-chain backbone animation (via `motion/react`'s `useScroll`/`useTransform`), shape varies by `chainType`.
- `src/components/InfoTooltip.tsx` - small reusable hover/click info-icon tooltip; used throughout the datasheet UI for field explanations.
- `src/components/LCACircularEconomy.tsx` - recycled-content (PCR%) slider computing a blended CO2e/kg figure from a hardcoded `baseCo2Map` (includes an `abs` entry that is unreachable for any polymer in the current dataset).
- `src/components/MarketShareChart.tsx` - Chart.js doughnut chart of a polymer's `marketShare[]`, theme-aware colors, lazy-loaded.
- `src/components/MolecularViewer3D.tsx` (622 lines, the largest component) - hand-built Three.js ball-and-stick 3D molecule viewer with its own internal per-polymer atom geometry generator (`getBaseAtoms`), play/pause auto-rotate, monomer/repeating-unit view toggle; lazy-loaded.
- `src/components/Navbar.tsx` - fixed top bar: logo/brand (click -> catalog), Resources and Compare buttons, dark/light theme switcher.
- `src/components/PolymerCombobox.tsx` - searchable, family-grouped `<select>`-like combobox used in the detail-page sidebar for quick polymer switching.
- `src/components/ProcessingWindowSimulator.tsx` (292 lines) - checks user-set melt temp / mold temp / pressure sliders against a hardcoded table of ISO/ASTM standard processing windows per polymer (includes `'abs'` branches unreachable in current data).
- `src/components/ResinBadge.tsx` - renders the SPI/ASTM D7611 resin-identification-code triangle badge (1-7) from `resinCode`.
- `src/components/ResourcesModal.tsx` - static, hand-written bibliography modal (handbooks, ISO/ASTM standards, petrochemical companies); no data binding to individual `sourceId` values anywhere.
- `src/components/ScrollToTop.tsx` - **orphaned**: a complete scroll-to-top FAB component with its own scroll listener; not imported by `App.tsx` or any other file (`App.tsx` reimplements the same behavior inline instead, lines ~967-988). Dead code.
- `src/components/SourcedValue.tsx` - the shared `{ value, unit, note }` -> formatted-JSX renderer (`inline`/`block` variants) recently extracted to replace 5 duplicated `formatVal` helpers; documented in its own comment as "the single place Phase 1's citation marker/popover will plug into."
- `src/components/StateSimulator.tsx` - temperature slider showing which physical state (glassy/rubbery/molten/degraded) a polymer is in, bounds derived from `thermal.tgValue`/`tmValue`/`degradationValue`.
- `src/components/StressStrainChart.tsx` - Chart.js line chart approximating a stress-strain curve; parses numeric bounds out of the `mechanical.*` `SourcedValue` strings via regex/`parseFloat`.
- `src/components/TacticitySimulator.tsx` (291 lines) - PS-only isotactic/syndiotactic/atactic visual sequence toggler over 8 monomer-unit rings.

## Design Patterns

### Static-Import Data Access (no repository/service layer)

- **Location**: `src/App.tsx` and every component that needs polymer data (`import { polymersData } from '../data/polymersData'` or receives it as a prop from `App.tsx`).
- **Purpose**: Simplicity for a fully static site — no data-fetching, loading states, or error states are needed anywhere in the app.
- **Implementation**: `polymersData` is a plain exported `const` array; lookups are linear `Array.find`/`Array.filter` calls (e.g. `polymersData.find((p) => p.id === selectedPolymerId)` in `App.tsx`). This is the seam that will need to become a real data-access layer if/when the planned backend (per `aidlc-docs/audit.md`) is introduced.

### Manual Hash-Based Routing

- **Location**: `src/App.tsx`, `getPolymerFromHash()` / `hashchange` listener / `window.location.hash` writes.
- **Purpose**: URL-addressable deep links (`#ldpe`, `#catalog`) without pulling in a router library.
- **Implementation**: No route table, no nested routes, no route params beyond a single polymer id segment; "catalog" is simply `selectedPolymerId === null`.

### Lazy-Loaded Heavy Components

- **Location**: `src/App.tsx` lines 9-12, wrapping `MarketShareChart`, `StressStrainChart`, and `MolecularViewer3D` in `React.lazy()` + `React.Suspense` with skeleton-pulse fallbacks.
- **Purpose**: Defer loading the `chart.js`/`three` bundle chunks (see `vite.config.ts` `manualChunks`) until the relevant tab is actually rendered.
- **Implementation**: Standard React.lazy/Suspense; matched by the manual Vite chunk split so these libraries don't inflate the initial bundle.

### Shared Sourced-Value Formatter (the citation seam)

- **Location**: `src/components/SourcedValue.tsx`, consumed by `App.tsx`, `CatalogPage.tsx`, `CompareModal.tsx`, `StateSimulator.tsx`, `DPCalculator.tsx` — each still declares its own trivial local `const formatVal = (v) => <SourcedValue value={v} .../>` wrapper rather than importing `SourcedValue` and calling it directly, but the actual formatting logic itself is now centralized in one file instead of being copy-pasted five times.
- **Purpose**: Explicitly called out in the component's own doc comment as the future plug-in point for a citation marker/popover once `sourceId` values become real (currently 100% `'src_default'`, see `code-quality-assessment.md`).
- **Implementation**: Renders `{value} {unit}` plus an optional RTL `note` line, in `inline` (span-based) or `block` (div-based) layout variants.

### Anti-pattern: Values-as-Display-Strings

- **Location**: Almost every leaf field in `src/data/polymersData.ts` (via the `SourcedValue.value: number | string` union).
- **Why it's a problem**: Most numeric properties are stored as already-formatted display strings rather than structured numbers, making the data unusable for sorting, filtering, or range queries. Verified examples: `physical.density.value = '0.910 - 0.925'`, `physical.refractiveIndex.value = '~ 1.51'`, `physical.waterAbsorption.value = '< 0.01'`, `electrical.volumeResistivity.value = '10¹⁶ - 10¹⁸'` (Unicode superscript digits embedded in the string), and a genuinely malformed split where the unit leaked into the value: `thermal.cte = { value: '150 - 200 µm/', unit: '°C' }` (LDPE record, `src/data/polymersData.ts` line 75).
- **Existing workaround**: A parallel set of "shadow" plain-`number` fields exists specifically so sliders/simulators have real numbers to compute with: `thermal.tgValue`, `thermal.tmValue`, `thermal.degradationValue`, `physical.minDensity`/`maxDensity`, `academic.minCrystallinity`/`maxCrystallinity`, `academic.mnDefaultValue`. These are manually kept in sync with their sourced-string siblings by whoever edits the data file — nothing enforces agreement, so they can silently drift (e.g. nothing would catch `tgValue: -110` diverging from a future edit to `tg.value`).

### Anti-pattern: Presentation Leaking into Data

- **Location**: `PolymerData.chemicalResistance[].colorClass` (`src/types/polymer.ts` line 61), populated with literal Tailwind utility class names like `'text-status-success'` / `'text-status-warning'` / `'text-status-error'` directly in `src/data/polymersData.ts`, then interpolated straight into `className` in `App.tsx` (line 656).
- **Why it's a problem**: Couples the "database" to a specific CSS framework and a specific theme's class names; a rating-to-color mapping that should be a pure function of the rating value is instead baked into every one of the ~40+ chemical-resistance rows across the 6 records.

### Anti-pattern: God Component

- **Location**: `src/App.tsx` (991 lines).
- **Why it's a problem**: Combines routing, layout, theming, modal/FAB orchestration, and the entire markup for all 3 detail-page tabs (Industrial/Engineering/Academic) in one file/one function component, rather than extracting `IndustrialTab`, `EngineeringTab`, `AcademicTab` (etc.) as separate components. Every property card in the Engineering and Academic tabs is hand-written JSX rather than generated from a declarative field list, so adding one new property requires touching `App.tsx`, `src/types/polymer.ts`, and all 6 records in `polymersData.ts`.

### Anti-pattern: Data-Model Feature Ahead of Implementation

- **Location**: `SourcedValue.sourceId: string` (`src/types/polymer.ts` line 9), populated 269/269 times with the literal placeholder `'src_default'` in `src/data/polymersData.ts` (verified via `grep -c "sourceId" src/data/polymersData.ts` = 269 and `grep -c "src_default"` = 269 — every single occurrence). No component anywhere reads `.sourceId` (`grep -rn "sourceId" src/ --include=*.tsx` only matches a doc comment in `SourcedValue.tsx`, not executable code). `ResourcesModal.tsx` is a completely separate, hand-written bibliography with no join key back to individual data values. Net effect: the type system advertises per-value citation support that does not exist yet anywhere in the running application.

### Anti-pattern: Dead Code for a Non-Existent Material

- **Location**: `src/components/AlloyingSimulator.tsx` (`isABS = polymer.id === 'abs'`), `src/components/ProcessingWindowSimulator.tsx` (7 occurrences of `polymer.id === 'abs'` branches for melt/mold temp ranges and drying requirements), `src/components/LCACircularEconomy.tsx` (`baseCo2Map` includes an `abs` key).
- **Why it's a problem**: All three components contain conditional logic for a 7th polymer, `'abs'` (ABS plastic), that does not exist anywhere in `polymersData` (only `ldpe`, `hdpe`, `pp`, `pvc`, `pet`, `ps` are defined). This code is unreachable today; it is either leftover from a planned-but-not-yet-added material or was scaffolded ahead of the data.

## Critical Dependencies

### react / react-dom

- **Version**: `^19.0.1`
- **Usage**: Every component in `src/`.
- **Purpose**: UI rendering framework.

### vite / @vitejs/plugin-react

- **Version**: `^6.2.3` / `^5.0.4`
- **Usage**: Dev server, production bundler, JSX/TS transform.
- **Purpose**: Build tooling.

### typescript

- **Version**: `~5.8.2`
- **Usage**: Type-checking via `tsc --noEmit` (the `typecheck` script); Vite/esbuild does the actual transpile, so TS itself never emits JS.
- **Purpose**: Static typing of the data model and component props.

### tailwindcss / @tailwindcss/vite

- **Version**: `^4.1.14`
- **Usage**: All component styling, via utility classes plus the `@theme`/CSS-custom-property token layer in `src/index.css`.
- **Purpose**: Styling framework; Tailwind v4's Vite plugin removes the need for a separate PostCSS/`tailwind.config.js` pipeline.

### chart.js / react-chartjs-2

- **Version**: `^4.5.1` / `^5.3.1`
- **Usage**: `MarketShareChart.tsx` (doughnut) and `StressStrainChart.tsx` (line), both lazy-loaded and manually chunked.
- **Purpose**: 2D charting.

### three / @types/three

- **Version**: `^0.185.1`
- **Usage**: `MolecularViewer3D.tsx` only (622 lines), lazy-loaded and manually chunked.
- **Purpose**: 3D ball-and-stick molecular rendering, built directly against the Three.js scene-graph API (no React-three-fiber wrapper).

### motion

- **Version**: `^12.23.24`
- **Usage**: `HeroChainAnimation.tsx` only (`motion/react`'s `useScroll`/`useTransform`).
- **Purpose**: Scroll-linked SVG animation for the per-polymer hero banner.

### lucide-react

- **Version**: `^0.546.0`
- **Usage**: Icons throughout nearly every component and `App.tsx`.
- **Purpose**: Icon set.

### KaTeX (CDN CSS only — not an npm dependency)

- **Version**: `0.16.8` (pinned in the `index.html` CDN URL)
- **Usage**: `.katex` CSS class overrides exist in `src/index.css`, but the KaTeX **JS** library is never loaded and no component calls it — see `architecture.md` Integration Points. Effectively unused/dead integration.
- **Purpose**: (Intended) math-formula typesetting; not currently exercised.
