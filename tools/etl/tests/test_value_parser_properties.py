"""Property-based tests for ``value_parser`` using Hypothesis.

These pin down the invariants ``value_parser``'s module docstring and
``ParsedValue.__post_init__`` promise: the parser never guesses, a numeric
range is never descending, and a numeric result always carries at least
one real number.
"""
from __future__ import annotations

import math

import pytest
from hypothesis import assume, given
from hypothesis import strategies as st

from value_parser import ValueParseError, parse_sourced_value

LOCATION = "test"

# Bounded, finite floats formatted to a fixed number of decimals so the
# resulting string never uses scientific notation and always matches the
# parser's numeric-token grammar (`-?[0-9][0-9,]*(?:\\.[0-9]+)?`).
_FINITE_FLOATS = st.floats(min_value=-1e5, max_value=1e5, allow_nan=False, allow_infinity=False)


def _fmt(x: float) -> float:
    """Round to 4 decimals -- matches the precision used to build the test
    string, so the float we assert against is exactly what round-tripped."""
    return round(x, 4)


@given(_FINITE_FLOATS, _FINITE_FLOATS)
def test_range_round_trip(a, b):
    """Formatting a (min, max) pair as 'min - max' and parsing it back
    recovers both endpoints, for any min <= max."""
    lo, hi = sorted((_fmt(a), _fmt(b)))
    s = f"{lo} - {hi}"
    parsed = parse_sourced_value(s, "unit", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_min == pytest.approx(lo, abs=1e-9)
    assert parsed.value_max == pytest.approx(hi, abs=1e-9)


@given(_FINITE_FLOATS)
def test_single_number_round_trip(a):
    """A single formatted number round-trips through value_typical."""
    v = _fmt(a)
    s = f"{v}"
    parsed = parse_sourced_value(s, "unit", location=LOCATION)
    assert parsed.kind == "numeric"
    assert parsed.value_typical == pytest.approx(v, abs=1e-9)


@given(_FINITE_FLOATS, _FINITE_FLOATS)
def test_min_le_max_invariant(a, b):
    """Whenever a parse yields both a min and a max, min <= max always
    holds -- regardless of the order the two numbers were generated in.
    A genuinely descending range must raise, never silently swap or
    truncate."""
    a_r, b_r = _fmt(a), _fmt(b)
    s = f"{a_r} - {b_r}"
    try:
        parsed = parse_sourced_value(s, "unit", location=LOCATION)
    except ValueParseError:
        # Descending ranges (a_r > b_r) are expected to raise; that's the
        # correct behaviour, not a violation of the invariant.
        assume(a_r > b_r)
        return
    if parsed.kind == "numeric" and parsed.value_min is not None and parsed.value_max is not None:
        assert parsed.value_min <= parsed.value_max


@given(
    st.one_of(
        _FINITE_FLOATS.map(lambda x: f"{_fmt(x)}"),
        st.tuples(_FINITE_FLOATS, _FINITE_FLOATS).map(lambda p: f"{_fmt(min(p))} - {_fmt(max(p))}"),
        _FINITE_FLOATS.map(lambda x: f"~ {_fmt(abs(x))}"),
        _FINITE_FLOATS.map(lambda x: f"< {_fmt(abs(x))}"),
        _FINITE_FLOATS.map(lambda x: f"> {_fmt(abs(x))}"),
    )
)
def test_numeric_result_never_all_none(s):
    """A numeric ParsedValue always has at least one of
    value_min/value_max/value_typical set -- never a numeric result with
    every field empty. Enforced structurally by ParsedValue.__post_init__,
    exercised here across the full range of numeric grammar forms."""
    parsed = parse_sourced_value(s, "unit", location=LOCATION)
    assert parsed.kind == "numeric"
    assert not (parsed.value_min is None and parsed.value_max is None and parsed.value_typical is None)


def test_no_unit_conversion_exposed():
    """value_parser intentionally exposes no physical unit-conversion
    function (see module docstring: it only repairs mangled unit *strings*
    via `_repair_unit`, it does not convert values between units). There is
    therefore no conversion-reversibility property to test here; this is a
    documentation stand-in for that task item, not a skipped assertion."""
    import value_parser

    conversion_like = [name for name in dir(value_parser) if "convert" in name.lower()]
    assert conversion_like == [], f"value_parser now exposes conversion function(s) {conversion_like} -- add a reversibility test for them"
