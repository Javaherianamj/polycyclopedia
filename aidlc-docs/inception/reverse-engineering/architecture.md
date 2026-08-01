# System Architecture

## System Overview

Polypedia is a 100% client-side, statically-built single-page application (SPA). There is no backend, no API server, no database, and no authentication of any kind. The entire "system" is a Vite production build (static HTML/CSS/JS assets) that can be served from any static host or CDN. All content is bundled at build time from a single TypeScript source file (`src/data/polymersData.ts`); there is no runtime data fetching from any first-party service. Two third-party CDN resources are loaded at page-load time for fonts and math typesetting CSS (see Integration Points), but neither is queried for polymer data.

Per the project's own audit trail (`aidlc-docs/audit.md`), this SPA is understood by the project owner as a **UI prototype** for a much larger planned system (real backend, real database, per-value citations, multi-tenant B2B product). This reverse-engineering pass documents the codebase **as it exists today** — a static-data React application — which is the accurate baseline for that future work.

## Architecture Diagram

```
+-----------------------------------------------------------------+
|                 index.html (single entry point)                 |
|  Google Fonts CDN (Vazirmatn, JetBrains Mono) + KaTeX CDN CSS   |
+-----------------------------------------------------------------+
                                 |
                                 | mounts
                                 v
+-----------------------------------------------------------------+
|                          src/main.tsx                           |
|           React 19 StrictMode root -> renders <App />           |
+-----------------------------------------------------------------+
                                 |
                                 | renders
                                 v
+-----------------------------------------------------------------+
|                    src/App.tsx  (992 lines)                     |
|     Hash router (#id / #catalog), tab state (ind/eng/aca),      |
|        theme state, layout shell, sidebar, modals, FABs         |
+-----------------------------------------------------------------+
                                 |
                                 | composes 21 components from src/components/*.tsx
                                 v
+-----------------------------------------------------------------+
|                       Feature Components                        |
|     CatalogPage, CompareModal, simulators (State/Branching/     |
|   Tacticity/Alloying/ProcessingWindow), charts (MarketShare/    |
|    StressStrain/Hansen3D), MolecularViewer3D, DPCalculator,     |
|  DynamicQuiz, LCACircularEconomy, ResourcesModal, Navbar, ...   |
+-----------------------------------------------------------------+
                                 |
                                 | reads (direct ES module import, no fetch/HTTP)
                                 v
+-----------------------------------------------------------------+
|             src/data/polymersData.ts  (1278 lines)              |
|         const polymersData: PolymerData[]  -- 6 records         |
|                  typed by src/types/polymer.ts                  |
+-----------------------------------------------------------------+
```

All boxes above are a fixed 67-character width; arrows/labels between boxes are plain ASCII connectors (`|`, `v`) with descriptive labels, per the project's ASCII diagram standard.

## Component Descriptions

### `index.html` + `src/main.tsx` (Entry / Bootstrap)
- **Purpose**: Single HTML entry point and React root bootstrap.
- **Responsibilities**: Load Google Fonts (Vazirmatn, JetBrains Mono) and KaTeX CSS from CDN links, set `dir="rtl"` / `lang="fa"` on `<html>`, mount `<App />` into `#root` under `React.StrictMode`.
- **Dependencies**: React 19, ReactDOM 19.
- **Type**: Application (entry module).

### `src/App.tsx` (App Shell / Router) — 991 lines
- **Purpose**: The entire application shell: hash-based routing, tab state, theme state, layout (sidebar/main-column split, mobile bottom sheet, floating action buttons), and composition of every feature component.
- **Responsibilities**: Hash routing (`getPolymerFromHash`, `hashchange` listener), active-tab state machine (`ind` | `eng` | `aca`), dark/light theme toggle (writes `data-theme` attribute consumed by `src/index.css`), scroll-position-driven FAB visibility, rendering ~all of the per-tab datasheet UI directly inline (not extracted into sub-view components), and wiring the Compare/Resources modals.
- **Dependencies**: `polymersData`, `PolymerData` type, and 19 of the 21 files in `src/components/`.
- **Type**: Application (root view/controller).

### `src/components/*.tsx` — Feature Components (21 files)
- **Purpose**: Self-contained UI features — catalog browsing, comparison, per-polymer interactive simulators/calculators, charts, and a 3D viewer. See `component-inventory.md` for the full per-file breakdown.
- **Responsibilities**: Each component owns its own local `useState`-based interaction logic; several perform their own derived-value math client-side (e.g. `AlloyingSimulator`, `LCACircularEconomy`, `ProcessingWindowSimulator`) rather than reading pre-computed values from the data file.
- **Dependencies**: `PolymerData`/sub-types from `src/types/polymer.ts`; `chart.js` + `react-chartjs-2` (2 chart components); `three` (1 component); `motion` (1 component); `lucide-react` (icons, all components).
- **Type**: Application (presentation/feature layer).

