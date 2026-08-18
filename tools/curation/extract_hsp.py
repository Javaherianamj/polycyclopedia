"""Extracts Appendix A, Table A.1 (the solvent list) from Hansen's *Hansen
Solubility Parameters: A User's Handbook* (2nd ed.) into a reviewable CSV.

    python extract_hsp.py                       # curation/hsp.pdf -> curation/hsp-solvents.csv
    python extract_hsp.py --pdf other.pdf --out other.csv

This is a one-shot extraction tool, not part of the regular curation loop --
run it once, review/correct the CSV by hand (or send corrections back
through this script's output), then import with import_solvents.py. It is
deliberately conservative: anywhere the PDF's layout is ambiguous, it either
drops the fragment (chemical structure-diagram text) or leaves a field
truncated and flags it, rather than guessing at what completes it. A parser
that silently repairs uncertain text is worse than one that visibly leaves
a gap, on a page whose whole premise is traceability.

WHY THIS IS HARDER THAN "SPLIT ON WHITESPACE"
------------------------------------------------
1. Chemical structure diagrams (atom labels like "H3C", "OH", "N") are
   interleaved between data rows as their own text lines. They never carry a
   leading row number, so the row-matching regexes below never touch them --
   solved by anchoring on "line starts with the row's `No.` column".
2. The Autonom/ACD systematic name sometimes wraps onto a second line
   (e.g. row 8, "2-Hydroxy-2-methyl-" / "propionitrile"). The wrapped
   continuation is indistinguishable from a structure-diagram fragment
   without also parsing character columns, which pdftotext -layout does not
   guarantee stays aligned across every page. Rather than risk merging a
   structure fragment into a name (the exact hazard called out for this
   task), the parser takes only what's on the row's own line and flags the
   name as `systematic_name_truncated` when it looks cut off (ends in a
   hyphen). This loses a few trailing words on ~1% of rows; it never
   shifts a column.
3. The three Hansen parameters are usually printed like "14.7" but a `0.0`
   value is sometimes printed bare as "0" (e.g. nonpolar solvents like
   benzene, dP=0). The number-matching regex accepts both.
4. ~14 rows (a block of amine/acetic-acid reaction products, book No.
   1181-1194) have only three trailing numbers, not four -- the handbook
   simply omits molar volume for them. `solvent.molar_volume` is nullable
   for exactly this reason (see migration 0027's column comment).
5. The font used for this PDF drops certain ligatures on extraction,
   producing a stray space with no missing letters ("b utyl" for "butyl",
   "eth yl" for "ethyl") and, in 3 known cases, a stray space AND a missing
   letter ("Trifluoromet yl" for "Trifluoromethyl"). KNOWN_LIGATURE_FIXES
   below is an explicit, reviewed list of literal fixes -- not a generic
   regex -- so no other text can be silently mangled by the same code path.
6. Book `No.` is not the row's position: the table is sorted alphabetically
   by name, and later editions inserted new solvents under out-of-sequence
   IDs (e.g. No. 916 sits alphabetically among the V's, No. 1225 exists).
   The printed range is not 1-697 -- see the module-level NOTE below and
   the importer's report output. `book_no` is kept as a traceability column
   only; it is never used as the DB key (two rows even reuse the same
   book_no by the book's own typo -- No. 92 for both 1-Butanol and
   2-Butanol, No. 860 for both Acridine and Urea -- so it cannot be one).

NOTE ON ROW COUNT
------------------
Table A.1 is not a ~700-row table. It runs continuously across pages
347-483 (137 pages), alphabetically by name, and this parser finds ~1180
data rows in it -- see the printed extraction summary for the exact count
and a full accounting of every row that failed to parse. Do not truncate
the output to book_no <= 697: the higher-numbered rows are not a separate
appendix, they are interspersed throughout these same pages.
"""
from __future__ import annotations

import argparse
import bisect
import csv
import re
import subprocess
from pathlib import Path

from common import CSV_ENCODING, disambiguate_key

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PDF_PATH = REPO_ROOT / "curation" / "hsp.pdf"
DEFAULT_CSV_PATH = REPO_ROOT / "curation" / "hsp-solvents.csv"

TABLE_TITLE = "TABLE A.1"
TABLE_END_MARKER = "Appendix A: Table A.2"

# Page-marker patterns: this book prints "Appendix A: Table A.1  <page>" at
# the top of odd pages and "<page>  Hansen Solubility Parameters..." at the
# top of even pages, both immediately BEFORE that page's table content (see
# the module docstring point about column alignment -- verified by hand
# against ~10 pages before trusting this for citation locators).
ODD_PAGE_MARKER_RE = re.compile(r"Appendix A: Table A\.1\s+(\d+)\s*$")
EVEN_PAGE_MARKER_RE = re.compile(r"^(\d+)\s+Hansen Solubility Parameters")

