# FE-8 `learn-surface` — build and test, **THE SCALE RESTRUCTURE**

**Scope**: the page-level structure of the Learn surface, and nothing else.
No tool was rewritten, no tool logic was touched, no test was changed.

**Why this was done at all — the owner's words:**

> "why our learning env is similar to legacy? in fe0 we defined it in a
> different way with parts and new stuff! correct it, we worked well on it"

The complaint is correct and the evidence was already in the repo.
`fe-0/lab-concepts-spec.md` opens by rejecting the first Learn page for being
"a vertical stack of eight identical numbered cards… the default output shape
of a language model asked to present a list", and sets the bar for its
replacement: "the structure of the page should teach something before you
read a word of it, and it should be a structure that only makes sense for
polymers." **What FE-8 shipped was a vertical stack of five identical tool
panels** — the same failure, one tool shorter. D50 had already decided the
replacement ("Scale is the Learn surface's organising structure. You arrive
at the zoom; each tool sits at the length scale it belongs to"), and a working
prototype of it existed at `design/fe-0/lab/scale.{html,css,js}`. None of that
was used. This restructure is the port that should have happened.

---

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/components/learn/scale-stations.ts` | The station model — six decades from 10⁻¹⁰ m to 10⁰ m, with `railFraction()` making tick spacing proportional to log-distance |
| `web/src/components/learn/StationIcon.astro` | The six object glyphs (bond, coil, lamella, spherulite, dogbone specimen, recycling loop), ported from the prototype's `objectIcon()` |
| `web/src/components/learn/ScaleStation.astro` | One station: exponent, name, one sentence of physics, the object, and a slot for the tool(s) that live at that scale |
| `web/src/components/learn/LearnScale.astro` | The surface: sticky magnification readout, fixed scale rail, six stations, the five islands placed into them, and the one small scroll listener |
| `web/src/styles/learn-scale.css` | Page-level structure. Imported by `global.css` **after** `learn.css` |
| `web/src/pages/{en,fa}/learn.astro` | Reduced to a BaseLayout + `<LearnScale>` — 20 and 12 lines |
| `web/src/i18n/{fa,en}.json` | 20 new `learn.scale.*` keys each; fa authored first (R15), en mirrored |

Structure is Astro + CSS. The only page-level client JS is one ~30-line
listener keeping the readout and rail in sync with scroll. The five islands
are unchanged and still `client:load`. The page did not become an app.

## 2. Where each tool now sits, and why

| Scale | Station | Tool |
| ----- | ------- | ---- |
| 10⁻¹⁰ m | monomer & bond | **TacticitySimulator** |
| 10⁻⁹ m | single chain | **DPCalculator**, **HansenSpace** |
| 10⁻⁸ m | lamella | **BranchingSimulator** |
| 10⁻⁶ m | spherulite | — (gap, stated) |
| 10⁻³ m | specimen / part | **StateSimulator** |
| 10⁰ m | life cycle | — (gap, stated) |

Two of these are judgement calls and are recorded as such:

- **Tacticity at 10⁻¹⁰, not at the chain scale.** Tacticity is the
  configuration of a substituent on one stereocentre of one repeat unit. It is
  a monomer-scale fact whose consequences (crystallinity, Tm, clarity) surface
  three stations later — which is the lesson the zoom exists to deliver. The
  FE-0 spec's own table leaves 10⁻¹⁰ to a 3D molecular viewer that does not
  exist; this fills that station with something real rather than leaving the
  atomic end of the ruler empty.
- **StateSimulator at 10⁻³, not at the chain scale.** "What state is this
  material in at this temperature" is a question about a specimen. The
  mechanism it teaches is molecular, but the object it is asked about is a
  part.

The two empty stations were **not** deleted. R7 and constraint 6 of the FE-0
spec both say a tool with no data does not render as if it worked; deleting
the station would have hidden a real step in the zoom and quietly made the
page look complete. Each carries a dashed-outline gap note — D21's "absent"
grammar, the same one the datasheet uses for an unmeasured value — giving the
real reason: no sourced density–crystallinity relation in the database, and no
measured LCA data at all.

The FE-0 spec's required live element at 10⁻⁹ (a random-walk chain slider) was
**not** built. That station already has two live tools, one of which
(DPCalculator) answers the same question — chain length — with real inputs
rather than a toy. Adding a second, illustrative-only chain widget beside it
would have been decoration. Recorded as a deliberate omission, not an oversight.

## 3. What was preserved (verified, not assumed)

Every one of the five tools was **driven**, not merely rendered, via real
event dispatch in the browser:

| Tool | What was driven | Result |
| ---- | --------------- | ------ |
| StateSimulator | slider to 200 °C, then −100 °C | phase readout tracked ("Viscous melt flow" → "حالت شیشه‌ای و صلب") |
| DPCalculator | Mn 56 000, M₀ 28 | DPn 2 000 · Mw 112 000 g/mol · DPw 4 000 |
| BranchingSimulator | all three architecture buttons | active state and trend bands updated |
| TacticitySimulator | all three mode buttons | crystallinity/melting/clarity readouts updated |
| HansenSpace | search "water", add solvent, pointer-drag the scene | chips added, points plotted, axis geometry changed under rotation |

- **Family scoping** — branching select offers exactly `hdpe, lldpe, ldpe, pp`;
  tacticity select offers exactly `abs, pmma, pp, ps, pvc` (no PE grade).
  Unchanged behaviour.
- **Material seeding** — selecting HDPE in StateSimulator moved the slider
  range to −180…480 and produced `Tg: uncited · Td: uncited`. The illustrative
  note disappears only when a real material is bound. Honesty labelling intact.
- **URL state** — `/en/learn?material=ldpe#hansen` bound Hansen to LDPE
  ("Showing Low-Density Polyethylene's position, linked from its datasheet
  page"), drew the polymer marker, and listed 17 nearest solvents.
- **`#hansen` deep link** — `learn-bridge-map.ts` has always pointed the
  academic group at `#hansen` while the island owns `#hansen-space`. The
  station now carries an `#hansen` anchor, so that bridge link resolves for the
  first time. Small pre-existing bug, fixed in passing.
- Nothing in `web/src/islands/*`, `web/src/lib/learn/*` or `web/src/styles/learn.css`
  was edited. The concurrent Hansen transparency/grid work is untouched.

## 4. What broke during the build, and what was done

**The rail readout never updated.** The FE-0 prototype tracks the current
station with an `IntersectionObserver` on a sliver `rootMargin`, and the port
did the same. It reported nothing at any scroll offset. Investigation: in this
project's browser-automation pane the page is not painted, so neither
`IntersectionObserver` callbacks nor `requestAnimationFrame` ever run. The
observer was almost certainly fine in a real browser — but "almost certainly"
is not a gate, and there is a real-world version of the same state (a
backgrounded or occluded tab).

Replaced with a direct measurement: on scroll, find the last station whose top
edge is above a line 45% down the viewport, coalesced with a 60 ms timer rather
than rAF. This is correct from the first frame at any scroll offset, including
a restored scroll position or a hash arrival — which the observer version was
not, since it only fires on *entering* a band and every station is taller than
the band. Verified: readout and active tick track correctly through
monomer → chain → spherulite → lifecycle, and a rail-tick click calls
`scrollIntoView` on the right station with `behavior: smooth`.

**Rail ticks were 17 px wide on mobile.** 44 px tall but only as wide as the
dot plus its label, and the label is hidden below 900 px. Failed R30. Fixed:
`min-inline-size: 44px` on the tick and `--rail-w: 44px` (not 40) on narrow
viewports, so the rail column is at least one pointer target wide.

## 5. Gate results

| Gate | Result |
| ---- | ------ |
| `npm test` | **272 passed / 272** — unchanged, no test touched |
| `npm run check` (astro check, 130 files) | **0 errors, 0 warnings, 0 hints** |
| No horizontal overflow @ 320 / 375 / 768 / 1280 | **0 px** at all four. The tacticity and branching SVGs still overflow *their own* scroll wrappers by design; the page does not widen |
| Both themes | Light = blue-slate lab palette; dark = `#3E436F` indigo ground with amber `--act`. Both resolve entirely through `[data-surface="lab"]` tokens; no raw hex added |
| Both locales | `/en/learn` LTR, `/fa/learn` RTL — rail correctly on the right edge in Persian with no direction-specific CSS (logical properties throughout) |
| Console errors | None |
| Pointer targets | Rail ticks 44 × 44 |
| New dependencies | None |
| Strings | All user-visible text via `t()`; fa authored first, en mirrored; `t()` throws on a missing key at build |

## 6. Still open

- **Heading levels are flat.** A station heading is `<h2>` and so is each tool
  title inside it (`.learn-tool-title`, set by the islands). Nothing is
  skipped, so this is not a WCAG failure, but the tools *are* subordinate to
  their station and should be `<h3>`. Not changed here because it means editing
  five islands, which this restructure deliberately did not touch. Worth a
  small follow-up.
- **D51 (graph as a first-class tool) is not built** — no graph tool exists
  yet. The station model has room for it; a causal graph spans scales and would
  most likely sit at the chain or lamella station, or become a seventh
  "relationships" station. Undecided, deliberately.
- **D53 (notebook as the template for educational content) is not built** —
  there is no article to typeset yet. `.station-text` takes prose without
  redesign, which was the point of building this as a document rather than a
  menu.
- **D52 (map) remains deferred**, per the decision. Nothing here assumes it.
- The two gap stations stay gaps until the underlying data exists. Neither
  should be filled with an illustrative number.
- Verification of `IntersectionObserver`-class behaviour and of smooth
  scrolling could not be done in the automation pane (no frames are served).
  The scroll tracking was rewritten to be independent of frames; the
  `scrollIntoView` call itself was verified by spying on the call, not by
  watching the animation.

---

# FE-8 `learn-surface` — build and test, **PART 2: MATERIAL CONTEXT + THE MISSING FIGURES**

**Scope**: (1) a shared material-context hook so every Learn tool, not just
HansenSpace, defaults to the polymer a reader arrived from; (2) the FE-0
spec's required 10⁻⁹ live element, built for the first time; (3) real content
for the 10⁻⁶ station; (4) a sharpened, more specific gap note for the 10⁰
station. This is the foundation layer step 1 of 4 — MAP, GRAPH and NOTEBOOK
are separate, later units that will consume the same context hook.

**Why, in the owner's words:**

> "pay attention, when entering from a polymer datasheet, all defaults must
> be this polymer."

> "where are the figures and plots you talked about!"

The first quote is a correction to this same file's Part 1: the restructure
above got the STATION LAYOUT right but never touched tool internals, and at
that point only HansenSpaceIsland actually read `?material=` — StateSimulator,
DPCalculator, BranchingSimulator and TacticitySimulator all ignored the URL
param entirely and always opened on their illustrative default, no matter how
the reader arrived. The second quote overrides Part 1 §2's own recorded
decision to skip the FE-0 spec's required random-walk-chain slider ("Adding a
second, illustrative-only chain widget beside \[DPCalculator\] would have
been decoration") — that call is superseded here on explicit instruction, not
silently reversed.

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/lib/learn/material-context.ts` | **The shared context.** `useLearnMaterialContext()` — one hook, called identically by all five existing islands plus the two new ones: reads `?material=` once, fetches the live catalog once, resolves the slug against it. Exports `resolveBoundMaterial` (pure) and `LearnMaterialContext` for MAP/GRAPH/NOTEBOOK to reuse |
| `web/src/lib/learn/random-walk.ts` | Pure physics: seeded 2D freely-jointed random walk, Rg/end-to-end from the full chain, a same-seed-prefix bound (`REFERENCE_MAX_EXTENT`) that makes the render scale provably contain every DP in range |
| `web/src/lib/learn/spherulite-readout.ts` | Pure filter+sort: materials with BOTH a density and a crystallinity value, highest-crystallinity-first |
| `web/src/lib/learn/branching.ts` | +`chainTypeToArchitecture` — maps a material's real `chainType` onto one of the three PE architectures, `null` for anything that doesn't cleanly map (never guesses) |
| `web/src/islands/ChainCoilIsland.tsx` | New. The 10⁻⁹ station's required live element — DP slider (100–20 000), SVG coil, end-to-end/Rg readout |
| `web/src/islands/CrystallinityDensityIsland.tsx` | New. The 10⁻⁶ station's crystallinity ↔ density readout — a table, not a chart (see §3) |
| `web/src/islands/{Hansen,StateSimulator,DPCalculator,Branching,Tacticity}*Island.tsx` | All five rewired onto the shared hook; each now seeds itself from the bound material when eligible |
| `web/src/components/learn/scale-stations.ts` | `spherulite`'s `gapKey` removed (real content now exists); `lifecycle`'s gap text sharpened (see §3) |
| `web/src/components/learn/LearnScale.astro` | `ChainCoilIsland` added to the chain station (first, per the spec's "required" framing), `CrystallinityDensityIsland` added to the spherulite station |
| `web/src/styles/learn.css` | `.chain-coil-*` and `.spherulite-table*` rules — tokens only, both themes, no raw hex |
| `web/src/i18n/{fa,en}.json` | 32 new keys: `learn.chain.*` (10), `learn.spherulite.*` (9), plus a `boundNote`/`boundNoDataNote` pair for each of state/dp/tacticity and a `boundNote`/`boundArchitectureNote` pair for branching. fa authored first (R15), en mirrored — key sets verified identical (320/320) |

## 2. The shared material context

`material-context.ts`'s `useLearnMaterialContext()` returns
`{ status, materials, boundSlug, boundMaterial }`. It deliberately does
**not** decide whether a given tool should use `boundMaterial` — that stays
with each island, for two different reasons that must not be collapsed into
one shared rule:

- **Property scope** — does the material even have the data this tool needs?
  StateSimulator needs `.thermal`, DPCalculator needs `.molecular`,
  ChainCoil needs `.molecular` (to seed the slider), CrystallinityDensity
  needs both `.density` and `.crystallinity`. A bound material missing the
  property says so explicitly (a `boundNoDataNote`/`boundNoData`-shaped
  string per tool) rather than silently keeping the illustrative default as
  if it belonged to that material.
- **Family scope** — does the material belong to the tool's family at all
  (`lib/learn/family-scope.ts`, untouched). BranchingSimulator and
  TacticitySimulator seed by searching their OWN already-family-filtered
  `materials` list for the bound slug, never the hook's raw catalog — so an
  ineligible bound material (`?material=ldpe` on TacticitySimulator) simply
  isn't found and nothing is seeded. There is no second, unscoped path that
  could override that; scoping wins by construction, not by an extra check
  bolted on afterward.

Every seed is a one-time effect, guarded by a `useRef` flag (not `useState`,
so the guard itself never triggers a render), so a reader's own subsequent
picks are never overwritten once the catalog settles.

**BranchingSimulator's extra step**: when the bound material's `chainType`
maps cleanly onto one of the three PE architectures
(`chainTypeToArchitecture` — `linear_pure`, `branched_long_short`,
`linear_short_branched`), the architecture toggle is seeded too, with its own
note (`boundArchitectureNote`) that self-clears the moment the reader picks a
different architecture (the note's condition is "current architecture equals
what the bound material maps to", not a one-shot flag). PP's `isotactic`
chain type — a tacticity descriptor, not a branching one — deliberately maps
to `null` and leaves the toggle alone rather than guessing.

## 3. Data reality, checked against the live API before building anything

Per the brief's own instruction ("check what data actually exists ... rather
than assuming"), the running API (`polypedia-api`, started via
`preview_start` since it was not actually running despite the task
description — the `.claude/launch.json` config for it already existed) was
queried directly for all 17 materials:

| Property | Coverage | Used for |
| -------- | -------- | -------- |
| `physical.density` | 7 of 17 materials (hdpe, ldpe, lldpe, pp, pet, pvc, pmma) | Spherulite readout |
| `academic.crystallinity` | **3 of 17** (hdpe — unsourced, ldpe, pet) | Spherulite readout |
| `physical.co2_footprint_virgin` | **0 of 17** — registered as a property in the `physical` group, zero materials have a value | Lifecycle gap note |

This settled two decisions directly:

- **Spherulite (10⁻⁶) got a real table**, not a chart: three points is a
  table, and a scatter/trend-line over three points would spend more pixels
  implying a fitted relationship than the honest three-row comparison it
  actually is. Only materials with BOTH values are listed (`hdpe`, `ldpe`,
  `pet`) — a single-sided row would invite inferring a pairing that isn't in
  the data. The table states its own coverage ("3 of the 17 materials...")
  rather than leaving the gap implicit.
- **Lifecycle (10⁰) stayed a stated gap**, not a chart. The prior gap text
  was already honest ("no measured emissions or production-energy data") but
  generic; it now names the actual registered-but-empty property
  (`co2_footprint_virgin`) by key, per the brief's explicit instruction —
  "say so in the station the way the existing empty stations state their
  reason."

## 4. The chain coil (10⁻⁹, required live element)

`random-walk.ts`: a seeded freely-jointed 2D random walk (mulberry32 PRNG, no
new dependency), bond length = 1 unit, uniform random turn angle per step.
Reported in **bond lengths**, never nanometres — this is an idealised chain
with no bond-angle constraint or excluded volume, and converting it precisely
to nm for a real material would be an invented number (R5). The variance note
(`learn.chain.varianceNote`) says outright that `Rg ∝ √N` is an ensemble law,
not a smooth curve for one realization — verified true of the chosen seed
(Rg plateaus around N≈2 000–14 000 before resuming growth toward N=20 000),
and left as-is rather than seed-shopped into looking smoother than a single
random walk actually is.

The render scale is fixed, not re-fit per DP: `REFERENCE_MAX_EXTENT` is the
farthest excursion of the DP=20 000 walk under the default seed, computed
once at module load. Because `generateRandomWalkChain(dp, seed)` for a fixed
seed is an exact PREFIX of the walk at any larger DP (same PRNG stream,
consumed to different lengths), this one number is a proven upper bound for
every DP in range — not a guessed safety margin. This is also what produces
the "denser coil" cue: since the drawn area doesn't grow to fit each DP, more
bonds simply get packed into the same visual box as DP rises.

Seeding: when a material with real `.molecular` (Mn + repeat-unit molar
mass) is bound, the slider starts at that material's real DPn (`computeDP`
from `dp.ts`, reused rather than re-derived) — verified live: arriving from
HDPE's datasheet seeded the slider to 1 159 (displayed as 1 150, the nearest
50-step the browser's native range-input value sanitisation snaps to),
identical to DPCalculator's own DPn for the same material.

## 5. Verification — driven, not just rendered

The API was not actually running (`localhost:3001` refused connections from
both Bash and the browser pane) despite the task description saying it was;
started via `preview_start('polypedia-api')` — a browser tool, not Bash, per
the task's own constraint — using the `polypedia-api` entry already present
in `.claude/launch.json`.

| Check | Result |
| ----- | ------ |
| `?material=hdpe` | ALL applicable tools opened on HDPE: State (Tg/Td uncited note), DP (Mn 32 500, M₀ 28.05, boundNote), Branching (architecture auto-set to Linear, boundArchitectureNote), Hansen (unchanged — already worked), ChainCoil (DP seeded 1 159→1 150), CrystallinityDensity (HDPE row highlighted). Tacticity correctly showed "None selected" — HDPE is not in its scoped list |
| `?material=ldpe` | Same five tools seeded to LDPE; Branching architecture auto-set to **Long-chain branched**; Tacticity's `<select>` options confirmed to be exactly `['', abs, pmma, pp, ps, pvc]` — no `ldpe` present, nothing force-seeded |
| no param | Every select empty, ChainCoil at `DEFAULT_DP=2000`, spherulite table unhighlighted, zero `bound-note` testids present, illustrative labelling text confirmed present and unchanged |
| `?material=nonsense` | Identical to no-param — zero bound-note testids, no thrown error, no console error, no "error" string in the rendered page (only this feature's own honest "...not an error" copy, checked directly) |
| DP slider physics | Real `input`-event dispatch (native value-setter trick, since React ignores a plain DOM `.value` write) to 100 / 5 000 / 20 000: end-to-end/Rg exactly matched an independent Node re-implementation of the same algorithm at each point (e.g. dp=20 000: Rg 60.5, end-to-end 155.6); rendered path's bounding box stayed inside the 300×260 viewBox at DP=20 000 (x 132–261, y 53–137), confirming `REFERENCE_MAX_EXTENT` actually bounds the walk in the browser, not just on paper |
| Overflow | 0px at 320 / 375 / 768 (`document.documentElement.scrollWidth − clientWidth`, all three); the new spherulite table wrapper correctly scrolls internally (`overflow-x: auto`) rather than widening the page; ChainCoil's SVG scales fluidly (Hansen's own pattern) and never appeared in the overflow-offender scan at any width |
| Both themes | `/fa/learn?material=hdpe` in dark: `--bg:#3e436f`, `--act:#ffc199` — the lab dark palette, confirmed via the real theme-toggle button (not just `prefers-color-scheme`, which this app's toggle overrides with a stored preference) |
| Both locales | `/fa/learn?material=hdpe`: RTL, every new string translated, HDPE-seeded identically to English (DP 1 159, Branching auto-selected "خطی (شبیه HDPE)", spherulite table with real fa material names) |
| Datasheet round trip | Followed `LearnBridge.astro`'s real rendered link (`/en/learn?material=hdpe#hansen`) from `/en/m/hdpe`'s live DOM — not a hand-typed URL — no console errors |
| Console errors | None, on any of the above pages, in a fresh tab. (A stale tab reused across many edits accumulated a genuinely confusing Vite HMR error from an earlier, mid-edit state of `HansenSpaceIsland.tsx` — resolved by opening a fresh tab; not a defect in the shipped code, confirmed by `astro check` and by every subsequent fresh-tab load being clean) |
| `npm test` | **301 passed / 301** (272 baseline + 29 new: 5 material-context, 16 random-walk, 5 spherulite-readout, 3 branching chainTypeToArchitecture) |
| `npm run check` (astro check) | **0 errors, 0 warnings, 0 hints**, 138 files |

## 6. Judgement calls made without stopping to ask

- **Seeding is a default, not a lock.** Every seeded tool still lets the
  reader change the selection afterward (unlike, e.g., forcing the picker to
  disappear). This matches the owner's own wording ("all **defaults** must be
  this polymer") without adding a second, more restrictive behaviour nobody
  asked for.
- **The chain coil shows the reader's own material's real DPn as a seed, not
  a note-only mention.** Not required by either owner quote directly, but it
  is the same "defaults must be this polymer" principle applied consistently
  — the alternative (only DPCalculator seeds, ChainCoil always starts
  illustrative) would have left one tool on the page silently exempt.
- **Spherulite is a table, not a chart**, given three data points — see §3.
  A scatter/bar chart was considered and rejected as implying more precision
  than three honestly-sparse rows support.
- **The pre-existing `co2_footprint_virgin`/carbon-footprint gap text was
  sharpened, not replaced with a chart of any kind** — confirmed via direct
  API query that the property is registered but has zero values across the
  entire catalog, exactly the case the brief warned about.
- **The monomer-name display bug** (`DPCalculator`'s provenance note shows
  "اتیلن (Ethylene)" verbatim even on the English locale) is pre-existing —
  `fetch-learn-materials.ts`'s `toLearnMaterial()` already set both
  `monomerNameFa` and `monomerNameEn` to the same raw `valueText` before this
  unit touched the file, because the underlying `academic.monomer_name`
  property has no separate fa/en fields. Left as-is: out of scope for a
  material-context/figures task, and a data-modelling question (one field vs.
  two) rather than a Learn-surface bug.
- **`.learn-reset` (35px tall) is below the 44px pointer-target rule (R30)**
  — confirmed pre-existing (State's and DP's own reset buttons measure the
  same, unrelated to anything added here) and reused as-is for ChainCoil's
  reset button for visual consistency; not fixed here since it would change
  every reset button on the surface, out of scope for this task's "do not
  restructure" instruction.

## 7. Still open

- The pointer-target and monomer-name-locale items above are real, small,
  pre-existing issues outside this task's scope — worth their own follow-up.
- MAP, GRAPH and NOTEBOOK (this unit's steps 2–4) have not been built. They
  are expected to import `useLearnMaterialContext` from
  `lib/learn/material-context.ts` directly rather than re-deriving the
  URL-read/fetch/resolve logic.
- The chain coil's Rg plateau (§4) is real single-realization physics, not a
  smoothing opportunity — flagged in case a future reviewer wants an
  ensemble-averaged number instead of a single seeded path; that would be a
  different, more expensive tool (many walks per DP), not a bug fix.
