python tools/curation/export_gaps.py --material ldpe --preset polyolefins# Frontend Rebuild — plan, rules, and delivery order

**Created**: 2026-08-03
**Inputs**: `inception/requirements/frontend-questions.md` and
`frontend-questions-2.md` (both answered),
`inception/requirements/frontend-prototype-findings.md`, `db/DATA-GAPS.md`
**Supersedes**: section 3 of `frontend-prototype-findings.md` (see §1)
**Status**: Inception complete. Ready for Construction, gated on the approval in §9.

---

## 1. The correction that shaped this plan

The preliminary order in `frontend-prototype-findings.md` §3 opened with
**FE-1: swap the existing UI onto the API without changing anything visually.**

**That is withdrawn, and here is the plain version of why.**

It made sense under an assumption the answers removed: that the current site
keeps running and gets improved in place. Two answers killed it — the prototype
is **frozen as a reference and a new frontend is built alongside** (Q9), and
**nothing is published until the whole thing is done** (Q10).

Together those mean the old UI gets deleted. Wiring it to the API would mean
building loading states, error states and data-mapping code inside files
scheduled for the bin, and the payoff — "the live site keeps working" — no longer
exists, because the live site is deliberately not being touched.

So the API swap is not step one. It is not a step at all. It dissolves into the
new app, which is built against the API from its first line.

What survives is the argument underneath it, now rule R9: **build every screen
against real data — mostly empty, entirely uncited — never against hand-picked
examples.**

---

## 2. Decisions

### Round 1 — what the site is

| #   | Decision                                                                                                    | From |
| --- | ----------------------------------------------------------------------------------------------------------- | ---- |
| D1  | Four audiences, each with its own route through the site. Search is the spine that carries all four         | Q1   |
| D2  | Two surfaces: **Datasheet** (values) and **Learn** (interactive tools), cross-linked. Not tabs on one page  | Q2   |
| D3  | Everything is shown. Per-material coverage indicator. Uncited values say so explicitly, they are not hidden | Q3   |
| D4  | Provenance on hover/tap per value; a sources list per material; a sources list site-wide                    | Q4   |
| D5  | Citation shows **metadata only** — work, edition, page. No quoted text, no scans                            | Q5   |
| D6  | Homepage offers browsing and property-search as equals                                                      | Q6   |
| D7  | SEO is secondary now, real later. Do not foreclose it                                                       | Q7   |
| D8  | Mobile and desktop are both first-class, designed separately, not one scaled                                | Q8   |
| D9  | Prototype frozen as reference. New frontend built alongside                                                 | Q9   |
| D10 | No publish until complete. Order chosen for build efficiency, not demo value                                | Q10  |
| D11 | Missing values are shown as an invitation to contribute, not hidden and not a bare dash                     | Q11  |
| D12 | Modern technical product, premium feel, must stand out. Visual identity co-designed, with examples          | Q12  |
| D13 | Bilingual from the start, Persian primary, extensible to more languages                                     | Q13  |
| D14 | All 12 interactive tools are kept; individual redesigns are a later pass                                    | Q14  |
| D15 | Material pages must be able to switch to a specific grade later. Design the hierarchy now, build it in U6   | Q15  |

### Round 2 — how it is built and how it looks

| #   | Decision                                                                                                                       | From |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ---- |
| D16 | **Polypedia is its own brand.** The association's logo appears as a credit/sponsor mark, not as the site's identity            | Q17  |
| D17 | **Estedad** for Persian (SIL OFL). Owner accepted 2026-08-03 rather than resolve the IRANSansX commercial licence              | Q18  |
| D18 | **Latin numerals everywhere**, including prose. `105 - 115`, never `۱۰۵ - ۱۱۵`                                                 | Q19  |
| D19 | Light and dark both ship. **Light is the default**                                                                             | Q20  |
| D20 | Premium means **craft** — B. Restraint (A) for the Datasheet surface, richness (C) for Learn, craft as the connective tissue   | Q21  |
| D21 | Uncited values get a **neutral grey marker**, worded as work in progress ("در حال تکمیل منابع"), never as a defect             | Q22  |
| D22 | The empty-field invitation links to a public **"how to contribute"** page                                                      | Q23  |
| D23 | **Two surfaces, two routes, no third tab level.** Datasheet is one scrolling page with a sticky section rail (see §5, FE-3)    | Q24  |
| D24 | Search is **sliders plus a text box**; "similar to this, but…" lives at the bottom of each material page beside quick-compare  | Q25  |
| D25 | A search result shows the material **plus the properties that were filtered on**, with a button to compare all results         | Q26  |
| D26 | **Astro with React islands** (see §4 for the reasoning and the one real risk)                                                  | Q27  |
| D27 | Hosting: **static-friendly now**, domestic Iranian provider later. VPS abroad is off the table. Nothing may assume a Node host | Q28  |
| D28 | URLs are `/fa/…` and `/en/…`                                                                                                   | Q29  |
| D29 | English content goes **into the database**. No fallback, no machine translation                                                | Q30  |
| D30 | Frontend testing matches the rest of the project: unit, component, and a few end-to-end journeys                               | Q31  |
| D31 | Two people, no deadline. **Quality over speed**                                                                                | Q32  |
| D32 | **Hard performance split**: the Datasheet is fast and light; heavy libraries load only when the reader chooses Learn           | Q33  |
| D33 | **Emoji are kept** as decorative accents — they are part of the prototype's charm                                              | Q34  |
| D34 | Colour identity is designed from scratch, to a stated taste: **muted, vintage/Pinterest-leaning palettes, soft edges**         | Q34  |

