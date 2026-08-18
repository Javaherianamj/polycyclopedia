"""End-to-end tests for the curation CSV workflow.

These drive the real CLI entry points against the real database, because the
value of this tooling is almost entirely in whether it talks to Postgres
correctly. Mocking the database would test the mock.

Tests that need to cite/re-cite a value do it against a dedicated, isolated
test material (`test_material` fixture below) rather than a real seeded
material. This is not incidental caution: an earlier version of this suite
used `ldpe`/`density` as its scratch pad on the assumption that no real
citation would ever exist there. Once real curation work published a real
citation for LDPE density, that assumption broke -- the suite's cleanup logic
(built to "put back whatever was unsourced before") could not distinguish its
own test writes from the real one, and it left the real citation's row
mismarked as `superseded` with an orphaned duplicate beside it. The fixture
below sidesteps the whole class of bug: the material does not exist before
the test and does not exist after it, so there is nothing for real data to
collide with, regardless of what has been cited by the time these tests run.

Tests that export or read real seeded data (the two `Export` tests below,
which intentionally exercise the actual `ldpe` material) compute their
expectations from the live database rather than hardcoding a row count or a
specific property's Persian name -- both of those are exactly the kind of
fact that legitimate curation work changes over time.
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

# Material slug is validated as lowercase-and-hyphens (see
# tests/test_import_materials.py), so this follows that file's "zz-test-"
# convention rather than the "__test_..." convention used for free-text
# fields like source titles elsewhere in this module.
TEST_MATERIAL_SLUG = "zz-test-curation-material"
TEST_MATERIAL_FIELD_KEY = "thermoplastics"
TEST_MATERIAL_FAMILY_KEY = "polyolefins"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def conn():
    c = get_connection()
    yield c
    c.close()


@pytest.fixture
def test_material():
    """A material that exists only for the duration of one test.

    Seeded with a single 'unsourced' density value (0.910-0.925), matching
    the shape the tests already assume -- so `gap_row()`'s default target is
    always available and always disposable, regardless of what real curation
    work has published elsewhere. Torn down completely afterward, including
    the material row itself.
    """
    c = get_connection()
    try:
        with c.cursor() as cur:
            cur.execute("SELECT id FROM field WHERE key = %s", (TEST_MATERIAL_FIELD_KEY,))
            field_id = cur.fetchone()[0]
            cur.execute("SELECT id FROM family WHERE key = %s", (TEST_MATERIAL_FAMILY_KEY,))
            family_id = cur.fetchone()[0]
            cur.execute(
                """
                INSERT INTO material (slug, field_id, family_id, name_fa, name_en, status)
                VALUES (%s, %s, %s, 'ماده آزمایشی', 'Test Material', 'draft')
                RETURNING id
                """,
                (TEST_MATERIAL_SLUG, field_id, family_id),
            )
            material_id = cur.fetchone()[0]

            cur.execute("SELECT id FROM property_definition WHERE key = 'density'")
            property_id = cur.fetchone()[0]
            cur.execute(
                """
                INSERT INTO property_value
                    (subject_type, subject_id, property_id, value_min, value_max, status)
                VALUES ('material', %s, %s, 0.910, 0.925, 'unsourced')
                """,
                (material_id, property_id),
            )
        c.commit()
    finally:
        c.close()

    yield TEST_MATERIAL_SLUG

    c = get_connection()
    try:
        with c.cursor() as cur:
            cur.execute("SELECT id FROM material WHERE slug = %s", (TEST_MATERIAL_SLUG,))
            row = cur.fetchone()
            if row is not None:
                material_id = row[0]
                cur.execute(
                    """
                    DELETE FROM evidence WHERE subject_type = 'property_value' AND subject_id IN (
                        SELECT id FROM property_value
                        WHERE subject_type = 'material' AND subject_id = %s
                    )
                    """,
                    (material_id,),
                )
                cur.execute(
                    "DELETE FROM property_value WHERE subject_type = 'material' AND subject_id = %s",
                    (material_id,),
                )
                cur.execute("DELETE FROM material_identifier WHERE material_id = %s", (material_id,))
                cur.execute("DELETE FROM material WHERE id = %s", (material_id,))
        c.commit()
    finally:
        c.close()


@pytest.fixture
def clean_db():
    """Removes any source/citation the test created, matched by the fake
    title prefix. Value-level state is the `test_material` fixture's job;
    this only ever needs to clean up bibliography rows, which are global
    and not scoped to a single material.
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
    base = {"material_slug": TEST_MATERIAL_SLUG, "property_key": "density", "unit": "g/cm³"}
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


def count(conn, sql: str, params: tuple = ()) -> int:
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()[0]


# ---------------------------------------------------------------------------
# Export -- against the real ldpe material, so expectations are computed
# from the live database rather than hardcoded, per the note at the top of
# this file.
# ---------------------------------------------------------------------------


