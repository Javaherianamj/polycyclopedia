# Technology Stack

## Programming Languages

- **TypeScript** - `~5.8.2` - All application source (`.ts`/`.tsx`); `tsconfig.json` targets `ES2022`, `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit: true` (type-checking only; Vite/esbuild does transpilation).
- **CSS** - (Tailwind v4 utility classes + one hand-written stylesheet `src/index.css`) - theming (light/dark CSS custom properties), slider styling, KaTeX overrides.
- **HTML** - single static `index.html` entry point.

## Frameworks

- **React** - `^19.0.1` (`react`, `react-dom`) - UI rendering framework; used with `React.StrictMode`, `React.lazy`/`Suspense` for code-splitting, and plain `useState`/`useEffect`/`useRef` hooks throughout (no external state-management library — no Redux/Zustand/Context API used for domain data).
- **Tailwind CSS** - `^4.1.14` (via `@tailwindcss/vite` plugin, no separate `tailwind.config.js`) - utility-first styling; theme tokens bridged to CSS custom properties via the `@theme` directive in `src/index.css`.
- **Chart.js** + **react-chartjs-2** - `^4.5.1` / `^5.3.1` - 2D charting (doughnut chart in `MarketShareChart.tsx`, line chart in `StressStrainChart.tsx`).
- **Three.js** - `^0.185.1` (with `@types/three` `^0.185.1`) - 3D rendering, used directly (no React-Three-Fiber wrapper) in `MolecularViewer3D.tsx` only.
- **Motion** (`motion` npm package, formerly Framer Motion) - `^12.23.24` - scroll-linked SVG animation in `HeroChainAnimation.tsx` only, via the `motion/react` subpath (`useScroll`, `useTransform`).
- **lucide-react** - `^0.546.0` - icon set, used across nearly every component.

## Infrastructure

- **None.** No cloud provider, no server runtime, no database, no message queue, no cache — this is a pure static-asset application (see `architecture.md`). The nearest thing to "infrastructure" is whatever static host ultimately serves the `dist/` output of `vite build`; no such host is configured in this repository.

## Build Tools

- **Vite** - `^6.2.3` - dev server (`vite --port=3000 --host=0.0.0.0`) and production bundler (`vite build`); config in `vite.config.ts` (React + Tailwind plugins, `@` path alias, manual chunk splitting for `chart.js`/`three`, conditional HMR/watch disabling via `DISABLE_HMR` env var).
- **@vitejs/plugin-react** - `^5.0.4` - React Fast Refresh + JSX transform integration for Vite.
- **@tailwindcss/vite** - `^4.1.14` - native Vite integration for Tailwind v4 (no PostCSS config file needed).
- **bun** (via `oven-sh/setup-bun@v2` in CI; `bun.lock` committed at repo root) - package manager and script runner used in CI (`bun install --frozen-lockfile`, `bun run <script>`); local development is documented (in `README.md`) as npm-based (`npm install` / `npm run dev`), so the project is effectively dual-tooled between bun (CI) and npm (docs/local).
- **ESLint** - `^9.17.0`, flat config (`eslint.config.js`) - `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`, with `eslint-config-prettier` to defer style rules to Prettier.
- **Prettier** - `^3.4.2` - code formatting (`.prettierrc.json`: single quotes, semicolons, 100-char print width, trailing commas everywhere).
- **TypeScript compiler (`tsc`)** - `~5.8.2` - type-checking only (`tsc --noEmit`), run as a separate `typecheck` script, not part of the Vite build itself.

## Testing Tools

- **None configured.** No unit-test framework (no Vitest/Jest), no component-testing library (no React Testing Library), no end-to-end framework (no Playwright/Cypress), and no test files exist anywhere in the repository. See `code-quality-assessment.md` for the full implication of this.

## Third-Party CDN Resources (not npm packages, loaded via `<link>` tags in `index.html`)

- **Google Fonts** - Vazirmatn (Farsi UI typeface, weights 300-900) and JetBrains Mono (numeric/code typeface) via `fonts.googleapis.com` / `fonts.gstatic.com`.
- **KaTeX** - `0.16.8` - **CSS only** (`cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css`); JS engine never loaded, currently dead weight — full detail in `architecture.md` Integration Points.
