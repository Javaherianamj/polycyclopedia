"""Emits ``db/seeds/0005_materials_ldpe_hdpe.sql`` from the parsed LDPE/HDPE
data.

Pipeline stage 3 of 3 (see ``parse_polymers.py`` module docstring):

    parse src/data/polymersData.ts  -->  normalise values  -->  validate
    against oracle  -->  emit seed SQL (this module)

Run directly:

    python emit_sql.py

Refuses to emit anything (raises ``SystemExit`` via
``parse_polymers.require_clean``) if LDPE or HDPE have any unresolved parse
failures or oracle disagreements -- the "never guess, never emit doubtful
data" rule applies just as much to the emitted SQL as it does to the parser
itself.

Only ``ldpe`` and ``hdpe`` are emitted. The other four materials in
``src/data/polymersData.ts`` (PP, PVC, PET, PS) are parsed by
``parse_polymers.py`` for the cross-check report but are deliberately never
passed to :func:`emit_sql`, because PVC/PET/PS each have at least one value
string that crams two distinct material variants into a single cell (see
``parse_polymers.py`` module docstring / the ETL README for details) and
PET's density additionally disagrees with its own oracle. None of that is
this module's problem to fix; it just never emits SQL for those four ids.
"""
from __future__ import annotations

import json
from pathlib import Path

from parse_polymers import ParsedMaterial, PropertyResult, parse_all_materials, require_clean

REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = REPO_ROOT / "db" / "seeds" / "0005_materials_ldpe_hdpe.sql"
SEEDS_DIR = REPO_ROOT / "db" / "seeds"

SEEDED_MATERIAL_IDS = ("ldpe", "hdpe")

# ---------------------------------------------------------------------------
# Hand-curated mappings from legacy free-text fields to the natural keys
# seeded by 0001_fields_families.sql. These cannot be derived automatically
# -- the legacy `applications`/`processing.techniques` arrays are full
# Persian sentences, not short keys -- so this is a manual distillation,
# cross-checked by hand against 0001_fields_families.sql's own comments
# ("distilled from LDPE/HDPE applications[]" / "...processing.techniques[]").
# If 0001 is ever regenerated with different keys, `_resolve_keys` below
# will print a warning and skip rather than emit a broken FK reference.
# ---------------------------------------------------------------------------

FIELD_KEY = "thermoplastics"

FAMILY_KEY_BY_LEGACY_NAME = {
    "Polyolefins": "polyolefins",
}

APPLICATION_KEYS_BY_MATERIAL = {
    "ldpe": [
        "flexible_packaging_film",  # packaging film, bags, shrink/stretch film
        "wire_cable_insulation",  # electrical insulation for wire & cable
        "agricultural_film",  # greenhouse & mulch film
        "squeezable_bottles",  # squeezable sauce/honey bottles
    ],
    "hdpe": [
        "rigid_packaging_bottles",  # milk/juice/detergent bottles & caps
        "pipes_fittings",  # water/gas/sewer pipe
        "chemical_tanks_pallets",  # chemical tanks & pallets
        "geomembranes",  # landfill liner geomembranes
        "automotive_fuel_tanks",  # fuel tanks & interior parts
    ],
}

PROCESSING_TECHNIQUE_KEYS_BY_MATERIAL = {
    "ldpe": [
        "blown_film",
        "injection_molding",
        "rotational_molding",
        "wire_cable_coating",
    ],
    "hdpe": [
        "injection_molding",
        "pipe_extrusion",
        "blow_molding",
        "rotational_molding",
        "sheet_extrusion",
    ],
}

