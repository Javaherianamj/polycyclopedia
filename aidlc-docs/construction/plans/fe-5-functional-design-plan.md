# FE-5 `property-first-search` — Functional Design Plan

**Unit**: FE-5, per `inception/plans/frontend-plan.md` §5. Sliders bounded by
real data as the primary interface, plus a text field that parses
`tg>100 tensile 40-80` (D24). Results show the material plus the filtered
properties, with a button to throw the whole result set into compare (D25).
Shareable URLs (R13). Performance budget: ≤120 kB gzip, index streamed not
blocking, ≤3 s on 3G (§6).

## Why Functional Design runs for this unit, unlike FE-2–4

FE-2, FE-3 and FE-4 all skipped Functional Design — each was presentation over
data the API already returned, with no new algorithm. FE-5 is different: it
needs (a) a static-index generation step (what gets precomputed at build time
and how slider bounds are derived from real data), (b) a text-query parser for
a small domain-specific grammar (`tg>100`, `tensile 40-80`), and (c) a
filter/match/rank algorithm that runs entirely client-side against that index.
That is exactly the "complex business logic needing detailed design" trigger
in `construction/functional-design.md`, so this unit gets the stage the
previous three didn't.

## Already decided — not being re-asked here

- **Static index, not a live API.** Closed by D54/§12: "static first, so FE-5
  starts with nothing left to decide" on that specific question.
- **Interface shape.** Sliders + text box (D24), result = material + the
  properties filtered on + a compare button (D25), shareable URLs (R13).
- **Perf budget.** ≤120 kB gzip JS, index streamed not blocking, ≤3 s on 3G-class (§6).
- **"Similar to this, but…" seed.** FE-3's `BottomLinks` already exists as the
  entry point; S7's acceptance criterion is that it pre-fills the search with
  that material's values — FE-5 needs to accept incoming pre-fill state, not
  invent the link itself.

## Plan steps

- [x] Step 1 — Analyze unit context (frontend-plan.md §5 FE-5, D24/D25/R13, §6, §12/D54, FE-3's `BottomLinks` pre-fill contract)
- [x] Step 2 — Draft this plan
- [x] Step 3 — Embed clarifying questions (below)
- [x] Step 4 — Save plan to `aidlc-docs/construction/plans/fe-5-functional-design-plan.md`
- [x] Step 5 — Collect and analyze answers (Auto Mode default: A on all 8, no ambiguity to resolve since every default was authored as unambiguous)
- [x] Step 6 — Generate functional design artifacts: `business-logic-model.md`, `business-rules.md`, `domain-entities.md`, `frontend-components.md` under `aidlc-docs/construction/fe-5/functional-design/`
- [ ] Step 7 — Present completion message
- [ ] Step 8 — Wait for explicit approval
- [ ] Step 9 — Record approval, update `aidlc-state.md`

---

# Questions

**Auto Mode note**: each `[Answer]:` below is pre-filled with the recommended
option (always **A**, the choice most consistent with what's already decided
and easiest to walk back later) rather than left blank to block on — the same
standing-default-over-blocking-question call this project already made for
all 12 questions in `inception/requirements/database-revision-questions.md`.
Nothing here is locked in: edit any `[Answer]:` line to a different letter (or
"Other") and tell me, and I'll redo the affected part of the functional
design. I'm proceeding to generate the design artifacts on these defaults now.

## Question 1 — Search scope while the site is pre-launch

D10 blocks *publishing* the site until FE-9, but FE-1–4 were all built and
tested against real, current data regardless of `material.status`. Should
FE-5's index include draft materials and unsourced/uncited values the same
way, or does search need to hide anything not yet citation-complete?

A) Everything, same as FE-1–4 — `status='draft'` materials and any property value regardless of citation state all appear. Search is a dev/build-time capability like the rest of the site; publish gating is FE-9's job, not FE-5's

B) Only `published` property values are searchable/filterable; draft-only or unsourced values are excluded from the index entirely

C) Materials must be `status='published'` to appear in search results at all (stricter than B — whole material, not per-value)

