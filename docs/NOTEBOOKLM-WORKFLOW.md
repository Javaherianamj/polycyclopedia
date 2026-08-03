# Using NotebookLM to Extract Cited Values

This is a good plan. NotebookLM only answers from documents **you** upload, and
it points at the passage it used. That is _extraction from a source_, which is
the safe use of AI here — as opposed to asking a chatbot "what is the Tg of
LDPE?", which produces a confident number with no provenance and would poison
the database.

It does not remove the need to check. Read the caveats at the bottom.

---

## Part 1 — What to gather

Upload to **one notebook per polymer family**, not one giant notebook. NotebookLM
gets vaguer as sources multiply, and a Polyolefins notebook that answers about
polyethylene is more accurate than a 40-book notebook that answers about
everything.

### Priority order

| #   | Source                                                                                         | Why                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Brydson, _Plastics Materials_** (7th ed.)                                                    | Best single book for this task. Engineering-oriented, per-polymer chapters with the property tables you need. Cheap used |
| 2   | **Encyclopedia of Polymer Science and Technology** (Mark/Wiley) — the article for your polymer | Deepest per-polymer coverage. Grab individual articles rather than the whole set                                         |
| 3   | **Polymer Handbook** (Brandrup/Immergut/Grulke, 4th ed.)                                       | The reference for density, crystallinity, solubility parameters, heats of fusion                                         |
| 4   | **Polymer Physics** (Rubinstein & Colby)                                                       | The only good source for entanglement Mw, radius of gyration, persistence length                                         |
| 5   | **Principles of Polymerization** (Odian)                                                       | Synthesis, mechanism, kinetics, DP                                                                                       |
| 6   | Open-access review articles on your polymer                                                    | Free, legal, and often the most current numbers. Search DOAJ / PubMed Central for `polyethylene review properties`       |

**Start with one or two.** Brydson plus one Encyclopedia article will cover most
of the 45 numeric properties for LDPE and HDPE.

### Requirements for the files

- **Text-based PDFs, not scans.** A scanned image PDF gives NotebookLM nothing to
  quote and no page structure. If you must use a scan, OCR it first.
- **Keep the original page numbering.** Do not crop or re-paginate — the page
  number is the whole point.
- Note the **edition and year** of every file. You will type them into
  `curation/sources.csv`, and the edition matters because page numbers differ
  between editions.

---

## Part 2 — The prompt

Copy this into NotebookLM. Replace `LDPE` with whichever polymer you are on.

Do **one property group at a time** — the groups are listed after the prompt.
Asking for all 45 at once produces sloppier answers.

```text
You are helping build a cited polymer database. Accuracy and provenance matter
more than completeness.

RULES — these override any instinct to be helpful:
1. Use ONLY the uploaded sources. Never use outside knowledge.
2. If a value is not in the sources, write NOT FOUND. Do not estimate, infer,
   interpolate, or fill in from memory. NOT FOUND is a correct and useful answer.
3. Every value needs a verbatim quote from the source and a page number.
4. If two sources disagree, give me BOTH as separate rows. Do not average them
   or pick one.
5. If the source gives a range, report the range. Do not collapse it to one number.
6. Report the value in the unit the source uses. Do not convert. I will convert.
7. Do not round or reformat numbers. Copy them exactly as printed.

MATERIAL: LDPE (low-density polyethylene), the generic material — NOT a specific
commercial grade or product.

Find these properties:
<PASTE THE PROPERTY GROUP HERE>

Output a markdown table with EXACTLY these columns, one row per value found:

| property_key | value_min | value_max | value_typical | unit_in_source | source_title | page | quote | test_method | conditions |

Column rules:
- property_key: exactly as I listed it, e.g. density
- value_min / value_max: fill BOTH only if the source gives a range
- value_typical: fill ONLY if the source gives a single number (leave min/max empty)
- unit_in_source: the unit exactly as printed in the source
- source_title: which uploaded document
- page: the printed page number. If you cannot determine it, write UNKNOWN —
  do not guess a number
- quote: the exact sentence or table cell the value came from, verbatim
- test_method: e.g. ASTM D1238, only if the source states it, else leave empty
- conditions: e.g. 190°C/2.16kg, only if stated, else leave empty

After the table, list any property from my list that you marked NOT FOUND.
```

### The property groups to paste in

**Physical**

```
density (g/cm³), water_absorption (%), refractive_index (dimensionless),
oxygen_permeability, co2_permeability
```

**Thermal**

```
tg glass transition (°C), tm melting point (°C), enthalpy_exp heat of fusion (J/g),
enthalpy_100_cryst heat of fusion at 100% crystallinity (J/g),
degradation_temp (°C), hdt heat deflection temperature (°C),
vicat softening temperature (°C), conductivity thermal conductivity (W/m·K),
cte coefficient of thermal expansion
```

