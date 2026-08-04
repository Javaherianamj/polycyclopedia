"""Exports the citation work list to curation/gaps.csv and the bibliography
to curation/sources.csv.

    python export_gaps.py                          # every unsourced material value
    python export_gaps.py --material ldpe           # one material only (pilot use)
    python export_gaps.py --include-missing         # also rows with no value at all
    python export_gaps.py --material ldpe --preset polyolefins
                                                     # one polymer's file, curated
                                                     # to the ~28 "solid" polyolefin
                                                     # properties instead of all 61
                                                     # in the registry -- written to
                                                     # curation/ldpe.csv, not the
                                                     # shared curation/gaps.csv,
                                                     # since --material was given
                                                     # (see --gaps-csv below)

Both files are written UTF-8 with a BOM (utf-8-sig) so Excel opens Persian
text (name_fa, note_fa) correctly instead of guessing a codepage and
mangling it -- see common.py's CSV_ENCODING comment.

--preset (default: none, unchanged existing behaviour -- every applicable
property is offered) narrows the property list to one of family_presets.py's
curated sets. Same column shape as always (common.GAPS_FIELDNAMES); only the
row count changes. This exists because handing a curator all 61 properties at
once is what made the file overwhelming to work with -- the fix is a shorter,
family-appropriate property list, not a different file shape.

gaps.csv covers `material` subjects only (subject_type = 'material'), per
curation-design.md section 2: U5 targets the generic material, not grades --
grade-level datasheet import is U6, out of scope here.

sources.csv is always the *full* bibliography (not filtered by --material):
sources aren't material-specific, and the curator may want to cite an
existing handbook for a material other than the one they last exported.

--include-missing (default off, so the plain export a curator already knows
is unchanged) also emits a row for every (material, property_definition)
pair that has *no* property_value row at all yet -- not just the unsourced
ones. This is what makes a material created by import_materials.py usable:
right after creation it has zero property_value rows, so without this flag
a fresh export shows nothing for it at all, current_value is blank for
these rows (there's nothing to compare against), and pd.applies_to_fields
is respected -- a property scoped to certain fields is only offered to
materials in one of those fields; an empty applies_to_fields means it
applies to every field, unchanged from today's behaviour.
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
from family_presets import FAMILY_PRESETS

GAPS_QUERY = """
    SELECT
        m.slug                AS material_slug,
        pd.key                AS property_key,
        pd.name_en            AS property_name_en,
        pd.name_fa            AS property_name_fa,
        pd.canonical_unit     AS unit,
        pd.plausible_min      AS plausible_min,
        pd.plausible_max      AS plausible_max,
        pd.sort_order         AS sort_order,
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
      AND (%(preset_keys)s::text[] IS NULL OR pd.key = ANY(%(preset_keys)s))
"""

# --include-missing only: every (material, property_definition) pair with no
# property_value row at all -- regardless of status, since "no row" and "a
# row that happens to be unsourced" are different gaps (the former is what a
# brand-new material has for every property). applies_to_fields is honoured
# the same way the UI would honour it: empty means "applies to every field",
# otherwise the material's field key must be in the array.
GAPS_MISSING_QUERY = """
    SELECT
        m.slug                 AS material_slug,
        pd.key                 AS property_key,
        pd.name_en             AS property_name_en,
        pd.name_fa             AS property_name_fa,
        pd.canonical_unit      AS unit,
        pd.plausible_min       AS plausible_min,
        pd.plausible_max       AS plausible_max,
        pd.sort_order          AS sort_order,
        NULL::double precision AS value_min,
        NULL::double precision AS value_max,
        NULL::double precision AS value_typical,
        NULL::text             AS value_text,
        NULL::text             AS value_enum,
        NULL::boolean          AS value_bool
    FROM material m
    JOIN field f ON f.id = m.field_id
    CROSS JOIN property_definition pd
    WHERE (%(material_slug)s::text IS NULL OR m.slug = %(material_slug)s)
      AND (pd.applies_to_fields = '{}' OR f.key = ANY(pd.applies_to_fields))
      AND (%(preset_keys)s::text[] IS NULL OR pd.key = ANY(%(preset_keys)s))
      AND NOT EXISTS (
          SELECT 1 FROM property_value pv
          WHERE pv.subject_type = 'material'
            AND pv.subject_id = m.id
            AND pv.property_id = pd.id
      )