def test_export_produces_rows_with_no_curator_data_prefilled(workdir, conn):
    """The curator's columns must come back empty.

    A pre-filled source_key or page in an exported worksheet is an invented
    citation waiting to be imported by someone who assumes it was checked.
    """
    expected_count = count(
        conn,
        """
        SELECT count(*) FROM v_unsourced_values uv
        JOIN material m ON m.id = uv.subject_id AND uv.subject_type = 'material'
        WHERE m.slug = 'ldpe'
        """,
    )

    r = run_export(workdir, "--material", "ldpe")
    assert r.returncode == 0, r.stderr

    rows = list(csv.DictReader((workdir / "gaps.csv").open(encoding="utf-8-sig")))
    assert len(rows) == expected_count, (
        f"expected {expected_count} LDPE gaps (per v_unsourced_values), got {len(rows)}"
    )

    curator_fields = ["value_min", "value_max", "value_typical", "qualifier",
                      "source_key", "page", "table", "figure", "section"]
    for i, row in enumerate(rows, start=2):
        filled = {f: row[f] for f in curator_fields if row.get(f)}
        assert not filled, f"row {i} has pre-filled curator data: {filled}"


def test_export_is_utf8_bom_so_excel_shows_persian(workdir, conn):
    # Any currently-unsourced LDPE property's Persian name will do -- this
    # must not hardcode a specific property, since which properties are
    # still unsourced is exactly what real curation work changes.
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pd.name_fa FROM v_unsourced_values uv
            JOIN material m ON m.id = uv.subject_id AND uv.subject_type = 'material'
            JOIN property_definition pd ON pd.id = uv.property_id
            WHERE m.slug = 'ldpe' AND pd.name_fa IS NOT NULL
            LIMIT 1
            """
        )
        row = cur.fetchone()
    assert row is not None, "ldpe has no unsourced property left to check Persian rendering against"
    persian_name = row[0]

    run_export(workdir, "--material", "ldpe")
    raw = (workdir / "gaps.csv").read_bytes()
    assert raw.startswith(b"\xef\xbb\xbf"), "missing BOM; Excel will mangle Persian text"
    assert persian_name in raw.decode("utf-8-sig")


# ---------------------------------------------------------------------------
# Validation -- each rule rejects, with a message a non-programmer can act on
# ---------------------------------------------------------------------------


def test_missing_locator_is_rejected_readably(workdir, clean_db, test_material):
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


def test_implausible_value_is_rejected_with_unit_hint(workdir, clean_db, test_material):
    """V4. 920 kg/m³ entered where g/cm³ was expected -- the classic 1000x slip."""
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="920", value_max="925", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode != 0
    assert "plausible" in (r.stdout + r.stderr).lower()


def test_inverted_range_is_rejected(workdir, clean_db, test_material):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.925", value_max="0.910", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode != 0
    assert "inverted" in (r.stdout + r.stderr).lower() or "greater than" in (r.stdout + r.stderr).lower()


def test_unknown_source_key_is_rejected(workdir, clean_db, test_material):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key="no-such-source", page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode != 0
    assert "no-such-source" in (r.stdout + r.stderr)


def test_blank_rows_are_ignored(workdir, clean_db, test_material):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [gap_row(), gap_row(property_key="tg", unit="°C")])
    r = run_import(workdir, "--dry-run")
    assert r.returncode == 0, r.stdout + r.stderr
    assert "blank" in (r.stdout + r.stderr).lower()


# ---------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------


def test_dry_run_writes_nothing(workdir, conn, clean_db, test_material):
    before = count(conn, "SELECT count(*) FROM citation")
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    r = run_import(workdir, "--dry-run")
    assert r.returncode == 0, r.stdout + r.stderr
    assert count(conn, "SELECT count(*) FROM citation") == before


def test_import_builds_the_full_citation_chain(workdir, conn, clean_db, test_material):
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
            JOIN evidence e ON e.subject_type = 'property_value' AND e.subject_id = pv.id
            JOIN citation ct ON ct.id = e.citation_id
            JOIN source_document sd ON sd.id = ct.source_document_id
            JOIN source s ON s.id = sd.source_id
            WHERE m.slug = %s AND pd.key = 'density'
            """,
            (test_material,),
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


def test_import_moves_value_out_of_the_unsourced_worklist(workdir, conn, clean_db, test_material):
    before = count(conn, "SELECT count(*) FROM v_unsourced_values")
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
    ])
    assert run_import(workdir).returncode == 0
    assert count(conn, "SELECT count(*) FROM v_unsourced_values") == before - 1


def test_new_source_row_is_created_once_not_duplicated(workdir, conn, clean_db, test_material):
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
        gap_row(property_key="tg", unit="°C", value_typical="-110",
                source_key=TEST_SOURCE_KEY, page="52"),
    ])
    assert run_import(workdir).returncode == 0
    assert count(conn, f"SELECT count(*) FROM source WHERE title = '{TEST_SOURCE_TITLE}'") == 1