D) Other

[Answer]: A

## Question 2 — Text-query property aliases

The example `tg>100 tensile 40-80` uses shorthand (`tg`, `tensile`) rather
than full property names. Where do these aliases come from?

A) Generated automatically from `property_definition` (key, English name, common abbreviations already implied by the key) — no manual curation, every numeric property gets a recognized token for free

B) A curated alias list, hand-picked for a subset of "most-asked" properties; everything else is slider-only and has no text shorthand

C) The text box only accepts full property names typed out — no abbreviations, operators and ranges only (`tensile>40`, not `tg>100`)

D) Other

[Answer]: A

## Question 3 — Text-query language and units

Both `/fa/search` and `/en/search` will exist (R13, matching every other FE
route). Numbers in the DB are already unit-normalized (a legacy of U1's
canonical-units work).

A) English tokens, operators, and canonical units only, on both locales (matches the literal example as written) — the text box is a power-user shortcut, not a translated mini-language

B) Persian aliases and Persian numerals accepted on `/fa/search`, English on `/en/search` — each locale gets its own grammar

C) Both languages/numeral systems accepted on both routes

D) Other

[Answer]: A

## Question 4 — Which properties get a slider

**Found while researching this question**: `property_definition.is_searchable`
already exists (migration 0004, exposed today as `PropertyDefinition.isSearchable`
via `/api/properties`) — this is the schema's own extensibility mechanism for
exactly this decision, not something FE-5 needs to invent. It defaults `true`
and nothing has curated it down yet, so today it's a no-op, but it's clearly
the intended long-term lever (an editor flips a property to non-searchable
without a migration, same extensibility pattern as the rest of the registry).

A) Use the existing flag: eligible = `is_searchable = true` AND the property has at least one real value in the search index (per Q1); bounds computed from the actual min/max in that data. Zero-data properties get no slider, not a disabled one — same rule as before, now grounded in the real column instead of invented fresh

B) A fixed, curated "headline" set (density, tensile strength, Tg, melt index, etc.) gets sliders regardless of `is_searchable`; everything else is text/table-only

C) Every numeric property in the registry gets a slider regardless of `is_searchable` or data volume, with a placeholder bound when there's no real data yet

D) Other

[Answer]: A

## Question 5 — Combining active filters

When multiple sliders and text terms are active at once, how are results computed?

A) Strict AND — a material must satisfy every active constraint (every slider range, every text term) to appear at all

B) AND across sliders, but ranked/scored rather than strict — materials with more matches sort first, partial matches still show

C) Other

[Answer]: A-also be aware they chose a properti to search for so it matters. also we must show close calls too as secondary options

## Question 6 — Grade-level results

U1 v2 added `grade`/`grade_class`. FE-3 already ships a `GradeSelectorSlot`
that's inert today (0 real grades curated). Should FE-5 v1 filter/report at
the grade level, or stay material-level like every other FE surface so far?

A) Material-level only for v1 — same granularity as FE-2–4; grade-specific filtering is future work once `grade`/`grade_class` actually has curated rows behind it

B) Show grade_class alongside the material when the filtered property is grade-dependent, even though the data behind it is currently sparse

C) Other

[Answer]: B

## Question 7 — Compare handoff limit

D25's "throw the whole result set into compare" — does FE-6 (compare, not yet
built) need a cap on how many materials FE-5 can hand it?

A) No cap in FE-5 — send the full filtered set; if FE-6 needs a limit, that's FE-6's problem to solve when it's built

B) FE-5 caps the send (e.g. top N by rank) with a "narrow your search to compare all of these" message past the cap

C) Other

[Answer]: A

## Question 8 — Index staleness

Per R39, the build never depends on a live API — the search index is baked at
build time from the database, same as every other page. Does the search page
need to visibly say when the data was last built?

A) No staleness indicator — consistent with how every other static page already works, nothing else on the site shows a "data as of" note

B) Yes — show a small "data current as of [build date]" note somewhere on the search page, since search aggregates across the whole catalog rather than one material

C) Other

[Answer]: A
