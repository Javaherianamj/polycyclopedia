# FE-1b `site-chrome` — build and test

**Unit**: FE-1b, app-shell work FE-1 delivered without. Opened 2026-08-12 on
direct owner report while reviewing the running site:

> "in each polymer page, there is no site name, and i can not go home
> either! fix the top of each." … "the search engine is not reachable yet!"

**Root cause**: `web/src/layouts/BaseLayout.astro` rendered a bare `<slot />`.
There was no header anywhere on the site — no wordmark, no home link, no
navigation. Search, Compare and Sources had shipped as working surfaces that
could only be reached by typing a URL. Both owner complaints were one gap.

**Owner decision** (direct choice): full header with the animated wordmark —
wordmark linking home, nav to Catalog / Search / Compare / Sources, language
switcher, theme toggle, on every page and both locales.

---

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/components/chrome/Wordmark.astro` | D55 lockup, SVG, three groups sharing one seam |
| `web/src/components/chrome/SiteHeader.astro` | Header, nav, language switcher, theme toggle, skip link |
| `web/src/styles/chrome.css` | Header layout + the D55 animation |
| `web/src/layouts/BaseLayout.astro` | Renders the header on every route; `#main` wrapper for the skip link; session-scoped wordmark intro flag |
| `web/src/i18n/{en,fa}.json` | `nav.*`, `lang.*`, `theme.*` keys (both locales complete, verified in sync) |

Static Astro throughout — **no island**. Navigation must not depend on
hydration, and the feature routes already carry the react-dom runtime; chrome
must not add to it.

## 2. Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (94 files) |
| `vitest run` | 183/183 |
| `astro build` | 78 pages |
| Header present on a datasheet | `/en/m/hdpe`: `.site-header` present, wordmark href `/en`, aria-label "Polypedia — home" |
| Nav | Catalog/Search/Compare/Sources → `/en/{catalog,search,compare,sources}` |
| Active route marked | `/fa/catalog`: `aria-current="page"` on فهرست مواد only |
| Language switcher stays on the page | `/en/m/hdpe` → `/fa/m/hdpe`; `/fa/catalog` → `/en/catalog`. Not the homepage |
| RTL | `/fa/catalog`: `dir="rtl"`, `lang="fa"`, nav renders فهرست مواد / جست‌وجو / مقایسه / منابع |
| Theme toggle | light → dark, `localStorage['polypedia-theme']` = `dark`, toggles back to light |
| Skip link | `href="#main"`, `#main` exists |
| No horizontal overflow, 320 px | `scrollWidth === clientWidth` (320 === 320); nav wraps to its own row, header 106 px |
| Wordmark reserves fixed space | 104×18 box at every width — expansion overflows, never pushes siblings (spec non-negotiable 8) |

**Verification method**: `javascript_tool` DOM/CSSOM queries against the
running dev server. **No screenshot** — the Browser pane is still not
displayed in this environment, so nothing here was seen with human eyes.
Every claim above is measured, none is visual.

## 3. D55 conformance, and the two open decisions

Built to `construction/fe-0/wordmark-animation-spec.md`: `poly`/`pedia`
translate outward from a shared seam, `cyclo` is revealed by the opening gap
(`scaleX` 0 → 1, never before there is room for it), then the halves drive
back in and **squeeze** it out — `scaleX` only, `scaleY` pinned at 1, opacity
never touched. Spec §3: *"If only one thing survives review, it is that
`cyclo` is squeezed out, never faded out."* Transform-only, no layout
properties animated (non-negotiable 5); no `transition: all` (R35, non-
negotiable 6); CSS + SVG only, no library (R24, non-negotiable 4).

**Spec §5 was followed rather than the owner's literal "constant loop"**, and
this is deliberate: the spec itself argues a persistent-chrome loop fails
WCAG 2.2.2 (Pause, Stop, Hide) on a site people read long technical pages on.
The header therefore plays **once per session** (sessionStorage flag) and
replays on hover and keyboard focus. The homepage-hero loop and its required
pause control are hero work and are **not built here**.

`prefers-reduced-motion: reduce` renders the static compressed wordmark —
no fracture, no translation, no scale, per non-negotiable 1.

### Open for owner review — both are defaults, not decisions

1. **The `cyclo` accent hue** is `--wm-cyclo: #b06a3b`, a sixth brand-only
   hue. It deliberately does not borrow one of D36's five semantic hues,
   which have fixed jobs — an accent meaning "measurement" or "actionable"
   on a wordmark would dilute them. The specific value is a placeholder.
2. **The Persian lockup animates**, matching the brief's "both locales". RTL
   is handled by flipping the sign of the travel via `--wm-dir`, so one
   animation serves both directions rather than two being maintained.

## 4. Note for whoever touches chrome.css next

`web/src/styles/global.css` carries a `[hidden] { display: none !important }`
guard and `value-atom.css` scopes its popover display to `:popover-open`.
Both exist because author `display` declarations beat user-agent rules —
that bug class independently broke every popover on the site and the whole
catalog family filter. Do not add a bare `display` rule that overrides
either.

---

