"""Creates (or updates) materials from curation/new_materials.csv -- the
counterpart to gaps.csv/import_values.py for the *other* gap in the
curation workflow: gaps.csv can only ever ask about materials that already
exist in the database, so there was previously no way for a domain expert
to add a brand-new polymer (another grade family like PP, or a wholly new
material like PLA) without writing SQL.

    python import_materials.py --template   # writes curation/new_materials.csv with a header + example row
    python import_materials.py --dry-run    # validate + report, write nothing
    python import_materials.py              # validate + write, one transaction

Typical flow for adding a new polymer end to end:

    1. python import_materials.py --template
    2. Fill in a row in curation/new_materials.csv
    3. python import_materials.py --dry-run     (fix anything it complains about)
    4. python import_materials.py               (creates the material, status='draft')
    5. python export_gaps.py --include-missing  (now shows every property for it, blank)
    6. Fill in curation/gaps.csv as usual, then import_values.py as usual.

Design notes, mirroring import_values.py's conventions:

* One transaction for the whole file -- validation completes for every row
  before any row is written, same as import_values.py's V1-V10 pass.
* Idempotent by slug: re-running the same file updates the existing material
  in place rather than creating a duplicate. New materials are created
  status='draft' (never published sight-unseen); re-running does not
  downgrade an existing material's status back to draft.
* On an update, a blank optional column means "leave the existing value
  alone", not "clear it" -- so a row written purely to add overview_en to an
  existing material cannot wipe its hand-written overview_fa. Clearing a
  field back to empty is therefore not expressible through this CSV, which
  is the correct trade for a tool whose failure mode would otherwise be
  silent destruction of curated prose.
* A blank row, or a row whose slug starts with '#', is treated as a comment
  and ignored silently -- same convention gaps.csv uses for blank rows, and
  what --template relies on to ship an illustrative example that isn't
  itself imported.
* field_key must already exist (fields are a small, deliberately fixed
  taxonomy -- see db/migrations). family_key may be new; creating one
  requires both family_name_fa and family_name_en, since a family created
  with no name would be unusable in the UI.
* cas/resin_code become material_identifier rows. Re-running with a
  corrected value replaces the old one for that (material, type) rather
  than leaving a stale duplicate -- see resolve_identifiers().
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from common import (
    CSV_ENCODING,
    CURATION_DIR,
    NEW_MATERIALS_CSV_PATH,
    NEW_MATERIALS_FIELDNAMES,
    NEW_MATERIALS_REQUIRED_FIELDS,
    get_connection,
    is_blank,
)

IDENTIFIER_FIELDS = ["cas", "resin_code"]

_SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class RowError(Exception):
    """A validation failure tied to one CSV row, in plain language --
    same rendering convention as import_values.py's RowError."""

    def __init__(self, row_number: int, message: str, context: str | None = None):
        self.row_number = row_number
        self.message = message
        self.context = context
        super().__init__(self.render())

    def render(self) -> str:
        ctx = f" ({self.context})" if self.context else ""
        return f"Row {self.row_number}{ctx}: {self.message}"


# ---------------------------------------------------------------------------
# Loading the CSV
# ---------------------------------------------------------------------------


def load_new_materials_csv(path: Path) -> list[tuple[int, dict]]:
    if not path.exists():
        raise SystemExit(
            f"new_materials.csv not found at {path}. Run "
            "'python import_materials.py --template' first."
        )
    with path.open(newline="", encoding=CSV_ENCODING) as f:
        reader = csv.DictReader(f)
        return [(i, row) for i, row in enumerate(reader, start=2)]


def row_is_comment_or_blank(row: dict) -> bool:
    slug = (row.get("slug") or "").strip()
    if slug.startswith("#"):
        return True
    return all(is_blank(row.get(field)) for field in NEW_MATERIALS_FIELDNAMES)


# ---------------------------------------------------------------------------
# DB-side lookups, prefetched once per run
# ---------------------------------------------------------------------------


def load_fields(conn) -> dict[str, int]:
    """field_key -> id."""
    with conn.cursor() as cur:
        cur.execute("SELECT key, id FROM field;")
        return dict(cur.fetchall())


