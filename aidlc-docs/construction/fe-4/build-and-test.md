# FE-4 build and test — the gate record

**Run**: 2026-08-05 (Sonnet, generation + verification)
**Scope**: homepage (replacing FE-1's placeholder) and catalog — family
grouping, material cards, client-side text/family filter.
**Verdict**: **PASS**.

---

## 1. What was checked

| Check | Result |
| --- | --- |
| `api/test/api.test.ts` | 22/22 (1 new: family display names on the list endpoint) |
| `astro check` (40 files) | 0 errors, 0 warnings, 0 hints |
| `vitest run` | 32/32 — 8 new (`filter-logic.test.ts`) + 24 carried |
| `astro build` | 18 pages (was 16; + `/{locale}/catalog`) |
| No overflow, 320/375/768/1024/1440, both themes | 4 pages × 5 widths × 2 themes = 40 checks, 0 failures |
| Console errors | none |
| Homepage JS payload | **130 bytes gzip** referenced (theme toggle + its import), against a 60 kB budget (§6 of the frontend plan) |
| Catalog filter, live | text search narrows to exact matches, family chip filters correctly (verified `polyolefins` → HDPE/LLDPE/LDPE/PP, matching the database's own family assignment), empty state shows/hides correctly, `?q=`/`?family=` reflect into the URL |
| Real numbers on the homepage | 7 materials, 73 tracked properties — read from the live API, not hand-typed |

## 2. A small API addition, and why

`/api/materials`'s list response carried `family` as a bare key
(`"polyolefins"`) with no display name — fine for a filter *value*, wrong to
render as a Persian reader's-facing chip label. Added `familyNameFa`/
`familyNameEn` to the same query (the `family` table was already joined for
the key; no new join). Additive, not breaking — `family` itself is
unchanged, existing consumers unaffected.

## 3. Two structural fixes found by testing rather than assumed correct

- **Semantic HTML**: the homepage's hero section was written as a sibling of
  `<main>` rather than inside it — functionally invisible (the content
  rendered identically either way) but wrong for the accessibility tree,
  since the hero fell outside the page's main landmark. Caught by
  `get_page_text` returning only `<main>`'s content and the hero being
  absent from that extraction — not something a visual check would have
  caught, since nothing looked wrong on screen. Fixed by wrapping hero +
  browse-preview in one `<main>`, both locales.
- **Dead code removed**: `web/src/islands/HealthCheck.tsx` (FE-1's
  proof-of-wiring island) had zero remaining references once the homepage's
  placeholder content was replaced. Removed rather than left as an orphan —
  `DataBoundary.tsx`, the reusable piece it demonstrated, stays; the demo
  island itself does not outlive its demo.

## 4. What this unit did not claim

FE-0's co-design process never covered a homepage — this ships a solid first
pass on the existing token system, not an owner-reviewed "beauty wow moment"
the way the datasheet's design was co-developed through four treatments.
Worth a design review pass with the owner before this is considered final,
the same way FE-0 was.

## 5. What this unit did not touch

Real property-based search (FE-5/API-1, still outstanding — the homepage's
"Search by property" and the catalog's implicit link to it both point at
`/search`, which 404s today, same documented-gap pattern as every other
forward link this frontend has shipped), compare (FE-6), a family-taxonomy
browse view for the 4 currently-empty families (not hidden from the
database, just not rendered as navigation noise with nothing under them).
