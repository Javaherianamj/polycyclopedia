# Frontend Rebuild — personas and user stories

**Created**: 2026-08-03
**Why this exists**: D1 says all four audiences are served and each gets its own
route through the site. That is only meaningful if the four routes are written
down. Without this, "serve everyone" quietly becomes "serve whoever the last
screen was designed for".
**Source of truth for decisions**: `inception/plans/frontend-plan.md` §2.

Acceptance criteria here are the definition of done for the units named in each
story. They are deliberately testable — R29 requires an end-to-end journey per
surface, and these are those journeys.

---

## Personas

### P1 — Sara, undergraduate polymer engineering student

Second year, learns on her phone between classes and on a laptop when writing up.
Arrives from a Telegram link. She does not know what Tg _is_ yet — she needs the
concept before the number. The simulators are why she comes back.

**Fails if**: the site assumes she knows the vocabulary, or the phone experience
is a shrunken desktop table.

### P2 — Reza, process engineer at a converter

Ten years on extrusion lines. Needs one number, needs it now, and needs to know
whether he can trust it enough to put it in a spec. Uses Ctrl+F. Will not watch
an animation to get to a melt temperature.

**Fails if**: the value is behind a tab, or he cannot tell a handbook figure from
somebody's guess.

### P3 — Maryam, procurement and specification

Choosing between materials and between suppliers. Thinks in comparisons, not in
single materials. Cares which Iranian producers actually make the grade.

**Fails if**: comparison is limited to two materials, or producer information is
missing — which today it is (G1).

### P4 — Dr. Ahmadi, researcher

Wants the citation more than the number. Will not use a number he cannot trace to
a page. Reads in English as readily as Persian.

**Fails if**: provenance is decorative, or the English pages are hollow.

---

## Stories

### S1 — Understand a property before reading its value `P1` `FE-2`

_As a student, when I meet a property I do not know, I want to learn what it
means without leaving the page._

- [ ] Every property name carries a ⓘ affordance, sourced from
      `property_definition.description_fa` / `_en` — no hardcoded strings (R2)
- [ ] Opens on hover on desktop, on tap on mobile (R18)
- [ ] Distinct from the provenance affordance on the value, and never opens it
- [ ] Works with a keyboard and is announced to a screen reader

### S2 — Find one number fast `P2` `FE-3`

_As a process engineer, I want to reach a specific value in seconds._

- [ ] All datasheet content is in one scrolling document — no tabs (D23)
- [ ] Browser find (Ctrl+F) reaches every value without expanding anything
- [ ] The sticky section rail jumps to any group and reflects scroll position
- [ ] Every section has a stable anchor URL that survives sharing

### S3 — Judge whether a number can be trusted `P2` `P4` `FE-2`

_As an engineer or a researcher, I want to see where a value came from before I
rely on it._

- [ ] Cited values expose work, edition and page — and nothing more (D5, R11)
- [ ] Uncited values say so, in grey, worded as in progress (D21, R22)
- [ ] No value renders without one state or the other (R1)
- [ ] The material page states its own coverage above the fold (R12)

### S4 — See what is missing, and be invited to fix it `P4` `FE-3`

_As a researcher, I want to know that a blank is a blank, not an omission._

- [ ] Properties with no value render as an invitation, not a dash and not a
      hidden row (D11)
- [ ] The invitation links to the contribute page (D22)
- [ ] Only properties that apply to the material's field are shown — depends on
      G3, and without it this story regresses to noise

### S5 — Search by properties, not by name `P2` `P3` `FE-5`

_As an engineer, I want to ask "which materials have Tg above 100 and tensile
between 40 and 80?"_

- [ ] Property picker built from the registry; sliders bounded by real data (D24)
- [ ] A text field accepts `tg>100 tensile 40-80` and fills the sliders
- [ ] Results show the material plus the filtered properties (D25)
- [ ] Every result state has its own URL (R13)
- [ ] Zero results is a designed state that suggests loosening a bound, not a
      blank page (R4)