def load_families(conn) -> dict[tuple[str, str], int]:
    """(field_key, family_key) -> id."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT f.key, fam.key, fam.id FROM family fam JOIN field f ON f.id = fam.field_id;"
        )
        return {(field_key, family_key): family_id for field_key, family_key, family_id in cur.fetchall()}


def load_materials_by_slug(conn) -> dict[str, dict]:
    with conn.cursor() as cur:
        cur.execute("SELECT slug, id, field_id, family_id, status FROM material;")
        columns = [d.name for d in cur.description]
        return {row[0]: dict(zip(columns, row)) for row in cur.fetchall()}


# ---------------------------------------------------------------------------
# Per-row validation -> a plan
# ---------------------------------------------------------------------------


@dataclass
class PlannedMaterial:
    row_number: int
    slug: str
    field_key: str
    family_key: str
    family_is_new: bool
    family_name_fa: str | None
    family_name_en: str | None
    name_fa: str
    name_en: str
    code: str | None
    cas: str | None
    resin_code: str | None
    discovery_year: str | None
    overview_fa: str | None
    overview_en: str | None
    chain_type: str | None
    material_exists: bool


def validate_row(
    row_number: int,
    row: dict,
    valid_fields: dict[str, int],
    existing_families: dict[tuple[str, str], int],
    existing_materials: dict[str, dict],
) -> PlannedMaterial:
    slug = (row.get("slug") or "").strip()
    field_key = (row.get("field_key") or "").strip()
    family_key = (row.get("family_key") or "").strip()
    name_fa = (row.get("name_fa") or "").strip()
    name_en = (row.get("name_en") or "").strip()
    context = slug or None

    missing = [f for f in NEW_MATERIALS_REQUIRED_FIELDS if is_blank(row.get(f))]
    if missing:
        raise RowError(
            row_number,
            f"missing required column(s): {', '.join(missing)}. slug, field_key, family_key, "
            "name_fa and name_en are all required to create a material.",
            context,
        )

    if not _SLUG_RE.match(slug):
        raise RowError(
            row_number,
            f"slug '{slug}' isn't a valid slug -- use lowercase letters, digits and hyphens only "
            "(e.g. 'pla' or 'high-density-pe'), no spaces or uppercase.",
            context,
        )

    if field_key not in valid_fields:
        valid_list = ", ".join(sorted(valid_fields))
        raise RowError(
            row_number,
            f"field_key '{field_key}' doesn't match any field in the database. Valid keys: "
            f"{valid_list}.",
            context,
        )

    family_is_new = (field_key, family_key) not in existing_families
    family_name_fa = (row.get("family_name_fa") or "").strip() or None
    family_name_en = (row.get("family_name_en") or "").strip() or None
    if family_is_new and (not family_name_fa or not family_name_en):
        raise RowError(
            row_number,
            f"family_key '{family_key}' doesn't exist yet under field '{field_key}'. To create a "
            "new family, fill in both family_name_fa and family_name_en (needed to create it -- "
            "an unnamed family would be unusable in the UI). To use an existing family instead, "
            "check the spelling of family_key.",
            context,
        )

    return PlannedMaterial(
        row_number=row_number,
        slug=slug,
        field_key=field_key,
        family_key=family_key,
        family_is_new=family_is_new,
        family_name_fa=family_name_fa,
        family_name_en=family_name_en,
        name_fa=name_fa,
        name_en=name_en,
        code=(row.get("code") or "").strip() or None,
        cas=(row.get("cas") or "").strip() or None,
        resin_code=(row.get("resin_code") or "").strip() or None,
        discovery_year=(row.get("discovery_year") or "").strip() or None,
        overview_fa=(row.get("overview_fa") or "").strip() or None,
        overview_en=(row.get("overview_en") or "").strip() or None,
        chain_type=(row.get("chain_type") or "").strip() or None,
        material_exists=slug in existing_materials,
    )


# ---------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------


def resolve_family_id(
    conn,
    plan: PlannedMaterial,
    valid_fields: dict[str, int],
    existing_families: dict[tuple[str, str], int],
    new_families_cache: dict[tuple[str, str], int],
) -> tuple[int, bool]:
    """Returns (family_id, is_new). Creates the family under its field on
    first use within this run; a second row asking for the same new family
    reuses the cached id instead of creating it twice."""
    key = (plan.field_key, plan.family_key)
    if key in existing_families:
        return existing_families[key], False
    if key in new_families_cache:
        return new_families_cache[key], False

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO family (field_id, key, name_fa, name_en)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
            """,
            (valid_fields[plan.field_key], plan.family_key, plan.family_name_fa, plan.family_name_en),
        )
        family_id = cur.fetchone()[0]
    existing_families[key] = family_id
    new_families_cache[key] = family_id
    return family_id, True


