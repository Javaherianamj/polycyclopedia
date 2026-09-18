# Citation verification report

**Date**: 2026-08-14
**Scope**: every polymer property value in the database that carries a citation (evidence row), as defined the same way the site defines it (`api/src/citations.ts`'s `fetchCitationsByValueId`: an editorial `property_value` row is "cited" if it, or any observation row beneath it via `editorial_value_id`, has an `evidence` row). Solvents (1,180 rows, one mechanical import from a single handbook table) are explicitly out of scope per the task brief and were not touched.
**Backup taken before this audit**: `db/backups/polypedia_20260814T002400Z.dump` (288 KB), via `./db/backup.sh`. No data was modified, so no restore is needed, but the backup exists as the safety net regardless.

## What was actually in the database to check

As of the audit, the live database held:

- **17 materials**, but property values (of any kind, cited or not) exist for only **3 of them** — `ldpe`, `hdpe`, `lldpe`. The other 14 materials (PP, PVC, PMMA, PET, PS, ABS, PC, PA6, PA66, POM, PLA, EPDM, epoxy, PTFE) currently have **zero** property_value rows in the database, cited or otherwise.
- **100 distinct grade-class property values** (102 evidence/citation pairs — two values carry two corroborating citations each), all `status = 'published'`, all attached to `grade_class` subjects (film/injection/blow-molding/rotational-molding/thermoforming populations of LDPE, HDPE, LLDPE). This is the batch imported by `tools/curation/scripts/import_pe_cited_data.py` from `curation/cited data-by author-p1-PE.md`.
- **112 material-level property values**, of which only **10** carry a citation (`status = 'published'`); the other **102** are `status = 'unsourced'` — i.e. already correctly marked as uncited in the schema itself, not a hallucination risk since the site's own citedness model excludes them.
- **0** citations anywhere in the database currently point at a URL. I looked specifically for the LyondellBasell/Borealis/scribd/PMC-style web citations described in the task brief (searched every `source.url`, `citation.snippet`, `property_value.note_en/note_fa` column for `http`, `lyondell`, `borealis`, `scribd`, `pmc`, `ncbi`) and found none. Those citations exist only in staged, **not-yet-imported** curation files — `curation/PP curated data by author.md`, `curation/PVC curated data by author.md`, `curation/PMMA data curated by author.md`, and the per-material CSVs (`curation/pp.csv` etc.) — for materials (PP, PVC, PMMA, PET, PS, ...) that have zero rows in the live `property_value` table. **There is currently nothing web-sourced in the database to audit.** This is worth knowing on its own: those staged files should get the same scrutiny at import time, before they become live citations.

So the entire live, citable dataset is: **112 grade-class + material citation instances** (102 grade-class + 10 material-level). All of them cite one of two books: *Encyclopedia of Polymer Science and Technology, Vol. 2* (Herman F. Mark, ed., Wiley) or *Handbook of Industrial Polyethylene and Technology* (Spalding & Chatterjee, eds., Wiley/Scrivener, 2018, ISBN 9781119159766 — confirmed via web search, 1,381 pages).

## Method

For the grade-class batch, `curation/cited data-by author-p1-PE.md` turned out to be the actual primary-source transcription used at import time — a curator's verbatim copy of the relevant pages/tables of both books, page numbers included, produced before either table existed in the database. This is the strongest verification instrument available (short of buying the books myself): it is what a human actually read off the physical page. I cross-checked every one of the 102 grade-class evidence rows against this transcription, table cell by table cell, value by value, unit by unit.

For the 3 material-level citations to pages not covered by that transcription (`Handbook of Industrial Polyethylene and Technology` p.111/p.121, `Polymer Handbook` p.1), no primary-source transcription exists and the books are not available online in a form I could search or read specific pages of. I confirmed the books are real (ISBN, publisher, page counts) via web search, which bounds plausibility (e.g. "page 111" is well inside a 1,381-page book) but cannot confirm the specific claim.

## Results — grade-class values (100 distinct values, 102 citation instances)

**All 102 CONFIRMED.** Every value, unit, and locator (page + table number) matches the transcribed source text exactly, table cell for table cell, across:
- *Encyclopedia Vol. 2*, Table 3 (p.392, "Three Typical Commercial HDPE Grades" — injection/blow/film), Table 9 (p.477, "LLDPE and LDPE Injection Molding Resins"), Table 10 (p.477, "LLDPE and HDPE Rotational Molding Resins"), Table 11 (p.477, "LDPE, LLDPE, HDPE Blow Molding Resins"), and prose passages at p.518 (LDPE blow-up ratio) and p.397/447/448 (crystal structure, melting ranges — see material-level table below).
- *Handbook of Industrial Polyethylene*, p.577 (thermoforming melt-index sentence).

Full row-by-row detail (100 distinct grade-class property values, 102 citation instances):

| # | Material | Grade class | Property | Value | Locator | Verdict |
|---|---|---|---|---|---|---|
| 1 | hdpe | blow_molding | brittleness_temp | [-140.0, -70.0] °C | p392 table 3 | CONFIRMED |
| 2 | hdpe | blow_molding | brittleness_temp | [-140.0, -70.0] °C | p477 table 11 | CONFIRMED |
| 3 | hdpe | blow_molding | comonomer_content | 0.6 wt% | p392 table 3 | CONFIRMED |
| 4 | hdpe | blow_molding | conductivity | [0.42, 0.44] W/m·K | p392 table 3 | CONFIRMED |
| 5 | hdpe | blow_molding | density | 0.954 g/cm³ | p477 table 11 | CONFIRMED |
| 6 | hdpe | blow_molding | elongation_at_break | 669.0 % | p392 table 3 | CONFIRMED |
| 7 | hdpe | blow_molding | escr | 49.0 h (Condition A) | p392 table 3 | CONFIRMED |
| 8 | hdpe | blow_molding | escr | 29.0 h (Condition B) | p392 table 3 | CONFIRMED |
| 9 | hdpe | blow_molding | escr | 0.0 h (Condition C) | p392 table 3 | CONFIRMED |
| 10 | hdpe | blow_molding | escr | 50.0 h | p477 table 11 | CONFIRMED |
| 11 | hdpe | blow_molding | flexural_modulus | 1.228 GPa (1228 MPa converted) | p477 table 11 | CONFIRMED |
| 12 | hdpe | blow_molding | hardness_brinell | [50.0, 60.0] MPa | p392 table 3 | CONFIRMED |
| 13 | hdpe | blow_molding | hardness_shore_d | 62.0 Shore D | p392 table 3 | CONFIRMED |
| 14 | hdpe | blow_molding | heat_of_combustion | 46.0 kJ/g | p392 table 3 | CONFIRMED |
| 15 | hdpe | blow_molding | heat_resistance_temp | 120.0 °C (printed "ca 120") | p392 table 3 | CONFIRMED |
| 16 | hdpe | blow_molding | mfi | 0.35 g/10min | p477 table 11 | CONFIRMED |
| 17 | hdpe | blow_molding | mfi | 34.14 g/10min (high-load MI, 21.6kg, note says corrects a prior mis-assignment to the injection grade) | p392 table 3 | CONFIRMED |
| 18 | hdpe | blow_molding | notched_impact_area_basis | 17.3 kJ/m² | p392 table 3 | CONFIRMED |
| 19 | hdpe | blow_molding | tensile_impact_strength | 56.8 kJ/m² | p392 table 3 | CONFIRMED |
| 20 | hdpe | blow_molding | tm | 133.5 °C | p392 table 3 | CONFIRMED |
| 21 | hdpe | blow_molding | vicat | 133.0 °C | p392 table 3 | CONFIRMED |
| 22 | hdpe | film | comonomer_content | 3.5 wt% | p392 table 3 | CONFIRMED |
| 23 | hdpe | film | density | 0.939 g/cm³ | p392 table 3 | CONFIRMED |
| 24 | hdpe | film | elongation_at_break | 745.0 % | p392 table 3 | CONFIRMED |
| 25 | hdpe | film | escr | ≥1000 h (Condition A, printed ">1000") | p392 table 3 | CONFIRMED |
| 26 | hdpe | film | escr | ≥1000 h (Condition B) | p392 table 3 | CONFIRMED |
| 27 | hdpe | film | escr | ≥1000 h (Condition C) | p392 table 3 | CONFIRMED |
| 28 | hdpe | film | flexural_modulus | 0.822 GPa (822 MPa converted) | p392 table 3 | CONFIRMED |
| 29 | hdpe | film | hardness_brinell | [35.0, 50.0] MPa | p392 table 3 | CONFIRMED |
| 30-31 | hdpe | film | hardness_shore_d | 51.0 Shore D (duplicate entry, same source) | p392 table 3 | CONFIRMED |
| 32 | hdpe | film | heat_resistance_temp | 117.0 °C (printed "ca 117") | p392 table 3 | CONFIRMED |
| 33 | hdpe | film | mfi | 0.31 g/10min | p392 table 3 | CONFIRMED |
| 34 | hdpe | film | mfi | 23.22 g/10min (high-load MI) | p392 table 3 | CONFIRMED |
| 35 | hdpe | film | notched_impact_area_basis | "No Break" (printed as such — specimen did not fracture) | p392 table 3 | CONFIRMED |
| 36 | hdpe | film | tensile_impact_strength | 143.6 kJ/m² | p392 table 3 | CONFIRMED |
| 37 | hdpe | film | tensile_strength | 19.1 MPa (yield) | p392 table 3 | CONFIRMED |
| 38 | hdpe | film | tensile_strength | 29.5 MPa (break) | p392 table 3 | CONFIRMED |
| 39 | hdpe | film | tm | 127.0 °C | p392 table 3 | CONFIRMED |
| 40 | hdpe | injection | comonomer_content | 0.0 wt% | p392 table 3 | CONFIRMED |
| 41 | hdpe | injection | conductivity | [0.46, 0.52] W/m·K | p392 table 3 | CONFIRMED |
| 42 | hdpe | injection | density | 0.9678 g/cm³ | p392 table 3 | CONFIRMED |
| 43 | hdpe | injection | elongation_at_break | 8.2 % | p392 table 3 | CONFIRMED |
| 44-46 | hdpe | injection | escr | 0.0 h (Conditions A/B/C) | p392 table 3 | CONFIRMED |
| 47 | hdpe | injection | flexural_modulus | 1.894 GPa (1894 MPa converted) | p392 table 3 | CONFIRMED |
| 48 | hdpe | injection | hardness_brinell | [60.0, 70.0] MPa | p392 table 3 | CONFIRMED |
| 49 | hdpe | injection | hardness_shore_d | 67.0 Shore D | p392 table 3 | CONFIRMED |
| 50 | hdpe | injection | heat_resistance_temp | 122.0 °C (printed "ca 122") | p392 table 3 | CONFIRMED |
| 51 | hdpe | injection | mfi | 33.59 g/10min (2.16kg load) | p392 table 3 | CONFIRMED |
| 52 | hdpe | injection | mn | 48,400 g/mol | p392 table 3 | CONFIRMED (source table itself has Mw<Mn for this row — physically anomalous; transcribed faithfully and flagged in the row's own note rather than silently "corrected". Not a citation defect — matches the printed source exactly.) |
| 53 | hdpe | injection | mw | 13,900 g/mol | p392 table 3 | CONFIRMED (see note above) |
| 54 | hdpe | injection | notched_impact_area_basis | 0.9 kJ/m² | p392 table 3 | CONFIRMED |
| 55 | hdpe | injection | refractive_index | 1.54 | p392 table 3 | CONFIRMED |
| 56 | hdpe | injection | tensile_impact_strength | 9.0 kJ/m² | p392 table 3 | CONFIRMED |
| 57-58 | hdpe | injection | tensile_strength | 31.0 MPa (yield, printed twice in source) | p392 table 3 | CONFIRMED |
| 59 | hdpe | injection | tm | 136.0 °C | p392 table 3 | CONFIRMED |
| 60 | hdpe | injection | vicat | 126.0 °C | p392 table 3 | CONFIRMED |
| 61 | hdpe | rotational_molding | density | 0.945 g/cm³ | p477 table 10 | CONFIRMED |
| 62 | hdpe | rotational_molding | escr | 30.0 h | p477 table 10 | CONFIRMED |
| 63 | hdpe | rotational_molding | flexural_modulus | 0.931 GPa | p477 table 10 | CONFIRMED |
| 64 | hdpe | rotational_molding | mfi | 5.0 g/10min | p477 table 10 | CONFIRMED |
| 65 | hdpe | rotational_molding | tensile_strength | 21.0 MPa | p477 table 10 | CONFIRMED |
| 66 | hdpe | thermoforming | mfi | 0.25 g/10min | p577 | CONFIRMED |
| 67 | ldpe | blow_molding | brittleness_temp | ≤ -76.0 °C | p477 table 11 | CONFIRMED |
| 68 | ldpe | blow_molding | density | 0.918 g/cm³ | p477 table 11 | CONFIRMED |
| 69 | ldpe | blow_molding | flexural_modulus | 0.234 GPa | p477 table 11 | CONFIRMED |
| 70 | ldpe | blow_molding | mfi | 0.25 g/10min | p477 table 11 | CONFIRMED |
| 71 | ldpe | film | bur (blow-up ratio) | "2.0-2.5" | p518 | CONFIRMED |
| 72 | ldpe | injection | brittleness_temp | -25.0 °C | p477 table 9 | CONFIRMED |
| 73 | ldpe | injection | density | 0.923 g/cm³ | p477 table 9 | CONFIRMED |
| 74 | ldpe | injection | flexural_modulus | 0.186 GPa | p477 table 9 | CONFIRMED |
| 75 | ldpe | injection | hardness_shore_d | 41.0 Shore D | p477 table 9 | CONFIRMED |
| 76 | ldpe | injection | mfi | 37.5 g/10min | p477 table 9 | CONFIRMED |
| 77 | ldpe | injection | tensile_strength | 12.8 MPa (yield) | p477 table 9 | CONFIRMED |
| 78 | ldpe | injection | tensile_strength | 9.0 MPa (break) | p477 table 9 | CONFIRMED |
| 79 | ldpe | thermoforming | mfi | 0.25 g/10min | p577 | CONFIRMED |
| 80 | lldpe | blow_molding | brittleness_temp | ≤ -76.0 °C | p477 table 11 | CONFIRMED |
| 81 | lldpe | blow_molding | density | 0.934 g/cm³ | p477 table 11 | CONFIRMED |
| 82 | lldpe | blow_molding | escr | ≥1000 h | p477 table 11 | CONFIRMED |
| 83 | lldpe | blow_molding | flexural_modulus | 0.578 GPa | p477 table 11 | CONFIRMED |
| 84 | lldpe | blow_molding | mfi | 0.75 g/10min | p477 table 11 | CONFIRMED |
| 85 | lldpe | injection | brittleness_temp | ≤ -76.0 °C | p477 table 9 | CONFIRMED |
| 86 | lldpe | injection | density | 0.925 g/cm³ | p477 table 9 | CONFIRMED |
| 87 | lldpe | injection | flexural_modulus | 0.366 GPa | p477 table 9 | CONFIRMED |
| 88 | lldpe | injection | hardness_shore_d | 55.0 Shore D | p477 table 9 | CONFIRMED |
| 89 | lldpe | injection | mfi | 32.0 g/10min | p477 table 9 | CONFIRMED |
| 90 | lldpe | injection | tensile_strength | 13.4 MPa (yield) | p477 table 9 | CONFIRMED |
| 91 | lldpe | injection | tensile_strength | 9.3 MPa (break) | p477 table 9 | CONFIRMED |
| 92 | lldpe | rotational_molding_gas_phase | density | 0.935 g/cm³ | p477 table 10 | CONFIRMED |
| 93 | lldpe | rotational_molding_gas_phase | escr | ≥1000 h | p477 table 10 | CONFIRMED |
| 94 | lldpe | rotational_molding_gas_phase | flexural_modulus | 0.601 GPa | p477 table 10 | CONFIRMED |
| 95 | lldpe | rotational_molding_gas_phase | mfi | 5.0 g/10min | p477 table 10 | CONFIRMED |
| 96 | lldpe | rotational_molding_gas_phase | tensile_strength | 17.0 MPa | p477 table 10 | CONFIRMED |
| 97 | lldpe | rotational_molding_solution | density | 0.937 g/cm³ | p477 table 10 | CONFIRMED |
| 98 | lldpe | rotational_molding_solution | escr | 400.0 h | p477 table 10 | CONFIRMED |
| 99 | lldpe | rotational_molding_solution | flexural_modulus | 0.52 GPa | p477 table 10 | CONFIRMED |
| 100 | lldpe | rotational_molding_solution | mfi | 5.0 g/10min | p477 table 10 | CONFIRMED |
| 101 | lldpe | rotational_molding_solution | tensile_strength | 14.0 MPa | p477 table 10 | CONFIRMED |
| 102 | lldpe | thermoforming | mfi | [0.65, 0.9] g/10min | p577 | CONFIRMED |

A genuine finding worth surfacing, though it is not a hallucination and required no removal: the source table itself (p.392, HDPE injection grade) lists Mw = 13,900 and Mn = 48,400 — weight-average below number-average, which is physically impossible (PDI = Mw/Mn must be ≥ 1). This looks like a column swap or transcription error in the original book. The curator transcribed it exactly as printed rather than silently "fixing" it, and left an explicit note flagging it for review. That is the correct call for a citation-fidelity project — the citation is honest even though the underlying book data is probably wrong — but it means anyone consuming `hdpe`/`injection`/`mw`/`mn` on the site should treat those two numbers with suspicion until someone can check a second printing or errata.

I also found, via the rows' own `note_en` fields, that this batch already went through at least one internal QA pass before this audit: two notes explicitly say "corrects the first import pass, which misattributed this number to the injection grade" (row 17) and "missed on the first import pass" (row 21). That prior correction pass is why I found nothing left to disprove here — someone already caught and fixed the errors that existed.

## Results — material-level cited values (10 values)

| # | Material | Property | Value | Source | Locator | Verdict |
|---|---|---|---|---|---|---|
| 1 | hdpe | density | ≤ 0.975 g/cm³ | Handbook of Industrial Polyethylene | p.577 | CONFIRMED — matches "…to about 0.975 g/cm3 for high density PE" in the same sentence already verified for the grade-class thermoforming rows |
| 2 | hdpe | tm | [133.0, 138.0] °C | Encyclopedia Vol. 2 | p.397 | CONFIRMED — matches "Measurements of highly crystallized HDPE samples give melting points of 133–138°C" verbatim |
| 3 | hdpe | unit_cell | orthorhombic, a=7.42 Å, b=4.94 Å, c=2.55 Å | Encyclopedia Vol. 2 | p.447 | CONFIRMED — matches "…orthorhombic with unit cell dimensions of a = 7.42 Å, b = 4.94 Å, and c = 2.55 Å" verbatim |
| 4 | ldpe | crystallinity | [45.0, 59.0] % | Handbook of Industrial Polyethylene (base title, no subtitle — a separate `source` row from #1/#5 below; same physical book, minor data-hygiene issue, not a citation-fidelity one) | p.111 | **UNVERIFIED** — page not in the available transcription; book confirmed real (1,381 pages), p.111 is plausible (falls inside Part 1, "Principles and Properties of Polyethylene"), but I could not read the actual text |
| 5 | ldpe | density | [0.915, 0.935] g/cm³ | Handbook of Industrial Polyethylene | p.577 | CONFIRMED — matches "low density PE (LDPE) has a density in the range of about 0.915 to 0.935 g/cm3" verbatim |
| 6 | ldpe | process_temp | [180.0, 230.0] °C | **Polymer Handbook** (Brandrup/Immergut/Grulke, 4th ed., Wiley, ~2,288 pages) | **p.1** | **UNVERIFIED, flagged as suspicious** — see below |
| 7 | ldpe | unit_cell | orthorhombic, a=7.42 Å, b=4.94 Å, c=2.55 Å | Encyclopedia Vol. 2 | p.447 | CONFIRMED (same paragraph as #3) |
| 8 | lldpe | density | [0.915, 0.94] g/cm³ | Handbook of Industrial Polyethylene | p.121 | **UNVERIFIED** — same situation as #4: plausible page, unread text |
| 9 | lldpe | tm | [122.0, 128.0] °C | Encyclopedia Vol. 2 | p.448 | CONFIRMED — matches "the maximum melting peak … of LLDPE usually falls between 122 and 128°C" verbatim |
| 10 | lldpe | unit_cell | orthorhombic, a=7.42 Å, b=4.94 Å, c=2.55 Å | Encyclopedia Vol. 2 | p.447 | CONFIRMED (same paragraph as #3, #7) |

### The one citation I'd actually push back on: ldpe / process_temp / Polymer Handbook p.1

This is the single locator in the whole audit that looks wrong on its face, independent of content. *Polymer Handbook* (Brandrup/Immergut/Grulke) is a ~2,288-page reference compilation whose own table of contents (confirmed by web search) opens with "Nomenclature Rules — Units," followed by sections on polymerization kinetics, physical properties of monomers/solvents, and physical constants of named polymers. A specific LDPE melt-processing temperature range (180–230°C) on page 1 of that structure is very hard to reconcile with what page 1 of that book actually is (front matter / nomenclature). I could not get the actual page-1 text (no accessible full-text copy), so per the audit's rule I have **not** disproved it — I did not positively confirm it says something else — but I'm flagging it explicitly as the highest-priority item for you to hand-check against a physical or purchased copy. If it turns out to be a locator error (right book, wrong page — the real content may be scattered across one of the polymer-specific data sections, which in a 2,288-page 2-volume set could plausibly land far from p.1), it's an easy fix: find the right page and re-cite, not evidence of a fabricated number.

## Summary

| Verdict | Count | Notes |
|---|---|---|
| CONFIRMED | 109 of 112 citation instances (102 grade-class + 7 material-level) | Value, unit, and locator all check out against source text |
| UNVERIFIED (book, page plausible, content unread) | 2 | ldpe crystallinity (Handbook p.111), lldpe density (Handbook p.121) — left in place per policy |
| UNVERIFIED, suspicious locator | 1 | ldpe process_temp (Polymer Handbook p.1) — left in place per policy, flagged for owner follow-up |
| DISPROVED / removed | **0** | No value in the currently-cited dataset was found to contradict its cited source |

**Nothing was removed.** `curation/verification-removals.csv` exists with a header row only, as required by the deliverable spec, but is otherwise empty — there was nothing to disprove.

I checked all 112 live, cited polymer values (the entirety of what's currently in the database and citable): 109 confirmed clean against their sources, 3 left as unverified (not disproved) because I could not read the specific book page, one of those three flagged as worth a manual look because of an implausible page-1 locator. I did not find fabricated numbers, invented page ranges, or citations pointing at the wrong work. The one substantive data-quality issue I did find — the Mw < Mn anomaly on p.392 — is a defect in the *book's own printed table*, faithfully and transparently transcribed, not a hallucination introduced by curation.

The bigger scope note: most of what you might be worried about — the LyondellBasell/Borealis/scribd/PMC-cited PP, PVC, and PMMA data — isn't in the database yet. It's sitting in `curation/*.md` and `curation/*.csv` waiting to be imported. That data deserves the same page-by-page scrutiny this report gives the PE data, but it should happen as (or before) it gets imported, since right now there's no live citation to check.
