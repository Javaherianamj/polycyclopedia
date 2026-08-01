"""End-to-end tests for the curation CSV workflow.

These drive the real CLI entry points against the real database, because the
value of this tooling is almost entirely in whether it talks to Postgres
correctly. Mocking the database would test the mock.

Every test that writes restores the database afterwards (see the `clean_db`
fixture), so the suite is safe to run against the seeded development database
and leaves no fabricated citations behind.

That last point is not incidental. An earlier build of this tool was tested by
importing a citation to "Polymer Handbook, page 45" and leaving it in the
database -- a completely invented page number sitting in a table whose entire
purpose is verifiable provenance. Tests here use obviously-fake source titles
and clean up after themselves.
"""

from __future__ import annotations

import csv
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import (  # noqa: E402
    GAPS_FIELDNAMES,
    SOURCES_FIELDNAMES,
    get_connection,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
CURATION_DIR = REPO_ROOT / "tools" / "curation"
PYTHON = sys.executable

TEST_SOURCE_KEY = "__test_source__"
TEST_SOURCE_TITLE = "__test_source__ Fictional Reference For Tests"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def conn():
    c = get_connection()
    yield c
    c.close()


@pytest.fixture
def clean_db():
    """Snapshot the citation-related state, then restore it after the test.

    Deletes anything the test created (matched via the test source title) and
    resets any property_value the test published back to 'unsourced'.
    """
    yield
    c = get_connection()
    try:
        with c.cursor() as cur:
            cur.execute(
                """
                DELETE FROM evidence WHERE citation_id IN (
                    SELECT ct.id FROM citation ct
                    JOIN source_document sd ON sd.id = ct.source_document_id
                    JOIN source s ON s.id = sd.source_id
                    WHERE s.title LIKE '\\_\\_test\\_%'
                )
                """
            )
            cur.execute(
                """
                DELETE FROM citation WHERE source_document_id IN (
                    SELECT sd.id FROM source_document sd
                    JOIN source s ON s.id = sd.source_id
                    WHERE s.title LIKE '\\_\\_test\\_%'
                )
                """
            )
            cur.execute(
                "DELETE FROM source_document WHERE source_id IN "
                "(SELECT id FROM source WHERE title LIKE '\\_\\_test\\_%')"
            )
            cur.execute("DELETE FROM source WHERE title LIKE '\\_\\_test\\_%'")
            # Undo any supersede. Order matters: the replacement row is still
            # referenced by the original's superseded_by FK, so the pointer has
            # to be cleared before the row it points at can be deleted.
            cur.execute(
                "SELECT array_agg(superseded_by) FROM property_value "
                "WHERE superseded_by IS NOT NULL"
            )
            replacement_ids = cur.fetchone()[0] or []
            cur.execute(
                "UPDATE property_value SET superseded_by = NULL WHERE superseded_by IS NOT NULL"
            )
            if replacement_ids:
                cur.execute(
                    "DELETE FROM evidence WHERE property_value_id = ANY(%s)",
                    (replacement_ids,),
                )
                cur.execute(
                    "DELETE FROM property_value WHERE id = ANY(%s)", (replacement_ids,)
                )
            cur.execute(
                "UPDATE property_value SET status = 'unsourced' "
                "WHERE status IN ('published', 'superseded') "
                "AND id NOT IN (SELECT property_value_id FROM evidence)"
            )
        c.commit()
    finally:
        c.close()


@pytest.fixture
def workdir(tmp_path):
    """An isolated curation directory so tests never touch the real gaps.csv."""
    d = tmp_path / "curation"
    d.mkdir()
    return d


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def write_gaps(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=GAPS_FIELDNAMES)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in GAPS_FIELDNAMES})


def write_sources(path: Path, extra: list[dict] | None = None) -> None:
    rows = [
        {
            "source_key": TEST_SOURCE_KEY,
            "title": TEST_SOURCE_TITLE,
            "authors": "Nobody",
            "publisher": "Nowhere",
            "edition": "1st",
            "year": "2000",
            "isbn": "",
            "doi": "",
            "url": "",
            "kind": "handbook",
            "tier": "peer_reviewed_handbook",
        }
    ]
    rows.extend(extra or [])
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=SOURCES_FIELDNAMES)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in SOURCES_FIELDNAMES})


