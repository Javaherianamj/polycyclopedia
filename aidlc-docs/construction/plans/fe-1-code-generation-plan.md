# FE-1 `app-shell` — code generation plan

**Unit**: FE-1, per `inception/plans/frontend-plan.md` §5 unit map
**Scope** (verbatim from the plan): "Astro project, `/fa/` and `/en/` routing,
i18n from the first string, design tokens from FE-0, API/data client, and the
four states (R4) as shared components. No product screens."
**Depends on**: FE-0 (closed, `design/fe-0/tokens/`), the API unit (`api/`,
already built and documented in `api/README.md`)
**Blocks**: FE-2 … FE-9, all of which build product screens on top of this shell
**Stages skipped for this unit** (unchanged from FE-0's precedent): Functional
Design — no data model owned by this unit; NFR Requirements/Design — tech
stack and performance budgets already decided in `frontend-plan.md` §4/§6;
Infrastructure Design — hosting is U11, explicitly undecided by design (R23)

---

## 0. Where this lives

New sibling directory **`web/`**, following the pattern `api/` already
established (own `package.json`, so its dependencies never mix with the
prototype's). The repo root (`package.json` name `react-example`, `src/`,
`index.html`, `vite.config.ts`) is the **frozen prototype** (D9) and R21
forbids touching it. Nothing in this plan modifies any file under those paths.

---

## 1. Project structure setup

- [x] `web/package.json` — Astro, `@astrojs/react`, `react`, `react-dom`,
      TypeScript. React is installed and configured now (the islands model is
      D26's committed architecture) but **no React component is written** —
      FE-8 owns the first island.
- [x] `web/astro.config.mjs` — `output: 'static'` (R23); i18n:
      `locales: ['fa', 'en']`, `defaultLocale: 'fa'`,
      `routing: { prefixDefaultLocale: true }` so both trees are prefixed per
      D28 (`/fa/…` and `/en/…`, no unprefixed default); `redirects: { '/': '/fa/' }`
      so the bare root resolves instead of 404ing.
- [x] `web/tsconfig.json` — extends `astro/tsconfigs/strict`.
- [x] `web/.env.example` — `PUBLIC_API_BASE_URL` (defaults to
      `http://localhost:3001`, the API's dev port per `api/.env.example`).
- [x] Root `.gitignore` — add `.astro/` (Astro's cache directory; `node_modules/`
      and `dist/` already match at any depth).
- [x] `api/.env.example` — add `http://localhost:4321` (Astro's default dev
      port) to `CORS_ORIGINS` alongside the existing entries, so the dev API
      accepts requests from this app without a manual edit.

## 2. Design tokens (frozen import, not re-derivation)

- [x] Copy `design/fe-0/tokens/colour.css`, `type.css`, `motion.css` into
      `web/src/styles/tokens/` **verbatim** — per `tokens/README.md`, FE-1
      consumes these, it does not re-derive them. Import order preserved:
      colour → type → motion.
- [x] `web/src/styles/global.css` — imports the three token files, then the
      RTL-default reset (`box-sizing`, `overflow-x: hidden` on `html`) that
      every FE-0 surface carries, generalized here so every future page
      inherits it instead of re-declaring it.
- [x] Fonts: Estedad Variable + Newsreader via the same Google Fonts `@import`
      FE-0's prototypes use (`themes/e-press.css`). **Recorded as a known gap,
      not fixed here**: self-hosting would be better for a domestically-hosted
      (D56, ArvanCloud) Persian-primary site, but pulling font binaries requires
      a file download, which needs separate explicit approval. Flagged for
      FE-9 hardening or a standalone follow-up.

## 3. i18n layer (R14, R15, D13, D28)

- [x] `web/src/i18n/config.ts` — locale list, default locale, direction map
      (`fa: 'rtl'`, `en: 'ltr'`).
- [x] `web/src/i18n/fa.json` — shell strings only (site name, the four states'
      copy, nav placeholders). **Authored first**, per R15.
- [x] `web/src/i18n/en.json` — same keys, translated second, verified against
      the Persian rather than the reverse.
- [x] `web/src/i18n/t.ts` — typed lookup (`t(locale, key)`); a missing key
      throws at build time rather than rendering silently, so R14 (no inline
      strings) has a build-time backstop, not just a code-review convention.

## 4. Routing shell (D28, R13, R6)

- [x] `web/src/layouts/BaseLayout.astro` — sets `<html lang>` and `dir` from
      the locale (`rtl` for `fa`, `ltr` for `en` — this is a **per-locale**
      page-level direction, not the LTR-as-exception R6 forbids, which is about
      Latin spans inside Persian content), imports `global.css`, ports FE-0's
      `theme.js` `initTheme`/`toggleTheme` pattern (`data-theme` on the root,
      `no-transition` guard) so dark mode has no flash and no stuck transition.
- [x] `web/src/pages/fa/index.astro`, `web/src/pages/en/index.astro` —
      placeholder shell pages. They exist to prove routing + i18n + tokens are
      wired end-to-end; they are explicitly **not** the homepage (FE-4 owns
      that) and carry a visible "app shell, FE-1" marker so nobody mistakes
      them for a real screen later.
- [x] `web/src/pages/index.astro` — redirect target for the root-redirect
      configured in step 1.

## 5. API client (R2, R3, R7, R9)

Modeled directly against `api/README.md` and the four route files
(`materials.ts`, `properties.ts`, `coverage.ts`, `health.ts`) — not against any
assumption about the shape.

- [x] `web/src/lib/api/types.ts` — hand-written TS types matching the API's
      actual response shapes: `MaterialListItem`, `MaterialDetail`,
      `PropertyGroup`, `PropertyDefinition`, `PropertyValue`, `Citation`,
      `CoverageRow`, `Coverage`, `ApiErrorBody`. The frontend never re-derives
      a display string (R3) — `display` on a property value comes from the API
      as-is.
- [x] `web/src/lib/api/client.ts` — isomorphic `fetch` wrapper (runs at Astro
      build time in Node and, later, from browser islands), one function per
      endpoint: `getMaterials(params)`, `getMaterial(slug)`, `getProperties()`,
      `getCoverage()`, `getHealth()`. Every function returns a discriminated
      result — `{ ok: true, data }` or `{ ok: false, error }` — rather than
      throwing, so callers can distinguish "empty" from "error" cleanly, which
      is what R4's four states need.
- [x] No property list, section order, or display formatting is hardcoded here
      (R2/R3) — the client is a typed passthrough, nothing more.

## 6. Four states as shared components (R4)

- [x] `web/src/components/states/Loading.astro` — respects
      `prefers-reduced-motion` (reads the motion tokens from step 2),
      `aria-live="polite"`.
- [x] `web/src/components/states/ErrorState.astro` — a real fetch failure,
      distinct in tone from R22's "uncited, not an error" — retry affordance,
      no stack trace or raw error text (matches the API's own
      no-detail-leakage posture).
- [x] `web/src/components/states/EmptyState.astro` — slot-based so FE-3/FE-4/etc
      supply their own copy; this component owns only the layout.
- [x] `web/src/components/states/DataBoundary.tsx` — a small React helper for
      **client-side** islands: wraps a fetch result and renders
      Loading/Error/Empty/`children(data)`. Documented distinction in
      `web/README.md`: build-time Astro pages resolve directly to Empty/Full/
      Error (there is no Loading at build time — this is D26's static-generation
      trade-off, stated plainly in §4's "one real cost"); Loading only exists for
      client-side fetches inside islands.

## 7. Tests

- [x] `web/vitest.config.ts`.
- [x] `web/src/lib/api/client.test.ts` — mocked `fetch`; one test per endpoint
      function covering the success path, the 404/error path, and the
      empty-list path.
- [x] `web/src/i18n/t.test.ts` — both locales resolve every key; a missing key
      throws.
- [x] Build-level check (step 9, not a unit test): `astro build` must produce
      `dist/fa/index.html` and `dist/en/index.html`.

## 8. Documentation

- [x] `web/README.md` — dev setup, pointing `PUBLIC_API_BASE_URL` at the local
      `api/`, directory layout, the "tokens are frozen, imported not
      re-derived" note, the build-vs-fetch caveat from §4, which four-state
      component applies when.
- [x] Root `README.md` — add a `web/` row to the Repository layout table;
      correct the existing `src/` row, which currently reads as if it is the
      shipping frontend, to state it is the frozen prototype (R21), reference
      only.

## 9. CI and dev preview

- [x] `.github/workflows/ci.yml` — add a `web` job: `npm ci`, `astro check`,
      `npm test` (vitest), `npm run build`, all scoped to `web/`. Kept as its
      own job so it does not block or get blocked by the existing
      prototype/root job.
- [x] `.claude/launch.json` — new entry `fe1-web`, `npm run dev --prefix web`
      (or equivalent), port 4321 (Astro's default), so the app can be opened in
      the browser pane the same way `fe0-design` already is.

## 10. Verification

- [x] `npm install` in `web/`.
- [x] `astro check` — typecheck clean.
- [x] `astro build` — confirm both locale trees exist in `dist/`.
- [x] `npm test` — green.
- [x] Dev server up, both `/fa/` and `/en/` loaded in the browser pane: correct
      `dir`, tokens visibly applied, theme toggle works without flash.
- [x] No horizontal overflow at 320/375/768 (R27), both themes — same
      measurement method as the FE-0 gate (`construction/fe-0/build-and-test.md`
      §1), since the root clips overflow rather than showing a scrollbar.

## 11. Tracker updates

- [x] `aidlc-state.md` — new `CONSTRUCTION — FE-1 app-shell` section.
- [x] `inception/plans/frontend-plan.md` — mark FE-1 status.
- [x] `audit.md` — plan-approval prompt/response, then a completion entry.

---

## What this plan deliberately does not include

No product screens, no value-atom component (FE-2), no popovers (the FE-0 gate
record's Popover-API recommendation belongs to whichever unit builds the first
popover, i.e. FE-2 — not this one), no search index (FE-5), no grade selector
(FE-3/R16), no React island content (FE-8 writes the first one against this
shell's integration). Font self-hosting is flagged, not executed, pending a
separate download approval.
