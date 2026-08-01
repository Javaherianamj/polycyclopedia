"""Tests for import_values.validate_row -- the V1-V10 rules from
curation-design.md section 6. Pure logic, no database: live_values/
sources_by_key/test_methods are built by hand here instead of loaded from
Postgres, so these run fast and don't need polypedia-pg up.

Database-backed behaviour (what actually gets written, supersede, the
DB CHECK constraint as a backstop) is covered in test_integration.py.
"""
from __future__ import annotations

import pytest

from import_values import DEFAULT_CONFIDENCE, LiveValue, RowError, validate_row

CONTEXT = ("ldpe", "density")


def make_live(
    data_type="numeric",
    canonical_unit="g/cm³",
    plausible_min=0.8,
    plausible_max=2.3,
    value_min=0.91,
    value_max=0.925,
    value_typical=None,
    value_text=None,
    value_enum=None,
    value_bool=None,
    has_evidence=False,
) -> LiveValue:
    return LiveValue(
        pv_id=1,
        subject_id=1,
        property_id=1,
        data_type=data_type,
        canonical_unit=canonical_unit,
        plausible_min=plausible_min,
        plausible_max=plausible_max,
        value_min=value_min,
        value_max=value_max,
        value_typical=value_typical,
        value_text=value_text,
        value_enum=value_enum,
        value_bool=value_bool,
        unit_display=canonical_unit,
        qualifier=None,
        test_method_id=None,
        conditions={},
        note_en=None,
        note_fa=None,
        confidence=None,
        has_evidence=has_evidence,
    )


def base_row(**overrides) -> dict:
    row = {
        "material_slug": "ldpe",
        "property_key": "density",
        "value_min": "",
        "value_max": "",
        "value_typical": "",
        "qualifier": "",
        "source_key": "polymer-handbook-4e",
        "page": "45",
        "table": "",
        "figure": "",
        "section": "",
        "test_method": "",
        "conditions": "",
        "note_en": "",
        "note_fa": "",
        "confidence": "",
        "skip": "",
    }
    row.update(overrides)
    return row


def validate(row, live=None, sources=None, fallback=None, test_methods=None):
    return validate_row(
        row_number=2,
        row=row,
        live_values={CONTEXT: live or make_live()},
        sources_by_key=sources or {"polymer-handbook-4e": {"title": "Polymer Handbook", "kind": "handbook", "tier": "peer_reviewed_handbook"}},
        fallback_sources_by_key=fallback or {},
        test_methods=test_methods or {"ASTM D1238": 1},
    )


# --- V8: material/property must resolve to a real live value ---------------


def test_v8_unknown_gap_gives_readable_error():
    row = base_row(material_slug="ldpe", property_key="not_a_real_property")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "doesn't match any current value" in exc.value.message
    assert "not_a_real_property" in exc.value.message


def test_v8_valid_gap_passes():
    plan = validate(base_row())
    assert plan.material_slug == "ldpe"
    assert plan.property_key == "density"


# --- V3: numeric parsing, and numeric columns don't apply to text props ----


def test_v3_non_numeric_value_min_rejected():
    row = base_row(value_min="abc")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "is not a number" in exc.value.message


def test_v3_numeric_value_for_text_property_rejected():
    live = make_live(data_type="text", value_min=None, value_max=None, value_text="اتیلن (Ethylene)")
    row = base_row(value_min="5")
    with pytest.raises(RowError) as exc:
        validate(row, live=live)
    assert "is not a number" not in exc.value.message  # different message: type mismatch, not parse failure
    assert "type 'text'" in exc.value.message


# --- V1: a value must exist, old or new -------------------------------------


def test_v1_no_new_value_and_no_existing_value_rejected():
    live = make_live(value_min=None, value_max=None, value_typical=None)
    row = base_row()
    with pytest.raises(RowError) as exc:
        validate(row, live=live)
    assert "no value given" in exc.value.message


def test_v1_citation_only_row_keeps_existing_numeric_value():
    """The core "just add a citation" path: value_min/max/typical all
    blank, existing DB value used as-is."""
    plan = validate(base_row())
    assert plan.keep_existing_value is True
    assert plan.value_min is None and plan.value_max is None


def test_v1_citation_only_row_keeps_existing_text_value():
    """The 20 text-typed unsourced properties (appearance, monomer_name,
    ...) can only ever go through this path -- gaps.csv has no text-value
    column at all."""
    live = make_live(data_type="text", value_min=None, value_max=None, value_text="اتیلن (Ethylene)")
    plan = validate(base_row(), live=live)
    assert plan.keep_existing_value is True


def test_v1_text_property_with_no_existing_value_rejected():
    live = make_live(data_type="text", value_min=None, value_max=None, value_text=None)
    with pytest.raises(RowError) as exc:
        validate(base_row(), live=live)
    assert "no existing value to cite" in exc.value.message


# --- V2: inverted range ------------------------------------------------------


def test_v2_inverted_range_rejected():
    row = base_row(value_min="2.3", value_max="0.8")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "inverted" in exc.value.message


