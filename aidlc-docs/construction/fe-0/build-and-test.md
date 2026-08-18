# FE-0 build and test — the gate record

**Run**: 2026-08-04 (Opus, integration)
**Gate** (from `aidlc-state.md`): contrast AA · no `transition: all` · no overflow
at 320/375/768 · both themes on every surface
**Verdict**: **PASS**, with one recorded exception (§5) and six defects found and
fixed (§3).

There is no build step to run. FE-0 is static HTML and CSS served directly —
`npx vite design/fe-0` is a file server, not a compiler — so "build" here means
the four criteria above, checked against pages rendered in a real browser rather
than read out of the source.

---

## 1. Method

Every page was loaded in Chromium at each width, in each theme, and measured
rather than eyeballed. The measurement is
`documentElement.scrollWidth - documentElement.clientWidth`: the amount by which
the page's content box exceeds its viewport. Anything above 1px is a failure.

Two details that decide whether the numbers mean anything:

- **The root clips.** `base.css:15` and `lab/lab.css:131` set
  `overflow-x: hidden` on `html`. That suppresses the horizontal scrollbar but
  does **not** suppress the overflow — content past the edge is silently
  unreachable rather than scrolled to. So a non-zero reading here is worse than
  a stray scrollbar, not better, and reading the page visually would have shown
  nothing wrong.
- **The scrollbar is 15px and sits on the left.** The surfaces are RTL. A test
  frame set to 320px yields a 305px viewport, and overflow runs toward negative
  `left`, not past `right`. Both are corrected for: frames are sized
  `target + 15`, and the culprit search looks for `left < 0` as well as
  `width > clientWidth`. The first pass of this audit got both wrong and
  produced culprit lists that were entirely false positives.

Themes were switched by setting `data-theme` on the root and forcing reflow,
which is exactly what `theme.js:toggleTheme` does.

**Coverage**: 10 pages × 6 widths × 2 themes = 120 measurements. The three gate
widths (320/375/768) plus three desktop widths (1024/1280/1440), because two of
the defects below live only at desktop widths and the gate would have missed
them. The four superseded treatments (`a.html` … `d.html`) were additionally
checked at the three gate widths and are clean.

---

## 2. Results

| Criterion | Result | Evidence |
| --- | --- | --- |
| Contrast AA | **pass** | `contrast-audit.md` — 4 palettes, 6 pairs below 4.5:1 found and corrected. No colour value was changed by this gate run, so that audit still holds |
| No `transition: all` | **pass** | Two occurrences repo-wide, both prose stating the rule (`tokens/README.md:90`, `tokens/motion.css:17`). No declaration |
| No overflow at 320/375/768 | **pass after fixes** | 0 of 120 measurements exceed 1px. Was 20 of 60 before §3 |
| Both themes on every surface | **pass, 1 exception** | 9 of 10 pages resolve to different background and text colours per theme; `index.html` is the exception, §5 |

Two decisions get incidental confirmation from the theme sweep: the datasheet
resolves warm (`#f9f6ef` light, `#241d17` dark) and the lab resolves cool
(`#e9eef4` light, `#3e436f` dark) — D39–D43 as specified, `#3E436F` exactly.

---

## 3. Defects found and fixed

All six are the same family of bug: **a box sized independently of the space it
has to fit into.** None were visible without measuring, because the root clips.

