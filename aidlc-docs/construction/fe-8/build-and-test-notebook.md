# FE-8 `learn-surface` — L4 «دفترچه» / NOTEBOOK, build and test

**Unit**: FE-8, the fourth and last of the four Learn concepts
`lab-concepts-spec.md` designed (L1 SCALE / L2 MAP / L3 GRAPH / L4 NOTEBOOK).
This document covers NOTEBOOK only. SCALE's own record is `build-and-test.md`
/ `build-and-test-restructure.md`; MAP's is `build-and-test-map.md`; GRAPH's
is `build-and-test-graph.md`.

**Why this shipped now**: the same standing owner instruction the other three
records already quote — *"we had a early draft on learning phase had 4
parts!... i want those four parts!!!"* — and it closes that request: with this
unit, all four are real routes, and `LearnConceptNav.astro` has nothing left
inert.

**The spec's own framing for this one, worth restating because it drove
every structural decision below**: *"the lab is not a toolbox, it is a
publication with live figures. A tool is a figure inside an argument, not a
tile in a grid... if the lab is built as a menu it has to be rebuilt when the
first post arrives; if it is built as a publication, a post is just another
document in it."* So the deliverable is a **reusable document template**,
demonstrated by one real article — not a one-off page. §2 is the load-bearing
section for that claim.

