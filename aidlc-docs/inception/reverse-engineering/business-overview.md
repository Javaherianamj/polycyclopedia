# Business Overview

## Business Context Diagram

```
+-----------------------------------------------------------------+
|                     End Users (Farsi / RTL)                     |
|             Polymer & process engineers, students,              |
|               procurement / specification buyers                |
+-----------------------------------------------------------------+
                                 |
                                 | HTTPS GET (static hosting)
                                 v
+-----------------------------------------------------------------+
|                          Polypedia SPA                          |
|          React 19 + TypeScript, client-side rendered,           |
|            hash-based routing (#ldpe, #catalog, ...)            |
+-----------------------------------------------------------------+
                                 |
                                 | direct static import (build time, no network call)
                                 v
+-----------------------------------------------------------------+
|                    src/data/polymersData.ts                     |
|             In-repo static array: 6 polymer records             |
|                 (LDPE, HDPE, PP, PVC, PET, PS)                  |
+-----------------------------------------------------------------+
```

Note (67-char box width, per the ASCII diagram standard used throughout this artifact set): there is no server tier, no database, and no authentication layer anywhere in this diagram — everything below the browser is a single static JS/CSS bundle produced by `vite build`.

## Business Description

- **Business Description**: Polypedia ("دانشنامه مهندسی پلیمر" — Polymer Engineering Encyclopedia) is a Persian-language (Farsi, RTL), single-page reference application that presents detailed industrial, engineering, and academic datasheets for six commodity thermoplastics (LDPE, HDPE, PP, PVC, PET, PS). It is explicitly branded for a "Polymer Engineering Association" audience and targets Iranian petrochemical industry professionals, students, and specifiers. Per the project's own audit log (`aidlc-docs/audit.md`), this codebase is a **working prototype/reference UI** for a larger planned product: a real backend-and-database-driven polymer property system with per-value citations, cross-material search, and an eventual B2B "compatible core" product for companies to integrate. The current repository implements only the presentation layer of that vision — everything is client-side and the "database" is a hand-authored TypeScript literal array.

- **Business Transactions**: The system implements no server-side transactions (there is no backend), but the following user journeys are the effective "business transactions" of the product:
  1. **Browse catalog by family** — land on the catalog (`#catalog` or empty hash), see 6 polymers grouped into 4 accordion-style polymer families, optionally filter by a client-side substring search across name/code/CAS/trade names/applications.
  2. **Open a polymer detail page ("datasheet")** — select a polymer and view its full record across three tabs: Industrial & Applied (`ind`), Engineering Datasheet (`eng`), Academic & Basic Physics (`aca`). URL hash (e.g. `#ldpe`) deep-links directly to this state.
  3. **Compare two polymers side-by-side** — open the Compare modal, pick any two of the six materials from dropdowns, view a fixed 9-row comparison table (name, resin code, density, Tg, Tm, tensile strength, Young's modulus, crystallinity, process temperature).
  4. **Run an interactive simulator/calculator** — polymer- and tab-specific interactive widgets: physical-state slider (State Simulator), stress-strain chart, chain-branching simulator (LDPE only), tacticity simulator (PS only), processing-window checker against ISO/ASTM benchmarks, PP/ABS alloying blend simulator, degree-of-polymerization (DPn/DPw/PDI) calculator, Hansen solubility 3D chart, 3D ball-and-stick molecular viewer, and an LCA/circular-economy (recycled-content CO2) calculator.
  5. **Take a per-polymer quiz** — a short multiple-choice self-check (`DynamicQuiz`) seeded from each polymer's `quiz[]` array.
  6. **View the resources/citations bibliography** — open the Resources modal, a hand-written static list of handbooks, ISO/ASTM standards, and manufacturer catalogs. This list is **not linked** to any individual data value in the app (see Business Dictionary entry for `sourceId` below).

- **Business Dictionary**:
  | Term                                                  | Meaning in this codebase                                                                                                                                                                                                                                                                 |
  | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | **Grid / گرید**                                       | A specific polymer resin/material record (LDPE, HDPE, PP, PVC, PET, PS) — the unit of content in the catalog.                                                                                                                                                                            |
  | **Family / خانواده پلیمری**                           | A free-text grouping label (`PolymerData.family`, e.g. `'Polyolefins'`, `'Vinyl Polymers'`) used to bucket cards on the catalog page. It is a plain string, not a controlled taxonomy — there is no separate `Family` entity or enum.                                                    |
  | **Datasheet / دیتاشیت**                               | The full per-polymer detail view, organized into the 3 tabs described above; modeled on real industrial technical datasheets.                                                                                                                                                            |
  | **Resin Identification Code (RIC) / کد بازیافت رزین** | The 1–7 SPI/ASTM D7611 recycling number (`resinCode` field), rendered as a badge (`ResinBadge.tsx`).                                                                                                                                                                                     |
  | **SourcedValue**                                      | The `{ value, unit, sourceId, note? }` shape used for nearly every quantitative field, intended to carry citation provenance. `sourceId` is always the placeholder `'src_default'` (269/269) — full verification and implications in `code-quality-assessment.md` Technical Debt item 1. |
  | **Tacticity / Branching / Alloying**                  | Polymer-chemistry concepts surfaced as dedicated interactive simulators, gated to the specific polymers where they are chemically meaningful (branching -> LDPE only; tacticity -> PS only; alloying -> PP, and a dead code path for a non-existent `'abs'` id — see below).             |

## Component Level Business Descriptions

### Polypedia SPA (the entire application — single deployable unit)

- **Purpose**: Present a Farsi-language, richly interactive digital reference/datasheet catalog for six commodity plastics, replicating the depth of a printed engineering handbook plus interactive teaching aids (simulators, calculators, quizzes), as a UI prototype ahead of a planned real backend.
- **Responsibilities**:
  - Render the polymer catalog and per-polymer datasheets from a bundled static dataset.
  - Provide hash-based deep-linking and back/forward browser navigation for individual polymers.
  - Offer light/dark theming via CSS custom properties.
  - Host 12 interactive teaching tools (simulators/calculators/3D viewers/charts) that compute derived values client-side from the static dataset.
  - Present a static, non-linked bibliography of academic and standards sources.
- There are no other packages, services, or deployable components in this repository — see `component-inventory.md` for the full breakdown of the single application package into its constituent front-end modules.