| # | Page | Symptom | Cause | Fix |
| --- | --- | --- | --- | --- |
| 1 | `e.html` | 336px at 320, 281px at 375. The section rail's later entries were unreachable | `.rail` is a grid item; `min-inline-size` defaults to `auto`, so the item took its max-content width and the `overflow-x: auto` on its `ul` had nothing to scroll against | `min-inline-size: 0` on `.rail` (`base.css:677`) |
| 2 | `e.html` | 170px remaining after #1 | Property popovers are positioned against the 16px trigger button, so `inline-size: min(270px, 78vw)` still placed most of the box outside the page | The property row becomes the containing block below 900px; popover spans it (`base.css:735`) |
| 3 | `type.html` | 63px at 320 | The derivation table's min-content width is ~356px; `width: 100%` cannot go below that | Wrapped in a keyboard-reachable `.table-scroll` (`type.html:368`) |
| 4 | `lab/index.html` | 20px at 320 | `.labbar .wrap` is a nowrap flex row; the brand descriptor pushed the pill past the edge | `.labbrand small` hidden below 480px (`lab/lab.css:304`) |
| 5 | `lab/index.html` | 8px at 320 | `repeat(auto-fit, minmax(300px, 1fr))` — a 300px floor inside a 264px content box | `minmax(min(300px, 100%), 1fr)` (`lab/index.html:37`) |
| 6 | `lab/graph.html`, `lab/notebook.html` | 104–250px at 320/375, and 25–145px at 1024–1280 | Same as #2: popovers anchored to inline triggers | Row/paragraph becomes the containing block (`lab/notebook.css`, `lab/graph.css`) |

Two of these are worth noting beyond the fix:

**#1 is the one that mattered.** It is the only defect that cost a user
something they could not work around — the datasheet's section navigation lost
its later entries on every phone-width viewport, with no scrollbar to reveal
them. The `overflow-x: auto` intended to make it scroll was present and correct;
it was inert because of the grid item's default minimum.

**#6's breakpoints are not the layout's breakpoints.** The notebook's popover
fix is bounded at 1319px, not the 1039px layout breakpoint, because the article
only gains room either side when the margin-note column appears at 1320px. The
graph's fix is unconditional: its panel is a fixed 300px column against the page
edge at every width, so there is no width at which anchoring to the trigger is
safe. Setting either bound to match the layout breakpoint would have left a band
of desktop widths broken — which is what the first attempt did, and what the
1024/1280/1440 measurements caught.

Desktop rendering is unchanged: popover widths at 1280px remain 270/250/220px
with their triggers still `position: relative`.

---

## 4. What was not verified

- **Screenshots.** The browser pane was not displaying during this run, so no
  frames could be captured. Every claim above rests on measured geometry
  (`getBoundingClientRect`, `scrollWidth`) rather than on inspection, which is
  the stronger evidence for overflow but does not substitute for a human looking
  at the popovers' new position on a phone. **Worth a visual pass before FE-1
  ports the popover pattern.**
- **Real devices.** All measurements are Chromium at a set viewport. Not tested:
  iOS Safari's dynamic viewport units, or an actual 320px device.
- **Contrast after the fixes.** Not re-run, and not needed — the six fixes are
  layout only. No colour value changed.
- **`a.html` … `d.html` at desktop widths.** Gate widths only. They are the
  superseded treatments; E is the house style.

---

## 5. Recorded exception — `index.html` has no dark theme

`index.html` is the treatment picker. It loads `switcher.css` alone — no
`base.css`, no `theme.js` — and renders identically in both themes.

This is left as-is deliberately. It is the scaffold used to compare treatments
A–E during FE-0, not a product surface, and `tokens/README.md` already excludes
the demo pages from what FE-1 ports. Giving it a dark palette would mean
maintaining a fifth palette for a page that ships to nobody.

---

## 6. Carried into FE-1

The popover fixes above are corrections to prototypes, not a pattern worth
porting. FE-1 should build the popovers on the **Popover API with CSS anchor
positioning**, which solves edge collision at the browser level and removes the
containing-block juggling in three files. The rule that survives the port is the
one underneath all six defects, and it belongs with the tokens:

> Any box with a fixed inline size must state what happens when the viewport is
> smaller than it. A grid or flex item that holds a scroller needs
> `min-inline-size: 0`; a `minmax()` floor needs `min(floor, 100%)`; a popover
> needs a containing block at least as wide as itself.
