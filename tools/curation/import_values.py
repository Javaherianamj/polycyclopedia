"""Validates and imports curation/gaps.csv (+ curation/sources.csv) into the
database, inside a single transaction.

    python import_values.py --dry-run     # validate + report, write nothing
    python import_values.py                # validate + write, one transaction

See curation-design.md sections 6 (validation rules V1-V10) and 7 (what gets
written) for the full spec. Summary of the behaviour that isn't obvious from
the rule table alone:

* A row where every curator column is blank, or where skip=y, is ignored
  silently (not an error, not reported).
* If a row leaves value_min/value_max/value_typical all blank but *is*
  otherwise filled in (source_key, locator, ...), the existing database
  value is kept as-is and only the citation is added. This is how the 20
  text-typed properties (appearance, monomer_formula, ...) get cited: this
  CSV has no column for entering a new text value, only numeric ones, so a
  citation-only row is the only way to source them.
* If the value being cited already has evidence (i.e. this is a re-citation,
  not the first one), the old property_value row is superseded rather than
  updated in place -- FR-7.1, never destroy history.
* If material_slug + property_key are both real but there is no live
  property_value row for that pair at all (e.g. a material just created by
  import_materials.py, or a property this material never had a row for), a
  new property_value row is created rather than the row being rejected. The
  current_value fallback above does NOT apply here -- there is nothing to
  fall back to, so such a row must supply value_min/value_max or
  value_typical itself (see the V1 check in validate_row).
* Multiple rows may share the same (material_slug, property_key) -- that's
  how several sources get cited for one value (e.g. 8 handbooks all giving a
  density range). At most one of those rows may set a new value
  (value_min/value_max/value_typical non-blank); the rest must leave those
  columns blank. The value-setting row (or, if none, the group's first row)
  creates/updates/supersedes the property_value exactly once; every other
  row in the group attaches as additional evidence to that same row instead
  of superseding it. `role` records how each one relates to the value:
  blank defaults to "primary" for the value-setting row and "corroborating"
  for the rest -- see GROUP_FIELDNAMES / group_plans() below.
* Rows are no longer all-or-nothing. Every row is still validated up front,
  but valid rows are committed even if other rows in the same file fail --
  a bad row no longer blocks good ones. After a real (non-dry-run) run,
  successfully imported rows are removed from the CSV entirely, and failed
  rows are kept with their reason written into the `import_error` column,
  so the curator's file always reflects exactly what's left to fix.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

from common import (
    CSV_ENCODING,
    DEFAULT_CONFIDENCE,
    EVIDENCE_ROLES,
    GAPS_CSV_PATH,
    GAPS_CURATOR_FIELDS,
    GAPS_FIELDNAMES,
    LOCATOR_FIELDS,
    QUALIFIERS,
    SOURCES_CSV_PATH,
    disambiguate_key,
    format_number,
    get_connection,
    is_blank,
    normalize_test_method,
    slugify_source_key,
)

NUMERIC_DATA_TYPES = {"numeric", "range"}


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class RowError(Exception):
    """A validation failure tied to one CSV row, in plain language.

    Rendered as "Row {n} ({material}/{property}): {message}" -- never a raw
    database exception. The (material/property) part is included whenever
    it's known; row 2's error might not know the property yet if V8 itself
    is what failed.
    """

    def __init__(self, row_number: int, message: str, context: str | None = None):
        self.row_number = row_number
        self.message = message
        self.context = context
        super().__init__(self.render())

    def render(self) -> str:
        ctx = f" ({self.context})" if self.context else ""
        return f"Row {self.row_number}{ctx}: {self.message}"


# ---------------------------------------------------------------------------
# Loading CSVs
# ---------------------------------------------------------------------------


def load_sources_csv(path: Path) -> dict[str, dict]:
    if not path.exists():
        raise SystemExit(f"sources.csv not found at {path}. Run export_gaps.py first.")
    with path.open(newline="", encoding=CSV_ENCODING) as f:
        reader = csv.DictReader(f)
        rows = {}
        for row in reader:
            key = (row.get("source_key") or "").strip()
            if key:
                rows[key] = row
    return rows


def load_gaps_csv(path: Path) -> list[tuple[int, dict]]:
    if not path.exists():
        raise SystemExit(f"gaps.csv not found at {path}. Run export_gaps.py first.")
    with path.open(newline="", encoding=CSV_ENCODING) as f:
        reader = csv.DictReader(f)
        return [(i, row) for i, row in enumerate(reader, start=2)]


def row_is_blank(row: dict) -> bool:
    return all(is_blank(row.get(field)) for field in GAPS_CURATOR_FIELDS)


def row_is_skipped(row: dict) -> bool:
    return (row.get("skip") or "").strip().lower() == "y"


# ---------------------------------------------------------------------------
# DB-side lookups, prefetched once per run
# ---------------------------------------------------------------------------


@dataclass
class LiveValue:
    """The current live property_value row for one (material, property).

    pv_id is None for a row synthesised by validate_row() when no live
    property_value exists yet -- see the "new row" path in validate_row and
    load_materials/load_property_definitions below. Every other field is
    still populated (from property_definition, with all value_* fields
    None) so the rest of validate_row/execute_plan doesn't need to branch
    on whether the row is new at every access site.
    """

    pv_id: int | None
    subject_id: int
    property_id: int
    data_type: str
    canonical_unit: str | None
    plausible_min: float | None
    plausible_max: float | None
    value_min: float | None
    value_max: float | None
    value_typical: float | None
    value_text: str | None
    value_text_fa: str | None
    value_text_en: str | None
    value_enum: str | None
    value_bool: bool | None
    unit_display: str | None
    qualifier: str | None
    test_method_id: int | None
    conditions: dict
    note_en: str | None
    note_fa: str | None
    confidence: float | None
    has_evidence: bool


# Both material-level and grade_class-level values are loaded, keyed by
# (material_slug, grade_class_key, property_key) with '' as the grade key for
# material-level rows. The LEFT JOINs resolve the polymorphic subject_id to a
# material slug either directly (subject_type='material') or through
# grade_class.material_id (subject_type='grade_class'), so one query covers
# both instead of a union that would have to be kept in sync twice.
LIVE_VALUES_QUERY = """
    SELECT
        pv.id, pv.subject_id, pd.id AS property_id, pd.data_type,
        pd.canonical_unit, pd.plausible_min, pd.plausible_max,
        pv.value_min, pv.value_max, pv.value_typical, pv.value_text,
        pv.value_text_fa, pv.value_text_en,
        pv.value_enum, pv.value_bool, pv.unit_display, pv.qualifier,
        pv.test_method_id, pv.conditions, pv.note_en, pv.note_fa,
        pv.confidence,
        COALESCE(m.slug, gm.slug) AS material_slug,
        COALESCE(gc.key, '') AS grade_class_key,
        pd.key AS property_key,
        EXISTS(
            SELECT 1 FROM evidence e
             WHERE e.subject_type = 'property_value' AND e.subject_id = pv.id
        ) AS has_evidence
    FROM property_value pv
    JOIN property_definition pd ON pd.id = pv.property_id
    LEFT JOIN material m ON pv.subject_type = 'material' AND m.id = pv.subject_id
    LEFT JOIN grade_class gc ON pv.subject_type = 'grade_class' AND gc.id = pv.subject_id
    LEFT JOIN material gm ON gm.id = gc.material_id
    WHERE pv.subject_type IN ('material', 'grade_class')
      AND COALESCE(m.slug, gm.slug) IS NOT NULL
      AND pv.value_role = 'editorial'
      AND pv.superseded_by IS NULL
      AND pv.status <> 'superseded';
