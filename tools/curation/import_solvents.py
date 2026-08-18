"""Imports curation/hsp-solvents.csv (Hansen's handbook, Appendix A Table
A.1) into the `solvent` table, inside a single transaction.

    python import_solvents.py --dry-run     # validate + report, write nothing
    python import_solvents.py                # validate + write, one transaction

Distinct from import_values.py by design: solvents are their own table
(migration 0027), not property_value rows, so there is no gaps.csv-style
per-property grouping here -- one CSV row is one solvent, one citation, one
evidence row. What IS shared with import_values.py's contract:

* Idempotent by natural key. `solvent.key` is UNIQUE; re-running this
  script upserts by key (INSERT ... ON CONFLICT (key) DO UPDATE) instead of
  creating duplicates. A solvent that already carries evidence is left
  alone there -- re-running never doubles up citations for a row that's
  already sourced.
* The handbook itself is created as a `source` row on first run (matched
  by (title, edition), same natural key import_values.py's
  resolve_source_id relies on), and reused on every subsequent run.
* Every solvent gets a citation with a real page locator -- Table A.1 spans
  printed pages 347-483, and extract_hsp.py recovered the actual page each
  row is printed on from the book's running headers (see that script's
  page_for_line -- verified by hand against ~10 pages), not just
  "somewhere in the table". role='primary', extraction_method=
  'table_parser' (this data was mechanically parsed from a printed table,
  not typed in by hand -- 'manual' would misrepresent how it was produced).
* The DB's CHECK constraints (solvent_hansen_plausible_chk,
  solvent_molar_volume_chk) are the last line of defense against a parser
  bug, per the task brief: a row IntegrityError rejects here, is reported
  by row and reason, and is never silently retried with widened bounds.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass
from pathlib import Path

from common import CSV_ENCODING, get_connection, is_blank

REPO_ROOT = Path(__file__).resolve().parents[2]
CURATION_DIR = REPO_ROOT / "curation"
DEFAULT_CSV_PATH = CURATION_DIR / "hsp-solvents.csv"

SOURCE_TITLE = "Hansen Solubility Parameters: A User's Handbook"
SOURCE_EDITION = "2nd"
SOURCE = {
    "kind": "handbook",
    "tier": "peer_reviewed_handbook",
    "title": SOURCE_TITLE,
    "authors": "Charles M. Hansen",
    "publisher": "CRC Press",
    "edition": SOURCE_EDITION,
    "year": 2007,
    "isbn": "978-0-8493-7248-3",
    "doi": None,
    "url": None,
}

CREATED_BY = "hsp-import"
DEFAULT_CONFIDENCE = 0.9
TABLE_LABEL = "A.1"

HANSEN_BOUND = 60.0
MOLAR_VOLUME_MAX = 2000.0


class RowError(Exception):
    def __init__(self, row_number: int, message: str, key: str | None = None):
        self.row_number = row_number
        self.message = message
        self.key = key
        super().__init__(self.render())

    def render(self) -> str:
        ctx = f" ({self.key})" if self.key else ""
        return f"Row {self.row_number}{ctx}: {self.message}"


@dataclass
class PlannedSolvent:
    row_number: int
    key: str
    name_en: str
    systematic_name: str | None
    cas_number: str | None
    hansen_d: float
    hansen_p: float
    hansen_h: float
    molar_volume: float | None
    page: int | None
    book_no: str


def load_csv(path: Path) -> list[tuple[int, dict]]:
    if not path.exists():
        raise SystemExit(f"{path} not found. Run extract_hsp.py first.")
    with path.open(newline="", encoding=CSV_ENCODING) as f:
        reader = csv.DictReader(f)
        return [(i, row) for i, row in enumerate(reader, start=2)]


def parse_float(raw: str, row_number: int, field: str, key: str) -> float:
    try:
        return float(raw)
    except (TypeError, ValueError):
        raise RowError(row_number, f"'{field}' value {raw!r} is not a number.", key)


def parse_optional_float(raw: str, row_number: int, field: str, key: str) -> float | None:
    if is_blank(raw):
        return None
    return parse_float(raw, row_number, field, key)


def validate_row(row_number: int, row: dict) -> PlannedSolvent:
    key = (row.get("key") or "").strip()
    if not key:
        raise RowError(row_number, "no 'key' given -- every solvent row needs a stable, unique slug.")
    name_en = (row.get("name_en") or "").strip()
    if not name_en:
        raise RowError(row_number, "no 'name_en' given.", key)

    d = parse_float(row.get("hansen_d") or "", row_number, "hansen_d", key)
    p = parse_float(row.get("hansen_p") or "", row_number, "hansen_p", key)
    h = parse_float(row.get("hansen_h") or "", row_number, "hansen_h", key)
    mv = parse_optional_float(row.get("molar_volume") or "", row_number, "molar_volume", key)

    # Mirror the DB's own CHECK constraints here so a bad row is reported
    # with the CSV row number and a plain-language reason, rather than
    # surfacing as a raw psycopg IntegrityError after the row's already
    # been through everything else. Never loosen these to make a row fit
    # (task instruction) -- a rejection here means re-check the PDF.
    for label, value in (("hansen_d", d), ("hansen_p", p), ("hansen_h", h)):
        if value < 0 or value > HANSEN_BOUND:
            raise RowError(
                row_number,
                f"{label}={value} is outside the plausible range [0, {HANSEN_BOUND}] MPa^0.5. "
                "This is almost certainly a parser column-shift, not real chemistry -- "
                "re-check this row against the PDF before overriding anything.",
                key,
            )
    if mv is not None and not (0 < mv < MOLAR_VOLUME_MAX):
        raise RowError(
            row_number,
            f"molar_volume={mv} is outside the plausible range (0, {MOLAR_VOLUME_MAX}) cm3/mol.",
            key,
        )

    page_raw = (row.get("page") or "").strip()
    page = int(page_raw) if page_raw else None

    return PlannedSolvent(
        row_number=row_number,
        key=key,
        name_en=name_en,
        systematic_name=(row.get("systematic_name") or "").strip() or None,
        cas_number=(row.get("cas_number") or "").strip() or None,
        hansen_d=d,
        hansen_p=p,
        hansen_h=h,
        molar_volume=mv,
        page=page,
        book_no=(row.get("book_no") or "").strip(),
    )


def resolve_source_id(conn) -> int:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM source WHERE title = %s AND COALESCE(edition, '') = %s;",
            (SOURCE["title"], SOURCE["edition"] or ""),
        )
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute(
            """
            INSERT INTO source (kind, tier, title, authors, publisher, edition, year, isbn, doi, url)
            VALUES (%(kind)s, %(tier)s, %(title)s, %(authors)s, %(publisher)s, %(edition)s,
                    %(year)s, %(isbn)s, %(doi)s, %(url)s)
            RETURNING id;
            """,
            SOURCE,
        )
        return cur.fetchone()[0]


def resolve_source_document_id(conn, source_id: int) -> int:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM source_document WHERE source_id = %s AND storage_key IS NULL LIMIT 1;",
            (source_id,),
        )
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute(
            "INSERT INTO source_document (source_id, storage_key) VALUES (%s, NULL) RETURNING id;",
            (source_id,),
        )
        return cur.fetchone()[0]


def load_existing_solvents(conn) -> dict[str, int]:
    with conn.cursor() as cur:
        cur.execute("SELECT key, id FROM solvent;")
        return dict(cur.fetchall())


def load_solvents_with_evidence(conn) -> set[int]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT DISTINCT subject_id FROM evidence WHERE subject_type = 'solvent';"
        )
        return {row[0] for row in cur.fetchall()}


def upsert_solvent(conn, plan: PlannedSolvent) -> tuple[int, bool]:
    """Returns (solvent_id, was_inserted)."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO solvent (key, name_en, systematic_name, cas_number,
                                  hansen_d, hansen_p, hansen_h, molar_volume, status)
            VALUES (%(key)s, %(name_en)s, %(systematic_name)s, %(cas_number)s,
                    %(hansen_d)s, %(hansen_p)s, %(hansen_h)s, %(molar_volume)s, 'published')
            ON CONFLICT (key) DO UPDATE SET
                name_en = EXCLUDED.name_en,
                systematic_name = EXCLUDED.systematic_name,
                cas_number = COALESCE(EXCLUDED.cas_number, solvent.cas_number),
                hansen_d = EXCLUDED.hansen_d,
                hansen_p = EXCLUDED.hansen_p,
                hansen_h = EXCLUDED.hansen_h,
                molar_volume = EXCLUDED.molar_volume
            RETURNING id, (xmax = 0) AS was_inserted;
            """,
            {
                "key": plan.key,
                "name_en": plan.name_en,
                "systematic_name": plan.systematic_name,
                "cas_number": plan.cas_number,
                "hansen_d": plan.hansen_d,
                "hansen_p": plan.hansen_p,
                "hansen_h": plan.hansen_h,
                "molar_volume": plan.molar_volume,
            },
        )
        solvent_id, was_inserted = cur.fetchone()
    return solvent_id, was_inserted


def insert_citation_and_evidence(conn, solvent_id: int, plan: PlannedSolvent, source_document_id: int) -> None:
    locator = {"table": TABLE_LABEL}
    if plan.page is not None:
        locator["page"] = plan.page
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO citation (source_document_id, locator) VALUES (%s, %s) RETURNING id;",
            (source_document_id, json.dumps(locator)),
        )
        citation_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO evidence (subject_type, subject_id, citation_id, role,
                                   extraction_method, confidence, created_by)
            VALUES ('solvent', %s, %s, 'primary', 'table_parser', %s, %s);
            """,
            (solvent_id, citation_id, DEFAULT_CONFIDENCE, CREATED_BY),
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV_PATH)
    parser.add_argument("--dry-run", action="store_true", help="Validate and report; write nothing.")
    args = parser.parse_args()

    csv_rows = load_csv(args.csv)

    errors: list[RowError] = []
    plans: list[PlannedSolvent] = []
    seen_keys: dict[str, int] = {}
    for row_number, row in csv_rows:
        try:
            plan = validate_row(row_number, row)
        except RowError as exc:
            errors.append(exc)
            continue
        if plan.key in seen_keys:
            errors.append(
                RowError(
                    row_number,
                    f"duplicate key '{plan.key}' -- already used on row {seen_keys[plan.key]}. "
                    "Keys must be unique within the CSV.",
                    plan.key,
                )
            )
            continue
        seen_keys[plan.key] = row_number
        plans.append(plan)

    print(f"{len(csv_rows)} rows read: {len(plans)} valid, {len(errors)} rejected.")
    if errors:
        print(f"\n{len(errors)} row(s) rejected:")
        for err in errors:
            print(f"  - {err.render()}")

    exit_code = 1 if errors else 0

    if not plans:
        print("\nNothing to import.")
        sys.exit(exit_code)

    conn = get_connection()
    try:
        source_id = resolve_source_id(conn)
        source_document_id = resolve_source_document_id(conn, source_id)
        existing = load_existing_solvents(conn)
        already_cited = load_solvents_with_evidence(conn)

        inserted = 0
        updated = 0
        cited = 0
        skipped_citation = 0
        write_errors: list[RowError] = []

        for plan in plans:
            try:
                solvent_id, was_inserted = upsert_solvent(conn, plan)
            except Exception as exc:  # noqa: BLE001 -- surfaced as a per-row report, not a crash
                write_errors.append(RowError(plan.row_number, f"database rejected this row: {exc}", plan.key))
                continue
            if was_inserted:
                inserted += 1
            else:
                updated += 1

            if solvent_id in already_cited:
                skipped_citation += 1
                continue
            insert_citation_and_evidence(conn, solvent_id, plan, source_document_id)
            already_cited.add(solvent_id)
            cited += 1

        if write_errors:
            conn.rollback()
            print(f"\n{len(write_errors)} row(s) failed at the database (transaction rolled back, "
                  "nothing written):")
            for err in write_errors:
                print(f"  - {err.render()}")
            sys.exit(1)

        if args.dry_run:
            conn.rollback()
            print(f"\nDRY RUN -- would insert {inserted}, update {updated}, add {cited} new citation(s) "
                  f"({skipped_citation} already had evidence, citation skipped). Nothing committed.")
            sys.exit(exit_code)

        conn.commit()
        print(f"\nCommitted: {inserted} inserted, {updated} updated, {cited} new citation(s) added "
              f"({skipped_citation} solvent(s) already had evidence, citation skipped).")
        sys.exit(exit_code)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