def gap_row(**kw) -> dict:
    base = {"material_slug": "ldpe", "property_key": "density", "unit": "g/cm³"}
    base.update(kw)
    return base


def run_import(workdir: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [PYTHON, str(CURATION_DIR / "import_values.py"),
         "--gaps-csv", str(workdir / "gaps.csv"),
         "--sources-csv", str(workdir / "sources.csv"), *args],
        capture_output=True, text=True, cwd=str(REPO_ROOT),
    )


def run_export(workdir: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [PYTHON, str(CURATION_DIR / "export_gaps.py"),
         "--gaps-csv", str(workdir / "gaps.csv"),
         "--sources-csv", str(workdir / "sources.csv"), *args],
        capture_output=True, text=True, cwd=str(REPO_ROOT),
    )


def count(conn, sql: str) -> int:
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchone()[0]


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------


def test_export_produces_rows_with_no_curator_data_prefilled(workdir):
    """The curator's columns must come back empty.

    A pre-filled source_key or page in an exported worksheet is an invented
    citation waiting to be imported by someone who assumes it was checked.
    """
    r = run_export(workdir, "--material", "ldpe")
    assert r.returncode == 0, r.stderr

    rows = list(csv.DictReader((workdir / "gaps.csv").open(encoding="utf-8-sig")))
    assert len(rows) == 54, f"expected 54 LDPE gaps, got {len(rows)}"

    curator_fields = ["value_min", "value_max", "value_typical", "qualifier",
                      "source_key", "page", "table", "figure", "section"]
    for i, row in enumerate(rows, start=2):
        filled = {f: row[f] for f in curator_fields if row.get(f)}
        assert not filled, f"row {i} has pre-filled curator data: {filled}"


def test_export_is_utf8_bom_so_excel_shows_persian(workdir):
    run_export(workdir, "--material", "ldpe")
    raw = (workdir / "gaps.csv").read_bytes()
    assert raw.startswith(b"\xef\xbb\xbf"), "missing BOM; Excel will mangle Persian text"
    assert "چگالی" in raw.decode("utf-8-sig")


# ---------------------------------------------------------------------------
# Validation -- each rule rejects, with a message a non-programmer can act on
# ---------------------------------------------------------------------------


def test_missing_locator_is_rejected_readably(workdir, clean_db):
    """V5. Must be caught in validation, not surface as a DB constraint error."""
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode != 0
    out = r.stdout + r.stderr
    assert "locator" in out.lower()
    assert "page" in out.lower()
    # The raw constraint name must never reach the curator.
    assert "citation_locator" not in out
    assert "CheckViolation" not in out


def test_implausible_value_is_rejected_with_unit_hint(workdir, clean_db):
    """V4. 920 kg/m³ entered where g/cm³ was expected -- the classic 1000x slip."""
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="920", value_max="925", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode != 0
    assert "plausible" in (r.stdout + r.stderr).lower()


def test_inverted_range_is_rejected(workdir, clean_db):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.925", value_max="0.910", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode != 0
    assert "inverted" in (r.stdout + r.stderr).lower() or "greater than" in (r.stdout + r.stderr).lower()


def test_unknown_source_key_is_rejected(workdir, clean_db):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key="no-such-source", page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode != 0
    assert "no-such-source" in (r.stdout + r.stderr)


def test_blank_rows_are_ignored(workdir, clean_db):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [gap_row(), gap_row(property_key="tg", unit="°C")])
    r = run_import(workdir, "--dry-run")
    assert r.returncode == 0, r.stdout + r.stderr
    assert "blank" in (r.stdout + r.stderr).lower()


# ---------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------


