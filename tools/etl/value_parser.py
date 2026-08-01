"""Pure parsing/normalisation logic for legacy ``SourcedValue`` display
strings (``{ value: '0.910 - 0.925', unit: 'g/cm3', sourceId: '...' }``)
into normalised numeric fields matching the new schema's
``property_value.value_min`` / ``value_max`` / ``value_typical`` /
``qualifier`` columns (see schema-design.md section 6.4).

No I/O, no knowledge of the polymer data shape -- this module only knows
how to turn one legacy value string (or JS number) into a
:class:`ParsedValue`. It is exercised directly by the example-based and
property-based tests in ``tests/``.

Hard rule (schema-design.md section 11): the parser never guesses. Any
input it cannot confidently classify raises :class:`ValueParseError` naming
the offending value and where it came from; callers are expected to catch
that, collect it, and decide what to do (parse_polymers.py collects all of
them and refuses to proceed if any remain).
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Unicode superscript handling
# ---------------------------------------------------------------------------

_SUPERSCRIPT_DIGITS = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
}
_SUPERSCRIPT_CHARS = "".join(_SUPERSCRIPT_DIGITS)


def _superscript_to_int(sup: str) -> int:
    digits = "".join(_SUPERSCRIPT_DIGITS[c] for c in sup)
    return int(digits)


# ---------------------------------------------------------------------------
# Grammar
# ---------------------------------------------------------------------------

# A numeric "token" is either plain digits (optionally with thousands
# commas and a decimal point) or scientific notation written as
# `10` followed by unicode superscript digits (`10^16`, `10¹⁶`).
_NUM_TOKEN = rf"(?:-?10[{_SUPERSCRIPT_CHARS}]+|-?[0-9][0-9,]*(?:\.[0-9]+)?)"

_RANGE_RE = re.compile(rf"^(?P<min>{_NUM_TOKEN})\s*-\s*(?P<max>{_NUM_TOKEN})(?P<suffix>.*)$")
_SINGLE_RE = re.compile(rf"^(?P<num>{_NUM_TOKEN})(?P<suffix>.*)$")

# Anything left dangling on the end of a number/range that we are willing to
# even consider merging into the unit. Digits are deliberately excluded --
# if digits show up in the "suffix" it means our range/single regex above
# stopped early because the rest of the string isn't a clean unit fragment
# (e.g. a second, alternate range), and we must not guess which part is
# "the" value.
_ALLOWED_SUFFIX_RE = re.compile(rf"^[\sA-Za-zµÅΩ°·{_SUPERSCRIPT_CHARS}/]*$")

# `150 - 200 µm/` (unit field holds the other half, e.g. '°C') -> repaired
# unit is the concatenation: 'µm/°C'.
_OPEN_UNIT_SUFFIX_RE = re.compile(r"^\s*([A-Za-zµÅΩ°·]+/)\s*$")

# `16 - 17¹/²` -> the superscript fraction is an exponent on the *unit*
# (solubility parameter is in units of MPa^0.5), not part of the number.
_FRACTION_SUFFIX_RE = re.compile(rf"^\s*([{_SUPERSCRIPT_CHARS}]+)/([{_SUPERSCRIPT_CHARS}]+)\s*$")

# `2:1 تا 4:1` -- a blow-up-ratio range expressed as "N:M تا N:M" (Persian
# "تا" = "to"). Not a scalar quantity -- kept as text per the spec.
_RATIO_RE = re.compile(r"^\d+\s*:\s*\d+\s*تا\s*\d+\s*:\s*\d+$")

_QUALIFIER_CHARS = "<>≤≥"
_LOWER_QUALIFIERS = set("<≤")  # '<' , '≤' -> bounds value_max
_UPPER_QUALIFIERS = set(">≥")  # '>' , '≥' -> bounds value_min

_DIGIT_LIKE_RE = re.compile(rf"[0-9{_SUPERSCRIPT_CHARS}]")


class ValueParseError(Exception):
    """Raised when a legacy value string cannot be confidently classified.

    Carries enough context (``location``, ``raw_value``) for the caller to
    build a human-readable failure report without re-deriving it.
    """

    def __init__(self, location: str, raw_value: object, message: str):
        super().__init__(f"{location}: cannot parse value {raw_value!r}: {message}")
        self.location = location
        self.raw_value = raw_value
        self.message = message


@dataclass(frozen=True)
class ParsedValue:
    kind: str  # 'numeric' or 'text'
    value_min: float | None = None
    value_max: float | None = None
    value_typical: float | None = None
    value_text: str | None = None
    qualifier: str | None = None
    unit_display: str | None = None

    def __post_init__(self):
        if self.kind not in ("numeric", "text"):
            raise ValueError(f"invalid ParsedValue.kind {self.kind!r}")
        if self.kind == "numeric":
            if self.value_min is None and self.value_max is None and self.value_typical is None:
                raise ValueError("numeric ParsedValue must set at least one of min/max/typical")
            if self.value_min is not None and self.value_max is not None and self.value_min > self.value_max:
                raise ValueError(f"invariant violated: value_min ({self.value_min}) > value_max ({self.value_max})")
        else:
            if self.value_text is None:
                raise ValueError("text ParsedValue must set value_text")


def _parse_number_token(token: str) -> float:
    """Convert one already-matched numeric token to a float. Raises
    ValueError on anything that snuck past the regex but still isn't a
    valid number (shouldn't happen, kept for defence in depth)."""
    token = token.strip()
    m = re.fullmatch(rf"(-?)10([{_SUPERSCRIPT_CHARS}]+)", token)
    if m:
        sign, sup = m.groups()
        exponent = _superscript_to_int(sup)
        value = 10.0**exponent
        return -value if sign else value
    cleaned = token.replace(",", "")
    return float(cleaned)


def _has_digit_like(s: str) -> bool:
    return bool(_DIGIT_LIKE_RE.search(s))


def _repair_unit(suffix: str, declared_unit: str, *, location: str, raw_value: object) -> str | None:
    """Merges a trailing fragment left over after stripping numeric tokens
    (e.g. 'µm/' or '¹/²') into the declared unit. Raises rather than
    guessing if the fragment doesn't match a known repair pattern."""
    if not suffix.strip():
        return declared_unit or None
    if not _ALLOWED_SUFFIX_RE.match(suffix):
        raise ValueParseError(
            location,
            raw_value,
            f"trailing fragment {suffix!r} after the number(s) is not a recognised unit "
            "fragment (contains digits/punctuation) -- refusing to guess",
        )
    frac_m = _FRACTION_SUFFIX_RE.match(suffix)
    if frac_m:
        numerator = _superscript_to_int(frac_m.group(1))
        denominator = _superscript_to_int(frac_m.group(2))
        if denominator == 0:
            raise ValueParseError(location, raw_value, "zero denominator in unit exponent fraction")
        exponent = numerator / denominator
        base_unit = declared_unit or ""
        return f"{base_unit}^{exponent:g}" if base_unit else f"^{exponent:g}"
    open_m = _OPEN_UNIT_SUFFIX_RE.match(suffix)
    if open_m:
        if not declared_unit:
            raise ValueParseError(
                location, raw_value, f"mangled unit fragment {suffix!r} but no declared unit to merge it into"
            )
        return f"{open_m.group(1)}{declared_unit}"
    raise ValueParseError(location, raw_value, f"cannot confidently repair trailing fragment {suffix!r}")


def parse_sourced_value(raw_value: object, unit: str | None, *, location: str) -> ParsedValue:
    """Parse one legacy ``SourcedValue.value`` (plus its sibling ``unit``)
    into a :class:`ParsedValue`.

    ``location`` is a short human-readable path used only for error
    messages, e.g. ``"ldpe.thermal.tg"``.
    """
    unit = unit or ""

    if isinstance(raw_value, bool):
        raise ValueParseError(location, raw_value, "boolean is not a valid SourcedValue.value")

    if isinstance(raw_value, (int, float)):
        return ParsedValue(kind="numeric", value_typical=float(raw_value), unit_display=unit or None)

    if not isinstance(raw_value, str):
        raise ValueParseError(location, raw_value, f"unsupported value type {type(raw_value).__name__}")

    s = raw_value.strip()
    if s == "":
        raise ValueParseError(location, raw_value, "empty value string")

    # Ratio, e.g. '2:1 تا 4:1' -- not a scalar, kept as text.
    if _RATIO_RE.match(s):
        return ParsedValue(kind="text", value_text=s, unit_display=unit or None)

    # Approximate, e.g. '~ 1.51'
    if s.startswith("~"):
        rest = s[1:].strip()
        m = _SINGLE_RE.match(rest)
        if not m or m.group("suffix").strip():
            raise ValueParseError(location, raw_value, "expected a single number after '~'")
        value = _parse_number_token(m.group("num"))
        return ParsedValue(kind="numeric", value_typical=value, qualifier="~", unit_display=unit or None)

    # Inequality, e.g. '< 0.01', '> 5', '≤ 3', '≥ 3'
    if s[0] in _QUALIFIER_CHARS:
        qualifier = s[0]
        rest = s[1:].strip()
        m = _SINGLE_RE.match(rest)
        if not m or m.group("suffix").strip():
            raise ValueParseError(location, raw_value, f"expected a single number after {qualifier!r}")
        value = _parse_number_token(m.group("num"))
        if qualifier in _LOWER_QUALIFIERS:
            return ParsedValue(kind="numeric", value_max=value, qualifier=qualifier, unit_display=unit or None)
        return ParsedValue(kind="numeric", value_min=value, qualifier=qualifier, unit_display=unit or None)

    # Range, e.g. '0.910 - 0.925', '10¹⁶ - 10¹⁸', '150 - 200 µm/' (mangled unit)
    range_m = _RANGE_RE.match(s)
    if range_m:
        suffix = range_m.group("suffix")
        if suffix == "" or _ALLOWED_SUFFIX_RE.match(suffix):
            vmin = _parse_number_token(range_m.group("min"))
            vmax = _parse_number_token(range_m.group("max"))
            if vmin > vmax:
                raise ValueParseError(location, raw_value, f"range is descending ({vmin} > {vmax})")
            unit_display = _repair_unit(suffix, unit, location=location, raw_value=raw_value)
            return ParsedValue(kind="numeric", value_min=vmin, value_max=vmax, unit_display=unit_display)
        # Suffix has digits/punctuation in it (e.g. a second alternate
        # range like '(Rigid) / 10 - 25 MPa') -- fall through to the
        # generic digit-bearing-string check below, which will raise.

    else:
        # Single number, possibly with a mangled-unit suffix, e.g. '10¹⁵'
        single_m = _SINGLE_RE.match(s)
        if single_m:
            suffix = single_m.group("suffix")
            if suffix == "" or _ALLOWED_SUFFIX_RE.match(suffix):
                value = _parse_number_token(single_m.group("num"))
                unit_display = _repair_unit(suffix, unit, location=location, raw_value=raw_value)
                return ParsedValue(kind="numeric", value_typical=value, unit_display=unit_display)

    # Nothing matched. If the string has no digit-like characters at all,
    # it's genuine descriptive text (Persian or English) -- classify it as
    # such. If it *does* contain digits, something about it looked
    # numeric but didn't match a known grammar form (e.g. a compound
    # "40 - 60 (Rigid) / 10 - 25 MPa" alternate-grade value) -- refuse to
    # guess which number is "the" value.
    if not _has_digit_like(s):
        return ParsedValue(kind="text", value_text=s, unit_display=unit or None)

    raise ValueParseError(location, raw_value, "contains digits but does not match any known value grammar")