## 5. Second pass — owner review of the running header, 2026-08-13

Four items, all from direct owner feedback on the live site.

### 5.1 Duplicate theme control removed

`/{en,fa}/index.astro` each carried their own `shell-header` — a site name
plus a `🌓` button — predating the global header and now redundant. Removed
along with their styles and their `toggleTheme` script. The homepage now has
exactly one theme control, in the header, like every other page. Verified:
`[data-testid="theme-toggle-button"]` count is 0, `[data-theme-toggle]`
count is 1.

### 5.2 Wordmark typography

> "the polypedia on header is really small, make it bigger, use a bold font
> or something. use a different font from the whole file for it, or make the
> font yourself. especialy the persian font is aweful."

| | Before | After |
| --- | --- | --- |
| Rendered box | 104 × 18 | **164 × 33** |
| Latin | Newsreader 400 @ 22px | **Newsreader 600 @ 27px**, −0.01em |
| Persian | Estedad 400 @ 22px | **Estedad 900 @ 26px** |

**The constraint, stated plainly rather than worked around**: this project
self-hosts exactly two faces — Estedad, the only Persian face available, and
Newsreader — and `frontend-plan.md` forbids shipping a webfont whose licence
is unresolved. A genuinely new typeface therefore cannot be introduced from
inside this task; it needs either a licensed font file or custom-drawn
outlines, both of which are design decisions with real cost. What *was*
available and unused is Estedad's variable weight axis, which runs to 900
and had never been taken above 700 anywhere on this site. That is the lever
used, and it is the single biggest available improvement to the Persian
lockup. **The "make the font yourself" option — drawing the lockup as SVG
paths — remains open and is the only route to a truly bespoke mark.**

`--wm-travel` was re-measured against the real rendered lockup rather than
guessed: `cyclo` renders ~60px wide and `سیکلو` ~69px, so the previous 36px
of travel left only ~1.5px of clearance on the Persian mark. Now 40px.

### 5.3 Theme toggle, illustrated

> "the button for it is so simple, make it match the theme more! also it
> must be completely illlustrated."

The `☀`/`☾` emoji are gone — they rendered in the reader's system emoji
font, an uncontrollable visual language foreign to the rest of the site.
Replaced by `ThemeToggle.astro`: a **dial**, not a swap. Sun (disc + eight
rays) and moon (a real mask-cut crescent, plus two stars) sit at opposite
ends of one wheel inside a 22px aperture; toggling translates the wheel so
the other body rises into view, on a spring easing. The button itself is now
a 38px porthole carrying a sky gradient — warm day, deep night — rather than
a transparent bordered box. SVG only, no icon library (R24).

### 5.4 Celestial sweep

> "somehow when i change it a sun or moon passes from the back of the screen"

`.sky-sweep` in `BaseLayout.astro`: a fixed, `pointer-events: none` layer at
`z-index: 0`, with `.site-header` at 2 and `#main` at 1 — so the body
genuinely passes **behind** the page's content. On toggle it arcs across the
viewport (rise, cross, set) over 1500ms, `transform` and `opacity` only.
Moon on the way to dark, sun on the way to light.

### 5.5 An R35 conflict, resolved deliberately

R35 says a theme switch must not animate — and `data-theme-changing`
suppresses every transition site-wide during the restyle, which is right:
colours must not crossfade while someone is reading. But the owner has now
explicitly asked for motion on this control. Both are honoured by scoping:
the **page's restyle** stays instant, while the **control you just pressed**
and the sweep animate. Implemented as one higher-specificity exemption for
`.theme-dial`, documented in place.

### 5.6 A real bug found while verifying

The suppression flag was released with `requestAnimationFrame` alone. In a
backgrounded or non-compositing context rAF may not fire, which would leave
`data-theme-changing` set **permanently** and silently disable every
transition on the site. Now released by rAF *and* a 50ms timeout — rAF is
the fast path, the timeout is the guarantee. Caught because this
environment's Browser pane produces no frames.

### 5.7 Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings (95 files) |
| `vitest run` | 183/183 |
| `astro build` | 78 pages |
| Duplicate toggle removed | page-level count 0, header count 1 |
| Wordmark, `/en` | Newsreader, weight 600, 27px, box 164×33 |
| Wordmark, `/fa` | Estedad Variable, weight **900**, 26px, `--wm-dir: -1` |
| Dial reaches the moon | `translateY(-22px)` under `data-theme='dark'` |
| Sweep wiring | `data-sweeping` set per direction; `sky-arc` animation applied to the correct body |
| Suppression flag clears | `data-theme-changing` absent after toggle |
| `aria-pressed` | tracks the theme |
| No horizontal overflow, 320px RTL | `scrollWidth === clientWidth` (320) |

**Verification caveat, unchanged**: the Browser pane is still not displayed
in this environment, so it produces no frames. Every static/computed value
above is measured, but **no animation was watched** — the dial's travel was
proven by removing its transition and reading the target transform
(`matrix(1,0,0,1,0,-22)`), not by observing it move. The sweep's motion, the
wordmark's crack, and the dial's spring are all unwatched.
