# FE-3 `datasheet-surface` — code generation plan

**Scope narrowed on approval (2026-08-05)**: producers, trade names and
applications are cut from this pass — `material_organization`, `trade_name`
and `material_application` are all genuinely 0 rows today, and the owner
chose not to build sections for uncurated tables yet. `processingTechniques`
(`material_process`, 9 real rows) stays in scope; it was not part of what was
cut. Everywhere below that mentions producers/trade names/applications
describes the plan as originally researched — kept as the record of what was
considered, not what was built. §1's table and §4's component list are
authoritative for what actually shipped only where marked ~~cut~~ below.

**Unit**: FE-3, per `inception/plans/frontend-plan.md` §5 unit map
**Scope** (verbatim, condensed): `/fa/m/{slug}` and `/en/m/{slug}` — one long
scrolling page, no tabs (D23). Sticky section rail (vertical desktop,
horizontal chip bar mobile). Groups: identity, processing, thermal,
mechanical, physical, electrical, molecular, producers, applications,
chemical resistance, market share. Coverage indicator above the fold (D3).
Missing properties as invitations (D11/D22), scoped by `appliesToFields`/
`appliesToFamilies` so scope, not absence, decides what's shown (S4). Bridge
cards to Learn tools (R28, S10). Grade selector slot, present but inert
(R16). Bottom-of-page links to "similar, but…" (S7) and quick-compare (S6).
**Depends on**: FE-1 (shell), FE-2 (value atom) — both closed
**Blocks**: nothing downstream in the unit map depends on FE-3 directly, but
it is the template FE-4/FE-6/FE-7 will follow
**Stages skipped**: NFR/Infra unchanged from FE-1/FE-2. Functional Design —
included below as §1–2 rather than a separate document, since it is mostly
"which existing table backs which rail section," not new design

---

## 0. What changed since FE-2 closed, and why this plan is bigger than FE-2's

A parallel session closed G0–G8, G10 and N1 (`db/DATA-GAPS.md`) while FE-2
was in progress: five more materials, producers/trade-names/applications
schema, property scoping, the editorial/observation value model. FE-3's own
spec was written against a "G0–G6 or ship empty, two materials" contingency
that no longer applies — the real thing is buildable now. That also means
FE-3 needs more from the API than FE-2 did: FE-2 needed one join. FE-3 needs
the material-detail endpoint to actually carry the sections the rail lists.
Checked against the schema directly, not assumed — §1 below.

## 1. API expansion — one consolidated step, checked against the schema

`GET /api/materials/:slug` today returns: identity basics, `propertyGroups`,
`chemicalResistance`, `marketShare`, `structure`. It does not return, and
FE-3's rail requires:

| Addition | Backing tables | Real rows today | Rail section |
| --- | --- | --- | --- |
| `overviewFa`/`overviewEn`, `discoveryYear`, `chainType` | `material` columns already selected in `MATERIAL_BY_SLUG_SQL`, just not projected | 7/7 materials have both overviews | Identity |
| `coveragePct`/`totalValues`/`citedValues` | `v_citation_coverage`, already joined on the **list** endpoint, never on **detail** | real (114 evidence rows) | Coverage indicator, D3 |
| `producers` | `material_organization` ⋈ `organization`, split by `country_code` per S8 | 0 rows (schema ready, uncurated) | Producers |
| `tradeNames` | `trade_name` ⋈ `organization` | 0 rows | Producers (shown with their producer, S8) |
| `applications` | `material_application` ⋈ `application` | 0 rows | Applications |
| `processingTechniques` | `material_process` ⋈ `processing_technique` (not `material_processing_technique`, which is a bare junction table with no notes/status/evidence-cleanup trigger — `material_process` is the one wired into the citation system) | **9 rows** — real content exists | Processing |

Zero rows is rendered the same way an uncited value is (D3/D11: shown,
explicitly, as absent — never hidden), not hidden behind a "no data" branch
that skips the section. This mirrors R9 exactly: build against real, mostly-
incomplete data.

