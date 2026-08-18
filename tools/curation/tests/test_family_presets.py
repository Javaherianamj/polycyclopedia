"""Tests for the --preset flag on export_gaps.py and family_presets.py.

Read-only against real data where possible (the `db_conn` fixture rolls
back automatically, and these tests never write) -- expected counts are
computed dynamically from the live database rather than hardcoded, per the
convention set in test_curation.py: real curation work changes what is
unsourced over time, and a test asserting a fixed number is a test that is
*wrong by design* the moment curation work succeeds.

The one test that writes (round-tripping a preset-filtered file through the
existing, unmodified import_values.py) uses a dedicated, disposable test
material -- never ldpe/hdpe/pp -- following test_curation.py's test_material
pattern, for the same reason documented there: a real citation was corrupted
once already by a test that assumed no real data would ever exist where it
was writing.
"""

from __future__ import annotations

import csv
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# CURATION_DIR here is common.py's data directory (repo_root/curation/, where
# gaps.csv etc actually live) -- NOT tools/curation/ (the scripts). Keep
# these two apart: test_curation.py names the scripts directory CURATION_DIR
# instead, which is a completely different path with the same name and is
# exactly the kind of collision that silently breaks a test like this one
# (it did, during development -- the file-existence assertions below were
# checking tools/curation/gaps.csv, which the exporter never writes to).
from common import CURATION_DIR, GAPS_FIELDNAMES, SOURCES_FIELDNAMES, get_connection  # noqa: E402
from export_gaps import export_gaps  # noqa: E402
from family_presets import (  # noqa: E402
    FAMILY_PRESETS,
    POLYOLEFINS_PROPERTIES,
    THERMOSET_RESINS_PROPERTIES,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
CURATION_SCRIPTS_DIR = REPO_ROOT / "tools" / "curation"
PYTHON = sys.executable

TEST_SOURCE_KEY = "__test_source__"
TEST_SOURCE_TITLE = "__test_source__ Fictional Reference For Tests"
TEST_MATERIAL_SLUG = "zz-test-preset-material"


# ---------------------------------------------------------------------------
# Fixtures (mirrors test_curation.py's test_material pattern)
# ---------------------------------------------------------------------------


@pytest.fixture
def test_material():
    c = get_connection()
    try:
        with c.cursor() as cur:
            cur.execute("SELECT id FROM field WHERE key = 'thermoplastics'")
            field_id = cur.fetchone()[0]
            cur.execute("SELECT id FROM family WHERE key = 'polyolefins'")
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
            density_id = cur.fetchone()[0]
            cur.execute(
                """
                INSERT INTO property_value
                    (subject_type, subject_id, property_id, value_min, value_max, status)
                VALUES ('material', %s, %s, 0.910, 0.925, 'unsourced')
                """,
                (material_id, density_id),
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


# ---------------------------------------------------------------------------
# family_presets.py content
# ---------------------------------------------------------------------------


def test_thermoset_preset_excludes_melting_properties():
    """Thermosets don't melt (no tm) and don't flow after cure (no mfi)."""
    assert "tm" not in THERMOSET_RESINS_PROPERTIES
    assert "mfi" not in THERMOSET_RESINS_PROPERTIES


def test_thermoset_preset_includes_the_new_cure_properties():
    for key in ("gel_time", "pot_life", "cure_time", "cure_temperature",
                "peak_exotherm_temperature", "hardness_barcol"):
        assert key in THERMOSET_RESINS_PROPERTIES, f"{key} missing from thermoset preset"


def test_polyolefins_preset_excludes_academic_group(db_conn):
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT pd.key FROM property_definition pd JOIN property_group g ON g.id = pd.group_id "
            "WHERE g.key = 'academic'"
        )
        academic_keys = {row[0] for row in cur.fetchall()}
    overlap = academic_keys & set(POLYOLEFINS_PROPERTIES)
    assert not overlap, f"academic-group keys leaked into the polyolefins preset: {overlap}"


def test_preset_keys_all_exist_in_the_registry(db_conn):
    with db_conn.cursor() as cur:
        cur.execute("SELECT key FROM property_definition")
        real_keys = {row[0] for row in cur.fetchall()}
    for name, keys in FAMILY_PRESETS.items():
        unknown = set(keys) - real_keys
        assert not unknown, f"preset {name!r} references unknown property keys: {unknown}"


# ---------------------------------------------------------------------------
# export_gaps.py --preset filtering (read-only, dynamic expectations)
# ---------------------------------------------------------------------------


def test_preset_narrows_export_to_the_preset_list(db_conn, tmp_path):
    out = tmp_path / "ldpe.csv"
    count = export_gaps(db_conn, "ldpe", out, include_missing=False, preset="polyolefins")

    with out.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) == count
    seen_keys = {r["property_key"] for r in rows}
    assert seen_keys <= set(POLYOLEFINS_PROPERTIES)

    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) FROM v_unsourced_values uv
            JOIN material m ON m.id = uv.subject_id AND uv.subject_type = 'material'
            WHERE m.slug = 'ldpe' AND uv.property_key = ANY(%s)
            """,
            (POLYOLEFINS_PROPERTIES,),
        )
        expected = cur.fetchone()[0]
    assert count == expected


def test_thermoset_preset_never_includes_tm_or_mfi_even_with_include_missing(db_conn, tmp_path):
    out = tmp_path / "wide.csv"
    export_gaps(db_conn, None, out, include_missing=True, preset="thermoset-resins")
    with out.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    keys = {r["property_key"] for r in rows}
    assert "tm" not in keys
    assert "mfi" not in keys


def test_combining_material_and_preset_narrows_correctly(db_conn, tmp_path):
    out = tmp_path / "combo.csv"
    count = export_gaps(db_conn, "hdpe", out, include_missing=False, preset="thermoset-resins")
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) FROM v_unsourced_values uv
            JOIN material m ON m.id = uv.subject_id AND uv.subject_type = 'material'
            WHERE m.slug = 'hdpe' AND uv.property_key = ANY(%s)
            """,
            (THERMOSET_RESINS_PROPERTIES,),
        )
        expected = cur.fetchone()[0]
    assert count == expected