**Mechanical**

```
tensile_strength (MPa), young_modulus (GPa), elongation_at_break (%),
flexural_modulus (GPa), hardness_shore_d (Shore D), izod_impact (J/m)
```

**Electrical**

```
dielectric_constant, dielectric_strength (kV/mm), volume_resistivity (Ω·cm),
dissipation_factor
```

**Processing**

```
process_temp processing temperature (°C), mfi melt flow index (g/10min)
```

**Academic / molecular** (mostly in Polymer Handbook and Rubinstein & Colby)

```
crystallinity (%), monomer_molar_mass (g/mol), lamella_thickness (nm),
spherulite_size (µm), mw weight-average molecular weight (g/mol),
mn number-average molecular weight (g/mol), pdi polydispersity index,
dp_range degree of polymerization, entanglement_mw (g/mol),
radius_of_gyration (nm), zero_shear_viscosity (Pa·s), power_law_index,
solubility_parameter (MPa^0.5), hansen_d, hansen_p, hansen_h (MPa^0.5),
flory_huggins_chi, ffv fractional free volume, persistence_length (nm)
```

---

## Part 3 — What to send me

Paste the markdown tables back, and tell me for each notebook:

- the **full title, authors, publisher, edition and year** of every uploaded file
- which polymer it was for

I will convert them into `curation/gaps.csv` rows, convert units to our canonical
ones, and run the validator. Anything implausible comes back to you as a question
rather than going in.

**Keep the `quote` column.** It is how you or I verify a value later without
re-opening the book, and it is what makes a disagreement between two sources
resolvable.

---

## Part 4 — Caveats, honestly

**NotebookLM's page numbers are the weak point.** It cites the _chunk_ of text it
used, and depending on how the PDF was built, the page it reports may be the PDF
page rather than the printed page, or missing entirely. **Spot-check the first
ten.** If page numbers are systematically off by a constant (a preface offset),
tell me and I will correct the whole batch.

**It will still occasionally paraphrase a number into existence.** The `quote`
column is your defence: if the quote does not contain the number, the row is
wrong. I check this on import.

**It cannot read graphs.** A value that only exists as a point on a plotted curve
will come back NOT FOUND, or worse, as a guess. Those need your eye.

**NOT FOUND is a good outcome.** A property genuinely absent from your sources
should stay `unsourced` in the database rather than being filled with something
plausible. That is the whole discipline.

---

## Part 5 — The figures and prose question

You asked whether the graphs, figures and paragraphs in these handbooks would be
nice on the site. They would. **Most of them you cannot legally use.**

### What you can and cannot take

| Thing                                                             | Can you use it?                                                                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **The numbers in a table**                                        | **Yes.** Facts are not copyrightable. Extracting values from a table and putting them in your database is exactly what this project does |
| **A figure or graph, reproduced**                                 | **No.** The image is copyrighted artwork owned by Wiley/Elsevier/etc. Putting it on a public site is infringement                        |
| **The data points behind a graph**                                | **Yes.** Read the values off the curve, store them as data, and draw **your own** chart                                                  |
| **A paragraph of explanatory prose, copied**                      | **No.** That is the author's expression, and expression is what copyright protects                                                       |
| **A short quote with attribution**                                | **Usually yes**, if genuinely short and clearly attributed. A sentence, not a section                                                    |
| **Facts you learned from the prose, rewritten in your own words** | **Yes.** Write your own explanation and cite the source for the facts                                                                    |

### The version that is both legal and better

**Redraw the graphs from their data.** You already have Chart.js in the project.
A stress–strain curve you plot from extracted points is:

- legal
- interactive, and can be compared across materials — a static scan cannot
- consistent with your site's styling and Persian labels
- **citable**, which a copied image is not

That last point matters most. Your entire differentiator is "every number is
traceable." A scanned figure with no underlying data is the opposite of that.

**Write your own prose.** Your own explanation of why LDPE branches lower the
crystallinity, in Persian, citing Brydson for the facts, is more valuable to your
readers than an English paragraph lifted from a book — and it is yours.

### What this means for the schema

There is already a `citation.snippet` column holding verbatim source text. Keep
using it — for **internal** verification by you and future reviewers. Showing
those snippets publicly is a separate decision, and it is one of the open
questions in the project plan. My recommendation: keep snippets internal, show
the citation (author, title, page) publicly. That gives readers full
verifiability without republishing anyone's text.

If you later want figures specifically, the clean route is to email the publisher
for permission. Academic publishers grant it more often than people expect,
especially for educational use, and then you can use the figure properly credited.
