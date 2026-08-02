"""Reads curation/polypedia-curation.xlsx back into gaps.csv + sources.csv,
then delegates to import_values.py's own main() so the existing validation
(V1-V10) and transactional guarantees apply completely unchanged.

    python import_workbook.py --dry-run    # validate + report, write nothing
    python import_workbook.py               # validate + write, one transaction

This module deliberately does not reimplement any validation itself -- it
only converts an Excel worksheet into the same CSV shape import_values.py
already expects, handling the Excel-specific quirks that don't exist in a
plain CSV:

* A curator column formatted as Text can still hand back a number with
  stray leading/trailing whitespace -- stripped before it ever reaches
  import_values.py, same as a hand-edited CSV would need.
* Excel silently reinterprets some plain-looking input (a bare page number
  in particular) as a date and reformats the cell. openpyxl hands that back
  as a datetime.date/datetime -- caught here and turned into a plain-
  language error naming the exact cell, instead of a cryptic type error or
  (worse) a wrong value written to the database.
* A blank cell comes back from openpyxl as None; import_values.py already
  treats None and "" the same way via common.is_blank, but the CSV this
  script writes normalizes to "" either way so the two files are never
  distinguishable to a diff.

Only the "Values" and "Sources" sheets are read -- "Instructions" is for the
curator, not for this script.
"""
from __future__ import annotations

import argparse
import csv
import datetime
import sys
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.worksheet.worksheet import Worksheet

import import_values
from common import (
    CSV_ENCODING,
    GAPS_CSV_PATH,
    GAPS_FIELDNAMES,
    SOURCES_CSV_PATH,
    SOURCES_FIELDNAMES,
    format_number,
)
from export_workbook import WORKBOOK_PATH


class WorkbookCellError(Exception):
    """A single cell's value can't be trusted as-is -- e.g. Excel turned it
    into a date. Carries an already-rendered, cell-addressed message."""


def _render_date(value: datetime.date | datetime.datetime) -> str:
    if isinstance(value, datetime.datetime) and value.time() != datetime.time(0, 0):
        return value.isoformat(sep=" ")
    if isinstance(value, datetime.datetime):
        return value.date().isoformat()
    return value.isoformat()


def cell_text(sheet_title: str, cell) -> str:
    """Renders one openpyxl cell as the plain string import_values.py's CSV
    reader expects, or raises WorkbookCellError with a cell-addressed,
    plain-language message if the value can't be trusted.
    """
    value = cell.value
    if value is None:
        return ""
    if isinstance(value, (datetime.date, datetime.datetime)):
        raise WorkbookCellError(
            f"{sheet_title}!{cell.coordinate} looks like a date ({_render_date(value)}). "
            "Format the column as Text or Number and re-enter the value."
        )
    if isinstance(value, bool):
        # Only reachable if a curator types TRUE/FALSE somewhere odd -- no
        # column in this workbook is a checkbox. Render defensively rather
        # than crash.
        return "y" if value else ""
    if isinstance(value, (int, float)):
        return format_number(value)
    # str, or anything else openpyxl might hand back -- strip stray
    # whitespace, the one Excel quirk a plain CSV wouldn't have (a cell
    # formatted as Text that a curator typed " 0.925 " into).
    return str(value).strip()


def _row_is_blank(row_cells, width: int) -> bool:
    return all(c.value is None for c in row_cells[:width])


def read_values_sheet(ws: Worksheet) -> tuple[list[dict], list[str]]:
    header = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    expected = GAPS_FIELDNAMES
    if header[: len(expected)] != expected:
        raise SystemExit(
            "Values sheet header doesn't match the expected columns -- was it edited?\n"
            f"  expected: {expected}\n  found:    {header[: len(expected)]}"
        )

    rows: list[dict] = []
    errors: list[str] = []
    for row_cells in ws.iter_rows(min_row=2):
        if _row_is_blank(row_cells, len(expected)):
            continue
        row_dict: dict[str, str] = {}
        for field, cell in zip(expected, row_cells):
            try:
                row_dict[field] = cell_text("Values", cell)
            except WorkbookCellError as exc:
                errors.append(str(exc))
                row_dict[field] = ""
        rows.append(row_dict)
    return rows, errors