# Chemical-resistance reagent categories are Persian-only in the legacy
# data (ChemicalResistanceItem.category has no English sibling field).
# chemical_resistance.reagent_en is NOT NULL, so a plain-English gloss of
# each category label is required. These are translations of the category
# *label* itself (e.g. "Acids & Bases"), not a fabricated data value --
# distinct from the sourced rating/note fields, which stay exactly
# 'unsourced' with no invented citation.
REAGENT_EN_BY_FA = {
    "اسیدها و بازها": "Acids & Bases",
    "اسیدها، بازها و نمک‌ها": "Acids, Bases & Salts",
    "الکل‌ها": "Alcohols",
    "ترک‌خوردگی تنشی محیطی (ESCR)": "Environmental Stress Cracking (ESCR)",
    "هیدروکربن‌های آلیفاتیک": "Aliphatic Hydrocarbons",
    "هیدروکربن‌های آروماتیک": "Aromatic Hydrocarbons",
    "حلال‌های هالوژنه": "Halogenated Solvents",
    "روغن‌های داغ": "Hot Oils",
    "اشعه فرابنفش (UV)": "Ultraviolet (UV) Radiation",
}

# Text-typed property values are Persian-only in the legacy data (the
# academic/processing string fields have no English sibling), so the problem
# REAGENT_EN_BY_FA solves reappears on property_value. Before migration 0030
# there was nowhere to put a translation and the legacy string went into the
# single value_text column verbatim -- which is why values like
# 'اتیلن (Ethylene)' carry both languages at once and render as mixed script
# whichever locale the reader asked for.
#
# Keyed on the legacy string, valued as (value_text_fa, value_text_en). Two
# kinds of entry:
#   - Language-neutral values (formulae, repeat units) repeat the same string
#     in both halves; a formula is already correct in either locale.
#   - Persian values drop the trailing English gloss from the fa half, since
#     the en half now carries it. Inline English *terms* inside prose (e.g.
#     "(Chain Transfer)") stay put -- those are terminology aids a Persian
#     reader expects, not a translation of the sentence.
#
# Keep this in step with the backfill table in
# db/migrations/0030_property_value_text_locale.sql, which carries the same
# pairs for rows already in a live database. Like the reagent glosses these
# are translations of existing content, not fabricated data: every row still
# emits status='unsourced' and no citation.
VALUE_TEXT_BILINGUAL: dict[str, tuple[str, str]] = {
    # -- language-neutral -------------------------------------------------
    "C2H4": ("C2H4", "C2H4"),
    "[CH2 - CH2]n": ("[CH2 - CH2]n", "[CH2 - CH2]n"),
    # -- labels ------------------------------------------------------------
    "اتیلن (Ethylene)": ("اتیلن", "Ethylene"),
    "نیمه‌شفاف (Translucent)": ("نیمه‌شفاف", "Translucent"),
    "کدر / کدر متمایل به سفید (Opaque)": ("کدر / کدر متمایل به سفید", "Opaque / off-white opaque"),
    "2:1 تا 4:1": ("2:1 تا 4:1", "2:1 to 4:1"),
    "2:1 تا 6:1": ("2:1 تا 6:1", "2:1 to 6:1"),
    "7.4, 4.93, 2.55 Å (Orthorhombic)": (
        "7.4، 4.93، 2.55 آنگستروم (اورتورومبیک)",
        "7.4, 4.93, 2.55 Å (Orthorhombic)",
    ),
    "7.42, 4.95, 2.55 Å (Orthorhombic)": (
        "7.42، 4.95، 2.55 آنگستروم (اورتورومبیک)",
        "7.42, 4.95, 2.55 Å (Orthorhombic)",
    ),
    # -- prose -------------------------------------------------------------
    "رادیکال آزاد (فشار بالا 1000-3000 بار و دمای 200-300 °C با آغازگر پراکسید آلی)": (
        "رادیکال آزاد (فشار بالا 1000-3000 بار و دمای 200-300 °C با آغازگر پراکسید آلی)",
        "Free radical (high pressure, 1000-3000 bar and 200-300 °C, with an organic peroxide initiator)",
    ),
    "کاتالیزوری (فشار 1-50 بار و دمای 70-120 °C با کاتالیزور زیگلر-ناتا، کروم فیلیپس یا متالوسن)": (
        "کاتالیزوری (فشار 1-50 بار و دمای 70-120 °C با کاتالیزور زیگلر-ناتا، کروم فیلیپس یا متالوسن)",
        "Catalytic (1-50 bar and 70-120 °C, with a Ziegler-Natta, Phillips chromium or metallocene catalyst)",
    ),
    "وقوع مکرر واکنش‌های انتقال زنجیر (Chain Transfer) و Backbiting عامل اصلی ایجاد شاخه‌های کوتاه و بلند در زنجیر است.": (
        "وقوع مکرر واکنش‌های انتقال زنجیر (Chain Transfer) و Backbiting عامل اصلی ایجاد شاخه‌های کوتاه و بلند در زنجیر است.",
        "Frequent chain transfer and backbiting reactions are the main cause of the short- and long-chain branches along the chain.",
    ),
    "کاهش شدید واکنش‌های انتقال زنجیر، منجر به تولید زنجیرهای کاملاً خطی با تراکم شاخه کمتر از 5 در هر 1000 کربن می‌شود.": (
        "کاهش شدید واکنش‌های انتقال زنجیر، منجر به تولید زنجیرهای کاملاً خطی با تراکم شاخه کمتر از 5 در هر 1000 کربن می‌شود.",
        "Sharply reduced chain transfer yields fully linear chains with a branch density below 5 per 1000 carbons.",
    ),
    "رفتار ویسکوزیته مذاب از نوع شبه‌پلاستیک (Shear-Thinning) با استحکام مذاب (Melt Strength) بالا به دلیل گره‌خوردگی شاخه‌های بلند است.": (
        "رفتار ویسکوزیته مذاب از نوع شبه‌پلاستیک (Shear-Thinning) با استحکام مذاب (Melt Strength) بالا به دلیل گره‌خوردگی شاخه‌های بلند است.",
        "Melt viscosity is pseudoplastic (shear-thinning), with high melt strength owing to long-chain-branch entanglement.",
    ),
    "رفتار ویسکوزیته مذاب شبه‌پلاستیک است. زمان خنک‌سازی آن در قالب به علت بلورینگی سریع، کوتاه است.": (
        "رفتار ویسکوزیته مذاب شبه‌پلاستیک است. زمان خنک‌سازی آن در قالب به علت بلورینگی سریع، کوتاه است.",
        "Melt viscosity is pseudoplastic. In-mould cooling time is short because crystallisation is rapid.",
    ),
    "مقدار آنتالپی ذوب تجربی برای LDPE کاملاً بلوری (100% فرضی) برابر با 293 J/g می‌باشد که مبنای محاسبات تجربی بلورینگی است.": (
        "مقدار آنتالپی ذوب تجربی برای LDPE کاملاً بلوری (100% فرضی) برابر با 293 J/g می‌باشد که مبنای محاسبات تجربی بلورینگی است.",
        "The experimental enthalpy of fusion for fully crystalline LDPE (a hypothetical 100%) is 293 J/g, the basis for empirical crystallinity calculations.",
    ),
    "به دلیل درصد بلورینگی بالاتر نسبت به LDPE، میزان کسر حجم آزاد کمتر است و نفوذپذیری گازها کاهش می‌یابد.": (
        "به دلیل درصد بلورینگی بالاتر نسبت به LDPE، میزان کسر حجم آزاد کمتر است و نفوذپذیری گازها کاهش می‌یابد.",
        "Because crystallinity is higher than in LDPE, the free volume fraction is lower and gas permeability decreases.",
    ),
}


