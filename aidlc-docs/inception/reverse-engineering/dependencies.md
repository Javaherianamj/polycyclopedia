# Dependencies

## Internal Dependencies

This repository is a single package, so "internal dependencies" here means module-to-module import relationships within `src/`, not package-to-package dependencies. Two views:

**View 1 — App to feature components to types:**

```
+-----------------------------------------------------------------+
|                           src/App.tsx                           |
|       (hash router + layout + all detail-page tab markup)       |
+-----------------------------------------------------------------+
                                 |
                                 | imports (props-drilled to children)
                                 v
+-----------------------------------------------------------------+
|                src/components/*.tsx  (21 files)                 |
|       CatalogPage, CompareModal, Navbar, ResourcesModal,        |
|         simulators, calculators, charts, 3D viewer, ...         |
+-----------------------------------------------------------------+
                                 |
                                 | import types from
                                 v
+-----------------------------------------------------------------+
|                      src/types/polymer.ts                       |
|     PolymerData + 10 nested interfaces (compile-time only)      |
+-----------------------------------------------------------------+
```

**View 2 — App to the static dataset to types:**

```
+-----------------------------------------------------------------+
|                           src/App.tsx                           |
+-----------------------------------------------------------------+
                                 |
                                 | imports (static, build-time)
                                 v
+-----------------------------------------------------------------+
|                    src/data/polymersData.ts                     |
|      6 PolymerData records (LDPE, HDPE, PP, PVC, PET, PS)       |
+-----------------------------------------------------------------+
                                 |
                                 | typed by
                                 v
+-----------------------------------------------------------------+
|                      src/types/polymer.ts                       |
+-----------------------------------------------------------------+
```

Both diagrams are 67 characters wide per box, consistent per the ASCII diagram standard. All 21 files in `src/components/` additionally import `src/types/polymer.ts` (or a named sub-type from it) directly for their own prop typing, not only transitively through `App.tsx`.

### `src/App.tsx` depends on `src/components/*.tsx` (21 files)
- **Type**: Compile-time (ES module import) / Runtime (JSX composition).
- **Reason**: `App.tsx` is the sole composition root; every feature component is either imported eagerly or via `React.lazy()` (for `MarketShareChart`, `StressStrainChart`, `MolecularViewer3D`) and rendered directly in the tab markup.

### `src/App.tsx` and `src/components/*.tsx` depend on `src/types/polymer.ts`
- **Type**: Compile-time only (type import, erased at build).
- **Reason**: Every component that receives polymer data types its props against `PolymerData` or one of its nested interfaces.

### `src/App.tsx` and `src/data/polymersData.ts` depend on `src/types/polymer.ts`
- **Type**: Compile-time only.
- **Reason**: `polymersData: PolymerData[]` is annotated against the interface, giving compile-time structural checking of the 6 hand-authored records (but no runtime validation).

### `src/components/*.tsx` depend on `src/components/SourcedValue.tsx` and `src/components/InfoTooltip.tsx`
- **Type**: Compile-time + runtime (component composition).
- **Reason**: Shared formatting (`SourcedValue`) and shared tooltip (`InfoTooltip`) utilities reused across many feature components rather than reimplemented per-file — see `code-structure.md` Design Patterns.

### `src/components/ScrollToTop.tsx` — no inbound dependents
- **Type**: N/A.
- **Reason**: Defined but never imported by any other file in the repository; `App.tsx` reimplements equivalent scroll-to-top behavior inline instead (lines ~967-988). Confirmed via `grep -rn "ScrollToTop" src/ --include=*.tsx`, which matches only the file's own definition.

## External Dependencies

Versions below are exactly as pinned in `package.json` (all use `^` semver-minor ranges except where noted); license column reflects each package's well-known published license (not independently re-verified against each package's `LICENSE` file in this pass).

### Runtime (`dependencies` in `package.json`)

| Dependency | Version | Purpose | License |
|---|---|---|---|
| `react` | `^19.0.1` | UI rendering framework | MIT |
| `react-dom` | `^19.0.1` | React DOM renderer | MIT |
| `@tailwindcss/vite` | `^4.1.14` | Tailwind v4 Vite plugin (styling) | MIT |
| `@vitejs/plugin-react` | `^5.0.4` | React support (Fast Refresh, JSX) for Vite | MIT |
| `vite` | `^6.2.3` | Dev server + bundler (also present as a devDependency — see note below) | MIT |
| `chart.js` | `^4.5.1` | 2D charting engine (doughnut + line charts) | MIT |
| `react-chartjs-2` | `^5.3.1` | React bindings for Chart.js | MIT |
| `three` | `^0.185.1` | 3D rendering engine (molecular viewer) | MIT |
| `@types/three` | `^0.185.1` | TypeScript types for `three` | MIT |
| `motion` | `^12.23.24` | Scroll-linked animation (`HeroChainAnimation.tsx`) | MIT |
| `lucide-react` | `^0.546.0` | Icon set | ISC |

Note: `vite` is listed in both `dependencies` and `devDependencies` in `package.json` at the same version range (`^6.2.3`) — a harmless but redundant duplicate declaration.

### Development (`devDependencies` in `package.json`)

| Dependency | Version | Purpose | License |
|---|---|---|---|
| `typescript` | `~5.8.2` | Type-checking (`tsc --noEmit`) | Apache-2.0 |
| `typescript-eslint` | `^8.19.0` | TypeScript-aware ESLint rules | MIT |
| `eslint` | `^9.17.0` | Linting | MIT |
| `@eslint/js` | `^9.17.0` | ESLint's own recommended JS rule set | MIT |
| `eslint-plugin-react-hooks` | `^5.1.0` | Rules-of-hooks linting | MIT |
| `eslint-plugin-react-refresh` | `^0.4.16` | Fast-Refresh-safety linting | MIT |
| `eslint-config-prettier` | `^9.1.0` | Disables ESLint stylistic rules that conflict with Prettier | MIT |
| `prettier` | `^3.4.2` | Code formatting | MIT |
| `globals` | `^15.14.0` | Global-variable definitions for ESLint's flat config | MIT |
| `autoprefixer` | `^10.4.21` | CSS vendor prefixing (present, but Tailwind v4's `@tailwindcss/vite` plugin handles its own pipeline — no PostCSS config file references it, so it is likely unused/vestigial from a pre-Tailwind-v4 setup) | MIT |
| `@types/node` | `^22.14.0` | Node.js types (used by `vite.config.ts`'s `path`/`__dirname` usage) | MIT |

### CDN Resources (not in `package.json` at all — loaded via `<link>` tags in `index.html`)

| Resource | Version | Purpose | License |
|---|---|---|---|
| Google Fonts: Vazirmatn | latest (unpinned) | Farsi UI typeface | SIL Open Font License 1.1 |
| Google Fonts: JetBrains Mono | latest (unpinned) | Numeric/code typeface | SIL Open Font License 1.1 |
| KaTeX CSS | `0.16.8` (pinned in URL) | Math-typesetting stylesheet — CSS only, JS engine never loaded, currently unused (see `technology-stack.md`) | MIT |
