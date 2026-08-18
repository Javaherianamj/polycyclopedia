# FE-8 step 2 — data requirements, and the canonical encoding rules

**Revised 2026-08-13.** The first version of this document was wrong on its
central claim and is corrected below. Owner's reply is what prompted the
re-audit:

> "what do you mean by migration? i added the data for those 3 to db havnent
> i?"

**You were right and I was wrong.** I searched the registry for
`youngs_modulus` and `tensile_modulus`. The actual key is **`young_modulus`**
(no `s`), it has existed all along, and it holds real cited data. The claim
that "the modulus does not exist" was a key-name error on my part, not a gap
in your data.

---

## 1. Corrected inventory — stress–strain is mostly UNBLOCKED

Audited live, 2026-08-13, against the current database (17 materials, 307
property values, 32 sources):

| Curve anchor | Property | Exists? | Values | Cited |
| ------------ | -------- | ------- | ------ | ----- |
| Initial slope | `young_modulus` | ✅ | 8 | **6** |
| Yield stress | `tensile_strength` @ `{"basis":"yield"}` | ✅ | 7 | **7** |
| Break stress | `tensile_strength` @ `{"basis":"break"}` | ✅ | 4 | **4** |
| Break strain | `elongation_at_break` | ✅ | 10 | **8** |
| **Yield strain** | **`elongation_at_yield`** | ❌ **missing** | — | — |

**Four of five anchors exist and are well cited.** Only yield strain is
genuinely absent.

### Yield strain — derive it, don't curate it (recommended)

Yield strain does not need to be curated, because it is derivable from data
you already have:

```
ε_yield ≈ σ_yield / E
```

This is a real derivation, not a guess, and the schema already has a home for
exactly this: `derivation_rule` on `property_value`. **But it is an
approximation** — real polymers deviate from Hooke's law well before yield,
so `σ/E` *underestimates* true yield strain, often substantially for ductile
polyolefins.

My recommendation: **derive it, mark it `derivation_rule`, and render that
segment of the curve as visibly approximate** (a lighter or dashed elastic
limb) rather than asking you to curate a fifth number for every material. If
you would rather curate real yield strains, say so and I will add
`elongation_at_yield` to the registry — but I do not think it is worth your
time when the derivation is honest and labelled.

---

## 2. The yield encoding decision — RESOLVED from the data

Owner instruction:

> "about the yield, based on the data we have and majority of sources choose
> one way, and write the rule to morph the other way similar to this way (so
> i can curate both ways and you store in the same way)."

### What the data actually says

| Encoding | Rows | Cited |
| -------- | ---- | ----- |
| `tensile_strength` + `conditions = {"basis":"yield"}` | **7** | 7 |
| `tensile_strength` + `conditions = {"basis":"break"}` | **4** | 4 |
| `tensile_strength` + yield stated in free text (`{"text":"rigid PVC at yield"}`) | 1 | 1 |
| A separate `yield_strength` property | **0 — the key does not exist** | — |

### CANONICAL FORM (the one thing to remember)

> **Yield and break stress are both stored as `tensile_strength`, distinguished
> by `conditions.basis` = `"yield"` or `"break"`.**
> There is no `yield_strength` property and one will not be created.

This wins on evidence, not taste: it is the only structured encoding present,
it is 11 rows to 0, and every one of those rows is cited.

### Morph rules — curate either way, stored one way

The importer normalises the following into the canonical form. **You may
curate whichever way your source tabulates; do not normalise by hand.**

| If you write… | Stored as |
| ------------- | --------- |
| `property_key = yield_strength` | `tensile_strength`, `conditions.basis = "yield"` |
| `property_key = tensile_strength_at_yield` | `tensile_strength`, `conditions.basis = "yield"` |
| `property_key = tensile_strength_at_break` | `tensile_strength`, `conditions.basis = "break"` |
| `property_key = ultimate_tensile_strength` / `uts` | `tensile_strength`, `conditions.basis = "break"` |
| `property_key = tensile_strength`, `qualifier` column = `yield` \| `break` | `tensile_strength`, `conditions.basis` = that word |
| `property_key = tensile_strength`, conditions text **containing** "yield" / "at yield" / "تسلیم" | `tensile_strength`, `conditions.basis = "yield"`, remaining text preserved |
| `property_key = tensile_strength`, text containing "break" / "rupture" / "at break" / "پارگی" / "شکست" | `tensile_strength`, `conditions.basis = "break"`, remaining text preserved |
| `property_key = tensile_strength`, no basis stated anywhere | stored with **no** `basis` key — never guessed |

