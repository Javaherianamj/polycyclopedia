# Polypedia web — the app shell (FE-1)

This is the shipping frontend. The `src/`, `index.html` and `vite.config.ts`
at the repo root are the **frozen prototype** (D9) — a content reference, kept
buildable, never edited (R21). Nothing here touches those.

FE-1's scope, per `aidlc-docs/inception/plans/frontend-plan.md` §5: Astro
project, `/fa/` and `/en/` routing, i18n, design tokens from FE-0, an API
client, and the four states (R4) as shared styling. **No product screens** —
the pages under `src/pages/` right now are placeholders that prove the wiring,
not the homepage or a material page.

## Run it

Requires `polypedia-pg` running (see `../db/README.md`) and the API running
(see `../api/README.md`).

```bash
cp .env.example .env   # edit PUBLIC_API_BASE_URL if the API isn't on :3001
npm install
npm run dev             # astro dev, port 4321
```

Other scripts: `npm run build`, `npm run check` (typecheck), `npm test`
(vitest), `npm run format` / `format:check`.

This package has its own `.prettierrc.json` (with `prettier-plugin-astro`) and
is excluded from the root's `prettier --check .` — the root config has no
`.astro` parser. Format this package with its own script, not the root one.
There is no eslint config here yet; `astro check` plus the test suite are the
bar for this unit. A later unit can add it if the gap is felt.

## Publication gating (`PUBLIC_PUBLISHED_ONLY`)

`material.status` has existed since migration 0003, but the site used to render
every material identically regardless of it. Two things now read it
(`src/lib/publish.ts`):

- **A draft badge** on any datasheet whose material is not `published`. Always
  on — it just says out loud what the database already records.
- **A build-time gate**, `PUBLIC_PUBLISHED_ONLY=true`, which drops
  non-published materials from static paths, the catalog, the homepage and the
  sitemap.

The gate is **off by default and should stay off until at least one material is
promoted to `published`** — all 17 are `draft` today, so turning it on builds a
site with zero material pages. Verified in both positions: default builds 82
pages, `PUBLIC_PUBLISHED_ONLY=true` builds 0 material pages.

```bash
PUBLIC_PUBLISHED_ONLY=true npm run build
```

## Design tokens are frozen, not re-derived

`src/styles/tokens/{colour,type,motion}.css` are byte-for-byte copies of
`design/fe-0/tokens/*.css`. Per that directory's own README, FE-1 consumes
them; it does not re-derive them. If a value needs to change, change it in
FE-0's source and re-copy — don't hand-edit the copy.

One thing FE-0 never extracted into a token file: font-family bindings
(`--font-body`, `--font-display`, …) and the radius scale (`--r-sm` … `--r-pill`).
Those lived in `design/fe-0/themes/e-press.css` as theme-specific glue, not in
`tokens/`. `src/styles/global.css` defines them here instead, using the house
style's (E "Press", D35) values.

**A real bug was found and fixed during this port**: `design/fe-0/tokens/colour.css`
had an unterminated CSS comment (a stray `/*` on the `--ok` line with no
matching `*/`) that silently deleted the light-datasheet `--act` and `--ok-soft`
declarations — everything between the open comment and the next `*/` a few
lines later. Fixed in both the FE-0 source and this copy (adding the missing
`*/`, not touching the comment's actual content). Worth knowing if anyone
wonders why a "frozen, unmodified" file has one line different from FE-0's
original commit.

## Fonts are self-hosted, not the FE-0 prototypes' CDN links

FE-0's demo pages load Estedad from jsdelivr and Newsreader from Google Fonts.
This app downloads the same files (same version, same subsets, same weights
the type-scale derivation in `tokens/type.css` measured against) and serves
them from `public/fonts/`. Matters for the Iran-hosted deployment target (D56)
where a foreign font CDN is a reliability risk, and it removes an external
dependency this app doesn't otherwise need. Licence: SIL OFL for both — the
licence texts sit alongside the font files.

## The API client (`src/lib/api/`)

Hand-written against the real route handlers in `../api/src/routes/`, not an
assumption — there is no OpenAPI spec to generate from. Every function returns
`{ ok: true, data }` or `{ ok: false, error }` rather than throwing, so callers
can tell "empty" apart from "error", which is what the four states need.

## The four states, and why there isn't one shared component

R4: every screen defines loading, error, empty/partial and full. This shell
provides the first three as **styling**, not as one shared component file —
because they have to exist in two runtimes that cannot share files:

- **Build time** (`.astro` pages, Node, `astro build`): `Loading.astro`,
  `ErrorState.astro`, `EmptyState.astro` in `src/components/states/`. A
  build-time page resolves directly to Empty, Full or Error — there is no
  "loading" moment, because nothing is happening asynchronously from a
  reader's perspective. This is D26 §4's cost made concrete: static pages are
  built, not fetched, so by the time a reader sees the page, the fetch already
  happened, at build time. `ErrorState.astro`'s retry button is present for
  markup/CSS consistency but `disabled` — there is nothing a click could do in
  static HTML with no server behind it. A build-time fetch failure fails the
  build instead (see `src/pages/fa/index.astro`'s frontmatter): that's a
  deliberate choice, not a missing try/catch — publishing N static error pages
  that then sit stale until the next rebuild is worse than a loud CI failure.
- **Client time** (React islands, `client:load`, hydrated in the browser):
  `src/components/states/DataBoundary.tsx`. This is the only one of the four
  with a working retry, because it's the only one running somewhere a retry
  means anything.

What actually makes them "shared" is `src/styles/global.css`'s
`.state-loading` / `.state-error` / `.state-empty` classes — both the `.astro`
templates and `DataBoundary.tsx` render the same classnames, so a build-time
Empty and a client-time Empty are pixel-identical despite coming from two
different template languages. `src/islands/HealthCheck.tsx` is a working,
minimal example of the client-time path — not a product feature, just proof
the plumbing holds together.

## i18n

`src/i18n/fa.json` is authored first (R15); `en.json` is verified against it,
and a test (`src/i18n/t.test.ts`) checks the key sets match exactly. `t()`
throws on a missing key at build time — R14's "no inline strings" rule with an
actual backstop instead of just a review convention.
