"""Database-backed tests for import_hsp_correlations.py, run against the
live polypedia-pg database as the polypedia_app role.

Same strategy as test_import_solvents.py: direct function calls against the
`db_conn` fixture, always rolled back in teardown -- nothing here is ever
committed. Test correlations use an unmistakable "zz-test-..." key prefix.
"""
from __future__ import annotations

import pytest

from import_hsp_correlations import (
    CATALOG_LINKS,
    RowError,
    insert_citation_and_evidence,
    resolve_source_document_id,
    resolve_source_id,
    upsert_correlation,
    validate_row,
)

TEST_KEY = "zz-test-hsp-correlation"


def make_row(**overrides) -> dict:
    row = {
        "key": TEST_KEY,
        "handbook_number": "9999",
        "name_raw": "TEST CORRELATION",
        "section": "Test Section",
        "uncertainty": "",
        "hansen_d": "16.0",
        "hansen_p": "8.0",
        "hansen_h": "5.0",
        "r0": "9.0",
        "page": "500",
        "note": "",
    }
    row.update(overrides)
    return row


# ---------------------------------------------------------------------------
# validate_row: the CHECK-constraint mirror
# ---------------------------------------------------------------------------


def test_validate_row_accepts_a_well_formed_row():
    plan = validate_row(2, make_row(), {})
    assert plan.key == TEST_KEY
    assert plan.name_raw == "TEST CORRELATION"
    assert plan.hansen_d == 16.0
    assert plan.r0 == 9.0
    assert plan.page == 500
    assert plan.material_id is None


@pytest.mark.parametrize("field,value", [("hansen_d", "-1"), ("hansen_p", "61"), ("hansen_h", "100")])
def test_validate_row_rejects_out_of_bounds_hansen_values(field, value):
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(**{field: value}), {})
    assert field in exc.value.message
    assert TEST_KEY in exc.value.render()


def test_validate_row_rejects_nonpositive_r0():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(r0="0"), {})
    assert "r0" in exc.value.message


def test_validate_row_rejects_r0_above_bound():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(r0="61"), {})
    assert "r0" in exc.value.message


def test_validate_row_rejects_missing_key():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(key=""), {})
    assert "key" in exc.value.message


def test_validate_row_rejects_missing_name():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(name_raw=""), {})
    assert "name_raw" in exc.value.message


def test_validate_row_rejects_non_numeric_hansen_value():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(hansen_d="not-a-number"), {})
    assert "hansen_d" in exc.value.message


def test_validate_row_rejects_a_row_flagged_by_the_extractor():
    """A note in the CSV means the extractor already flagged this row as
    unparseable/out-of-range -- the importer must never import it anyway."""
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(note="out_of_range: a Hansen parameter is outside [0, 60]"), {})
    assert "flagged by extract_hsp_polymers.py" in exc.value.message


# ---------------------------------------------------------------------------
# Catalog linking
# ---------------------------------------------------------------------------


def test_catalog_links_is_never_ambiguous_two_materials_one_row():
    """Each hsp-polymers.csv key referenced by CATALOG_LINKS must be used by
    exactly one material slug -- otherwise the mapping is self-contradictory."""
    keys = list(CATALOG_LINKS.values())
    assert len(keys) == len(set(keys))


def test_catalog_links_covers_the_reviewed_materials():
    assert CATALOG_LINKS == {
        "pvc": "vipla-kr-pvc",
        "ps": "polystyrene-lg",
        "pet": "r-pet",
        "hdpe": "hdpe",
        "pp": "pp",
        "pmma": "r-pmma",
        "abs": "r-abs",
        "pc": "r-polycarbonate",
        "pa66": "r-pa66",
        "pa6": "pa6-cr",
        "pom": "r-pom-acetal",
        "ptfe": "ptfe-l80-cr",
    }


def test_validate_row_resolves_material_id_from_catalog_links():
    material_ids = {"pvc": 139}
    plan = validate_row(2, make_row(key="vipla-kr-pvc"), material_ids)
    assert plan.material_id == 139


def test_validate_row_raises_if_catalog_links_names_a_missing_material():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(key="vipla-kr-pvc"), {})
    assert "no material with that slug" in exc.value.message


def test_validate_row_leaves_material_id_none_for_unlinked_row():
    material_ids = {"pvc": 139}
    plan = validate_row(2, make_row(key="some-other-correlation"), material_ids)
    assert plan.material_id is None


# ---------------------------------------------------------------------------
# Source / source_document resolution -- MUST reuse import_solvents.py's row
# ---------------------------------------------------------------------------


def test_resolve_source_id_reuses_the_solvent_importers_source_row(db_conn):
    """The critical cross-script contract: both importers key off the same
    (title, edition) natural key, so Table A.1 and Table A.2 -- two
    appendices of the same physical book -- never produce two `source` rows."""
    from import_solvents import resolve_source_id as solvent_resolve_source_id

    solvent_source_id = solvent_resolve_source_id(db_conn)
    correlation_source_id = resolve_source_id(db_conn)
    assert solvent_source_id == correlation_source_id


def test_resolve_source_id_is_idempotent(db_conn):
    first = resolve_source_id(db_conn)
    second = resolve_source_id(db_conn)
    assert first == second


