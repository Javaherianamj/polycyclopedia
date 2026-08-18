"""Database-backed tests for import_solvents.py, run against the live
polypedia-pg database as the polypedia_app role.

Same strategy as test_import_materials.py / test_integration.py: direct
function calls against the `db_conn` fixture, always rolled back in
teardown -- nothing here is ever committed. Test solvents use an
unmistakable "zz-test-..." key prefix (solvent.key has no format
constraint, but the convention makes a row that somehow leaked past
rollback impossible to mistake for real data).
"""
from __future__ import annotations

import pytest

from import_solvents import (
    RowError,
    insert_citation_and_evidence,
    resolve_source_document_id,
    resolve_source_id,
    upsert_solvent,
    validate_row,
)

TEST_KEY = "zz-test-solvent"


def make_row(**overrides) -> dict:
    row = {
        "key": TEST_KEY,
        "name_en": "Test Solvent",
        "systematic_name": "Test Systematic Name",
        "cas_number": "",
        "hansen_d": "16.0",
        "hansen_p": "8.0",
        "hansen_h": "5.0",
        "molar_volume": "90.0",
        "book_no": "9999",
        "page": "400",
    }
    row.update(overrides)
    return row


# ---------------------------------------------------------------------------
# validate_row: the CHECK-constraint mirror
# ---------------------------------------------------------------------------


def test_validate_row_accepts_a_well_formed_row():
    plan = validate_row(2, make_row())
    assert plan.key == TEST_KEY
    assert plan.name_en == "Test Solvent"
    assert plan.hansen_d == 16.0
    assert plan.molar_volume == 90.0
    assert plan.page == 400


def test_validate_row_allows_null_molar_volume():
    plan = validate_row(2, make_row(molar_volume=""))
    assert plan.molar_volume is None


@pytest.mark.parametrize("field,value", [("hansen_d", "-1"), ("hansen_p", "61"), ("hansen_h", "100")])
def test_validate_row_rejects_out_of_bounds_hansen_values(field, value):
    """Mirrors solvent_hansen_plausible_chk / solvent_hansen_nonneg_chk --
    the task's explicit instruction is to reject bad rows, never widen the
    DB constraint to make them fit."""
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(**{field: value}))
    assert field in exc.value.message
    assert TEST_KEY in exc.value.render()


def test_validate_row_rejects_out_of_bounds_molar_volume():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(molar_volume="5000"))
    assert "molar_volume" in exc.value.message


def test_validate_row_rejects_missing_key():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(key=""))
    assert "key" in exc.value.message


def test_validate_row_rejects_missing_name():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(name_en=""))
    assert "name_en" in exc.value.message


def test_validate_row_rejects_non_numeric_hansen_value():
    with pytest.raises(RowError) as exc:
        validate_row(2, make_row(hansen_d="not-a-number"))
    assert "hansen_d" in exc.value.message


# ---------------------------------------------------------------------------
# Source / source_document resolution (idempotent by natural key)
# ---------------------------------------------------------------------------


def test_resolve_source_id_is_idempotent(db_conn):
    first = resolve_source_id(db_conn)
    second = resolve_source_id(db_conn)
    assert first == second

    with db_conn.cursor() as cur:
        cur.execute("SELECT kind, tier, title, edition, year, isbn FROM source WHERE id = %s;", (first,))
        kind, tier, title, edition, year, isbn = cur.fetchone()
    assert kind == "handbook"
    assert tier == "peer_reviewed_handbook"
    assert title == "Hansen Solubility Parameters: A User's Handbook"
    assert edition == "2nd"
    assert year == 2007
    assert isbn == "978-0-8493-7248-3"


def test_resolve_source_document_id_is_idempotent(db_conn):
    source_id = resolve_source_id(db_conn)
    first = resolve_source_document_id(db_conn, source_id)
    second = resolve_source_document_id(db_conn, source_id)
    assert first == second


# ---------------------------------------------------------------------------
# upsert_solvent: insert then update by key, never duplicate
# ---------------------------------------------------------------------------