# ---------------------------------------------------------------------------
# SQL literal helpers
# ---------------------------------------------------------------------------


def sql_str(value: str | None) -> str:
    """Escapes a Python string as a single-quoted SQL string literal by
    doubling embedded single quotes (the standard SQL escape,
    ``standard_conforming_strings`` is 'on' in this DB, so backslashes need
    no special handling). Returns the bare literal ``NULL`` for ``None``."""
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_num(value: float | int | None) -> str:
    if value is None:
        return "NULL"
    return repr(float(value))


def sql_int(value: int | None) -> str:
    if value is None:
        return "NULL"
    return str(int(value))


def sql_jsonb(value: object) -> str:
    return sql_str(json.dumps(value, ensure_ascii=False)) + "::jsonb"


def sql_bool(value: bool | None) -> str:
    if value is None:
        return "NULL"
    return "true" if value else "false"


# ---------------------------------------------------------------------------
# Key-existence checks against 0001_fields_families.sql
# ---------------------------------------------------------------------------


def _load_seeded_keys(seed_filename: str, table: str) -> set[str]:
    """Extracts the set of `key`s a given 0001_fields_families.sql INSERT
    block declares for `table`, by literally scanning the seed file text.
    This is deliberately dumb (no SQL parsing) -- it only needs to catch the
    ``('some_key', ...)`` tuples inside the relevant ``INSERT INTO table``
    statement so `_resolve_keys` can warn instead of emitting a dangling
    natural-key reference.
    """
    import re

    path = SEEDS_DIR / seed_filename
    text = path.read_text(encoding="utf-8")
    keys: set[str] = set()
    for stmt_match in re.finditer(rf"INSERT INTO {re.escape(table)}\b.*?(?=;)", text, re.DOTALL):
        stmt = stmt_match.group(0)
        for row_match in re.finditer(r"\(\s*'([a-z0-9_]+)'", stmt):
            keys.add(row_match.group(1))
    return keys


