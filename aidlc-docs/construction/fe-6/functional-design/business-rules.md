# FE-6 `compare` — Business Rules

Owner decisions taken 2026-08-12 (four-question round). Where an answer
departed from the options offered, the owner's own wording is quoted, because
the departure is the design.

## The central decision — two layers, and why

The offered options all tried to answer "which value is better?" with colour.
The owner rejected the framing:

> "bold the bigger one (magnitude) and show their size difference with font
> size and bold. then we have application conditional polarity for the user
> need!"

That splits one question into two honest ones:

| Layer | Encodes | Truth status | Always on? |
| ----- | ------- | ------------ | ---------- |
| **Typography** (weight + size) | which value is **larger**, and by how much | Always true. A number being bigger is a fact | Yes |
| **Colour** (good/bad) | which value is **better** | Only meaningful once an application is chosen | No — off until the reader picks one |

This is the same discipline the citation model already enforces: the site
states what it can support and withholds what it cannot. "Higher density is
good" is not a fact; "higher density is better *for chemical tanks*" is one.
So colour is earned by context, never assumed. With no application selected
the table is fully readable in greyscale-plus-typography and asserts nothing.

| #    | Rule | Source |
| ---- | ---- | ------ |
| CR1  | **Magnitude is encoded typographically and is always on.** Within a row, the largest value renders bold at the largest size; others scale down proportionally to their position in the row's own value span. Never a good/bad hue | owner |
| CR2  | **Typography is never the only channel.** Every cell also carries its numeric value, and every row carries an explicit delta readout. Size/weight is reinforcement, not the sole carrier of meaning (a11y; FE-9 will assert this) | [own call] |
| CR3  | **The font-size ramp is bounded**: no cell smaller than the body base size, and the largest at most 1.35× it. A 100× property spread must not produce unreadable or grotesque type | [own call] |
| CR4  | **Good/bad colour appears only when an application is selected.** No application → no polarity hue anywhere in the table | owner |
| CR5  | **Polarity is per (application, property)**, from `application_property_polarity`: `higher_is_better` / `lower_is_better` / `not_relevant`. `not_relevant` renders no hue even with an application selected — it is a real answer, not missing data | owner |
| CR6  | **Polarity is editorial judgement and is labelled as such.** It carries a rationale, is never presented as a sourced measurement, and never inherits a citation. Conflating "we judge this better for pipes" with "a handbook measured this" would corrupt the one thing the site is for | [own call] |
| CR7  | **Row order defaults to most-different-first**, with a toggle back to datasheet group order. Group name renders as a chip on every row so structure survives re-ordering | owner (Q2 A) |
| CR8  | **Ordering uses a range-normalised spread**, not a raw percentage: `(maxRep − minRep) / (observedMax − observedMin)` over the property's whole observed dataset. Percentage-of-mean breaks on properties that cross or approach zero — `brittleness_temp` is −140 to −76 °C in the real data today, where percent-of-mean is meaningless. The reader is still *shown* a percentage where one is meaningful (CR9) | [own call] |
| CR9  | **The displayed delta is relative % only when the row's values share a sign and are bounded away from zero**; otherwise the absolute difference in canonical units is shown. Never print a percentage that is arithmetically real but physically nonsense | [own call] |
| CR10 | **Overlapping ranges are not a difference.** When subjects' min–max bands overlap, the row is marked "comparable / not meaningfully different" and sinks in the difference ordering regardless of midpoint separation. Two densities of 0.918–0.925 and 0.923–0.930 do not have a winner | [own call] |
| CR11 | **One row per (property, conditions) combination.** "Tensile strength (yield)" and "Tensile strength (break)" are distinct rows; a subject is only ever compared against the same conditions. Conditions render in the row label, always | owner (Q4 A) |
| CR12 | **A missing value is rendered as "not curated", never as blank, zero, or a dash** that could read as a measured absence. It also never participates in the difference computation | [own call], consistent with R7 |
| CR13 | **Eligibility is `property_definition.is_comparable = true`** plus at least two subjects holding a real value for that exact (property, conditions) row. A row only one subject can answer is not a comparison | [own call] |
| CR14 | **Subjects may be materials or grade classes, mixed freely.** Comparing `ldpe/film` against `hdpe/film` is the process-matched comparison the data actually supports, and is more honest than comparing generic LDPE to generic HDPE | [own call], follows FE-5 BR6 |
| CR15 | **Desktop is a wide table; mobile freezes the property column and scrolls material columns horizontally.** This is the single sanctioned exception to R27, and it is contained: the page body still never scrolls horizontally, only the table's own viewport | owner (Q3 A) |
| CR16 | **N-way, uncapped on desktop.** FE-5 hands over its full result set (FE-5 BR7 deliberately left the cap to FE-6): FE-6 accepts all of them, and degrades by scrolling rather than by refusing | [own call] |
| CR17 | **Shareable URLs**, same mechanism as FE-5: subjects, selected application, and sort mode all round-trip through the query string (R13) | [own call] |
| CR18 | **Citation asymmetry is visible.** When one side of a comparison is cited and the other is not, the row says so. A difference between a sourced number and an unsourced legacy one is not evidence of a real difference | [own call] |

## Validation notes

- CR8's `observedMax − observedMin` is exactly the bound FE-5's index builder
  already computes per property. FE-6 reuses it rather than deriving a second,
  possibly-disagreeing notion of a property's range.
- Representative value for ordering: `value_typical` when present, otherwise
  the midpoint of `value_min`/`value_max`. Point values (115 rows in the real
  data) have min = max = typical and need no special case.
- Zero-span rows (every subject identical) sort last under CR7's difference
  mode and are candidates for the "hide identical rows" affordance.
