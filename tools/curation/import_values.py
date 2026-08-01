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
* Any single invalid row aborts the entire file. Nothing is written unless
  every non-blank, non-skipped row passes all ten validation rules.
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
    GAPS_CSV_PATH,
    GAPS_CURATOR_FIELDS,
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
    """The current live property_value row for one (material, property)."""

    pv_id: int
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


LIVE_VALUES_QUERY = """
    SELECT
        pv.id, pv.subject_id, pd.id AS property_id, pd.data_type,
        pd.canonical_unit, pd.plausible_min, pd.plausible_max,
        pv.value_min, pv.value_max, pv.value_typical, pv.value_text,
        pv.value_enum, pv.value_bool, pv.unit_display, pv.qualifier,
        pv.test_method_id, pv.conditions, pv.note_en, pv.note_fa,
        pv.confidence,
        m.slug AS material_slug, pd.key AS property_key,
        EXISTS(SELECT 1 FROM evidence e WHERE e.property_value_id = pv.id) AS has_evidence
    FROM property_value pv
    JOIN property_definition pd ON pd.id = pv.property_id
    JOIN material m ON pv.subject_type = 'material' AND m.id = pv.subject_id
    WHERE pv.subject_type = 'material'
      AND pv.superseded_by IS NULL
      AND pv.status <> 'superseded';
"""


def load_live_values(conn) -> dict[tuple[str, str], LiveValue]:
    """One row per (material_slug, property_key) that is currently the live
    value for that pair -- whichever status it's in. Matching against this
    (not just status='unsourced') is what makes re-citing an already-cited
    value resolve to a real row instead of failing V8, so the supersede path
    can trigger (see module docstring and curation-design.md section 7).
    """
    out: dict[tuple[str, str], LiveValue] = {}
    with conn.cursor() as cur:
        cur.execute(LIVE_VALUES_QUERY)
        columns = [d.name for d in cur.description]
        for raw in cur.fetchall():
            r = dict(zip(columns, raw))
            key = (r["material_slug"], r["property_key"])
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
    warnings: list[str] = field(default_factory=list)


def context_label(material_slug: str, property_key: str) -> str:
    return f"{material_slug} / {property_key}"


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
) -> PlannedRow:
    material_slug = (row.get("material_slug") or "").strip()
    property_key = (row.get("property_key") or "").strip()
    context = context_label(material_slug, property_key)

    # --- V8: material_slug + property_key must resolve to a real, live value ---
    live = live_values.get((material_slug, property_key))
    if live is None:
        raise RowError(
            row_number,
            f"material_slug '{material_slug}' + property_key '{property_key}' doesn't match any "
            "current value in the database. Don't edit those two columns -- if this row looks wrong, "
            "re-run export_gaps.py and copy your edits into the fresh file.",
            context,
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

    return PlannedRow(
        row_number=row_number,
        material_slug=material_slug,
        property_key=property_key,
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
        warnings=warnings,
    )


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


def execute_plan(conn, plans: list[PlannedRow]) -> list[str]:
    """Writes every planned row. Returns a human-readable change summary.
    Caller controls commit/rollback -- this function only executes
    statements against the connection it's given.
    """
    existing_sources = load_existing_sources(conn)
    source_doc_cache = load_source_documents(conn)
    new_sources_cache: dict[str, int] = {}
    summary: list[str] = []

    for plan in plans:
        source_id, source_is_new = resolve_source_id(conn, plan, existing_sources, new_sources_cache)
        doc_id, doc_is_new = resolve_source_document_id(conn, source_id, source_doc_cache)

        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO citation (source_document_id, locator) VALUES (%s, %s) RETURNING id;",
                (doc_id, json.dumps(plan.locator)),
            )
            citation_id = cur.fetchone()[0]

        live = plan.live
        value_min = live.value_min if plan.keep_existing_value else plan.value_min
        value_max = live.value_max if plan.keep_existing_value else plan.value_max
        value_typical = live.value_typical if plan.keep_existing_value else plan.value_typical
        value_text = live.value_text
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

        if live.has_evidence:
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
                        value_min, value_max, value_typical, value_text, value_enum, value_bool,
                        unit_display, qualifier, test_method_id, conditions,
                        note_en, note_fa, confidence, status, created_by
                    ) VALUES (
                        'material', %(subject_id)s, %(property_id)s,
                        %(value_min)s, %(value_max)s, %(value_typical)s, %(value_text)s,
                        %(value_enum)s, %(value_bool)s, %(unit_display)s, %(qualifier)s,
                        %(test_method_id)s, %(conditions)s, %(note_en)s, %(note_fa)s,
                        %(confidence)s, 'published', %(created_by)s
                    ) RETURNING id;
                    """,
                    {
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
                        value_enum = %(value_enum)s, value_bool = %(value_bool)s,
                        unit_display = %(unit_display)s, qualifier = %(qualifier)s,
                        test_method_id = %(test_method_id)s, conditions = %(conditions)s,
                        note_en = %(note_en)s, note_fa = %(note_fa)s, confidence = %(confidence)s,
                        status = 'published', created_by = COALESCE(created_by, %(created_by)s),
                        updated_at = now()
                    WHERE id = %(pv_id)s;
                    """,
                    {"pv_id": live.pv_id, "created_by": CREATED_BY, **write_fields},
                )
            target_pv_id = live.pv_id
            action = "published"

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO evidence (property_value_id, citation_id, role, extraction_method, confidence, created_by)
                VALUES (%s, %s, 'primary', 'manual', %s, %s);
                """,
                (target_pv_id, citation_id, plan.confidence, CREATED_BY),
            )

        pieces = [f"Row {plan.row_number} ({context_label(plan.material_slug, plan.property_key)}): {action}"]
        if source_is_new:
            pieces.append("new source")
        if doc_is_new:
            pieces.append("new source_document")
        if plan.keep_existing_value:
            pieces.append("value unchanged, citation added")
        summary.append(", ".join(pieces))

    return summary


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


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
        live_values = load_live_values(conn)
        test_methods = load_test_methods(conn)
        existing_sources = load_existing_sources(conn)
        fallback_sources_by_key: dict[str, int] = {}
        used_keys: set[str] = set()
        for (title, edition), sid in existing_sources.items():
            key = slugify_source_key(title, edition or None)
            key = disambiguate_key(key, used_keys)
            used_keys.add(key)
            fallback_sources_by_key[key] = sid

        errors: list[RowError] = []
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
            try:
                plan = validate_row(row_number, row, live_values, sources_by_key, fallback_sources_by_key, test_methods)
                plans.append(plan)
                warnings.extend(plan.warnings)
            except RowError as exc:
                errors.append(exc)

        total = len(gaps_rows)
        print(f"{total} rows read: {blank_count} blank, {skip_count} skipped, {len(plans)} to import, {len(errors)} rejected.")

        if warnings:
            print("\nWarnings (accepted, not blocking):")
            for w in warnings:
                print(f"  - {w}")

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
            # Run the writes against this connection so the summary reflects
            # exactly what a real run would do (new source? supersede vs
            # publish?), then roll back so nothing is persisted.
            summary = execute_plan(conn, plans)
            conn.rollback()
            print(f"\nDRY RUN -- would write {len(plans)} row(s), nothing committed:")
            for line in summary:
                print(f"  - {line}")
            return

        summary = execute_plan(conn, plans)
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