# A data row: leading book No., then a name blob (solvent name + systematic
# name, columns distinguished later by >=2-space gaps), then 3 or 4
# trailing numbers (Dispersion, Polarity, [Hydrogen Bonding,] Molar Volume
# -- 3-number rows are the molar-volume-omitted block, see point 4 above).
# Deliberately does NOT use a single generic \s+ between fields: some rows
# have only a single space between the last name word and the first number
# (observed on row 9, "...O-methyl- 14.7"), which would otherwise pull a
# number into the name or vice versa.
ROW_RE_4 = re.compile(r"^\s*(\d+)\s+(.+\S)\s+((?:-?\d+(?:\.\d+)?\s+){3}-?\d+(?:\.\d+)?)\s*$")
ROW_RE_3 = re.compile(r"^\s*(\d+)\s+(.+\S)\s+((?:-?\d+(?:\.\d+)?\s+){2}-?\d+(?:\.\d+)?)\s*$")
LEADING_DIGIT_RE = re.compile(r"^\s*\d+\s+\S")

# Ligature-drop fixes (see module docstring point 5). Applied as literal
# substring replacements, longest-first so e.g. "isob utyl" (contains
# "b utyl") still resolves correctly regardless of dict iteration order.
KNOWN_LIGATURE_FIXES: list[tuple[str, str]] = [
    ("Trifluoromet yl", "Trifluoromethyl"),
    ("trifluoromet yl", "trifluoromethyl"),
    ("Methylsulfi yl", "Methylsulfinyl"),
    ("methylsulfi yl", "methylsulfinyl"),
    ("Hexafluo o", "Hexafluoro"),
    ("hexafluo o", "hexafluoro"),
    ("K etone", "Ketone"),
    ("b utyl", "butyl"),
    ("B utyl", "Butyl"),
    ("b uta", "buta"),
    ("B uta", "Buta"),
    ("eth yl", "ethyl"),
    ("Eth yl", "Ethyl"),
    ("prop yl", "propyl"),
    ("Prop yl", "Propyl"),
    ("phen yl", "phenyl"),
    ("Phen yl", "Phenyl"),
    ("phe yl", "phenyl"),
    ("he xyl", "hexyl"),
    ("He xyl", "Hexyl"),
    ("ole yl", "oleyl"),
    ("sulfi yl", "sulfinyl"),
    ("vin yl", "vinyl"),
    ("Vin yl", "Vinyl"),
    ("yn yl", "ynyl"),
    ("tridec yl", "tridecyl"),
]

SOLVENT_FIELDNAMES = [
    "key",
    "name_en",
    "systematic_name",
    "cas_number",
    "hansen_d",
    "hansen_p",
    "hansen_h",
    "molar_volume",
    "book_no",
    "page",
    "had_trailing_asterisk",
    "name_en_truncated",
    "systematic_name_truncated",
    "note",
]


def run_pdftotext(pdf_path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"],
        capture_output=True,
        check=True,
    )
    return result.stdout.decode("utf-8", errors="replace")


def apply_ligature_fixes(text: str) -> str:
    for broken, fixed in KNOWN_LIGATURE_FIXES:
        text = text.replace(broken, fixed)
    return text


def build_page_index(lines: list[str]) -> tuple[list[int], list[int]]:
    marker_lines: list[int] = []
    marker_pages: list[int] = []
    for i, line in enumerate(lines):
        m = ODD_PAGE_MARKER_RE.search(line)
        if not m:
            m = EVEN_PAGE_MARKER_RE.search(line)
        if m:
            marker_lines.append(i)
            marker_pages.append(int(m.group(1)))
    return marker_lines, marker_pages


def page_for_line(line_idx: int, marker_lines: list[int], marker_pages: list[int]) -> int | None:
    pos = bisect.bisect_right(marker_lines, line_idx) - 1
    if pos < 0:
        return None
    return marker_pages[pos]


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s or "solvent"


def find_table_bounds(lines: list[str]) -> tuple[int, int]:
    start = None
    end = None
    for i, line in enumerate(lines):
        if start is None and line.strip() == TABLE_TITLE:
            start = i
        if line.strip().startswith(TABLE_END_MARKER):
            end = i
            break
    if start is None:
        raise SystemExit(f"Could not find the literal line '{TABLE_TITLE}' in the extracted text.")
    if end is None:
        raise SystemExit(f"Could not find '{TABLE_END_MARKER}' after the table -- extraction range is unbounded.")
    return start, end


