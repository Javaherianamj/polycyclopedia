"""Imports curation/hsp-polymers.csv (Hansen's handbook, Appendix A Table
A.2) into the `hsp_correlation` table, inside a single transaction.

    python import_hsp_correlations.py --dry-run     # validate + report, write nothing
    python import_hsp_correlations.py                # validate + write, one transaction

Sibling to import_solvents.py (Table A.1) -- same contract:

* Idempotent by natural key. `hsp_correlation.key` is UNIQUE; re-running
  this script upserts by key (INSERT ... ON CONFLICT (key) DO UPDATE)
  instead of creating duplicates. A row that already carries evidence is
  left alone there -- re-running never doubles up citations.
* REUSES the existing Hansen handbook `source` row that import_solvents.py
  creates on first run (matched by the same (title, edition) natural key).
  Table A.1 and Table A.2 are two appendices of the SAME book -- this
  script must never create a second `source` row for it. If the source row
  does not exist yet (import_solvents.py has not been run), this script
  creates it itself using the identical SOURCE dict, so it does not have a
  hard ordering dependency on the other script having run first -- but on a
  repo where both have run, this always resolves to the one row.
* Every row gets a citation with a real page locator -- extract_hsp_
  polymers.py recovered the actual printed page for each row from the
  book's running headers, exactly like extract_hsp.py does for Table A.1.
  role='primary', extraction_method='table_parser' (mechanically parsed
  from a printed table, not typed in by hand).
* The DB's CHECK constraints (hsp_correlation_hansen_plausible_chk,
  hsp_correlation_r0_chk) are the last line of defense against a parser
  bug: a row IntegrityError rejects here, is reported by row and reason,
  and is never silently retried with widened bounds.

CATALOG LINKING -- EXPLICIT MAPPING, NEVER FUZZY MATCHING
------------------------------------------------------------
CATALOG_LINKS below is a hand-reviewed dict of {material.slug: hsp-polymers.csv
`key`}, built by reading every A.2 row whose name plausibly refers to one of
the 17 catalog materials (verified directly against `SELECT slug, name_en
FROM material` -- 17 at review time, not the 7 the original task scoping
assumed) and picking ONE per material where several trade names exist. A
wrong link would attach a wrong solubility sphere to a real datasheet, so
this is never done by string similarity -- see the dict's own comments for
the reasoning behind each choice, and for the near-misses left unlinked.

ON THE "R "-PREFIXED ROWS (R PET, R PMMA, R ABS, R POLYCARBONATE, R PA66,
R POM ACETAL, ...): checked against the book's own "COMMENTS TO TABLE A.2"
section (pdftotext -layout curation/hsp.pdf - | sed -n '9066,9260p')
before relying on them. Its "POLYMERS 390-412" note reads verbatim: "These
correlations use data from the RAPRA collection of data on chemical
resistance for plastics." That is the SAME methodology tier as the plain
"HDPE"/"PP" rows this mapping also links (No. 168-181, whose own comment
reads "based on data in resistance tables in the Modern Plastics
Encyclopedia") -- both are chemical-resistance-table-derived, from
different compilations. Nothing in the book flags one tier as more
reliable than the other. The ONLY correlations this table explicitly
flags as lower quality are the ones filed under the printed section
heading "Based on Solvent Range Solubility Data - Not too Reliable" (Nos.
193-232ish) -- which is exactly the section the bare "PVC"/"PS"/"PC"/
"PMMA" rows live in, and exactly why this mapping prefers the RAPRA-tier
"R "-prefixed / section-titled rows over those bare ones. Rejecting the
whole "R "-prefix as lower confidence (an earlier version of this mapping
did) was not supported by the source text once checked -- corrected here.
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
DEFAULT_CSV_PATH = CURATION_DIR / "hsp-polymers.csv"

# Must match import_solvents.py's SOURCE dict exactly (same natural key:
# title + edition) -- this is what makes source-row reuse work regardless
# of which importer runs first.
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

CREATED_BY = "hsp-correlation-import"
DEFAULT_CONFIDENCE = 0.9
TABLE_LABEL = "A.2"

HANSEN_BOUND = 60.0

# ---------------------------------------------------------------------------
# CATALOG_LINKS: material.slug -> hsp-polymers.csv `key` of the ONE Table A.2
# row that correlation is linked to. See the module docstring for why the
# "R "-prefixed RAPRA rows are treated as equally trustworthy as the bare
# "HDPE"/"PP" rows (both are chemical-resistance-table-derived per the
# book's own comments) and why the printed "Not too Reliable" section is
# avoided wherever a better-sourced alternative exists.
#
# pvc -> "vipla-kr-pvc" (No. 39, "VIPLA KR (PVC)", filed directly under the
#   "Polyvinylchloride" section heading). Chosen over the bare "PVC" row
#   (No. 205, filed under "Based on Solvent Range Solubility Data - Not too
#   Reliable" -- the one section this table explicitly flags as lower
#   quality) and over the many PVC trade-name variants (VINYLITE VAGD/
#   VAGH/VMCA/..., EXON 470/471/473, GEON 121, SARAN F-120/F-220, the
#   "PVC 20 MIN/1 HR/4 HR" film-thickness test variants).
#
# ps -> "polystyrene-lg" (No. 68, "POLYSTYRENE LG", filed under the generic
#   "Polystyrene" section heading). Chosen over the bare "PS" row (No. 203,
#   same "not too reliable" section as the rejected bare PVC above) and the
#   STYRON trade-name rows (Nos. 294-296).
#
# pet -> "r-pet" (No. 401, "R PET", "Chemical Resistance of Plastics" /
#   RAPRA section -- see docstring). Chosen over "MYLAR PET" (No. 213,
#   "not too reliable" section, and names a specific DuPont trade product
#   rather than the generic polymer) and "PETG" (No. 179, glycol-modified
#   PET, a distinct copolymer from the homopolymer `pet` describes).
#
# hdpe -> "hdpe" (No. 180, bare "HDPE", "Chemical Resistance Data - Modern
#   Plastics Encylopedia" section). The table's own literal "HDPE" entry.
#
# pp -> "pp" (No. 181, bare "PP", same section as hdpe above). The other
#   polypropylene candidate, "R POLYPROPYLENE" (No. 407), fails this
#   table's own plausibility bound (a negative Hydrogen Bonding value) and
#   is rejected at validation, independent of the R-prefix question.
#
# pmma -> "r-pmma" (No. 403, RAPRA section). Chosen over "LUCITE 2044 PMMA"
#   (No. 63, a specific commercial grade), the bare "PMMA" (No. 208, "not
#   too reliable" section), "PMMA CR" (No. 155, a different chemical-
#   resistance sub-list), and the concentration-specific "R+H PMMA" /
#   "PMMA (10%)" / "PMMA (30%)" rows.
#
# abs -> "r-abs" (No. 390, RAPRA section). The only other ABS row, "ABS CR"
#   (No. 159), is from a different chemical-resistance sub-list (PLASTGUIDE,
#   Nos. 149-160) -- either would be defensible; RAPRA is preferred for
#   consistency with the other picks in this same section.
#
# pc -> "r-polycarbonate" (No. 399, RAPRA section). Chosen over the bare
#   "PC" row (No. 211, "not too reliable" section).
#
# pa66 -> "r-pa66" (No. 396, RAPRA section). Chosen over "PA66 SOL" (No.
#   150, PLASTGUIDE section) for consistency with the other RAPRA picks.
#
# pa6 -> "pa6-cr" (No. 149, PLASTGUIDE section) -- the only PA6 candidate;
#   the RAPRA section has R PA12 and R PA66, not R PA6.
#
# pom -> "r-pom-acetal" (No. 394, RAPRA section). Chosen over "ACETAL
#   CELANESE" / "ACETALHOMO-DUO" (Nos. 168-169, specific commercial grades,
#   Modern Plastics Encyclopedia section).
#
# ptfe -> "ptfe-l80-cr" (No. 154, PLASTGUIDE section) -- the only row whose
#   name contains "PTFE" outright. "TEFLON (SL2-)" (No. 110) was considered
#   and rejected: filed under the unrelated "Silicone Resins" heading, a
#   labelling anomaly (Teflon is PTFE, not a silicone), not a trustworthy
#   generic PTFE entry.
#
# ldpe, lldpe -> intentionally UNLINKED. No bare "LDPE" or "LLDPE" row
#   exists in Table A.2. The only LDPE-named rows are permeation-specific
#   ("LDPE PERM>80", "LDPE PERM<0.8", Nos. 368-369 -- two different values
#   for the same polymer depending on which permeant class is being
#   modelled, not one canonical sphere) and a combined "R HDPE/LDPE" row
#   (No. 400) that does not distinguish the two. Picking either permeation
#   variant as "the" LDPE correlation would be exactly the judgement call
#   the task brief prohibits.
#
# pla, epoxy, epdm -> intentionally UNLINKED.
#   - pla: verified absent (no row names polylactic acid or any PLA trade
#     name -- unsurprising, this edition predates PLA's commercial use).
#   - epoxy: multiple non-generic candidates (EPIKOTE 828/1001/1004/1007/
#     1009, ARALDITE DY O25, PKHH, "R EPOXY COLD CURING" No. 408, "R EPOXY
#     HOT CURING" No. 409) but no single unambiguous generic entry --
#     cold- vs. hot-curing epoxies are materially different formulations.
#   - epdm: the one EPDM row, "R EPDM" (No. 378), fails this table's own
#     plausibility bound (a negative Polar value) and is rejected at
#     validation before linking would even apply.
CATALOG_LINKS: dict[str, str] = {
    "pvc": "vipla-kr-pvc",
    "ps": "polystyrene-lg",
    "pet": "r-pet",
    "hdpe": "hdpe",
    "pp": "pp",
    "pmma": "r-pmma",
    "abs": "r-abs",
    "pc": "r-polycarbonate",
    "pa66": "r-pa66",
    "pa6": "pa6-cr",
    "pom": "r-pom-acetal",
    "ptfe": "ptfe-l80-cr",
}


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
class PlannedCorrelation:
    row_number: int
    key: str
    handbook_number: int | None
    name_raw: str
    section: str | None
    uncertainty: str | None
    hansen_d: float
    hansen_p: float
    hansen_h: float
    r0: float
    page: int | None
    material_id: int | None


def load_csv(path: Path) -> list[tuple[int, dict]]:
    if not path.exists():
        raise SystemExit(f"{path} not found. Run extract_hsp_polymers.py first.")
    with path.open(newline="", encoding=CSV_ENCODING) as f:
        reader = csv.DictReader(f)
        return [(i, row) for i, row in enumerate(reader, start=2)]


def parse_float(raw: str, row_number: int, field: str, key: str) -> float:
    try:
        return float(raw)
    except (TypeError, ValueError):
        raise RowError(row_number, f"'{field}' value {raw!r} is not a number.", key)


def validate_row(row_number: int, row: dict, material_ids_by_key: dict[str, int]) -> PlannedCorrelation:
    key = (row.get("key") or "").strip()
    if not key:
        raise RowError(row_number, "no 'key' given -- every correlation row needs a stable, unique slug.")
    name_raw = (row.get("name_raw") or "").strip()
    if not name_raw:
        raise RowError(row_number, "no 'name_raw' given.", key)

    # A CSV row explicitly flagged by the extractor (out-of-range values,
    # or -- if a future re-extraction ever produces one -- a column-drift
    # note) is never imported: the task's "flag, don't guess" rule extends
    # to the importer, not just the extractor. Rejected here with the
    # extractor's own note as the reason, same as a DB rejection.
    note = (row.get("note") or "").strip()
    if note:
        raise RowError(row_number, f"flagged by extract_hsp_polymers.py, not imported: {note}", key)

    d = parse_float(row.get("hansen_d") or "", row_number, "hansen_d", key)
    p = parse_float(row.get("hansen_p") or "", row_number, "hansen_p", key)
    h = parse_float(row.get("hansen_h") or "", row_number, "hansen_h", key)
    r0 = parse_float(row.get("r0") or "", row_number, "r0", key)

    # Mirror the DB's own CHECK constraints here so a bad row is reported
    # with the CSV row number and a plain-language reason, rather than
    # surfacing as a raw psycopg IntegrityError. Never loosen these to make
    # a row fit -- a rejection here means re-check the PDF.
    for label, value in (("hansen_d", d), ("hansen_p", p), ("hansen_h", h)):
        if value < 0 or value > HANSEN_BOUND:
            raise RowError(
                row_number,
                f"{label}={value} is outside the plausible range [0, {HANSEN_BOUND}] MPa^0.5. "
                "This is almost certainly a parser column-shift, not real chemistry -- "
                "re-check this row against the PDF before overriding anything.",
                key,
            )
    if not (0 < r0 <= HANSEN_BOUND):
        raise RowError(
            row_number,
            f"r0={r0} is outside the plausible range (0, {HANSEN_BOUND}] MPa^0.5.",
            key,
        )

    page_raw = (row.get("page") or "").strip()
    page = int(page_raw) if page_raw else None

    handbook_number_raw = (row.get("handbook_number") or "").strip()
    handbook_number = int(handbook_number_raw) if handbook_number_raw else None

    material_slug = None
    for slug, csv_key in CATALOG_LINKS.items():
        if csv_key == key:
            material_slug = slug
            break
    material_id = material_ids_by_key.get(material_slug) if material_slug else None
    if material_slug and material_id is None:
        raise RowError(
            row_number,
            f"CATALOG_LINKS names material slug '{material_slug}' for this row, but no material "
            "with that slug exists in the database -- check for a catalog rename.",
            key,
        )

    return PlannedCorrelation(
        row_number=row_number,
        key=key,
        handbook_number=handbook_number,
        name_raw=name_raw,
        section=(row.get("section") or "").strip() or None,
        uncertainty=(row.get("uncertainty") or "").strip() or None,
        hansen_d=d,
        hansen_p=p,
        hansen_h=h,
        r0=r0,
        page=page,
        material_id=material_id,
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


def load_material_ids_by_slug(conn) -> dict[str, int]:
    with conn.cursor() as cur:
        cur.execute("SELECT slug, id FROM material;")
        return dict(cur.fetchall())


def load_existing_correlations(conn) -> dict[str, int]:
    with conn.cursor() as cur:
        cur.execute("SELECT key, id FROM hsp_correlation;")
        return dict(cur.fetchall())


def load_correlations_with_evidence(conn) -> set[int]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT DISTINCT subject_id FROM evidence WHERE subject_type = 'hsp_correlation';"
        )
        return {row[0] for row in cur.fetchall()}


def upsert_correlation(conn, plan: PlannedCorrelation) -> tuple[int, bool]:
    """Returns (correlation_id, was_inserted)."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO hsp_correlation (key, handbook_number, name_raw, section, material_id,
                                          hansen_d, hansen_p, hansen_h, r0, uncertainty, status)
            VALUES (%(key)s, %(handbook_number)s, %(name_raw)s, %(section)s, %(material_id)s,
                    %(hansen_d)s, %(hansen_p)s, %(hansen_h)s, %(r0)s, %(uncertainty)s, 'published')
            ON CONFLICT (key) DO UPDATE SET
                handbook_number = EXCLUDED.handbook_number,
                name_raw = EXCLUDED.name_raw,
                section = EXCLUDED.section,
                material_id = EXCLUDED.material_id,
                hansen_d = EXCLUDED.hansen_d,
                hansen_p = EXCLUDED.hansen_p,
                hansen_h = EXCLUDED.hansen_h,
                r0 = EXCLUDED.r0,
                uncertainty = EXCLUDED.uncertainty
            RETURNING id, (xmax = 0) AS was_inserted;
            """,
            {
                "key": plan.key,
                "handbook_number": plan.handbook_number,
                "name_raw": plan.name_raw,
                "section": plan.section,
                "material_id": plan.material_id,
                "hansen_d": plan.hansen_d,
                "hansen_p": plan.hansen_p,
                "hansen_h": plan.hansen_h,
                "r0": plan.r0,
                "uncertainty": plan.uncertainty,
            },
        )
        correlation_id, was_inserted = cur.fetchone()
    return correlation_id, was_inserted


def insert_citation_and_evidence(conn, correlation_id: int, plan: PlannedCorrelation, source_document_id: int) -> None:
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
            VALUES ('hsp_correlation', %s, %s, 'primary', 'table_parser', %s, %s);
            """,
            (correlation_id, citation_id, DEFAULT_CONFIDENCE, CREATED_BY),
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV_PATH)
    parser.add_argument("--dry-run", action="store_true", help="Validate and report; write nothing.")
    args = parser.parse_args()

    csv_rows = load_csv(args.csv)

    conn = get_connection()
    try:
        material_ids_by_slug = load_material_ids_by_slug(conn)

        errors: list[RowError] = []
        plans: list[PlannedCorrelation] = []
        seen_keys: dict[str, int] = {}
        flagged_skipped = 0
        for row_number, row in csv_rows:
            try:
                plan = validate_row(row_number, row, material_ids_by_slug)
            except RowError as exc:
                if "flagged by extract_hsp_polymers.py" in exc.message:
                    flagged_skipped += 1
                else:
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

        print(f"{len(csv_rows)} rows read: {len(plans)} valid, {flagged_skipped} skipped (flagged by "
              f"the extractor, not imported), {len(errors)} rejected.")
        if errors:
            print(f"\n{len(errors)} row(s) rejected:")
            for err in errors:
                print(f"  - {err.render()}")

        linked = [p for p in plans if p.material_id is not None]
        if linked:
            print(f"\n{len(linked)} row(s) linked to a catalog material:")
            slug_by_material_id = {v: k for k, v in material_ids_by_slug.items()}
            for p in linked:
                print(f"  - {p.key} (No. {p.handbook_number}, {p.name_raw!r}) -> material "
                      f"'{slug_by_material_id.get(p.material_id, p.material_id)}'")

        exit_code = 1 if errors else 0

        if not plans:
            print("\nNothing to import.")
            sys.exit(exit_code)

        source_id = resolve_source_id(conn)
        source_document_id = resolve_source_document_id(conn, source_id)
        existing = load_existing_correlations(conn)
        already_cited = load_correlations_with_evidence(conn)

        inserted = 0
        updated = 0
        cited = 0
        skipped_citation = 0
        write_errors: list[RowError] = []

        for plan in plans:
            try:
                correlation_id, was_inserted = upsert_correlation(conn, plan)
            except Exception as exc:  # noqa: BLE001 -- surfaced as a per-row report, not a crash
                write_errors.append(RowError(plan.row_number, f"database rejected this row: {exc}", plan.key))
                continue
            if was_inserted:
                inserted += 1
            else:
                updated += 1

            if correlation_id in already_cited:
                skipped_citation += 1
                continue
            insert_citation_and_evidence(conn, correlation_id, plan, source_document_id)
            already_cited.add(correlation_id)
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
              f"({skipped_citation} correlation(s) already had evidence, citation skipped).")
        sys.exit(exit_code)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