def _resolve_keys(requested: list[str], available: set[str], *, kind: str, material_id: str) -> list[str]:
    resolved = []
    for key in requested:
        if key in available:
            resolved.append(key)
        else:
            print(f"WARNING: {material_id}: {kind} key {key!r} not found in seeded {kind} table -- skipping")
    return resolved


# ---------------------------------------------------------------------------
# Emission
# ---------------------------------------------------------------------------


def _property_value_sql(material_id: str, pr: PropertyResult) -> str:
    p = pr.parsed
    subject_id_expr = f"(SELECT id FROM material WHERE slug = {sql_str(material_id)})"
    property_id_expr = f"(SELECT id FROM property_definition WHERE key = {sql_str(pr.key)})"
    if p.kind == "numeric":
        value_min, value_max, value_typical = sql_num(p.value_min), sql_num(p.value_max), sql_num(p.value_typical)
        value_text_fa = value_text_en = "NULL"
    else:
        value_min, value_max, value_typical = "NULL", "NULL", "NULL"
        # Fail loudly rather than emit a half-bilingual row, the same way a
        # missing reagent gloss stops the run below. Silence here is what put
        # 'اتیلن (Ethylene)' on an English page in the first place.
        pair = VALUE_TEXT_BILINGUAL.get(p.value_text or "")
        if pair is None:
            raise SystemExit(
                f"emit_sql: no fa/en pair for text value {p.value_text!r} "
                f"(material {material_id}, property {pr.key}) -- add it to VALUE_TEXT_BILINGUAL"
            )
        value_text_fa, value_text_en = sql_str(pair[0]), sql_str(pair[1])
    qualifier = sql_str(p.qualifier)
    unit_display = sql_str(p.unit_display)
    note_fa = sql_str(pr.note_fa)
    note_en = sql_str(pr.note_en)
    # value_text (singular) is deliberately not written: migration 0030
    # deprecated it in favour of the value_text_fa/value_text_en pair.
    return (
        "INSERT INTO property_value "
        "(subject_type, subject_id, property_id, value_min, value_max, value_typical, "
        "value_text_fa, value_text_en, unit_display, qualifier, note_fa, note_en, status)\n"
        f"SELECT 'material', {subject_id_expr}, {property_id_expr}, {value_min}, {value_max}, {value_typical}, "
        f"{value_text_fa}, {value_text_en}, {unit_display}, {qualifier}, {note_fa}, {note_en}, 'unsourced'\n"
        "ON CONFLICT (subject_type, subject_id, property_id, conditions) "
        "WHERE value_role = 'editorial' AND superseded_by IS NULL AND status <> 'superseded' DO NOTHING;"
    )