def test_v2_equal_min_max_allowed():
    row = base_row(value_min="0.91", value_max="0.91")
    plan = validate(row)
    assert plan.value_min == plan.value_max == 0.91


# --- V4: plausibility, blocking by default, overridable ---------------------


def test_v4_implausible_value_rejected_with_readable_message():
    row = base_row(value_typical="920")
    with pytest.raises(RowError) as exc:
        validate(row)
    msg = exc.value.message
    assert "far outside the plausible range" in msg
    assert "0.8-2.3" in msg
    # This is the exact style of hint requested: plain language, names the
    # likely mistake, no DB jargon.
    assert "kg/m³ instead of g/cm³" in msg
    assert "CHECK" not in msg and "chk" not in msg


def test_v4_no_override_confidence_alone_still_blocks():
    row = base_row(value_typical="920", confidence="0.95")
    with pytest.raises(RowError):
        validate(row)


def test_v4_override_requires_confidence_and_note():
    row = base_row(value_typical="920", confidence="0.95", note_en="Confirmed against three independent sources.")
    plan = validate(row)
    assert plan.value_typical == 920
    assert plan.warnings  # accepted, but flagged


def test_v4_note_alone_without_confidence_still_blocks():
    row = base_row(value_typical="920", note_en="Trust me.")
    with pytest.raises(RowError):
        validate(row)


def test_v4_skipped_when_no_plausible_bounds():
    live = make_live(plausible_min=None, plausible_max=None)
    row = base_row(value_typical="99999")
    plan = validate(row, live=live)
    assert plan.value_typical == 99999


# --- V5: locator required, readable error not a DB constraint error --------


def test_v5_missing_locator_readable_not_raw_db_error():
    row = base_row(page="", table="", figure="", section="")
    with pytest.raises(RowError) as exc:
        validate(row)
    msg = exc.value.message
    assert "page, table, figure, or section" in msg
    # The whole point of V5: this must never look like the underlying
    # Postgres CHECK constraint's own error text.
    for forbidden in ("citation_locator_present_chk", "psycopg", "violates check constraint", "jsonb_typeof"):
        assert forbidden not in msg


def test_v5_any_single_locator_is_sufficient():
    for field_name in ("page", "table", "figure", "section"):
        row = base_row(page="", table="", figure="", section="")
        row[field_name] = "x"
        plan = validate(row)
        assert plan.locator == {field_name: "x"}


# --- V6: source_key must resolve --------------------------------------------


def test_v6_unknown_source_key_rejected():
    row = base_row(source_key="not-a-real-source")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "isn't in sources.csv" in exc.value.message


def test_v6_blank_source_key_rejected():
    row = base_row(source_key="")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "no source_key given" in exc.value.message


def test_v6_source_key_resolves_via_db_fallback():
    """A source_key that isn't in the (possibly stale) sources.csv the
    curator has open, but does match an existing DB source by the same
    slugging convention, still resolves -- guards against a curator working
    from an older export."""
    row = base_row(source_key="handbook-of-something")
    plan = validate(row, sources={}, fallback={"handbook-of-something": 42})
    assert plan.source_row["_existing_source_id"] == 42


# --- V7: qualifier -----------------------------------------------------------


@pytest.mark.parametrize("qualifier", ["<", ">", "~", ">=", "<="])
def test_v7_valid_qualifiers_accepted(qualifier):
    plan = validate(base_row(qualifier=qualifier))
    assert plan.qualifier == qualifier


def test_v7_invalid_qualifier_rejected():
    row = base_row(qualifier="!=")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "isn't recognised" in exc.value.message


# --- V9: test_method ----------------------------------------------------------


def test_v9_valid_test_method_resolves():
    plan = validate(base_row(test_method="ASTM D1238"))
    assert plan.test_method_id == 1


def test_v9_case_and_spacing_insensitive():
    plan = validate(base_row(test_method="astm   d1238"))
    assert plan.test_method_id == 1


def test_v9_unknown_test_method_rejected():
    row = base_row(test_method="ASTM D9999")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "doesn't match a known test method" in exc.value.message


def test_v9_blank_test_method_keeps_existing():
    live = make_live()
    live.test_method_id = 7
    plan = validate(base_row(), live=live)
    assert plan.test_method_id == 7


# --- V10: confidence ----------------------------------------------------------


def test_v10_blank_confidence_defaults():
    plan = validate(base_row(confidence=""))
    assert plan.confidence == DEFAULT_CONFIDENCE


def test_v10_confidence_out_of_range_rejected():
    row = base_row(confidence="1.5")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "out of range" in exc.value.message


def test_v10_confidence_not_a_number_rejected():
    row = base_row(confidence="high")
    with pytest.raises(RowError) as exc:
        validate(row)
    assert "is not a number" in exc.value.message


def test_v10_valid_confidence_accepted():
    plan = validate(base_row(confidence="0.75"))
    assert plan.confidence == 0.75


# --- Error rendering ----------------------------------------------------------


def test_error_render_includes_row_number_and_context():
    row = base_row(page="", table="", figure="", section="")
    with pytest.raises(RowError) as exc:
        validate(row)
    rendered = exc.value.render()
    assert rendered.startswith("Row 2 (ldpe / density):")
