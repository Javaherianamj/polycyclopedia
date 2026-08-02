"""Shared helpers for the curation CSV workflow (``export_gaps.py`` /
``import_values.py``): database connection, CSV column contracts, and the
handful of formatting/slugging functions both scripts need to agree on.

See ``aidlc-docs/construction/curation-workflow/functional-design/curation-design.md``
for the full design. This module has no side effects on import beyond
resolving paths -- it never opens a connection or touches disk until one of
its functions is called.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
CURATION_DIR = REPO_ROOT / "curation"
GAPS_CSV_PATH = CURATION_DIR / "gaps.csv"
SOURCES_CSV_PATH = CURATION_DIR / "sources.csv"
NEW_MATERIALS_CSV_PATH = CURATION_DIR / "new_materials.csv"
DB_ENV_PATH = REPO_ROOT / "db" / ".env"

# ---------------------------------------------------------------------------
# CSV column contracts (curation-design.md sections 4 and 5)
# ---------------------------------------------------------------------------

# Columns export_gaps.py fills in. The curator should not edit these -- they
# are identifiers and read-only context.
GAPS_EXPORT_FIELDS = [
    "material_slug",
    "property_key",
    "property_name_en",
    "property_name_fa",
    "unit",
    "plausible_min",
    "plausible_max",
    "current_value",
]

# Columns the curator fills in. Blank unless they've done the work.
GAPS_CURATOR_FIELDS = [
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
    "note_fa",
    "confidence",
    "skip",
]

GAPS_FIELDNAMES = GAPS_EXPORT_FIELDS + GAPS_CURATOR_FIELDS

SOURCES_FIELDNAMES = [
    "source_key",
    "title",
    "authors",
    "publisher",
    "edition",
    "year",
    "isbn",
    "doi",
    "url",
    "kind",
    "tier",
]

# Locator columns, in the order the CHECK constraint on citation.locator
# cares about (any one is sufficient -- see V5).
LOCATOR_FIELDS = ["page", "table", "figure", "section"]

# curation/new_materials.csv -- import_materials.py's input, the counterpart
# to GAPS_FIELDNAMES for creating a material rather than citing one. Order
# matches the table in the task/README: identity + classification columns
# first, then the free-text/optional ones.
NEW_MATERIALS_FIELDNAMES = [
    "slug",
    "field_key",
    "family_key",
    "family_name_fa",
    "family_name_en",
    "name_fa",
    "name_en",
    "code",
    "cas",
    "resin_code",
    "discovery_year",
    "overview_fa",
    "overview_en",
    "chain_type",
]

# Columns that must be non-blank for every real (non-comment) row.
NEW_MATERIALS_REQUIRED_FIELDS = ["slug", "field_key", "family_key", "name_fa", "name_en"]

QUALIFIERS = {"<", ">", "~", ">=", "<="}

DEFAULT_CONFIDENCE = 0.9

# Encoding note: utf-8-sig (UTF-8 with a BOM) so Excel on Windows opens the
# file with Persian (name_fa / note_fa) text intact instead of guessing an
# 8-bit codepage and mangling it into mojibake. Plain "utf-8" round-trips
# fine in every other tool but silently breaks in Excel, which is the
# curator's actual environment -- see curation-design.md section 1.
CSV_ENCODING = "utf-8-sig"


# ---------------------------------------------------------------------------
# Database connection
# ---------------------------------------------------------------------------


def _parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


def load_db_config() -> dict[str, str]:
    """Reads db/.env (never committed) for connection settings.

    Mirrors the variable names api/.env.example uses on purpose, so the same
    mental model applies: connect as APP_DB_USER (polypedia_app), never as
    the schema owner. Environment variables already set in the shell take
    precedence over the file, for CI / ad-hoc overrides.
    """
    import os

    file_values = _parse_env_file(DB_ENV_PATH)

    def get(key: str, default: str | None = None) -> str | None:
        return os.environ.get(key) or file_values.get(key) or default

    host = get("DB_HOST", "localhost")
    port = get("POSTGRES_PORT", "5432")
    dbname = get("POSTGRES_DB", "polypedia")
    user = get("APP_DB_USER", "polypedia_app")
    password = get("APP_DB_PASSWORD")

    if not password:
        raise RuntimeError(
            "No APP_DB_PASSWORD found in the environment or in db/.env. "
            "Copy db/.env.example to db/.env and fill in APP_DB_PASSWORD "
            "(the polypedia_app role's password), or export it directly."
        )

    return {
        "host": host,
        "port": port,
        "dbname": dbname,
        "user": user,
        "password": password,
    }


def get_connection():
    """Opens a psycopg connection as polypedia_app (never the schema owner).

    Autocommit is left off (psycopg's default) so callers control the
    transaction boundary explicitly with conn.commit() / conn.rollback() --
    the importer relies on this to make the whole file one transaction.
    """
    import psycopg

    config = load_db_config()
    return psycopg.connect(
        host=config["host"],
        port=config["port"],
        dbname=config["dbname"],
        user=config["user"],
        password=config["password"],
    )


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------


def format_number(value: Any) -> str:
    """Renders a DB numeric as plain text without a spurious trailing .0."""
    if value is None:
        return ""
    f = float(value)
    if f.is_integer():
        return str(int(f))
    # Avoid float repr noise (e.g. 0.1 + 0.2); DB values already came from
    # double precision / numeric columns with sane precision.
    return f"{f:g}"


def format_current_value(
    value_min: Any,
    value_max: Any,
    value_typical: Any,
    value_text: str | None,
    value_enum: str | None,
    value_bool: bool | None,
) -> str:
    """Human-readable rendering of whichever value fields are set.

    Used only for the read-only current_value export column -- never parsed
    back on import.
    """
    if value_min is not None or value_max is not None:
        lo = format_number(value_min) if value_min is not None else "?"
        hi = format_number(value_max) if value_max is not None else "?"
        return f"{lo} - {hi}"
    if value_typical is not None:
        return format_number(value_typical)
    if value_text:
        return value_text
    if value_enum:
        return value_enum
    if value_bool is not None:
        return "true" if value_bool else "false"
    return ""


_SLUG_WORD_RE = re.compile(r"[A-Za-z0-9]+")
_EDITION_NUMBER_RE = re.compile(r"(\d+)")


def slugify_source_key(
    title: str,
    edition: str | None = None,
    max_words: int = 6,
) -> str:
    """Deterministic source_key from a title (+ optional edition).

    Not guaranteed unique on its own -- callers exporting a whole
    bibliography should track already-used keys and disambiguate collisions
    (see export_gaps.py). Deterministic so re-exporting the same source
    produces the same key a curator would recognise.

    Example: ("Polymer Handbook", "4th Edition") -> "polymer-handbook-4e"
    """
    words = _SLUG_WORD_RE.findall(title.lower())[:max_words]
    base = "-".join(words) or "source"
    if edition:
        m = _EDITION_NUMBER_RE.search(edition)
        if m:
            base = f"{base}-{m.group(1)}e"
    return base


def disambiguate_key(key: str, used_keys: set[str], suffix: str | None = None) -> str:
    """Appends -{suffix} or -2, -3, ... until `key` is not in `used_keys`."""
    if key not in used_keys:
        return key
    if suffix and f"{key}-{suffix}" not in used_keys:
        return f"{key}-{suffix}"
    i = 2
    candidate = f"{key}-{i}"
    while candidate in used_keys:
        i += 1
        candidate = f"{key}-{i}"
    return candidate


def normalize_test_method(raw: str) -> str:
    """Normalizes "ASTM D1238" / "astm d1238" / "  ASTM   D1238 " to a
    canonical "ASTM D1238" form for matching against test_method rows,
    which store standard_body ("ASTM") and code ("D1238") separately.
    """
    parts = raw.strip().split(None, 1)
    if len(parts) != 2:
        return raw.strip().upper()
    body, code = parts
    return f"{body.strip().upper()} {code.strip().upper()}"


def is_blank(value: str | None) -> bool:
    return value is None or value.strip() == ""
