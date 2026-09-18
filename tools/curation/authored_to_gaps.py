"""authored_to_gaps.py -- turn authored extraction CSV(s) into importer input.

The hand/LLM-authored per-polymer CSVs (curation/csv/*.csv) each use their own
column layout and are NOT what import_values.py reads. This converts one or many
of them into the two files the importer *does* read:

    curation/gaps.csv     (values + citations, GAPS_FIELDNAMES)
    curation/sources.csv  (source registry -- appends any new source, with URL)

    # one file:
    python authored_to_gaps.py curation/csv/hdpe_ldpe_lldpe_final.csv

    # bulk (many files at once -- de-dupes sources across all of them):
    python authored_to_gaps.py curation/csv/*.csv -o curation/gaps.csv

Then the normal path:
    python verify_sources.py curation/gaps.csv     # accuracy gate (recommended)
    python import_values.py --dry-run              # validate against DB
    python import_values.py                        # write, transactional

It MERGES onto a freshly exported gaps.csv when one is present, so pre-filled
plausible bounds (used by V4) survive; rows for materials/properties with no
existing gap are appended as new-value rows (import creates the property_value).
"""
from __future__ import annotations

import argparse
import csv
import glob
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import common  # noqa: E402

# reuse the schema-detecting reader so both tools agree on how to read a file
from verify_sources import to_canonical  # noqa: E402

# hosts we will not emit as a citation URL (see GEMINI-EXTRACTION-SKILL rule 3)
from verify_sources import walled_reason  # noqa: E402


def kind_and_tier(title: str, url: str) -> tuple[str, str]:
    t = (title + " " + url).lower()
    if any(k in t for k in ("tds", "technical data", "datasheet", "data sheet", "spec")):
        return "datasheet", "manufacturer_datasheet"
    if any(k in t for k in ("iso ", "astm", "din ", "iec ", "standard")):
        return "standard", "standard"
    if "doi.org" in url or "researchgate" in url or "mdpi" in url or "optica" in url:
        return "journal_article", "peer_reviewed_handbook"
    if "pubchem" in url or "wikipedia" in url or "encyclopedia" in t:
        return "encyclopedia", "community"
    if "handbook" in t:
        return "handbook", "peer_reviewed_handbook"
    return "website", "community"


def split_locator(loc: str) -> dict:
    """'Page 1 - Mechanical Properties' -> {page:'1', section:'Mechanical Properties'}."""
    out = {"page": "", "table": "", "figure": "", "section": ""}
    if not loc:
        return out
    m = re.search(r"page\s*([0-9]+)", loc, re.I)
    if m:
        out["page"] = m.group(1)
    m = re.search(r"table\s*([\w.\-]+)", loc, re.I)
    if m:
        out["table"] = m.group(1)
    rest = re.sub(r"(page\s*[0-9]+|table\s*[\w.\-]+)", "", loc, flags=re.I)
    rest = rest.strip(" -–,|")
    if rest:
        out["section"] = rest[:120]
    if not any(out.values()):
        out["section"] = loc[:120]
    return out


def raw_rows(path: Path) -> list[dict]:
    return [r for r in csv.DictReader(path.open(encoding="utf-8-sig")) if any(r.values())]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="+", help="authored CSV file(s) or globs")
    ap.add_argument("-o", "--out", default="curation/gaps.csv")
    ap.add_argument("--sources", default="curation/sources.csv")
    ap.add_argument("--allow-walled", action="store_true",
                    help="emit rows even when the URL is login-walled/pirate (default: skip=y)")
    args = ap.parse_args()

    files: list[Path] = []
    for pat in args.inputs:
        files += [Path(p) for p in glob.glob(pat)]
    if not files:
        ap.error("no input files matched")

    # existing gap rows keyed by (material, property) -> preserve export columns
    gaps_path = Path(args.out)
    gap_index: dict[tuple[str, str], dict] = {}
    ordered: list[dict] = []
    if gaps_path.exists():
        for row in csv.DictReader(gaps_path.open(encoding="utf-8-sig")):
            ordered.append(row)
            gap_index[(row["material_slug"], row["property_key"])] = row

    # existing sources -> avoid duplicate source rows
    src_rows: dict[str, dict] = {}
    src_path = Path(args.sources)
    if src_path.exists():
        for s in csv.DictReader(src_path.open(encoding="utf-8-sig")):
            if s.get("source_key"):
                src_rows[s["source_key"]] = s
    url_to_key = {s.get("url"): k for k, s in src_rows.items() if s.get("url")}
    used_keys = set(src_rows)

    appended = 0
    filled = 0
    skipped_walled = 0
    new_sources = 0

    for f in files:
        for raw in raw_rows(f):
            c = to_canonical(raw)
            if not c["material"] or not c["property"] or not c["value"]:
                continue
            title = raw.get("source_title", "").strip() or "Untitled source"
            url = c["url"]

            # source registry: reuse by URL, else mint a new source_key
            key = url_to_key.get(url)
            if not key:
                key = common.disambiguate_key(common.slugify_source_key(title), used_keys)
                kind, tier = kind_and_tier(title, url)
                src_rows[key] = {"source_key": key, "title": title, "authors": "",
                                 "publisher": "", "edition": "", "year": "", "isbn": "",
                                 "doi": url if "doi.org" in url else "",
                                 "url": url, "kind": kind, "tier": tier}
                used_keys.add(key)
                if url:
                    url_to_key[url] = key
                new_sources += 1

            loc = split_locator(c["locator"])
            walled = walled_reason(url) if url else None
            skip = "y" if (walled and not args.allow_walled) else ""
            if skip:
                skipped_walled += 1

            payload = {
                "value_typical": c["value"],
                "value_min": raw.get("value_min", "").strip(),
                "value_max": raw.get("value_max", "").strip(),
                "source_key": key,
                "page": loc["page"], "table": loc["table"],
                "figure": loc["figure"], "section": loc["section"],
                "test_method": raw.get("test_standard", "").strip() or raw.get("test_method", "").strip(),
                "conditions": raw.get("test_condition", "").strip() or raw.get("test_conditions", "").strip(),
                "note_en": (raw.get("verbatim_quote") or raw.get("note_en") or "").strip()[:300],
                "confidence": raw.get("confidence", "").strip() or "0.9",
                "skip": skip,
                "role": raw.get("role", "").strip(),
            }

            existing = gap_index.get((c["material"], c["property"]))
            if existing:
                existing.update(payload)
                filled += 1
            else:
                newrow = {fn: "" for fn in common.GAPS_FIELDNAMES}
                newrow["material_slug"] = c["material"]
                newrow["property_key"] = c["property"]
                newrow["unit"] = c["unit"]
                newrow.update(payload)
                ordered.append(newrow)
                gap_index[(c["material"], c["property"])] = newrow
                appended += 1

    with gaps_path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=common.GAPS_FIELDNAMES)
        w.writeheader()
        for row in ordered:
            w.writerow({k: row.get(k, "") for k in common.GAPS_FIELDNAMES})

    with src_path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=common.SOURCES_FIELDNAMES)
        w.writeheader()
        for s in src_rows.values():
            w.writerow({k: s.get(k, "") for k in common.SOURCES_FIELDNAMES})

    print(f"filled {filled} existing gap rows, appended {appended} new rows")
    print(f"sources: +{new_sources} new (registry now {len(src_rows)})")
    if skipped_walled:
        print(f"skip=y on {skipped_walled} rows with login-walled/pirate URLs "
              f"(use --allow-walled to override)")
    print(f"wrote {gaps_path} and {src_path}")


if __name__ == "__main__":
    main()
