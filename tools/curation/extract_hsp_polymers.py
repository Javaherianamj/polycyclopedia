"""Extracts Appendix A, Table A.2 (Hansen Solubility Parameters for Selected
Correlations) from Hansen's *Hansen Solubility Parameters: A User's
Handbook* (2nd ed.) into a reviewable CSV.

    python extract_hsp_polymers.py                 # curation/hsp.pdf -> curation/hsp-polymers.csv
    python extract_hsp_polymers.py --pdf other.pdf --out other.csv

Sibling to extract_hsp.py (Table A.1, the solvent list) -- same one-shot,
review-then-import workflow, same "flag rather than guess" posture. Table
A.2 is structurally simpler than A.1 in one respect (every real data row
prints exactly 4 trailing numeric tokens -- Dispersion, Polar, Hydrogen
Bonding, Interaction Radius) but adds three hazards A.1 does not have:

1. SECTION HEADERS interleaved between rows. Table A.2 groups rows under
   centred, un-numbered headings ("Cellulose Acetobutyrate", "Epoxy Curing
   Agents", "Miscellaneous - Solvent Range", ...) that describe the rows
   that follow until the next heading. These are captured into the
   `section` column and never parsed as data.

2. "COLUMN DRIFT" that turns out not to be real. The task brief for this
   extractor calls out row 308, "PVBE 16.70   3.70  8.30  8.60", as a
   hazard: the printed layout puts the Dispersion value close enough to
   the name that a position-based (fixed-column) parser would misread it
   as part of the name and only find 3 aligned numbers. This parser is
   token-based, not position-based -- it takes the LAST 4 whitespace-
   separated numeric tokens on the line as the four Hansen values,
   whatever their column position, and everything before that as the name.
   For PVBE this recovers all 4 real values correctly (verified against
   the printed page: D=16.70, P=3.70, H=8.30, R0=8.60). Confirmed by hand
   that all 466 numbered rows in the table yield exactly 4 trailing
   numeric tokens with this approach -- see the module's own extraction
   summary for the authoritative count. A row that somehow yields a
   different count is still flagged, never guessed at (this is a defensive
   fallback, not observed in this edition's printed text).

3. UNCERTAINTY MARKERS ("?", "??") fused into the polymer name, not printed
   as a separate column, e.g. "SILICONE DC-1107?", "ESTANE X-7 ?? DIOXANE
   ONLY", "PEO 4000 ? HEATED SAMPLES". These are Hansen's own confidence
   flags on that row (see "COMMENTS TO TABLE A.2" in the book) and carry
   real meaning -- preserved verbatim in name_raw AND extracted into the
   `uncertainty` column ("?" or "??") so downstream consumers can filter on
   confidence without re-parsing the name string.

Footnote letters fused to a name (e.g. "POLYCYCLOLa" = POLYCYCLOL + a
footnote marker referenced in "COMMENTS TO TABLE A.2") are left exactly as
printed in name_raw -- there is exactly one such case in this edition and
inventing a rule to strip it risks damaging a real trailing letter in some
other row's trade name (e.g. "...IC/1203" style names already end in
alphanumerics that look similar). Not guessed at, just preserved.

Two of Hansen's own correlations print a small negative Hydrogen Bonding
value (row 33 CARIFLEX IR 305: -0.82; row 177 PFA(?): -0.50) using a Unicode
en dash ("–") rather than an ASCII hyphen-minus for the sign. Both the
number regex and the CSV round-trip handle either sign character. These
rows still fail this table's own [0, 60] plausibility bound (mirrored from
extract_hsp.py / the DB's CHECK constraints) and are flagged, not imported
as-is -- see HANSEN_BOUND below and the printed "outside plausible range"
warning.

NOTE ON ROW COUNT
------------------
Table A.2 is not the ~454-row table suggested by early scoping notes; it is
466 rows, numbered 1-466 with no gaps and no duplicate numbers (verified by
hand -- see the printed extraction summary). It runs continuously across
printed pages 493-505 (PDF pages ~166-176), NOT alphabetically -- rows are
grouped by polymer/product family via the section headings described above.
`handbook_number` is kept as a traceability column only, exactly as
`book_no` is for Table A.1.
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
DEFAULT_CSV_PATH = REPO_ROOT / "curation" / "hsp-polymers.csv"

TABLE_TITLE = "TABLE A.2"
TABLE_END_MARKER = "Appendix A: Table A.3"

# Page-marker patterns, identical in form to extract_hsp.py's (same book,
# same running-header convention): "Appendix A: Table A.2  <page>" on odd
# pages, "<page>  Hansen Solubility Parameters..." on even pages, both
# printed immediately before that page's table content. Verified by hand
# against several pages before trusting this for citation locators.
ODD_PAGE_MARKER_RE = re.compile(r"Appendix A: Table A\.2\s+(\d+)\s*$")
EVEN_PAGE_MARKER_RE = re.compile(r"^(\d+)\s+Hansen Solubility Parameters")

# A data row: leading handbook Number, then a name blob, then exactly 4
# trailing numeric tokens (Dispersion, Polar, Hydrogen Bonding, Interaction
# Radius). Token-based, not position-based -- see module docstring point 2
# for why this matters (row 308 / PVBE). Numbers may be signed with either
# an ASCII hyphen-minus or a Unicode en dash (docstring paragraph on rows
# 33 and 177).
SIGNED_NUMBER = r"[-–]?\d+(?:\.\d+)?"
ROW_RE_4 = re.compile(rf"^\s*(\d+)\s+(.+\S)\s+((?:{SIGNED_NUMBER}\s+){{3}}{SIGNED_NUMBER})\s*$")
# Fallback used only to detect (and flag, never guess-fill) a genuine
# column-drift row that yields some other count of trailing numbers.
ANY_NUMBER_RE = re.compile(SIGNED_NUMBER)
LEADING_DIGIT_RE = re.compile(r"^\s*\d+\s+\S")

# Lines that look structural (no leading row number) but are page furniture,
# not section headings, and must never become a `section` value. Matched by
# substring/prefix, not equality, because the running header's numeric
# suffix and mid-word wraps vary page to page.
STRUCTURAL_LINE_MARKERS = (
    "Appendix A: Table A.2",
    "Appendix A: Table A.3",
    "TABLE A.2",
    "Hansen Solubility Parameters",  # both the even-page marker and the table subtitle
    "Number",  # column header repeated on every continuation page
    "Hydrogen   Interaction",
    "Hydrogen    Interaction",
    "Hydrogen Interaction",
)

UNCERTAINTY_RE = re.compile(r"\?\?|\?")

HSP_POLYMER_FIELDNAMES = [
    "key",
    "handbook_number",
    "name_raw",
    "hansen_d",
    "hansen_p",
    "hansen_h",
    "r0",
    "page",
    "section",
    "uncertainty",
    "note",
]


def run_pdftotext(pdf_path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"],
        capture_output=True,
        check=True,
    )
    return result.stdout.decode("utf-8", errors="replace")


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
    return s or "hsp-correlation"


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


def is_structural_line(stripped: str) -> bool:
    return any(stripped.startswith(marker) or marker in stripped for marker in STRUCTURAL_LINE_MARKERS)


def is_section_heading(stripped: str) -> bool:
    """A section heading is a non-blank, non-numbered, non-structural line
    with no trailing digits -- i.e. prose, not a data row and not page
    furniture. Anchored on "does not start with a row number" so it can
    never collide with the data-row regexes above."""
    if not stripped:
        return False
    if LEADING_DIGIT_RE.match(stripped):
        return False
    if is_structural_line(stripped):
        return False
    if "\x0c" in stripped:
        return False
    return True


def parse_rows(text: str) -> tuple[list[dict], list[tuple[int, str]]]:
    """Returns (rows, anomalies). Anomalies are (1-based line number, raw
    line) pairs for every line that starts with what looks like a handbook
    number but did not resolve into a data row with exactly 4 numerics --
    these must be accounted for by hand, never silently dropped or guessed."""
    lines = text.split("\n")
    marker_lines, marker_pages = build_page_index(lines)
    table_start, table_end = find_table_bounds(lines)

    rows: list[dict] = []
    anomalies: list[tuple[int, str]] = []
    current_section: str | None = None

    for i in range(table_start, table_end):
        line = lines[i]
        stripped = line.strip()

        if not LEADING_DIGIT_RE.match(line):
            if is_section_heading(stripped):
                current_section = stripped
            continue

        m = ROW_RE_4.match(line)
        if not m:
            if "\x0c" not in line and "Hansen Solubility Parameters" not in line:
                anomalies.append((i + 1, line))
            continue

        handbook_number, name_raw, numbers_blob = m.groups()
        numbers_blob_normalized = numbers_blob.replace("–", "-")
        floats = [float(t) for t in numbers_blob_normalized.split()]
        d, p, h, r0 = floats

        name_raw = name_raw.strip()
        uncertainty_match = UNCERTAINTY_RE.search(name_raw)
        uncertainty = uncertainty_match.group(0) if uncertainty_match else None

        rows.append(
            {
                "handbook_number": handbook_number,
                "name_raw": name_raw,
                "hansen_d": d,
                "hansen_p": p,
                "hansen_h": h,
                "r0": r0,
                "page": page_for_line(i, marker_lines, marker_pages),
                "section": current_section,
                "uncertainty": uncertainty,
                "note": None,
            }
        )

    return rows, anomalies


def flag_out_of_range(rows: list[dict]) -> list[dict]:
    """Adds a `note` for rows whose values fall outside the plausibility
    bound this table shares with the DB's CHECK constraints -- mirrors
    extract_hsp.py's stance exactly: still written to the CSV (never
    dropped) but flagged, and the importer will reject rather than import
    these. Never widened to make a row "fit"."""
    for row in rows:
        d, p, h, r0 = row["hansen_d"], row["hansen_p"], row["hansen_h"], row["r0"]
        if not (0 <= d <= 60 and 0 <= p <= 60 and 0 <= h <= 60):
            row["note"] = "out_of_range: a Hansen parameter is outside [0, 60] MPa^0.5"
        elif not (0 < r0 <= 60):
            row["note"] = "out_of_range: interaction radius r0 must be in (0, 60] MPa^0.5"
    return rows


def assign_keys(rows: list[dict]) -> None:
    """Mutates each row in place, adding a stable, unique `key` slug."""
    used: set[str] = set()
    for row in rows:
        base = slugify(row["name_raw"])
        key = disambiguate_key(base, used, suffix=row["handbook_number"])
        used.add(key)
        row["key"] = key


def write_csv(rows: list[dict], out_path: Path) -> None:
    with out_path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=HSP_POLYMER_FIELDNAMES)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "key": row["key"],
                    "handbook_number": row["handbook_number"],
                    "name_raw": row["name_raw"],
                    "hansen_d": row["hansen_d"],
                    "hansen_p": row["hansen_p"],
                    "hansen_h": row["hansen_h"],
                    "r0": row["r0"],
                    "page": "" if row["page"] is None else row["page"],
                    "section": row["section"] or "",
                    "uncertainty": row["uncertainty"] or "",
                    "note": row["note"] or "",
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
    rows = flag_out_of_range(rows)

    write_csv(rows, args.out)

    flagged = [r for r in rows if r["note"]]
    uncertain = [r for r in rows if r["uncertainty"]]
    numbers = sorted(int(r["handbook_number"]) for r in rows)

    print(f"Parsed {len(rows)} data rows from {TABLE_TITLE} ({args.pdf.name}).")
    print(f"Wrote {args.out}")
    if numbers:
        print(f"handbook_number range: {numbers[0]}-{numbers[-1]} ({len(set(numbers))} distinct numbers)")
        missing = sorted(set(range(numbers[0], numbers[-1] + 1)) - set(numbers))
        if missing:
            print(f"  gaps in the numbering: {missing}")
        dups = sorted({n for n in numbers if numbers.count(n) > 1})
        if dups:
            print(f"  duplicate handbook_number(s): {dups}")
    print(f"Rows with an uncertainty marker ('?' or '??') in the name: {len(uncertain)}")
    print(f"Rows flagged out-of-range (not silently imported -- see 'note' column): {len(flagged)}")
    for r in flagged:
        print(f"  - No. {r['handbook_number']} {r['name_raw']}: d={r['hansen_d']} p={r['hansen_p']} "
              f"h={r['hansen_h']} r0={r['r0']} -- {r['note']}")
    if anomalies:
        print(f"\n{len(anomalies)} line(s) started with what looked like a handbook number but did not "
              "parse as a data row with exactly 4 numerics -- inspect these by hand:")
        for line_no, raw in anomalies:
            print(f"  - line {line_no}: {raw.strip()!r}")
    else:
        print("\nNo anomalous lines (every numbered line yielded exactly 4 trailing numerics).")


if __name__ == "__main__":
    main()