The last row matters. Five existing rows have `conditions = {}`, and they are
**not** silently assumed to be yield. An unlabelled tensile strength is
ambiguous, and the chart treats it as "cannot place on the curve" rather than
inventing a position for it.

### A second normalisation you should know about

Your recent curation encodes test conditions as free text:

```
{"text": "ISO 527-1/-2, 23 °C / 50 mm/min"}
{"text": "20 °C, 0.001 s-1"}
{"text": "BS 2782-3, 20 °C"}
```

That is good curation and nothing is lost — but free text cannot be *matched*.
The stress–strain chart must refuse to plot a modulus measured at 1 mm/min
against an elongation measured at 50 mm/min, and it cannot compare those two
strings reliably. The importer will therefore also parse, **while keeping the
original text verbatim**:

| Parsed into | From |
| ----------- | ---- |
| `conditions.test_method` | `ISO 527-1/-2`, `ASTM D638`, `BS 2782-3`, … |
| `conditions.temperature_c` | `23 °C`, `20 °C` |
| `conditions.rate` | `50 mm/min`, `1 mm/min`, `0.001 s-1` |
| `conditions.text` | kept exactly as you wrote it, always |

Nothing you have already curated needs redoing. Keep writing the text form.

---

## 3. Market share — still genuinely blocked

Unchanged from the first version of this document, and re-verified:
`market_share_datum` has **8 rows**, and every one is `status = 'unsourced'`
with `year` NULL, `region` NULL and `segment_en` NULL. No schema change is
needed — those columns exist and are empty.

Supply `curation/market-share.csv`:

```csv
material_slug,segment_en,segment_fa,percentage,region,year,source_key,page,table,figure,section,note_en
ldpe,Flexible packaging (film),بسته‌بندی منعطف (فیلم),58.8,world,2024,plastics-europe-2024,12,3,,,
ldpe,Agriculture (greenhouse & mulch),کشاورزی (گلخانه و مالچ),24.0,world,2024,plastics-europe-2024,12,3,,,
ldpe,Flexible packaging (film),بسته‌بندی منعطف (فیلم),61.5,iran,2023,npc-annual-2023,44,,,,
```

Enforced on import:

- `region` — `world`, `iran`, or ISO-3166 alpha-2. **Iranian data is the
  differentiating half of this site.**
- `year` — required, four digits. A market share without a year is not a fact.
- Percentages must sum to **100 ±0.5** per `(material, region, year)`. A group
  that does not sum is rejected rather than rendered as a pie chart that lies
  about its own total.
- `source_key` + at least one locator — required.
- Both `segment_en` and `segment_fa` — both locales render.

**Minimum to unblock**: one material, one region, one year, cited. Ideally
`world` and `iran` for the same material and year, because that comparison is
the interesting part.

---

## 4. Migration 0025 — resolved, and it was a real bug

For the record, since it confused both of us: your 12 properties **were**
in the database. What was missing was the migration's own bookkeeping.

`db/run.sh` does not record versions itself — it skips files whose version is
already in `schema_migration` and otherwise just executes them, **trusting
each migration file to register itself**. 24 of the 25 files end with
`INSERT INTO schema_migration (version) VALUES (...)`. `0025` was authored
without that line.

Consequences, all now fixed:

- `schema_migration` reported 24 while 25 files existed → the API's `/health`
  check compares those two numbers and failed permanently.
- `run.sh` silently **re-executed 0025 on every invocation**, harmless only
  because its INSERT is `ON CONFLICT (key) DO NOTHING`.

Fixed by adding the missing line, with a comment explaining why. `./db/run.sh
--migrate` now reports **25 applied**, and the API suite is **48/48**.

**Worth checking**: any future migration authored outside the normal flow
should be checked for this line. The runner cannot detect its absence — it
just quietly does the wrong thing forever.

---

## 5. What is now blocked on what

| Tool | Blocked? | On what |
| ---- | -------- | ------- |
| Stress–strain | **No, buildable now** | 4 of 5 anchors exist and are cited; yield strain derived per §1 |
| Market share | **Yes** | Uncited, undated, unregioned, English labels missing (§3) |
