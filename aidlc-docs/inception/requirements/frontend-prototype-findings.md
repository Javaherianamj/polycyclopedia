# What the prototype implies — findings before the rebuild

**Created**: 2026-08-03
**Method**: ran the SPA (`npm run dev`, port 3000), read the catalog and the LDPE
datasheet as rendered, then cross-read `code-quality-assessment.md`,
`business-overview.md`, `api/README.md` (U2 surface) and `project-plan.md`.
**Status**: inspection only. Nothing here is a decision; decisions depend on
`frontend-questions.md`.

---

## 1. Findings — what the prototype tells us about the product it thinks it is

### F1. It is two products sharing one page

The material page is simultaneously an **engineering datasheet** (Tg, Tm,
density, MFI, tensile — dense, scannable, lookup-oriented) and a **teaching lab**
(processing-window simulator, LCA carbon calculator, 3D molecular viewer, quiz —
linear, narrative, playful). Both are good. They want opposite layouts, opposite
information density, and opposite success metrics. The prototype never chose, so
the LDPE page runs: overview prose → market share chart → processing → **a full
interactive simulator** → applications → producers → **a second full simulator
(LCA)** → key specs. A reader looking up a density number scrolls past two
simulators to reach it.

### F2. Navigation is material-first; the differentiator is property-first

Every path starts with "pick a polymer" (catalog → family accordion → datasheet).
But the stated headline feature is the inverse question — "which polymers have
Tg > 100 and tensile 40–80?" There is no surface in the current IA where that
question can be asked. This is the single largest structural change, not a
feature to bolt on.

### F3. The pages are authored, not generated

The LDPE page contains LDPE-specific prose (the ICI 1933 story, a hand-written
extrusion-coating note, a curated Iranian-producer list). That is genuinely
valuable content — and it is also why the page is 1,358 lines of hand-written
JSX for six materials. It does not survive fifty. The database is now
registry-driven (55 property definitions in 6 ordered groups); the rebuilt page
must render **from the registry**, with authored prose as an optional overlay on
top of a generated skeleton, not the other way round.

### F4. The product thesis is invisible in the product

Provenance is the entire reason the database exists — the schema physically
refuses a citation without a page-level locator. In the running UI, provenance
appears **nowhere**. `sourceId` is `'src_default'` 269 times and no component
reads it; the Resources modal is a detached bibliography with no join back to any
value. Meanwhile the API already returns per-value citations and a
`/api/coverage` endpoint.

The consequence for design: the atom of this UI is not "a number". It is
**"a number, its status, and who says so"**. Every surface — card, table, compare
row, search result — has to be built on that atom from the first component, or
citations become a retrofit that touches every file.

### F5. Honesty will be visually loud, and that is a product decision

All 109 values are `unsourced`; both materials are `draft`. Whatever citation
marker is chosen will therefore appear on ~100% of the site at launch and decay
slowly over months of curation. There is no version of this that is a subtle
finishing touch. Q3 in the questions file exists to make that a deliberate choice
rather than a discovery at build time.

### F6. Nothing is designed for absent data

Every card in the prototype assumes its value exists, because the six legacy
records were hand-completed. Against the real registry the normal case is a
material with 12 of 55 properties filled. "No data yet" is currently not a
designed state anywhere — no empty state, no partial-group state, no skeleton.
This is invisible in a mockup and is a substantial share of the real build.

### F7. Nor for asynchrony

There is no `fetch` in the entire codebase; data is a synchronous import. Moving
to the API adds loading, error and stale states to every screen. Also cheap to
underestimate.

### F8. The simulators get better, but become conditional

They currently read "shadow" numeric fields (`tgValue`, `minDensity`,
`mnDefaultValue`) hand-maintained beside the display strings, with nothing keeping
the two in sync. The database supplies real `value_min` / `value_max` /
`value_typical` numerics, which removes that whole class of bug. But it also means
a simulator can only run for a material whose required numbers exist — so each
tool needs a declared data dependency and a defined behaviour when it is not met.

