"""Parses ``src/data/polymersData.ts`` into normalised Python data structures.

Pipeline stage 2 of 3 (see schema-design.md section 11):

    parse src/data/polymersData.ts  -->  normalise values  -->  validate
    against oracle  -->  (emit_sql.py) emit seed SQL

This module owns stages 1-3. It:

1. Reads the legacy `.ts` file and extracts the six polymer object literals
   using ``ts_object_parser`` (no Node.js available in this environment).
2. Runs every ``SourcedValue``-shaped field through
   ``value_parser.parse_sourced_value``, collecting (never raising past
   this point) every :class:`~value_parser.ValueParseError` it hits so a
   single bad row doesn't hide the rest of the failures.
3. Cross-checks parsed numbers against the legacy "shadow" numeric fields
   (``tgValue``, ``minDensity``, ``mnDefaultValue``, ...) that section 10 of
   the spec says are deliberately NOT carried into the new schema, and
   reports every disagreement it finds.

Run directly for a human-readable report:

    python parse_polymers.py

Exits non-zero if there are any unresolved parse failures (across any of
the six materials) or any oracle disagreements, per the "never guess /
never silently coerce" rules in the spec. Note ``emit_sql.py`` applies its
own, narrower gate scoped to whichever materials it is about to seed.
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ts_object_parser import extract_exported_array
from value_parser import ParsedValue, ValueParseError, parse_sourced_value

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_PATH = REPO_ROOT / "src" / "data" / "polymersData.ts"

SEEDED_MATERIAL_IDS = ("ldpe", "hdpe")

_PERSIAN_RE = re.compile(r"[؀-ۿ]")


def _is_persian(s: str) -> bool:
    return bool(_PERSIAN_RE.search(s))


# ---------------------------------------------------------------------------
# Property registry mapping -- legacy camelCase field -> (group, key, shape)
# Transcribed 1:1 from schema-design.md section 10. `shape` is 'sourced' for
# fields typed `SourcedValue` in src/types/polymer.ts, or 'plain' for bare
# strings/numbers that become a plain value_text/value_typical row with no
# parsing needed.
# ---------------------------------------------------------------------------

PROPERTY_MAP: dict[str, list[tuple[str, str, str]]] = {
    "processing": [
        ("processTemp", "process_temp", "sourced"),
        ("mfi", "mfi", "sourced"),
        ("bur", "bur", "sourced"),
    ],
    "thermal": [
        ("tg", "tg", "sourced"),
        ("tm", "tm", "sourced"),
        ("enthalpyExp", "enthalpy_exp", "sourced"),
        ("enthalpy100Cryst", "enthalpy_100_cryst", "sourced"),
        ("degradationTemp", "degradation_temp", "sourced"),
        ("hdt", "hdt", "sourced"),
        ("vicat", "vicat", "sourced"),
        ("conductivity", "conductivity", "sourced"),
        ("cte", "cte", "sourced"),
    ],
    "mechanical": [
        ("tensileStrength", "tensile_strength", "sourced"),
        ("youngModulus", "young_modulus", "sourced"),
        ("elongationAtBreak", "elongation_at_break", "sourced"),
        ("flexuralModulus", "flexural_modulus", "sourced"),
        ("hardnessShoreD", "hardness_shore_d", "sourced"),
        ("izodImpact", "izod_impact", "sourced"),  # optional field
    ],
    "physical": [
        ("density", "density", "sourced"),
        ("waterAbsorption", "water_absorption", "sourced"),
        ("refractiveIndex", "refractive_index", "sourced"),
        ("oxygenPermeability", "oxygen_permeability", "sourced"),
        ("co2Permeability", "co2_permeability", "sourced"),
        ("appearance", "appearance", "plain_text"),
    ],
    "electrical": [
        ("dielectricConstant", "dielectric_constant", "sourced"),
        ("dielectricStrength", "dielectric_strength", "sourced"),
        ("volumeResistivity", "volume_resistivity", "sourced"),
        ("dissipationFactor", "dissipation_factor", "sourced"),
    ],
    "academic": [
        ("monomerName", "monomer_name", "plain_text"),
        ("monomerFormula", "monomer_formula", "plain_text"),
        ("monomerMolarMass", "monomer_molar_mass", "plain_number_g_per_mol"),
        ("repeatingUnit", "repeating_unit", "plain_text"),
        ("crystallinityRange", "crystallinity", "sourced"),
        ("unitCell", "unit_cell", "plain_text"),
        ("lamellaThickness", "lamella_thickness", "sourced"),
        ("spheruliteSize", "spherulite_size", "sourced"),
        ("mechanism", "mechanism", "plain_text"),
        ("kineticNotes", "kinetic_notes", "plain_text"),
        ("mw", "mw", "sourced"),
        ("mn", "mn", "sourced"),
        ("pdi", "pdi", "sourced"),
        ("dpRange", "dp_range", "sourced"),
        ("entanglementMw", "entanglement_mw", "sourced"),
        ("radiusOfGyration", "radius_of_gyration", "sourced"),
        ("zeroShearViscosity", "zero_shear_viscosity", "sourced"),
        ("powerLawIndex", "power_law_index", "sourced"),
        ("rheologyNotes", "rheology_notes", "plain_text"),
        ("solubilityParameter", "solubility_parameter", "sourced"),
        ("hansenD", "hansen_d", "sourced"),
        ("hansenP", "hansen_p", "sourced"),
        ("hansenH", "hansen_h", "sourced"),
        ("floryHugginsChi", "flory_huggins_chi", "sourced"),
        ("ffv", "ffv", "sourced"),
        ("persistenceLength", "persistence_length", "sourced"),
        ("thermoNotes", "thermo_notes", "plain_text"),
    ],
}

# Fields present in the legacy interfaces that are deliberately NOT migrated
# into property_value (documented for the final report, not used at runtime).
DROPPED_FIELDS = {
    "academic.reactorTypes": "list of reactor descriptions; no property_definition key reserved for it in section 10",
    "*.quiz": "no table in schema-design.md covers quiz content",
    "*.tradeNames": "not in emit_sql's explicit table list; would need an organization/grade model out of scope for this unit",
    "*.iranianManufacturers": "same as tradeNames -- organization taxonomy is out of scope here",
    "*.multinationalManufacturers": "same as tradeNames",
}

# Legacy Persian chemical-resistance rating strings -> resistance_rating enum.
# Base terms are ranked by observed semantic strength across the whole
# dataset. A parenthetical suffix, e.g. 'خوب (تورم جزئی)', is split off and
# kept as a note rather than folded into the rating lookup.
_RATING_BASE_MAP = {
    "بسیار عالی": "excellent",
    "عالی": "very_good",
    "خیلی خوب": "good",
    "خوب": "fair",
    "ضعیف": "poor",
}
# Full strings (no clean parenthetical split) that mean "don't use this".
_RATING_FULL_MAP = {
    "حلال و ضعیف": "not_recommended",
    "حل‌شونده و ضعیف": "not_recommended",
    "تورم شدید": "not_recommended",
    "حلالیت کامل": "not_recommended",
}

_TRAILING_PAREN_RE = re.compile(r"^(?P<base>.*?)\s*\((?P<note>[^()]*)\)\s*$")


class RatingParseError(Exception):
    def __init__(self, location: str, raw_rating: str):
        super().__init__(f"{location}: unrecognised chemical-resistance rating {raw_rating!r}")
        self.location = location
        self.raw_rating = raw_rating


def parse_resistance_rating(raw_rating: str, *, location: str) -> tuple[str, str | None]:
    """Returns (enum_value, note_or_None). Raises RatingParseError rather
    than guessing at an unrecognised Persian rating string."""
    raw_rating = raw_rating.strip()
    if raw_rating in _RATING_FULL_MAP:
        return _RATING_FULL_MAP[raw_rating], None
    m = _TRAILING_PAREN_RE.match(raw_rating)
    if m:
        base, note = m.group("base").strip(), m.group("note").strip()
        if base in _RATING_BASE_MAP:
            return _RATING_BASE_MAP[base], note
        if base in _RATING_FULL_MAP:
            return _RATING_FULL_MAP[base], note
    if raw_rating in _RATING_BASE_MAP:
        return _RATING_BASE_MAP[raw_rating], None
    raise RatingParseError(location, raw_rating)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class Failure:
    location: str
    raw_value: Any
    message: str

    def __str__(self) -> str:
        return f"{self.location}: {self.raw_value!r} -- {self.message}"


@dataclass
class PropertyResult:
    key: str
    group: str
    parsed: ParsedValue
    note_fa: str | None = None
    note_en: str | None = None


@dataclass
class OracleCheck:
    material_id: str
    property: str
    parsed_repr: str
    shadow_field: str
    shadow_value: float
    agrees: bool
    detail: str = ""


@dataclass
class ChemResistanceResult:
    reagent_fa: str
    rating: str
    note_fa: str | None


@dataclass
class ParsedMaterial:
    id: str
    name_fa: str
    name_en: str
    code: str
    cas: str
    resin_code: int
    family: str
    discovery_year: str
    overview_fa: str
    chain_type: str
    applications: list[str]
    processing_techniques: list[str]
    market_share: list[dict]
    chemical_resistance: list[ChemResistanceResult]
    atoms3d: list[dict]
    unit_cell: str
    properties: dict[str, PropertyResult] = field(default_factory=dict)
    failures: list[Failure] = field(default_factory=list)
    oracle: list[OracleCheck] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------


def _midpoint(parsed: ParsedValue) -> float | None:
    if parsed.value_typical is not None:
        return parsed.value_typical
    if parsed.value_min is not None and parsed.value_max is not None:
        return (parsed.value_min + parsed.value_max) / 2.0
    return None


def _parse_group(
    material_id: str,
    group_key: str,
    group_obj: dict,
    field_specs: list[tuple[str, str, str]],
    failures: list[Failure],
) -> dict[str, PropertyResult]:
    results: dict[str, PropertyResult] = {}
    for legacy_field, prop_key, shape in field_specs:
        if legacy_field not in group_obj:
            continue  # optional field (e.g. izodImpact) absent for this material
        location = f"{material_id}.{group_key}.{legacy_field}"
        raw = group_obj[legacy_field]
        try:
            if shape == "sourced":
                sv = raw
                parsed = parse_sourced_value(sv["value"], sv.get("unit", ""), location=location)
                note = sv.get("note")
            elif shape == "plain_text":
                # Text-typed properties are classified by their registry
                # data_type, never by string content. Chemical formulas
                # ('C2H4'), repeating units ('[CH2 - CH2]n'), unit cells
                # ('7.4, 4.93, 2.55 A (Orthorhombic)') and prose notes all
                # contain digits, and an earlier version of this function ran
                # them through the numeric parser first -- which raised before
                # the text fallback below could ever run. The declared shape
                # is authoritative; do not attempt a numeric parse at all.
                parsed = ParsedValue(kind="text", value_text=str(raw))
                note = None
            elif shape == "plain_number_g_per_mol":
                parsed = parse_sourced_value(raw, "g/mol", location=location)
                note = None
            else:  # pragma: no cover - defensive
                raise AssertionError(f"unknown shape {shape!r}")
        except ValueParseError as e:
            failures.append(Failure(location, raw, str(e)))
            continue
        note_fa = note if note and _is_persian(note) else None
        note_en = note if note and not _is_persian(note) else None
        results[prop_key] = PropertyResult(key=prop_key, group=group_key, parsed=parsed, note_fa=note_fa, note_en=note_en)
    return results


def _check_oracle(material: ParsedMaterial, raw: dict) -> None:
    checks = material.oracle

    def compare(prop_key: str, shadow_field: str, shadow_value: Any, detail: str = "") -> None:
        """Containment check for *representative* shadow scalars.

        `tgValue`, `tmValue`, `degradationValue` and `mnDefaultValue` are NOT
        duplicates of the sourced range -- they are hand-picked single values
        used to position sliders and seed the simulators. Requiring them to
        equal the range midpoint is the wrong test and reports false defects
        (e.g. PP tm parses to 160-168, midpoint 164, while tmValue is the
        genuinely more accurate 165).

        The correct invariant is that the representative value must lie
        *within* the sourced range. A representative value outside its own
        range is a real defect; one merely off-midpoint is not.

        `minDensity`/`maxDensity` and `minCrystallinity`/`maxCrystallinity`
        ARE true duplicates and are checked for strict equality in
        `_compare_range`.
        """
        if shadow_value is None:
            return
        pr = material.properties.get(prop_key)
        if pr is None or pr.parsed.kind != "numeric":
            return
        p = pr.parsed
        shadow = float(shadow_value)

        if p.value_min is not None and p.value_max is not None:
            agrees = (p.value_min - 1e-9) <= shadow <= (p.value_max + 1e-9)
            compared = f"within [{p.value_min}, {p.value_max}]"
            how = "containment"
        elif p.value_typical is not None:
            agrees = abs(p.value_typical - shadow) < 1e-9
            compared = f"typical={p.value_typical}"
            how = "equality"
        else:
            return

        checks.append(
            OracleCheck(
                material_id=material.id,
                property=prop_key,
                parsed_repr=f"{compared} [{how}]",
                shadow_field=shadow_field,
                shadow_value=shadow,
                agrees=agrees,
                detail=detail,
            )
        )

    thermal = raw.get("thermal", {})
    compare("tg", "tgValue", thermal.get("tgValue"))
    compare("tm", "tmValue", thermal.get("tmValue"))
    compare("degradation_temp", "degradationValue", thermal.get("degradationValue"))

    physical = raw.get("physical", {})
    _compare_range("density", "minDensity", "maxDensity", physical.get("minDensity"), physical.get("maxDensity"), material)

    academic = raw.get("academic", {})
    _compare_range(
        "crystallinity",
        "minCrystallinity",
        "maxCrystallinity",
        academic.get("minCrystallinity"),
        academic.get("maxCrystallinity"),
        material,
    )
    compare(
        "mn",
        "mnDefaultValue",
        academic.get("mnDefaultValue"),
        detail="mnDefaultValue is the DP calculator's default slider position, not a duplicate of the Mn range",
    )


def _compare_range(prop_key: str, min_field: str, max_field: str, shadow_min: Any, shadow_max: Any, material: ParsedMaterial) -> None:
    if shadow_min is None or shadow_max is None:
        return
    pr = material.properties.get(prop_key)
    if pr is None or pr.parsed.kind != "numeric":
        return
    parsed = pr.parsed
    if parsed.value_min is not None and parsed.value_max is not None:
        agrees_min = abs(parsed.value_min - float(shadow_min)) < 1e-9
        agrees_max = abs(parsed.value_max - float(shadow_max)) < 1e-9
        material.oracle.append(
            OracleCheck(
                material_id=material.id,
                property=f"{prop_key}.min",
                parsed_repr=str(parsed.value_min),
                shadow_field=min_field,
                shadow_value=float(shadow_min),
                agrees=agrees_min,
            )
        )
        material.oracle.append(
            OracleCheck(
                material_id=material.id,
                property=f"{prop_key}.max",
                parsed_repr=str(parsed.value_max),
                shadow_field=max_field,
                shadow_value=float(shadow_max),
                agrees=agrees_max,
            )
        )
    elif parsed.value_typical is not None and float(shadow_min) == float(shadow_max):
        # e.g. PS crystallinity: value '0' (a single number, not a range)
        # but minCrystallinity == maxCrystallinity == 0.
        agrees = abs(parsed.value_typical - float(shadow_min)) < 1e-9
        material.oracle.append(
            OracleCheck(
                material_id=material.id,
                property=f"{prop_key}.typical",
                parsed_repr=str(parsed.value_typical),
                shadow_field=f"{min_field}=={max_field}",
                shadow_value=float(shadow_min),
                agrees=agrees,
                detail="source value is a single number, not a range; compared against the (equal) shadow min/max",
            )
        )


def parse_material(raw: dict) -> ParsedMaterial:
    material_id = raw["id"]
    failures: list[Failure] = []

    properties: dict[str, PropertyResult] = {}
    for group_key, field_specs in PROPERTY_MAP.items():
        group_obj = raw.get(group_key, {})
        properties.update(_parse_group(material_id, group_key, group_obj, field_specs, failures))

    chem_resistance: list[ChemResistanceResult] = []
    for i, item in enumerate(raw.get("chemicalResistance", [])):
        location = f"{material_id}.chemicalResistance[{i}]"
        try:
            rating, note = parse_resistance_rating(item["rating"], location=location)
        except RatingParseError as e:
            failures.append(Failure(location, item["rating"], str(e)))
            continue
        chem_resistance.append(ChemResistanceResult(reagent_fa=item["category"], rating=rating, note_fa=note))

    material = ParsedMaterial(
        id=material_id,
        name_fa=raw["nameFa"],
        name_en=raw["nameEn"],
        code=raw["code"],
        cas=raw["cas"],
        resin_code=raw["resinCode"],
        family=raw["family"],
        discovery_year=raw["discoveryYear"],
        overview_fa=raw["overviewText"],
        chain_type=raw["chainType"],
        applications=list(raw.get("applications", [])),
        processing_techniques=list(raw.get("processing", {}).get("techniques", [])),
        market_share=[{"segment_fa": m["label"], "percentage": m["percentage"]} for m in raw.get("marketShare", [])],
        chemical_resistance=chem_resistance,
        atoms3d=list(raw.get("atoms3d", [])),
        unit_cell=raw.get("academic", {}).get("unitCell", ""),
        properties=properties,
        failures=failures,
    )
    _check_oracle(material, raw)
    return material


def parse_all_materials(source_path: Path = DEFAULT_SOURCE_PATH) -> dict[str, ParsedMaterial]:
    ts_source = source_path.read_text(encoding="utf-8")
    raw_list = extract_exported_array(ts_source, "polymersData")
    materials: dict[str, ParsedMaterial] = {}
    for raw in raw_list:
        m = parse_material(raw)
        materials[m.id] = m
    return materials


def require_clean(materials: dict[str, ParsedMaterial], material_ids: tuple[str, ...]) -> None:
    """Raises SystemExit if any of the given materials has unresolved parse
    failures. Used by emit_sql.py to gate SQL emission per the hard rule
    ("refuse to emit SQL if any remain unresolved") -- scoped to the
    materials actually being seeded."""
    problems = []
    for mid in material_ids:
        m = materials[mid]
        if m.failures:
            problems.append(m)
    if problems:
        lines = [f"Refusing to emit SQL: unresolved parse failures in {[m.id for m in problems]}"]
        for m in problems:
            for f_ in m.failures:
                lines.append(f"  - {f_}")
        raise SystemExit("\n".join(lines))


# ---------------------------------------------------------------------------
# CLI report
# ---------------------------------------------------------------------------


def _print_report(materials: dict[str, ParsedMaterial]) -> bool:
    """Prints the human-readable report. Returns True if everything is
    clean (no failures, no oracle disagreements)."""
    all_failures: list[Failure] = []
    all_oracle: list[OracleCheck] = []
    for m in materials.values():
        all_failures.extend(m.failures)
        all_oracle.extend(m.oracle)

    print("=" * 78)
    print("UNPARSEABLE VALUE STRINGS")
    print("=" * 78)
    if not all_failures:
        print("(none)")
    for f_ in all_failures:
        print(f"  {f_}")

    print()
    print("=" * 78)
    print("ORACLE CROSS-CHECK (parsed value vs. legacy shadow numeric field)")
    print("=" * 78)
    disagreements = [c for c in all_oracle if not c.agrees]
    agreements = [c for c in all_oracle if c.agrees]
    print(f"{len(agreements)} agree, {len(disagreements)} disagree, {len(all_oracle)} total checks")
    for c in all_oracle:
        status = "OK  " if c.agrees else "MISMATCH"
        extra = f"  ({c.detail})" if c.detail else ""
        print(f"  [{status}] {c.material_id:5s} {c.property:20s} parsed={c.parsed_repr:40s} shadow.{c.shadow_field}={c.shadow_value}{extra}")

    print()
    print("=" * 78)
    print("PROPERTY VALUE COUNTS PER MATERIAL")
    print("=" * 78)
    for mid, m in materials.items():
        print(f"  {mid}: {len(m.properties)} property_value rows, {len(m.chemical_resistance)} chemical_resistance rows, {len(m.market_share)} market_share rows")

    return not all_failures and not disagreements


def main() -> int:
    materials = parse_all_materials()
    ok = _print_report(materials)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
