"""Unit tests for extract_hsp_polymers.py's PDF-text parsing.

No PDF or database involved -- these feed small synthetic `pdftotext
-layout`-shaped text blocks straight into parse_rows()/slugify(), covering
the hazards documented in that module's docstring: section headings
interleaved between rows, the token-based (not position-based) number
capture that correctly recovers the "PVBE"/row-308-style near-miss, fused
uncertainty markers, and signed (Unicode en dash) values. A separate slow
test runs the real extraction against the actual curation/hsp.pdf and checks
headline invariants -- skipped automatically if that file isn't present.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from extract_hsp_polymers import assign_keys, flag_out_of_range, parse_rows, slugify

REPO_ROOT = Path(__file__).resolve().parents[3]
HSP_PDF_PATH = REPO_ROOT / "curation" / "hsp.pdf"


def make_table_text(body: str) -> str:
    """Wraps a data-row fragment in the minimal header/footer scaffolding
    parse_rows() needs to find its bounds and resolve a page number."""
    return (
        "Appendix A: Table A.2                                                                                493\n"
        "\n\n\n"
        " TABLE A.2\n"
        " Hansen Solubility Parameters for Selected Correlations\n"
        "                                                                               Hydrogen   Interaction\n"
        " Number                     Polymer                       Dispersion   Polar   Bonding      Radius\n"
        "\n"
        f"{body}\n"
        "Appendix A: Table A.3\n"
    )


# ---------------------------------------------------------------------------
# Basic row shape
# ---------------------------------------------------------------------------


def test_parses_simple_four_number_row():
    text = make_table_text(
        " 1         CELLIT BP-300                                   16.60       12.00     6.70       10.20"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    row = rows[0]
    assert row["handbook_number"] == "1"
    assert row["name_raw"] == "CELLIT BP-300"
    assert row["hansen_d"] == 16.60
    assert row["hansen_p"] == 12.00
    assert row["hansen_h"] == 6.70
    assert row["r0"] == 10.20
    assert row["page"] == 493


def test_section_heading_is_captured_and_carried_across_rows():
    text = make_table_text(
        "                                      Cellulose Acetobutyrate\n"
        " 1         CELLIT BP-300                                   16.60       12.00     6.70       10.20\n"
        "\n"
        "                                         Cellulose Acetate\n"
        " 2         CELLIDORA A                                       18.20     12.40    10.80         7.40"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 2
    assert rows[0]["section"] == "Cellulose Acetobutyrate"
    assert rows[1]["section"] == "Cellulose Acetate"


def test_column_header_repeated_on_continuation_page_is_not_a_section():
    text = make_table_text(
        " TABLE A.2 (CONTINUED)\n"
        " Hansen Solubility Parameters for Selected Correlations\n"
        "                                                                            Hydrogen   Interaction\n"
        " Number                     Polymer                    Dispersion   Polar   Bonding      Radius\n"
        "\n"
        " 32       BUNA HULS B10                                       17.53     2.25      3.42        6.55"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    assert rows[0]["section"] is None


def test_name_adjacent_to_dispersion_value_still_recovers_all_four_numbers():
    """Row 308 in the real book, 'PVBE 16.70   3.70  8.30  8.60': the
    Dispersion value sits with only a single space after the name instead of
    the usual wide column gap. A position-based parser would misread this as
    3 aligned numbers; this parser is token-based (last 4 numeric tokens win)
    and recovers all 4 values -- verified against the printed page."""
    text = make_table_text(
        " 308       PVBE 16.70                                                3.70     8.30        8.60"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    row = rows[0]
    assert row["name_raw"] == "PVBE"
    assert row["hansen_d"] == 16.70
    assert row["hansen_p"] == 3.70
    assert row["hansen_h"] == 8.30
    assert row["r0"] == 8.60


def test_uncertainty_marker_fused_to_name_is_extracted_and_preserved():
    text = make_table_text(
        " 189      SILICONE DC-1107?                                19.60        3.40       10.80        9.80"
    )
    rows, _ = parse_rows(text)
    assert len(rows) == 1
    row = rows[0]
    assert row["name_raw"] == "SILICONE DC-1107?"  # verbatim, marker not stripped
    assert row["uncertainty"] == "?"


def test_double_uncertainty_marker_is_extracted_as_double():
    text = make_table_text(
        " 339      ESTANE X-7 ?? DIO XANE ONLY                    19.00      1.80     7.40        1.00"
    )
    rows, _ = parse_rows(text)
    assert len(rows) == 1
    assert rows[0]["uncertainty"] == "??"
    assert rows[0]["name_raw"] == "ESTANE X-7 ?? DIO XANE ONLY"


def test_no_uncertainty_marker_leaves_field_none():
    text = make_table_text(
        " 1         CELLIT BP-300                                   16.60       12.00     6.70       10.20"
    )
    rows, _ = parse_rows(text)
    assert rows[0]["uncertainty"] is None


def test_unicode_en_dash_negative_value_is_parsed_as_a_signed_float():
    """Row 177 in the real book prints a negative Hydrogen Bonding value
    using a Unicode en dash rather than an ASCII hyphen-minus."""
    text = make_table_text(
        " 177      PFA(?)                                                16.70      7.70    –0.50        8.10"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    assert rows[0]["hansen_h"] == -0.50
    assert rows[0]["uncertainty"] == "?"


def test_page_marker_lines_are_not_mistaken_for_data_rows_or_anomalies():
    text = make_table_text(
        " 31        HYCAR 1052                                      18.62       8.78      4.17        9.62\n"
        "\x0c494                                              Hansen Solubility Parameters: A User’s Handbook\n"
        " 32       BUNA HULS B10                                       17.53     2.25      3.42        6.55"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 2


def test_unparseable_leading_digit_line_is_reported_as_an_anomaly_not_dropped():
    text = make_table_text(" 42     Some Broken Row With No Trailing Numbers At All")
    rows, anomalies = parse_rows(text)
    assert rows == []
    assert len(anomalies) == 1
    assert anomalies[0][1].strip().startswith("42")


# ---------------------------------------------------------------------------
# flag_out_of_range
# ---------------------------------------------------------------------------


def test_flag_out_of_range_flags_negative_component_but_keeps_the_row():
    rows = [
        {"handbook_number": "33", "name_raw": "CARIFLEX IR 305", "hansen_d": 16.57,
         "hansen_p": 1.41, "hansen_h": -0.82, "r0": 9.62, "note": None}
    ]
    flagged = flag_out_of_range(rows)
    assert len(flagged) == 1
    assert flagged[0]["note"] is not None
    assert "out_of_range" in flagged[0]["note"]


def test_flag_out_of_range_leaves_well_formed_row_unflagged():
    rows = [
        {"handbook_number": "1", "name_raw": "CELLIT BP-300", "hansen_d": 16.6,
         "hansen_p": 12.0, "hansen_h": 6.7, "r0": 10.2, "note": None}
    ]
    flagged = flag_out_of_range(rows)
    assert flagged[0]["note"] is None


def test_flag_out_of_range_flags_nonpositive_r0():
    rows = [
        {"handbook_number": "999", "name_raw": "TEST", "hansen_d": 16.0,
         "hansen_p": 8.0, "hansen_h": 5.0, "r0": 0.0, "note": None}
    ]
    flagged = flag_out_of_range(rows)
    assert flagged[0]["note"] is not None


# ---------------------------------------------------------------------------
# slugify / assign_keys
# ---------------------------------------------------------------------------


def test_slugify_basic():
    assert slugify("CELLIT BP-300") == "cellit-bp-300"
    assert slugify("PVC") == "pvc"
    assert slugify("POLYCYCLOLa") == "polycyclola"


def test_assign_keys_disambiguates_same_name_different_rows():
    rows = [
        {"name_raw": "PVC", "handbook_number": "39"},
        {"name_raw": "PVC", "handbook_number": "205"},
    ]
    assign_keys(rows)
    assert rows[0]["key"] != rows[1]["key"]
    assert rows[0]["key"].startswith("pvc")
    assert rows[1]["key"].startswith("pvc")


def test_assign_keys_produces_unique_keys_for_many_rows():
    rows = [{"name_raw": "STYRON", "handbook_number": str(i)} for i in range(5)]
    assign_keys(rows)
    assert len({r["key"] for r in rows}) == 5


# ---------------------------------------------------------------------------
# Slow integration test against the real PDF (skipped if not present)
# ---------------------------------------------------------------------------


@pytest.mark.skipif(not HSP_PDF_PATH.exists(), reason="curation/hsp.pdf is a large gitignored working file")
def test_real_pdf_extraction_headline_invariants():
    from extract_hsp_polymers import parse_rows, run_pdftotext

    text = run_pdftotext(HSP_PDF_PATH)
    rows, anomalies = parse_rows(text)

    assert anomalies == [], f"{len(anomalies)} unaccounted row(s): {anomalies[:5]}"

    # 466 rows, numbered 1-466 with no gaps and no duplicates -- verified by
    # hand against the printed table (see module docstring's NOTE ON ROW
    # COUNT). Earlier scoping notes suggested ~454; the true count is 466.
    assert len(rows) == 466

    numbers = sorted(int(r["handbook_number"]) for r in rows)
    assert numbers[0] == 1
    assert numbers[-1] == 466
    assert len(set(numbers)) == 466

    by_number = {r["handbook_number"]: r for r in rows}
    assert by_number["1"]["name_raw"] == "CELLIT BP-300"
    assert by_number["1"]["hansen_d"] == 16.60
    assert by_number["1"]["section"] == "Cellulose Acetobutyrate"

    # The token-based-parse hazard named in the task brief: row 308 must
    # recover all 4 real values, not silently drop the Dispersion column.
    pvbe = by_number["308"]
    assert pvbe["name_raw"] == "PVBE"
    assert pvbe["hansen_d"] == 16.70
    assert pvbe["hansen_p"] == 3.70
    assert pvbe["hansen_h"] == 8.30
    assert pvbe["r0"] == 8.60

    # Uncertainty markers preserved verbatim and also extracted.
    assert by_number["189"]["uncertainty"] == "?"
    assert "?" in by_number["189"]["name_raw"]

    # Catalog-relevant generic entries used for material linking exist with
    # the expected values (see import_hsp_correlations.py's CATALOG_LINKS).
    assert by_number["180"]["name_raw"] == "HDPE"
    assert by_number["181"]["name_raw"] == "PP"
    assert by_number["203"]["name_raw"] == "PS"
    assert by_number["205"]["name_raw"] == "PVC"
    assert by_number["213"]["name_raw"] == "MYLAR PET"