def test_upsert_solvent_inserts_then_updates_by_key(db_conn):
    plan = validate_row(2, make_row())
    solvent_id, was_inserted = upsert_solvent(db_conn, plan)
    assert was_inserted is True

    with db_conn.cursor() as cur:
        cur.execute("SELECT name_en, hansen_d, status FROM solvent WHERE id = %s;", (solvent_id,))
        name_en, hansen_d, status = cur.fetchone()
    assert name_en == "Test Solvent"
    assert hansen_d == 16.0
    assert status == "published"

    # Re-running with a corrected value updates the same row in place --
    # this is the idempotency contract: a second run of the importer must
    # never create a second 'zz-test-solvent' row.
    updated_plan = validate_row(2, make_row(hansen_d="17.5"))
    second_id, was_inserted_again = upsert_solvent(db_conn, updated_plan)
    assert second_id == solvent_id
    assert was_inserted_again is False

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM solvent WHERE key = %s;", (TEST_KEY,))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT hansen_d FROM solvent WHERE id = %s;", (solvent_id,))
        assert cur.fetchone()[0] == 17.5


def test_upsert_solvent_rejects_hansen_value_the_db_itself_bounds(db_conn):
    """Belt-and-suspenders: even if validate_row's mirror of the CHECK
    constraint were ever wrong, the DB's own constraint is the final
    backstop, per the task's explicit instruction not to trust the parser
    alone."""
    import psycopg

    plan = validate_row(2, make_row())
    plan.hansen_d = 99.0  # bypass validate_row directly, hit the DB constraint
    with pytest.raises(psycopg.errors.CheckViolation):
        upsert_solvent(db_conn, plan)


# ---------------------------------------------------------------------------
# Citation + evidence: every solvent gets a page-locatored citation
# ---------------------------------------------------------------------------


def test_insert_citation_and_evidence_creates_a_page_locator(db_conn):
    plan = validate_row(2, make_row())
    solvent_id, _ = upsert_solvent(db_conn, plan)
    source_id = resolve_source_id(db_conn)
    doc_id = resolve_source_document_id(db_conn, source_id)

    insert_citation_and_evidence(db_conn, solvent_id, plan, doc_id)

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.locator, e.role, e.extraction_method, e.subject_type, e.subject_id
              FROM evidence e JOIN citation c ON c.id = e.citation_id
             WHERE e.subject_type = 'solvent' AND e.subject_id = %s;
            """,
            (solvent_id,),
        )
        rows = cur.fetchall()
    assert len(rows) == 1
    locator, role, extraction_method, subject_type, subject_id = rows[0]
    assert locator == {"page": 400, "table": "A.1"}
    assert role == "primary"
    assert extraction_method == "table_parser"
    assert subject_type == "solvent"
    assert subject_id == solvent_id


def test_insert_citation_and_evidence_omits_page_key_when_page_unknown(db_conn):
    plan = validate_row(2, make_row(page=""))
    solvent_id, _ = upsert_solvent(db_conn, plan)
    source_id = resolve_source_id(db_conn)
    doc_id = resolve_source_document_id(db_conn, source_id)

    insert_citation_and_evidence(db_conn, solvent_id, plan, doc_id)

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.locator FROM evidence e JOIN citation c ON c.id = e.citation_id
             WHERE e.subject_type = 'solvent' AND e.subject_id = %s;
            """,
            (solvent_id,),
        )
        (locator,) = cur.fetchone()
    # citation_locator_present_chk requires at least one of page/table/
    # figure/section -- 'table' alone must still satisfy it.
    assert locator == {"table": "A.1"}


def test_every_solvent_written_has_evidence(db_conn):
    """The exact query the task specifies as the acceptance check, run
    against a row this test creates and cites itself."""
    plan = validate_row(2, make_row())
    solvent_id, _ = upsert_solvent(db_conn, plan)
    source_id = resolve_source_id(db_conn)
    doc_id = resolve_source_document_id(db_conn, source_id)
    insert_citation_and_evidence(db_conn, solvent_id, plan, doc_id)

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) FROM solvent s
             WHERE s.id = %s
               AND NOT EXISTS (
                   SELECT 1 FROM evidence e
                    WHERE e.subject_type = 'solvent' AND e.subject_id = s.id
               );
            """,
            (solvent_id,),
        )
        assert cur.fetchone()[0] == 0
