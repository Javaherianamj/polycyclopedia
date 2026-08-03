# Frontend Rebuild — plan, rules, and delivery order

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
| D17 | **IRANSansX** for Persian, **Estedad** as the fallback if licensing does not clear (see §3 licence flag)                       | Q18  |
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

Replaces U3 / U7 / U8 / U9 in `project-plan.md`, which were defined before the
rebuild decision and assumed an in-place refactor.

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

### FE-1 — App shell

Astro project, `/fa/` and `/en/` routing, i18n from the first string, design
tokens from FE-0, API/data client, and the four states (R4) as shared
components. No product screens.

_Why here:_ cheapest to get right, most expensive to retrofit. i18n retrofit
touches every file; route retrofit touches every link; loading-state retrofit
touches every screen.

### FE-2 — The value atom

One component: value, unit, provenance state, citation popover (metadata only,
D5), plus the ⓘ property explanation beside it. Desktop hover, mobile sheet.
Uncited state grey and worded as in-progress (D21).

_Why before any screen:_ it appears in the datasheet, in search results, in
compare, in the sources table, and inside several simulators. Building it first
means every screen inherits R1 for free instead of being audited for it later.

### FE-3 — Datasheet surface

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

### FE-4 — Homepage and catalog

Browsing and search as equals (D6). The homepage carries the "beauty wow" of the
Q16 brief; the catalog carries family grouping, material cards and text search.

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

All in `db/DATA-GAPS.md` except API-1.

| Dep       | What                                        | Blocks | Size                                    |
| --------- | ------------------------------------------- | ------ | --------------------------------------- |
| **G0**    | Migrate PP, PVC, PET, PS                    | FE-3   | ~1 day of your judgement on 7 values    |
| **G3**    | Populate `applies_to_fields`                | FE-3   | half a day, needs domain judgement      |
| **G1**    | `material_organization` join table          | FE-3   | 1 day                                   |
| **G2**    | `trade_name` table                          | FE-3   | half a day                              |
| **G6**    | English overviews (tooling already exists)  | FE-3   | content                                 |
| **G4**    | `quiz_question` table                       | FE-8   | 1 day                                   |
| **G5**    | 3 property definitions for simulator inputs | FE-8   | 1 day                                   |
| **API-1** | Search backend **or** static index builder  | FE-5   | 3–5 days, or ~1 day for the index route |

**G0 is the one to act on first.** Everything else degrades a section; G0
degrades the catalog from six materials to two.

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

## 9. Approval gate

Construction begins with **FE-0**. Before it starts, three things need you:

1. **The IRANSansX licence** (§3). Proceeding on Estedad unless you say
   otherwise — this does not block FE-0 starting.
2. **Confirmation of the Q3 and Q21 interpretations** (§2).
3. **G0** scheduled. Not a blocker for FE-0 or FE-1, but it must land before FE-3
   is reviewed, and only you can do it.
