# Where to Get Valid Polymer Data

Written in response to a correct objection: _"commercial datasheets are about
products! how should I find something about a general grade — LDPE alone, they
usually have 10 different LDPEs or more."_

Exactly right. This guide exists because that distinction changes which sources
are even applicable.

---

## Part 1: The two kinds of data are not interchangeable

Your database has two separate tables for a reason.

|                     | **`material`** — generic                             | **`grade`** — product       |
| ------------------- | ---------------------------------------------------- | --------------------------- |
| Example             | LDPE, the class of matter                            | Lupolen 2420H               |
| Looks like          | density **0.910 – 0.925** g/cm³                      | density **0.923** g/cm³     |
| Question it answers | "What is LDPE like?"                                 | "What exactly am I buying?" |
| Comes from          | handbooks, encyclopedias, textbooks, review articles | manufacturer datasheets     |

### Why you cannot build generic data out of datasheets

Suppose you download all 12 of a producer's LDPE datasheets and average their
densities. You have **not** computed "the density of LDPE." You have computed
_the average of that company's current product portfolio_ — which shifts when
they discontinue a grade, and which reflects their market focus, not the
material's physics.

A real LDPE range comes from someone who surveyed the whole literature and asked
"across everything ever measured, where does LDPE sit?" That is what a handbook
is for. **Handbooks are generalisations over the primary literature. Datasheets
are single measurements of single products.**

You need both, eventually, and they go in different tables. Right now you are
filling `material`, so: **handbook-type sources only.**

---

## Part 2: Sources for generic material data (what you need now)

Ordered by how much I would trust them, which is also roughly your `source_tier`.

### Tier 1 — Authoritative reference works

These are what your `source` table is already seeded with.

| Work                                                             | Covers                                                               | Access                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| **Polymer Handbook**, 4th ed. (Brandrup, Immergut, Grulke)       | The standard. Density, crystallinity, thermal, solubility parameters | University library; used copies       |
| **Encyclopedia of Polymer Science and Technology** (Mark, Wiley) | Broad; excellent per-polymer articles                                | Library, often online via institution |
| **Principles of Polymerization**, 4th ed. (Odian)                | Synthesis, kinetics, mechanisms                                      | Widely available                      |
| **Polymer Physics** (Rubinstein & Colby)                         | Entanglement Mw, radius of gyration, rheology                        | Widely available                      |
| **Physical Properties of Polymers Handbook** (Mark, Springer)    | Very strong on thermal/mechanical                                    | Library                               |
| **Plastics Materials** (Brydson)                                 | Engineering-oriented, very practical, readable                       | Used copies are cheap                 |

**How to actually get them:** your university library is the realistic route —
Iranian universities commonly hold or license these. Interlibrary loan works. A
used copy of Brydson is inexpensive and genuinely useful. Google Books preview
lets you verify a specific page you already believe exists, which is enough for
spot-checking a value you got elsewhere.

**Start with one book, not six.** Brydson or the Encyclopedia will get you
through most of LDPE and HDPE by itself.

### Tier 2 — Free, legitimate, and genuinely good

**Open-access review articles.** Underrated and the best free option. A review
paper on "polyethylene structure and properties" gives you property ranges _with
citations to the primary literature_, is free, and is citable by DOI and page.

- Search **DOAJ** (doaj.org), **PubMed Central**, **arXiv** (cond-mat.soft)
- Journals: _Polymers_ (MDPI, fully open access), _Progress in Polymer Science_
  (some open), _Polymer Reviews_
- Query pattern: `polyethylene review properties crystallinity` + `open access`

**Wikipedia** — CC BY-SA, legally reusable with attribution. Quality varies but
polymer articles are decent, and they cite their own sources, which is often the
faster path: use Wikipedia to _find_ the primary reference, then cite that.

**PubChem** (pubchem.ncbi.nlm.nih.gov) — US government, public domain. Best
source for your `material_identifier` rows: CAS numbers, molecular formulas,
SMILES, InChI. Not for engineering properties.

