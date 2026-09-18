# Curation extraction target — what to look for, and how to hand it over

**Generated from the live database on 2026-08-12.** The property table below is
machine-generated from `property_definition`, not transcribed, so it is exactly
what the importer will accept. Regenerate it after any registry change (the
query is at the bottom of this file).

This document exists to be fed to an extraction skill/agent that reads a source
document (PDF, book chapter, datasheet) and returns curated, citable data ready
for the database.

---

## 1. The five extraction rules — these override everything else

1. **Never infer a value.** If the source does not state it, it does not exist.
   No averaging two grades, no "typical for this polymer class", no filling a
   range's missing half. Unreadable or absent → return `null` and say why.
2. **Preserve units exactly as printed.** Do not convert. If the source says
   `1400 kg/m³` and the registry wants `g/cm³`, report the source's number and
   unit verbatim and flag it — a human decides the conversion. The two
   exceptions where conversion is safe and expected are noted per-property in
   §3.
3. **Quote verbatim.** Every extracted number must carry the exact sentence or
   table cell it came from, so a reviewer can verify without reopening the book.
4. **A citation without a locator is not a citation.** Every value needs at
   least one of page / table / figure / section. This is a database CHECK
   constraint, not a style preference — rows without one are rejected.
5. **Preserve precision as printed.** `0.9678` stays `0.9678`, not `0.97`.
   `3.0` stays `3.0`, not `3`. Significant figures are data.

---

## 2. What a "material" is, and the three levels a value can attach to

Values do not all hang off the polymer. There are three subject levels, and
picking the wrong one is the most common extraction error:

| Level | When to use | Example |
| --- | --- | --- |
| **material** | The value describes the polymer as a class | "LDPE density is 0.915–0.935 g/cm³" |
| **grade_class** | The value describes one *processing family* of that polymer | "HDPE **blow molding** grade: density 0.9557" |
| **material_process** | The value is a processing-window parameter for one technique | melt/mould temp for extrusion coating specifically |

**This matters enormously for tables.** A table headed *"Properties of Three
Typical Commercial HDPE Grades — Injection molding | Blow molding | Film"* is
**not** three columns of HDPE data. It is three `grade_class` subjects, each
with its own density, MFI, tensile strength. Extracting it as material-level
data would produce three contradictory densities for HDPE and destroy the
distinction the table exists to make.

Existing `grade_class` keys: `injection`, `blow_molding`, `film`,
`rotational_molding`, `thermoforming`, `rotational_molding_gas_phase`,
`rotational_molding_solution`. Propose a new one if the source needs it; do not
force data into an ill-fitting existing one.

Current material slugs: `ldpe`, `hdpe`, `lldpe`, `pp`, `pvc`, `pet`, `ps`.

---

## 3. The full property registry — 73 properties

`type` determines which field carries the value:
- **range** → `value_min` + `value_max` (or `value_typical` for a single number)
- **numeric** → `value_typical`
- **text** / **enum** / **boolean** → free text; the CSV cannot set these, they
  need a citation-only row (see §5)

`plausible` is a sanity envelope, not a valid range. A value outside it is
**rejected** unless explicitly overridden with a confidence + a note — treat a
breach as a signal you have a unit mismatch, not as a number to force through.

`scope` — `all` means every polymer. `field:` / `fam:` restrict it; a property
scoped `fam:polyolefins+polyesters` is crystallinity-dependent and **does not
exist** for amorphous PVC/PS. Do not extract it for them.