---

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/content/notebook/types.ts` | The typed content shape (`NotebookArticle`, `ProseSegment`, `ArticleBlock`) — see §2. |
| `web/src/content/notebook/segments.ts` | Small builder functions (`text`/`num`/`note`/`term`/`liveValue`) an article author writes against. |
| `web/src/content/notebook/articles/ldpe-branching.ts` | Article #1: "Why LDPE Never Packs as Tightly as HDPE" — zero hardcoded numbers (every value is a `liveValue` pointer, resolved live). |
| `web/src/content/notebook/index.ts` | The registry (`NOTEBOOK_ARTICLES`, `getNotebookArticle`) and the content-shape decision record. |
| `web/src/lib/notebook/chain-schematic.ts` (+ `.test.ts`, 5 tests) | Figure 1's static geometry — a single-source-of-truth vertex array, fixing a real off-by-one bug the FE-0 prototype's own comments recorded and this port removes by construction (§5). |
| `web/src/lib/notebook/reading-time.ts` (+ `.test.ts`, 6 tests) | Pure, server-computable reading-time estimate over `NotebookArticle`, replacing the FE-0 prototype's client-side DOM word-count. |
| `web/src/lib/notebook/units.ts` (+ `.test.ts`, 3 tests) | `celsiusToFahrenheit` — the one unit conversion a `liveValue` segment may apply. |
| `web/src/lib/notebook/figure-density.ts` (+ `.test.ts`, 3 tests) | The pure seam between "which material is figure 2 showing" and "what does it have on record" (density/crystallinity). |
| `web/src/islands/NotebookFigureIsland.tsx` | The one live figure — material picker + real density/crystallinity readout with provenance marks (§4). |
| `web/src/components/learn/ProseSegments.astro` | Renders one `ProseSegment[]` — the single place every segment kind (text/num/note/term/liveValue) is pattern-matched, so a second article's prose renders identically for free. |
| `web/src/components/learn/InlineCitedValue.astro` | R1's value+mark+popover fragment, extracted from `ValueAtom.astro`'s markup so it can sit mid-sentence (§4). |
| `web/src/components/learn/NotebookFigure1.astro` | Figure 1 — the static schematic SVG, built from `chain-schematic.ts`. |
| `web/src/components/learn/LearnNotebook.astro` | Page shell: masthead, byline, review block, TOC rail, alternating two-column article body, closing note. |
| `web/src/components/learn/notebook-chrome.ts` | Plain script (not an island): reading-progress bar, TOC scroll-spy, mobile sidenote toggle — the same pattern `SectionRail.astro`'s `section-rail.ts` already established. |
| `web/src/components/learn/LearnConceptNav.astro` | NOTEBOOK's entry flipped from `href: null` to `/{locale}/learn/notebook` — **the last inert entry in this app**. |
| `web/src/pages/{fa,en}/learn/notebook.astro` | The two locale routes. |
| `web/src/styles/learn-notebook.css` | New stylesheet, imported by `global.css` right after `learn-graph.css`. |
| `web/src/i18n/{fa,en}.json` | 27 new `learn.notebook.*` keys, both locales, verified set-equal (479/479). |

Ported **from** `design/fe-0/lab/notebook.html` + `notebook.css` + `notebook.js`
(read, not edited) — the masthead/byline/review-block/TOC/alternating-spread/
sidenote-float/figure/pull-quote/term shape all carry across faithfully. No
new dependency.

## 2. The content-shape decision (the load-bearing one)

**Article prose lives in a typed TypeScript content module
(`content/notebook/`), one file per article, authored via `segments.ts`'s
builders — not Astro content collections, not hardcoded JSX, not the i18n
dictionary.** `content/notebook/index.ts`'s header carries the full reasoning;
summarised:

- **Not i18n** (`fa.json`/`en.json`): `t()` is built for short, flat, *reused*
  UI strings looked up by one key. An article is a few thousand words of
  *structured* prose, used exactly once, with sidenotes/hover-terms/live
  values embedded mid-sentence. Flattening that into one-off keys would (a)
  explode the dictionary with never-reused strings and (b) throw away the
  structure — which run of text is a sidenote vs. a term vs. a live number —
  that is exactly what lets a second article be a data addition. Non-prose
  **chrome** around the article (byline labels, TOC heading, figure-mechanism
  captions, provenance labels) still goes through `t()` like every other Learn
  surface — that split is deliberate and stated, not an oversight.
- **Not content collections**: this template's defining need is a small
  *closed* set of segment kinds (`text`/`num`/`note`/`term`/`liveValue`) that
  a renderer (`ProseSegments.astro`) pattern-matches *exhaustively* —
  TypeScript's own exhaustiveness checking on `ProseSegment['kind']` is a
  safety net that Markdown+frontmatter would not give: nothing would stop a
  second article's Markdown body from embedding a raw number that skips the
  `liveValue` seam entirely, which is exactly the failure mode this project
  exists to prevent (R5). A plain typed module gets that guarantee for free
  and needs no new dependency or Astro config change.

**How article #2 gets added**: write `articles/<slug>.ts` exporting a
`NotebookArticle` (see `ldpe-branching.ts` as the worked example — every
`text()`/`note()`/`term()`/`liveValue()` call is the vocabulary a second
author writes against), then add it to `NOTEBOOK_ARTICLES` in `index.ts`.
`LearnNotebook.astro`, `NotebookFigureIsland`, `chain-schematic.ts` and
`reading-time.ts` all already operate on `NotebookArticle` generically — none
of them know this project has only one article today, so **none of them need
to change**. The one real, stated gap: today's route renders
`NOTEBOOK_ARTICLES[0]` directly rather than taking a slug param, because
building a multi-article index for a collection of one would be speculative
— `index.ts`'s header says so explicitly, the same honesty posture SCALE
took with its two empty stations and MAP took with its missing-data
materials.

**One narrower, stated gap**: `NotebookFigure1.astro` draws ONE fixed
schematic (linear vs. branched chain) — `ArticleBlock`'s `figureSchematic`
kind does not yet parametrise which drawing to show. An article needing a
different static figure extends that block kind with a `variant` field and
adds a branch to that component, rather than the component growing an
unrelated drawing mode it doesn't need yet.

## 3. Content honesty — how numbers got into the article without inventing any

**Every number in `ldpe-branching.ts` is absent from the file itself.** The
mechanism the article teaches (branching → disrupted crystalline packing →
lower crystallinity → lower density → different application fit) is the same
causal chain `causal-graph.ts` (GRAPH) already encodes and
`spherulite-readout.ts` (SCALE's 10⁻⁶ station) already shows as real paired
data — this article is prose *about* that established, already-reviewed
mechanism, not a new scientific claim. The only numbers that appear are
`liveValue` segments (`{ group, key }` pointers), resolved by
`ProseSegments.astro` against a real `MaterialDetail` fetched server-side by
`LearnNotebook.astro` (`getMaterial('ldpe')`, the article's subject) — the
same SSG pattern `m/[slug].astro` already uses. A failed fetch throws and
fails the build loudly (matching that page's own "no partial-site outcome is
better than a loud failure" posture) rather than silently degrading to
placeholder numbers, because this page's entire premise is that its quoted
numbers are real.

Checked against the running API before writing the article (2026-08-15):

| Property | LDPE (article subject) | HDPE (`?material=hdpe` test) | PA6 (`?material=pa6` test) |
| -------- | ----------------------- | ----------------------------- | ---------------------------- |
| `physical.density` | 0.915–0.935 g/cm³, **published/cited** | 0.975 g/cm³, **published/cited** | no property rows at all |
| `academic.crystallinity` | 45–59 %, **published/cited** | 70–90 %, unsourced | no property rows at all |
| `thermal.tm` | 105–115 °C, unsourced | 133–138 °C, published/cited | — |

So the shipped article's two live paragraphs genuinely show **both**
provenance states (density/crystallinity cited with `§`, Tm uncited with `?`)
— not a cherry-picked "everything is sourced" demo. The one arithmetic
derivation (Tm in °F) carries the *same* mark as its Celsius source, per
`types.ts`'s own rule that a unit conversion is not a second fact.

**The review block's citation** (D5: metadata only, no quoted body text) uses
the sample-citation path — the exact `نمونهٔ طراحی` / `DESIGN SAMPLE — not a
real citation` object `design/fe-0/lab/data.js`'s `vicat` entry already
committed to, rendered through the same mark+popover mechanism a real
citation would use (`.nb-mark`/`.nb-pop`, `LearnNotebook.astro`). **Decision,
stated**: `GET /api/sources` was checked (1,290 real citation rows exist) and
a real one was deliberately *not* attached here — the claim the review block
paraphrases (branch content vs. melting-point depression across LDPE grades)
was never checked by this agent against any specific real paper's actual
content, and attaching a real citation id to an unverified claim would be a
false *attribution*, a different failure mode from a false number but the
same category this project's schema exists to prevent. The build brief
called both paths acceptable; this one was chosen as the more conservative
of the two.

## 4. The live figure (mid-article, required by spec)

**Figure 2** (`NotebookFigureIsland.tsx`, mounted mid-section-2) reads
density and crystallinity for whichever material is selected, via the exact
shared hook every other Learn tool uses (`useLearnMaterialContext`,
`lib/learn/material-context.ts`) — no second fetcher, no second URL reader.

**Why a picker + readout, not the FE-0 prototype's draggable density
slider**: the prototype let a reader drag within LDPE's own density *range*
to see an illustrative crystallinity estimate from a hand-drawn linear
formula — defensible for one hardcoded material, whose real range was known.
Generalising that slider to *any* catalogue material would mean either
fabricating a density range for materials whose real min/max isn't carried
at this shape (`LearnMaterial.density` is a reduced single point, not a
min/max pair), or reusing LDPE's specific range for a material it doesn't
describe — both are exactly what R5 forbids. `CrystallinityDensityIsland.tsx`
(SCALE's own 10⁻⁶ station) reasoned through this identical property pair
already and reached the same conclusion ("there is no mechanism to let a
reader manipulate here... showing the real numbers side by side is the whole
tool") — this figure follows that precedent instead of reinventing a
fabricated slider. The **live** part is the picker itself: changing the
material re-reads real numbers from the database, a genuinely live action,
just not a drag gesture.

**Honest degrade (R7)**, verified live:

- `?material=hdpe` → picker seeds to HDPE (bound-material note shown);
  density `0.975 g/cm³ §` (sourced), crystallinity `70 - 90 % ?` (unsourced)
  — both real, both correctly marked.
- `?material=pa6` (zero property rows) → both stats show an explicit "پلی‌آمید
  ۶ در دیتاشیت مقداری برای… ندارد" note, never a blank space or a fabricated
  number.
- No `?material=` → defaults to the article's own subject (LDPE).

**`InlineCitedValue.astro`** (used by every `liveValue` segment) is not a
parallel implementation of R1's provenance component — it extracts
`ValueAtom.astro`'s own value+mark+popover *fragment* (same `.mark`/`.pop`/
`.pop-meta`/`.citation-list` CSS classes from `value-atom.css`, same native
Popover API mechanics, same unique per-instance anchor-name) so a number
sitting mid-sentence gets the identical citation UI a datasheet row gets,
just without the label/row wrapper that context doesn't need. Verified live
that a cited value's popover shows the real citation title and page ("Handbook
of Industrial Polyethylene and Technology, صفحه ۱۱۱" for LDPE's density).

## 5. Layout: Tufte sidenotes, alternating spread, TOC + progress

Ported from `notebook.css` onto this app's real token vocabulary
(`--fs-*`/`--r-*`/`--dur-*`/`--ease-*` instead of that file's single `--t`) —
the same adaptation `learn-map.css`/`learn-graph.css` already did for their
own FE-0 sources. **Every class renamed `nb-`/`nbv-`-prefixed**: the FE-0
prototype's bare `.mark`/`.pop`/`.term`/`.note`/`.note-ref` names collide with
`value-atom.css`'s own already-global `.mark`/`.pop` (imported once, sitewide,
in `global.css`) — reusing them unprefixed would have silently reskinned or
broken the datasheet's own popovers. Caught this during layout, before it
shipped, by checking `global.css`'s import list rather than assuming a new
stylesheet's class names are automatically scoped.

**Two-column Tufte layout + alternating spread**: ported near-verbatim,
including the deliberate choice to pin `.nb-block--r`/`--l` and the sidenote
float in **physical** terms (`margin-left`/`margin-right`,
`float:left`/`right`) rather than logical `inline-start`/`end` — the
alternation is a magazine-style mirror unrelated to reading direction, so it
stays the *same physical shape* in both locales. "Sidenotes in the margin
must work on both sides" (build brief) is satisfied by this being
locale-*independent* on purpose; only the prose *inside* each block follows
the page's own `dir` via normal inheritance.

**Mobile collapse**: below 1040px, `.nb-note` is `display:none` and
`.nb-note-ref` (a real `<button>`, min 44×44px on mobile — see §6) toggles
`.is-open` via `notebook-chrome.ts`. Verified live: toggling `n-branch` at
375px flips `display:none → block` and `aria-expanded:false → true`.

**TOC + reading progress**: `.nb-toc` (fixed, viewport-anchored) appears only
≥1320px, matching the FE-0 prototype's own breakpoint (below that width the
sidenote float has nowhere to go either, so the same threshold governing both
is not a coincidence). Reading progress is the fixed top bar, visible at
every width. Both wired by `notebook-chrome.ts`'s `IntersectionObserver`
scroll-spy — the exact pattern `SectionRail.astro`'s `section-rail.ts`
already established for the datasheet rail, reused rather than reinvented.
Verified live: scrolling to section 2 sets `#s2`'s TOC link `.on` and moves
the progress fill to 58%.

