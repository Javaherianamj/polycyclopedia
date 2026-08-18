# FE-0 close-out — spec for the final four tasks

**Written**: 2026-08-03 (Opus, planning)
**Implemented by**: parallel Sonnet agents, per `.claude/CLAUDE.md` Model Routing
**Closes**: the four unchecked items in `frontend-plan.md` §10

---

## 0. Decision recorded first: what the Learn surface actually is

The owner's verdict on the four concepts: _"loved the scale one, graph is
extraordinary, map is perfect for later"_, plus fixes to notebook. That is not a
tie — read carefully it assigns each concept a different job:

| #   | Decision                                                                                                                    | Source |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| D50 | **Scale is the Learn surface's organising structure.** You arrive at the zoom; tools sit at the length scale they belong to | owner  |
| D51 | **Graph is a first-class tool inside it**, not the navigation (D45 already closed that question)                            | owner  |
| D52 | **Map is deferred** to a later pass — it is a per-material view and wants more data than two materials give it              | owner  |
| D53 | **Notebook is C3's template**, not C2's. It is the shape educational content arrives in                                     | owner  |

Nothing in this spec depends on D50–D53; they are recorded here because FE-0
cannot close with the question open.

---

## 1. File ownership — read this before touching anything

Three agents run in parallel. **File ownership is exclusive.** If a task seems to
need a file another agent owns, stop and report it rather than editing.

| Agent | Owns (may edit)                                                                      | Creates                                                    |
| ----- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **A** | `design/fe-0/themes/e-press.css`, `design/fe-0/lab/lab.css` — **colour values only** | `aidlc-docs/construction/fe-0/contrast-audit.md`           |
| **B** | nothing existing                                                                     | `design/fe-0/tokens/type.css`, `design/fe-0/type.html`     |
| **C** | nothing existing                                                                     | `design/fe-0/tokens/motion.css`, `design/fe-0/motion.html` |

Nobody edits `base.css`, `render.js`, `data.js`, `theme.js`, the lab concept
files, or any `aidlc-docs` file other than their own deliverable.