def emit_material_sql(material: ParsedMaterial, applications: list[str], processing_techniques: list[str]) -> list[str]:
    lines: list[str] = []
    mid = material.id
    slug = mid

    family_key = FAMILY_KEY_BY_LEGACY_NAME.get(material.family)
    if family_key is None:
        raise SystemExit(f"emit_sql: no family key mapping for legacy family {material.family!r} (material {mid})")

    lines.append(f"-- {'-' * 75}")
    lines.append(f"-- {mid.upper()}")
    lines.append(f"-- {'-' * 75}")

    lines.append(
        "INSERT INTO material (slug, field_id, family_id, name_fa, name_en, code, discovery_year, overview_fa, chain_type)\n"
        f"SELECT {sql_str(slug)}, "
        f"(SELECT id FROM field WHERE key = {sql_str(FIELD_KEY)}), "
        f"(SELECT id FROM family WHERE key = {sql_str(family_key)}), "
        f"{sql_str(material.name_fa)}, {sql_str(material.name_en)}, {sql_str(material.code)}, "
        f"{sql_str(material.discovery_year)}, {sql_str(material.overview_fa)}, {sql_str(material.chain_type)}\n"
        "ON CONFLICT (slug) DO NOTHING;"
    )

    # material_identifier: cas, resin_code
    lines.append(
        "INSERT INTO material_identifier (material_id, type, value)\n"
        f"SELECT (SELECT id FROM material WHERE slug = {sql_str(slug)}), 'cas', {sql_str(material.cas)}\n"
        "ON CONFLICT (material_id, type, value) DO NOTHING;"
    )
    lines.append(
        "INSERT INTO material_identifier (material_id, type, value)\n"
        f"SELECT (SELECT id FROM material WHERE slug = {sql_str(slug)}), 'resin_code', {sql_str(str(material.resin_code))}\n"
        "ON CONFLICT (material_id, type, value) DO NOTHING;"
    )

    # material_structure -- atoms only. unit_cell was dropped from this table
    # in migration 0013 (DATA-GAPS G8): the same fact was enterable both here
    # and as the registry property with key = 'unit_cell', and the registry
    # one wins because it carries citation tracking. The value still reaches
    # the database, via the property_value loop below -- parse_polymers.py
    # maps academic.unitCell to that property key like any other.
    lines.append(
        "INSERT INTO material_structure (material_id, atoms)\n"
        f"SELECT (SELECT id FROM material WHERE slug = {sql_str(slug)}), {sql_jsonb(material.atoms3d)}\n"
        "ON CONFLICT (material_id) DO NOTHING;"
    )

    # property_value
    for pr in material.properties.values():
        lines.append(_property_value_sql(mid, pr))

    # market_share_datum -- no natural-key unique constraint on this table,
    # so idempotency is done with an explicit NOT EXISTS guard keyed on
    # (material, segment_fa) rather than ON CONFLICT.
    for ms in material.market_share:
        lines.append(
            "INSERT INTO market_share_datum (material_id, segment_fa, percentage, status)\n"
            f"SELECT (SELECT id FROM material WHERE slug = {sql_str(slug)}), {sql_str(ms['segment_fa'])}, "
            f"{sql_num(ms['percentage'])}, 'unsourced'\n"
            "WHERE NOT EXISTS (\n"
            "    SELECT 1 FROM market_share_datum msd\n"
            "    JOIN material m ON m.id = msd.material_id\n"
            f"    WHERE m.slug = {sql_str(slug)} AND msd.segment_fa = {sql_str(ms['segment_fa'])}\n"
            ");"
        )

    # chemical_resistance -- same NOT EXISTS idempotency pattern, keyed on
    # (material, reagent_fa).
    for cr in material.chemical_resistance:
        reagent_en = REAGENT_EN_BY_FA.get(cr.reagent_fa)
        if reagent_en is None:
            raise SystemExit(f"emit_sql: no English gloss for reagent {cr.reagent_fa!r} (material {mid})")
        lines.append(
            "INSERT INTO chemical_resistance (material_id, reagent_fa, reagent_en, rating, note_fa, status)\n"
            f"SELECT (SELECT id FROM material WHERE slug = {sql_str(slug)}), {sql_str(cr.reagent_fa)}, "
            f"{sql_str(reagent_en)}, {sql_str(cr.rating)}::resistance_rating, {sql_str(cr.note_fa)}, 'unsourced'\n"
            "WHERE NOT EXISTS (\n"
            "    SELECT 1 FROM chemical_resistance cr\n"
            "    JOIN material m ON m.id = cr.material_id\n"
            f"    WHERE m.slug = {sql_str(slug)} AND cr.reagent_fa = {sql_str(cr.reagent_fa)}\n"
            ");"
        )

    # material_application
    for app_key in applications:
        lines.append(
            "INSERT INTO material_application (material_id, application_id)\n"
            f"SELECT (SELECT id FROM material WHERE slug = {sql_str(slug)}), (SELECT id FROM application WHERE key = {sql_str(app_key)})\n"
            "ON CONFLICT DO NOTHING;"
        )

    # material_processing_technique
    for tech_key in processing_techniques:
        lines.append(
            "INSERT INTO material_processing_technique (material_id, processing_technique_id)\n"
            f"SELECT (SELECT id FROM material WHERE slug = {sql_str(slug)}), (SELECT id FROM processing_technique WHERE key = {sql_str(tech_key)})\n"
            "ON CONFLICT DO NOTHING;"
        )

    return lines


