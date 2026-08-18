# FE-2 `value-atom` — code generation plan

**Unit**: FE-2, per `inception/plans/frontend-plan.md` §5 unit map
**Scope** (verbatim): "One component: value, unit, provenance state, citation
popover (metadata only, D5), plus the ⓘ property explanation beside it.
Desktop hover, mobile sheet. Uncited state grey and worded as in-progress (D21)."
**Depends on**: FE-1 (closed — tokens, API client, i18n, four states all live
in `web/`)
**Blocks**: FE-3 (datasheet), FE-4 (catalog/search results), FE-6 (compare),
FE-7 (sources), and several Learn simulators — all render values through this
**Stages skipped**: Functional Design — no new data model; R1/R5/R10/R11/R12/R22
plus D5/D21 already constitute the functional spec, and FE-0 already
prototyped and gate-tested the interaction pattern (`design/fe-0/render.js`
`valueAtom`/`propertyRow`, `base.css` `.mark`/`.pop`/`.info`). NFR/Infra —
unchanged from FE-1.

---

## 0. A prerequisite fix this plan found: the API can't satisfy R11 yet

**R11**: "A citation popover shows work, edition and page — and nothing else."
**The API's citation response today** (`api/src/routes/materials.ts`,
`MATERIAL_CITATIONS_SQL`) is:

```sql
SELECT e.property_value_id, c.id AS citation_id, c.locator, e.role, e.extraction_method
FROM evidence e JOIN citation c ON c.id = e.citation_id
WHERE e.property_value_id = ANY($1::bigint[])
```

`citation` only carries `locator` (page/table/figure/section) — work title and
edition live on `source`, reached via `citation.source_document_id →
source_document.source_id → source`. That join is **never made**. The API
literally cannot supply "work" or "edition" today; only "page."

This was found by reading the schema (`db/migrations/0006_citations.sql`)
against the route that's supposed to serve R11, not assumed. Fixing it is a
`SELECT`-and-`JOIN` change to one query and one response field, no migration,
no schema change, backward compatible (`Citation` gains fields, loses none).
Building the popover against the incomplete contract would mean shipping a
citation popover that can't do what the one hard rule about citation popovers
requires, in the one component every future screen inherits it from — R2's
whole reason for existing.

**In scope for this plan**: `api/src/routes/materials.ts`'s
`MATERIAL_CITATIONS_SQL` gains the join; `Citation` (both API and
`web/src/lib/api/types.ts`) gains `sourceTitle`, `sourceEdition: string | null`.
Touches the API package — flagged explicitly rather than silently expanding
scope, since `api/` is marked complete in the project status table.

---

## 1. The component surface

```ts
interface ValueAtomProps {
  property: PropertyDefinition;   // name, symbol, description — from /api/properties
  value: PropertyValue | null;    // null = no property_value row exists (D11 "missing")
  locale: Locale;
}
```

`value` being `null` (rather than an empty/error `PropertyValue`) is
deliberate: whether a property is missing for a material is a fact about the
*absence* of a row, which is FE-3's join between `/api/properties` and a
material's `propertyGroups` to compute (R2) — FE-2 only needs to render
correctly when told "there is nothing here."