**NIST Chemistry WebBook** (webbook.nist.gov) — US government. Thermophysical
data, strongest on monomers rather than polymers.

**Polymer Properties Database** (polymerdatabase.com, run by CROW) — genuinely
useful free generic polymer property pages. Read their terms before bulk use;
fine for consulting and for finding the underlying reference.

**LibreTexts** (chem.libretexts.org) — open-licensed teaching material, good for
overview text and definitions.

### Tier 3 — Consult, but do not copy

- **MatWeb**, **Total Materia**, **Ansys Granta**, **Omnexus/SpecialChem** —
  commercial. Terms of service prohibit bulk extraction; the compilation itself
  may be protected (EU database rights). Fine to look at, fine to use as a
  pointer to a real reference. **Do not scrape, do not bulk-copy.**
- **PoLyInfo** (NIMS, Japan) — large and excellent, free for academic use with
  registration, but redistribution is restricted.

A polymer encyclopedia getting sued by a materials database company would be an
unforced error. Facts are not copyrightable; curated compilations often are, and
terms of service bind you regardless of copyright.

---

## Part 3: Sources for grade data (later — U6)

When you talk to producers, this becomes relevant. Noted here so it is not lost.

- **Manufacturer websites** — Dow, LyondellBasell, SABIC, ExxonMobil, Borealis,
  INEOS, QAPCO, LG Chem all publish datasheet PDFs freely. Published precisely so
  engineers can use them; citing them is correct and expected.
- **Iranian producers** — Bandar Imam, Amir Kabir, Jam, Marun, Shazand,
  Laleh petrochemicals. Getting their datasheets is a **relationship task, not a
  scraping task**, and it is a genuine competitive advantage: nobody else has
  them well-organised, and it is the most defensible part of your data.
- **CAMPUS** (campusplastics.com) — manufacturer data in the standardised
  ISO 10350 format, which makes it unusually comparable across producers.

---

## Part 4: A realistic plan

**Do not start with 109 values.** Start with **ten**, and time yourself.

1. Get **one** reference work covering polyethylene.
2. Export just LDPE: `python tools/curation/export_gaps.py --material ldpe`
3. Fill in the ten easiest values — density, Tg, Tm, crystallinity, tensile
   strength. Record page numbers as you go.
4. Import with `--dry-run` first, fix what it complains about, then import.
5. **Now you know your real rate.** If ten values took two hours, 109 is roughly
   three working days — and the whole campaign is a known quantity instead of an
   open-ended fear.

Then decide whether to continue manually or invest in the automated ingestion
engine. **Do not build the automation first.** You cannot design a good review
queue for a process you have never performed.

### Order of attack

1. **LDPE and HDPE fully cited** — they are already in the database, and getting
   to 100% on two materials proves the whole pipeline end to end.
2. **PP, PVC, PET, PS** — already in the old data, waiting to be migrated.
3. **Then breadth** — new materials, new fields.

Depth before breadth. Two fully-cited materials is a credible product. Fifty
uncited ones is the prototype you already had.

---

## Part 5: Rules that protect the project

**Never invent a page number.** If you cannot find the source, leave the row
blank. `unsourced` is honest; a fabricated citation is undetectable later and
destroys the one thing that makes this project worth building.

**Record the source you actually read.** If you found a value in Brydson who
cites a 1963 paper, cite _Brydson_ and the page you read — unless you actually
read the 1963 paper.

**Prefer ranges to single values** for generic materials. LDPE density genuinely
_is_ a range; collapsing it to one number destroys real information.

**Write down disagreements.** If two handbooks conflict, that is worth capturing
— your `evidence` table has a `conflicting` role for exactly this. Two sourced,
conflicting values are more scientifically useful than one confident number, and
no competitor's database will show you that.

**Watch units.** The most common curation error by a wide margin is a factor of
1000 — g/cm³ vs kg/m³, MPa vs Pa. The importer checks values against plausibility
bounds and will stop you, but check anyway.