def test_one_bad_row_does_not_block_a_good_row_in_the_same_file(workdir, conn, clean_db, test_material):
    """Rows are no longer all-or-nothing: a bad row is rejected and reported,
    but a good row elsewhere in the file still lands."""
    before_citations = count(conn, "SELECT count(*) FROM citation")

    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
        gap_row(property_key="tg", unit="°C", value_typical="-110",
                source_key=TEST_SOURCE_KEY),  # no locator -> rejected
    ])
    r = run_import(workdir)
    assert r.returncode != 0, "non-zero exit still signals that something was rejected"
    assert "no citation locator given" in r.stdout

    # The good density row still landed even though the tg row failed.
    assert count(conn, "SELECT count(*) FROM citation") == before_citations + 1


def test_persian_notes_round_trip(workdir, conn, clean_db, test_material):
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
            WHERE m.slug = %s AND pd.key = 'density' AND pv.note_fa IS NOT NULL
            """,
            (test_material,),
        )
        row = cur.fetchone()
    assert row is not None and row[0] == "یادداشت آزمایشی"


def test_reciting_an_existing_value_supersedes_rather_than_overwrites(workdir, conn, clean_db, test_material):
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


# ---------------------------------------------------------------------------
# Multi-citation: several sources for one value
# ---------------------------------------------------------------------------


def test_multiple_rows_for_one_property_combine_into_one_value_with_two_citations(workdir, conn, clean_db, test_material):
    """8 sources for one density range should mean 1 live property_value
    with N evidence rows, not N supersessions -- one row sets the value, the
    rest are citation-only rows (blank value columns) that attach as extra
    evidence instead."""
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
        gap_row(source_key=TEST_SOURCE_KEY, page="90", role="corroborating"),
    ])
    r = run_import(workdir)
    assert r.returncode == 0, r.stdout + r.stderr

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pv.id FROM property_value pv
            JOIN material m ON m.id = pv.subject_id AND pv.subject_type = 'material'
            JOIN property_definition pd ON pd.id = pv.property_id
            WHERE m.slug = %s AND pd.key = 'density' AND pv.superseded_by IS NULL
            """,
            (TEST_MATERIAL_SLUG,),
        )
        live_rows = cur.fetchall()
        assert len(live_rows) == 1, "the two citations must land on one property_value, not two"
        pv_id = live_rows[0][0]

        cur.execute("SELECT role FROM evidence WHERE subject_type = 'property_value' AND subject_id = %s;", (pv_id,))
        roles = sorted(r[0] for r in cur.fetchall())
    assert roles == ["corroborating", "primary"]


def test_two_rows_setting_conflicting_values_for_same_property_are_both_rejected(workdir, conn, clean_db, test_material):
    """A curator must settle on one number per (material, property); two
    rows both trying to set a new value in the same file is ambiguous and
    rejects the whole group rather than silently picking one."""
    write_sources(workdir / "sources.csv")
    write_gaps(workdir / "gaps.csv", [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
        gap_row(value_min="0.915", value_max="0.930", source_key=TEST_SOURCE_KEY, page="46"),
    ])
    r = run_import(workdir)
    assert r.returncode != 0
    assert "all try to set a new value" in r.stdout
    # Scoped to this test's own material: an unscoped count over the whole
    # table would fail as soon as any real curated data carries a legitimate
    # supersession, which says nothing about whether THIS file was rejected.
    assert count(
        conn,
        """
        SELECT count(*) FROM property_value pv
        JOIN material m ON m.id = pv.subject_id AND pv.subject_type = 'material'
        WHERE m.slug = %s AND pv.superseded_by IS NOT NULL
        """,
        (TEST_MATERIAL_SLUG,),
    ) == 0


# ---------------------------------------------------------------------------
# CSV rewrite: imported rows removed, rejected rows annotated in place
# ---------------------------------------------------------------------------


def test_successful_row_is_removed_and_failed_row_is_annotated_in_the_csv(workdir, conn, clean_db, test_material):
    gaps_path = workdir / "gaps.csv"
    write_sources(workdir / "sources.csv")
    write_gaps(gaps_path, [
        gap_row(value_min="0.910", value_max="0.925", source_key=TEST_SOURCE_KEY, page="45"),
        gap_row(property_key="tg", unit="°C", value_typical="-110",
                source_key=TEST_SOURCE_KEY),  # no locator -> rejected
    ])
    r = run_import(workdir)
    assert r.returncode != 0

    with gaps_path.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    density_rows = [row for row in rows if row["property_key"] == "density"]
    assert density_rows == [], "the successfully-imported row must be removed from the file"

    tg_rows = [row for row in rows if row["property_key"] == "tg"]
    assert len(tg_rows) == 1
    assert "no citation locator given" in tg_rows[0]["import_error"]
