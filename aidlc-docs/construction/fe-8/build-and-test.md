# FE-8 `learn-surface` — build and test, **STEPS 1 AND 3**

> **Reading order**: §1–§5 below are step 1's record, written when it was the
> only step done, and are left as written. **Step 3's record is appended at
> the end of this file.** Step 2 is not here — it is blocked on data and is
> documented separately in `step-2-data-requirements.md`.

**Unit**: FE-8, per `inception/plans/frontend-plan.md` §5. The second surface
(D2): twelve tools ported as islands, each declaring its data dependencies
(R7) and rendering nothing when they are unmet.

**This document covers STEP 1 of 5 and nothing else.** The unit was
deliberately cropped into steps at the owner's request, to keep each review
small. §4 lists what remains.

**Owner's sequencing instruction, which set this step's scope:**

> "in the learning env we have some constant stuff for all polymer, also some
> are sppicific to each family and goveern teher, and some are specific to
> one material… first make the universal ones, and also the ones we already
> have the code for or are easy to make and there is a similar thing
> elsewhere to get ideas from."

Step 1 is therefore the shell plus the tools that are **universal** (they
teach a mechanism true of every polymer) **and** already exist in the legacy
prototype **and** need no curated per-material data to be useful.

---

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/pages/{en,fa}/learn.astro` | The Learn routes. Pass `surface="lab"` to BaseLayout — this is what flips the whole design system (D37) |
| `web/src/islands/StateSimulatorIsland.tsx` | Temperature → physical-state simulator (glassy → rubbery/semi-crystalline → melt → degradation) |
| `web/src/islands/DPCalculatorIsland.tsx` | Degree-of-polymerisation calculator (DPn, Mw, DPw) |
| `web/src/styles/learn.css` | The lab surface's own stylesheet, imported by `global.css` |
| `web/src/i18n/{en,fa}.json` | 37 `learn.*` keys, both locales, verified in sync |

Ported **from** the frozen legacy prototype at the repo root
(`src/components/StateSimulator.tsx`, `DPCalculator.tsx`) — read for physics
and teaching intent, rebuilt against this project's tokens, i18n and island
conventions. The prototype was not edited.

`web/src/components/learn/` was created empty and has been **removed**: both
tools live entirely in their own islands, and an empty directory in the tree
is a false signal to whoever builds step 2.

## 2. Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (105 files) |
| `vitest run` | **208/208** (up from 183 — ~25 new tests) |
| `astro build` | **80 pages** (up from 78: the two Learn routes) |
| Both islands hydrate, `/en/learn` | `astro-island` innerHTML 3158 and 2117 chars |
| Both islands hydrate, `/fa/learn` | 3089 and 2049 chars |
| D37 surface inversion | `data-surface="lab"` on `<html>`; body background `rgb(233,238,244)` vs the datasheet's `rgb(249,246,239)` |
| R34 temperature ramp is its own scale | `--ramp-glass=#3f63ab`, `--ramp-rubber=#2f8a83`, `--ramp-melt=#b57728` — resolved live, and none of them is one of D36's five status hues |
| RTL | `/fa/learn`: `dir="rtl"`, `lang="fa"`, title `محیط یادگیری — پلی‌پدیا`, real Persian copy in both tools |
| Console errors | none |
| No horizontal overflow | `scrollWidth === clientWidth` at 1280 (1265/1265) and at **320 in RTL** (320/320) |

### Learn route JS, gzipped

| Chunk | gz |
| ----- | -- |
| `client.*.js` (react-dom hydration runtime, shared with search/compare) | 56.3 kB |
| `jsx-runtime` | 7.8 kB |
| `react` | 2.9 kB |
| `StateSimulatorIsland` | 1.8 kB |
| `DPCalculatorIsland` | 1.3 kB |
| `fetch-learn-materials` | 0.5 kB |
| **Total** | **68.9 kB** |

Judged against §6's **Learn** row, which is explicitly **unbounded**
("loads on navigation, with a real progress state"). It is comfortably under
even the Datasheet row's 80 kB. **The two tools contribute 3.1 kB between
them**; everything else is the shared React runtime the site already pays for
on `/search` and `/compare`. No heavy library is present, so R24's
build-failure condition (Three.js or Chart.js outside Learn) is not
approached — and when steps 4–5 do bring one in, Learn is where it is allowed.

## 3. The physics was verified by hand, not assumed

Both tools compute; neither was accepted on the basis that it rendered.

**DPCalculator** — driven through the real inputs, results read from the DOM:

| Mn | M0 | DPn expected | DPn shown | Mw shown | DPw shown |
| -- | -- | ------------ | --------- | -------- | --------- |
| 50,000 | 28.05 (ethylene repeat unit) | 1783 | **1,783** | 100,000 | **3,565** |
| 100,000 | 100 | 1000 | **1,000** | 200,000 | **2,000** |

DPw is derived as `Mw / M0` (3,565), **not** as `DPn × PDI` (3,566). That is
the correct derivation and the one-unit difference is the evidence it was
done properly rather than approximated.

**StateSimulator** — the temperature slider (−150 … 380 °C) driven across
every threshold, phase readout captured at each stop. Against the
illustrative defaults (Tg −20, Tm 130, Td 300):

| Temp | Phase reported |
| ---- | -------------- |
| −100 °C, −30 °C | Glassy, rigid |
| 20 °C, 100 °C | Segmental motion, crystallites still load-bearing — "the polymer's main service range" |
| 200 °C | Viscous melt |
| 350 °C | Thermal degradation — scission, depolymerisation |

All four transitions fire on the correct side of their threshold.

**Both tools seed from the database when a material has real values and fall
back to illustrative defaults otherwise** — which is why they belong in step
1. `mn`/`mw` have only 3 values each in the whole database, so a DP
calculator that *required* curated data would render nothing for 6 of 7
materials. R7 is honoured per-dependency rather than per-tool.

## 4. What remains — steps 2 to 5

| Step | Scope | Blocked? |
| ---- | ----- | -------- |
| 2 | Data-driven universal tools: stress–strain chart, market-share chart | **PARTLY — twice corrected, see below.** Stress–strain is **buildable**: 4 of 5 curve anchors exist and are cited (`young_modulus` 8/6 cited, `tensile_strength` @ yield 7/7 and @ break 4/4, `elongation_at_break` 10/8); only yield *strain* is absent and it is derivable as σy/E. Market-share is **blocked**: all 8 `market_share_datum` rows are `unsourced` with NULL `year`, NULL `region`, NULL `segment_en`. Full requirements, CSV formats and the yield-encoding rules are in `step-2-data-requirements.md`. No code written yet |
| 3 | Family-specific: branching (polyolefins), tacticity (styrenics/vinyls/acrylics + PP), alloying | **DONE** — branching and tacticity shipped; alloying deliberately declined. See the step 3 record appended at the end of this file |
| 4 | Heavy 3D: molecular viewer, Hansen solubility space | Partly — `hansen_d/p/h` have **2 values each**; the Hansen chart will render for almost nothing |
| 5 | Quiz, processing-window simulator, LCA | **YES — `quiz_question` is 0 rows and `material_process` is 0 rows.** These are content/data gaps, not code gaps. G4 and G5 were marked delivered because the *tables* shipped; nothing populated them |