def read_sources_sheet(ws: Worksheet) -> tuple[list[dict], list[str]]:
    header = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    expected = SOURCES_FIELDNAMES
    if header[: len(expected)] != expected:
        raise SystemExit(
            "Sources sheet header doesn't match the expected columns -- was it edited?\n"
            f"  expected: {expected}\n  found:    {header[: len(expected)]}"
        )

    rows: list[dict] = []
    errors: list[str] = []
    for row_cells in ws.iter_rows(min_row=2):
        if _row_is_blank(row_cells, len(expected)):
            continue
        row_dict: dict[str, str] = {}
        for field, cell in zip(expected, row_cells):
            try:
                row_dict[field] = cell_text("Sources", cell)
            except WorkbookCellError as exc:
                errors.append(str(exc))
                row_dict[field] = ""
        # A row that's blank apart from formatting/leftover width still
        # shouldn't become a bibliography entry with no key.
        if row_dict.get("source_key") or row_dict.get("title"):
            rows.append(row_dict)
    return rows, errors


def write_csv(rows: list[dict], fieldnames: list[str], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def workbook_to_csvs(workbook_path: Path, gaps_csv_path: Path, sources_csv_path: Path) -> tuple[int, int]:
    """Reads the Values/Sources sheets and writes gaps.csv/sources.csv.
    Raises SystemExit (with every problem cell listed) if any cell couldn't
    be trusted -- nothing is written in that case, mirroring
    import_values.py's own "reject rather than guess" stance.
    """
    if not workbook_path.exists():
        raise SystemExit(f"Workbook not found at {workbook_path}. Run export_workbook.py first.")

    wb = load_workbook(workbook_path, data_only=True)
    for required in ("Values", "Sources"):
        if required not in wb.sheetnames:
            raise SystemExit(
                f"Workbook has no '{required}' sheet -- was it exported by export_workbook.py?"
            )

    gaps_rows, gaps_errors = read_values_sheet(wb["Values"])
    sources_rows, sources_errors = read_sources_sheet(wb["Sources"])

    errors = gaps_errors + sources_errors
    if errors:
        lines = "\n".join(f"  - {e}" for e in errors)
        raise SystemExit(
            f"{len(errors)} cell(s) in the workbook need fixing before this can be imported:\n{lines}"
        )

    write_csv(gaps_rows, GAPS_FIELDNAMES, gaps_csv_path)
    write_csv(sources_rows, SOURCES_FIELDNAMES, sources_csv_path)
    return len(gaps_rows), len(sources_rows)


def run_import(gaps_csv_path: Path, sources_csv_path: Path, dry_run: bool) -> None:
    """Delegates to import_values.main() -- literally the same entry point
    the CSV workflow uses, so every validation rule (V1-V10) and the
    transactional write path run completely unchanged. Only sys.argv is
    swapped so import_values' own argparse sees the paths we just wrote.
    """
    argv = [
        "import_values.py",
        "--gaps-csv", str(gaps_csv_path),
        "--sources-csv", str(sources_csv_path),
    ]
    if dry_run:
        argv.append("--dry-run")
    old_argv = sys.argv
    sys.argv = argv
    try:
        import_values.main()
    finally:
        sys.argv = old_argv


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workbook", type=Path, default=WORKBOOK_PATH, help="Input .xlsx path.")
    parser.add_argument("--gaps-csv", type=Path, default=GAPS_CSV_PATH)
    parser.add_argument("--sources-csv", type=Path, default=SOURCES_CSV_PATH)
    parser.add_argument("--dry-run", action="store_true", help="Validate and report; write nothing.")
    args = parser.parse_args()

    gap_count, source_count = workbook_to_csvs(args.workbook, args.gaps_csv, args.sources_csv)
    print(
        f"Wrote {args.gaps_csv} ({gap_count} rows) and {args.sources_csv} ({source_count} rows) "
        f"from {args.workbook}"
    )

    run_import(args.gaps_csv, args.sources_csv, args.dry_run)


if __name__ == "__main__":
    main()
