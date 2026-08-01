# The Polypedia Database, Explained Simply

This document assumes you know your polymers but not databases. It explains what
was built, why each piece exists, and what problem it solves. No prior database
knowledge needed.

---

## Part 1: What was wrong before

Your prototype kept all its data in one TypeScript file, `src/data/polymersData.ts`.
It looked roughly like this:

```js
density: { value: '0.910 - 0.925', unit: 'g/cm³', sourceId: 'src_default' }
```

That works fine for showing a number on a page. It breaks down for three reasons.

### Problem 1: The values were text, not numbers

`'0.910 - 0.925'` is a **sentence**, not a number. A computer sees it the way you
see the word "banana" — a sequence of characters with no mathematical meaning.

This means you cannot ask:

> "Show me every polymer with density between 0.90 and 0.95."

The computer would have to read the sentence, notice the dash, split it, and
convert each half to a number — for every polymer, every time you search. And it
would immediately choke on the other formats in your data: `'~ 1.51'`,
`'< 0.01'`, `'10¹⁶ - 10¹⁸'` (with superscript characters).

**Target-material search — the entire point of your project — was impossible on
this representation.** Not "slow." Impossible.

### Problem 2: The citations weren't real

Your data model has a `sourceId` field on every value. That's exactly the right
idea. But all **269** of them contained the same placeholder text:
`'src_default'`.

Worse: no part of your app ever read that field. I checked every component. The
`ResourcesModal` shows a nice bibliography, but it's a hand-typed list with no
connection to any individual number. So there was no way to answer "where did
this specific density figure come from?"

The field existed. The data was a placeholder. Nothing consumed it. Citations
were a good intention that had never actually been wired up.

### Problem 3: Adding a property meant changing code

Your properties (Tg, Tm, density, tensile strength...) were fields in a
TypeScript type. To add "swelling ratio" for hydrogels, a programmer had to edit
the type definition, then edit the components that display it, then rebuild and
redeploy the whole site.

That's fine for 6 polymers with 55 properties. It does not survive contact with
"all polymers in all fields." Elastomers need compression set. Biopolymers need
degradation rate. Composites need fibre volume fraction. Each one would be a
code change.

---

## Part 2: What a database actually is

A database is a set of **tables**. A table is just a grid, like a spreadsheet
tab: named columns, and rows of data.

| id  | slug | name_en                   |
| --- | ---- | ------------------------- |
| 1   | ldpe | Low-Density Polyethylene  |
| 2   | hdpe | High-Density Polyethylene |

Two ideas make it more than a spreadsheet:

**1. Rows can point at other rows.** Instead of typing "Polyolefins" into every
polyethylene row, you have a separate `family` table, and each material stores
the _id number_ of its family. Change the family's name once and every material
referring to it updates. This pointer is called a **foreign key**.

**2. The database enforces rules.** You can tell it "this column may never be
empty" or "this number must be between 0 and 1" or "this row must point at a
family that actually exists." If code tries to break a rule, the database
**refuses the write**. It does not warn. It does not fix it up. It rejects it.

That second idea is the one that matters most for your project, and I'll come
back to it.

---

## Part 3: The structure that was built

24 tables. They fall into five groups.

### Group A — The classification (what kind of thing is this?)

```
field  ──contains──>  family  ──contains──>  material  ──has──>  grade
```

- **`field`** — the broadest bucket: Thermoplastics, Thermosets, Elastomers,
  Biopolymers, Composites, High-Performance Polymers. Six seeded; add more with
  one line.
- **`family`** — e.g. Polyolefins, Vinyls, Polyesters, Styrenics. Families can
  nest inside other families.
- **`material`** — the generic substance. "LDPE" as a class of matter. Its
  numbers are textbook ranges.
- **`grade`** — a specific commercial product, e.g. "Lupolen 2420H" made by
  LyondellBasell, with the exact numbers from _that manufacturer's datasheet_.

**Why `grade` matters, even though it's empty right now.** This is the
distinction between "LDPE melts around 105–115 °C" (a textbook fact) and "this
specific product I can buy has an MFI of 0.3" (a purchasing decision). Your
future B2B customers care almost entirely about the second one.

I seeded it empty on purpose. Adding a table later is easy; _retrofitting_ one
after you have hundreds of materials means rewriting every query in the system.

And your existing data already proves the need. Look at what's currently stored
as PVC's tensile strength:

```
'40 - 60 (Rigid) / 10 - 25 MPa'
```

That's **two different materials** jammed into one text field. Rigid PVC and
flexible PVC are not the same thing. Same for polystyrene (`GPPS / HIPS`) and
PET (`unfilled / glass-filled`). Seven values in your data do this. They're
crying out for the `grade` table.

### Group B — The property registry (the important one)

This is the piece that answers "leave space for later properties."