def parse_rows(text: str) -> tuple[list[dict], list[tuple[int, str]]]:
    """Returns (rows, anomalies). Anomalies are (1-based line number, raw
    line) pairs for every line that starts with what looks like a book
    number but did not resolve into a data row -- these must be accounted
    for by hand, not silently dropped."""
    lines = text.split("\n")
    marker_lines, marker_pages = build_page_index(lines)
    table_start, table_end = find_table_bounds(lines)

    rows: list[dict] = []
    anomalies: list[tuple[int, str]] = []

    for i in range(table_start, table_end):
        line = lines[i]
        m = ROW_RE_4.match(line)
        n_expected = 4
        if not m:
            m = ROW_RE_3.match(line)
            n_expected = 3
        if not m:
            if (
                LEADING_DIGIT_RE.match(line)
                and "Hansen Solubility Parameters" not in line
                and "\x0c" not in line
            ):
                anomalies.append((i + 1, line))
            continue

        book_no, name_blob, numbers_blob = m.groups()
        floats = [float(t) for t in numbers_blob.split()]
        d, p, h = floats[0], floats[1], floats[2]
        mv = floats[3] if n_expected == 4 else None

        name_blob = apply_ligature_fixes(name_blob)
        name_tokens = re.split(r"\s{2,}", name_blob.strip())
        name_en = name_tokens[0]
        systematic_name = " ".join(name_tokens[1:]) if len(name_tokens) > 1 else None

        had_asterisk = name_en.endswith("*")
        if had_asterisk:
            name_en = name_en[:-1].strip()

        systematic_truncated = bool(systematic_name and systematic_name.rstrip().endswith("-"))
        # An unmatched '(' means the name's parenthetical continued onto a
        # line the parser deliberately did not merge (see docstring point 2)
        # -- e.g. "Bromotrifluoromethane (Freon 1381" (book No. 79), missing
        # its closing ")". Flagged, not repaired: guessing the missing
        # words would be exactly the fabrication this project exists to
        # avoid.
        name_truncated = name_en.count("(") != name_en.count(")")

        rows.append(
            {
                "book_no": book_no,
                "name_en": name_en,
                "systematic_name": systematic_name,
                "hansen_d": d,
                "hansen_p": p,
                "hansen_h": h,
                "molar_volume": mv,
                "page": page_for_line(i, marker_lines, marker_pages),
                "had_trailing_asterisk": had_asterisk,
                "name_en_truncated": name_truncated,
                "systematic_name_truncated": systematic_truncated,
            }
        )

    return rows, anomalies


def assign_keys(rows: list[dict]) -> None:
    """Mutates each row in place, adding a stable, unique `key` slug."""
    used: set[str] = set()
    for row in rows:
        base = slugify(row["name_en"])
        key = disambiguate_key(base, used, suffix=row["book_no"])
        used.add(key)
        row["key"] = key


def write_csv(rows: list[dict], out_path: Path) -> None:
    with out_path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=SOLVENT_FIELDNAMES)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "key": row["key"],
                    "name_en": row["name_en"],
                    "systematic_name": row["systematic_name"] or "",
                    "cas_number": "",
                    "hansen_d": row["hansen_d"],
                    "hansen_p": row["hansen_p"],
                    "hansen_h": row["hansen_h"],
                    "molar_volume": "" if row["molar_volume"] is None else row["molar_volume"],
                    "book_no": row["book_no"],
                    "page": "" if row["page"] is None else row["page"],
                    "had_trailing_asterisk": "y" if row["had_trailing_asterisk"] else "",
                    "name_en_truncated": "y" if row["name_en_truncated"] else "",
                    "systematic_name_truncated": "y" if row["systematic_name_truncated"] else "",
                    "note": "",
                }
            )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF_PATH)
    parser.add_argument("--out", type=Path, default=DEFAULT_CSV_PATH)
    args = parser.parse_args()

    text = run_pdftotext(args.pdf)
    rows, anomalies = parse_rows(text)
    assign_keys(rows)

    out_of_bounds = [
        r
        for r in rows
        if not (0 <= r["hansen_d"] <= 60 and 0 <= r["hansen_p"] <= 60 and 0 <= r["hansen_h"] <= 60)
        or (r["molar_volume"] is not None and not (0 < r["molar_volume"] < 2000))
    ]

    write_csv(rows, args.out)

    print(f"Parsed {len(rows)} data rows from {TABLE_TITLE} ({args.pdf.name}).")
    print(f"Wrote {args.out}")
    print(f"Rows with molar_volume omitted by the handbook: {sum(1 for r in rows if r['molar_volume'] is None)}")
    print(f"Rows with a truncated systematic_name (ends in '-'): {sum(1 for r in rows if r['systematic_name_truncated'])}")
    print(f"Rows with a truncated name_en (unmatched parenthesis): {sum(1 for r in rows if r['name_en_truncated'])}")
    print(f"Rows with a footnote asterisk stripped from the name: {sum(1 for r in rows if r['had_trailing_asterisk'])}")
    if out_of_bounds:
        print(f"\nWARNING: {len(out_of_bounds)} row(s) fall outside the DB's plausibility CHECK "
              "constraints (Hansen params 0-60, molar_volume 0-2000) -- these will be rejected "
              "on import. This means a parser bug, not real chemistry:")
        for r in out_of_bounds:
            print(f"  - No. {r['book_no']} {r['name_en']}: d={r['hansen_d']} p={r['hansen_p']} "
                  f"h={r['hansen_h']} mv={r['molar_volume']}")
    if anomalies:
        print(f"\n{len(anomalies)} line(s) started with what looked like a book number but did not "
              "parse as a data row -- inspect these by hand (usually a page-number/header line):")
        for line_no, raw in anomalies:
            print(f"  - line {line_no}: {raw.strip()!r}")


if __name__ == "__main__":
    main()
