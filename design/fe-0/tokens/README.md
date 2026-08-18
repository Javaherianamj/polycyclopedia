# FE-0 design tokens — the handoff to FE-1

**Status**: FE-0 output, frozen. FE-1 consumes this; it does not re-derive it.

This directory is the **single source of truth** for the design system. The four
palettes, the type scale and the motion system all live here. `design/fe-0/`'s
demo pages (`e.html`, `type.html`, `motion.html`, `lab/*.html`) are exploration
artefacts — they prove the tokens work, they are **not** the thing FE-1 ports.

---

## What FE-1 imports

| File          | Contains                                                                   | Owner of the values                    |
| ------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `colour.css`  | All four palettes, both surfaces × both modes                              | derived from `themes/e-press.css` + `lab/lab.css` |
| `type.css`    | 8-step scale, per-step line-heights, `--latin-size-adj`                    | measured from the real font binaries   |
| `motion.css`  | 5 durations, 4 easings, reduced-motion collapse                            | R19 expressed as tokens                |

Import order matters: `colour.css` → `type.css` → `motion.css`. None of them
depend on each other, but that order keeps the cascade readable.

---

## The two-surface, two-mode structure

This is the part most likely to be got wrong on port, so it is stated once here:

|               | Light                | Dark                        |
| ------------- | -------------------- | --------------------------- |
| **Datasheet** | warm cream `#F9F6EF` | ember brown `#241D17`       |
| **Lab**       | blue slate `#E9EEF4` | slate-indigo `#3E436F`      |

**The surface axis is warm vs cool, not light vs dark** (D39). The datasheet is
warm in *both* its modes; the lab is cool in *both* of its. So the reader always
knows which surface they are on, and light/dark stays a comfort setting rather
than doing two jobs at once.

Mode is set by `data-theme` on `<html>`, one shared preference across both
surfaces, defaulting to light (D42). Surface is chosen by which palette scope is
active — in FE-0 that is which stylesheet the page links; **in FE-1 it should
become a `data-surface` attribute** so both palettes can coexist in one bundle.
That is the one real change FE-1 must make to these files, and it is why
`colour.css` below is written with the scoping selector as the only thing that
varies.

---

## Colour is semantic — this is load-bearing (R33)

Five hues, five jobs. A hue that carries a meaning is **never** used
decoratively somewhere else. Adding a colour to a screen requires naming its job
first.

| Token       | Job                                                                 |
| ----------- | ------------------------------------------------------------------- |
| `--ink`     | structure, navigation, the door out of the datasheet                |
| `--accent`  | **measurement** — numbers are teal, and only numbers                |
| `--ok`      | **provenance satisfied** — a real citation exists                   |
| `--muted-2` | **provenance absent** — deliberately colourless                     |
| `--act`     | **something you can do** — contribute, explore, go                  |
| `--warn`    | reserved for warnings. **Absent from a healthy page** — that is the point |

A second, separate `--ramp-*` scale exists on the Lab surface only, and encodes
a *number* (temperature, cold → hot). It never borrows the status palette and
never appears as decoration (R34).

---

## Accessibility state at handoff

All four palettes pass WCAG 2.1 AA on every checked pair. Full working in
`aidlc-docs/construction/fe-0/contrast-audit.md`.

Two positions FE-1 must not "fix" without reading the reasoning:

- **`--muted-2` is not dimmer than `--muted`** in the lab dark palette. It
  cannot be and still clear AA. It is distinguished by **desaturation**
  instead — which reads more like "absent" anyway.
- **`--line` sits below 3:1 against its ground, deliberately.** WCAG 1.4.11
  covers UI components and meaningful graphics, not decorative edges between
  surfaces. The focus ring, which *is* covered, uses `--act`.

---

## Rules these tokens encode

- **R19** — the datasheet is restrained, the Lab is the animated surface. The
  datasheet uses only `--dur-fast` / `--ease-out`; the Lab may use the full set.
- **R35** — no `transition: all`, anywhere, ever. Every transition names its
  properties. This caused a real bug: a theme switch cross-faded the entire page,
  and transitions started in a throttled tab never resolved.
- **D18/R25** — Latin numerals everywhere, in both languages, in prose and in
  data. `--latin-size-adj` optically matches them to the Persian they sit inside.
- **Reduced motion** collapses durations to `0.01ms`, **not** `none` — so
  `transitionend` still fires and JS waiting on it does not hang.

---

## One open question for FE-1, deliberately not settled here

`--latin-size-adj` is `0.978`, derived by reading the real font binaries'
`OS/2` tables (Estedad cap-height 0.655 em, Newsreader 0.670 em).

**Cap-height and x-height give opposite answers.** x-height-to-x-height would
say scale Newsreader *up* (~1.15). Cap-height was chosen because the content
being corrected is digits and Latin acronyms, which are cap-height-anchored —
not lowercase prose. That reasoning is sound but it is a typographic judgement,
not a fact, and Persian body letters sit lower than Latin caps, so the truly
optimal number may differ from both.

`type.html` has an A/B toggle for exactly this. **It wants a human eye, not more
arithmetic.** Until someone looks, `0.978` is a defensible default that changes
almost nothing — which is the right way to be wrong.