- [ ] `api/src/routes/materials.ts`: extend `MATERIAL_BY_SLUG_SQL` (select
      the four already-present-but-unprojected `material` columns), add a
      coverage join (same pattern `MATERIALS_LIST_SQL` already uses), add
      three new parallel queries (producers, applications, processing
      techniques) to the existing `Promise.all`. (partially done — overview/
      discoveryYear/chainType/coverage join and the `processingTechniques`
      query all landed; the producers and applications queries were cut per
      this file's own 2026-08-05 scope-narrowing note and were never added)
- [ ] `web/src/lib/api/types.ts`: `MaterialDetail` gains `overviewFa`,
      `overviewEn`, `discoveryYear: string | null`, `chainType: string | null`,
      `coverage: { totalValues, citedValues, coveragePct }`, `producers:
      Producer[]`, `tradeNames: TradeName[]`, `applications: Application[]`,
      `processingTechniques: ProcessingTechnique[]`. (partially done — every
      field except `producers`/`tradeNames`/`applications` is present on
      `MaterialDetail` in `web/src/lib/api/types.ts`; those three were cut
      along with the query above)
- [ ] `api/test/api.test.ts`: assertions for the new fields against real LDPE
      data (overview, coverage) and a fixture-backed test for producers
      (0 real rows today, same reasoning as FE-2's citation fixture).
      (overview/coverage/processingTechniques assertions exist; no producer
      fixture test exists, since producers were cut from scope, not shipped)

## 2. Assembling the page: registry diff, not a second data model

FE-3 does not introduce a new "missing property" data structure. It computes
one, per group, at request time (build time — this is a static page):

```
for each group in /api/properties:
  candidateProperties = group.properties.filter(p =>
    (p.appliesToFields.length === 0 || p.appliesToFields.includes(material.field.key)) &&
    (p.appliesToFamilies.length === 0 || p.appliesToFamilies.includes(material.family.key))
  )
  for each property in candidateProperties, in registry order:
    value = material.propertyGroups[group.key]?.properties.find(v => v.key === property.key) ?? null
    render <ValueAtom property={property} value={value} locale={locale} />
```

This is S4's acceptance criterion made literal: scope decides what's a
candidate at all; presence/absence among candidates decides missing vs.
shown. Order is the registry's `sort_order` (already the order both API
responses return), not re-sorted client-side (R28). `web/src/lib/pages/
material-detail.ts` holds this as a plain, tested function — not inlined in
the `.astro` template — so FE-4/FE-6/FE-7 can reuse the scoping half of it
without re-deriving it.

## 3. Page structure

- [x] `web/src/pages/fa/m/[slug].astro`, `web/src/pages/en/m/[slug].astro` —
      `getStaticPaths()` enumerates all materials from `getMaterials()` at
      build time (R13: every material a real, prerenderable, linkable
      address). A slug present in one locale's build and absent from the
      other is a build failure, not a partial site.
- [x] Section order, top to bottom: identity (name, code, overview, coverage
      badge, grade-selector slot) → sticky rail + scrolling regions
      (processing, thermal, mechanical, physical, electrical, molecular,
      producers, applications, chemical resistance, market share) → bottom
      bar (Learn bridge already threaded through each section, "similar to
      this" + quick-compare links). (producers/applications regions not
      built — cut from scope, per the file-header note)
- [x] Every section carries a stable `id` matching its registry `key` (S2:
      "every section has a stable anchor URL that survives sharing").

## 4. New shared pieces

- [x] `web/src/components/datasheet/SectionRail.astro` + `section-rail.ts` —
      ports FE-0's `.rail` markup/CSS (already gate-tested, including the
      FE-0 build-and-test fix for the grid-item `min-inline-size: 0` bug that
      made it silently unscrollable on phones) rather than rebuilding it.
      Adds scroll-spy (`IntersectionObserver`, one shared instance) — new
      behaviour FE-0's static prototype never needed, required by S2's "rail
      … reflects scroll position."
- [x] `web/src/components/datasheet/CoverageBadge.astro` — D3's "above the
      fold" indicator, from the new `coverage` field.
- [x] `web/src/components/datasheet/PropertySection.astro` — one registry
      group rendered as a heading + a `ValueAtom` per candidate property
      (§2), reused six times (processing → molecular) rather than six
      hand-written sections.
