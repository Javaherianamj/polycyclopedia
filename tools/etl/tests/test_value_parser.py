"""Example-based tests for ``value_parser.parse_sourced_value``.

Every positive case below uses a real ``value``/``unit`` pair copied
verbatim from ``src/data/polymersData.ts`` (LDPE unless noted), one per
legacy grammar form documented in that module's docstring. The negative
cases are the seven known two-variant strings (PVC/PET/PS) that
deliberately must raise rather than silently pick a value -- see
``tools/etl/README.md`` for why those are out of scope rather than bugs.
"""
from __future__ import annotations

import pytest

from value_parser import ParsedValue, ValueParseError, parse_sourced_value

LOCATION = "test"


# ---------------------------------------------------------------------------
# Positive cases -- one per grammar form, real strings from polymersData.ts
# ---------------------------------------------------------------------------


def test_plain_number():
    # ldpe.thermal.tg: `tg: { value: -110, unit: '°C', ... }` -- a bare JS
    # number, not a string.
    parsed = parse_sourced_value(-110, "°C", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_typical == -110.0
    assert parsed.value_min is None
    assert parsed.value_max is None
    assert parsed.unit_display == "°C"


def test_range():
    # ldpe.physical.density: '0.910 - 0.925' g/cm3
    parsed = parse_sourced_value("0.910 - 0.925", "g/cm³", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_min == pytest.approx(0.910)
    assert parsed.value_max == pytest.approx(0.925)
    assert parsed.value_typical is None
    assert parsed.unit_display == "g/cm³"


def test_approximate():
    # ldpe.physical.refractiveIndex: '~ 1.51'
    parsed = parse_sourced_value("~ 1.51", "", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_typical == pytest.approx(1.51)
    assert parsed.qualifier == "~"


def test_inequality_less_than():
    # ldpe.physical.waterAbsorption: '< 0.01' %
    parsed = parse_sourced_value("< 0.01", "%", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_max == pytest.approx(0.01)
    assert parsed.value_min is None
    assert parsed.qualifier == "<"


def test_unicode_superscript_range():
    # ldpe.electrical.volumeResistivity: '10¹⁶ - 10¹⁸' Ω·cm
    parsed = parse_sourced_value("10¹⁶ - 10¹⁸", "Ω·cm", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_min == pytest.approx(1e16)
    assert parsed.value_max == pytest.approx(1e18)
    assert parsed.unit_display == "Ω·cm"


def test_persian_text():
    # ldpe.physical.appearance: 'نیمه‌شفاف (Translucent)' -- no unit,
    # classified as text because it contains no digit-like characters.
    parsed = parse_sourced_value("نیمه‌شفاف (Translucent)", "", location=LOCATION)
    assert parsed.kind == "text"
    assert parsed.value_text == "نیمه‌شفاف (Translucent)"


def test_ratio():
    # ldpe.processing.bur: '2:1 تا 4:1' -- a blow-up-ratio range, not a
    # scalar quantity, kept as text per the grammar (contains a Persian
    # "تا" = "to" and digit-like characters, but is not a numeric range).
    parsed = parse_sourced_value("2:1 تا 4:1", "", location=LOCATION)
    assert parsed.kind == "text"
    assert parsed.value_text == "2:1 تا 4:1"


def test_mangled_unit_repair():
    # ldpe.thermal.cte: value '150 - 200 µm/', unit '°C' -- the unit field
    # holds only half of the true compound unit ('°C'); the trailing 'µm/'
    # left dangling after the number range must be merged into it to give
    # the repaired unit 'µm/°C'.
    parsed = parse_sourced_value("150 - 200 µm/", "°C", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_min == pytest.approx(150)
    assert parsed.value_max == pytest.approx(200)
    assert parsed.unit_display == "µm/°C"


# ---------------------------------------------------------------------------
# Negative cases -- the seven legacy strings that cram two material variants
# into one cell. Must raise ValueParseError, never silently return a
# (wrong) single value. Verbatim from src/data/polymersData.ts.
# ---------------------------------------------------------------------------

TWO_VARIANT_CASES = [
    ("pvc.mechanical.tensileStrength", "40 - 60 (Rigid) / 10 - 25 MPa", "MPa"),
    ("pvc.mechanical.elongationAtBreak", "20 - 100 (Rigid) / 200 - 450", "%"),
    ("pet.thermal.hdt", "70 - 80 (بدون الیاف) / 220", "°C"),
    ("pet.mechanical.tensileStrength", "50 - 80 (Unoriented) / 150 - 250 MPa", "MPa"),
    ("ps.mechanical.tensileStrength", "35 - 55 (GPPS) / 20 - 35 MPa", "MPa"),
    ("ps.mechanical.elongationAtBreak", "1 - 3 (GPPS) / 30 - 65", "%"),
    ("ps.mechanical.izodImpact", "15 - 25 (GPPS) / 70 - 120 J/m", "J/m"),
]


@pytest.mark.parametrize("location,raw_value,unit", TWO_VARIANT_CASES, ids=[c[0] for c in TWO_VARIANT_CASES])
def test_two_variant_strings_raise(location, raw_value, unit):
    with pytest.raises(ValueParseError):
        parse_sourced_value(raw_value, unit, location=location)


# ---------------------------------------------------------------------------
# ParsedValue construction invariants (sanity checks on the dataclass
# itself, exercised indirectly by every case above but worth pinning down
# directly too).
# ---------------------------------------------------------------------------


def test_numeric_parsed_value_requires_at_least_one_field():
    with pytest.raises(ValueError):
        ParsedValue(kind="numeric")


def test_numeric_parsed_value_rejects_descending_range():
    with pytest.raises(ValueError):
        ParsedValue(kind="numeric", value_min=10.0, value_max=5.0)


def test_text_parsed_value_requires_value_text():
    with pytest.raises(ValueError):
        ParsedValue(kind="text")