The token consolidation (plan item "tokens exported in the form FE-1 will
consume") is **integration work and is not delegated** — Opus does it after all
three land, which is why B and C write to a new `tokens/` directory rather than
into the theme files.

---

# AGENT A — Contrast audit and colour fixes

**Why this is first in importance:** the lab's dark base changed from a
near-black `#101728` to `#3E436F`, which is far lighter. Contrast headroom
shrank across the whole dark palette and the existing foreground tones were
chosen against the old base. This is a real accessibility risk that nobody has
measured yet.

## Standard

WCAG 2.1 AA:

- **4.5:1** — body text and any text below 18.66px bold / 24px regular
- **3:1** — large text (≥24px, or ≥18.66px bold)
- **3:1** — non-text UI: borders that carry meaning, focus rings, the coverage
  bar fill, chart/ramp colours against their own background

## The four palettes to audit

1. Datasheet light — `themes/e-press.css` `:root`
2. Datasheet dark (ember) — `themes/e-press.css` `:root[data-theme='dark']`
3. Lab light — `lab/lab.css` `:root`
4. Lab dark (slate-indigo `#3E436F`) — `lab/lab.css` `:root[data-theme='dark']`

## Pairs that must be checked in each palette

Every foreground token against every background it actually appears on. At
minimum:

- `--ink` on `--bg`, on `--panel`, on `--panel-2`
- `--ink-2` on `--bg`, on `--panel`
- `--muted` on `--bg`, on `--panel`
- `--muted-2` on `--bg`, on `--panel` (this one is most likely to fail)
- `--accent` on `--bg` and on `--panel` (datasheet: this is the value colour, it
  is body-size text, so **4.5:1**)
- `--act` on `--bg`, on `--panel`, on `--act-bg`
- `--ok` on `--bg`, on `--panel`, on `--ok-soft`
- `--line`, `--line-2` against `--bg` and `--panel` (3:1, they are meaningful
  borders — the note frames and row borders now carry information)
- each `--ramp-*` against `--bg` and against `--panel`
- `--on-phase` against each `--ramp-*` (this is text on a coloured chip)
- datasheet only: `--bridge-bg` against its text `#f2efe6`, and
  `--warn` on `--bg`/`--panel`

## What to do about failures

**Fix them by adjusting the token, minimally, preserving hue identity.** Change
lightness first; only change saturation if lightness alone cannot get there. Do
**not** change a hue into a different hue — the semantic colour system (R33) is
load-bearing:

- teal `--accent` = measurement
- sage `--ok` = provenance satisfied
- clay `--act` = something you can do
- grey `--track`/`--muted-2` = provenance absent — **deliberately low-contrast
  as a design decision.** If `--muted-2` fails as body text, that is a real
  failure; if it fails only as a decorative dash, note it and leave it
- ochre `--warn` = reserved for warnings

If a fix would visibly change the palette's character, **do not apply it
silently** — apply the minimum that passes, and flag the tension in your report.

## Deliverable

`aidlc-docs/construction/fe-0/contrast-audit.md`:

- a table per palette: pair, computed ratio, required ratio, pass/fail, and the
  before → after token value if you changed it
- compute ratios properly (relative luminance per WCAG, not eyeballed). Write a
  small throwaway script if that is easiest; do not commit the script
- a short section listing anything you could not fix without breaking R33

---

# AGENT B — The type scale

**Goal:** one type scale, defined once, that both faces honour — and proof that
the Estedad/Newsreader pairing actually works at every step rather than only in
the two sizes currently used.

## The problem being solved

The owner's single biggest complaint about the old prototype was font problems
(round-2 Q34). Persian and Latin have different vertical metrics; Estedad's
x-height and Newsreader's x-height do not match at the same `font-size`, and
they sit on the same line constantly in this product (Persian prose with Latin
numerals and technical terms inside it).

## Deliverable 1 — `design/fe-0/tokens/type.css`

A scale as CSS custom properties. Requirements:

- **A named step scale**, not ad-hoc rem values: `--fs-display`, `--fs-h1`,
  `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-small`, `--fs-caption`, `--fs-micro`.
  Use a consistent ratio; state the ratio in a comment.
- **Fluid where it should be fluid** — `clamp()` on display and h1 only. Body
  text does not scale with viewport.
- **A line-height token per step.** Persian needs more leading than Latin at the
  same size; body should be ~1.9, headings tighter.
- **A Latin-size correction custom property**, e.g. `--latin-size-adj`, applied
  to `.num` / `[dir='ltr']` spans so Newsreader numerals optically match the
  Persian text they sit inside. Determine the value by measuring, not guessing —
  compare rendered x-heights or cap-heights of the two faces at the same size
  and derive the ratio.
- Do not redefine colours, spacing, or anything that is not type.

## Deliverable 2 — `design/fe-0/type.html`

A specimen page proving it. Must include:

- every step of the scale, rendered in **real Persian text from `data.js`**, not
  lorem ipsum (R32 requires this explicitly)
- each step shown with Latin numerals and a Latin technical term embedded
  mid-sentence, which is the actual hard case
- the same specimen in both themes (import `../theme.js`, use its `themeButton`)
- a section showing body text at the real reading measure (~62ch) so leading can
  be judged in context, not on a single line
- `dir="rtl"`, `lang="fa"`, Latin numerals per D18

Link `lab.css` or `themes/e-press.css` for colour so the specimen is not
unstyled — your choice, state it in a comment. Do not edit either file.

---

# AGENT C — The motion spec

**Goal:** define motion once, for the Learn surface (R19: Learn is the animated
surface; the datasheet is restrained), so FE-8 is not improvising per tool.

## Deliverable 1 — `design/fe-0/tokens/motion.css`

- **Duration tokens**: `--dur-instant` (~80ms), `--dur-fast` (~160ms),
  `--dur-base` (~240ms), `--dur-slow` (~400ms), `--dur-deliberate` (~700ms, for
  a teaching animation that must be followed by eye).
- **Easing tokens**: at minimum `--ease-out` (UI entering), `--ease-in-out`
  (state change), `--ease-spring` (a playful one for Learn only), and
  `--ease-linear` for anything encoding a continuous physical value.
- **A stated rule in comments**: the datasheet uses only `--dur-fast` and
  `--ease-out`; Learn may use the full set. This is R19 expressed as tokens.
- **`prefers-reduced-motion` handling** — a block that neutralises durations to
  `0.01ms` rather than `none`, so transition-end events still fire and JS that
  waits on them does not hang. Explain that in a comment.

## Deliverable 2 — `design/fe-0/motion.html`

A page demonstrating each duration and easing on a simple moving element,
side by side so they can be compared, plus:

- one worked example of the "teaching animation" case — something that animates
  slowly enough to be followed, with a caption explaining why it is slower
- a toggle that simulates reduced-motion (add a class, do not require the OS
  setting) so the fallback can be reviewed without changing system preferences
- Persian UI, RTL, both themes via `../theme.js`

## Constraint

No `transition: all` anywhere (R35). Every demo names its properties.

---

## Rules that apply to all three agents

1. Persian, `dir="rtl"`, `lang="fa"`. Latin numerals in `<span dir="ltr">`.
2. Both themes must work on any page you create.
3. No `transition: all` (R35).
4. Zero horizontal overflow at 320/375/768 (R27).
5. Never invent a citation, a source, or a measured value.
6. `prefers-reduced-motion` respected.
7. The dev server is already running on port 3100 serving `design/fe-0` as root.
   **Do not start another server.** Verify with `curl`. **Do not use the browser
   MCP tools** — the pane is unreliable in this environment.
8. Report every bug, ambiguity, and anything you had to decide yourself. Do not
   improvise around an unclear spec silently.
9. Do not commit.