- [ ] `web/src/components/datasheet/ProducerList.astro`,
      `ApplicationList.astro` — thin, D3/R5-honest renderers over the new API
      arrays; empty state matches `EmptyState.astro`'s pattern from FE-1.
      Trade names render nested under their producer per S8, not as a
      separate flat list. (never built — producers/trade-names/applications
      were cut from FE-3's scope on approval 2026-08-05, per this file's own
      header note; no such components exist in `web/src/components/datasheet/`)
- [x] `web/src/components/datasheet/LearnBridge.astro` — one card per
      section, per R28/S10. The group-key → Learn-tool mapping is a small
      static config object (`web/src/lib/datasheet/learn-bridge-map.ts`),
      **declared once, referenced by every section** — S10's literal
      acceptance criterion. This is frontend information architecture, not
      curated content, so it is code, not a database table.
- [x] `web/src/components/datasheet/GradeSelectorSlot.astro` — R16: reserves
      the layout position and renders a disabled control. 0 real grades
      exist (checked), so "inert" is accurate today, not a simplification.
- [x] `web/src/components/datasheet/BottomLinks.astro` — "similar to this"
      (S7) and quick-compare (S6) as outbound links, **not** built features:
      S7's actual acceptance criterion is "pre-fills the search with this
      material's values," which needs FE-5 (search) to exist; S6 is FE-6's
      unit entirely, FE-3's job is only the entry point ("reachable from the
      bottom of any material page"). Both links point at routes that don't
      exist yet (`/fa/search?from={slug}`, `/fa/compare?add={slug}`) — the
      same honestly-documented-gap pattern as the Learn bridge and FE-2's
      `#contribute` link, not silently built as dead ends.

## 5. What is explicitly deferred, and why

- **`/fa/m/{slug}/learn`** is not created. FE-8 owns the Learn surface; the
  bridge card's `href` points at the intended route and will 404 until FE-8
  lands. Building a stub page here would be scope creep into FE-8's unit.
- **A real "how to contribute" page** is not created — `#contribute` is
  unchanged from FE-2. Not assigned to any FE unit yet in the plan.
- **`material_section_note`** (per-group narrative text) is not surfaced —
  0 rows exist; nothing to render, and the API addition would be untestable
  against real data (R9).
- **Search-driven "similar materials"** and **the actual compare surface**
  are not built — FE-5 and FE-6 respectively, per the unit map and S6/S7's
  own story tags.
- **Grade data** is not fetched — 0 rows exist; R16 already anticipated
  this and only asks for an inert slot.

## 6. Tests

- [ ] `api/test/api.test.ts` — new fields, per §1. (overview/coverage/
      processingTechniques assertions exist; no producer assertions, since
      producers were cut from scope — see §1)
- [x] `web/src/lib/pages/material-detail.test.ts` — the registry-scoping
      diff (§2): a property scoped to a different field is excluded
      entirely (not rendered as missing); an unscoped property with no value
      renders missing; a present value is passed through unchanged; order
      follows registry `sort_order`.
- [ ] `web/src/components/datasheet/*.test.ts` where there is real logic to
      test (scroll-spy's active-section calculation; coverage badge's
      percentage formatting is the API's, not re-derived here per R3). (no
      such test file exists; `construction/fe-3/build-and-test.md` records
      scroll-spy as verified live in-browser instead of unit-tested)
- [x] Manual/browser verification (R30, same method as FE-0/FE-1/FE-2's
      gates): no overflow at 320/375/768 with the rail in both its mobile
      chip-bar and desktop sticky forms; Ctrl+F reaches a value without
      expanding anything (S2); every section anchor survives a direct visit;
      both locales, both themes, at least two real materials (one with
      processing-technique data, one without, to prove the empty state
      isn't just theoretical).

## 7. Files touched, at a glance

New: `web/src/pages/{fa,en}/m/[slug].astro`,
`web/src/components/datasheet/*`, `web/src/lib/datasheet/learn-bridge-map.ts`,
`web/src/lib/pages/material-detail.ts` (+ tests for the last two).
Edited: `api/src/routes/materials.ts`, `api/test/api.test.ts`,
`web/src/lib/api/types.ts`, `web/src/i18n/{fa,en}.json` (identity/section
labels, coverage wording, empty-state copy for producers/applications).