```
property_group  ──contains──>  property_definition  <──describes──  property_value
```

- **`property_group`** — Thermal, Mechanical, Physical, Electrical, Processing,
  Academic. Six of them, matching your existing UI tabs exactly.
- **`property_definition`** — **one row per property.** 55 seeded, transcribed
  from your existing type file. Each row says: what it's called (in Persian and
  English), its symbol (Tg), its unit (°C), what values are physically plausible,
  whether it's searchable.

Here's the key move. **A property is a row of data, not a column and not code.**

To add "swelling ratio" for hydrogels, you write one line:

```sql
INSERT INTO property_definition (key, name_en, canonical_unit, ...)
VALUES ('swelling_ratio', 'Swelling Ratio', '%', ...);
```

That's it. No code change. No redeploy. No programmer. The property immediately
becomes storable, searchable, and displayable.

There's an automated test that proves this — it invents a hydrogel swelling
ratio, inserts it, stores a value against it, and confirms the whole thing works
without a single structural change to the database.

### Group C — The values (now actually numbers)

**`property_value`** holds the measurements. The important columns:

| Column           | Holds                       | Example                   |
| ---------------- | --------------------------- | ------------------------- |
| `value_min`      | bottom of a range           | 0.910                     |
| `value_max`      | top of a range              | 0.925                     |
| `value_typical`  | a single value              | -110                      |
| `qualifier`      | `<`, `>`, `~` kept separate | `<`                       |
| `unit_display`   | what to show                | `g/cm³`                   |
| `conditions`     | test conditions             | `{temp: 190, load: 2.16}` |
| `test_method_id` | which ASTM/ISO standard     | ASTM D1238                |
| `status`         | how trustworthy             | `unsourced`               |

Compare to before:

|                  | Before                   | Now                            |
| ---------------- | ------------------------ | ------------------------------ |
| Density          | `'0.910 - 0.925'` (text) | min 0.910, max 0.925 (numbers) |
| Water absorption | `'< 0.01'` (text)        | max 0.01, qualifier `<`        |
| Resistivity      | `'10¹⁶ - 10¹⁸'` (text)   | min 1×10¹⁶, max 1×10¹⁸         |
| Refractive index | `'~ 1.51'` (text)        | typical 1.51, qualifier `~`    |

Now `WHERE value_min > 0.9` is a real question the database can answer instantly.

**`test_method` and `conditions` deserve a note.** Melt flow index measured at
190 °C under 2.16 kg is a _different number_ from the same polymer at 230 °C
under 5 kg. Your old data recorded neither the method nor the conditions, which
means strictly speaking its values weren't comparable across materials. Now they
can be.

**The display string is now generated from the numbers**, not the other way
round. That's the whole inversion: numbers are the truth, text is what we
_render_ for humans.

### Group D — Citations (the part that makes this an encyclopedia)

This is a chain of four tables:

```
property_value ──> evidence ──> citation ──> source_document ──> source
```

Reading it backwards:

- **`source`** — a work. "Polymer Handbook, 4th Edition, Brandrup & Immergut &
  Grulke, Wiley-Interscience." Ten of these, transcribed from your existing
  bibliography. Each carries a **quality tier**: a peer-reviewed handbook
  outranks a manufacturer datasheet, which outranks marketing material.
- **`source_document`** — the specific file (a PDF you actually hold).
- **`citation`** — **a specific location inside that document.** Page 412. Table 3-2.
- **`evidence`** — links a citation to a value, and records _how_ it supports it:
  is this the primary source, a corroborating second source, a _conflicting_
  one, or was the value calculated from others?

**Here is the single most important thing in the entire database:**

> The `citation` table has a rule attached: a citation **cannot be saved** unless
> it specifies a page, table, figure, or section.

Try to save a citation with no location, and the database rejects it. `{}` —
rejected. Empty — rejected. `{"foo": "bar"}` — rejected. `{"page": 412}` —
accepted.

This is _why `src_default` can never happen again._ It's not a coding guideline
that someone might forget under deadline pressure. It's not a code review
checklist item. It is structurally impossible to store a citation that doesn't
say where it came from. There are automated tests that try to break this rule and
confirm the database refuses.

### Group E — Housekeeping

- **`tenant`** + a `tenant_id` column — for when you sell the engine to companies
  and each one has private data. Empty now, but the _isolation rules_ are already
  active and tested. Retrofitting this is the kind of mistake that ends companies:
  one bug and Company A sees Company B's formulations.
- **`audit_log`** — who changed what, when, and what it looked like before.
- **`schema_migration`** — tracks which structural changes have been applied.

---

## Part 4: How your existing data got in

Your 6 polymers lived in a TypeScript file. A tool in `tools/etl/` reads that
file and converts it. ("ETL" = Extract, Transform, Load — standard jargon for
moving data from one shape to another.)

