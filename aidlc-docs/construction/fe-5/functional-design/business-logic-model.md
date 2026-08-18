# FE-5 — Business Logic Model

Source: `construction/plans/fe-5-functional-design-plan.md`, all 8 questions
answered A (Auto Mode default). Static index per D54/§12 — no live API in v1.

## 1. Index generation (build-time)

Runs as an Astro build-time step (same "read PostgreSQL directly" pattern
R39 already establishes for every other page), emitting two static JSON
assets served alongside the built site, not bundled into page JS (this is
what keeps the ≤120 kB gzip / "index streamed, not blocking" budget in §6
possible):

- **`search-materials.json`** — one entry per material (BR1: every material
  regardless of `status`, mirroring FE-1–4's own build behaviour), each
  carrying only the numeric summary needed to filter + display it: slug,
  both-locale name, family/field keys, citation coverage, and for every
  `is_searchable` property with at least one real value (BR2) its
  `valueMin`/`valueMax`/`valueTypical`/unit. This is a purpose-built compact
  projection, not a reuse of `MaterialDetail` (too heavy — full property
  groups, all citations, chemical resistance rows, none of which the search
  page renders).
- **`search-properties.json`** — one entry per eligible property (BR2): key,
  both-locale name, symbol, canonical unit, `dataType`, the **observed**
  `min`/`max` across real data (not `property_definition.plausible_min/max`,
  which is a sanity bound, not a UI slider bound), and its derived alias
  tokens (BR3). This is what both the slider panel and the text parser are
  generated from — neither hardcodes a property list.

Both files are generated once per build and fetched by the client on
navigating to the search page (deferred, not blocking first paint) — same
"an island may replace a number; it may never be the only source of one"
posture as R38, just applied to a data file instead of a live value.

## 2. Alias derivation (BR3)

For each eligible property (from `search-properties.json`), the token set a
user can type in the free-text box is derived mechanically from
`property_definition.key`, not hand-curated:

```
tokens(key) = { key } ∪ { first_segment(key) if key contains "_" }
```

`tg` → `{tg}`. `tensile_strength` → `{tensile_strength, tensile}`. This is
exactly what makes the plan's own example (`tg>100 tensile 40-80`) work
without a maintained alias table — new properties get a working shorthand
for free the moment they're marked `is_searchable`. If two properties'
first segments collide (none do in the current 55-property registry, checked
against `property_definition.key` at plan time), the longer/full key always
also matches, so `X_strength Y` typed in full is never ambiguous — only the
short form would be, and that's an acceptable, documented limit of the
generated-alias approach rather than something FE-5 needs to solve now.

## 3. Query parsing (BR4)

The free-text box accepts space-separated tokens, English only, canonical
units implied (never typed — the DB values are already unit-normalized, so
`tensile 40-80` means 40–80 in whatever `search-properties.json` says
`tensile_strength`'s unit is):

- **Comparison form**: `<alias><op><number>` with no spaces, `op ∈ {>, >=, <, <=, =}` — e.g. `tg>100`.
- **Range form**: `<alias> <number>-<number>` (alias and range are two
  whitespace-separated tokens) — e.g. `tensile 40-80`.

Each token is matched against the alias set from step 2. A token whose alias
isn't recognized, or whose number(s) don't parse, doesn't fail the whole
query — it's dropped from the active filter set and surfaced to the user as
an "unrecognized: `<token>`" hint chip next to the text box (own call, not
one of the 8 questions — this is the same "never silently guess" posture the
CSV parser already uses elsewhere in this project, applied to search input).

## 4. Filter matching (BR5, strict AND)

A single `ActiveFilter` shape unifies both input sources:
`{ propertyKey, min?, max? }`. Sliders contribute one filter per moved
slider; parsed text tokens contribute one filter per recognized token. If
both a slider and a text token constrain the *same* property, their ranges
are intersected (the narrower bound from each side wins) rather than one
silently overriding the other — consistent with strict AND applying
uniformly across the whole active-filter set, not just across properties.

A material from `search-materials.json` matches iff, for every active
filter, the material carries a value for that property AND
`[material.valueMin, material.valueMax] ∩ [filter.min, filter.max] ≠ ∅`
(a material with no value at all for a filtered property never matches —
consistent with BR2's "no slider without real data" already keeping
zero-data properties out of the filterable set in the first place).

## 5. Result ordering (own call, not one of the 8 questions)

No scoring/ranking was chosen (BR5 is strict AND, not fuzzy). Results
preserve `search-materials.json`'s natural order, which is the same order
`/api/materials` and the catalog already use — no new sort rule invented.

## 6. Compare handoff (BR8)

D25's "throw the whole result set into compare" sends every currently
matching material's slug to FE-6's compare route (not yet built) as a
URL param, uncapped (BR8). FE-5's job ends at producing that list; any cap
or UX limit on the compare surface itself is FE-6's design decision.

## 7. Incoming pre-fill (FE-3's `BottomLinks`, S7)

FE-3 already ships the "similar to this, but…" entry point on every
datasheet; its acceptance criterion is that it **pre-fills the search with
that material's values** — FE-5 is the consumer of that contract, not the
inventor of the link. On load, if the search page receives a source
material slug (via URL param, e.g. `?from=ldpe`), it looks that material up
in `search-materials.json` and initializes every eligible slider to that
material's own `[valueMin, valueMax]` for each property it has a value for,
with no text-query tokens pre-filled. This reuses the same `ActiveFilter`
application path as a normal slider move — no separate pre-fill code path.