### F9. Compare is hardcoded 2 materials × 9 rows

`CompareModal.tsx` lines 80–124 spell out nine rows in JSX. The registry supports
N materials × any property subset. Rebuilding compare against the registry is a
small unit with a visible payoff.

### F10. Two constraints that must survive any redesign

- **RTL with LTR islands.** Persian body text, but numbers, units, formulas and
  chemical names are LTR. The prototype handles this correctly with per-span
  `dir="ltr"` overrides. Any component library or template chosen for the rebuild
  has to keep working under this, and it is where most off-the-shelf kits break.
- **Formatting belongs to the server.** `api/src/format.ts` is the single place
  numerics become display strings (`0.910 - 0.925 g/cm³`, `~ 1.51`, `< 0.01 %`).
  The frontend must not reimplement it.

---

## 2. Draft rules for the rebuild

Proposed, not adopted. React to these — disagreement here is more useful than
agreement.

| #      | Rule                                                                                                                                       | Why                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **R1** | No number renders without its provenance state. There is one value component and everything goes through it                                | F4. Citations retrofitted later means touching every file                                        |
| **R2** | No property list is written in JSX. Sections, order and grouping come from `/api/properties`                                               | F3. Adding a property must stay a database `INSERT`                                              |
| **R3** | Display strings come from the API. The frontend formats nothing numeric                                                                    | F10, and it is already true server-side                                                          |
| **R4** | Every screen defines four states before it is considered done: loading, error, empty/partial, full                                         | F6, F7                                                                                           |
| **R5** | Absent data is shown as absent. Nothing is inferred, averaged, or filled to make a layout look complete                                    | The project's whole differentiator; a plausible fabricated number is undetectable after the fact |
| **R6** | RTL-first. LTR is a per-span exception for numerics and Latin technical terms, never a page-level mode                                     | F10                                                                                              |
| **R7** | An interactive tool declares the data it needs and does not render when that data is absent — no silent defaults                           | F8                                                                                               |
| **R8** | The prototype is the content brief, not the design. Its authored prose is an asset to preserve; its layout is not a constraint             | F1, F3                                                                                           |
| **R9** | Each screen is built against the real API, with real (mostly uncited, mostly incomplete) data. No screen is signed off on hand-picked data | Otherwise every honest-state problem is discovered at launch                                     |

---

## 3. Delivery order — preliminary

Depends on answers to Q6, Q9, Q10. Recorded now so there is something concrete to
disagree with.

The core argument: **the API swap and the design work are separable, and the API
swap should not wait for the design.** Getting real data into the existing screens
is what turns every later question ("what does an empty group look like?", "how
loud is the unsourced marker?") from speculation into something visible.

```
  now      FE-0  design rules + IA agreed (this document + answers)
             |
             +-- FE-1  API swap behind the current UI, no visual change
             |         (unblocks everything; proves loading/empty/error states)
             |
             +-- FE-2  design system: tokens, RTL type scale, the value atom,
                       the four states, the property-group section
                       (can run in parallel with FE-1)
                       |
                       +-- FE-3  catalog + material page rebuilt from the registry
                            |
                            +-- FE-4  citation UI (the thesis, made visible)
                            +-- FE-5  compare, registry-driven, N-way
                            +-- FE-6  property-first search  <- the differentiator
                                 |
                                 +-- FE-7  simulators ported, made conditional
```

Why this order and not another:

- **FE-1 first** because it is the only step whose cost rises the longer it waits —
  every new screen built against `polymersData.ts` is a screen that must be
  converted twice.
- **FE-4 before FE-6** because a beautiful search over uncited numbers is the
  prototype with extra steps (`project-plan.md` §3 makes the same argument).
- **FE-7 last** because the simulators are the most expensive to rebuild, the
  least affected by the data migration, and the easiest to cut or defer — and
  question 14 may cut half of them.
