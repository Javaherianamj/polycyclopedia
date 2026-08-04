"""Curated, shorter property lists for the per-family curation worksheet.

The full ``property_definition`` registry has 61 rows. Handing a curator all
of them in one file is what made the earlier attempt at this feature
overwhelming -- the fix is not a different file *shape* (still one row per
property, same columns as ``gaps.csv`` -- see ``common.GAPS_FIELDNAMES``),
it's a shorter, family-appropriate *property list*, reused verbatim for every
material in that family so every polyolefin's file looks the same and every
thermoset resin's file looks the same.

Both lists below are ordered by ``property_group`` (processing, thermal,
mechanical, physical, electrical -- the same grouping the site's own property
tabs use), then by the registry's ``sort_order`` within each group. Keys were
read directly from the live ``property_definition`` table, not typed from
memory -- see the query in this module's test suite for how to reproduce
the check.

POLYOLEFINS_PROPERTIES: every property that (a) is not in the ``academic``
group (the deep molecular/chemistry set -- mw, mn, pdi, Hansen parameters,
monomer identity, etc. -- which is grade-sensitive and belongs to the full
``gaps.csv`` workflow once a specific citation is being weighed carefully,
not a bulk first pass) and (b) is not scoped to ``thermosets`` only
(``applies_to_fields = {thermosets}``, so it plays no role for a
thermoplastic material such as LDPE/HDPE/PP). 28 properties -- prose
elsewhere in this project rounds that to "~25".

THERMOSET_RESINS_PROPERTIES: the 6 new cure-specific properties seeded by
db/seeds/0006_thermoset_taxonomy_and_properties.sql (gel_time, pot_life,
cure_time, cure_temperature, peak_exotherm_temperature, hardness_barcol),
plus the subset of the existing registry that still makes sense for a resin
that cures instead of melting -- explicitly excluding ``tm`` (no melting
point) and ``mfi`` (no melt flow). 17 properties total.
"""
from __future__ import annotations

POLYOLEFINS_PROPERTIES: list[str] = [
    # processing
    "process_temp",
    "mfi",
    "bur",
    # thermal
    "tg",
    "tm",
    "enthalpy_exp",
    "enthalpy_100_cryst",
    "degradation_temp",
    "hdt",
    "vicat",
    "conductivity",
    "cte",
    # mechanical
    "tensile_strength",
    "young_modulus",
    "elongation_at_break",
    "flexural_modulus",
    "hardness_shore_d",
    "izod_impact",
    # physical
    "density",
    "water_absorption",
    "refractive_index",
    "oxygen_permeability",
    "co2_permeability",
    "appearance",
    # electrical
    "dielectric_constant",
    "dielectric_strength",
    "volume_resistivity",
    "dissipation_factor",
]

THERMOSET_RESINS_PROPERTIES: list[str] = [
    # processing -- the 6 new cure-specific properties
    "gel_time",
    "pot_life",
    "cure_time",
    "cure_temperature",
    "peak_exotherm_temperature",
    # thermal
    "tg",
    "hdt",
    "cte",
    # mechanical
    "tensile_strength",
    "flexural_modulus",
    "hardness_barcol",
    # physical
    "density",
    "water_absorption",
    # electrical
    "dielectric_constant",
    "dielectric_strength",
    "volume_resistivity",
    "dissipation_factor",
]

# Registered here so export_gaps.py's --preset flag has exactly one place to
# look keys up, and so a typo'd --preset value fails with argparse's own
# "invalid choice" message rather than a KeyError deep in a query.
FAMILY_PRESETS: dict[str, list[str]] = {
    "polyolefins": POLYOLEFINS_PROPERTIES,
    "thermoset-resins": THERMOSET_RESINS_PROPERTIES,
}