"""

SOURCES_QUERY = """
    SELECT title, authors, publisher, edition, year, isbn, doi, url, kind, tier
    FROM source
    ORDER BY title, edition;
"""


def export_gaps(
    conn,
    material_slug: str | None,
    out_path: Path = GAPS_CSV_PATH,
    include_missing: bool = False,
    preset: str | None = None,
) -> int:
    if preset is not None and preset not in FAMILY_PRESETS:
        raise ValueError(
            f"unknown preset {preset!r}; choose one of {sorted(FAMILY_PRESETS)}"
        )
    preset_keys = FAMILY_PRESETS[preset] if preset is not None else None
    params = {"material_slug": material_slug, "preset_keys": preset_keys}

    with conn.cursor() as cur:
        cur.execute(GAPS_QUERY, params)
        columns = [d.name for d in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]

    if include_missing:
        with conn.cursor() as cur:
            cur.execute(GAPS_MISSING_QUERY, params)
            columns = [d.name for d in cur.description]
            rows.extend(dict(zip(columns, row)) for row in cur.fetchall())
        rows.sort(key=lambda r: (r["material_slug"], r["sort_order"], r["property_key"]))

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
    parser.add_argument(
        "--include-missing",
        action="store_true",
        help=(
            "Also include (material, property) pairs with no property_value row at all "
            "yet, not just unsourced ones. current_value is blank for these. This is what "
            "makes a material just created by import_materials.py show up in gaps.csv. "
            "Default: off, unchanged existing behaviour."
        ),
    )
    parser.add_argument(
        "--preset",
        choices=sorted(FAMILY_PRESETS),
        default=None,
        help=(
            "Narrow the property list to a curated, family-appropriate set "
            "(see family_presets.py) instead of every applicable property. "
            "Same columns, fewer rows. Default: none, unchanged existing behaviour."
        ),
    )
    # Path overrides exist so the test suite can write to an isolated
    # directory instead of clobbering the curator's in-progress worksheet.
    # --gaps-csv defaults to None here (not GAPS_CSV_PATH) so main() can tell
    # "the curator didn't pass one" apart from "they explicitly asked for
    # curation/gaps.csv" -- the former gets the one-file-per-polymer default
    # below when --material is set; an explicit path always wins either way.
    parser.add_argument("--gaps-csv", type=Path, default=None)
    parser.add_argument("--sources-csv", type=Path, default=SOURCES_CSV_PATH)
    args = parser.parse_args()

    if args.gaps_csv is not None:
        gaps_csv = args.gaps_csv
    elif args.material:
        gaps_csv = CURATION_DIR / f"{args.material}.csv"
    else:
        gaps_csv = GAPS_CSV_PATH

    gaps_csv.parent.mkdir(parents=True, exist_ok=True)
    args.sources_csv.parent.mkdir(parents=True, exist_ok=True)

    conn = get_connection()
    try:
        gap_count = export_gaps(
            conn, args.material, gaps_csv, args.include_missing, args.preset
        )
        source_count = export_sources(conn, args.sources_csv)
        # Read-only session: nothing was written, but close the transaction
        # psycopg opened for the SELECTs cleanly.
        conn.rollback()
    finally:
        conn.close()

    scope = f"material={args.material}" if args.material else "all materials"
    if args.preset:
        scope += f", preset={args.preset}"
    print(f"Wrote {gaps_csv} ({gap_count} rows, {scope})")
    print(f"Wrote {args.sources_csv} ({source_count} rows)")


if __name__ == "__main__":
    main()