**Provenance state is derived from `value.citations.length`, not
`value.status`.** The API's `value_status` enum (`draft` / `in_review` /
`published` / `unsourced`) is editorial workflow state — nothing in R1/R10/
R11/R12/R22/D21 gives it a reader-facing treatment, and `v_citation_coverage`
(R12's coverage figure) already counts citedness by citation presence, not by
status. Treating them as the same thing would be inventing UI the rules don't
specify. (`superseded` never reaches the client — `materials.ts` already
filters it server-side.)

Three states, matching FE-0's already-designed and gate-tested pattern
(`render.js`, `contrast-audit.md`'s `.mark-sourced`/`.mark-unsourced` pairs):

| State | Trigger | Mark | Colour | Popover |
| --- | --- | --- | --- | --- |
| Missing | `value === null` | none — `.value-missing` + `.value-cta` | `--muted` | none; the CTA links to the contribute page (D11, D22) |
| Uncited | `citations.length === 0` | `?` button | `--muted`/`--track` (never amber/red, R22) | "در حال تکمیل منابع" + `unsourcedLong` (D21's exact wording, ported from `data.js`) |
| Cited | `citations.length > 0` | `§` button | `--ok`/`--ok-soft` | one entry per citation: `sourceTitle · ed. sourceEdition · p./table/figure/section {locator}` — metadata only, R11. Multiple citations (an `evidence_role` of `primary`/`corroborating`/`conflicting`/`derived_from` each) are listed, not collapsed; `conflicting` gets a visual flag since silently listing a contradicting source as equal would misrepresent it |

The ⓘ property-explanation button is a separate target from the provenance
mark (already resolved as D4 in FE-0; `render.js`'s `info`/`mark` split is
carried over unchanged) — property meaning and value provenance are different
questions and D4 already found that conflating them confused reviewers.

## 2. Interaction: popover mechanics

Built on the native Popover API (`popover` attribute, `popovertarget`),
**not** hand-managed `position: absolute` + hover/focus CSS the way FE-0's
prototypes and FE-1's placeholder pages had to — this is the FE-0 gate
record's explicit carry-forward instruction.

- **Base mechanic** (zero JS, works at Astro build time, no hydration): a
  native `popovertarget` button opens/closes on click/tap/Enter/Space. This
  alone satisfies R18 (a non-hover affordance exists) and works identically
  whether the value atom ends up on a static datasheet page or inside a
  hydrated React island later.
- **Desktop hover enhancement**: a small (~20 line) progressive-enhancement
  script adds `showPopover()`/`hidePopover()` on `pointerenter`/`pointerleave`
  with a short delay, scoped to `@media (hover: hover) and (pointer: fine)`.
  This is the "hover" half of "Desktop hover, mobile sheet" — an enhancement
  layered on top of the base mechanic, not a replacement for it.
- **Positioning**: CSS anchor positioning (`anchor-name` / `position-anchor` /
  `anchor()`) where supported, inside `@supports (anchor-name: --a)`. Fallback
  (older Safari/Firefox): the containing-row technique from the FE-0 gate's
  own popover fixes (`build-and-test.md` §3) — the row becomes the containing
  block, the popover spans it. Not the bug from that gate re-appearing; the
  same *fix* reused deliberately, this time as the default rather than a
  patch.
- **Mobile presentation**: below a breakpoint, the same popover element is
  styled as a bottom sheet (`position: fixed`, anchored to the viewport
  edge) via a media query — one element, two presentations, matching how
  FE-0/FE-1's other breakpoint-dependent components already work.

## 3. Files

- [x] `api/src/routes/materials.ts` — `MATERIAL_CITATIONS_SQL` joins
      `source_document` and `source`; `mapPropertyValueRow`'s citation mapping
      gains `sourceTitle`/`sourceEdition`. `api/test/api.test.ts` gains
      assertions on the new fields.
- [x] `web/src/lib/api/types.ts` — `Citation` gains `sourceTitle: string`,
      `sourceEdition: string | null`.
- [x] `web/src/i18n/fa.json` / `en.json` — value-atom strings, Persian ported
      verbatim from `design/fe-0/data.js`'s `strings` (D21's exact wording is
      already settled; this is not a place to improvise new copy).
- [x] `web/src/components/value-atom/ValueAtom.astro` — the component:
      property label + ⓘ, the value display string (R3 — rendered as-is, no
      client-side number formatting), the provenance mark, both popovers.
- [x] `web/src/components/value-atom/value-atom.css` — imported once into
      `global.css`; not scoped per-instance, since this component appears
      dozens of times per page and Astro's per-component scoping would
      duplicate the same rules dozens of times in the output.
- [x] `web/src/components/value-atom/popover-hover.ts` — the desktop-hover
      progressive enhancement, one shared script for every value atom on a
      page rather than one listener per instance.
- [x] `web/src/pages/fa/index.astro`, `en/index.astro` — the FE-1 placeholder
      pages gain one new section rendering a handful of `ValueAtom`s against
      real data from `getMaterial('ldpe')` (R9 — real, mostly-uncited data,
      not hand-picked examples), covering all three states plus a numeric,
      text and boolean property so the component is proven against real
      variety before FE-3 builds a whole page out of it.

## 4. Tests

- [x] `api/test/api.test.ts` — new assertions for `sourceTitle`/`sourceEdition`
      in the citations response.
- [x] `web/src/components/value-atom/*.test.ts` (Vitest + a DOM environment) —
      state selection logic (missing/uncited/cited from `value`/`citations`),
      string selection per locale, multi-citation and `conflicting`-role
      rendering.
- [x] Manual/browser verification (per R30): both popovers open via
      click/tap/keyboard, hover-opens on a fine-pointer viewport and does not
      on a touch-sized one, no overflow at 320/375/768 (R27) with a popover
      open near a page edge specifically — the exact failure class the FE-0
      gate found six of.

## 5. What this plan deliberately does not include

No datasheet page, no property registry assembly (the `/api/properties` vs
per-material diff that produces "missing" rows — FE-3), no compare surface,
no sources list, no simulator integration (those consume `ValueAtom` later).
Anchor-positioning browser support is not polyfilled — the `@supports`
fallback is the answer for unsupported browsers, not a JS polyfill.
