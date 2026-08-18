"""Unit tests for extract_hsp.py's PDF-text parsing.

No PDF or database involved -- these feed small synthetic `pdftotext
-layout`-shaped text blocks straight into parse_rows()/slugify()/
apply_ligature_fixes(), covering the specific hazards documented in that
module's docstring: structure-diagram fragments, wrapped systematic names,
bare "0" values, the molar-volume-omitted block, and the font's ligature
drops. A separate slow test runs the real extraction against the actual
curation/hsp.pdf and checks headline invariants (row count, specific rows,
zero unaccounted anomalies) -- skipped automatically if that file isn't
present, since it's a large, gitignored working file, not a repo fixture.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from extract_hsp import (
    KNOWN_LIGATURE_FIXES,
    apply_ligature_fixes,
    assign_keys,
    parse_rows,
    slugify,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
HSP_PDF_PATH = REPO_ROOT / "curation" / "hsp.pdf"


def make_table_text(body: str) -> str:
    """Wraps a data-row fragment in the minimal header/footer scaffolding
    parse_rows() needs to find its bounds and resolve a page number."""
    return (
        "Appendix A: Table A.1                                                                          347\n"
        "\n\n\n"
        "TABLE A.1\n"
        "                                             Autonom/                              Hydrogen Molar\n"
        " No.                 Solvent Name            ACD Name        Dispersion Polarity   Bonding Volume\n"
        "\n"
        f"{body}\n"
        "Appendix A: Table A.2\n"
    )


# ---------------------------------------------------------------------------
# Basic row shape
# ---------------------------------------------------------------------------


def test_parses_simple_four_number_row():
    text = make_table_text(
        "1      Acetaldehyde*                   Acetaldehyde          14.7       12.5        7.9     56.6"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    row = rows[0]
    assert row["book_no"] == "1"
    assert row["name_en"] == "Acetaldehyde"  # asterisk stripped
    assert row["had_trailing_asterisk"] is True
    assert row["systematic_name"] == "Acetaldehyde"
    assert row["hansen_d"] == 14.7
    assert row["hansen_p"] == 12.5
    assert row["hansen_h"] == 7.9
    assert row["molar_volume"] == 56.6
    assert row["page"] == 347


def test_structure_diagram_fragments_are_ignored_not_merged():
    """Fragments like 'H3C', 'O', 'NH2' between data rows must never shift
    a column into the next row's fields -- the core hazard for this task."""
    text = make_table_text(
        "1      Acetaldehyde                    Acetaldehyde          14.7       12.5        7.9     56.6\n"
        "\n"
        "                     O\n"
        "        H3C\n"
        "\n"
        "2      Acetaldoxime                    Acetaldehyde oxime    16.3        4.0       20.2     61.2"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 2
    assert rows[0]["name_en"] == "Acetaldehyde"
    assert rows[0]["hansen_d"] == 14.7
    assert rows[1]["book_no"] == "2"
    assert rows[1]["name_en"] == "Acetaldoxime"
    assert rows[1]["hansen_d"] == 16.3
    assert rows[1]["hansen_p"] == 4.0


def test_wrapped_systematic_name_is_truncated_not_merged():
    """Row 8 in the real book: the systematic name wraps to a second line
    ('2-Hydroxy-2-methyl-' / 'propionitrile'). The continuation must NOT be
    guessed at -- the row keeps only what's on its own line and is flagged
    as truncated."""
    text = make_table_text(
        "8      Acetonecyanhydrin               2-Hydroxy-2-methyl-   16.6       12.2       15.5     94.0\n"
        "                                        propionitrile\n"
        "                    N\n"
        "           HO"
    )
    rows, anomalies = parse_rows(text)
    assert len(rows) == 1
    row = rows[0]
    assert row["systematic_name"] == "2-Hydroxy-2-methyl-"
    assert row["systematic_name_truncated"] is True
    assert "propionitrile" not in row["systematic_name"]
    assert row["hansen_d"] == 16.6
    assert row["molar_volume"] == 94.0


def test_single_space_before_numbers_does_not_corrupt_them():
    """Row 9 in the real book has only one space between the last name word
    and the first number ('...O-methyl- 14.7'), unlike the usual >=2-space
    column gap. A naive 'split on 2+ spaces' parser would glue the number
    onto the name and fail; this must still resolve correctly."""
    text = make_table_text(
        "9      Acetonemethyloxime                       Propan-2-one O-methyl- 14.7          4.6        4.6     96.7"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    row = rows[0]
    assert row["name_en"] == "Acetonemethyloxime"
    assert row["systematic_name"] == "Propan-2-one O-methyl-"
    assert row["hansen_d"] == 14.7
    assert row["hansen_p"] == 4.6
    assert row["hansen_h"] == 4.6
    assert row["molar_volume"] == 96.7


def test_bare_zero_value_is_parsed_as_zero_not_dropped():
    """Nonpolar solvents print a bare '0' (no decimal point) for a zero
    Hansen component -- e.g. real book row 52, Benzene, dP=0."""
    text = make_table_text(
        "52     Benzene                                Benzene                18.4        0          2.0     89.4"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    assert rows[0]["hansen_p"] == 0.0


def test_three_number_row_leaves_molar_volume_null():
    """The amine/acetic-acid block (book No. 1181-1194) genuinely has no
    molar volume printed -- solvent.molar_volume is nullable for exactly
    this reason (see migration 0027's column comment)."""
    text = make_table_text(
        "1181 2-Amino-2-Methyl-1-Propanol/Acetic            Acetate 2-hydroxy-1,1-     17.2       22.5       23.3"
    )
    rows, anomalies = parse_rows(text)
    assert anomalies == []
    assert len(rows) == 1
    row = rows[0]
    assert row["molar_volume"] is None
    assert row["hansen_d"] == 17.2
    assert row["hansen_p"] == 22.5
    assert row["hansen_h"] == 23.3


def test_unmatched_parenthesis_flags_name_en_truncated():
    text = make_table_text(
        "79     Bromotrifluoromethane (Freon 1381      Bromo-trifluoro           9.6        2.4         0       97.0"
    )
    rows, _ = parse_rows(text)
    assert len(rows) == 1
    assert rows[0]["name_en_truncated"] is True


def test_page_number_header_line_is_not_mistaken_for_a_data_row():
    text = make_table_text(
        "1      Acetaldehyde                    Acetaldehyde          14.7       12.5        7.9     56.6"
    ).replace(
        "Appendix A: Table A.2",
        "348                                                      Hansen Solubility Parameters: A User’s Handbook\n"
        "Appendix A: Table A.2",
    )
    rows, anomalies = parse_rows(text)
    assert len(rows) == 1
    assert anomalies == []


def test_unparseable_leading_digit_line_is_reported_as_an_anomaly_not_dropped():
    """A line that starts with digits but never resolves into a data row
    must be surfaced, not silently skipped -- every row has to be
    accounted for (task requirement), not just the ones that happened to
    parse cleanly."""
    text = make_table_text("42     Some Broken Row With No Trailing Numbers At All")
    rows, anomalies = parse_rows(text)
    assert rows == []
    assert len(anomalies) == 1
    assert anomalies[0][1].strip().startswith("42")


# ---------------------------------------------------------------------------
# Ligature-drop repairs (font artifact: known literal substitutions only)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "broken,expected_fragment",
    [
        ("Propylene Glycol Monob utyl Ether", "Monobutyl"),
        ("Propylene Glycol Monoeth yl Ether", "Monoethyl"),
        ("4-(Trifluoromet yl) Acetophenone", "Trifluoromethyl"),
        ("Methyl n-Amyl K etone", "Ketone"),
        ("Hexafluo o Compound", "Hexafluoro"),
    ],
)
def test_known_ligature_fixes_repair_specific_broken_words(broken, expected_fragment):
    assert expected_fragment in apply_ligature_fixes(broken)


def test_ligature_fixes_do_not_touch_unrelated_text():
    """The fix list is literal substrings, not a generic regex -- confirms
    ordinary text with none of the broken patterns passes through
    unchanged."""
    text = "Diethylene Glycol Butyl Ether Acetate"
    assert apply_ligature_fixes(text) == text


def test_ligature_fix_list_has_no_duplicate_entries():
    broken_forms = [broken for broken, _ in KNOWN_LIGATURE_FIXES]
    assert len(broken_forms) == len(set(broken_forms))


# ---------------------------------------------------------------------------
# slugify / assign_keys
# ---------------------------------------------------------------------------


def test_slugify_basic():
    assert slugify("Acetaldehyde") == "acetaldehyde"
    assert slugify("1,2-Dichlorotetrafluoroethane") == "1-2-dichlorotetrafluoroethane"
    assert slugify("Water - Complete Miscibility") == "water-complete-miscibility"


def test_assign_keys_disambiguates_same_name_different_rows():
    """The real table has two rows named 'Carbon Disulfid' (different HSP
    values from different literature within the book) -- their slugs must
    not collide."""
    rows = [
        {"name_en": "Carbon Disulfid", "book_no": "120"},
        {"name_en": "Carbon Disulfid", "book_no": "862"},
    ]
    assign_keys(rows)
    assert rows[0]["key"] != rows[1]["key"]
    assert rows[0]["key"].startswith("carbon-disulfid")
    assert rows[1]["key"].startswith("carbon-disulfid")


def test_assign_keys_produces_unique_keys_for_many_rows():
    rows = [{"name_en": "Xylene", "book_no": str(i)} for i in range(5)]
    assign_keys(rows)
    assert len({r["key"] for r in rows}) == 5


# ---------------------------------------------------------------------------
# Slow integration test against the real PDF (skipped if not present)
# ---------------------------------------------------------------------------


@pytest.mark.skipif(not HSP_PDF_PATH.exists(), reason="curation/hsp.pdf is a large gitignored working file")
def test_real_pdf_extraction_headline_invariants():
    from extract_hsp import parse_rows, run_pdftotext

    text = run_pdftotext(HSP_PDF_PATH)
    rows, anomalies = parse_rows(text)

    # Every leading-digit line in the table must resolve to a data row --
    # an anomaly here means a row went unaccounted for.
    assert anomalies == [], f"{len(anomalies)} unaccounted row(s): {anomalies[:5]}"

    # Headline count: the real table is much larger than a naive reading
    # of "No. 1 to No. 697" suggests (out-of-sequence higher book numbers
    # are interspersed alphabetically throughout) -- see module docstring.
    assert len(rows) > 1100

    by_book_no: dict[str, list[dict]] = {}
    for row in rows:
        by_book_no.setdefault(row["book_no"], []).append(row)

    assert by_book_no["1"][0]["name_en"] == "Acetaldehyde"
    assert by_book_no["1"][0]["hansen_d"] == 14.7

    assert by_book_no["696"][0]["name_en"] == "Water"
    assert by_book_no["697"][0]["name_en"] == "Xylene"
    assert by_book_no["698"][0]["name_en"] == "o-Xylene"

    water_low = [r for r in by_book_no["859"] if "1%" in r["name_en"]]
    water_full = [r for r in by_book_no["858"] if "Miscibility" in r["name_en"]]
    assert water_low and water_low[0]["hansen_d"] == 15.1
    assert water_full and water_full[0]["hansen_d"] == 18.1

    for row in rows:
        assert 0 <= row["hansen_d"] <= 60
        assert 0 <= row["hansen_p"] <= 60
        assert 0 <= row["hansen_h"] <= 60
        if row["molar_volume"] is not None:
            assert 0 < row["molar_volume"] < 2000