| group | key | name | type | canonical unit | plausible | scope |
| --- | --- | --- | --- | --- | --- | --- |
| processing | `process_temp` | Processing Temperature | range | °C | -50 … 450 | field:thermoplastics |
| processing | `mould_temp` | Mould Temperature | range | °C | -20 … 300 | field:thermoplastics |
| processing | `mfi` | Melt Flow Index (MFI) | range | g/10min | 0.01 … 200 | field:thermoplastics |
| processing | `injection_pressure` | Injection Pressure | range | MPa | 1 … 300 | field:thermoplastics |
| processing | `bur` | Blow-Up Ratio (BUR) | text | — | — | field:thermoplastics |
| processing | `gel_time` | Gel Time | numeric | min | 0 … 1440 | field:thermosets |
| processing | `pot_life` | Pot Life | numeric | min | 0 … 1440 | field:thermosets |
| processing | `cure_time` | Cure Time | numeric | min | 0 … 10080 | field:thermosets |
| processing | `cure_temperature` | Cure Temperature | numeric | °C | 0 … 300 | field:thermosets |
| processing | `peak_exotherm_temperature` | Peak Exotherm Temperature | numeric | °C | 0 … 400 | field:thermosets |
| thermal | `tg` | Glass Transition Temperature | numeric | °C | -150 … 400 | all |
| thermal | `tm` | Melting Temperature | range | °C | 40 … 400 | fam:polyolefins+polyesters |
| thermal | `enthalpy_exp` | Experimental Heat of Fusion | range | J/g | 0 … 300 | fam:polyolefins+polyesters |
| thermal | `enthalpy_100_cryst` | Heat of Fusion at 100% Crystallinity | numeric | J/g | 0 … 300 | fam:polyolefins+polyesters |
| thermal | `degradation_temp` | Thermal Degradation Temperature | range | °C | 150 … 600 | all |
| thermal | `hdt` | Heat Deflection Temperature | range | °C | 0 … 320 | all |
| thermal | `vicat` | Vicat Softening Temperature | range | °C | 0 … 320 | field:thermoplastics |
| thermal | `conductivity` | Thermal Conductivity | range | W/m·K | 0.05 … 5 | all |
| thermal | `cte` | Coefficient of Thermal Expansion | range | µm/°C | 20 … 400 | all |
| thermal | `brittleness_temp` | Brittleness Temperature (F50) | numeric | °C | -196 … 50 | all |
| thermal | `heat_resistance_temp` | Heat Resistance Temperature | numeric | °C | -40 … 300 | all |
| thermal | `specific_heat_capacity` | Specific Heat Capacity | range | kJ/(kg·K) | 0.5 … 5 | all |
| thermal | `heat_of_combustion` | Heat of Combustion | numeric | kJ/g | 10 … 60 | all |
| mechanical | `tensile_strength` | Tensile Strength | range | MPa | 1 … 400 | all |
| mechanical | `young_modulus` | Young's Modulus | range | GPa | 0.0005 … 400 | all |
| mechanical | `elongation_at_break` | Elongation at Break | range | % | 0 … 1000 | all |
| mechanical | `flexural_modulus` | Flexural Modulus | range | GPa | 0.0005 … 400 | all |
| mechanical | `hardness_shore_d` | Shore D Hardness | range | Shore D | 0 … 100 | all |
| mechanical | `izod_impact` | Izod Impact Strength | range | J/m | 0 … 1500 | all |
| mechanical | `hardness_barcol` | Barcol Hardness | numeric | Barcol | 0 … 100 | field:thermosets |
| mechanical | `escr` | Environmental Stress-Crack Resistance (ESCR) | numeric | h | 0 … 5000 | all |
| mechanical | `tensile_impact_strength` | Tensile Impact Strength | numeric | kJ/m² | 0 … 500 | all |
| mechanical | `notched_impact_area_basis` | Notched Impact Strength (Area Basis) | numeric | kJ/m² | 0 … 500 | all |
| mechanical | `hardness_brinell` | Brinell Hardness | range | MPa | 0 … 500 | all |
| physical | `density` | Density | range | g/cm³ | 0.8 … 2.3 | all |
| physical | `water_absorption` | Water Absorption | range | % | 0 … 10 | all |
| physical | `refractive_index` | Refractive Index | range | dimensionless | 1.3 … 1.7 | all |
| physical | `oxygen_permeability` | Oxygen Permeability | range | cm³·mm/(m²·day·atm) | 0.01 … 20000 | all |
| physical | `co2_permeability` | CO2 Permeability | range | cm³·mm/(m²·day·atm) | 0.01 … 60000 | all |
| physical | `appearance` | Appearance | text | — | — | all |
| physical | `co2_footprint_virgin` | Carbon Footprint (Virgin Resin) | range | kg CO₂e/kg | 0 … 30 | all |
| electrical | `dielectric_constant` | Dielectric Constant | range | dimensionless | 1 … 10 | all |
| electrical | `dielectric_strength` | Dielectric Strength | range | kV/mm | 1 … 100 | all |
| electrical | `volume_resistivity` | Volume Resistivity | range | Ω·cm | 1e-06 … 1e+20 | all |
| electrical | `dissipation_factor` | Dissipation Factor | range | dimensionless | 0 … 0.5 | all |
| academic | `monomer_name` | Monomer Name | text | — | — | all |
| academic | `monomer_formula` | Monomer Chemical Formula | text | — | — | all |
| academic | `monomer_molar_mass` | Monomer Molar Mass | numeric | g/mol | 10 … 1000 | all |
| academic | `repeating_unit` | Repeating Unit | text | — | — | all |
| academic | `crystallinity` | Crystallinity | range | % | 0 … 100 | fam:polyolefins+polyesters |
| academic | `unit_cell` | Unit Cell | text | — | — | fam:polyolefins+polyesters |
| academic | `lamella_thickness` | Lamella Thickness | range | nm | 1 … 100 | fam:polyolefins+polyesters |
| academic | `spherulite_size` | Spherulite Size | range | µm | 0.1 … 1000 | fam:polyolefins+polyesters |
| academic | `mechanism` | Polymerization Mechanism | text | — | — | all |
| academic | `kinetic_notes` | Kinetic Notes | text | — | — | all |
| academic | `mw` | Weight-Average Molecular Weight | range | g/mol | 1000 … 10000000 | all |
| academic | `mn` | Number-Average Molecular Weight | range | g/mol | 500 … 5000000 | all |
| academic | `pdi` | Polydispersity Index | range | dimensionless | 1 … 50 | all |
| academic | `dp_range` | Degree of Polymerization Range | range | dimensionless | 10 … 100000 | all |
| academic | `entanglement_mw` | Entanglement Molecular Weight | numeric | g/mol | 200 … 20000 | all |
| academic | `radius_of_gyration` | Radius of Gyration | range | nm | 1 … 200 | all |
| academic | `zero_shear_viscosity` | Zero-Shear Viscosity | range | Pa·s | 1 … 1000000000 | all |
| academic | `power_law_index` | Power-Law Index | range | dimensionless | 0 … 1 | all |
| academic | `rheology_notes` | Rheology Notes | text | — | — | all |
| academic | `solubility_parameter` | Solubility Parameter | range | MPa^0.5 | 10 … 30 | all |
| academic | `comonomer_content` | Comonomer Content | numeric | wt% | 0 … 20 | all |
| academic | `hansen_d` | Hansen Parameter - Dispersion | range | MPa^0.5 | 0 … 25 | all |
| academic | `hansen_p` | Hansen Parameter - Polar | range | MPa^0.5 | 0 … 20 | all |
| academic | `hansen_h` | Hansen Parameter - Hydrogen Bonding | range | MPa^0.5 | 0 … 40 | all |
| academic | `flory_huggins_chi` | Flory-Huggins Interaction Parameter | range | dimensionless | -1 … 2 | all |
| academic | `ffv` | Fractional Free Volume | range | dimensionless | 0 … 0.5 | all |
| academic | `persistence_length` | Persistence Length | range | nm | 0.1 … 100 | all |
| academic | `thermo_notes` | Thermodynamic Notes | text | — | — | all |