"""


def load_live_values(conn) -> dict[tuple[str, str, str], LiveValue]:
    """One row per (material_slug, grade_class_key, property_key) that is
    currently the live value for that subject -- whichever status it's in.
    grade_class_key is '' for material-level values. Matching against this
    (not just status='unsourced') is what makes re-citing an already-cited
    value resolve to a real row instead of failing V8, so the supersede path
    can trigger (see module docstring and curation-design.md section 7).
    """
    out: dict[tuple[str, str, str], LiveValue] = {}
    with conn.cursor() as cur:
        cur.execute(LIVE_VALUES_QUERY)
        columns = [d.name for d in cur.description]
        for raw in cur.fetchall():
            r = dict(zip(columns, raw))
            key = (r["material_slug"], r["grade_class_key"], r["property_key"])
            out[key] = LiveValue(
                pv_id=r["id"],
                subject_id=r["subject_id"],
                property_id=r["property_id"],
                data_type=r["data_type"],
                canonical_unit=r["canonical_unit"],
                plausible_min=r["plausible_min"],
                plausible_max=r["plausible_max"],
                value_min=r["value_min"],
                value_max=r["value_max"],
                value_typical=r["value_typical"],
                value_text=r["value_text"],
                value_text_fa=r["value_text_fa"],
                value_text_en=r["value_text_en"],
                value_enum=r["value_enum"],
                value_bool=r["value_bool"],
                unit_display=r["unit_display"],
                qualifier=r["qualifier"],
                test_method_id=r["test_method_id"],
                conditions=r["conditions"] or {},
                note_en=r["note_en"],
                note_fa=r["note_fa"],
                confidence=r["confidence"],
                has_evidence=r["has_evidence"],
            )
    return out


def load_materials(conn) -> dict[str, dict]:
    """material_slug -> {id}. Used only for the "no live value yet" path in
    validate_row, to tell "material doesn't exist" apart from "property
    doesn't exist" apart from "both exist, there's just no row yet" --
    load_live_values() alone can't distinguish these, since it only returns
    pairs that already have a row.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT slug, id FROM material;")
        return {slug: {"id": mid} for slug, mid in cur.fetchall()}


def load_grade_classes(conn) -> dict[tuple[str, str], int]:
    """(material_slug, grade_class_key) -> grade_class.id."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT m.slug, gc.key, gc.id
              FROM grade_class gc
              JOIN material m ON m.id = gc.material_id;
            """
        )
        return {(slug, key): gid for slug, key, gid in cur.fetchall()}


def ensure_grade_classes(
    conn,
    gaps_rows: list[tuple[int, dict]],
    materials: dict[str, dict],
    grade_classes: dict[tuple[str, str], int],
) -> list[RowError]:
    """Creates any grade_class named in the CSV that doesn't exist yet, so
    validate_row() can resolve every row to a real subject_id.

    This runs as a pre-pass rather than lazily inside execute_plan() because
    a brand-new grade has no subject_id until it's inserted, and LiveValue
    needs one at validation time. It is safe to write here: main() runs the
    whole import in one transaction and rolls back on --dry-run, so a grade
    created during a dry run is discarded with everything else.

    Creating a grade requires both names (grade_class.name_fa/name_en are NOT
    NULL) -- the same rule import_materials.py applies to a new family. A
    typo'd key would otherwise silently become a third empty grade alongside
    the two real ones, which is exactly the "three contradictory densities"
    failure the grade_class split exists to prevent.
    """
    errors: list[RowError] = []
    seen: set[tuple[str, str]] = set()
    for row_number, row in gaps_rows:
        if row_is_blank(row) or row_is_skipped(row):
            continue
        material_slug = (row.get("material_slug") or "").strip()
        grade_key = (row.get("grade_class") or "").strip()
        if not grade_key:
            continue
        pair = (material_slug, grade_key)
        if pair in grade_classes or pair in seen or material_slug not in materials:
            continue
        name_fa = (row.get("grade_class_name_fa") or "").strip()
        name_en = (row.get("grade_class_name_en") or "").strip()
        if not name_fa or not name_en:
            known = sorted(k for (s, k) in grade_classes if s == material_slug)
            known_hint = f" Existing grades for {material_slug}: {', '.join(known)}." if known else ""
            errors.append(
                RowError(
                    row_number,
                    f"grade_class '{grade_key}' doesn't exist for '{material_slug}' yet. To create it, "
                    "fill in both grade_class_name_fa and grade_class_name_en on this row. If you meant "
                    f"an existing grade, check the spelling.{known_hint}",
                    context_label(material_slug, row.get("property_key") or "", grade_key),
                )
            )
            seen.add(pair)
            continue
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO grade_class (material_id, key, name_fa, name_en, status)
                VALUES (%s, %s, %s, %s, 'draft')
                RETURNING id;
                """,
                (materials[material_slug]["id"], grade_key, name_fa, name_en),
            )
            grade_classes[pair] = cur.fetchone()[0]
        seen.add(pair)
    return errors


def load_property_definitions(conn) -> dict[str, dict]:
    """property_key -> {id, data_type, canonical_unit, plausible_min, plausible_max}."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT key, id, data_type, canonical_unit, plausible_min, plausible_max FROM property_definition;"
        )
        return {
            key: {
                "id": pid,
                "data_type": data_type,
                "canonical_unit": canonical_unit,
                "plausible_min": plausible_min,
                "plausible_max": plausible_max,
            }
            for key, pid, data_type, canonical_unit, plausible_min, plausible_max in cur.fetchall()
        }