def test_unknown_preset_name_is_rejected(db_conn, tmp_path):
    with pytest.raises(ValueError):
        export_gaps(db_conn, "ldpe", tmp_path / "x.csv", preset="not-a-real-preset")


# ---------------------------------------------------------------------------
# CLI: default output filename
# ---------------------------------------------------------------------------


def run_export_cli(cwd: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [PYTHON, str(CURATION_SCRIPTS_DIR / "export_gaps.py"), *args],
        capture_output=True, text=True, cwd=str(cwd),
    )


def test_default_filename_is_curation_slug_csv_when_material_given():
    """CURATION_DIR (common.py) is a fixed absolute path, not resolved
    relative to cwd, so this can't be redirected into a tmp_path the way the
    explicit-override tests are -- it has to run against the real curation/
    directory. Uses an obviously-fake slug (matches no real material, so the
    export is empty) and cleans up the file it creates there afterward.
    """
    fake_slug = "zz-test-filename-check"
    target = CURATION_DIR / f"{fake_slug}.csv"
    target.unlink(missing_ok=True)
    try:
        r = run_export_cli(REPO_ROOT, "--material", fake_slug)
        assert r.returncode == 0, r.stdout + r.stderr
        assert target.exists()
    finally:
        target.unlink(missing_ok=True)


def test_default_filename_stays_gaps_csv_without_material():
    gaps_path = CURATION_DIR / "gaps.csv"
    gaps_path.unlink(missing_ok=True)
    try:
        r = run_export_cli(REPO_ROOT, "--preset", "polyolefins")
        assert r.returncode == 0, r.stdout + r.stderr
        assert gaps_path.exists()
    finally:
        gaps_path.unlink(missing_ok=True)


def test_explicit_gaps_csv_path_always_wins(tmp_path):
    work = tmp_path / "work"
    work.mkdir()
    (work / "curation").mkdir()
    explicit = work / "curation" / "custom-name.csv"
    r = run_export_cli(work, "--material", "ldpe", "--gaps-csv", str(explicit))
    assert r.returncode == 0, r.stdout + r.stderr
    assert explicit.exists()
    assert not (work / "curation" / "ldpe.csv").exists()


# ---------------------------------------------------------------------------
# End to end: a preset-filtered, single-material file round-trips through
# the EXISTING, UNMODIFIED import_values.py -- no new importer was written,
# because the file shape didn't change, only which rows are in it.
# ---------------------------------------------------------------------------


def run_import(workdir: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [PYTHON, str(CURATION_SCRIPTS_DIR / "import_values.py"),
         "--gaps-csv", str(workdir / "gaps.csv"),
         "--sources-csv", str(workdir / "sources.csv"), *args],
        capture_output=True, text=True, cwd=str(REPO_ROOT),
    )


def write_sources(path: Path) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=SOURCES_FIELDNAMES)
        w.writeheader()
        w.writerow({
            "source_key": TEST_SOURCE_KEY, "title": TEST_SOURCE_TITLE,
            "authors": "Nobody", "publisher": "Nowhere", "edition": "1st",
            "year": "2000", "isbn": "", "doi": "", "url": "",
            "kind": "handbook", "tier": "peer_reviewed_handbook",
        })


def test_preset_filtered_single_material_file_imports_via_existing_importer(
    tmp_path, test_material, clean_db
):
    conn = get_connection()
    try:
        export_gaps(conn, test_material, tmp_path / "gaps.csv",
                    include_missing=False, preset="polyolefins")
        conn.rollback()
    finally:
        conn.close()

    with (tmp_path / "gaps.csv").open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) == 1
    assert rows[0]["property_key"] == "density"
    assert rows[0]["material_slug"] == test_material

    rows[0]["value_min"] = "0.915"
    rows[0]["value_max"] = "0.930"
    rows[0]["source_key"] = TEST_SOURCE_KEY
    rows[0]["page"] = "99"
    with (tmp_path / "gaps.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=GAPS_FIELDNAMES)
        w.writeheader()
        w.writerows(rows)
    write_sources(tmp_path / "sources.csv")

    r = run_import(tmp_path)
    assert r.returncode == 0, r.stdout + r.stderr

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT pv.value_min, pv.value_max, pv.status, s.title, ct.locator->>'page'
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
    finally:
        conn.close()

    assert row is not None
    vmin, vmax, status, title, page = row
    assert (float(vmin), float(vmax)) == (0.915, 0.930)
    assert status == "published"
    assert title == TEST_SOURCE_TITLE
    assert page == "99"