### `src/data/polymersData.ts` (Static Data Layer) — 1278 lines
- **Purpose**: The entire "database" — a single exported constant `polymersData: PolymerData[]` containing 6 fully-populated polymer records (`ldpe`, `hdpe`, `pp`, `pvc`, `pet`, `ps`).
- **Responsibilities**: Source of truth for every value rendered anywhere in the app. Imported directly (ES module `import`), not fetched — it becomes part of the JS bundle.
- **Dependencies**: `PolymerData` type only.
- **Type**: Model/Data (static, compile-time).

### `src/types/polymer.ts` (Data Model) — 144 lines
- **Purpose**: Defines the `PolymerData` interface and its 10 nested sub-interfaces (`SourcedValue`, `ProcessingInfo`, `ThermalProperties`, `MechanicalProperties`, `PhysicalProperties`, `ChemicalResistanceItem`, `ElectricalProperties`, `MolecularAcademicInfo`, `QuizQuestion`, `Atom3D`) plus the `MarketShareItem` interface.
- **Responsibilities**: Compile-time contract for the data file and every component that consumes `PolymerData`. Not validated at runtime (no schema/zod/io-ts — TypeScript types are erased at build time).
- **Dependencies**: None (leaf module).
- **Type**: Model.

## Data Flow

The closest analogue to a "sequence diagram" for this app is the client-side navigation flow below (there is no client-server sequence to diagram, since there is no server):

```
+-----------------------------------------------------------------+
|            1. User opens app (or a #hash deep link)             |
+-----------------------------------------------------------------+
                                 |
                                 | App.tsx: getPolymerFromHash() reads window.location.hash
                                 v
+-----------------------------------------------------------------+
|              2. Hash empty/#catalog -> CatalogPage              |
|           Hash = valid polymer id -> Polymer Detail View        |
+-----------------------------------------------------------------+
                                 |
                                 | CatalogPage: onSelectPolymer(id)
                                 v
+-----------------------------------------------------------------+
| 3. App.tsx: setSelectedPolymerId(id); window.location.hash = id |
|        activePolymer = polymersData.find(p => p.id === id)      |
+-----------------------------------------------------------------+
                                 |
                                 | re-render with activeTab = 'ind' (default)
                                 v
+-----------------------------------------------------------------+
|    4. Detail View: 3 tabs over the SAME activePolymer object    |
|       ind (Industrial) | eng (Engineering) | aca (Academic)     |
|       Each tab renders a different slice of PolymerData plus    |
|        its dedicated simulator/calculator/chart components      |
+-----------------------------------------------------------------+
```

Every simulator/calculator/chart component receives its needed slice of `activePolymer` as a prop and computes any derived values (chart series, simulator physics, blend math) synchronously in the render function or in local component state — there is no shared state store (no Redux/Zustand/Context for domain data), no memoization layer, and no caching, because there is nothing asynchronous to cache.

## Integration Points

- **External APIs**: None. The application makes zero runtime HTTP calls to any first-party or third-party API for data.
- **Databases**: None. `src/data/polymersData.ts` is a static, hand-authored TypeScript array compiled into the JS bundle.
- **Third-party Services** (all load-time CDN assets, referenced in `index.html`, not npm packages):
  - **Google Fonts CDN** (`fonts.googleapis.com`, `fonts.gstatic.com`) — serves the Vazirmatn (Farsi UI font) and JetBrains Mono (numeric/code font) webfonts.
  - **KaTeX CDN** (`cdn.jsdelivr.net/npm/katex@0.16.8`) — loads only the KaTeX **CSS** stylesheet. Notably, the KaTeX **JavaScript** rendering library is not loaded anywhere (no `<script>` tag for it, and no `katex` npm package in `package.json`), and no component calls a KaTeX render function — so the `.katex` CSS class rules defined in `src/index.css` (lines 158-162) currently have no KaTeX-rendered DOM to style. This is dead/unused integration surface.

## Infrastructure Components

- **CDK Stacks**: None — there is no cloud infrastructure-as-code in this repository.
- **Deployment Model**: Static site deployment. `npm run build` (or `bun run build`, per CI) invokes `vite build`, producing a `dist/` folder of static assets suitable for any static host (e.g. Netlify, Vercel, S3+CloudFront, GitHub Pages). `vite.config.ts` manually chunks `chart.js`/`react-chartjs-2` and `three` into separate bundles (`manualChunks`) to keep the initial load smaller, since `MarketShareChart`, `StressStrainChart`, and `MolecularViewer3D` are also lazy-loaded via `React.lazy()` in `App.tsx`.
- **Networking**: N/A — no VPC, subnets, or security groups; this is a pure static-asset deployment with no compute or network infrastructure to manage.
- **CI**: `.github/workflows/ci.yml` runs on push to `main` and on pull requests: installs dependencies with `bun` (`bun install --frozen-lockfile`), then runs `bun run typecheck`, `bun run lint`, `bun run format:check`, and `bun run build` in sequence. There is no test step (no test framework is configured) and no deployment/publish step — the workflow only validates the build, it does not ship it anywhere.