def load_test_methods(conn) -> dict[str, int]:
    with conn.cursor() as cur:
        cur.execute("SELECT id, standard_body, code FROM test_method;")
        return {f"{body.upper()} {code.upper()}": tid for tid, body, code in cur.fetchall()}


def load_existing_sources(conn) -> dict[tuple[str, str], int]:
    """(title, edition) -> id, matching uq_source_title_edition."""
    with conn.cursor() as cur:
        cur.execute("SELECT id, title, COALESCE(edition, '') FROM source;")
        return {(title, edition): sid for sid, title, edition in cur.fetchall()}


def load_source_documents(conn) -> dict[int, int]:
    """source_id -> source_document_id, for the storage_key IS NULL
    "no PDF held" placeholder document (one per source, see module docstring
    reference to curation-design.md section 7 item 2)."""
    with conn.cursor() as cur:
        cur.execute("SELECT source_id, id FROM source_document WHERE storage_key IS NULL;")
        out: dict[int, int] = {}
        for source_id, doc_id in cur.fetchall():
            out.setdefault(source_id, doc_id)
        return out


# ---------------------------------------------------------------------------
# Per-row validation -> a plan
# ---------------------------------------------------------------------------


@dataclass
class PlannedRow:
    row_number: int
    material_slug: str
    property_key: str
    grade_class: str
    subject_type: str
    live: LiveValue
    value_min: float | None
    value_max: float | None
    value_typical: float | None
    keep_existing_value: bool
    qualifier: str | None
    source_key: str
    source_row: dict
    locator: dict
    test_method_id: int | None
    conditions: dict | None
    note_en: str | None
    note_fa: str | None
    confidence: float
    role: str | None
    warnings: list[str] = field(default_factory=list)
    is_new_row: bool = False


def context_label(material_slug: str, property_key: str, grade_class: str = "") -> str:
    subject = f"{material_slug}/{grade_class}" if grade_class else material_slug
    return f"{subject} / {property_key}"


def parse_optional_float(raw: str, row_number: int, field_name: str, context: str) -> float | None:
    if is_blank(raw):
        return None
    try:
        return float(raw.strip())
    except ValueError:
        raise RowError(
            row_number,
            f"'{field_name}' value '{raw}' is not a number. Use a plain number like 920 or 0.925, "
            "no units or text.",
            context,
        )


def plausibility_hint(value: float, plausible_min: float, plausible_max: float) -> str:
    """Adds the unit-slip hint when the value looks ~10x/100x/1000x off
    rather than just a bit outside the range -- that pattern is what a
    wrong-unit entry (g/cm3 vs kg/m3, mm vs m, ...) produces, whereas a
    typo or a genuinely unusual value tends to be closer to the boundary.

    Checked against both bounds (not just plausible_max): a density of 920
    against a plausible range of 0.8-2.3 g/cm3 is ~400x plausible_max but
    ~1150x plausible_min -- either one landing near a clean power of ten is
    enough to suspect a unit slip.
    """
    for reference in (plausible_min, plausible_max):
        if not reference:
            continue
        ratio = abs(value / reference)
        for factor, hint in (
            (1000, "kg/m³ instead of g/cm³"),
            (100, "cm instead of mm, or vice versa"),
            (10, "a misplaced decimal point"),
        ):
            if factor * 0.5 <= ratio <= factor * 2:
                return f" Did you enter {hint}?"
    return ""