Step 5's blockage is the same failure pattern recorded in `frontend-plan.md`
§14 for manufacturers: a gap table marked "✅ Done" on the strength of a
migration, when the reader can still see nothing. Worth checking the
remaining gap-table rows the same way before trusting them.

## 5. Verification caveat, stated plainly

The Browser pane in this environment **does not composite frames**.
Screenshots fail, and `requestAnimationFrame` does not fire — so CSS
transitions read as stuck at their start value even when correct.

Everything above was therefore measured via `javascript_tool` DOM/CSSOM
queries and by driving the real inputs with dispatched events, **not seen**.
The numbers, the phase transitions, the hydration, the RTL and the overflow
checks are all real measurements. **The visual design of the lab surface has
not been looked at by anyone.** Given D37 makes the contrast between the two
surfaces the identity of the site, that review is worth doing before step 2.

One trap this environment sets, recorded because it has already misled two
agents in this project: `document.documentElement.clientWidth` reports **0**
until the viewport is explicitly resized, which makes
`scrollWidth === clientWidth` look like a horizontal-overflow failure when
there is none. Resize first, then measure.

---

# STEP 3 — the family-specific simulators (this document's step-1 record
above is unchanged; this section only adds to it)

**Scope**: the two FAMILY-SPECIFIC conceptual simulators, ported IN CONCEPT
(not verbatim) from the frozen legacy prototype: `BranchingSimulator` (chain
architecture → packing → crystallinity/density, scoped to `polyolefins`) and
`TacticitySimulator` (stereochemistry → crystallinity/Tm/clarity, scoped to
materials with a substituted, stereogenic backbone carbon). `AlloyingSimulator`
was evaluated and **deliberately not built** — see §3.

Out of scope, untouched: stress–strain and market-share (step 2, see
`step-2-data-requirements.md`), the quiz, processing-window, LCA, molecular
viewer, Hansen chart.

## 1. What was built

| File | Role |
| ---- | ---- |
| `web/src/lib/learn/family-scope.ts` | The R7 gate for both tools: `materialHasBranchingRelevance`, `materialHasTacticity` |
| `web/src/lib/learn/branching.ts` | Pure trend model + schematic branch geometry for BranchingSimulator |
| `web/src/lib/learn/tacticity.ts` | Pure arrangement classifier + trend model for TacticitySimulator |
| `web/src/islands/BranchingSimulatorIsland.tsx` | The island |
| `web/src/islands/TacticitySimulatorIsland.tsx` | The island |
| `web/src/lib/learn/fetch-learn-materials.ts` | Extended (not replaced): `LearnMaterial` now also carries `family`, `chainType`, `density`, `crystallinity` — additive, step 1's `thermal`/`molecular` fields untouched |
| `web/src/i18n/{en,fa}.json` | 54 new `learn.*` keys (37 → 91), both locales, verified in sync (`en`↔`fa` key-set diff: empty both directions) |
| `web/src/styles/learn.css` | New `.branching-*`/`.tacticity-*` rules only — step 1's rules untouched |
| `web/src/pages/{en,fa}/learn.astro` | Two more `client:load` islands appended after DPCalculatorIsland |

Ported IN CONCEPT from `src/components/{BranchingSimulator,TacticitySimulator,
AlloyingSimulator}.tsx` at the repo root (frozen, not edited) — the mechanism
each teaches is the same; the interaction and the specific numbers are not
(see §2's per-tool notes for what changed and why).

## 2. The scoping decision, per tool — why the science says what it says

### BranchingSimulator → family key `polyolefins`, no exception

Branching genuinely applies to all four current members: HDPE (essentially
linear), LDPE (long-chain branched), LLDPE (short-chain branched), and PP
(comonomer/copolymer branching, the tool's secondary note, not its core
teaching). This is a clean, homogeneous family-key gate — exactly the model
the brief's FAMILY DATA section describes.

**The LDPE-vs-LLDPE distinction, stated precisely and enforced in code**
(`lib/learn/branching.ts`):

- **HDPE** = `linear` architecture → high packing/crystallinity/density.
- **LDPE** = `longChainBranched` → high-pressure, free-radical
  polymerisation, intramolecular chain transfer ("backbiting") → a few
  long, irregular branches → **low** packing/crystallinity/density.
- **LLDPE** = `shortChainBranched` → a deliberate alpha-olefin comonomer
  (butene/hexene/octene) copolymerised in, a **different polymerisation
  route entirely, not a lesser degree of the same one** → many short,
  regular branches → **medium** packing/crystallinity/density, distinct
  from and never equal to LDPE's band.

The legacy component's single continuous "branch amount" slider (2–30,
mixing SCB and LCB on one axis) was deliberately **not** ported — a
continuous axis cannot represent "different branch type from a different
route," only "more of the same thing," which is the exact blur the brief
flagged as the most commonly botched fact here. Step 3 replaces it with a
discrete choice between the three real architectures.

The one real-data grounding available (density, cited for all four
polyolefins; crystallinity, cited for LDPE only) is shown only in a
separately bordered "compare with a real material" panel using the API's own
`display` string and `uncited` note — never mixed into the schematic
low/medium/high trend bars, which carry no unit or number at all.

### TacticitySimulator → NOT a clean family-key gate; the one documented exception

Ethylene (`CH2=CH2`) is symmetric and has no stereocentre — tacticity is
scientifically meaningless for HDPE/LDPE/LLDPE, and the tool must not offer
them. Propylene (`CH2=CH(CH3)`) does have one, so PP qualifies. Both HDPE and
PP carry `family.key === 'polyolefins'`, so — unlike branching — this **cannot**
be a family-key-only gate without either wrongly showing the tool for the PE
grades or wrongly hiding it from PP.

`lib/learn/family-scope.ts`'s `materialHasTacticity` therefore uses: family
key in `{styrenics, vinyls, acrylics}` (homogeneous — every current member of
each has a substituted stereocentre: ABS, PS, PVC, PMMA) **plus one
documented exception** — `family.key === 'polyolefins' && slug === 'pp'`.
This is the single deliberate departure from "scope by family key, not
material slug" in the whole step, and it is deliberate *because* the
commercial-family taxonomy groups a symmetric-monomer polymer with an
asymmetric-monomer one under "polyolefins," which chain-architecture teaching
doesn't care about but stereochemistry teaching does. The file header
explains this at the point of use; nothing about the exception is implicit.

**Confirmed empty for the polyethylenes, non-empty for PP** — measured in
the DOM (§4), not assumed from the code.

The legacy component's per-material numeric crystallinity/Tm **ranges**
("iPP نیمه‌بلوری ۵۰–۷۰٪", "sPS ۲۷۰°C", ...) were **not** ported: they read
exactly like the site's real cited datasheet numbers but carry no citation,
which is the trap the brief's §C names directly. Step 3 renders only
relative bands (none/low/medium/high, none/present, clear/hazy/opaque) with
no unit attached.