def test_resolve_source_document_id_is_idempotent(db_conn):
    source_id = resolve_source_id(db_conn)
    first = resolve_source_document_id(db_conn, source_id)
    second = resolve_source_document_id(db_conn, source_id)
    assert first == second


# ---------------------------------------------------------------------------
# upsert_correlation: insert then update by key, never duplicate
# ---------------------------------------------------------------------------


def test_upsert_correlation_inserts_then_updates_by_key(db_conn):
    plan = validate_row(2, make_row(), {})
    correlation_id, was_inserted = upsert_correlation(db_conn, plan)
    assert was_inserted is True

    with db_conn.cursor() as cur:
        cur.execute("SELECT name_raw, hansen_d, status FROM hsp_correlation WHERE id = %s;", (correlation_id,))
        name_raw, hansen_d, status = cur.fetchone()
    assert name_raw == "TEST CORRELATION"
    assert hansen_d == 16.0
    assert status == "published"

    updated_plan = validate_row(2, make_row(hansen_d="17.5"), {})
    second_id, was_inserted_again = upsert_correlation(db_conn, updated_plan)
    assert second_id == correlation_id
    assert was_inserted_again is False

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM hsp_correlation WHERE key = %s;", (TEST_KEY,))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT hansen_d FROM hsp_correlation WHERE id = %s;", (correlation_id,))
        assert cur.fetchone()[0] == 17.5


def test_upsert_correlation_sets_material_id_when_linked(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM material WHERE slug = 'pvc';")
        row = cur.fetchone()
    if row is None:
        pytest.skip("catalog material 'pvc' not present in this database")
    material_id = row[0]

    plan = validate_row(2, make_row(), {})
    plan.material_id = material_id
    correlation_id, _ = upsert_correlation(db_conn, plan)

    with db_conn.cursor() as cur:
        cur.execute("SELECT material_id FROM hsp_correlation WHERE id = %s;", (correlation_id,))
        assert cur.fetchone()[0] == material_id


def test_upsert_correlation_rejects_hansen_value_the_db_itself_bounds(db_conn):
    """Belt-and-suspenders: even if validate_row's mirror of the CHECK
    constraint were ever wrong, the DB's own constraint is the final
    backstop."""
    import psycopg

    plan = validate_row(2, make_row(), {})
    plan.hansen_d = 99.0  # bypass validate_row directly, hit the DB constraint
    with pytest.raises(psycopg.errors.CheckViolation):
        upsert_correlation(db_conn, plan)


def test_upsert_correlation_rejects_nonpositive_r0_the_db_itself_bounds(db_conn):
    import psycopg

    plan = validate_row(2, make_row(), {})
    plan.r0 = 0.0
    with pytest.raises(psycopg.errors.CheckViolation):
        upsert_correlation(db_conn, plan)


# ---------------------------------------------------------------------------
# Citation + evidence: every correlation gets a page-locatored citation
# ---------------------------------------------------------------------------


def test_insert_citation_and_evidence_creates_a_page_locator(db_conn):
    plan = validate_row(2, make_row(), {})
    correlation_id, _ = upsert_correlation(db_conn, plan)
    source_id = resolve_source_id(db_conn)
    doc_id = resolve_source_document_id(db_conn, source_id)

    insert_citation_and_evidence(db_conn, correlation_id, plan, doc_id)

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.locator, e.role, e.extraction_method, e.subject_type, e.subject_id
              FROM evidence e JOIN citation c ON c.id = e.citation_id
             WHERE e.subject_type = 'hsp_correlation' AND e.subject_id = %s;
            """,
            (correlation_id,),
        )
        rows = cur.fetchall()
    assert len(rows) == 1
    locator, role, extraction_method, subject_type, subject_id = rows[0]
    assert locator == {"page": 500, "table": "A.2"}
    assert role == "primary"
    assert extraction_method == "table_parser"
    assert subject_type == "hsp_correlation"
    assert subject_id == correlation_id


def test_insert_citation_and_evidence_omits_page_key_when_page_unknown(db_conn):
    plan = validate_row(2, make_row(page=""), {})
    correlation_id, _ = upsert_correlation(db_conn, plan)
    source_id = resolve_source_id(db_conn)
    doc_id = resolve_source_document_id(db_conn, source_id)

    insert_citation_and_evidence(db_conn, correlation_id, plan, doc_id)

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.locator FROM evidence e JOIN citation c ON c.id = e.citation_id
             WHERE e.subject_type = 'hsp_correlation' AND e.subject_id = %s;
            """,
            (correlation_id,),
        )
        (locator,) = cur.fetchone()
    assert locator == {"table": "A.2"}


def test_every_correlation_written_has_evidence(db_conn):
    plan = validate_row(2, make_row(), {})
    correlation_id, _ = upsert_correlation(db_conn, plan)
    source_id = resolve_source_id(db_conn)
    doc_id = resolve_source_document_id(db_conn, source_id)
    insert_citation_and_evidence(db_conn, correlation_id, plan, doc_id)

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) FROM hsp_correlation h
             WHERE h.id = %s
               AND NOT EXISTS (
                   SELECT 1 FROM evidence e
                    WHERE e.subject_type = 'hsp_correlation' AND e.subject_id = h.id
               );
            """,
            (correlation_id,),
        )
        assert cur.fetchone()[0] == 0