def validate_row(
    row_number: int,
    row: dict,
    live_values: dict[tuple[str, str], LiveValue],
    sources_by_key: dict[str, dict],
    fallback_sources_by_key: dict[str, int],
    test_methods: dict[str, int],
    materials: dict[str, dict] | None = None,
    property_defs: dict[str, dict] | None = None,
    grade_classes: dict[tuple[str, str], int] | None = None,
) -> PlannedRow:
    material_slug = (row.get("material_slug") or "").strip()
    property_key = (row.get("property_key") or "").strip()
    grade_class = (row.get("grade_class") or "").strip()
    context = context_label(material_slug, property_key, grade_class)

    # A grade_class key routes the value to subject_type='grade_class'.
    # ensure_grade_classes() has already created any new key (and rejected
    # the row if it couldn't), so an unresolved key here means the material
    # itself is bad -- reported by the V8 block below with a better message.
    subject_type = "grade_class" if grade_class else "material"
    grade_class_id = None
    if grade_class:
        grade_class_id = (grade_classes or {}).get((material_slug, grade_class))
        if grade_class_id is None and material_slug in (materials or {}):
            known = sorted(k for (s, k) in (grade_classes or {}) if s == material_slug)
            raise RowError(
                row_number,
                f"grade_class '{grade_class}' doesn't exist for '{material_slug}' and couldn't be "
                "created (fill in grade_class_name_fa and grade_class_name_en to create it)."
                + (f" Existing grades: {', '.join(known)}." if known else ""),
                context,
            )

    # --- V8: material_slug + property_key must resolve to a real material
    # and a real property. If there's no *live* value yet for that pair,
    # that's no longer automatically a rejection: as long as both sides are
    # real (e.g. a material import_materials.py just created, which starts
    # with zero property_value rows), a fresh row is created -- see the
    # is_new_row plumbing through to execute_plan(). materials/property_defs
    # are optional purely so existing callers (tests, older code) that only
    # ever pass already-existing pairs don't need to change; the "row is
    # genuinely new" path is unreachable unless both dicts are supplied.
    live = live_values.get((material_slug, grade_class, property_key))
    is_new_row = False
    if live is None:
        if materials is None or property_defs is None:
            raise RowError(
                row_number,
                f"material_slug '{material_slug}' + property_key '{property_key}' doesn't match any "
                "current value in the database. Don't edit those two columns -- if this row looks "
                "wrong, re-run export_gaps.py and copy your edits into the fresh file.",
                context,
            )
        material = materials.get(material_slug)
        if material is None:
            raise RowError(
                row_number,
                f"material_slug '{material_slug}' doesn't match any material in the database. Don't "
                "edit that column by hand -- use import_materials.py to create a new material first, "
                "or re-run export_gaps.py and copy your edits into the fresh file.",
                context,
            )
        property_def = property_defs.get(property_key)
        if property_def is None:
            raise RowError(
                row_number,
                f"property_key '{property_key}' doesn't match any property definition in the "
                "database. Don't edit that column by hand -- re-run export_gaps.py and copy your "
                "edits into the fresh file.",
                context,
            )
        is_new_row = True
        live = LiveValue(
            pv_id=None,
            subject_id=grade_class_id if grade_class else material["id"],
            property_id=property_def["id"],
            data_type=property_def["data_type"],
            canonical_unit=property_def["canonical_unit"],
            plausible_min=property_def["plausible_min"],
            plausible_max=property_def["plausible_max"],
            value_min=None,
            value_max=None,
            value_typical=None,
            value_text=None,
            value_text_fa=None,
            value_text_en=None,
            value_enum=None,
            value_bool=None,
            unit_display=None,
            qualifier=None,
            test_method_id=None,
            conditions={},
            note_en=None,
            note_fa=None,
            confidence=None,
            has_evidence=False,
        )

    # --- V3 (+ scope guard): numeric columns only apply to numeric/range properties ---
    raw_min, raw_max, raw_typical = row.get("value_min"), row.get("value_max"), row.get("value_typical")
    any_numeric_given = not (is_blank(raw_min) and is_blank(raw_max) and is_blank(raw_typical))

    if any_numeric_given and live.data_type not in NUMERIC_DATA_TYPES:
        current = live.value_text or live.value_enum or (
            "true" if live.value_bool else "false" if live.value_bool is not None else ""
        )
        raise RowError(
            row_number,
            f"this property is type '{live.data_type}', not a number -- value_min/value_max/value_typical "
            f"don't apply. The current value ('{current}') is kept automatically; leave those three "
            "columns blank and just fill in the citation to source it as-is.",
            context,
        )

    value_min = value_max = value_typical = None
    if live.data_type in NUMERIC_DATA_TYPES:
        value_min = parse_optional_float(raw_min, row_number, "value_min", context)
        value_max = parse_optional_float(raw_max, row_number, "value_max", context)
        value_typical = parse_optional_float(raw_typical, row_number, "value_typical", context)

    keep_existing_value = not any_numeric_given

    # --- V1: a value must exist, old or new ---
    if live.data_type in NUMERIC_DATA_TYPES:
        effective_has_value = any_numeric_given or (
            live.value_min is not None or live.value_max is not None or live.value_typical is not None
        )
        if not effective_has_value:
            if is_new_row:
                raise RowError(
                    row_number,
                    "no value given, and this is a brand-new property row -- there is no existing "
                    "database value to fall back on (that fallback only works for citing a value "
                    "that's already there). Fill in value_min/value_max (a range) or value_typical "
                    "(a single number).",
                    context,
                )
            raise RowError(
                row_number,
                "no value given, and there isn't one in the database yet either. Fill in value_min/"
                "value_max (a range) or value_typical (a single number).",
                context,
            )
    else:
        if keep_existing_value and not (live.value_text or live.value_enum or live.value_bool is not None):
            raise RowError(
                row_number,
                "no existing value to cite, and this tool can't set a new one for a "
                f"'{live.data_type}' property from this CSV. Contact the developer.",
                context,
            )

    # --- V2: value_min <= value_max ---
    if value_min is not None and value_max is not None and value_min > value_max:
        raise RowError(
            row_number,
            f"value_min ({format_number(value_min)}) is greater than value_max ({format_number(value_max)}) "
            "-- the range is inverted. Swap them, or fix the typo.",
            context,
        )

    # --- V4: plausibility (blocks by default, overridable) ---
    warnings: list[str] = []
    confidence_raw = row.get("confidence")
    note_en = (row.get("note_en") or "").strip() or None
    note_fa = (row.get("note_fa") or "").strip() or None

    effective_values = []
    if value_typical is not None:
        effective_values.append(value_typical)
    elif value_min is not None or value_max is not None:
        effective_values.extend(v for v in (value_min, value_max) if v is not None)
    elif keep_existing_value:
        effective_values.extend(
            v for v in (live.value_typical, live.value_min, live.value_max) if v is not None
        )

    if live.plausible_min is not None and live.plausible_max is not None and effective_values:
        out_of_range = [v for v in effective_values if v < live.plausible_min or v > live.plausible_max]
        if out_of_range:
            offending = out_of_range[0]
            unit = live.canonical_unit or ""
            override_given = not is_blank(confidence_raw) and (note_en or note_fa)
            hint = plausibility_hint(offending, live.plausible_min, live.plausible_max)
            message = (
                f"value {format_number(offending)} is far outside the plausible range "
                f"{format_number(live.plausible_min)}-{format_number(live.plausible_max)} {unit}.{hint}"
            )
            if not override_given:
                raise RowError(
                    row_number,
                    message
                    + " If this is really correct, set 'confidence' explicitly and explain why in "
                    "'note_en' or 'note_fa' to override.",
                    context,
                )
            warnings.append(f"Row {row_number} ({context}): {message} Accepted -- overridden by curator note.")

    # --- V5: at least one locator ---
    locator = {}
    for locator_field in LOCATOR_FIELDS:
        raw_value = (row.get(locator_field) or "").strip()
        if raw_value:
            locator[locator_field] = raw_value
    if not locator:
        raise RowError(
            row_number,
            "no citation locator given. Fill in at least one of page, table, figure, or section -- "
            "a citation without a location in the source isn't verifiable.",
            context,
        )

    # --- V6: source_key must resolve ---
    source_key = (row.get("source_key") or "").strip()
    if not source_key:
        raise RowError(
            row_number,
            "no source_key given. Look up the source in sources.csv (or add a new row there) and "
            "put its source_key here.",
            context,
        )
    source_row = sources_by_key.get(source_key)
    if source_row is None:
        if source_key in fallback_sources_by_key:
            source_row = {"source_key": source_key, "_existing_source_id": fallback_sources_by_key[source_key]}
        else:
            raise RowError(
                row_number,
                f"source_key '{source_key}' isn't in sources.csv. Add a row for it there (with a title, "
                "kind and tier at minimum), or use an existing source_key from that file.",
                context,
            )

    # --- V7: qualifier ---
    qualifier = (row.get("qualifier") or "").strip() or None
    if qualifier and qualifier not in QUALIFIERS:
        raise RowError(
            row_number,
            f"qualifier '{qualifier}' isn't recognised. Use one of: {', '.join(sorted(QUALIFIERS))} "
            "(or leave it blank).",
            context,
        )

    # --- V9: test_method ---
    test_method_id = live.test_method_id
    raw_test_method = (row.get("test_method") or "").strip()
    if raw_test_method:
        normalized = normalize_test_method(raw_test_method)
        test_method_id = test_methods.get(normalized)
        if test_method_id is None:
            raise RowError(
                row_number,
                f"test_method '{raw_test_method}' doesn't match a known test method (expected a form like "
                "'ASTM D1238' or 'ISO 1133'). Leave it blank if you're not sure, or check the spelling.",
                context,
            )

    # --- V10: confidence ---
    if is_blank(confidence_raw):
        confidence = DEFAULT_CONFIDENCE
    else:
        try:
            confidence = float(confidence_raw.strip())
        except ValueError:
            raise RowError(
                row_number,
                f"confidence '{confidence_raw}' is not a number. Use a value between 0 and 1, e.g. 0.9.",
                context,
            )
        if not (0 <= confidence <= 1):
            raise RowError(
                row_number,
                f"confidence {confidence_raw} is out of range. It must be between 0 and 1.",
                context,
            )

    conditions_raw = (row.get("conditions") or "").strip()
    conditions = {"text": conditions_raw} if conditions_raw else None

    # --- role: which relationship this row's citation has to the value it
    # attaches to. Left unresolved here (None means "not given") -- the
    # primary/corroborating default depends on whether this row wins the
    # anchor slot within its (material, property) group, which isn't known
    # until group_plans() runs across the whole file.
    role = (row.get("role") or "").strip() or None
    if role and role not in EVIDENCE_ROLES:
        raise RowError(
            row_number,
            f"role '{role}' isn't recognised. Use one of: {', '.join(sorted(EVIDENCE_ROLES))} "
            "(or leave it blank to get the sensible default).",
            context,
        )

    return PlannedRow(
        row_number=row_number,
        material_slug=material_slug,
        property_key=property_key,
        grade_class=grade_class,
        subject_type=subject_type,
        live=live,
        value_min=value_min,
        value_max=value_max,
        value_typical=value_typical,
        keep_existing_value=keep_existing_value,
        qualifier=qualifier,
        source_key=source_key,
        source_row=source_row,
        locator=locator,
        test_method_id=test_method_id,
        conditions=conditions,
        note_en=note_en,
        note_fa=note_fa,
        confidence=confidence,
        role=role,
        warnings=warnings,
        is_new_row=is_new_row,
    )