The hard part is the text-to-number conversion, because your data had at least
eight different formats. The trickiest real example: thermal expansion was stored
with its unit **split across two fields** —

```js
{ value: '150 - 200 µm/', unit: '°C' }
```

The `µm/` got stranded on the value side. The tool detects this and reassembles
`µm/°C`.

**The tool never guesses.** If it can't confidently understand something, it
stops and reports it rather than storing a number that might be wrong. Silent
wrong data is far worse than a loud failure.

### The clever bit: checking its own work

Your old data had a quirk that turned out to be very useful. Alongside
`density: '0.910 - 0.925'` it also stored `minDensity: 0.910, maxDensity: 0.925`
as separate real numbers — duplicates the sliders needed.

Those duplicates became a **correctness check**. The tool parses the text, then
compares its answer to the numbers that were already there. Agreement means the
parser is right. Disagreement means something is genuinely wrong.

Result: **45 of 46 checks agreed.** The one disagreement is a real defect in your
data (see below).

Those duplicate fields are _not_ carried into the database — two copies of the
same fact can drift apart, and then which one is right? Now there's one copy.

---

## Part 5: Real problems found in your data

These are genuine, and I did not silently "fix" them, because deciding what's
correct is a materials-science judgement, not a programming one.

**1. PET's density contradicts itself.** The displayed range says 1.38–1.40 g/cm³.
The slider field says the minimum is 1.33. Both are in your file. You'll know
better than I do, but this looks like the amorphous/crystalline distinction —
amorphous PET is ≈1.33, crystallised ≈1.38–1.40 — and the displayed range
silently drops amorphous PET entirely.

**2. Seven values contain two materials each.** The PVC/PS/PET cases described
earlier. These need splitting into separate grades.

**3. Six false alarms that turned out to be my mistake, not yours.** My first
version of the checker compared `tgValue` against the midpoint of the Tg range
and flagged six mismatches. But `tgValue` isn't a midpoint — it's the
representative value you picked for the sliders, which is often more accurate
than a naive average. The checker was asking the wrong question. Fixed to ask
"is this value inside the range?" — and all six now pass.

Neither real defect affects LDPE or HDPE. Both of those parse perfectly.

---

## Part 6: What's actually in there right now

|                                 | Count          |
| ------------------------------- | -------------- |
| Tables / views                  | 24 / 3         |
| Property definitions            | 55             |
| Materials                       | 2 (LDPE, HDPE) |
| Property values                 | 109            |
| Sources (bibliography)          | 10             |
| Test methods (ASTM/ISO)         | 28             |
| Manufacturers                   | 25             |
| **Values with a real citation** | **0**          |

### About that last row

Every value is marked `unsourced`, and both materials are marked `draft` rather
than `published`.

**This is deliberate, and I want to be direct about it.** Real citations need
page numbers from the actual handbooks. I don't have those books. I could have
written `{"page": 412}` next to every density figure and the database would have
accepted it — the schema cannot tell a real page number from a plausible-looking
invented one.

That would have made the coverage statistics look excellent and made your
encyclopedia worthless, in a way that would be very hard to detect later. The
entire premise of your project is that the numbers are traceable.

So: nothing is cited, and there's a ready-made work list. Run this and you get
every value still needing a source:

```sql
SELECT * FROM v_unsourced_values;
```

109 rows today. That's the citation campaign, and it needs a person with the
handbooks — it isn't developer work.

---

## Part 7: How to use it

```bash
cp db/.env.example db/.env          # then edit the passwords
docker compose -f db/docker-compose.yml up -d
./db/run.sh                          # build the structure and load the data
./db/test.sh                         # verify everything (16 checks)
```

`./db/run.sh --reset` wipes and rebuilds from scratch.

### Two safety measures worth knowing about

**Migrations.** Every structural change is a numbered file in `db/migrations/`.
They run in order, each records that it ran, and they're never edited once
applied — a change is always a _new_ file. This means any machine can reproduce
the exact same structure, and you can always see how the schema got to where it is.

**Two separate logins.** The app connects as `polypedia_app`, which can read and
write _data_ but **cannot change the structure** — it's physically unable to drop
a table. Structural changes require the owner login, used only for migrations.
So a bug or an attack in the web app cannot destroy your database. This is
tested: the app role tries `CREATE TABLE` and gets "permission denied."

---

## Part 8: The mental model, in three sentences

1. **Properties are data, not code** — so growing from 6 polymers to 6,000, and
   from 55 properties to 500, is data entry rather than software development.
2. **Numbers are the truth and text is generated from them** — the reverse of
   before, which is what makes "find me a material with these properties"
   possible at all.
3. **The database enforces honesty about sources** — a citation without a page
   number cannot physically be stored, so the `src_default` situation cannot recur.

Everything else is detail.