## 3. AlloyingSimulator — evaluated, deliberately not built

The brief's instruction was explicit: build it only if it lands cleanly once
the first two exist, and say so and stop at two rather than ship a weak
third. It does not land cleanly, for reasons specific to what the legacy
component actually does, not a time-boxing excuse:

1. **It hardcodes exactly two materials** (`polymer.id === 'abs'` /
   `'pp'`, `return null` otherwise) and computes blend properties with
   linear/sinusoidal formulas dressed as real data — attributed to named
   standards (`ISO 11469`, `ASTM D6762`, `ISO 527`, `ISO 180`) and named
   commercial alloys (PC/ABS, PP/EPDM) — in the exact numeric/typographic
   register the site's real cited datasheet values use. That is precisely
   the invented-number-in-the-real-register trap the brief's §C warns
   against, and unlike Tacticity's legacy ranges, it cannot be defused by
   switching to qualitative bands: the whole component's content **is**
   those four specific numbers per blend ratio.
2. **Miscibility is a pairwise property, not a family property.** Branching
   and tacticity both reduce to a small number of family-scoped mechanism
   states (3 architectures; 3 arrangements) that a discrete selector can
   represent without inventing a number. Blend behaviour depends on the
   *specific pair* of polymers — their thermodynamic miscibility,
   interfacial adhesion, compatibilizer chemistry — which has no home in
   `family.key` (a property of one material, not of a pair) and no small
   discrete state space the way the other two do.
3. Making it honest would mean discarding essentially all of the legacy
   component's content and inventing a new, generic, numberless
   miscibility-teaching mechanism not actually present in the prototype —
   which is a new design exercise, not a port, and outside what "ported
   from the legacy prototype" means for this step.

**Decision: stop at two.** BranchingSimulator and TacticitySimulator are the
step-3 deliverable. Alloying/blending remains undelivered, same "documented
gap, not an oversight" posture the rest of this file uses for step 2 and 5.

## 4. Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (113 files) |
| `vitest run` | **232/232** (up from 208 — 24 new tests: 7 family-scope, 8 branching, 9 tacticity) |
| `astro build` | **80 pages** (unchanged — no new routes, both tools live on the existing `/en/learn` and `/fa/learn`) |
| Family scoping, measured in the DOM (`/en/learn`, built preview server) | `branching-material-select` options: `hdpe, lldpe, ldpe, pp`. `tacticity-material-select` options: `abs, pmma, pp, ps, pvc`. **HDPE/LDPE/LLDPE are absent from the tacticity picker; PP is present in both** |
| Branching trend, all three architectures driven live | `linear` → packing/crystallinity/density all `high` (92% bar). `longChainBranched` (LDPE) → all `low` (25% bar). `shortChainBranched` (LLDPE) → all `medium` (60% bar) — **never equal to LDPE's band** |
| Branching real-data panel, LDPE selected | `Density: 0.915 - 0.935 g/cm³` (cited), `Crystallinity: 45 - 59 %` (cited) — API's own `display` string, not recomputed |
| Tacticity trend, all three arrangements driven live | `atactic` → crystallinity `none`, melting `none — fully amorphous`, clarity `clear`. `isotactic` → `medium`/`present`/`hazy`. `syndiotactic` → `high`/`present`/`opaque` |
| Tacticity manual interaction | Starting from the isotactic preset, clicking the 8th side-group unit reclassifies live to `atactic` (crystallinity readout flips from `medium` to `none` with no page reload) |
| RTL, `/fa/learn` (built preview server) | `dir="rtl"`; both new tools present with real Persian copy (`شبیه‌ساز شاخه‌داری زنجیر`, `شبیه‌ساز تاکتیسیته`); material-select options rendered in Persian |
| Dark mode | Toggled live; both tools survive the swap; body background resolves to D41's Learn dark base `rgb(62, 67, 111)` (`#3E436F`) |
| No horizontal overflow | `scrollWidth === clientWidth` at 320 (320/320), 375 (375/375), 768 (753/753), 1440 (1425/1425) — 320 and 768 measured in `/fa/learn` RTL |
| Console errors | none, either locale |
| `--ramp-*` usage in step-3 CSS/TSX | none (`grep` confirms) — R34: the ramp scale stays reserved for StateSimulator's temperature encoding |
| `transition: all` in `learn.css` | none (`grep` confirms) — R35 |
| i18n key parity | `en.json` ∖ `fa.json` = ∅, `fa.json` ∖ `en.json` = ∅ (229 keys each after step 1+3 combined... see note below) |

Note on the last row: the coordinator's status check reported 91 `learn.*`
keys after step 3 (37 from step 1 + 54 new); the file-level parity check
above counts all keys in each JSON file (229), not just the `learn.*`
subset — both counts agree with each other once scoped the same way, and
both directions of the diff are empty either way.

### Learn route JS, gzipped (built preview server, `npm run build` + `npm run preview`)

| Chunk | gz |
| ----- | -- |
| `client.*.js` (react-dom hydration runtime, shared with search/compare) | 55.0 kB |
| `jsx-runtime` | 10.5 kB |
| `react` | 2.8 kB |
| `react-dom` | 1.3 kB |
| `StateSimulatorIsland` | 1.7 kB |
| `DPCalculatorIsland` | 1.2 kB |
| `BranchingSimulatorIsland` | 1.7 kB |
| `TacticitySimulatorIsland` | 1.6 kB |
| `fetch-learn-materials` | 0.5 kB |
| `family-scope` | 0.1 kB |
| **Total** | **76.5 kB** |