# ---------------------------------------------------------------------------
# Grouping: multiple rows citing the same (material, property)
# ---------------------------------------------------------------------------


@dataclass
class PlanGroup:
    """All PlannedRows for one (material_slug, property_key), in file order.

    `anchor` is the row that creates/updates/supersedes the property_value
    (the one row allowed to set a new value -- or, if none set one, the
    group's first row, matching the pre-multi-citation single-row
    behaviour exactly). Every other row in `others` only adds a citation +
    evidence row against the anchor's resulting property_value; it never
    touches value_min/value_max/value_typical/qualifier/etc.
    """

    anchor: PlannedRow
    others: list[PlannedRow]


def group_plans(plans: list[PlannedRow]) -> tuple[list[PlanGroup], list[RowError]]:
    """Groups validated rows by (material_slug, property_key), preserving
    the order groups first appear in the file. Returns (groups, errors) --
    a group with more than one value-setting row (non-blank value_min/
    value_max/value_typical) is invalid: the curator must pick exactly one
    number and cite the rest as blank-value corroborating/conflicting rows.
    Every row in an invalid group is rejected (there's no principled way to
    guess which value-setting row they meant to keep).
    """
    order: list[tuple[str, str, str]] = []
    by_key: dict[tuple[str, str, str], list[PlannedRow]] = {}
    for plan in plans:
        key = (plan.material_slug, plan.grade_class, plan.property_key)
        if key not in by_key:
            order.append(key)
            by_key[key] = []
        by_key[key].append(plan)

    groups: list[PlanGroup] = []
    errors: list[RowError] = []
    for key in order:
        rows = by_key[key]
        value_setters = [p for p in rows if not p.keep_existing_value]
        if len(value_setters) > 1:
            row_numbers = ", ".join(str(p.row_number) for p in value_setters)
            for p in rows:
                errors.append(
                    RowError(
                        p.row_number,
                        f"rows {row_numbers} all try to set a new value for the same subject/property. "
                        "Only one row per (material_slug, grade_class, property_key) may set value_min/"
                        "value_max/value_typical -- pick the one number you've settled on, and leave "
                        "those three columns blank on the rest so they're added as extra citations "
                        "instead. (Values for different grade_class keys don't collide -- give each "
                        "grade its own row if the sources disagree because they describe different "
                        "grades.)",
                        context_label(key[0], key[2], key[1]),
                    )
                )
            continue
        anchor = value_setters[0] if value_setters else rows[0]
        others = [p for p in rows if p is not anchor]
        groups.append(PlanGroup(anchor=anchor, others=others))
    return groups, errors


