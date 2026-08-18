# FE-1 build and test — the gate record

**Run**: 2026-08-05 (Sonnet, generation + verification)
**Scope**: the app shell only — Astro project, `/fa/`/`/en/` routing, tokens
from FE-0, API client, four states. No product screens.
**Verdict**: **PASS**.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `astro check` (typecheck, 18 files) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 11/11 passing — API client (8: success/404/network-error/empty paths) + i18n (3: key resolution, missing-key throw, fa/en key parity) |
| `astro build` | succeeds; `dist/fa/index.html` and `dist/en/index.html` both present, plus the auto-generated `/` → `/fa/` redirect |
| `npm run format:check` (own `.prettierrc.json`, `prettier-plugin-astro`) | clean |
| No horizontal overflow at 320/375/768 (R27) | 0 of 12 measurements (2 locales × 3 widths × 2 themes) exceed 1px — same iframe-measurement method as the FE-0 gate, since the root's `overflow-x: hidden` hides overflow rather than showing a scrollbar |
| Console errors, both locales, both themes | none |
| Theme toggle | dark/light switch correctly on both locales, no flash (verified the inline no-FOUC script and the `no-transition` guard both work) |
| Build-time API call (`/fa/`, `/en/` frontmatter `await getHealth()`) | resolves to Full state — `ok · connected · 9` |
| Client-time API call (`HealthCheck` island, `client:load`) | resolves to Full state independently, proving the React-island half of the four states works in a real browser, not just at build time |

Both routes were loaded in a real browser (not just built and left unopened):
screenshots confirm RTL Persian on `/fa/` (warm cream light / ember dark),
LTR English on `/en/`, correct font rendering for both Estedad and Newsreader,
and all three static state samples (Loading/Error/Empty) rendering distinctly
and correctly.

## 2. A real defect found and fixed, not part of this unit's stated scope

`design/fe-0/tokens/colour.css` — the file FE-0's README calls frozen and
"the single source of truth" — has an unterminated CSS comment on the `--ok`
line. `/* provenance satisfied — ... → #536E56.` never closes, so the CSS
parser swallows everything up to the *next* `*/`, three lines later. That
silently deleted two declarations from the light-datasheet scope:
`--ok-soft` and, more consequentially, `--act` — "something you can do," the
colour behind every affordance, retry button and contribute link. It's not
missing from the dark, lab-light or lab-dark scopes, only the default one,
which is the one everyone sees first.

This passed FE-0's own contrast audit and 120-measurement build-and-test gate
because neither checks for a token silently failing to exist — they check
computed contrast and computed overflow, and a browser resolving an undefined
custom property just falls back to `initial` or inherits, which doesn't throw
and doesn't overflow. It surfaced here because FE-1's `ErrorState.astro`
actually uses `--act` for its retry button's text colour, and confirming it
rendered correctly in a live screenshot is what caught it.

Fixed with a one-character insertion (the missing `*/`) in both
`design/fe-0/tokens/colour.css` (the frozen source) and
`web/src/styles/tokens/colour.css` (FE-1's copy) — not a value change, a
syntax fix. Both files remain byte-identical to each other. Verified via a
Python comment-stripping pass that all four `--act` declarations and both
`--ok-soft` declarations now parse correctly.

## 3. Two gaps FE-0 left that FE-1 had to fill in itself

Neither is a defect in FE-0 — `tokens/README.md` only ever promised colour,
type and motion — but both are real gaps a consumer hits immediately:

- **Font-family bindings** (`--font-body`, `--font-display`, …) lived in
  `design/fe-0/themes/e-press.css`, theme-specific glue, never extracted into
  a token file. FE-1 defines them in `web/src/styles/global.css` using the
  house style's (E "Press", D35) values.
- **The radius scale** (`--r-sm` … `--r-pill`) — same situation, same file,
  same fix. Lab's `--r-lg` differs slightly (18px vs 16px) and lab has no
  `--r-pill` of its own; FE-1 ships the datasheet's values as the default and
  leaves a surface-specific override to whichever later unit needs it.

## 4. A defect found in this unit's own generation, before it shipped

The first `astro build` attempt crashed with a native-module `Bus error`
(SIGBUS) inside `lightningcss`'s Rust binary, Vite 7's default CSS
transformer. `strace` traced it to `lightningcss.linux-x64-gnu.node`; `file`
showed "missing section headers" — a truncated binary. The first `npm
install` had failed partway through with `ECONNRESET`; the retry apparently
treated the already-present (but truncated) optional-dependency file as
satisfied rather than re-verifying it. Removing that one package's files and
reinstalling fixed it — the binary is now the full 10MB with valid section
headers, and `require('lightningcss')` loads cleanly. Not an environment or
sandbox limitation, despite looking exactly like one for the hour it took to
rule that out.

## 5. Deliberate scope exclusions, restated

No product screens, no value atom, no popovers, no search, no grade selector,
no React island content beyond the proof-of-wiring `HealthCheck`. Font
self-hosting *was* executed (per owner approval mid-plan) rather than
deferred as originally planned — see `web/README.md` for the source and
licence details.

## 6. Carried into later units

- FE-2 (the value atom) is the first unit that needs a *real* popover — build
  it on the Popover API with CSS anchor positioning, per FE-0's own gate
  record, not by hand-managing containing blocks the way the FE-0 prototypes
  had to.
- Any unit touching `design/fe-0/tokens/*.css` should know the colour file
  had a real syntax bug until this gate — worth a second look at the other
  two token files for the same class of mistake if anyone edits them.
- `web/` has no eslint config yet (prettier + `astro check` + vitest are the
  bar). Add one if a later unit feels the gap; not a blocker now.