def build_sql(materials: dict[str, ParsedMaterial]) -> str:
    known_applications = _load_seeded_keys("0001_fields_families.sql", "application")
    known_processing_techniques = _load_seeded_keys("0001_fields_families.sql", "processing_technique")

    header = [
        "-- 0005_materials_ldpe_hdpe.sql",
        "-- Polypedia seed data: LDPE and HDPE materials, generated by tools/etl/emit_sql.py",
        "-- from src/data/polymersData.ts. DO NOT EDIT BY HAND -- regenerate with:",
        "--     ./.venv/bin/python tools/etl/emit_sql.py",
        "--",
        "-- Only ldpe/hdpe are seeded here; see tools/etl/README.md for why PP, PVC,",
        "-- PET and PS are not (unresolved two-variant value strings / an oracle",
        "-- disagreement, both real defects in the legacy data, not in this tool).",
        "--",
        "-- Every property_value row is inserted with status='unsourced' -- none of",
        "-- the legacy data carries a real citation, so none is fabricated here.",
        "--",
        "-- Idempotent: safe to run twice. property_value/material_identifier/",
        "-- material_structure/material/material_application/",
        "-- material_processing_technique rely on natural-key ON CONFLICT DO NOTHING;",
        "-- market_share_datum/chemical_resistance have no natural-key unique",
        "-- constraint in the schema, so they use an explicit NOT EXISTS guard instead.",
        "",
        "BEGIN;",
        "",
    ]
    footer = ["", "COMMIT;", ""]

    body: list[str] = []
    for mid in SEEDED_MATERIAL_IDS:
        material = materials[mid]
        applications = _resolve_keys(
            APPLICATION_KEYS_BY_MATERIAL.get(mid, []), known_applications, kind="application", material_id=mid
        )
        processing_techniques = _resolve_keys(
            PROCESSING_TECHNIQUE_KEYS_BY_MATERIAL.get(mid, []),
            known_processing_techniques,
            kind="processing_technique",
            material_id=mid,
        )
        body.extend(emit_material_sql(material, applications, processing_techniques))
        body.append("")

    return "\n".join(header + body + footer)


def main() -> int:
    materials = parse_all_materials()
    require_clean(materials, SEEDED_MATERIAL_IDS)
    sql = build_sql(materials)
    OUTPUT_PATH.write_text(sql, encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} ({len(sql.splitlines())} lines)")
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