# ---------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------

CREATED_BY = "curation-import"


def resolve_source_id(conn, plan: PlannedRow, existing_sources: dict[tuple[str, str], int], new_sources_cache: dict[str, int]) -> tuple[int, bool]:
    """Returns (source_id, is_new). Matches by (title, edition) -- the DB's
    own natural key -- so a source_key that's new in the CSV but whose
    title/edition already exists in the database is matched, not
    duplicated, per curation-design.md section 7 item 1."""
    if plan.source_key in new_sources_cache:
        return new_sources_cache[plan.source_key], False

    if "_existing_source_id" in plan.source_row:
        sid = plan.source_row["_existing_source_id"]
        new_sources_cache[plan.source_key] = sid
        return sid, False

    title = (plan.source_row.get("title") or "").strip()
    edition = (plan.source_row.get("edition") or "").strip()
    existing_id = existing_sources.get((title, edition))
    if existing_id is not None:
        new_sources_cache[plan.source_key] = existing_id
        return existing_id, False

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO source (kind, tier, title, authors, publisher, edition, year, isbn, doi, url)
            VALUES (%(kind)s, %(tier)s, %(title)s, %(authors)s, %(publisher)s, %(edition)s,
                    %(year)s, %(isbn)s, %(doi)s, %(url)s)
            RETURNING id;
            """,
            {
                "kind": plan.source_row.get("kind") or "internal",
                "tier": plan.source_row.get("tier") or "community",
                "title": title,
                "authors": (plan.source_row.get("authors") or "").strip() or None,
                "publisher": (plan.source_row.get("publisher") or "").strip() or None,
                "edition": edition or None,
                "year": int(plan.source_row["year"]) if (plan.source_row.get("year") or "").strip() else None,
                "isbn": (plan.source_row.get("isbn") or "").strip() or None,
                "doi": (plan.source_row.get("doi") or "").strip() or None,
                "url": (plan.source_row.get("url") or "").strip() or None,
            },
        )
        new_id = cur.fetchone()[0]
    existing_sources[(title, edition)] = new_id
    new_sources_cache[plan.source_key] = new_id
    return new_id, True


def resolve_source_document_id(conn, source_id: int, doc_cache: dict[int, int]) -> tuple[int, bool]:
    if source_id in doc_cache:
        return doc_cache[source_id], False
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO source_document (source_id, storage_key) VALUES (%s, NULL) RETURNING id;",
            (source_id,),
        )
        doc_id = cur.fetchone()[0]
    doc_cache[source_id] = doc_id
    return doc_id, True


def _insert_citation(conn, plan: PlannedRow, existing_sources, source_doc_cache, new_sources_cache) -> tuple[int, bool, bool]:
    """Resolves/creates the source + source_document for `plan` and inserts
    its citation row. Returns (citation_id, source_is_new, doc_is_new).
    """
    source_id, source_is_new = resolve_source_id(conn, plan, existing_sources, new_sources_cache)
    doc_id, doc_is_new = resolve_source_document_id(conn, source_id, source_doc_cache)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO citation (source_document_id, locator) VALUES (%s, %s) RETURNING id;",
            (doc_id, json.dumps(plan.locator)),
        )
        citation_id = cur.fetchone()[0]
    return citation_id, source_is_new, doc_is_new


def _insert_evidence(conn, target_pv_id: int, citation_id: int, confidence: float, role: str) -> None:
    # subject_type/subject_id, not property_value_id: evidence became
    # polymorphic in db/migrations/0020_evidence_polymorphic.sql (U1 v2
    # FR-5), so any table with a value_status can be cited, not just
    # property_value. This importer only ever cites property_value rows.
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO evidence (subject_type, subject_id, citation_id, role, extraction_method, confidence, created_by)
            VALUES ('property_value', %s, %s, %s, 'manual', %s, %s);
            """,
            (target_pv_id, citation_id, role, confidence, CREATED_BY),
        )


