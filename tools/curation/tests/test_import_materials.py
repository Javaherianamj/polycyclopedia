"""Database-backed tests for import_materials.py -- creating a brand-new
material (and, where needed, a brand-new family under an existing field).

Same strategy as test_integration.py: direct function calls against the
`db_conn` fixture, which is always rolled back in teardown, so nothing here
is ever committed and no manual cleanup is required. Uses obviously-fake
slugs/keys ("zz-test-..." -- material slugs are validated against a
lowercase-hyphen pattern, so the "__test_..." convention used elsewhere in
this suite for free-text fields like source titles doesn't apply here) so a
row that somehow did leak past rollback would be unmistakable, never
mistaken for real data.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from common import NEW_MATERIALS_FIELDNAMES
from import_materials import (
    RowError,
    execute_plan,
    load_families,
    load_fields,
    load_materials_by_slug,
    validate_row,
    write_template,
)

TEST_SLUG = "zz-test-material"
TEST_FIELD_KEY = "thermoplastics"  # real, seeded field -- see field_key validation
TEST_EXISTING_FAMILY_KEY = "polyolefins"  # real, seeded family under thermoplastics
TEST_NEW_FAMILY_KEY = "zz-test-family"


def make_material_row(**overrides) -> dict:
    row = {field: "" for field in NEW_MATERIALS_FIELDNAMES}
    row.update(
        {
            "slug": TEST_SLUG,
            "field_key": TEST_FIELD_KEY,
            "family_key": TEST_EXISTING_FAMILY_KEY,
            "name_fa": "ماده تست",
            "name_en": "Test Material",
        }
    )
    row.update(overrides)
    return row


# ---------------------------------------------------------------------------
# Creating a new material
# ---------------------------------------------------------------------------


def test_creates_new_material_under_existing_family(db_conn):
    valid_fields = load_fields(db_conn)
    existing_families = load_families(db_conn)
    existing_materials = load_materials_by_slug(db_conn)
    assert TEST_SLUG not in existing_materials

    row = make_material_row(code="TST", cas="123-45-6", discovery_year="1999")
    plan = validate_row(2, row, valid_fields, existing_families, existing_materials)
    assert plan.material_exists is False
    assert plan.family_is_new is False

    execute_plan(db_conn, [plan], valid_fields, existing_families, existing_materials)

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT status, name_en, name_fa, code, field_id, family_id FROM material WHERE slug = %s;",
            (TEST_SLUG,),
        )
        status, name_en, name_fa, code, field_id, family_id = cur.fetchone()
        assert status == "draft"
        assert name_en == "Test Material"
        assert name_fa == "ماده تست"
        assert code == "TST"
        assert field_id == valid_fields[TEST_FIELD_KEY]
        assert family_id == existing_families[(TEST_FIELD_KEY, TEST_EXISTING_FAMILY_KEY)]

        cur.execute(
            "SELECT type, value FROM material_identifier mi JOIN material m ON m.id = mi.material_id "
            "WHERE m.slug = %s;",
            (TEST_SLUG,),
        )
        identifiers = dict(cur.fetchall())
        assert identifiers == {"cas": "123-45-6"}


# ---------------------------------------------------------------------------
# Creating a new family
# ---------------------------------------------------------------------------


def test_creates_new_family_when_names_supplied(db_conn):
    valid_fields = load_fields(db_conn)
    existing_families = load_families(db_conn)
    existing_materials = load_materials_by_slug(db_conn)
    assert (TEST_FIELD_KEY, TEST_NEW_FAMILY_KEY) not in existing_families

    row = make_material_row(
        family_key=TEST_NEW_FAMILY_KEY,
        family_name_fa="خانواده تست",
        family_name_en="Test Family",
    )
    plan = validate_row(2, row, valid_fields, existing_families, existing_materials)
    assert plan.family_is_new is True

    execute_plan(db_conn, [plan], valid_fields, existing_families, existing_materials)

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT name_fa, name_en, field_id FROM family WHERE key = %s;",
            (TEST_NEW_FAMILY_KEY,),
        )
        name_fa, name_en, field_id = cur.fetchone()
        assert name_fa == "خانواده تست"
        assert name_en == "Test Family"
        assert field_id == valid_fields[TEST_FIELD_KEY]

        cur.execute("SELECT family_id FROM material WHERE slug = %s;", (TEST_SLUG,))
        material_family_id = cur.fetchone()[0]
        cur.execute("SELECT id FROM family WHERE key = %s;", (TEST_NEW_FAMILY_KEY,))
        assert material_family_id == cur.fetchone()[0]


def test_new_family_without_names_is_rejected(db_conn):
    valid_fields = load_fields(db_conn)
    existing_families = load_families(db_conn)
    existing_materials = load_materials_by_slug(db_conn)

    row = make_material_row(family_key=TEST_NEW_FAMILY_KEY)  # no family_name_fa/en
    with pytest.raises(RowError) as exc:
        validate_row(2, row, valid_fields, existing_families, existing_materials)
    message = exc.value.render()
    assert TEST_NEW_FAMILY_KEY in message
    assert "family_name_fa" in message
    assert "family_name_en" in message


# ---------------------------------------------------------------------------
# Unknown field_key
# ---------------------------------------------------------------------------


def test_unknown_field_key_is_rejected_listing_valid_keys(db_conn):
    valid_fields = load_fields(db_conn)
    existing_families = load_families(db_conn)
    existing_materials = load_materials_by_slug(db_conn)

    row = make_material_row(field_key="not-a-real-field")
    with pytest.raises(RowError) as exc:
        validate_row(2, row, valid_fields, existing_families, existing_materials)
    message = exc.value.render()
    assert "not-a-real-field" in message
    # Every real field key must be named so the curator can just copy one.
    for key in valid_fields:
        assert key in message


# ---------------------------------------------------------------------------
# Idempotent re-run
# ---------------------------------------------------------------------------


def test_rerun_updates_in_place_without_duplicating(db_conn):
    valid_fields = load_fields(db_conn)
    existing_families = load_families(db_conn)
    existing_materials = load_materials_by_slug(db_conn)

    row = make_material_row(name_en="Test Material")
    plan1 = validate_row(2, row, valid_fields, existing_families, existing_materials)
    execute_plan(db_conn, [plan1], valid_fields, existing_families, existing_materials)

    # Re-load within the same (uncommitted) transaction -- the connection
    # sees its own writes, so this exercises the same "does it already
    # exist" lookup a second real invocation would do against a committed row.
    existing_materials_2 = load_materials_by_slug(db_conn)
    assert TEST_SLUG in existing_materials_2

    row2 = make_material_row(name_en="Test Material Renamed")
    plan2 = validate_row(2, row2, valid_fields, existing_families, existing_materials_2)
    assert plan2.material_exists is True
    execute_plan(db_conn, [plan2], valid_fields, existing_families, existing_materials_2)

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM material WHERE slug = %s;", (TEST_SLUG,))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT name_en FROM material WHERE slug = %s;", (TEST_SLUG,))
        assert cur.fetchone()[0] == "Test Material Renamed"


def test_update_with_blank_optional_column_does_not_erase_existing_value(db_conn):
    """The realistic destructive case: a curator adds an English overview to a
    material that already has a hand-written Persian one, filling in only the
    columns they care about. Every other optional column in that row is blank,
    and a blank must mean "leave alone" -- overview_fa exists nowhere else, so
    an unconditional UPDATE would destroy it silently.
    """
    valid_fields = load_fields(db_conn)
    existing_families = load_families(db_conn)
    existing_materials = load_materials_by_slug(db_conn)

    created = make_material_row(
        overview_fa="متن فارسی اصلی",
        overview_en="",
        code="ZZ",
        chain_type="linear_pure",
    )
    plan1 = validate_row(2, created, valid_fields, existing_families, existing_materials)
    execute_plan(db_conn, [plan1], valid_fields, existing_families, existing_materials)

    existing_materials_2 = load_materials_by_slug(db_conn)
    # Second pass fills in ONLY overview_en, exactly as the G6 English-content
    # rows in curation/new_materials.csv do.
    english_only = make_material_row(overview_en="Original English text")
    plan2 = validate_row(3, english_only, valid_fields, existing_families, existing_materials_2)
    execute_plan(db_conn, [plan2], valid_fields, existing_families, existing_materials_2)

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT overview_fa, overview_en, code, chain_type FROM material WHERE slug = %s;",
            (TEST_SLUG,),
        )
        overview_fa, overview_en, code, chain_type = cur.fetchone()

    assert overview_fa == "متن فارسی اصلی", "blank overview_fa must not erase the Persian prose"
    assert overview_en == "Original English text"
    assert code == "ZZ", "blank code must not erase the existing code"
    assert chain_type == "linear_pure"


# ---------------------------------------------------------------------------
# --template
# ---------------------------------------------------------------------------


def test_template_writes_header_and_commented_example_row(tmp_path):
    path: Path = tmp_path / "new_materials.csv"
    write_template(path)

    assert path.exists()
    raw = path.read_bytes()
    assert raw.startswith(b"\xef\xbb\xbf"), "missing BOM; Excel will mangle Persian text"

    import csv

    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        assert reader.fieldnames == NEW_MATERIALS_FIELDNAMES
        rows = list(reader)
    assert len(rows) == 1
    assert rows[0]["slug"].startswith("#"), "example row must be a comment, never importable as-is"