def resolve_identifiers(conn, material_id: int, plan: PlannedMaterial) -> None:
    """Replaces (not appends) the cas/resin_code identifier for this
    material, so re-running the CSV with a corrected value doesn't leave the
    old one behind as an orphaned duplicate."""
    for id_type in IDENTIFIER_FIELDS:
        value = getattr(plan, id_type)
        if value is None:
            continue
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM material_identifier WHERE material_id = %s AND type = %s;",
                (material_id, id_type),
            )
            cur.execute(
                "INSERT INTO material_identifier (material_id, type, value) VALUES (%s, %s, %s);",
                (material_id, id_type, value),
            )


def execute_plan(
    conn,
    plans: list[PlannedMaterial],
    valid_fields: dict[str, int],
    existing_families: dict[tuple[str, str], int],
    existing_materials: dict[str, dict],
) -> list[str]:
    """Writes every planned row. Returns a human-readable change summary.
    Caller controls commit/rollback."""
    new_families_cache: dict[tuple[str, str], int] = {}
    summary: list[str] = []

    for plan in plans:
        family_id, family_is_new = resolve_family_id(
            conn, plan, valid_fields, existing_families, new_families_cache
        )
        field_id = valid_fields[plan.field_key]

        if plan.material_exists:
            material_id = existing_materials[plan.slug]["id"]
            with conn.cursor() as cur:
                cur.execute(
                    """
                    -- COALESCE on every optional column: a blank cell means
                    -- "leave this alone", never "erase it". Without this, a
                    -- row filled in to add an English overview to an existing
                    -- material would silently wipe its Persian overview,
                    -- because every other column in that row is blank -- and
                    -- overview_fa is hand-written prose that exists nowhere
                    -- else. Same convention import_values.py already uses for
                    -- citation-only rows ("the existing database value is
                    -- kept as-is"). name_fa/name_en are assigned directly, not
                    -- COALESCEd: they are validated non-blank for every row,
                    -- so there is no blank case to protect against.
                    UPDATE material SET
                        field_id = %(field_id)s, family_id = %(family_id)s,
                        name_fa = %(name_fa)s, name_en = %(name_en)s,
                        code = COALESCE(%(code)s, code),
                        discovery_year = COALESCE(%(discovery_year)s, discovery_year),
                        overview_fa = COALESCE(%(overview_fa)s, overview_fa),
                        overview_en = COALESCE(%(overview_en)s, overview_en),
                        chain_type = COALESCE(%(chain_type)s, chain_type),
                        updated_at = now()
                    WHERE id = %(material_id)s;
                    """,
                    {
                        "field_id": field_id,
                        "family_id": family_id,
                        "name_fa": plan.name_fa,
                        "name_en": plan.name_en,
                        "code": plan.code,
                        "discovery_year": plan.discovery_year,
                        "overview_fa": plan.overview_fa,
                        "overview_en": plan.overview_en,
                        "chain_type": plan.chain_type,
                        "material_id": material_id,
                    },
                )
            action = "updated"
        else:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO material (
                        slug, field_id, family_id, name_fa, name_en, code,
                        discovery_year, overview_fa, overview_en, chain_type, status
                    ) VALUES (
                        %(slug)s, %(field_id)s, %(family_id)s, %(name_fa)s, %(name_en)s, %(code)s,
                        %(discovery_year)s, %(overview_fa)s, %(overview_en)s, %(chain_type)s, 'draft'
                    ) RETURNING id;
                    """,
                    {
                        "slug": plan.slug,
                        "field_id": field_id,
                        "family_id": family_id,
                        "name_fa": plan.name_fa,
                        "name_en": plan.name_en,
                        "code": plan.code,
                        "discovery_year": plan.discovery_year,
                        "overview_fa": plan.overview_fa,
                        "overview_en": plan.overview_en,
                        "chain_type": plan.chain_type,
                    },
                )
                material_id = cur.fetchone()[0]
            action = "created (status=draft)"

        resolve_identifiers(conn, material_id, plan)

        pieces = [f"Row {plan.row_number} ({plan.slug}): {action}"]
        if family_is_new:
            pieces.append(f"new family '{plan.family_key}' under '{plan.field_key}'")
        summary.append(", ".join(pieces))

    return summary


# ---------------------------------------------------------------------------
# Template
# ---------------------------------------------------------------------------


def write_template(path: Path) -> None:
    CURATION_DIR.mkdir(parents=True, exist_ok=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    example = {field: "" for field in NEW_MATERIALS_FIELDNAMES}
    example.update(
        {
            # Leading '#' marks this as a comment row -- import_materials.py
            # ignores it, same as a fully blank row. Delete the '#' (and
            # fill in your own values) to actually import it.
            "slug": "#pla",
            "field_key": "biopolymers",
            "family_key": "polylactides",
            "family_name_fa": "پلی‌لاکتیدها",
            "family_name_en": "Polylactides",
            "name_fa": "پلی لاکتیک اسید",
            "name_en": "Polylactic Acid",
            "code": "PLA",
            "cas": "9051-89-2",
            "resin_code": "7",
            "discovery_year": "1932",
            "overview_fa": "شرح فارسی ماده (اختیاری)",
            "overview_en": "English overview of the material (optional)",
            "chain_type": "linear",
        }
    )
    with path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=NEW_MATERIALS_FIELDNAMES)
        writer.writeheader()
        writer.writerow(example)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=NEW_MATERIALS_CSV_PATH, dest="csv_path")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report; write nothing.")
    parser.add_argument(
        "--template",
        action="store_true",
        help="Write a starter new_materials.csv (header + one commented example row) and exit.",
    )
    args = parser.parse_args()

    if args.template:
        write_template(args.csv_path)
        print(f"Wrote {args.csv_path} (header + 1 example row, commented out)")
        return

    rows = load_new_materials_csv(args.csv_path)

    conn = get_connection()
    try:
        valid_fields = load_fields(conn)
        existing_families = load_families(conn)
        existing_materials = load_materials_by_slug(conn)

        errors: list[RowError] = []
        plans: list[PlannedMaterial] = []
        skipped = 0

        for row_number, row in rows:
            if row_is_comment_or_blank(row):
                skipped += 1
                continue
            try:
                plan = validate_row(row_number, row, valid_fields, existing_families, existing_materials)
                plans.append(plan)
            except RowError as exc:
                errors.append(exc)

        total = len(rows)
        print(f"{total} rows read: {skipped} blank/example, {len(plans)} to import, {len(errors)} rejected.")

        if errors:
            print(f"\n{len(errors)} row(s) rejected -- nothing will be written:")
            for err in errors:
                print(f"  - {err.render()}")
            conn.rollback()
            sys.exit(1)

        if not plans:
            print("\nNothing to import.")
            conn.rollback()
            return

        if args.dry_run:
            summary = execute_plan(conn, plans, valid_fields, existing_families, existing_materials)
            conn.rollback()
            print(f"\nDRY RUN -- would write {len(plans)} row(s), nothing committed:")
            for line in summary:
                print(f"  - {line}")
            return

        summary = execute_plan(conn, plans, valid_fields, existing_families, existing_materials)
        conn.commit()
        print(f"\nCommitted {len(plans)} row(s):")
        for line in summary:
            print(f"  - {line}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
