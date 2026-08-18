# FE-4 `homepage-catalog` — code generation plan

**Unit**: FE-4, per `inception/plans/frontend-plan.md` §5 unit map
**Scope** (verbatim): "Browsing and search as equals (D6). The homepage
carries the 'beauty wow' of the Q16 brief; the catalog carries family
grouping, material cards and text search."
**Depends on**: FE-1 (shell), FE-2 (value atom, for material cards' coverage
badge reuse), FE-3 (datasheet — every card links there)
**Stories**: S14 (P1: "land somewhere that makes me want to stay")
**Stages skipped**: NFR/Infra unchanged from FE-1–3. Functional Design — no
data model; this unit is presentation over `/api/materials` and
`/api/coverage`, both already built

---

## 0. What this unit is not, stated up front

FE-0's co-design process (four full-page treatments, owner review) never
covered a homepage — its brief was specifically the material/datasheet page.
There is no owner-approved homepage layout to port the way FE-3 ported
`render.js`. This plan builds a homepage using the established token system
(E "Press" house style, the same colours/type/motion every other unit uses)
and real content, but does **not** claim to have independently delivered the
Q16 "beauty wow moment" the way a co-designed FE-0 treatment would have —
that claim needs the owner's eyes, the same as FE-0 needed them for the
datasheet. Framed as a strong first pass to react to, not a finished design
decision.

## 1. Real numbers, checked, not invented

Homepage copy will state actual catalog scope. Checked against the live API,
not assumed: **7 materials, 6 property groups, 73 tracked properties**, real
citation coverage **8.93%** (10 of 112 recorded values). The 8.93% is
mentioned once, honestly, in the same register as the root README's own
"nothing fabricated" framing — not hidden, not the headline.

## 2. Homepage (`/{locale}/`)

Replaces FE-1's placeholder content in `web/src/pages/{fa,en}/index.astro`
entirely — those pages said "not a product screen" from the start,
specifically because FE-4 was going to become the real one.

- [ ] Hero: wordmark/site name, one-sentence mission statement (citable
      polymer reference — the same claim the root README opens with, not a
      new one invented for marketing), two CTAs as visual equals per D6:
      "Browse the catalog" → `/{locale}/catalog`, "Search by property" →
      `/{locale}/search` (FE-5, does not exist yet — same documented-gap
      pattern as every other forward link this frontend has shipped so far).
- [ ] Real stats line (§1's numbers), not decorative — each number links to
      where it's substantiated (materials count → catalog, properties count →
      a material page's rail).
- [ ] A handful (4–6) of real material cards as a browse preview, reusing
      the same `MaterialCard` component the catalog uses (§4) — not a
      separate hand-styled preview, so there is exactly one card design to
      keep on-brand.
- [ ] No heavy client islands. §6's 60 kB gzip JS budget for the homepage is
      the tightest of any route — this page should ship close to zero JS
      beyond the shared theme-toggle/popover-hover scripts every page
      already carries.

## 3. Catalog (`/{locale}/catalog`)

- [ ] Static at build time: every material fetched via `getMaterials()`,
      grouped by family (only families with ≥1 material get a heading —
      4 of the 8 seeded families are currently empty; an empty heading with
      nothing under it is navigation noise, not honesty about scope, which
      the homepage's real stats line already carries).
- [ ] Text search is **client-side substring filtering over the already-
      rendered card list**, not a live API call. With 7 materials, shipping
      the full static list and filtering in the browser is simpler, faster,
      and far lighter than a network round-trip — and it is honestly scoped:
      real property-based search is FE-5/API-1's job (still outstanding
      per §7 of the frontend plan), not something to half-build here under a
      different name.
- [ ] The filter reflects into the URL (`?q=…`) via `history.replaceState`,
      satisfying R13's "every result state has its own URL" without needing
      a backend — reading `?q=` on load restores a shared/bookmarked filter.
- [ ] Family filter as a secondary control (chips, one per non-empty
      family), combinable with the text filter, same client-side mechanism.

## 4. `MaterialCard` — one component, two consumers

- [ ] `web/src/components/catalog/MaterialCard.astro`: name (fa/en per
      locale), code, family, a compact coverage indicator (reuses the same
      percentage `CoverageBadge` already renders on the datasheet — not a
      new coverage visualisation), links to `/{locale}/m/{slug}`.
- [ ] `web/src/components/catalog/catalog-filter.ts`: the client-side
      filter logic (text substring + family chip), plain DOM, no framework —
      consistent with `popover-hover.ts`'s precedent of a shared vanilla
      script rather than a React island for something this small.

## 5. Tests

- [ ] `web/src/components/catalog/catalog-filter.test.ts` — the pure
      matching logic (name-fa/name-en/code substring match, family filter,
      combined), extracted from the DOM-manipulation script so it is
      testable without a browser environment.
- [ ] Manual/browser verification (same method as FE-0–3's gates): no
      overflow at 320/375/768, both themes, both locales; the text filter
      and family chips actually filter the rendered cards; the URL reflects
      the filter and restores it on reload; homepage and catalog JS payload
      checked against the 60 kB/(catalog has no explicit budget row —
      treated as the homepage's neighbour, same target) budget.

## 6. What is explicitly deferred

Property-based search (FE-5/API-1 — outstanding per the frontend plan's own
dependency table), compare (FE-6), a second "beauty wow" design iteration
with the owner. No new design tokens, no new colours — this unit spends
FE-0's system, it does not extend it.