### Interpretations I made — correct me if wrong

**Q3 (round 1).** You chose C and D, which contradict — C shows everything with a
coverage indicator, D hides uncited values behind a toggle. Your own words
("we show sources on hover, for the ones without source it should say source not
added") are C. **Built to C: nothing hidden.**

**Q4 (round 1).** You asked me to pick marker vs hover. The **property name**
carries the ⓘ explanation ("what is Tg?" — identical on every material); the
**value** carries the provenance marker ("who says −110 °C?" — different for every
value). Two questions, two anchors. Hover on desktop, tap-sheet on mobile,
because hover does not exist on a phone and mobile is most people's first
impression (D8).

**Q21 (round 2).** You picked A for datasheet, B generally, C for learning, "but
mostly I meant B". Read as: **B is the house style**, A and C are how the house
style is tuned per surface. That is D20.

**Q27.** You picked D, "you decide". Decision and reasoning in §4.

---

## 3. Rules

R1–R9 are unchanged from `frontend-prototype-findings.md`. R10–R21 came from
round 1. R22–R32 come from round 2.

### Data honesty

| #       | Rule                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| **R1**  | No number renders without its provenance state. One value component, everything goes through it                   |
| **R5**  | Absent data is shown as absent. Nothing inferred, averaged, or filled to make a layout look complete              |
| **R10** | An uncited value says it is uncited, in words, in the same place a citation would appear. Never a silent omission |
| **R11** | A citation popover shows work, edition and page — and nothing else. No quoted source text, no page images (D5)    |
| **R12** | Every material page states its own coverage. The reader never has to guess how sourced the page is                |
| **R22** | Uncited is phrased as work in progress, never as an error. Grey, not amber, not red (D21)                         |

### Architecture

| #       | Rule                                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **R2**  | No property list is written in JSX. Sections, order and grouping come from `/api/properties`                                  |
| **R3**  | Display strings come from the API. The frontend formats nothing numeric                                                       |
| **R4**  | Every screen defines four states before it is done: loading, error, empty/partial, full                                       |
| **R7**  | An interactive tool declares the data it needs and does not render when that data is absent. No silent defaults               |
| **R13** | Real URL paths, never hash routes. Every material and every search result state is a linkable, prerenderable address (D7)     |
| **R14** | No user-visible string is written inline in a component. All text goes through the i18n layer from day one (D13)              |
| **R15** | Persian is the reference language. Layouts are designed in Persian first and verified in English, never the reverse (D13)     |
| **R16** | A material page is built to accept a grade selector without restructuring, even though grades do not exist yet (D15)          |
| **R23** | Nothing may require a Node server at runtime. Hosting is undecided and must stay that way (D27)                               |
| **R24** | Heavy libraries — Three.js, Chart.js, GSAP — may not appear in any Datasheet-route bundle. They belong to Learn islands (D32) |

### Design

| #       | Rule                                                                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R6**  | RTL-first. LTR is a per-span exception for numerals and Latin technical terms, never a page-level mode                                                      |
| **R8**  | The prototype is the content brief, not the design. Its authored prose is an asset; its layout is not a constraint                                          |
| **R17** | Mobile and desktop are two designs, not one design with breakpoints. A screen is done when both are done (D8)                                               |
| **R18** | Every affordance has a non-hover equivalent. Hover is an enhancement, never the only route to information (D8)                                              |
| **R19** | The two surfaces are visually distinct on purpose: Datasheet restrained and dense, Learn generous and animated. One token set, two applications of it (D20) |
| **R20** | No design decision is made without the owner seeing it applied to real Polypedia content (D12)                                                              |
| **R25** | All numerals are Latin, in both languages, in prose and in data. One rule, no exceptions to remember (D18)                                                  |
| **R26** | Emoji are decorative only: `aria-hidden`, never the sole carrier of meaning, never an interactive control's only label (D33)                                |
| **R27** | No element may exceed the viewport width. Horizontal page shift is a build-breaking defect, verified at 320, 375 and 768 px (Q34)                           |
| **R28** | Content order is derived from `sort_order` and an explicit learning path. Nothing is ordered by accident (Q34)                                              |

### Process

| #       | Rule                                                                                                                                                  |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R9**  | Each screen is built against the real API with real — mostly uncited, mostly incomplete — data. No sign-off on curated demo data                      |
| **R21** | The frozen prototype stays buildable and untouched until the new app replaces it. It is a content reference, not a source of code to copy             |
| **R29** | Every screen ships with tests: logic units, component tests for the value atom and the four states, and an end-to-end journey per surface (D30)       |
| **R30** | A screen is not done until it has been seen at 320 px and at 1440 px, in light and dark, in Persian and English (D8, D19, D13)                        |
| **R31** | Performance budgets are asserted in CI, not measured by eye (D32, see §6)                                                                             |
| **R32** | Typography is verified on every screen against the real Persian corpus, not lorem ipsum. Font defects were the owner's single biggest complaint (Q34) |

### ⚠ One licence flag before FE-0 starts

**IRANSansX (D17) is not unambiguously free for commercial use.** It is
distributed by FontIran under terms that are permissive for personal and
non-commercial use, with commercial use requiring a purchased licence. Polypedia
is a public site with a stated B2B ambition (P3 in `project-plan.md`), which is
commercial on any reasonable reading.

This needs one of: a licence you buy and own, written confirmation that the use
is covered, or the Estedad fallback you already nominated. **Estedad is SIL
Open Font License** and carries none of this risk.

I will not ship a webfont whose licence is unresolved. FE-0 proceeds with
Estedad as the working face and switches to IRANSansX the moment the licence is
settled — the swap is a token change, not a redesign, provided the metrics are
checked at the same time.

---

## 4. Technology decision (D26)

**Astro, with the interactive tools as React islands.**

You asked me to decide. The reasoning, in the order the constraints forced it:

1. **R23 — nothing may need a Node host.** Hosting is undecided and will
   probably end up domestic (D27). Astro's default output is static HTML, which
   runs on Cloudflare Pages today and on anything at all later. Next.js assumes
   a Node runtime and would make the hosting decision for you.
2. **D32 — the Datasheet must be fast and the Learn tools must be heavy.** This
   is precisely the islands model. A material page ships as HTML plus a few
   kilobytes for the citation popover; Three.js and Chart.js live on the Learn
   route and load when the reader goes there. On Vite alone you can approximate
   this with lazy imports, but you are fighting the framework rather than using
   it.
3. **D7 — SEO later, not never.** Static pages per material are indexable from
   day one at no extra cost. Retrofitting prerendering onto a client-rendered SPA
   is a project; here it is the default.
4. **D28 — `/fa/…` and `/en/…`.** Astro's i18n routing produces both trees at
   build time.
5. **The simulators are unaffected.** They stay React components with the same
   props. This is not a rewrite of the expensive part.

### The one real cost, stated plainly

Static generation means **material pages are built, not fetched**. When curation
lands new values, the site must rebuild to show them. That is fine — curation
moves in batches, not per-second — but it is a real operational step, and it is
the honest downside of this choice.

Two escape hatches, neither needed now: Astro can render specific routes on
demand if a Node adapter is ever added, and the pages can hydrate fresh values
client-side from the API if staleness ever becomes a problem.

### The consequence nobody expects: search needs a runtime

Static hosting serves documents. **Property search needs something to query.**
Two options, to be decided at FE-5:

- **(a) Host the API.** Small server, and it makes the hosting decision urgent.
- **(b) Ship a prebuilt search index as static JSON.** At the current scale —
  even at 500 materials × 55 properties — this is a few hundred kilobytes, and
  search runs entirely in the browser with no server at all.

**Recommendation: (b) for v1.** It keeps the whole site static, keeps hosting
open, and makes search instant. Move to (a) when the catalog outgrows it or when
grades multiply the row count.

This also means **`GET /api/search` may not be needed at all** for v1 — the index
would be generated at build time by a script against the database. Decide before
starting API-1 so the work is not wasted.

---

## 5. Frontend unit map

Replaces U3 / U7 / U8 / U9 in `project-plan.md` — see §1 for why the in-place
refactor was withdrawn.

```
  FE-0  visual identity ................. co-designed with owner; gate for everything visual
   |
  FE-1  app shell ....................... Astro, routing, i18n, tokens, API client, four states
   |
   +-- FE-2  the value atom ............. value + provenance + description. R1 lives here
   |     |
   |     +-- FE-3  datasheet surface .... registry-driven material page
   |     +-- FE-4  catalog + homepage ... browse and search, co-equal
   |     +-- FE-6  compare .............. registry-driven, N-way
   |     +-- FE-7  sources surfaces ..... per-material list + site-wide list
   |
   +-- FE-5  search .................... static index or API — decide at start
   |
   +-- FE-8  Learn surface ............. 12 tools ported as islands
   |
   +-- FE-9  hardening ................. a11y, perf budgets in CI, launch
```

### FE-0 — Visual identity `first, and with you`

Tokens, type scale, colour, spacing, elevation, motion; the two personalities of
R19.

**Colour brief** (D34): muted and vintage-leaning, closer to a Pinterest palette
than to SaaS primaries; soft edges throughout; light default (D19) with a dark
mode that is genuinely designed rather than inverted.

**Type brief**: Estedad working (Latin numerals everywhere, D18 — which is
convenient, because the Persian and Latin figure sets no longer have to
harmonise). Persian and Latin need different optical sizes on the same line;
this is where the prototype's font problems came from (Q34) and it is fixed
here, once, in the scale.

**Deliverable**: three or four **complete alternative treatments of the same real
LDPE page**, not a palette or a mood board. You compare pages. Then one is chosen
and refined.

**Reference points you gave** (Q16): Apple and Claude for craft and restraint;
Notion for calm density; Khan Academy for the learning surface; Nature
Communications for the "premium, not a news site" register; Blue Bank, Alibaba,
Jabama, Fidibo for Persian mobile. Explicitly avoided: Coursera's dryness,
Wikipedia's plainness, MIT's datedness. The stated goal — **a beauty wow moment
followed by an intellectual, data wow** — is the brief for the homepage
specifically.

_Tooling:_ `ui-ux-pro-max` (`/home/amirmahdi/visual/ui-ux-pro-max-skill`,
security-reviewed 2026-08-03 — offline CSV database, no network, no telemetry) is
used as a checklist and a source of candidate palettes, motion presets and
pre-delivery rules. **Not** for Persian typography: its font data is
Google-Fonts-oriented and its RTL entries skew Hebrew.

_Why first:_ every screen after this either uses the system or gets rebuilt when
it arrives. And co-designing needs calendar time the later units do not.

### FE-1 — App shell `CLOSED (2026-08-05)`

Astro project, `/fa/` and `/en/` routing, i18n from the first string, design
tokens from FE-0, API/data client, and the four states (R4) as shared
components. No product screens.

Delivered in `web/` — plan: `construction/plans/fe-1-code-generation-plan.md`,
gate: `construction/fe-1/build-and-test.md`. Fonts self-hosted (Estedad
Variable + Newsreader, SIL OFL) rather than the CDN references FE-0's
prototypes use — an owner decision made mid-plan, not the original default.
FE-2 onward build product screens against this shell.

_Why here:_ cheapest to get right, most expensive to retrofit. i18n retrofit
touches every file; route retrofit touches every link; loading-state retrofit
touches every screen.

### FE-2 — The value atom `CLOSED (2026-08-05)`

One component: value, unit, provenance state, citation popover (metadata only,
D5), plus the ⓘ property explanation beside it. Desktop hover, mobile sheet.
Uncited state grey and worded as in-progress (D21).

_Why before any screen:_ it appears in the datasheet, in search results, in
compare, in the sources table, and inside several simulators. Building it first
means every screen inherits R1 for free instead of being audited for it later.

Delivered in `web/src/components/value-atom/` — plan:
`construction/plans/fe-2-code-generation-plan.md`, gate:
`construction/fe-2/build-and-test.md`. Included a small in-scope fix to the
API (`materials.ts`'s citation query didn't join through to `source`, so R11's
work/edition requirement was previously unsatisfiable). Popovers use the
native Popover API + CSS anchor positioning, per FE-0's gate-record
recommendation, not hand-managed positioning. FE-3 onward consume this
directly rather than rendering values themselves.

### FE-3 — Datasheet surface `CLOSED (2026-08-05)`

**This resolves Q24, which you left open.** The structure, and why:

- `/fa/m/ldpe` **is** the Datasheet. **One long scrolling page**, no tabs.
- A **sticky section rail** — vertical beside the content on desktop, a
  horizontal chip bar on mobile — listing the property groups from the registry:
  شناسنامه, فرآیندپذیری, حرارتی, مکانیکی, فیزیکی, الکتریکی, مولکولی, plus
  producers, applications, chemical resistance, market share.
- `/fa/m/ldpe/learn` is the Learn surface: a **separate route**, reached by one
  prominent button, not a tab.

The reasoning: tabs hide content from Ctrl+F, from deep links, and from search
engines, and they make you click before you can scan — the opposite of what a
datasheet is for. The prototype's three tabs (`ind`/`eng`/`aca`) become three
regions of one scroll. Two surfaces, two routes, and **no third level of tabs
anywhere** — which was the confusion in your answer.

The bridge between them, which also fixes your "no real learning curve"
complaint (Q34, R28): at the end of each datasheet section sits a small card
linking to the matching Learn tool — thermal → state simulator, mechanical →
stress-strain, molecular → DP calculator and Hansen. The learning path is derived
from the data rather than being a pile of widgets in arbitrary order.

At the bottom: **"similar to this, but…"** (D24) and quick-compare.

Empty properties render as invitations linking to the contribute page (D11,
D22). Coverage indicator at the top (D3). Grade selector slot present but inert
(R16).

_Wants_: G0, G1, G2, G3, G6 from `db/DATA-GAPS.md`, or those sections ship empty
and the catalog has two materials.

_Why it is the first real screen:_ the most data types collide here, so it
stress-tests the design system while the design system is still cheap to change.

Delivered in `web/src/pages/{fa,en}/m/[slug].astro` and
`web/src/components/datasheet/` — plan:
`construction/plans/fe-3-code-generation-plan.md`, gate:
`construction/fe-3/build-and-test.md`. Producers/trade names/applications
descoped on approval (0 real rows); processing techniques kept. Proved the
"stress-tests the design system" claim true: found and fixed a real defect
in FE-2's shared `ValueAtom` (long text-type values broke `white-space:
nowrap`) and a grid-container overflow bug one level deeper than FE-0's
`.rail` fix — neither was visible until real content at this unit's scale
exercised them.

### FE-4 — Homepage and catalog `CLOSED (2026-08-05)`

Browsing and search as equals (D6). The homepage carries the "beauty wow" of the
Q16 brief; the catalog carries family grouping, material cards and text search.

Delivered in `web/src/pages/{fa,en}/{index,catalog}.astro` and
`web/src/components/catalog/` — plan:
`construction/plans/fe-4-code-generation-plan.md`, gate:
`construction/fe-4/build-and-test.md`. Catalog search is client-side
filtering over the real 7-material catalog, not FE-5's property search.
**Recorded honestly, not closed as "done" in the full sense of D12/Q16**:
FE-0's co-design process never covered a homepage, so this is a strong first
pass on the existing tokens, worth an owner design review before treating the
"beauty wow moment" as delivered the way the datasheet's design was.

### FE-5 — Property-first search

Sliders bounded by real data as the primary interface, plus a text field that
parses `tg>100 tensile 40-80` for people who know what they want (D24). Results
show the material plus the filtered properties, with a button to throw the whole
result set into compare (D25). Shareable URLs (R13).

**First task of this unit is the §4 decision**: static index or live API.

### FE-6 — Compare

N materials × any registry properties. Largely a recomposition of FE-5's result
table and FE-2's atoms, which is why it lands here and is small. Also reachable
from the bottom of any material page (D24).

### FE-7 — Sources surfaces

Per-material sources table — "like a CSV of data with their source" (D4) — and
the site-wide bibliography. Both are views over data FE-2 already fetches.

### FE-8 — Learn surface

The second surface (D2). Twelve tools ported as islands, each declaring its data
dependencies (R7) and rendering nothing when unmet. Rich treatment (R19), heavy
libraries confined here (R24). Quiz needs G4; processing-window and LCA need G5.

_Why last of the feature units:_ largest, most self-contained, least coupled, and
the one whose contents you want to revisit anyway (D14).

#### FE-8 must include a quiz interface (added 2026-08-05, owner instruction)

G4 is **delivered** — `quiz_question` exists in the database as of migration
0012 — so the quiz is no longer blocked, and building somewhere for it to live
on the Learn surface is now an FE-8 deliverable rather than a "if we get to
it". The owner's instruction was explicit: the Learn environment needs a quiz
interface. Placement within Learn is the frontend's call; its existence is not.

What the table gives you, so the component can be designed against it rather
than against `DynamicQuiz.tsx`'s old prop shape:

| Column                     | Notes for the UI                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `prompt_fa` / `prompt_en`  | `prompt_fa` is NOT NULL; `prompt_en` may be absent, so the English build needs a fallback |
| `options_fa` / `options_en`| JSON arrays. When `options_en` exists the schema guarantees it is the **same length**    |
| `correct_index`            | Zero-based, constrained to be in range — one index addresses both languages             |
| `feedback_fa` / `feedback_en` | Shown after answering; both optional                                                 |
| `difficulty`               | `intro` / `applied` / `advanced` — lets Learn build a graded run rather than one flat list |
| `sort_order`               | Author-controlled ordering within a difficulty                                          |
| `status`                   | `material_status`; render `published` only                                              |

Two consequences worth designing around now rather than discovering later:

1. **Quiz content is authored, not cited.** Unlike every other value on the
   site, a quiz question carries no citation chain by design (see migration
   0012's header). Do **not** render a provenance marker on it — the marker
   means "this is traceable to a source", and putting one on invented content
   would be a lie in the one place the whole site's credibility rests.
2. **A material may have zero questions.** All four newly-added polymers do
   today. The quiz island must render nothing at all in that case, per R7 —
   not an empty shell, and not the "no data yet, add a source" call to action,
   which is for missing *measurements*, not missing *teaching material*.

### FE-9 — Hardening, then launch

Accessibility pass, performance budgets asserted in CI (R31), full RTL/LTR
verification, mobile and desktop verification of every screen (R30), and the
horizontal-overflow check that fixes your most-hated prototype defect (R27).

---

## 6. Performance budgets (D32, R31)

Asserted in CI, failing the build when exceeded.

| Route     | JS shipped    | Usable on a slow 3G-class connection            |
| --------- | ------------- | ----------------------------------------------- |
| Homepage  | ≤ 60 kB gzip  | ≤ 2.5 s                                         |
| Datasheet | ≤ 80 kB gzip  | ≤ 3 s                                           |
| Search    | ≤ 120 kB gzip | ≤ 3 s (index streamed, not blocking)            |
| Learn     | unbounded     | loads on navigation, with a real progress state |

Three.js and Chart.js appearing in any bundle other than Learn is a build
failure, not a review comment (R24).

---

## 7. Dependencies outside the frontend

All in `db/DATA-GAPS.md` except API-1. **Updated 2026-08-05: every database
dependency below is now delivered.** Only API-1 remains.

| Dep       | What                                        | Blocks | Status                                              |
| --------- | ------------------------------------------- | ------ | --------------------------------------------------- |
| **G0**    | Migrate PP, PVC, PET, PS                    | FE-3   | ✅ Done — 7 materials seeded, values await curation |
| **G3**    | Property scoping                            | FE-3   | ✅ Done — `applies_to_families` added and seeded    |
| **G1**    | `material_organization` join table          | FE-3   | ✅ Done — migration 0011                            |
| **G2**    | `trade_name` table                          | FE-3   | ✅ Done — migration 0011, joined to G1              |
| **G6**    | English overviews                           | FE-3   | ✅ Done — all 7 materials have `overview_en`        |
| **G4**    | `quiz_question` table                       | FE-8   | ✅ Done — migration 0012; see the FE-8 note above   |
| **G5**    | Property definitions for simulator inputs   | FE-8   | ✅ Done — seed 0007, plus `material_process` fork   |
| **G7**    | Section-level narrative prose               | FE-3   | ✅ Done — `material_section_note`, migration 0012   |
| **API-1** | Search backend **or** static index builder  | FE-5   | ⬜ Outstanding — 3–5 days, or ~1 day for the index route |

Three of these landed in a shape the frontend plan did not previously assume,
and FE-3/FE-8 should be read with them in mind:

- **G3 is two levels, not one.** `applies_to_fields` (coarse) is ANDed with the
  new `applies_to_families` (fine). The fine level is what lets a PVC page stop
  demanding a melting point. `GET /api/properties` now returns both arrays per
  property, so the empty-state logic can tell "unsourced" from "inapplicable"
  without hardcoding polymer science in the frontend.
- **G5 grew a table.** Processing data is no longer flat on the material: a
  material (or a grade) has many `material_process` rows, one per technique,
  and the melt/mould/pressure numbers hang off *those*. The
  ProcessingWindowSimulator should therefore be driven by a chosen technique,
  not by a polymer id alone.
- **G7 produced a citable table**, not folded-in prose as this plan originally
  guessed. `material_section_note` carries `group_key`, so section notes render
  inside their datasheet section, and they **do** get a provenance marker —
  unlike quiz content.

**API-1 is now the only thing to act on.**

---

## 8. What is not in this plan

- **Redesigning individual simulators.** Kept as-is on purpose (D14); a later
  unit once they run on real data.
- **Grades in the UI.** The slot exists (R16); the feature is U6.
- **Auth, admin, curator screens.** U12, unchanged.
- **A third language.** The seam exists (R14); no content commitment.
- **The contribute page's backend.** FE-3 links to it; it is a static page until
  there is something to submit to.

---

## 9. Approval gate — CLEARED 2026-08-03

All three items answered by the owner:

1. **Font** — Estedad accepted (D17). The IRANSansX licence question is closed,
   not deferred.
2. **Interpretations** — Q3 (nothing hidden) and Q21 (craft is the house style)
   both confirmed.
3. **G0** — deferred by decision. The rebuild ships with LDPE and HDPE; the other
   four materials join through normal curation. Catalog and search must therefore
   be designed to look right with a small catalog (`db/DATA-GAPS.md` G0).

**Construction started at FE-0.**

---

## 10. FE-0 outcome — the house style

**Reviewed 2026-08-03.** Four treatments built and compared; the owner chose a
merge rather than one of them.

| #   | Decision                                                                                                                                                                                                                                                               | Source      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D35 | The house style is **E "Press"**: Studio's structure and row cards, Handbook's entry (serif code, title, and the fact rail as a rule rather than a card), a warmer paper ground between Handbook and Terra, and Atlas's dark plate for the Learn door                  | FE-0 review |
| D36 | **Colour is semantic.** Five hues, five jobs: graphite = structure, teal = measurement, sage = provenance satisfied, grey = provenance absent, clay = something you can do. Ochre is reserved for warnings and is therefore absent from a healthy page                 | FE-0 review |
| D37 | **Learn inverts the system.** Paper becomes instrument-dark; the same status palette carries the same meanings; a separate sequential `--ramp-*` scale encodes temperature and never borrows the status palette. The contrast between the two surfaces is the identity | FE-0 review |
| D38 | One numeral voice — **Newsreader** — across both surfaces, carrying Handbook's charm into the data column instead of stopping at the masthead                                                                                                                          | FE-0 review |

### New rules

| #       | Rule                                                                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R33** | A hue that carries a meaning may not be used decoratively anywhere else. Adding a colour to a screen requires naming its job first (D36)                          |
| **R34** | Status colour and data-encoding colour are separate palettes with a documented boundary. Encoding colour appears only where a colour stands in for a number (D37) |

### Deliverables

`design/fe-0/` — `e.html` (datasheet), `learn.html` (Learn surface),
`a`–`d.html` (the four source directions, kept for reference), `index.html`
(comparison). One `data.js`, one `render.js`, one `base.css` skeleton, one theme
file per direction: the same registry-driven structure FE-1 inherits (R2).

The Learn page doubles as evidence for R7 — two of its eight tools are locked
and say why, which is `db/DATA-GAPS.md` G4 and G5 made visible rather than faked.

### Both modes, both surfaces — added 2026-08-03

| #   | Decision                                                                                                                                                                                                                                                                       | Source |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| D39 | **The surface axis is warm vs cool, not light vs dark.** Datasheet is warm in both modes (cream paper → ember brown); Learn is cool in both (slate green → instrument ink). So the surface is always legible, and light/dark stays a comfort setting instead of doing two jobs | owner  |
| D40 | Datasheet dark is **ember brown `#241d17`**, not black. The Learn door goes _darker_ than the page rather than lighter, so it still reads as a door                                                                                                                            | owner  |
| D41 | Learn light is **slate green `#e9f0ee`**, deliberately neither white nor warm                                                                                                                                                                                                  | owner  |
| D42 | One shared theme preference across both surfaces; each surface renders its own interpretation of it. Light is the default (D19)                                                                                                                                                | design |
| D43 | `--ramp-melt` overlapping the reserved warning ochre is **accepted**: they never appear on the same screen                                                                                                                                                                     | owner  |

| #       | Rule                                                                                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R35** | No `transition: all`. Transitions name their properties, and a theme switch suppresses them entirely — switching a setting is not an animation (found as a real defect during FE-0) |

### The four lab concepts — verdict, 2026-08-03

The owner's response assigned each concept a different job rather than picking
one: _"loved the scale one, graph is extraordinary, map is perfect for later"_,
plus fixes to notebook.

| #   | Decision                                                                                                                        | Source |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D50 | **Scale is the Learn surface's organising structure.** You arrive at the zoom; each tool sits at the length scale it belongs to | owner  |
| D51 | **Graph is a first-class tool inside Learn**, not navigation — D45 already closed the navigation question                       | owner  |
| D52 | **Map is deferred.** It is a per-material view and wants more than two materials to be worth its space                          | owner  |
| D53 | **Notebook is C3's template**, not C2's — the shape educational content arrives in                                              | owner  |

### Remaining before FE-0 closes

- [x] Datasheet dark mode — ember (D40)
- [x] Learn light mode — slate blue (D41), dark base `#3E436F` (owner)
- [x] Lab concept verdict (D50–D53)
- [x] Full type scale, Persian and Latin, with the Newsreader/Estedad pairing verified at every step — `tokens/type.css`, `type.html`
- [x] Motion spec for Learn (R19), respecting `prefers-reduced-motion` — `tokens/motion.css`, `motion.html`
- [x] Contrast audit of all four palettes against WCAG AA — `construction/fe-0/contrast-audit.md`, 6 pairs corrected
- [x] Tokens exported in the form FE-1 will consume — **integration, not delegated**; `design/fe-0/tokens/`, frozen, README states the import contract
- [x] Gate: contrast AA · no `transition: all` · no overflow at 320/375/768 · both themes — `construction/fe-0/build-and-test.md`. PASS after six layout defects found and fixed

Spec for the four: `construction/fe-0/closeout-spec.md`. Gate record:
`construction/fe-0/build-and-test.md`.

**FE-0 is closed.** FE-1 may begin.

---

## 11. The three cores and the material tree — 2026-08-03

Owner correction. Full model in `inception/requirements/three-cores-and-the-tree.md`;
`deep-taxonomy-impact.md` §3–§5 is superseded and marked as such.

| #   | Decision                                                                                                                                                                                                            | Source |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D44 | **Three cores**: C1 datasheet (database + search, the spine), C2 learning environment (interactive, heavy, walled off), C3 educational content (blogs, concept pages, article reviews — later)                      | owner  |
| D45 | **"Obsidian" meant wiki cross-linking, not a graph view.** concepts ⇄ learning ⇄ datasheet, all directions. Links must be data so backlinks work. No graph navigation                                               | owner  |
| D46 | **No value inheritance.** A child page carries only what differs and never repeats the parent; the breadcrumb is how the reader reaches general values. FE-2's value atom is unchanged and unblocked                | owner  |
| D47 | **Processing moves to the end of the datasheet** and is the branch junction: the cards down to LDPE/HDPE, then to film/tube/melt grades, sit there — because processing is where the material stops being one thing | owner  |
| D48 | **Leaf pages are small**: their own processing window, the tools that apply there, the concepts connected at that point. Not a datasheet clone                                                                      | owner  |
| D49 | `docs/polypedia_architecture_deep_v2.md` is **not authoritative** — generated elsewhere with poor context. Mined for content vocabulary, not implemented as a schema                                                | owner  |

| #       | Rule                                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R36** | A child material page never restates a parent's property. If a value is not specific to this node, it is not on this page — link up instead (D46, D48)         |
| **R37** | Every cross-link between a datasheet, a tool and a concept is stored as data, never written as an inline anchor, so backlinks resolve in both directions (D45) |

### Consequences

- **FE-2 is unblocked.** No inherited/specific state on the value atom.
- `material.parent_id` is still wanted, for breadcrumb and child cards only — a
  navigation link, not a resolution mechanism.
- **`property_group.sort_order` for `processing` is 10 today — it is first.**
  It must become last (70, after `academic`). One seed `UPDATE`, and it changes
  the shape of every datasheet.
- A `topic`/`concept` entity and a `link` table with backlinks are both still
  required — they are what C3 and the net rest on.
- L3 GRAPH is no longer a navigation candidate; it remains one of the four
  learning-surface concepts under consideration.

---

## 12. Hybrid build and the wordmark — 2026-08-04

Owner decisions taken during the U11 deployment inception. Full requirements in
`inception/requirements/deployment-requirements.md`; execution in
`inception/plans/deployment-plan.md`.

**§4's open question is now closed, and the answer is "both".** That section left
"static index or live API" to be decided at FE-5 start and recommended the static
index for v1. The owner's decision keeps it and adds the other half behind it:
the site is built statically from the database, and a live API serves only
continuously-changing polymer statistics, which are explicitly not a current
goal. FE-5 therefore starts on the static index with no decision left to make.

| #   | Decision                                                                                                                                                                                                                         | Source |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D54 | **Hybrid build, split by volatility.** Build-time static for everything a reader reads — datasheets, values, citations, Learn, concepts, the search index. Live API for polymer statistics only. v1 ships 100% static            | owner  |
| D55 | **The wordmark animates the domain.** `poly` and `pedia` crack apart, `cyclo` appears between them in an accent hue, then the halves drive back in and squeeze it out. Spec: `construction/fe-0/wordmark-animation-spec.md`      | owner  |
| D56 | **Hosting is ArvanCloud**, domestic, on the free tier: object storage for the static site, CDN for TLS, caching and DNS. GitHub/Cloudflare remains an international mirror, not the main stream. This closes D27's deferred half | owner  |

| #       | Rule                                                                                                                                                                                     |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R38** | Every API-backed value has a build-time fallback baked into the HTML it appears in. An island may replace a number; it may never be the only source of one (D54)                         |
| **R39** | The build never requires the API to be reachable. It reads PostgreSQL directly, so a deploy cannot fail because a service is down (D54)                                                  |
| **R40** | The public API stays read-only, unauthenticated and CORS-restricted to the site origin for as long as it serves statistics only. The first write endpoint makes U12 a prerequisite (D54) |

### Consequences

- **R23 survives intact.** Nothing requires a Node host at serve time; the API is
  additive and optional, which is precisely why the hybrid is safe.
- **R38 is the rule that will break first**, and it is cheap to enforce: render in
  CI with the API stubbed out and fail the build if any element renders empty.
- **FE-9 gains a deployment gate**, not just a hardening one — success criteria in
  `deployment-requirements.md` §7.
- **The wordmark is header chrome on every route**, so it inherits R24: CSS and SVG
  only, no animation library, or it lands in every Datasheet bundle.
- Two FE-0 decisions are now open and blocking the wordmark: the accent hue for
  `cyclo` (it must not borrow one of D36's five semantic hues) and whether the
  Persian lockup پلی|سیکلو|پدیا animates too.

---

## 13. Open item, 2026-08-12 — material overview prose needs its own inception

Owner observation, reviewing the running site:

> "the intro of each polymer is ugly aligned, very ai deriven and not well
> worked on, it must be a steo for later work with inceotion and rules."

Two distinct complaints, deliberately NOT fixed reactively:

1. **Typography and alignment of the overview block** — a presentation defect
   in the datasheet's intro region.
2. **The prose itself reads as machine-written** — `material.overview_en` /
   `overview_fa` were bulk-generated (G6, "English overviews", closed as done
   in §8's gap table). Closing that gap produced *text*, not *editorial*.

The second is the real problem and it is not a CSS fix. It touches questions
this plan has never asked: who writes the overview, what an overview is FOR
on a citation-first site, whether it carries provenance at all (it currently
carries none, like quiz content), how long it should be, and whether the two
languages are translations of each other or independently authored.

**Therefore this becomes its own unit with a proper Requirements Analysis
round**, not a defect ticket. It should not be picked up as part of FE-8 or
FE-9. Prerequisite reading when it starts: D4, R7, and migration 0012's
`material_section_note` (G7, section-level narrative prose), which already
established that narrative content on this site is a separate concern from
measured values.

Status: **not started, awaiting inception.** Deliberately excluded from
FE-8 and FE-9 scope.

---

## 14. Open unit, 2026-08-13 — manufacturers and trade names are NOT delivered

Owner, reviewing the running site:

> "looking at the legacy and my prototype, i don't see the manifacturers and
> companies that make each material! in iran and world, which i am
> disapointed since we said don't miss a single part from it."

**The complaint is correct, and §8's gap table is misleading.** It records:

| **G1** | `material_organization` join table | FE-3 | ✅ Done — migration 0011 |
| **G2** | `trade_name` table                 | FE-3 | ✅ Done — migration 0011, joined to G1 |

Both entries are true about the *schema* and false about the *feature*.
Verified against the live database, 2026-08-13:

| Thing | State |
| ----- | ----- |
| `organization` rows | **25** — 20 manufacturers, incl. 8 Iranian petrochemicals (Bandar Imam, Jam, Amirkabir, Tabriz, Shazand/Arak, Laleh, Ilam, Morvarid) and 12 international (SABIC, Dow, ExxonMobil, Borealis, LyondellBasell, INEOS, …) |
| `material_organization` rows | **0** |
| `trade_name` rows | **0** |
| API exposure | **none** — no route selects `organization` or `trade_name` |
| Frontend | **none** — no component renders a manufacturer |

So the tables exist, the companies exist, and nothing connects or shows them.
§5's FE-3 entry even anticipated this — *"Wants: G0, G1, G2, G3, G6 … or
those sections ship empty"* — and they shipped empty without anyone noticing,
because the gap table said Done.

**Lesson worth keeping**: a gap table entry must record whether the READER
can see the thing, not whether a migration ran. "Schema exists" is not
"delivered".

### What the unit needs

1. **Data** — `material_organization` links (which producer makes which
   polymer) and `trade_name` rows. This is curation, and it should be cited
   like everything else: "X produces Y" is a factual claim. Iranian
   producers are the differentiating half and are the reason this matters.
2. **API** — expose producers and trade names per material.
3. **UI** — a producers section on the datasheet, and plausibly a
   company-browse surface (by country, by material).

Status: **not started.** Not part of FE-8. Should be sequenced by the owner
against the remaining Learn work; the data half is owner-side curation and
is the long pole.
