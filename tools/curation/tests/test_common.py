"""Unit tests for common.py's pure helpers -- no database needed."""
from __future__ import annotations

from common import (
    disambiguate_key,
    format_current_value,
    format_number,
    is_blank,
    normalize_test_method,
    slugify_source_key,
)


def test_format_number_strips_trailing_zero():
    assert format_number(300.0) == "300"
    assert format_number(0.925) == "0.925"
    assert format_number(None) == ""


def test_format_current_value_range():
    assert format_current_value(0.91, 0.925, None, None, None, None) == "0.91 - 0.925"


def test_format_current_value_typical():
    assert format_current_value(None, None, -110.0, None, None, None) == "-110"


def test_format_current_value_text():
    assert format_current_value(None, None, None, "اتیلن (Ethylene)", None, None) == "اتیلن (Ethylene)"


def test_format_current_value_bool():
    assert format_current_value(None, None, None, None, None, True) == "true"
    assert format_current_value(None, None, None, None, None, False) == "false"


def test_format_current_value_all_blank():
    assert format_current_value(None, None, None, None, None, None) == ""


def test_slugify_source_key_matches_design_doc_example():
    # curation-design.md section 5 gives this exact example.
    assert slugify_source_key("Polymer Handbook", "4th Edition") == "polymer-handbook-4e"


def test_slugify_source_key_no_edition():
    assert slugify_source_key("Polymer Physics") == "polymer-physics"


def test_slugify_source_key_is_deterministic():
    a = slugify_source_key("ASTM D1238 / ISO 1133 - Melt Flow Rate of Thermoplastics")
    b = slugify_source_key("ASTM D1238 / ISO 1133 - Melt Flow Rate of Thermoplastics")
    assert a == b


def test_disambiguate_key_appends_suffix_on_collision():
    used = {"polymer-handbook-4e"}
    assert disambiguate_key("polymer-handbook-4e", used, suffix="2020") == "polymer-handbook-4e-2020"


def test_disambiguate_key_falls_back_to_numeric_suffix():
    used = {"x", "x-2"}
    assert disambiguate_key("x", used) == "x-3"


def test_normalize_test_method():
    assert normalize_test_method("astm d1238") == "ASTM D1238"
    assert normalize_test_method("  ISO   1133 ") == "ISO 1133"


def test_is_blank():
    assert is_blank(None)
    assert is_blank("")
    assert is_blank("   ")
    assert not is_blank("y")
