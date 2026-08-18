"""Writes the CSV an extraction agent should fill in for one material --
every property that applies to it, one row each, already keyed correctly.

    python make_extraction_template.py pvc
    python make_extraction_template.py pvc --out /tmp/pvc-template.csv

Why this exists: handing an agent a blank column spec produces rows keyed to
properties that don't exist (`k_value`, `specific_gravity`, `tensile_modulus`),
values that contradict their own quoted evidence, and whole property groups
silently skipped because nothing told the agent they were wanted. Every one of
those happened on the first PP/PVC/PMMA pass. Pre-filling the property_key
column removes the entire class of error: the agent is filling in blanks
against a fixed list, not inventing a schema.

The `unit` and `plausible_min/max` columns are context for the agent, not
inputs -- they exist so it can see that `density` wants g/cm3 and will be
rejected at 1380, which is the other error we actually hit.

Scope is respected: a property restricted to certain fields/families is only
emitted for materials in them, so an amorphous polymer is never asked for
crystallinity.
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

from common import CSV_ENCODING, get_connection

# The agent-facing column contract. Deliberately not GAPS_FIELDNAMES: the
# exporter's report/name columns are noise for an extraction agent, and every
# extra column is one more thing for it to fill in wrongly.
TEMPLATE_FIELDS = [
    "material_slug",
    "grade_class",
    "grade_class_name_fa",
    "grade_class_name_en",
    "property_key",
    "unit",            # context only -- do not edit
    "plausible_min",   # context only -- do not edit
    "plausible_max",   # context only -- do not edit
    "value_min",
    "value_max",
    "value_typical",
    "qualifier",
    "source_key",
    "page",
    "table",
    "figure",
    "section",
    "test_method",
    "conditions",
    "note_en",
    "confidence",
    "role",
]

APPLICABLE_PROPERTIES = """
    SELECT pg.key AS group_key, pd.key, pd.canonical_unit, pd.data_type,
           pd.plausible_min, pd.plausible_max
      FROM material m
      JOIN field f ON f.id = m.field_id
      JOIN family fam ON fam.id = m.family_id
      JOIN property_definition pd
        ON (cardinality(pd.applies_to_fields)   = 0 OR f.key   = ANY(pd.applies_to_fields))
       AND (cardinality(pd.applies_to_families) = 0 OR fam.key = ANY(pd.applies_to_families))
      JOIN property_group pg ON pg.id = pd.group_id
     WHERE m.slug = %s
     ORDER BY pg.sort_order, pd.key;
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("material_slug")
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM material WHERE slug = %s;", (args.material_slug,))
        if cur.fetchone() is None:
            raise SystemExit(
                f"no material '{args.material_slug}'. Create it with import_materials.py first."
            )
        cur.execute(APPLICABLE_PROPERTIES, (args.material_slug,))
        rows = cur.fetchall()
    conn.close()

    out_path = args.out or Path(f"{args.material_slug}-extraction-template.csv")
    with out_path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=TEMPLATE_FIELDS)
        writer.writeheader()
        for _group, key, unit, data_type, pmin, pmax in rows:
            writer.writerow({
                "material_slug": args.material_slug,
                "property_key": key,
                # A text-typed property can be cited but its value can't be set
                # through this CSV -- say so in the row rather than letting the
                # agent fill in a number that will be rejected on import.
                "unit": unit or ("(text -- citation only)" if data_type == "text" else ""),
                "plausible_min": "" if pmin is None else pmin,
                "plausible_max": "" if pmax is None else pmax,
            })

    text_count = sum(1 for r in rows if r[3] == "text")
    print(f"wrote {out_path} -- {len(rows)} properties for '{args.material_slug}' "
          f"({len(rows) - text_count} numeric, {text_count} text/citation-only)")


if __name__ == "__main__":
    sys.exit(main())
