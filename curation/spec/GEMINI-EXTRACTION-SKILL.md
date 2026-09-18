# Gemini extraction skill — anti-hallucination contract v2

This replaces ad-hoc "gather ABS data" prompting. It exists because a spot-check
of v1 output found the error pattern below. Follow it exactly.

## What actually went wrong in v1 (measured, not guessed)

A 12-value audit against live sources found:

| Where errors clustered | Example |
|---|---|
| **Non-datasheet sources** (handbooks, encyclopedias, generic "plastic properties" pages) | ABS refractive_index 1.535 cited to a page that has **no ABS row at all** |
| **Derived / less-common properties** (RI, elongation, degradation temp) | HDPE elongation 700 % cited to a sheet that prints **300 %** |
| **Unit / column confusion** | ABS "MFI 19 g/10 min" — 19 is the **MVR in cm³/10 min**; the g/10 min figure is 20 |
| **Property mislabelling** | HDPE Young's modulus 1.05 GPa taken from a **flexural** modulus number |
| **Unusable link targets** | ~60 % of one file cited Scribd / epdf.pub — login-walled or pirate mirrors |

Values taken **directly from a manufacturer Technical Data Sheet (TDS) for a
named grade were 100 % correct.** So the rule of thumb: TDS + named grade =
trustworthy; handbook/encyclopedia/generic = high risk.

## Hard rules

1. **One value → one source that literally prints that number.** Never average,
   infer, or "know" a value. If no source prints it, leave it out.
2. **Copy an exact `verbatim_quote`** — the literal substring from the source
   that contains the number, unit, and test standard, character-for-character.
   The number in `value` MUST appear inside `verbatim_quote`. This is what the
   verifier checks; a fabricated quote cannot survive `verify_sources.py`.
3. **URL must be a public, resolvable, stable page.** Allowed: manufacturer TDS
   PDFs, ISO/ASTM/standards bodies, PubChem, DOI links (`https://doi.org/...`),
   NIST. **Banned as citation URLs:** scribd.com, researchgate.net, epdf.pub,
   academia.edu, z-lib, chegg, any "download" mirror. If the only source you can
   find is one of these, mark the row `confidence=0.4` and `skip=y` — do not cite it.
4. **Never silently convert units.** Record `original_value` + `original_unit`
   exactly as printed. Any conversion goes in `value`/`unit` with a note; the
   `verbatim_quote` stays in the source's own units.
5. **Match the property definition, not a near-neighbour.** Young's/tensile
   modulus ≠ flexural modulus. Tensile strength ≠ stress at yield unless the
   sheet says so. MFR (g/10 min) ≠ MVR (cm³/10 min). If unsure, put the printed
   label in the note and lower confidence.
6. **Prefer a named commercial grade** (e.g. "Terluran GP-22") over "generic".
   Generic/handbook values get `confidence <= 0.7`.
7. **Self-check pass (required).** After building the table, for every row
   re-read your own `verbatim_quote` and confirm the `value` is inside it and the
   property label matches. Delete rows that fail.

## Output schema (one CSV, verify-ready and transform-ready)

```
material_slug,grade,property_key,value,value_min,value_max,unit,
original_value,original_unit,test_method,conditions,
source_title,source_url,source_page,source_section,verbatim_quote,confidence,note_en
```

* `material_slug` — one of the DB slugs (hdpe, ldpe, lldpe, abs, ps, pmma, pp, pvc, pet, ...).
* `property_key` — must be a registered key (density, mfi, tensile_strength,
  young_modulus, elongation_at_break, flexural_modulus, hardness_shore_d, tg,
  vicat, hdt, conductivity, cte, specific_heat_capacity, degradation_temp,
  water_absorption, refractive_index, dielectric_constant, dielectric_strength,
  volume_resistivity, dissipation_factor, mfi, process_temp, mould_temp,
  injection_pressure, monomer_name). Do not invent keys.
* `value` — single typical number. Use `value_min`/`value_max` for a real range.
* `source_url` — public + resolvable (rule 3). One row = one URL.
* `verbatim_quote` — exact substring containing the number (rule 2).
* `confidence` — 0–1. TDS+grade ≈ 0.95; handbook ≈ 0.7; anything you had to
  reason about ≈ 0.5.

## Before handing off

Run, and fix everything it flags, before the data is considered done:

```bash
tools/etl/.venv/bin/python tools/curation/verify_sources.py <your.csv>
```

Zero `FAIL` and zero `UNVERIFIABLE_LINK` is the bar. `NO_URL` (a printed book)
is allowed only with a real page number and `confidence <= 0.7`.