def execute_plan(conn, plans: list[PlannedRow]) -> list[str]:
    """Writes every planned row. Returns a human-readable change summary.
    Caller controls commit/rollback -- this function only executes
    statements against the connection it's given.

    Rows are grouped by (material_slug, property_key) via group_plans()
    first (see that function's docstring): each group's anchor row creates/
    updates/supersedes the property_value exactly once, and every other row
    in the group only adds a citation + evidence row against that same
    property_value -- so N sources for one value produce one property_value
    with N evidence rows, not N supersessions. Callers are expected to have
    already dropped any group group_plans() flagged as invalid (conflicting
    value-setters); group_plans() is called again here for its grouping,
    not to re-surface those errors.
    """
    existing_sources = load_existing_sources(conn)
    source_doc_cache = load_source_documents(conn)
    new_sources_cache: dict[str, int] = {}
    summary: list[str] = []

    groups, _ = group_plans(plans)
    for group in groups:
        plan = group.anchor
        citation_id, source_is_new, doc_is_new = _insert_citation(
            conn, plan, existing_sources, source_doc_cache, new_sources_cache
        )

        live = plan.live
        value_min = live.value_min if plan.keep_existing_value else plan.value_min
        value_max = live.value_max if plan.keep_existing_value else plan.value_max
        value_typical = live.value_typical if plan.keep_existing_value else plan.value_typical
        value_text = live.value_text
        # Carried forward with value_text so superseding a text-typed value does
        # not drop its bilingual halves (db/migrations/0030).
        value_text_fa = live.value_text_fa
        value_text_en = live.value_text_en
        value_enum = live.value_enum
        value_bool = live.value_bool
        unit_display = live.unit_display if plan.keep_existing_value else (live.canonical_unit or live.unit_display)
        qualifier = plan.qualifier if plan.qualifier is not None else live.qualifier
        conditions = plan.conditions if plan.conditions is not None else live.conditions
        note_en = plan.note_en if plan.note_en is not None else live.note_en
        note_fa = plan.note_fa if plan.note_fa is not None else live.note_fa

        write_fields = {
            "value_min": value_min,
            "value_max": value_max,
            "value_typical": value_typical,
            "value_text": value_text,
            "value_text_fa": value_text_fa,
            "value_text_en": value_text_en,
            "value_enum": value_enum,
            "value_bool": value_bool,
            "unit_display": unit_display,
            "qualifier": qualifier,
            "test_method_id": plan.test_method_id,
            "conditions": json.dumps(conditions),
            "note_en": note_en,
            "note_fa": note_fa,
            "confidence": plan.confidence,
        }

        if plan.is_new_row:
            # No live property_value row exists for this (material,
            # property) pair at all -- nothing to supersede, nothing to
            # update in place. Same INSERT shape as the supersede branch
            # below, just without a prior row to flip to 'superseded'.
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO property_value (
                        subject_type, subject_id, property_id,
                        value_min, value_max, value_typical, value_text,
                        value_text_fa, value_text_en, value_enum, value_bool,
                        unit_display, qualifier, test_method_id, conditions,
                        note_en, note_fa, confidence, status, derivation_rule, created_by
                    ) VALUES (
                        %(subject_type)s, %(subject_id)s, %(property_id)s,
                        %(value_min)s, %(value_max)s, %(value_typical)s, %(value_text)s,
                        %(value_text_fa)s, %(value_text_en)s,
                        %(value_enum)s, %(value_bool)s, %(unit_display)s, %(qualifier)s,
                        %(test_method_id)s, %(conditions)s, %(note_en)s, %(note_fa)s,
                        %(confidence)s, 'published', 'single_source', %(created_by)s
                    ) RETURNING id;
                    """,
                    {
                        "subject_type": plan.subject_type,
                        "subject_id": live.subject_id,
                        "property_id": live.property_id,
                        "created_by": CREATED_BY,
                        **write_fields,
                    },
                )
                new_pv_id = cur.fetchone()[0]
            target_pv_id = new_pv_id
            action = "created"
        elif live.has_evidence:
            with conn.cursor() as cur:
                # Order matters: uq_property_value_live is a partial unique
                # index on (subject_type, subject_id, property_id,
                # conditions) WHERE superseded_by IS NULL AND status <>
                # 'superseded'. Inserting the new live row *before* the old
                # one has left that partial index (i.e. while it's still
                # status='published') would collide with it -- there'd
                # briefly be two "live" rows for the same subject+property.
                # Flipping the old row's status to 'superseded' first drops
                # it out of the index's WHERE clause, freeing the slot for
                # the insert. superseded_by is filled in afterwards, once
                # the new row's id is known (it can't be known beforehand).
                cur.execute(
                    "UPDATE property_value SET status = 'superseded' WHERE id = %s;",
                    (live.pv_id,),
                )
                cur.execute(
                    """
                    INSERT INTO property_value (
                        subject_type, subject_id, property_id,
                        value_min, value_max, value_typical, value_text,
                        value_text_fa, value_text_en, value_enum, value_bool,
                        unit_display, qualifier, test_method_id, conditions,
                        note_en, note_fa, confidence, status, derivation_rule, created_by
                    ) VALUES (
                        %(subject_type)s, %(subject_id)s, %(property_id)s,
                        %(value_min)s, %(value_max)s, %(value_typical)s, %(value_text)s,
                        %(value_text_fa)s, %(value_text_en)s,
                        %(value_enum)s, %(value_bool)s, %(unit_display)s, %(qualifier)s,
                        %(test_method_id)s, %(conditions)s, %(note_en)s, %(note_fa)s,
                        %(confidence)s, 'published', 'single_source', %(created_by)s
                    ) RETURNING id;
                    """,
                    {
                        "subject_type": plan.subject_type,
                        "subject_id": live.subject_id,
                        "property_id": live.property_id,
                        "created_by": CREATED_BY,
                        **write_fields,
                    },
                )
                new_pv_id = cur.fetchone()[0]
                cur.execute(
                    "UPDATE property_value SET superseded_by = %s WHERE id = %s;",
                    (new_pv_id, live.pv_id),
                )
            target_pv_id = new_pv_id
            action = "superseded"
        else:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE property_value SET
                        value_min = %(value_min)s, value_max = %(value_max)s,
                        value_typical = %(value_typical)s, value_text = %(value_text)s,
                        value_text_fa = %(value_text_fa)s, value_text_en = %(value_text_en)s,
                        value_enum = %(value_enum)s, value_bool = %(value_bool)s,
                        unit_display = %(unit_display)s, qualifier = %(qualifier)s,
                        test_method_id = %(test_method_id)s, conditions = %(conditions)s,
                        note_en = %(note_en)s, note_fa = %(note_fa)s, confidence = %(confidence)s,
                        status = 'published', derivation_rule = 'single_source',
                        created_by = COALESCE(created_by, %(created_by)s),
                        updated_at = now()
                    WHERE id = %(pv_id)s;
                    """,
                    {"pv_id": live.pv_id, "created_by": CREATED_BY, **write_fields},
                )
            target_pv_id = live.pv_id
            action = "published"

        _insert_evidence(conn, target_pv_id, citation_id, plan.confidence, plan.role or "primary")

        pieces = [f"Row {plan.row_number} ({context_label(plan.material_slug, plan.property_key, plan.grade_class)}): {action}"]
        if source_is_new:
            pieces.append("new source")
        if doc_is_new:
            pieces.append("new source_document")
        if plan.keep_existing_value:
            pieces.append("value unchanged, citation added")
        if group.others:
            pieces.append(f"+{len(group.others)} more citation(s)")
        summary.append(", ".join(pieces))

        # Extra sources for the same value: attach as evidence against the
        # anchor's target_pv_id, never touching the property_value itself.
        for other in group.others:
            other_citation_id, other_source_is_new, other_doc_is_new = _insert_citation(
                conn, other, existing_sources, source_doc_cache, new_sources_cache
            )
            _insert_evidence(conn, target_pv_id, other_citation_id, other.confidence, other.role or "corroborating")
            other_pieces = [
                f"Row {other.row_number} ({context_label(other.material_slug, other.property_key, other.grade_class)}): "
                f"citation added to row {plan.row_number}'s value"
            ]
            if other_source_is_new:
                other_pieces.append("new source")
            if other_doc_is_new:
                other_pieces.append("new source_document")
            summary.append(", ".join(other_pieces))

    return summary


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def rewrite_gaps_csv(
    path: Path,
    gaps_rows: list[tuple[int, dict]],
    committed_row_numbers: set[int],
    error_by_row: dict[int, str],
) -> None:
    """Rewrites `path` after a real (committed) run: rows that were
    successfully imported are dropped entirely; rows that failed keep their
    place with `import_error` filled in; every other row (blank, skipped,
    or untouched) passes through unchanged. Always writes the full
    GAPS_FIELDNAMES header, so a file exported before `role`/`import_error`
    existed gets upgraded to include them going forward.
    """
    out_rows = []
    for row_number, row in gaps_rows:
        if row_number in committed_row_numbers:
            continue
        csv_row = {field: (row.get(field) or "") for field in GAPS_FIELDNAMES}
        if row_number in error_by_row:
            csv_row["import_error"] = error_by_row[row_number]
        elif row_is_skipped(row):
            csv_row["import_error"] = ""
        out_rows.append(csv_row)

    with path.open("w", newline="", encoding=CSV_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=GAPS_FIELDNAMES)
        writer.writeheader()
        writer.writerows(out_rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gaps-csv", type=Path, default=GAPS_CSV_PATH)
    parser.add_argument("--sources-csv", type=Path, default=SOURCES_CSV_PATH)
    parser.add_argument("--dry-run", action="store_true", help="Validate and report; write nothing.")
    args = parser.parse_args()

    sources_by_key = load_sources_csv(args.sources_csv)
    gaps_rows = load_gaps_csv(args.gaps_csv)

    conn = get_connection()
    try:
        materials = load_materials(conn)
        grade_classes = load_grade_classes(conn)
        # Must run before load_live_values(): a grade created here needs to be
        # visible to the live-value lookup keyed on (material, grade, property).
        grade_errors = ensure_grade_classes(conn, gaps_rows, materials, grade_classes)
        live_values = load_live_values(conn)
        property_defs = load_property_definitions(conn)
        test_methods = load_test_methods(conn)
        existing_sources = load_existing_sources(conn)
        fallback_sources_by_key: dict[str, int] = {}
        used_keys: set[str] = set()
        for (title, edition), sid in existing_sources.items():
            key = slugify_source_key(title, edition or None)
            key = disambiguate_key(key, used_keys)
            used_keys.add(key)
            fallback_sources_by_key[key] = sid

        errors: list[RowError] = list(grade_errors)
        grade_error_rows = {err.row_number for err in grade_errors}
        warnings: list[str] = []
        plans: list[PlannedRow] = []
        blank_count = 0
        skip_count = 0

        for row_number, row in gaps_rows:
            if row_is_blank(row):
                blank_count += 1
                continue
            if row_is_skipped(row):
                skip_count += 1
                continue
            if row_number in grade_error_rows:
                continue
            try:
                plan = validate_row(
                    row_number, row, live_values, sources_by_key, fallback_sources_by_key, test_methods,
                    materials, property_defs, grade_classes,
                )
                plans.append(plan)
                warnings.extend(plan.warnings)
            except RowError as exc:
                errors.append(exc)

        # Rows individually valid can still conflict with each other (two
        # rows both trying to set a new value for the same material/
        # property) -- group_plans() catches that across the whole file and
        # rejects every row in the offending group.
        _, group_errors = group_plans(plans)
        errors.extend(group_errors)
        rejected_row_numbers = {err.row_number for err in errors}
        plans = [p for p in plans if p.row_number not in rejected_row_numbers]

        total = len(gaps_rows)
        print(
            f"{total} rows read: {blank_count} blank, {skip_count} skipped, "
            f"{len(plans)} to import, {len(errors)} rejected."
        )

        if warnings:
            print("\nWarnings (accepted, not blocking):")
            for w in warnings:
                print(f"  - {w}")

        if errors:
            print(f"\n{len(errors)} row(s) rejected -- these will be left in the file with the reason "
                  "why, valid rows are still imported:")
            for err in errors:
                print(f"  - {err.render()}")

        # Non-zero exit whenever any row was rejected -- even though valid
        # rows still get committed, a CI/curator workflow around this tool
        # needs a reliable signal that not everything landed clean.
        exit_code = 1 if errors else 0

        if not plans:
            print("\nNothing to import.")
            conn.rollback()
            sys.exit(exit_code)

        if args.dry_run:
            # Run the writes against this connection so the summary reflects
            # exactly what a real run would do (new source? supersede vs
            # publish?), then roll back so nothing is persisted -- including
            # no rewrite of gaps.csv.
            summary = execute_plan(conn, plans)
            conn.rollback()
            print(f"\nDRY RUN -- would write {len(plans)} row(s), nothing committed:")
            for line in summary:
                print(f"  - {line}")
            sys.exit(exit_code)

        summary = execute_plan(conn, plans)
        conn.commit()
        print(f"\nCommitted {len(plans)} row(s):")
        for line in summary:
            print(f"  - {line}")

        error_by_row = {err.row_number: err.message for err in errors}
        rewrite_gaps_csv(args.gaps_csv, gaps_rows, {p.row_number for p in plans}, error_by_row)
        print(f"\nUpdated {args.gaps_csv}: imported rows removed, rejected rows annotated.")
        sys.exit(exit_code)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
