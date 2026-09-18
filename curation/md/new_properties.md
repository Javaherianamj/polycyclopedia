# New properties found during curation

Properties you hit while researching a material that aren't in the CSV yet
(`property_key` doesn't exist in `property_definition`). Append a row here as
you find them — don't try to add them to a material's CSV directly, the
importer will reject a `property_key` it doesn't recognise.

Hand this file over in batches; each entry gets turned into a
`property_definition` row (key, unit, data type, plausible min/max, which
tab/group it belongs to). Once that's done the property shows up in future
exports and you cite it like any other row.

| Property name (EN) | Property name (FA) | Unit | Example value | Material / source | Notes |
|---|---|---|---|---|---|
| Long-Chain Branching Density | چگالی شاخه‌های بلند زنجیره | branches/1000C | LDPE: 2–3 | Handbook of Industrial Polyethylene and Technology, p111 | Verbatim: "a high level of 'tree-like' long-chain branching (LCB), typically about 2 to 3 LCB/1000 carbon atoms" |
| Mould Shrinkage | انقباض قالب | % | LDPE: 1.2–2, HDPE: 1.5–3 | Encyclopedia of Polymer Science and Technology, vol1 p549, Table 3 | Measured on an axially symmetrical test bottle, 0.7–1mm wall, method of R. Holzmann |
| Specific Volume | حجم ویژه | cm³/g | LDPE: 1.09, HDPE: 1.05 (at 20°C) | Encyclopedia of Polymer Science and Technology, vol1 p549, Table 3 | Same table as shrinkage above |
| Water Vapor Transmission Rate | نرخ عبور بخار آب | g·mil/(100in²·day) [source unit — do NOT assume this matches any existing permeability property's canonical unit] | LDPE: 1.0–1.5, HDPE: 0.3–0.4 | Encyclopedia of Polymer Science and Technology, vol2 p15, Table 2 | 25.4-µm (1 mil) film at 37.8°C and 90% rh. Table also gives µmol/(m²·s) and h·m²/g columns — see report for the full reconstructed table |

**Unit-mismatch holding area** — real data, existing property, but the source's unit doesn't match `canonical_unit` and I was told not to convert units myself:

| Property (existing key) | Canonical unit | Source unit | LDPE | HDPE | Source |
|---|---|---|---|---|---|
| `cte` | µm/°C | 10⁻⁴ K⁻¹ | 2.3 (20°C) | 2.0 (20°C) | Encyclopedia..., vol1 p549, Table 3 |
| `oxygen_permeability` | cm³·mm/(m²·day·atm) | mL·mil/(m²·day·atm) | 6500 | 2300 | Encyclopedia..., vol2 p14, Table 1 (also reports nmol/(m·s·GPa) and mL·mil/(100in²·day) columns) |
| `izod_impact` | J/m | kJ/m² (notched impact, ASTM D256) | HDPE injection: 0.90, blow: 17.3, film: No Break | Encyclopedia..., vol2 p392, Table 3 | kJ/m² is energy/area, J/m is energy/notch-width — not interconvertible without specimen thickness, which the source doesn't give |

**Properties added and imported during the P1-PE cited-data import (2026-08-05)**,
from `curation/cited data-by author-p1-PE.md`. First pass left these out for
lack of a `property_definition`; the owner pushed back ("ask me if you want
to add something new and do it! i was telling you to do so!"), so
`db/seeds/0009_pe_import_properties.sql` and `0010_pe_import_properties_2.sql`
added 9 new properties (`brittleness_temp`, `escr`, `comonomer_content`,
`tensile_impact_strength`, `notched_impact_area_basis`, `heat_resistance_temp`,
`specific_heat_capacity`, `heat_of_combustion`, `hardness_brinell`) and
`tools/curation/scripts/import_pe_cited_data_followup.py` imported every fact
that used them, all cited, all attributed to the owner:

| Property name (EN) | Unit | Status |
|---|---|---|
| Low Temperature Brittleness (F50) | °C | ✅ Imported — `brittleness_temp` |
| Environmental Stress-Crack Resistance (ESCR) | h | ✅ Imported — `escr` (condition A/B/C in `conditions`) |
| Comonomer content (weight % hexene) | wt% | ✅ Imported — `comonomer_content` |
| Tensile Impact Strength | kJ/m² | ✅ Imported — `tensile_impact_strength` |
| Notched impact strength, area basis | kJ/m² | ✅ Imported — `notched_impact_area_basis` (kept separate from `izod_impact`, whose canonical unit J/m is a different physical basis — energy/width vs energy/area — not interconvertible without specimen thickness) |
| Heat Resistance Temperature | °C | ✅ Imported — `heat_resistance_temp` |
| Specific Heat Capacity | kJ/(kg·K) | ✅ Imported — `specific_heat_capacity` |
| Heat of Combustion | kJ/g | ✅ Imported — `heat_of_combustion` |
| Brinell Hardness | MPa | ✅ Imported — `hardness_brinell` |

**Still not imported — genuine ambiguity, not a missing property:**

| Property (existing/candidate) | Why it's held back |
|---|---|
| Temp. Coefficient of Linear/Volume Expansion (`cte` or new) | Encyclopedia v1 p549 and Table 3 both give this in `10⁻⁴` units with no stated basis (per-K vs per-material-length-per-K), and Encyclopedia v1's table additionally has two property columns (shrinkage % and CTE) sharing what looks like one set of numbers in the extraction. Needs the owner to check the original table before any number goes in. |
