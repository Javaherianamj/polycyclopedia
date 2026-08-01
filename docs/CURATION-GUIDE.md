# How to Add Data — A Guide for the Curator

You do not need to know SQL, and you should never type into the database
directly. You work in a spreadsheet. A script does the rest.

Companion document: [SOURCING-GUIDE.md](SOURCING-GUIDE.md) — *where* to get the
data. This one covers *how* to enter it.

---

## The idea in one picture

```
  1. A script asks the database "what is still missing?"
                     |
                     v
             gaps.csv  <- opens in Excel
                     |
  2. You fill in numbers and page references
                     |
                     v
  3. A script checks your work and says what is wrong
                     |
                     v
  4. When it is happy, it loads everything into the database
```

The spreadsheet is your workspace. The database is just storage. If you make a
mistake, you fix the spreadsheet and run step 3 again — nothing is damaged.

---

## Step 1 — Get your worksheet

```bash
python tools/curation/export_gaps.py --material ldpe
```

This creates two files in the `curation/` folder:

- **`gaps.csv`** — every value that still needs a source
- **`sources.csv`** — the books and documents you are citing

Open both in Excel or Google Sheets.

> **If Persian text looks like `Ø¨Ø§Ù„Ø§`** — the file is fine, Excel just
> guessed the encoding wrong. Use *Data → From Text/CSV* and choose **UTF-8**
> rather than double-clicking the file.

---

## Step 2 — Fill in the blanks

### `gaps.csv`

Some columns are already filled in. **Do not edit those** — they are how the
script knows which value you mean.

| Column | What it is |
|---|---|
| `material_slug`, `property_key` | Already filled. Leave alone. |
| `property_name_en`, `property_name_fa` | Context, so you know what the row is |
| `unit` | The unit your number must be in |
| `plausible_min`, `plausible_max` | Sanity bounds — if your number falls outside, something is wrong |
| `current_value` | What the old prototype claimed, for comparison |

Now the columns **you** fill:

| Column | How to fill it |
|---|---|
| `value_min`, `value_max` | For a range: 0.910 and 0.925 |
| `value_typical` | For a single number: -110. Use this **or** min/max, not both |
| `qualifier` | Only if the source says "less than 0.01" → put `<` and 0.01 in `value_max` |
| `source_key` | The short name from `sources.csv`, e.g. `brydson-plastics-materials` |
| `page` | **Required.** The page you actually read it on |
| `table`, `figure`, `section` | Instead of, or as well as, a page |
| `test_method` | If stated, e.g. `ASTM D1238` |
| `conditions` | If stated, e.g. `190C/2.16kg` |
| `note_en`, `note_fa` | Anything worth remembering |
| `confidence` | 0 to 1. Leave blank for the default (0.9) |
| `skip` | Put `y` to ignore this row for now |

**You do not have to fill the whole file.** Do ten rows, import them, come back
tomorrow. Blank rows are simply ignored.

### `sources.csv`

If you are citing a book that is not listed yet, add a row:

| source_key | title | authors | publisher | edition | year | kind | tier |
|---|---|---|---|---|---|---|---|
| `brydson-plastics-materials` | Plastics Materials | J.A. Brydson | Butterworth-Heinemann | 7th | 1999 | `handbook` | `peer_reviewed_handbook` |

`source_key` is a short nickname you invent. Use it in `gaps.csv`.

`tier` says how much to trust it:

- `peer_reviewed_handbook` — handbooks, textbooks, encyclopedias
- `standard` — ASTM, ISO
- `manufacturer_datasheet` — a producer's PDF
- `vendor_marketing` — a sales brochure
- `community` — Wikipedia and similar

---

## Step 3 — Check your work

```bash
python tools/curation/import_values.py --dry-run
```

`--dry-run` means **look but do not touch**. It reads your spreadsheet, checks
everything, and reports problems without changing the database. You can run it as
many times as you like.

You will get plain-English messages like:

```
Row 14 (ldpe / density): value 920 is far outside the plausible range
  0.8 - 2.3 g/cm³. Did you enter kg/m³ instead of g/cm³?

Row 22 (ldpe / tg): you gave a source but no page, table, figure or
  section. Every citation needs to say where in the document it came from.

Row 31 (ldpe / tm): value_min (140) is greater than value_max (120).
```

Fix them in the spreadsheet, save, run again. Repeat until it is clean.

### The most common mistake

**Units off by a factor of 1000.** Density in kg/m³ instead of g/cm³; pressure in
Pa instead of MPa. The plausibility check exists to catch exactly this. If it
complains, check your units before assuming the check is wrong.

If the value genuinely is unusual and you are confident, set `confidence`
explicitly and write a note explaining why — the script will then accept it. You
are the expert; the check is a seatbelt, not a boss.

---

## Step 4 — Load it in

```bash
python tools/curation/import_values.py
```

Two things worth knowing:

**All or nothing.** If any row fails, *nothing* is saved. You never end up with
half your work loaded and no idea which half.

**Nothing is ever destroyed.** If you re-cite a value that already had a source,
the old record is kept and marked as replaced. You can always see what a value
used to be and who changed it.

---

## What happens to a value you cite

Before: `status = unsourced` — shown in the app with a visible "no source" flag.

After: `status = published`, linked to a citation, linked to a page in a real
document.

Check your progress any time:

```bash
docker exec polypedia-pg psql -U polypedia -d polypedia \
  -c "SELECT * FROM v_citation_coverage;"
```

That prints the percentage of each material's values that are properly sourced.
Today it is 0%. That number going up is the single best measure of the project
becoming real.

---

## The rules that matter

**Never invent a page number.** If you cannot find it, leave the row blank.
`unsourced` is honest. A made-up citation cannot be detected later and destroys
the only thing that makes this project worth building.

**Cite what you actually read.** If Brydson quotes a 1963 paper and you read
Brydson, cite Brydson.

**Ranges beat single numbers** for generic materials. LDPE density really is a
range — flattening it to one value throws away true information.

**Disagreements are valuable.** If two handbooks conflict, enter both. The
database can record a value as `conflicting`, and showing an honest disagreement
is more scientifically useful — and more distinctive — than one confident number.

---

## If something goes wrong

- **"could not connect to database"** → the database is not running. Start it:
  `docker compose -f db/docker-compose.yml up -d`
- **Persian shows as `????`** → re-open the CSV as UTF-8 (see Step 1)
- **Excel changed `4` into a date** → format the column as *Text* before typing
- **You want to start over** → delete `curation/gaps.csv` and re-run
  `export_gaps.py`. Nothing in the database is affected.