### S6 — Compare more than two materials `P3` `FE-6`

_As a buyer, I want to put every candidate side by side on the properties I care
about._

- [ ] N materials, not 2; property set chosen from the registry, not hardcoded
- [ ] Reachable from a search result set in one action (D25)
- [ ] Reachable from the bottom of any material page (D24)
- [ ] Each cell carries its provenance, exactly as on the datasheet (R1)

### S7 — Start from a material and look sideways `P3` `FE-3` `FE-5`

_As a buyer, I want "like this one, but stiffer"._

- [ ] Bottom of every material page, beside quick-compare (D24)
- [ ] Pre-fills the search with that material's values as the starting point

### S8 — Know who actually makes it `P3` `FE-3`

_As a buyer, I want the Iranian and international producers._

- [ ] Producers rendered from the database, split by `country_code`, not by two
      hand-maintained lists (G1)
- [ ] Trade names shown with their producer (G2)
- [ ] **Blocked**: neither G1 nor G2 exists yet. This story cannot be accepted
      until they do

### S9 — Play with the concept `P1` `FE-8`

_As a student, I want to move a slider and watch the polymer respond._

- [ ] Learn is its own route, entered deliberately (D23)
- [ ] Heavy libraries load only on that navigation, with a real progress state
      (D32, R24)
- [ ] A tool that lacks its data does not render — no silent defaults (R7)
- [ ] Tools are ordered as a path, not a pile (R28)

### S10 — Get from a number to the idea behind it `P1` `FE-3` `FE-8`

_As a student reading the datasheet, I want to jump to the tool that explains
what I am looking at._

- [ ] Each datasheet section ends with a link to its matching Learn tool
- [ ] The mapping is declared once, in data — not scattered through JSX

### S11 — Read the whole site in English `P4` `FE-1`

_As a researcher, I want English pages that are actually English._

- [ ] `/en/…` exists for every route (D28)
- [ ] No untranslated string leaks through (R14)
- [ ] English material prose comes from the database (D29), so a material with
      no `overview_en` is a **content** gap, visible in curation, not a UI
      fallback

### S12 — Use it on a phone without fighting it `P1` `all screens`

_As anyone arriving from Telegram, I want the site to work on my phone._

- [ ] No horizontal overflow at 320, 375 or 768 px — a build failure, not a
      review note (R27)
- [ ] Every hover affordance has a tap equivalent (R18)
- [ ] Datasheet usable within the §6 budget on a slow connection
- [ ] Mobile is a designed layout, not a scaled desktop one (R17)

### S13 — Trace the whole page's sources at once `P4` `FE-7`

_As a researcher, I want the bibliography for everything on this page._

- [ ] Per-material sources view listing value → source (D4)
- [ ] Site-wide sources view (D4)
- [ ] Both derive from the same data as the per-value popovers — no second
      hand-maintained list, which is exactly what the prototype's Resources modal
      was

### S14 — Land somewhere that makes me want to stay `P1` `P3` `FE-4`

_As a first-time visitor, I want to understand what this is in five seconds and
want to explore it._

- [ ] Homepage offers browsing and property-search as equals (D6)
- [ ] Carries the "beauty wow, then data wow" brief (Q16)
- [ ] Within the §6 budget despite that

---

## Coverage check

| Persona | Stories               | Primary surface     |
| ------- | --------------------- | ------------------- |
| P1      | S1, S9, S10, S12, S14 | Learn + Datasheet   |
| P2      | S2, S3, S5            | Datasheet + Search  |
| P3      | S5, S6, S7, S8, S14   | Search + Compare    |
| P4      | S3, S4, S11, S13      | Datasheet + Sources |

Every persona has at least three stories and a surface where they are the primary
audience. That is what D1 commits to.

## Stories deliberately not written

- Contributing data through the site. FE-3 links to a contribute page; there is
  no submission flow until there is a review queue (U10, U12).
- Anything involving grades. The slot exists (R16); the stories arrive with U6.
- Curator and admin journeys. U12.
