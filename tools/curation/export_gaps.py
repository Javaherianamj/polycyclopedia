"""Exports the citation work list to curation/gaps.csv and the bibliography
to curation/sources.csv.

    python export_gaps.py                  # every unsourced material value
    python export_gaps.py --material ldpe   # one material only (pilot use)

Both files are written UTF-8 with a BOM (utf-8-sig) so Excel opens Persian
text (name_fa, note_fa) correctly instead of guessing a codepage and
mangling it -- see common.py's CSV_ENCODING comment.

gaps.csv covers `material` subjects only (subject_type = 'material'), per
curation-design.md section 2: U5 targets the generic material, not grades --
grade-level datasheet import is U6, out of scope here.

sources.csv is always the *full* bibliography (not filtered by --material):
sources aren't material-specific, and the curator may want to cite an
existing handbook for a material other than the one they last exported.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import csv

from common import (
    CSV_ENCODING,
    CURATION_DIR,
    GAPS_CSV_PATH,
    GAPS_FIELDNAMES,
    SOURCES_CSV_PATH,
    SOURCES_FIELDNAMES,
    disambiguate_key,
    format_current_value,
    format_number,
    get_connection,
    slugify_source_key,
)

GAPS_QUERY = """
    SELECT
        m.slug                AS material_slug,
        pd.key                AS property_key,
        pd.name_en            AS property_name_en,
        pd.name_fa            AS property_name_fa,
        pd.canonical_unit     AS unit,
        pd.plausible_min      AS plausible_min,
        pd.plausible_max      AS plausible_max,
        pv.value_min,
        pv.value_max,
        pv.value_typical,
        pv.value_text,
        pv.value_enum,
        pv.value_bool
    FROM property_value pv
    JOIN property_definition pd ON pd.id = pv.property_id
    JOIN material m ON pv.subject_type = 'material' AND m.id = pv.subject_id
    WHERE pv.status = 'unsourced'
      AND (%(material_slug)s::text IS NULL OR m.slug = %(material_slug)s)
    ORDER BY m.slug, pd.sort_order, pd.key;
"""

SOURCES_QUERY = """
    SELECT title, authors, publisher, edition, year, isbn, doi, url, kind, tier
    FROM source
    ORDER BY title, edition;
"""


def export_gaps(conn, material_slug: str | None, out_path: Path = GAPS_CSV_PATH) -> int:
    with conn.cursor() as cur:
        cur.execute(GAPS_QUERY, {"material_slug": material_slug})
        columns = [d.name for d in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]

    CURATION_DIR.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=GAPS_FIELDNAMES)
        writer.writeheader()
        for row in rows:
            csv_row = {field: "" for field in GAPS_FIELDNAMES}
            csv_row["material_slug"] = row["material_slug"]
            csv_row["property_key"] = row["property_key"]
            csv_row["property_name_en"] = row["property_name_en"] or ""
            csv_row["property_name_fa"] = row["property_name_fa"] or ""
            csv_row["unit"] = row["unit"] or ""
            csv_row["plausible_min"] = format_number(row["plausible_min"])
            csv_row["plausible_max"] = format_number(row["plausible_max"])
            csv_row["current_value"] = format_current_value(
                row["value_min"],
                row["value_max"],
                row["value_typical"],
                row["value_text"],
                row["value_enum"],
                row["value_bool"],
            )
            # confidence is left blank on purpose (not pre-filled with the
            # 0.9 default) -- import_values.py applies that default only
            # when the row is otherwise filled in. Pre-filling it here would
            # make every exported row look "touched", breaking the "blank
            # rows are skipped silently" rule for a curator working through
            # the file incrementally over days.
            writer.writerow(csv_row)

    return len(rows)


def export_sources(conn, out_path: Path = SOURCES_CSV_PATH) -> int:
    with conn.cursor() as cur:
        cur.execute(SOURCES_QUERY)
        columns = [d.name for d in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]

    used_keys: set[str] = set()
    CURATION_DIR.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=SOURCES_FIELDNAMES)
        writer.writeheader()
        for row in rows:
            key = slugify_source_key(row["title"], row["edition"])
            key = disambiguate_key(key, used_keys, suffix=str(row["year"]) if row["year"] else None)
            used_keys.add(key)
            writer.writerow(
                {
                    "source_key": key,
                    "title": row["title"],
                    "authors": row["authors"] or "",
                    "publisher": row["publisher"] or "",
                    "edition": row["edition"] or "",
                    "year": row["year"] or "",
                    "isbn": row["isbn"] or "",
                    "doi": row["doi"] or "",
                    "url": row["url"] or "",
                    "kind": row["kind"],
                    "tier": row["tier"],
                }
            )

    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--material",
        metavar="SLUG",
        default=None,
        help="Export gaps for one material only, e.g. ldpe. Default: all materials.",
    )
    # Path overrides exist so the test suite can write to an isolated
    # directory instead of clobbering the curator's in-progress worksheet.
    parser.add_argument("--gaps-csv", type=Path, default=GAPS_CSV_PATH)
    parser.add_argument("--sources-csv", type=Path, default=SOURCES_CSV_PATH)
    args = parser.parse_args()

    args.gaps_csv.parent.mkdir(parents=True, exist_ok=True)
    args.sources_csv.parent.mkdir(parents=True, exist_ok=True)

    conn = get_connection()
    try:
        gap_count = export_gaps(conn, args.material, args.gaps_csv)
        source_count = export_sources(conn, args.sources_csv)
        # Read-only session: nothing was written, but close the transaction
        # psycopg opened for the SELECTs cleanly.
        conn.rollback()
    finally:
        conn.close()

    scope = f"material={args.material}" if args.material else "all materials"
    print(f"Wrote {args.gaps_csv} ({gap_count} rows, {scope})")
    print(f"Wrote {args.sources_csv} ({source_count} rows)")


if __name__ == "__main__":
    main()