## 6. Accessibility (R30)

- **44px sidenote-marker target, verified, not assumed.** First pass used
  `padding: 12px` around the 20px glyph — but the sitewide `box-sizing:
  border-box` reset (`global.css`) means an explicit `inline-size: 20px`
  fixes the box regardless of padding, so the "bigger touch target" never
  actually grew. Caught via `getBoundingClientRect()` (25.6×25.6px measured,
  not 44), not by eye. Fixed with `min-inline-size`/`min-block-size: 44px` in
  the mobile media query; re-measured at 44×44px exactly after the fix.
- **Term hover-definition works without a mouse.** `.nb-term` is
  `tabindex="0"`; its popover opens on `:hover, :focus-visible`. Verified with
  *real* dispatched `Tab`/`Shift+Tab` key presses (not synthetic
  `KeyboardEvent`s, which Chromium's focus-visible heuristic correctly
  ignores — confirmed the difference directly: a scripted `.focus()` call
  left `:focus-visible` false, a real Tab keypress set it true) — landed on
  `.nb-term`, confirmed `el.matches(':focus-visible') === true` and the
  popover's computed `opacity:1`/`visibility:visible`.
- **`InlineCitedValue`'s citation mark is keyboard-operable via the platform,
  not custom JS**: a real `<button popovertarget="…">` — Enter/Space
  activation and the native Popover API are both browser-native behaviour,
  identical to `ValueAtom.astro`'s already-shipped, already-accessible
  pattern; nothing in this component adds or could break that.