**Delta vs step 1's 68.9 kB: +7.6 kB.** The two new islands themselves are
only 3.3 kB combined (in the same range as step 1's two islands at 3.1 kB).
The rest of the delta (≈4.3 kB) is Rollup/Vite re-splitting the shared
`react`/`react-dom`/`jsx-runtime` chunk boundaries now that four islands
import them instead of two, plus the new `family-scope` module and the
grown `fetch-learn-materials` module (extra fields, same file) — not
duplicated framework code. Still comfortably inside Learn's explicitly
**unbounded** budget (§6 of the frontend plan), well under even the
Datasheet route's 80 kB ceiling for scale.

## 5. What remains — unchanged from step 1's §4, plus this step's own gap

Steps 2, 4 and 5 are exactly as step 1 left them (`step-2-data-requirements.md`
now corrected per the coordinator's note: `young_modulus` does exist and
stress–strain is mostly unblocked — step 3 did not touch that document or
its tools). Step 3 adds one new documented gap of its own: **AlloyingSimulator**
(§3 above) — not a data gap, a scientific-honesty gap in the legacy
component's own content, and not scheduled to be revisited under the current
family-scoped, numberless-schematic model this unit has adopted.

## 6. Verification caveat, same posture as step 1

This environment's Browser pane does not composite frames and its `astro
dev` server exhibited a session where React hydration never committed
(`astro-island` elements stayed at `innerHTML.length === 0` for every
island, including step 1's untouched `StateSimulatorIsland`/`DPCalculatorIsland`,
confirmed by comparing against `CompareIsland` on `/en/compare`, also
untouched by this step) — a dev-server/pane interaction, not a regression:
the **built** app, served via `npm run build` + `npm run preview` (port
4330), hydrates correctly and reproducibly, with `StateSimulatorIsland`/
`DPCalculatorIsland`'s `innerHTML.length` (3158/2117) matching step 1's
originally reported numbers exactly. All measurements in §4 above were taken
against that built preview server, via `javascript_tool` DOM/CSSOM queries
and dispatched events — not screenshots, not the dev server.

---

## Coordinator verification of step 3, 2026-08-13

Independently re-checked rather than accepted on report, because the family
scoping is the whole risk of this step and it is a *science* claim, not a
code one.

| Claim | Verified how | Result |
| ----- | ------------ | ------ |
| Tacticity excludes the polyethylenes | Read the material picker's options out of the live DOM | Offers `abs, pmma, pp, ps, pvc`. **`hdpe`/`ldpe`/`lldpe` absent** |
| Branching covers the polyolefins | Same | Offers `hdpe, lldpe, ldpe, pp` |
| LDPE and LLDPE are distinct states, not points on one slider | Clicked each architecture, read the trend bars | Three discrete controls: `branching-arch-linear`, `-longChainBranched`, `-shortChainBranched` |
| The trend ordering is scientifically right | Measured rendered bar widths | linear **217.9px** > shortChainBranched **137.8px** > longChainBranched **65.9px** — i.e. HDPE > LLDPE > LDPE for packing/crystallinity/density. Correct |
| The causes are stated correctly | Read the rendered descriptions | Linear: "coordination-catalysed, low-pressure". LDPE: "high-pressure, free-radical … backbiting … long, irregular branches". LLDPE: "deliberate alpha-olefin comonomer (butene, hexene or octene) — **NOT long-chain branching, a different route entirely**" |

All four islands hydrate on the production build (3158 / 2117 / 3954 / 5949
chars). The science is right and the distinction the brief singled out as
"the single most commonly botched fact in this area" is stated explicitly
rather than merely avoided.

### One reservation, not a defect

The three trend bars — packing, crystallinity, density — render **identical
widths** for a given architecture (all 217.85px for linear, all 65.94px for
long-chain branched, and so on). The three quantities are strongly
correlated in the polyethylenes, so this is defensible for a schematic, but
three bars of identical length imply they are one quantity drawn three
times. Either differentiate them or collapse them into a single "packing
efficiency" indicator. Worth an owner design opinion; not worth blocking on.

### The dev-server hydration quirk recurred

Step 3's agent reported that islands do not hydrate on `astro dev` and
verified against the production build instead. **I reproduced this on a
freshly started dev server**: all four islands report 0 chars of content on
:4321 while rendering fully on the :4330 production preview.

This is the same symptom investigated earlier and attributed to a stale
long-lived dev process (see `fe-7/build-and-test.md` §2). That explanation is
now **insufficient** — a fresh process shows it too. The root cause is still
open. It does not affect what ships, but it does mean **every Learn tool must
be verified against `npm run build` + `npm run preview`, not `astro dev`**,
until someone gets to the bottom of it.

---

## Both owner-review items fixed, 2026-08-14

### 1. The three trend bars were identical — fixed, and it was hiding real science

The model gave all three columns one band per architecture, so packing,
crystallinity and density rendered at the same width and read as one quantity
drawn three times.

The deeper problem was that the simplification was **wrong**. Across the PE
family these do not track together:

| | crystallinity | density |
| --- | --- | --- |
| HDPE | ~70–80 % | ~0.941–0.965 |
| LLDPE | ~35–55 % | ~0.915–0.940 |
| LDPE | ~45–55 % | ~0.910–0.935 |

**LLDPE is typically LESS crystalline than LDPE** — its many short comonomer
branches disrupt lamellar growth very efficiently — **yet DENSER**, because
LDPE's long-chain branching creates more free volume. Which property is
depressed differs between the two, and a shared band made that invisible.

`BranchingTrend` now carries `{ band, level }` per column, `level` being a
0–1 schematic magnitude from the midpoints above. Verified rendering:

| Architecture | packing | crystallinity | density |
| --- | --- | --- | --- |
| linear (HDPE) | 88 % | 75 % | 76 % |
| longChainBranched (LDPE) | 41 % | **54 %** | **38 %** |
| shortChainBranched (LLDPE) | 62 % | **50 %** | **45 %** |

Two new tests pin this: one asserts the LDPE/LLDPE inversion in both
directions, one asserts no architecture ever renders all three columns at one
magnitude. 233/233 passing.

### 2. The dev-server hydration mystery — root cause found, and it was mundane

Three separate investigations (two agents and me) concluded that islands "do
not hydrate on `astro dev`", and one gate record blamed a stale dev process.
**All of it was wrong.**

**The API was not running.** The Learn islands fetch material data on mount;
with `:3001` down the browser logged `ERR_CONNECTION_REFUSED` and the islands
rendered nothing at all. Every "dev server is broken" observation was made
with the API stopped — and the production-preview comparisons that "proved"
it were run at times the API happened to be up.

Verified: with the API running, all four islands hydrate on `astro dev`
(3158 / 2117 / 3954 / 5949 chars), and `/en/search` hydrates too (42,595).

Two lessons worth keeping:

1. **Check the dependency before blaming the framework.** "The framework is
   broken" was reached three times without anyone checking whether the
   service the code fetches from was up.
2. **This is also a real robustness gap.** R4 defines four states — loading,
   error, empty, data — and an unreachable API should render the *error*
   state, not a blank tool. The islands currently render nothing. Worth
   fixing in FE-9 hardening; a reader whose network blips should not get an
   invisible page.

The earlier claim in `fe-7/build-and-test.md` §2 attributing this to a stale
dev process is superseded by this entry.

---

# STEP 4 — the solvent datasheet + the Hansen solubility-space visualisation
(steps 1 and 3's records above are unchanged; this section only adds to them)

**Scope**: two deliverables, one shared dataset.

1. A new site surface, **not part of Learn**: `/solvents`, a searchable/
   sortable reference table over every row `GET /api/solvents` returns —
   Hansen parameters (δD/δP/δH) and molar volume for each solvent. Owner's
   brief: *"i want a solvent page too as a datasheet of solvents (all in
   one) we will deepen it later, lets begin with all we have on this pdf
   about them and show this."* One flat table, no per-solvent route (that
   is the deferred "deepen it later" part).
2. Step 4 of the Learn unit itself: **HansenSpaceIsland**, which plots every
   solvent in Hansen space and, only when a polymer genuinely has all three
   of its own parameters, that polymer's marker plus a ranked "closest
   solvents" list.

Both were built against a live, concurrently-populated table — see §5 for
what that looked like in practice.

## 1. What was built

| File | Role |
| ---- | ---- |
| `api/src/routes/solvents.ts` | `GET /api/solvents` — every solvent row, unpaginated, with a `cited` boolean derived from `evidence.subject_type = 'solvent'` |
| `api/src/server.ts` | Registers the new route (additive; no existing route's response shape touched) |
| `api/test/api.test.ts` | 5 new tests (`GET /api/solvents` shape, real-row-count honesty, per-row typing, DB-collation-matched sort order, a real cited solvent reports `cited: true`) |
| `web/src/lib/solvents/types.ts`, `fetch-solvents.ts` | This unit's own fetch wrapper, mirroring FE-7's `components/sources/fetch-sources.ts` precedent (DataBoundary's real error/retry state while the table is mid-import, not a stub) |
| `web/src/islands/SolventsIsland.tsx` | The datasheet table: search, per-column sort, and manual row virtualisation (§3) |
| `web/src/pages/{en,fa}/solvents.astro` | The `/solvents` routes, datasheet surface (not `surface="lab"` — this is a reference table, not a teaching tool) |
| `web/src/styles/solvents.css` | `.sv-*` rules; reuses `sources.css`'s `.src-mark-cited/-uncited` directly for provenance rather than duplicating it |
| `web/src/components/chrome/SiteHeader.astro` | New nav entry, `/solvents`, between Learn and Sources |
| `web/src/lib/learn/hansen-space.ts` (+ `.test.ts`, 13 tests) | Pure geometry: axis domains, x/y scaling, the standard Hansen-distance formula, nearest-N ranking. No DOM |
| `web/src/islands/HansenSpaceIsland.tsx` | The Learn tool: three SVG scatter panels + optional polymer marker + "closest solvents" list |
| `web/src/lib/learn/fetch-learn-materials.ts` (+ test additions) | Extended (not replaced) with a `hansen` field: `null` unless a material has ALL THREE of `hansen_d/p/h` |
| `web/src/pages/{en,fa}/learn.astro` | `HansenSpaceIsland` appended after `TacticitySimulatorIsland` |
| `web/src/styles/learn.css` | New `.hansen-*` rules |
| `web/src/i18n/{en,fa}.json` | `nav.solvents`, 15 `solvents.*` keys, 17 `learn.hansen.*` keys — verified in sync (`t.test.ts`'s key-set-parity check passes) |

## 2. API design

One route, deliberately unpaginated (contrast `materials.ts`'s LIMIT/OFFSET
list): a solvent row is five short fields with no property groups, grade
classes or processing techniques underneath it, so even at ~1,200 rows this
is a low-double-digit-kB JSON payload (§4), and both consumers — the
datasheet table and the Hansen chart — need every point at once, not one
page of them. `cited` is a boolean (at-least-one-evidence-row), computed via
one `GROUP BY` join against `evidence WHERE subject_type = 'solvent'`, the
same "boolean, not a count" contract every other provenance mark on the site
uses (R11). No existing route's file was touched; `server.ts`'s only change
is the two additive lines registering the new route.

## 3. Virtualisation, measured

At ~1,180 rows (the live count once the sibling curation pass landed, see
§5), `SolventsIsland` renders only the rows in (and just outside) the scroll
viewport — a fixed `ROW_HEIGHT`, two spacer `<tr>`s sized from `scrollTop`,
no external virtualisation library. Measured in the running dev app:

| Check | Result |
| ----- | ------ |
| Total rows (API) | 1,180 |
| Rows actually in the DOM at once | **33–34** |
| `sv-table-scroll` `scrollHeight` | 51,967px ≈ 1,180 × 44px (matches `ROW_HEIGHT`) |
| Search ("acetone") | row count updates to `10 of 1180`, DOM rows match the filtered set |
| Sort by δD (ascending) | first 8 rendered values: `9.6, 12.0, 12.3, 12.3, 12.3, 12.4, 12.4, 12.6` — monotonic |

`.sv-table-scroll` is the one element that scrolls, in **both** directions —
R27's "no page-level horizontal overflow" extended here to "no page-level
growth to 1,180 rows tall" either.

## 4. The 2D-vs-3D decision (R24 permits, does not require, a heavy library)

Three fixed 2D projections (δD–δP, δP–δH, δD–δH) as SVG, **not** a rotatable
3D scene, even though R24 explicitly allows a heavy library on Learn. Made
deliberately, not by default:

- The legacy component this replaces (repo-root `src/components/
  Hansen3DChart.tsx`) is itself hand-rolled orthographic-projection SVG with
  drag-to-rotate — never an actual 3D library. "Port the legacy chart" was
  never a reason to reach for Three.js.
- Step 1 measured the whole Learn route at 68.9 kB gzipped total. Three.js
  alone commonly runs 150–600 kB gzipped depending on which modules are
  pulled in — adding it would have multiplied the route's entire JS cost
  for a feature with almost no polymer data to plot in three dimensions
  anyway (2 of 7 materials, both unsourced).
- Three fixed panels are more legible for the actual teaching goal ("which
  solvents cluster near this polymer") than a camera a reader has to drag:
  exact axis positions are readable without rotating, two panels compare
  side by side, and no point is ever hidden behind a nearer one.

**Cost of the decision, measured**: `HansenSpaceIsland.js` is 1,952 bytes
gzipped (§6) — none of it a 3D library.

No interaction-radius (Ro) circle is drawn for any polymer marker, in either
projection: no material in this database has a real Ro value today, and
drawing one at an invented radius would be the exact fabricated-precision
failure R7 exists to prevent. The Hansen-distance ranking ("closest
solvents") uses the standard published formula (the ×4 weight on the
dispersion term is Hansen's own convention, not a free parameter this unit
invented) purely to *rank*, never to draw a boundary.

## 5. The honest-empty-state requirement, verified live against a moving target

The brief anticipated this and it happened during verification, not
hypothetically: the sibling curation pass (`tools/curation/`, running
concurrently in `db/`) dropped and re-created the `solvent` table, and
separately reset the `material` catalog, **while this unit was being
browser-tested**. Three real states were observed, not simulated:

| Moment | `GET /api/solvents` | What the UI showed |
| ------ | -------------------- | ------------------- |
| Mid-import, table dropped | `500`, `relation "solvent" does not exist` | `/fa/solvents`: DataBoundary's real error state — "مشکلی پیش آمد" / "تلاش دوباره" retry button (R4) |
| Table recreated, still empty | `200 {data: [], total: 0}` | `/fa/solvents`: DataBoundary's generic empty state, "چیزی برای نمایش نیست" — same behaviour `SourcesIsland` already has for an empty bibliography, not a special case written for this unit. `/fa/learn`'s Hansen tool: its own `learn.hansen.noSolvents` message ("هنوز داده‌ای برای حلال‌ها بارگذاری نشده…"), because HansenSpaceIsland treats "zero solvents" as a real, worded state rather than deferring to DataBoundary (it has no DataBoundary — it merges two fetches itself) |
| Import complete | `200`, `total: 1180` | Full table, full chart, both verified in detail (§3, §7) |

At no point did either surface render a blank page. This was the single
highest-value thing to verify given the brief's explicit warning, and it
happened for real rather than needing to be staged.

One consequence worth recording rather than hiding: at the moment this
section was finalised, the sibling's concurrent work had also temporarily
reduced the `material` catalog to 2 rows (`ldpe`, `hdpe`) and bumped the
migration count to 29 — both outside this unit's file scope (`db/`,
`tools/curation/`) and not caused by anything in this step. The **peak**
measurements below (82 pages, 53/53 API tests) were captured earlier in the
same session, before that churn, against a 17-material catalog and a fully
landed 1,180-row solvent table; the **current** numbers reflect the database
mid-reset. Both are reported rather than picking the more flattering one.

## 6. Learn and Solvents routes' gzipped JS, measured

From the production build's `_astro/` output (`gzip -c | wc -c`), against
the exact chunks each route's HTML references or dynamically imports:

### `/learn`

| Chunk | Shared with other routes? | gz |
| ----- | -------------------------- | -- |
| `client.*.js` (react-dom hydration runtime) | yes — search/compare/sources/solvents | 56.3 kB |
| `StateSimulatorIsland.js` | no | 1.79 kB |
| `DPCalculatorIsland.js` | no | 1.26 kB |
| `BranchingSimulatorIsland.js` | no | 1.79 kB |
| `TacticitySimulatorIsland.js` | no | 1.70 kB |
| **`HansenSpaceIsland.js` (new, step 4)** | no | **1.95 kB** |
| `fetch-learn-materials.js` (dynamic import) | yes — used by all 5 tools | 0.63 kB |
| `fetch-solvents.js` (dynamic import) | yes — also used by `/solvents` | 0.30 kB |
| `family-scope.js` (dynamic import) | yes — Branching/Tacticity | 0.16 kB |
| **Total** | | **65.9 kB** |

Step 4 added 1.95 kB of new island code (HansenSpaceIsland) plus a 0.30 kB
shared fetch module to a route whose budget (§6 of step 1's record) is
explicitly unbounded. No heavy library is present, so R24's build-failure
condition is not approached.

### `/solvents` (new route)

| Chunk | Shared with other routes? | gz |
| ----- | -------------------------- | -- |
| `client.*.js` (react-dom hydration runtime) | yes — same shared chunk as above | 56.3 kB |
| `DataBoundary.js` (dynamic import) | yes — already shipped for `/sources`, `/compare` | 0.55 kB |
| `SolventsIsland.js` | no | 1.55 kB |
| `fetch-solvents.js` (dynamic import) | yes — also used by `/learn` | 0.30 kB |
| **Total** | | **58.7 kB** |

**New code this route actually adds to what the site already pays for**:
`SolventsIsland.js` + `fetch-solvents.js` = **1.85 kB gzipped**. `/solvents`
is a datasheet-surface route (not Learn), and stays comfortably under the
Datasheet budget (step 1's record: 80 kB) — no heavy library, matching R24.

## 7. Other measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (121 files, up from 113) |
| `vitest run` | **248/248** (up from 232 — new: `hansen-space.test.ts`, 13 tests; 2 new hansen cases added to `fetch-learn-materials.test.ts`) |
| `astro build` (peak, 17-material catalog) | **82 pages** (up from 80: `/en/solvents`, `/fa/solvents`) |
| `astro build` (current, mid-reset catalog) | 22 pages — reflects the live `material` count of 2, not a regression in this unit (§5) |
| `api` test suite | **53/53** at peak (up from 48); 37/53 mid-reset, all 17 failures traced to the concurrent catalog/migration churn in `db/`/`tools/curation/`, none in `/api/solvents` itself, which was 5/5 in both runs |
| Solvents table, full data | 1,180 rows, virtualised to ~33 DOM rows, search and per-column sort verified live (§3) |
| Hansen chart, full data | 3 panels × 1,180 solvent dots = 3,540 `<circle>` elements; both LDPE and HDPE selectable as polymer markers; selecting LDPE surfaces Dodecane/Undecane (Ra ≈ 0.0) as the closest solvents — a real, sensible result (LDPE's near-zero δP/δH matches nonpolar alkanes) |
| RTL, `/fa/solvents` and `/fa/learn` | `dir="rtl"`, `lang="fa"`; solvent table and Hansen tool both render real Persian copy; provenance mark reads "دارای منبع"/"بدون استناد" correctly |
| No horizontal overflow | `scrollWidth === clientWidth` at 320 (`/fa/learn`), 375 (`/fa/solvents`), 768 (`/en/solvents`) and 1280 (`/en/learn`, `/en/solvents`) — resized explicitly before measuring (`clientWidth` reports 0 until then, the trap step 1's record documents) |
| Dark mode | Toggled live on `/en/solvents`; body background resolves to the datasheet dark base (`rgb(36, 29, 23)`); provenance marks and empty state remain legible |
| Console errors | None, on a freshly opened tab (a tab reused across live-edit iterations accumulates stale historical errors from the edit process itself — checked and discounted; a fresh tab load is the real signal) |
| `nameFa: null` handling | Verified: `displayName()`/`solventName()` fall back to `nameEn` on the Persian route rather than rendering an empty cell — true for the great majority of the 1,180 imported rows |
| `prettier --check` | Clean after `--write` on the two new islands (pre-existing formatting drift in a couple of long JSX attribute lines, not a logic change) |

## 8. Honest position on polymer HSP, restated in code

`hansen_d`/`hansen_p`/`hansen_h` exist as `property_definition`s for
materials too, but only LDPE and HDPE carry all three, both `unsourced`.
`fetch-learn-materials.ts`'s `hansen` field is `null` unless a material has
**all three** values (never a partial point on a 3-axis space), and
`HansenSpaceIsland` shows the "not yet backed by a citation" note whenever
the selected material's own values are uncited — the same `value.uncited`
grey mark used everywhere else on the site, not a new one. The solvent cloud
is this tool's real content; the polymer marker is, honestly, almost
nothing yet — exactly as the brief predicted, and nothing here overstates
it.

---

# STEP 4 REVISION, 2026-08-14 — two owner corrections to the ship above

The owner reviewed step 4 and rejected two decisions this document defended
at the time:

> "for hsb i need the 3d one, like HSPIP software and its output"

> "on the leaning env i don't want all of the solvants available to see,
> just having the option to choose as many as i want to from them to see
> them against the polymer we have our page dedicated to"

Both corrections are addressed below. `/solvents` (the full 1,180-row
browse) is explicitly out of scope for this revision and untouched.

## 1. Three fixed 2D projections → one true rotatable 3D scene

§4 above defended three flat panels over a real 3D view, reasoning that a
rotatable scene was "a worse instrument… not a better one" given how little
polymer data existed. The owner's brief was explicit that this reasoning is
**superseded**: HSPIP's own output — a rotatable 3D scatter around the
polymer — is what was actually asked for, and "the previous agent rejected
3D partly because there was little polymer data" does not answer that
request.

`lib/learn/hansen-space.ts` was reworked: `HANSEN_PROJECTIONS`,
`scaleX`/`scaleY` (the fixed-panel machinery) are gone, replaced by
`project3D` (domain-normalised rotate-then-orthographic-project, the same
technique the frozen legacy prototype at repo-root
`src/components/Hansen3DChart.tsx` used — read for the technique, not
copied, per this unit's existing "port in concept" precedent from step 3),
plus `axisLines` and `boundingBoxEdges` for the axis and wireframe-cube
reference geometry a rotated scene needs and a flat panel didn't.
`HansenSpaceIsland.tsx` now renders one SVG scene with pointer-drag rotation
(azimuth + elevation, elevation clamped to ±85° so it never flips through
the pole) and wheel-to-zoom (a native, non-passive `wheel` listener — React
17+ attaches `onWheel` passively, which silently no-ops `preventDefault()`,
so a manual `addEventListener` is the only way to stop the page scrolling
under the reader's zoom gesture). A "Reset view" button restores the
default orientation/scale.

**No interaction-radius (Ro) sphere is drawn.** This was true before the
revision and remains true after it, restated because the owner's brief
called it out as the one number that must never be invented: no polymer in
this database has a real Ro value today. The polymer marker is a point,
`learn.hansen.noRoNote` says so in both locales next to the marker itself
("No interaction radius (Ro) is recorded for any polymer in this database,
so {material} is shown as a single point, not a solubility sphere" /
Persian equivalent), and nothing in this revision computes or fabricates
one.

### Library choice: hand-rolled SVG, not Three.js — decided again, not inherited

The brief asked for this decision to be re-made under the corrected premise
(3D is now definitely wanted) and weighed on measured cost, not carried over
from the old "we don't need 3D" reasoning. It was re-made, and the answer
came out the same as before for reasons that don't depend on whether 3D was
wanted:

- The content is small — however many solvents the reader opts into (see
  §2 below; never the full 1,180) plus at most one polymer point. A
  software-projected SVG scene stays well under 100 DOM nodes for any
  realistic selection. Nothing about that point/node count justifies a
  WebGL renderer's fixed cost.
- The legacy prototype this replaces is itself proof the hand-rolled
  technique produces "like HSPIP" rotatable output without a library, in
  this exact codebase.
- Measured cost (§4 below): the entire 3D rework — projection math,
  rotation/zoom interaction, the wireframe box, the search-and-add UI, the
  chips, the URL-binding — added **1.3 kB gzipped** to `HansenSpaceIsland.js`
  (1.95 kB → 3.28 kB). Three.js alone is commonly 150–600 kB gzipped
  depending on which modules are pulled in. No feature this tool needs
  (lighting, meshes, textures, a depth buffer for a large point cloud) is
  missing from matrix-rotate-and-paint's-algorithm at this scale.

**No 3D library was added.** `package.json` carries no `three`,
`@react-three/fiber`, or `chart.js` dependency, and `grep -rliE
"three\.js|from ['\"]three['\"]|chart\.js"` across the entire built `dist/`
output returns nothing (verified below, §4).

## 2. All 1,180 solvents plotted by default → the reader picks, tied to "the polymer we have our page dedicated to"

The original ship rendered every solvent row on load. The owner's
correction was explicit on both halves: (a) don't show all of them by
default, the reader opts in to "as many as I want", and (b) the tool should
be bound to the specific polymer the reader arrived from, not a free pick
among all of them.

**(a) Opt-in solvents.** `HansenSpaceIsland` now starts with zero solvents
selected. Two ways to add one:

- **Search** (`learn.hansen.searchLabel`/`searchPlaceholder`): a text input
  that only searches once at least 2 characters are typed
  (`MIN_QUERY_LENGTH`), capped at 20 results (`SEARCH_RESULT_LIMIT`) — the
  full list is never rendered as a browsable set here, only as filtered
  matches, and `learn.hansen.searchHint` tells the reader outright that the
  full 1,180-row list lives on `/solvents` instead (one link away,
  `learn.hansen.solventsPageLink`).
- **Closest matches** (`hansen-nearest-list`, unchanged mechanism from the
  original ship): once a polymer with real Hansen data is shown, its ranked
  closest solvents each carry an "Add" button — a second, assistive way to
  opt in without typing, but still nothing is added until the reader clicks.

Selected solvents render as removable chips (`hansen-chip-*`) and as the
only points in the 3D scene besides the polymer marker. Domains (`axisDomain`
on d/p/h) are computed from the selection, not the full catalog, so the
scene's scale always fits what's actually shown rather than being sized for
1,180 points that aren't there.

**(b) Bound to "the polymer we have our page dedicated to".** A new module,
`lib/learn/learn-url-state.ts`, mirrors the existing pre-fill conventions
exactly: `search/url-state.ts`'s `?from=` (BR13) and `compare/url-state.ts`'s
`?subjects=`. It exports `getMaterialParam`/`buildMaterialParam` for a
`?material={slug}` query param. `LearnBridge.astro` — the datasheet-side
component whose `slug` prop had sat unused since FE-8 step 1 (the header
comment said as much: "kept in the props contract in case a later Learn
tool needs to deep-link with a material pre-selected") — now writes it onto
every tool link it renders, not just Hansen's, so a later material-scoped
Learn tool can reuse the same contract without inventing a second one.

`HansenSpaceIsland` reads `?material=` once on mount. When it resolves to a
material with real Hansen data, that material IS the tool's context:
`learn.hansen.boundNote` says so ("Showing {material}'s position, linked
from its datasheet page"), and the free "pick any polymer" `<select>` is not
rendered at all — there is nothing to pick, the page arrived already bound.
When the bound slug resolves to a material that exists but lacks Hansen
data, `learn.hansen.boundNoHansenNote` says that honestly instead of
silently falling back to the free picker. Only a **direct** visit to
`/learn` (no `material` param — Learn is also a standalone route, not
exclusively reached via a datasheet) falls back to a small `<select>`
scoped to just the materials that genuinely have all three Hansen values
(2 today: LDPE, HDPE) — never all 7 seeded materials, since R7 already
forbade offering ones without the data.

## 3. Tests

`hansen-space.test.ts` was rewritten, not just extended: the old suite's
`HANSEN_PROJECTIONS`/`scaleX`/`scaleY` tests asserted the exact design this
revision reverses ("declares exactly the three 2D panels this unit chose
over a 3D scene" — a test name that was itself a signal something had
changed), so they were replaced with equivalent-weight coverage for the new
geometry: `normalizeAxis` (domain-to-[-0.5,0.5] mapping, flat-domain guard),
`project3D` (identity-rotation sanity, monotonic x-vs-d under no rotation,
finite output across azimuth ∈ {-180..360}° × elevation ∈ {-85..85}°, 360°
azimuth wraparound returns the same projection, flat-domain degenerate case
never divides by zero), and `boundingBoxEdges` (exactly 12 edges, every
endpoint uses only domain min/max, every edge varies exactly one axis).
`hansenDistance`/`axisDomain`/`nearestByHansenDistance` — logic that was
never about 2D vs 3D — were kept as-is. A new `learn-url-state.test.ts`
covers `getMaterialParam`/`buildMaterialParam` (present, absent, unrelated
params, percent-encoding). Net: 27 new/changed tests in these two files,
**262/262 passing** site-wide (up from 248).

## 4. Measured results

| Check | Result |
| ----- | ------ |
| `astro check` | 0 errors, 0 warnings, 0 hints (125 files) |
| `vitest run` | **262/262** (up from 248) |
| `astro build` | **82 pages** (unchanged — no new routes) |
| `prettier --check` | Clean on every file this revision touched |
| Heavy library in `dist/` | `grep -rliE "three\.js\|from ['\"]three['\"]\|chart\.js" dist/` → no matches. `package.json` carries no `three`/`@react-three/fiber`/`chart.js` dependency |
| `LearnBridge` link, `/en/m/ldpe` (live DOM) | `href="…/en/learn?material=ldpe#hansen"` — confirmed for all four tool anchors on the page, not just Hansen's |
| Bound state, `/en/learn?material=ldpe` (live DOM) | `hansen-bound-note` present ("Showing Low-Density Polyethylene's position, linked from its datasheet page"), `hansen-material-select` **absent** (no free picker when already bound), `hansen-no-ro-note` present, `hansen-scene-polymer-marker` present |
| Bound state, Persian, `/fa/learn?material=hdpe` | `dir="rtl"`, `lang="fa"`, bound note and no-Ro note both render real Persian copy naming پلی‌اتیلن با چگالی بالا |
| Free-picker fallback, `/en/learn` (no param) | `hansen-material-select` present, options = `["", "hdpe", "ldpe"]` — exactly the 2 materials with real Hansen data, never all 7 |
| Solvent search, live | Typing "acet" returns real matching rows (`1,1-Dichloroacetone`, …), each with an Add/Remove button; nothing renders below 2 characters typed |
| Add/remove round-trip, live | Clicking a "closest match" Add button adds exactly one point to the scene and one chip; clicking the chip's remove control returns to 0 points and the `hansen-selected-empty` message |
| Scene starts empty | On load with a bound material, `hansen-selected-chips` reads "Solvents in this view (0)" and the scene shows only axes/box/polymer marker — confirmed live, not assumed |
| Rotation, live (dispatched `PointerEvent` drag, real browser) | With two spread-apart points (Water + Dodecane against LDPE), a drag moved both points' `cx`/`cy` to new values; "Reset view" moved them again to the default-orientation values — three distinct coordinate sets observed across before/drag/reset |
| Rotation degenerate case, live (documented, not a bug) | LDPE and Dodecane's real Hansen values are nearly identical (Ra ≈ 0.0, the closest real match in the data) — when those are the only two points, both project to the exact scene centre under every rotation, since a domain collapsed onto a near-single point normalises to ~0 on every axis regardless of angle. Caught this during verification, traced to real data coincidence (not a projection bug) by adding a third, well-separated point (Water) and re-testing rotation, which then moved the points as expected |
| Zoom, live (dispatched `WheelEvent`, real browser, non-passive listener) | `deltaY: -300` measurably changed both points' screen coordinates (spread increased) |
| `setPointerCapture` defensiveness | Wrapped in `try`/`catch` after a synthetic-event test threw `InvalidPointerId` on a fabricated `pointerId` — real pointer/touch sequences always carry a live capture session so this never fires in practice, but a cosmetic capture failure must not crash the tool |
| `/solvents`, unaffected | Still virtualises to ~33-34 DOM rows out of 1,180 at the current catalog size — untouched by this revision, confirmed live |
| No horizontal overflow | `scrollWidth === clientWidth` at 320 (`/en/learn?material=ldpe`, and `/fa/learn?material=ldpe` RTL), 375, 768 (753/753), 1440 (1425/1425) — viewport resized explicitly before each measurement (the `clientWidth`-reports-0-until-resized trap, restated because it is still live in this environment) |
| Dark mode | `/fa/learn`, `data-theme="dark"` toggled live; body resolves to Learn's dark base `rgb(62, 67, 111)`, matching D41 and step 3's prior record |
| Console errors | None, across every page/state exercised above |
| API-down check | Repeated the project's standing lesson before touching anything: confirmed `polypedia-api` was running before diagnosing any blank-island symptom. It was down at the very start of this revision's `astro build` (`Failed to list materials for static paths: fetch failed`) — started it, rebuilt clean, and treated that as confirmation of the lesson rather than a new finding |

### Route JS, gzipped — measured by transitive import-graph closure, not by the chunk list alone

Earlier records in this file (§6 of the original step-4 section) summed only
the chunks explicitly named per route and did not include `react.js`/
`jsx-runtime.js`/`react-dom.js` as separate line items for `/learn`, even
though `client.*.js` has always statically imported them as their own
chunks. This revision measured the **full transitive closure** of every
route's entry chunks (each `astro-island component-url`/`renderer-url`,
followed through every static `import` to every chunk it pulls in,
individually gzipped and summed) for both the pre-revision and
post-revision code, so the two numbers are comparable on identical terms
and isolate exactly this revision's cost rather than an accounting
artifact. The pre-revision number was obtained by temporarily restoring the
original `hansen-space.ts`/`HansenSpaceIsland.tsx`/i18n content, running the
identical closure script, then restoring this revision's code — not carried
over from the older, narrower-scoped number in §6 above.

| Route | Before this revision (2D panels, full solvent cloud) | After this revision (3D scene, opt-in solvents) | Delta |
| ----- | ------------------------------------------------------ | -------------------------------------------------- | ----- |
| `/learn` | 84.0 kB | **85.2 kB** | **+1.2 kB** |
| `/solvents` | 76.3 kB | 76.2 kB | ~0 (route untouched; difference is measurement noise) |

`HansenSpaceIsland.js` itself: **1.95 kB → 3.28 kB gzipped** (+1.33 kB) —
the entire cost of the 3D projection math, rotation/zoom interaction, the
wireframe box, the search-and-add UI, the selection chips, and the
`?material=` URL binding. Both routes remain far under Learn's explicitly
**unbounded** budget (§6, `frontend-plan.md`) and under even the Datasheet
route's 80 kB ceiling for scale (`/solvents` is a datasheet-surface route,
not Learn, and stays under it; `/learn` is exempt from it entirely).

## 5. What this revision did not touch

`/solvents` and its full 1,180-row virtualised table (`SolventsIsland.tsx`,
`fetch-solvents.ts`, the `GET /api/solvents` route) — explicitly out of
scope per the brief ("the full 1,180-row browse stays on `/solvents` — that
page is correct as built, leave it alone") and confirmed unaffected in §4's
measurements. `StateSimulatorIsland`, `DPCalculatorIsland`,
`BranchingSimulatorIsland`, `TacticitySimulatorIsland` — untouched;
`LearnBridge.astro`'s new `?material=` param is additive to their links too
but none of these tools reads it yet. Steps 2 and 5's gaps (stress–strain,
market-share, quiz, processing-window, LCA) are exactly as prior sections of
this file left them.