def test_dry_run_writes_nothing(workdir, conn, clean_db):
    before = count(conn, "SELECT count(*) FROM citation")
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode == 0, r.stdout + r.stderr
    assert count(conn, "SELECT count(*) FROM citation") == before


def test_import_builds_the_full_citation_chain(workdir, conn, clean_db):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925",
                source_key=TEST_SOURCE_KEY, page="45", note_en="Test note."),
    ])
    r = run_import(workdir)
    assert r.returncode == 0, r.stdout + r.stderr

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pv.value_min, pv.value_max, pv.status, s.title,
                   ct.locator->>'page', e.role, e.extraction_method
            FROM property_value pv
            JOIN property_definition pd ON pd.id = pv.property_id
            JOIN material m ON m.id = pv.subject_id AND pv.subject_type = 'material'
            JOIN evidence e ON e.property_value_id = pv.id
            JOIN citation ct ON ct.id = e.citation_id
            JOIN source_document sd ON sd.id = ct.source_document_id
            JOIN source s ON s.id = sd.source_id
            WHERE m.slug = 'ldpe' AND pd.key = 'density'
            """
        )
        row = cur.fetchone()

    assert row is not None, "no citation chain was created"
    vmin, vmax, status, title, page, role, method = row
    assert (float(vmin), float(vmax)) == (0.910, 0.925)
    assert status == "published"
    assert title == TEST_SOURCE_TITLE
    assert page == "45"
    assert role == "primary"
    assert method == "manual"


def test_import_moves_value_out_of_the_unsourced_worklist(workdir, conn, clean_db):
    before = count(conn, "SELECT count(*) FROM v_unsourced_values")
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    assert run_import(workdir).returncode == 0
    assert count(conn, "SELECT count(*) FROM v_unsourced_values") == before - 1


def test_new_source_row_is_created_once_not_duplicated(workdir, conn, clean_db):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
        gap_row(property_key="tg", unit="°C", value_typical="-110",
                source_key=TEST_SOURCE_KEY, page="52"),
    ])
    assert run_import(workdir).returncode == 0
    assert count(conn, f"SELECT count(*) FROM source WHERE title = '{TEST_SOURCE_TITLE}'") == 1


def test_one_bad_row_rolls_back_the_whole_file(workdir, conn, clean_db):
    """All-or-nothing. A half-applied import is worse than none, because the
    curator cannot tell which half landed."""
    before_citations = count(conn, "SELECT count(*) FROM citation")
    before_unsourced = count(conn, "SELECT count(*) FROM v_unsourced_values")

    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
        gap_row(property_key="tg", unit="°C", value_typical="-110",
                source_key=TEST_SOURCE_KEY),  # no locator -> rejected
    ])
    r = run_import(workdir)
    assert r.returncode != 0

    assert count(conn, "SELECT count(*) FROM citation") == before_citations
    assert count(conn, "SELECT count(*) FROM v_unsourced_values") == before_unsourced


def test_persian_notes_round_trip(workdir, conn, clean_db):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY,
                page="45", note_fa="یادداشت آزمایشی"),
    ])
    assert run_import(workdir).returncode == 0
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pv.note_fa FROM property_value pv
            JOIN property_definition pd ON pd.id = pv.property_id
            JOIN material m ON m.id = pv.subject_id AND pv.subject_type = 'material'
            WHERE m.slug = 'ldpe' AND pd.key = 'density' AND pv.note_fa IS NOT NULL
            """
        )
        row = cur.fetchone()
    assert row is not None and row[0] == "یادداشت آزمایشی"


def test_reciting_an_existing_value_supersedes_rather_than_overwrites(workdir, conn, clean_db):
    """FR-7.1: history is never destroyed."""
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    assert run_import(workdir).returncode == 0

    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.915", value_max="0.930", source_key=TEST_SOURCE_KEY, page="46"),
    ])
    r = run_import(workdir)
    assert r.returncode == 0, r.stdout + r.stderr

    assert count(conn, "SELECT count(*) FROM property_value WHERE superseded_by IS NOT NULL") >= 1
