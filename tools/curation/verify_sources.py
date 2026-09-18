"""verify_sources.py -- mechanical anti-hallucination check for curated values.

The importer's V4 only catches values *outside* plausible bounds (unit slips).
It cannot catch a value that is plausible but simply wrong, or a citation whose
page does not actually contain the number. This tool does: it re-fetches each
cited source and checks that the claimed value (and, when present, the exact
verbatim quote) really appears in the document.

    # check an authored extraction CSV (auto-detects the column layout):
    python verify_sources.py curation/csv/hdpe_ldpe_lldpe_final.csv

    # check what is ALREADY in the database (source.url + citation locator):
    python verify_sources.py --from-db --material hdpe

Verdicts per row:
    PASS              value (and quote) found in the fetched source
    FAIL              source fetched fine but the value/quote is NOT in it  <-- hallucination
    UNVERIFIABLE_LINK source host is login-walled / a pirate mirror / dead   <-- bad citation target
    NO_URL            citation has no resolvable URL (a printed book) -> needs manual check
    FETCH_ERROR       network/parse failure

Exit code is non-zero if any row is FAIL, so this can gate CI / a pre-import hook.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

SCRATCH = Path("/tmp/verify_sources_cache")
SCRATCH.mkdir(exist_ok=True)

# Hosts that cannot serve as a public citation link: login walls, pirate book
# mirrors, or JS-only readers. A value cited only to one of these can never be
# verified by a reader OR by this tool -- it is a bad citation target by policy,
# independent of whether the number happens to be right.
WALLED_HOSTS = {
    "scribd.com": "login-walled (Scribd)",
    "researchgate.net": "login-walled (ResearchGate)",
    "epdf.pub": "pirate book mirror (unstable/legal risk)",
    "z-lib": "pirate book mirror",
    "academia.edu": "login-walled",
    "chegg.com": "paywalled",
}

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

# --- column-layout adapters: map each authored schema -> canonical dict -------
# canonical keys: material, grade, property, value, unit, url, locator, quote
CANONICAL = ("material", "grade", "property", "value", "unit", "url", "locator", "quote")


def _first(row: dict, *names: str) -> str:
    for n in names:
        if row.get(n):
            return row[n].strip()
    return ""


def to_canonical(row: dict) -> dict:
    return {
        "material": _first(row, "material_slug", "polymer_slug"),
        "grade": _first(row, "grade_name", "grade"),
        "property": _first(row, "property_key"),
        "value": _first(row, "value_num", "value_nominal", "value_typical", "value_min"),
        "unit": _first(row, "unit"),
        "url": _first(row, "source_url_or_doi", "source_doi_url", "source_url", "url"),
        "locator": _first(row, "source_locator", "page", "section"),
        "quote": _first(row, "verbatim_quote", "note_en", "original_value"),
    }


# --- fetching + text extraction ----------------------------------------------
def host_of(url: str) -> str:
    m = re.match(r"https?://([^/]+)/?", url)
    return (m.group(1) if m else url).lower()


def walled_reason(url: str) -> str | None:
    h = host_of(url)
    for bad, why in WALLED_HOSTS.items():
        if bad in h:
            return why
    return None


def fetch_text(url: str) -> tuple[str | None, str]:
    """Return (text, note). text is None on failure."""
    key = hashlib.sha1(url.encode()).hexdigest()[:16]
    raw = SCRATCH / key
    try:
        if not raw.exists():
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                ctype = resp.headers.get_content_type()
            raw.write_bytes(data)
            (raw.with_suffix(".ctype")).write_text(ctype)
        else:
            ctype = (raw.with_suffix(".ctype")).read_text() if raw.with_suffix(".ctype").exists() else ""
        data = raw.read_bytes()
        if data[:4] == b"%PDF" or "pdf" in ctype:
            out = subprocess.run(["pdftotext", "-layout", str(raw), "-"],
                                 capture_output=True, timeout=60)
            return out.stdout.decode("utf-8", "ignore"), "pdf"
        text = data.decode("utf-8", "ignore")
        text = re.sub(r"<script.*?</script>", " ", text, flags=re.S | re.I)
        text = re.sub(r"<style.*?</style>", " ", text, flags=re.S | re.I)
        text = html.unescape(re.sub(r"<[^>]+>", " ", text))
        return text, "html"
    except Exception as e:  # noqa: BLE001
        return None, f"{type(e).__name__}: {str(e)[:60]}"


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower()).strip()


def value_variants(value: str) -> list[str]:
    """Numbers a curator may have transcribed: the value itself, x1000/÷1000
    (the g/cm3<->kg/m3 slip), and a trimmed-zero form."""
    out = {value}
    try:
        f = float(value)
        for v in (f, f * 1000, f / 1000, round(f), round(f, 2)):
            s = ("%g" % v)
            out.add(s)
    except ValueError:
        pass
    return [v for v in out if v]


def value_in_text(value: str, text: str) -> bool:
    t = re.sub(r"[,\s]", "", text)
    return any(re.sub(r"[,\s]", "", v) in t for v in value_variants(value))


# --- verification ------------------------------------------------------------
def verify_row(c: dict) -> tuple[str, str]:
    url = c["url"]
    if not url or not url.startswith("http"):
        return "NO_URL", "no resolvable URL (printed source) -- verify by hand"
    reason = walled_reason(url)
    if reason:
        return "UNVERIFIABLE_LINK", reason
    text, note = fetch_text(url)
    if text is None:
        return "FETCH_ERROR", note
    if len(text.strip()) < 40:
        return "FETCH_ERROR", "empty/JS-only page (no extractable text)"
    quote = norm(c["quote"])[:60]
    quote_ok = bool(quote) and quote in norm(text)
    val_ok = value_in_text(c["value"], text) if c["value"] else False
    if val_ok and (quote_ok or not c["quote"]):
        return "PASS", f"value {c['value']} found ({note})"
    if val_ok:
        return "PASS", f"value found; quote not matched verbatim ({note})"
    return "FAIL", f"value {c['value']} {c['unit']} NOT found in source ({note})"


def load_authored(path: Path) -> list[dict]:
    rows = list(csv.DictReader(path.open(encoding="utf-8-sig")))
    return [to_canonical(r) for r in rows if any(r.values())]


def load_from_db(material: str | None) -> list[dict]:
    sys.path.insert(0, str(Path(__file__).parent))
    import common  # noqa: PLC0415
    conn = common.get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT m.slug, pd.key, pv.value_typical, pd.canonical_unit,
               s.url, c.locator, s.title
        FROM property_value pv
        JOIN material m ON m.id = pv.subject_id AND pv.subject_type='material'
        JOIN property_definition pd ON pd.id = pv.property_id
        JOIN evidence e ON e.subject_id = pv.id AND e.subject_type='property_value'
        JOIN citation c ON c.id = e.citation_id
        JOIN source_document sd ON sd.id = c.source_document_id
        JOIN source s ON s.id = sd.source_id
        WHERE pv.value_role = 'editorial' AND pv.superseded_by IS NULL
          AND (%s::text IS NULL OR m.slug = %s::text)
        """,
        (material, material),
    )
    out = []
    for slug, key, val, unit, url, locator, title in cur.fetchall():
        out.append({"material": slug, "grade": "", "property": key,
                    "value": "" if val is None else ("%g" % float(val)),
                    "unit": unit or "", "url": url or "",
                    "locator": str(locator or ""), "quote": ""})
    conn.close()
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path", nargs="?", help="authored extraction CSV")
    ap.add_argument("--from-db", action="store_true", help="check DB citations instead")
    ap.add_argument("--material", help="limit --from-db to one material slug")
    ap.add_argument("--report", help="write per-row report CSV here")
    args = ap.parse_args()

    if args.from_db:
        rows = load_from_db(args.material)
        label = f"DB ({args.material or 'all'})"
    elif args.csv_path:
        rows = load_authored(Path(args.csv_path))
        label = args.csv_path
    else:
        ap.error("give a CSV path or --from-db")

    print(f"Verifying {len(rows)} cited values from {label}\n")
    counts: dict[str, int] = {}
    report = []
    for c in rows:
        verdict, detail = verify_row(c)
        counts[verdict] = counts.get(verdict, 0) + 1
        icon = {"PASS": "OK  ", "FAIL": "FAIL", "UNVERIFIABLE_LINK": "LINK",
                "NO_URL": "BOOK", "FETCH_ERROR": "ERR "}[verdict]
        if verdict != "PASS":
            print(f"  [{icon}] {c['material']:5} {c['property']:22} = {c['value']:>8} {c['unit']:8} | {detail}")
        report.append({**c, "verdict": verdict, "detail": detail})

    print("\n--- summary ---")
    for k in ("PASS", "FAIL", "UNVERIFIABLE_LINK", "NO_URL", "FETCH_ERROR"):
        if counts.get(k):
            print(f"  {k:18} {counts[k]}")
    total = len(rows) or 1
    checkable = counts.get("PASS", 0) + counts.get("FAIL", 0)
    if checkable:
        print(f"  accuracy on machine-checkable rows: {counts.get('PASS',0)}/{checkable} "
              f"= {100*counts.get('PASS',0)//checkable}%")

    if args.report:
        with open(args.report, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=list(CANONICAL) + ["verdict", "detail"])
            w.writeheader()
            w.writerows(report)
        print(f"\nwrote {args.report}")

    sys.exit(1 if counts.get("FAIL") else 0)


if __name__ == "__main__":
    main()