### Unit conversions that ARE safe

Only these two. Everything else → report the source unit and flag it.

| Situation | Rule | Why safe |
| --- | --- | --- |
| `kg/m³` → `g/cm³` (density) | divide by 1000 | exact metric-prefix change |
| `V/µm` → `kV/mm` (dielectric strength) | 1:1, number unchanged | numerically identical |

### Non-numeric properties

`appearance`, `monomer_name`, `monomer_formula`, `repeating_unit`, `mechanism`,
`unit_cell`, `kinetic_notes`, `rheology_notes`, `thermo_notes` are text-typed.
They can be **cited** but their value cannot be set through the CSV path — set
`value_min`/`max`/`typical` blank and fill only the citation columns.

---

## 4. Beyond properties — other citable data worth extracting

If the source carries these, capture them too; they have real homes in the
schema:

| Data | Table | Notes |
| --- | --- | --- |
| Producers of a material | `material_organization` | roles: `producer`, `compounder`, `distributor`, `licensor` |
| Brand / trade names | `trade_name` | must name a producer already linked to that material |
| Chemical resistance | `chemical_resistance` | rating enum: `excellent`, `very_good`, `good`, `fair`, `poor`, `not_recommended` |
| Market share by segment | `market_share_datum` | percentage 0–100, plus region + year |
| Section prose (a technical claim written as a sentence) | `material_section_note` | e.g. "PVC releases HCl above 140 °C…" — citable, kinds: `note`, `intro`, `list_item` |
| Quiz questions | `quiz_question` | **authored, never cited** — do not attach a source |

---

