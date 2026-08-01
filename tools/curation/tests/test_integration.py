"""Database-backed tests: what import_values.py actually writes, run
against the live polypedia-pg database as the polypedia_app role (same
connection settings as the real tools).

Two testing strategies are used, chosen per test:

1. Direct function calls (validate_row / execute_plan / load_live_values)
   against a connection the test owns via the `db_conn` fixture, which is
   always rolled back in teardown. This is how most tests here work --
   fast, and cleanup is unconditional.

2. Full subprocess invocations of import_values.py / export_gaps.py, for
   the couple of tests that need to exercise main()'s own orchestration
   (argument parsing, the dry-run / error-report code paths, stdout
   formatting). These are only ever used in scenarios that provably never
   commit -- a --dry-run flag, or a CSV engineered so every row fails
   validation before any write is attempted -- so no cleanup is needed
   there either. See each test's docstring for which path it's on.

Uses real seeded data (ldpe/hdpe, the 10 seeded sources, 28 test methods)
already in the database rather than fabricating a throwaway material,
since materials aren't cheap to construct outside the ETL pipeline. Never
commits anything -- see strategy 1/2 above.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import psycopg
import pytest

from common import get_connection
from export_gaps import export_gaps, export_sources
from import_values import (
    LOCATOR_FIELDS,
    execute_plan,
    load_existing_sources,
    load_live_values,
    load_source_documents,
    load_test_methods,
    validate_row,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
TOOLS_CURATION = Path(__file__).resolve().parents[1]
PYTHON = sys.executable  # tests already run inside tools/etl/.venv
TEST_SOURCE_TITLE = "__test_source__"


def make_gaps_row(material_slug, property_key, **overrides):
    row = {
        "material_slug": material_slug,
        "property_key": property_key,
        "value_min": "",
        "value_max": "",
        "value_typical": "",
        "qualifier": "",
        "source_key": "",
        "page": "",
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


def pick_unsourced(conn, material_slug="ldpe"):
    """Grabs one currently-unsourced (material, property) pair to use as a
    test fixture. Whatever this returns gets superseded/updated inside a
    transaction the test rolls back, so it's safe to use real seeded rows.
    """
    live_values = load_live_values(conn)
    candidates = [k for k, v in live_values.items() if k[0] == material_slug]
    assert candidates, f"expected at least one live value for {material_slug}"
    return candidates[0]


def new_test_source_row(kind="handbook", tier="peer_reviewed_handbook"):
    return {
        "source_key": "test-source-key",
        "title": TEST_SOURCE_TITLE,
        "authors": "",
        "publisher": "",
        "edition": "",
        "year": "",
        "isbn": "",
        "doi": "",
        "url": "",
        "kind": kind,
        "tier": tier,
    }


# ---------------------------------------------------------------------------
# Status transition + coverage view
# ---------------------------------------------------------------------------


def test_status_transition_unsourced_to_published(db_conn):
    material_slug, property_key = pick_unsourced(db_conn)
    live_values = load_live_values(db_conn)
    sources_by_key = {"polymer-handbook-4e": {"title": "Polymer Handbook", "kind": "handbook", "tier": "peer_reviewed_handbook"}}
    test_methods = load_test_methods(db_conn)

    row = make_gaps_row(material_slug, property_key, source_key="polymer-handbook-4e", page="45")
    plan = validate_row(2, row, live_values, sources_by_key, {}, test_methods)

    with db_conn.cursor() as cur:
        cur.execute("SELECT status FROM property_value WHERE id = %s;", (plan.live.pv_id,))
        assert cur.fetchone()[0] == "unsourced"

    execute_plan(db_conn, [plan])

    with db_conn.cursor() as cur:
        cur.execute("SELECT status FROM property_value WHERE id = %s;", (plan.live.pv_id,))
        assert cur.fetchone()[0] == "published"


def test_coverage_view_reflects_new_citation(db_conn):
    material_slug, property_key = pick_unsourced(db_conn)
    live_values = load_live_values(db_conn)
    sources_by_key = {"polymer-handbook-4e": {"title": "Polymer Handbook", "kind": "handbook", "tier": "peer_reviewed_handbook"}}
    test_methods = load_test_methods(db_conn)

    with db_conn.cursor() as cur:
        cur.execute("SELECT cited_values FROM v_citation_coverage WHERE material_slug = %s;", (material_slug,))
        before = cur.fetchone()[0]

    row = make_gaps_row(material_slug, property_key, source_key="polymer-handbook-4e", page="45")
    plan = validate_row(2, row, live_values, sources_by_key, {}, test_methods)
    execute_plan(db_conn, [plan])

    with db_conn.cursor() as cur:
        cur.execute("SELECT cited_values FROM v_citation_coverage WHERE material_slug = %s;", (material_slug,))
        after = cur.fetchone()[0]

    assert after == before + 1


# ---------------------------------------------------------------------------
# New source creation
# ---------------------------------------------------------------------------


def test_new_source_creates_source_and_document_and_citation(db_conn):
    material_slug, property_key = pick_unsourced(db_conn)
    live_values = load_live_values(db_conn)
    sources_by_key = {"test-source-key": new_test_source_row()}
    test_methods = load_test_methods(db_conn)

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM source WHERE title = %s;", (TEST_SOURCE_TITLE,))
        assert cur.fetchone()[0] == 0

    row = make_gaps_row(material_slug, property_key, source_key="test-source-key", page="1")
    plan = validate_row(2, row, live_values, sources_by_key, {}, test_methods)
    execute_plan(db_conn, [plan])

    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM source WHERE title = %s;", (TEST_SOURCE_TITLE,))
        source_row = cur.fetchone()
        assert source_row is not None
        source_id = source_row[0]

        cur.execute("SELECT id FROM source_document WHERE source_id = %s AND storage_key IS NULL;", (source_id,))
        doc_row = cur.fetchone()
        assert doc_row is not None

        cur.execute(
            "SELECT locator FROM citation WHERE source_document_id = %s;",
            (doc_row[0],),
        )
        citation_row = cur.fetchone()
        assert citation_row is not None
        assert citation_row[0] == {"page": "1"}


def test_new_source_reused_across_rows_in_same_run(db_conn):
    """Two rows citing the same new source_key should create exactly one
    source and one source_document, not one per row."""
    live_values = load_live_values(db_conn)
    ldpe_candidates = [k for k in live_values if k[0] == "ldpe"]
    assert len(ldpe_candidates) >= 2
    (m1, p1), (m2, p2) = ldpe_candidates[0], ldpe_candidates[1]

    sources_by_key = {"test-source-key": new_test_source_row()}
    test_methods = load_test_methods(db_conn)

    plans = [
        validate_row(2, make_gaps_row(m1, p1, source_key="test-source-key", page="1"), live_values, sources_by_key, {}, test_methods),
        validate_row(3, make_gaps_row(m2, p2, source_key="test-source-key", page="2"), live_values, sources_by_key, {}, test_methods),
    ]
    execute_plan(db_conn, plans)

    with db_conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM source WHERE title = %s;", (TEST_SOURCE_TITLE,))
        assert cur.fetchone()[0] == 1
        cur.execute(
            "SELECT count(*) FROM source_document sd JOIN source s ON s.id = sd.source_id WHERE s.title = %s;",
            (TEST_SOURCE_TITLE,),
        )
        assert cur.fetchone()[0] == 1


# ---------------------------------------------------------------------------
# Supersede, not overwrite (FR-7.1)
# ---------------------------------------------------------------------------


def test_supersede_on_recitation(db_conn):
    material_slug, property_key = pick_unsourced(db_conn)
    sources_by_key = {"polymer-handbook-4e": {"title": "Polymer Handbook", "kind": "handbook", "tier": "peer_reviewed_handbook"}}
    test_methods = load_test_methods(db_conn)

    live_values = load_live_values(db_conn)
    row1 = make_gaps_row(material_slug, property_key, source_key="polymer-handbook-4e", page="10")
    plan1 = validate_row(2, row1, live_values, sources_by_key, {}, test_methods)
    original_pv_id = plan1.live.pv_id
    execute_plan(db_conn, [plan1])

    # Re-load: has_evidence should now be true for this pair, which is what
    # routes the second citation onto the supersede path instead of another
    # in-place update.
    live_values_2 = load_live_values(db_conn)
    assert live_values_2[(material_slug, property_key)].has_evidence is True

    row2 = make_gaps_row(material_slug, property_key, source_key="polymer-handbook-4e", page="99")
    plan2 = validate_row(3, row2, live_values_2, sources_by_key, {}, test_methods)
    execute_plan(db_conn, [plan2])

    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT id, status, superseded_by FROM property_value WHERE id = %s;",
            (original_pv_id,),
        )
        old_id, old_status, superseded_by = cur.fetchone()
        assert old_status == "superseded"
        assert superseded_by is not None

        cur.execute(
            "SELECT id, status, superseded_by FROM property_value WHERE id = %s;",
            (superseded_by,),
        )
        new_id, new_status, new_superseded_by = cur.fetchone()
        assert new_status == "published"
        assert new_superseded_by is None
        assert new_id != old_id

        # History is never destroyed: the original evidence/citation for
        # the old row must still exist, untouched.
        cur.execute("SELECT count(*) FROM evidence WHERE property_value_id = %s;", (old_id,))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM evidence WHERE property_value_id = %s;", (new_id,))
        assert cur.fetchone()[0] == 1


# ---------------------------------------------------------------------------
# Missing locator: readable error, and the DB constraint as the backstop
# ---------------------------------------------------------------------------


def test_missing_locator_rejected_before_reaching_the_database(db_conn):
    """The importer must never let a missing-locator row reach Postgres at
    all -- V5 catches it first with a plain-language message."""
    material_slug, property_key = pick_unsourced(db_conn)
    live_values = load_live_values(db_conn)
    sources_by_key = {"polymer-handbook-4e": {"title": "Polymer Handbook", "kind": "handbook", "tier": "peer_reviewed_handbook"}}

    row = make_gaps_row(material_slug, property_key, source_key="polymer-handbook-4e")  # no locator
    from import_values import RowError

    with pytest.raises(RowError) as exc:
        validate_row(2, row, live_values, sources_by_key, {}, {})
    message = exc.value.render()
    assert "Row 2" in message
    assert "page, table, figure, or section" in message
    assert "citation_locator_present_chk" not in message
    assert "psycopg" not in message.lower()


def test_database_check_constraint_is_still_the_real_backstop(db_conn):
    """Confirms the CHECK constraint on citation.locator is still live and
    would reject an empty locator on its own -- the importer's job is to
    catch this earlier with a better message, not to weaken or route around
    the constraint (see the task's own constraints)."""
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM source_document LIMIT 1;")
        row = cur.fetchone()
        if row is None:
            cur.execute(
                "INSERT INTO source_document (source_id, storage_key) VALUES ((SELECT id FROM source LIMIT 1), NULL) RETURNING id;"
            )
            row = cur.fetchone()
        doc_id = row[0]

        with pytest.raises(psycopg.errors.CheckViolation):
            cur.execute(
                "INSERT INTO citation (source_document_id, locator) VALUES (%s, %s);",
                (doc_id, json.dumps({})),
            )
    db_conn.rollback()


# ---------------------------------------------------------------------------
# Persian text round-trip
# ---------------------------------------------------------------------------


def test_persian_text_round_trips_through_csv(db_conn, tmp_path):
    gaps_path = tmp_path / "gaps.csv"
    sources_path = tmp_path / "sources.csv"
    export_gaps(db_conn, "ldpe", gaps_path)
    export_sources(db_conn, sources_path)

    import csv

    with gaps_path.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    persian_rows = [r for r in rows if r["property_name_fa"]]
    assert persian_rows, "expected at least one property with Persian context text"
    for r in persian_rows:
        # A mojibake failure shows up as replacement characters or Latin-1
        # reinterpretation garbage; neither should appear if the BOM/codec
        # round-trip worked.
        assert "�" not in r["property_name_fa"]
        # Should actually contain Persian script codepoints, not just
        # survive -- guards against an encoding bug that silently produces
        # empty/ascii-only strings instead of erroring.
        assert any("؀" <= ch <= "ۿ" for ch in r["property_name_fa"])


# ---------------------------------------------------------------------------
# Round-trip: export -> import with no curator edits -> no writes
# ---------------------------------------------------------------------------


def test_round_trip_no_edits_writes_nothing(tmp_path):
    """export_gaps.py then import_values.py --dry-run with zero curator
    edits: every row is blank, so nothing is even validated, let alone
    written. Runs the real CLI end-to-end via subprocess since this is
    about main()'s own row-classification behaviour.
    """
    gaps_path = tmp_path / "gaps.csv"
    sources_path = tmp_path / "sources.csv"

    export = subprocess.run(
        [PYTHON, str(TOOLS_CURATION / "export_gaps.py"), "--material", "hdpe",
         "--gaps-csv", str(gaps_path), "--sources-csv", str(sources_path)],
        cwd=TOOLS_CURATION, capture_output=True, text=True, timeout=30,
    )
    assert export.returncode == 0, export.stderr

    result = subprocess.run(
        [PYTHON, str(TOOLS_CURATION / "import_values.py"), "--dry-run",
         "--gaps-csv", str(gaps_path), "--sources-csv", str(sources_path)],
        cwd=TOOLS_CURATION, capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, result.stderr
    assert "0 rejected" in result.stdout
    assert "Nothing to import" in result.stdout


# ---------------------------------------------------------------------------
# Dry-run: same errors reported, nothing written
# ---------------------------------------------------------------------------


def test_dry_run_reports_same_error_and_writes_nothing(tmp_path):
    gaps_path = tmp_path / "gaps.csv"
    sources_path = tmp_path / "sources.csv"

    conn = get_connection()
    try:
        material_slug, property_key = pick_unsourced(conn)
    finally:
        conn.rollback()
        conn.close()

    export_conn = get_connection()
    try:
        export_gaps(export_conn, None, gaps_path)  # all materials
        export_sources(export_conn, sources_path)
    finally:
        export_conn.rollback()
        export_conn.close()

    import csv

    with gaps_path.open(encoding="utf-8-sig", newline="") as f:
        fieldnames = csv.DictReader(f).fieldnames
        f.seek(0)
        rows = list(csv.DictReader(f))
    for r in rows:
        if r["material_slug"] == material_slug and r["property_key"] == property_key:
            r["source_key"] = "polymer-handbook-4e"
            # Deliberately no locator -> V5 failure.
            break
    with gaps_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    dry = subprocess.run(
        [PYTHON, str(TOOLS_CURATION / "import_values.py"), "--dry-run",
         "--gaps-csv", str(gaps_path), "--sources-csv", str(sources_path)],
        cwd=TOOLS_CURATION, capture_output=True, text=True, timeout=30,
    )
    real = subprocess.run(
        [PYTHON, str(TOOLS_CURATION / "import_values.py"),
         "--gaps-csv", str(gaps_path), "--sources-csv", str(sources_path)],
        cwd=TOOLS_CURATION, capture_output=True, text=True, timeout=30,
    )

    assert dry.returncode == 1
    assert real.returncode == 1
    assert "no citation locator given" in dry.stdout
    assert "no citation locator given" in real.stdout

    # Confirm nothing was written by the "real" run either -- the row is
    # still unsourced.
    check_conn = get_connection()
    try:
        with check_conn.cursor() as cur:
            cur.execute(
                """
                SELECT pv.status FROM property_value pv
                JOIN material m ON m.id = pv.subject_id AND pv.subject_type = 'material'
                JOIN property_definition pd ON pd.id = pv.property_id
                WHERE m.slug = %s AND pd.key = %s;
                """,
                (material_slug, property_key),
            )
            assert cur.fetchone()[0] == "unsourced"
    finally:
        check_conn.rollback()
        check_conn.close()


# ---------------------------------------------------------------------------
# Transactional: a bad row late in the file blocks the whole import
# ---------------------------------------------------------------------------


def test_late_bad_row_prevents_earlier_good_row_from_landing(tmp_path):
    """One invalid row anywhere in the file must stop the entire import --
    including rows before it that were individually valid. import_values.py
    achieves this by validating every row before writing any of them (an
    even stronger guarantee than "write then roll back on error": the
    database is never touched at all for a doomed file), which produces the
    same observable behaviour this test asserts.
    """
    conn = get_connection()
    try:
        live_values = load_live_values(conn)
    finally:
        conn.rollback()
        conn.close()

    ldpe_candidates = [k for k in live_values if k[0] == "ldpe"]
    assert len(ldpe_candidates) >= 2
    (good_material, good_property), (bad_material, bad_property) = ldpe_candidates[0], ldpe_candidates[1]

    gaps_path = tmp_path / "gaps.csv"
    sources_path = tmp_path / "sources.csv"

    export_conn = get_connection()
    try:
        export_gaps(export_conn, "ldpe", gaps_path)
        export_sources(export_conn, sources_path)
    finally:
        export_conn.rollback()
        export_conn.close()

    import csv

    with gaps_path.open(encoding="utf-8-sig", newline="") as f:
        fieldnames = csv.DictReader(f).fieldnames
        f.seek(0)
        rows = list(csv.DictReader(f))

    for r in rows:
        if r["material_slug"] == good_material and r["property_key"] == good_property:
            r["source_key"] = "polymer-handbook-4e"
            r["page"] = "1"
        if r["material_slug"] == bad_material and r["property_key"] == bad_property:
            r["source_key"] = "polymer-handbook-4e"
            # No locator -> this row fails V5, appears later in the file.
    with gaps_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    result = subprocess.run(
        [PYTHON, str(TOOLS_CURATION / "import_values.py"),
         "--gaps-csv", str(gaps_path), "--sources-csv", str(sources_path)],
        cwd=TOOLS_CURATION, capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 1
    assert "rejected -- nothing will be written" in result.stdout

    check_conn = get_connection()
    try:
        with check_conn.cursor() as cur:
            cur.execute(
                """
                SELECT pv.status FROM property_value pv
                JOIN material m ON m.id = pv.subject_id AND pv.subject_type = 'material'
                JOIN property_definition pd ON pd.id = pv.property_id
                WHERE m.slug = %s AND pd.key = %s;
                """,
                (good_material, good_property),
            )
            status = cur.fetchone()[0]
    finally:
        check_conn.rollback()
        check_conn.close()

    assert status == "unsourced", "the earlier, individually-valid row must not have been committed"