- **Heading hierarchy**: page `h1` = article title; every section heading and
  the review block's own heading are `h2`, siblings under the one `h1` — no
  skipped level.
- **Reading progress is not the only cue** (spec's own requirement): the TOC
  rail's `.on` highlight and normal scroll position both convey the same
  information redundantly.

## 7. Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (175 files) |
| `vitest run` | **389/389** passed (372 baseline + 17 new: 5 `chain-schematic`, 6 `reading-time`, 3 `units`, 3 `figure-density`) |
| `npm run build` | 88 pages, completes cleanly; `fa/en learn/notebook` both present in `dist/` with the expected structural markers (`nb-review`, `nb-toc`, `nb-note`, `notebook-figure-live`) |
| i18n key parity | 479 keys, fa === en (set-equal via `Object.keys` diff both directions, not just count) |
| `prettier --check` | clean on every new/edited file |
| Console errors | none, fresh tab, either locale (the 500s seen mid-session traced to a genuine early bug — see §8 — and to the dev server's postcss-import cache not self-healing after that bug; both resolved, confirmed clean on a brand-new tab against a restarted server) |
| Live binding | `?material=hdpe` → real cited/uncited values; `?material=pa6` (zero rows) → honest missing-data notes; no param → article's own LDPE default |
| Dark theme | body `rgb(62,67,111)` (exactly `--bg` #3E436F), review block `rgb(47,51,87)` (exactly `--panel` #2f3357), sourced mark `rgb(165,221,177)` (exactly dark `--ok` #a5ddb1) — token-driven, no hardcoded hex |
| Nav completeness | `.concept-nav-link` on `/fa/learn` (SCALE) returns 4 real `<a>` elements, zero `is-disabled` — confirms NOTEBOOK is live from every Learn page, nothing inert left |

## 8. A real bug caught and fixed mid-build: the malformed-CSS-comment hazard

The build brief specifically warned about this class of failure ("a
malformed comment in `learn-map.css` once broke the whole dev server") and
this build hit it anyway: `learn-notebook.css`'s own header comment
originally read `(--fs-*/--r-*/--dur-x/--ease-x instead of...)` — the
sequence `-*/` contains a literal `*/`, closing the block comment early and
leaving the rest of the header (`--r-*/--dur-x/--ease-x instead of that
file's own single --t`) to be parsed as real CSS, which PostCSS correctly
rejected as an "Unknown word". Caught immediately via `preview_logs` (not by
eye), fixed by rewriting the sentence to avoid any `*` immediately followed
by `/`. A second, separate issue followed: after the fix, the dev server kept
reporting the *original* stale error on every reload — traced to Vite's
`postcss-import` resolution cache not invalidating cleanly from the earlier
genuine "file doesn't exist yet" error (the CSS file was created seconds
after `global.css`'s `@import` was written, and pointed at a real syntax
error before that). A full server restart (`preview_stop` + `preview_start`,
not just touching files) cleared it; a fresh tab against the restarted server
confirmed zero console errors. Recorded here because both halves — the
literal comment bug and the cache-didn't-self-heal follow-up — are exactly
the kind of thing worth a permanent trace, per this project's own convention
(compare the `docs/…"database isn't running" error` commit).

### Driven verification (real DOM state, not just static reads)

Per this surface's own constraint (the Browser pane cannot screenshot-verify
reliably here), every interactive claim above was driven with real key
presses / real clicks and confirmed via `getAttribute`/`getBoundingClientRect`/
`getComputedStyle`/`matches`/`textContent` reads against the live DOM, not
assumed from source — see §4/§5/§6 for the specific reads. One geometry check
worth naming: `document.documentElement.scrollWidth - window.innerWidth ===
0` at the (automation-reported) mobile width once the note-ref fix landed;
a small (~9px) residual was measured at desktop width from a *hidden*
(`opacity:0; visibility:hidden`) `.nb-pop`/`.nb-term .nb-pop` positioned near
a text edge — geometry that never paints, clipped by the sitewide
`html{overflow-x:hidden}` "last-resort guard" `global.css` already documents
for exactly this situation, and the identical class of limitation
`value-atom.css`'s own popover comments already accept ("a mark near the
inline edge can still clip"). Not chased further: it matches an already-
accepted, already-documented sitewide precedent rather than being a new
regression, and this component's own CSS comment states the same caveat
explicitly.

## 9. Judgement calls made without stopping to ask

- **Content shape**: typed TS module over i18n or content collections — §2,
  the load-bearing decision, stated and justified there.
- **Review-block citation**: sample (`نمونهٔ طراحی`), not a real citation id
  — §3's closing paragraph.
- **Live figure**: picker + real-number readout, not a generalised version
  of the FE-0 prototype's fabricated-range slider — §4.
- **Figure 2 placement**: end of section 2 (crystallinity), mirroring where
  the FE-0 prototype placed its own live figure, rather than section 3
  (density) — crystallinity is the property the article spends the most
  prose explaining, so the live figure lands where the reader's attention
  already is.
- **Fahrenheit conversion carries the source value's own citation state**,
  never its own — `types.ts`'s `liveValue.transform` contract, so a
  derived/converted number can never accidentally read as more "sourced"
  than the measurement it came from.
- **Article #2 is a stated future gap, not a speculative build**: no
  multi-article index page exists yet, because one does not earn a listing
  page — §2's closing paragraph names exactly what a second article needs.

## 10. What was NOT touched

`web/src/lib/learn/fetch-learn-materials.ts` was read and reused as-is —
`density`/`crystallinity` already existed from earlier units; no second
fetcher was written and the fetcher itself was not extended further (a
temptation resisted: carrying real `valueMin`/`valueMax` through it would
have let figure 2 draw a real-range slider, but that is exactly the kind of
speculative extension of shared, already-tested infrastructure this unit's
own reasoning in §4 argues against). `web/src/components/value-atom/
ValueAtom.astro` and `value-atom.css` were read closely and their *pattern*
reused (`InlineCitedValue.astro`) but the files themselves were not edited.
`web/src/lib/learn/causal-graph.ts`'s `provenanceMark`/`ProvenanceMark`
helpers were considered for reuse in `NotebookFigureIsland` but a small local
equivalent was written instead — `causal-graph.ts` is GRAPH's own module, and
importing a UI-only helper across concept boundaries for three lines of code
was judged not worth the coupling. `LearnMap.astro`, `MapIsland.tsx`,
`LearnGraph.astro`, `GraphIsland.tsx`, and every SCALE file were not modified
beyond `LearnConceptNav.astro`'s one-line `href` flip.