## 5. Output format — emit CSV rows for `import_values.py`

**Do not emit raw SQL.** The CSV path runs ten validation rules (V1–V10),
plausibility checks, supersede logic and a `--dry-run`. Raw SQL bypasses all of
it. That is not hypothetical: a raw-SQL insert on 2026-08-12 silently created
nine `published` PET values with **no evidence attached** — the exact
"claims to be sourced but isn't" failure the whole architecture exists to
prevent. It was caught and repaired, but the CSV path would have refused it.

Emit one row per fact, with these columns (exact order,
`tools/curation/common.py:GAPS_FIELDNAMES`):

```
material_slug,property_key,property_name_en,property_name_fa,unit,plausible_min,plausible_max,current_value,value_min,value_max,value_typical,qualifier,source_key,page,table,figure,section,test_method,conditions,note_en,note_fa,confidence,skip,role,import_error
```

You only fill the **curator** columns; the first eight are context the exporter
writes and the extractor should leave blank (or copy through if regenerating):

| Column | Fill with |
| --- | --- |
| `material_slug` | `ldpe` / `hdpe` / … |
| `property_key` | exact key from §3 |
| `value_min` / `value_max` | for a range |
| `value_typical` | for a single number — use this OR min/max, never both |
| `qualifier` | one of `<` `>` `~` `>=` `<=` when the source says "less than 0.01" |
| `source_key` | key from `curation/sources.csv` — add a row there if new |
| `page` / `table` / `figure` / `section` | **at least one required** |
| `test_method` | e.g. `ASTM D1238` — must match a known method, no space inside the code |
| `conditions` | e.g. `190 °C, 2.16 kg` or `at 1 MHz` or `@ 1.8 MPa` |
| `note_en` | the verbatim quote, or the unit-conversion disclosure |
| `confidence` | 0–1, blank defaults to 0.9 |
| `role` | `primary` / `corroborating` / `conflicting` / `derived_from` |

### Multiple sources for one property

Fully supported and encouraged. Emit several rows sharing the same
`material_slug` + `property_key`:

- **Exactly one** row sets the value (`value_min`/`max`/`typical` filled) — that
  is the number the site displays.
- **Every other** row leaves those three blank and carries only its citation.
  These attach as extra evidence to the same value.
- Mark agreeing sources `corroborating`, disagreeing ones `conflicting`.
- Two rows both setting a value for the same property = **rejected as
  ambiguous**. If sources genuinely disagree on the number, do not pick a
  winner — set one and mark the other `conflicting`, or escalate to a human.

### Known limitation: grade_class values cannot go through the CSV

`GAPS_FIELDNAMES` has no grade_class column, and `import_values.py` has no
grade_class support. Material-level values go through the CSV; **grade_class
values must be reported in a separate section** for a human to handle, until
the importer is extended. Do not silently flatten grade-class data to
material level to make it fit — that is how contradictory densities get born.

---

## 6. Report back what you could NOT place

A skill that only reports successes is worse than useless. Always return:

1. **Values found but with no matching `property_key`** → these become new
   `property_definition` rows; log name, unit, example value, source.
2. **Values whose unit doesn't match the canonical unit** → report both,
   converted by nobody.
3. **Values outside the plausible envelope** → almost always a unit mismatch.
4. **Grade-class / process-level data** → separate section, per §5.
5. **Text you judged too ambiguous to extract** → say so; silence reads as
   "not present in the source", which is a different and false claim.

---

## Regenerating the property table in §3

```bash
docker exec polypedia-pg psql -U polypedia -d polypedia -tAc "
select '| ' || g.key || ' | \`' || pd.key || '\` | ' || pd.name_en
    || ' | ' || pd.data_type || ' | ' || coalesce(nullif(pd.canonical_unit,''),'—')
    || ' | ' || case when pd.plausible_min is null then '—'
                else pd.plausible_min::text || ' … ' || pd.plausible_max::text end
    || ' | ' || case when pd.applies_to_fields='{}' and pd.applies_to_families='{}' then 'all'
         else trim(both ' ' from
              case when pd.applies_to_fields<>'{}' then 'field:'||array_to_string(pd.applies_to_fields,'+') else '' end
           || case when pd.applies_to_families<>'{}' then ' fam:'||array_to_string(pd.applies_to_families,'+') else '' end) end
    || ' |'
from property_definition pd join property_group g on g.id=pd.group_id
order by g.sort_order, pd.sort_order, pd.key;"
```
