# Polypedia — پلی‌پدیا

A Persian-language polymer encyclopedia, and the database behind it.

The goal is a comprehensive, **citable** polymer reference: every property value
traceable to a page in a real document, searchable by target properties ("find me
a material with Tg above 100 °C and tensile strength between 40 and 80 MPa"), and
eventually licensable to companies as a core for communicating with their own
customers.

---

## Where the project is

**Updated 2026-08-12** — the table below was stale (described the frontend as
still reading the legacy static file, and the database as 2 materials at 0%
coverage; both long since moved on). Current state, verified against the live
local database and the repo:

| Layer                            | State                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** (`web/`)            | The shipping frontend (Astro). FE-0 through FE-4 closed; FE-5 (property-first search) in Construction; FE-3b (grade-class surfacing) newly opened. Reads the real API/database, not the legacy file. See [web/README.md](web/README.md). |
| **Frontend prototype** (`src/`)  | Frozen (D9, R21) — content reference only, kept buildable, never edited. Not the shipping frontend.                                          |
| **Database** (`db/`)             | PostgreSQL 16, 23 migrations applied locally. Verified against a live container. **Neon (managed Postgres) is the confirmed database going forward, but that migration has not happened yet** — see [Database](#database--neon) below. |
| **API** (`api/`)                 | Read-only Fastify service over the database.                                                                                                  |
| **ETL** (`tools/etl/`)           | Complete. Migrated LDPE + HDPE out of the legacy TypeScript file; superseded as the path for new materials by `tools/curation/`.              |
| **Curation** (`tools/curation/`) | Spreadsheet/CSV workflow for the citation campaign and for adding new materials (U5, U5b, U5c).                                               |
| **Deployment**                   | In progress. Domain registered, ArvanCloud CDN + TLS connected; object storage and CI deploy job still open. Nothing published yet. See [Deployment](#deployment). |

**Honest status of the data, as of 2026-08-12** (query the database directly
for anything more current — this number moves with every curation session):
7 materials (LDPE, HDPE, LLDPE, PP, PVC, PET, PS), 73 property definitions,
216 property values, 13 sources, 12 citations. Citation coverage is real but
partial, not 0% and not complete — `v_unsourced_values` (102 rows) is still
the citation-campaign work list. See
[docs/CURATION-GUIDE.md](docs/CURATION-GUIDE.md).

---

## Quick start

**Prerequisites**: Node.js 22+, Docker, Python 3.12+

```bash
# Database (local Docker — this is still what everything below actually
# talks to; Neon is the confirmed future database but is not wired up yet,
# see "Database / Neon" below)
cp db/.env.example db/.env    # then edit the passwords
docker compose -f db/docker-compose.yml up -d
./db/run.sh                   # apply migrations + seeds
./db/test.sh                  # constraint checks

# API
cp api/.env.example api/.env
cd api && npm install && npm run dev    # http://localhost:3001

# Frontend (the shipping app — web/)
cd web && npm install
cp .env.example .env          # edit PUBLIC_API_BASE_URL if the API isn't on :3001
npm run dev                   # http://localhost:4321

# Frozen prototype (src/ at repo root — content reference only, not the shipping frontend)
npm install
npm run dev                   # http://localhost:3000
```

## Database / Neon

The owner has confirmed **Neon (managed Postgres) as the project's database
going forward.** As of 2026-08-12, though, that migration has not happened:
the Neon project exists (org+project IDs in repo-root `.neon`, safe to
commit) with one branch that has **no schema and no data** — verified by
direct query, not assumed. `.env.local` at the repo root (gitignored, never
committed) holds the real Neon connection strings when pulled via
`neon env pull`. Everything in this repo — `db/run.sh`, `db/test.sh`,
`db/backup.sh`, the API's `config.ts`, and CI — still talks to the local
Docker Postgres container described above. Full detail, including what
wiring up Neon for real still needs, is in
[db/README.md](db/README.md#neon-is-the-database-going-forward--where-that-stands-today).

## Repository layout

| Path              | What it is                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `web/`            | The shipping frontend — Astro. FE-0–FE-4 closed, FE-5 in Construction — [README](web/README.md)                              |
| `src/`            | **Frozen prototype** (D9, R21). React 19 + Vite 6 content reference, not the shipping frontend — kept buildable, never edited |
| `design/fe-0/`    | Visual-identity exploration and the frozen design tokens `web/` imports — [README](design/fe-0/tokens/README.md)              |
| `api/`            | Fastify read API. Separate `package.json` so `pg` can never reach the browser bundle                                          |
| `db/`             | SQL migrations, seeds, schema tests, Docker Compose — [README](db/README.md)                                                  |
| `tools/etl/`      | One-shot migration of the legacy data file — [README](tools/etl/README.md)                                                    |
| `tools/curation/` | Spreadsheet workflow for adding citations — [README](tools/curation/README.md)                                                |
| `tools/legacy/`   | Archived prototype-era scripts, kept for reference — [README](tools/legacy/README.md)                                         |
| `docs/`           | Guides written for humans, not developers                                                                                     |
| `aidlc-docs/`     | AI-DLC process artifacts: requirements, designs, audit trail                                                                  |

## Documentation

Start here depending on what you need:

| Document                                                 | For                                                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [docs/DATABASE-EXPLAINED.md](docs/DATABASE-EXPLAINED.md) | **Read this first.** What the database is and why, written for someone who knows polymers but not databases |
| [docs/CURATION-GUIDE.md](docs/CURATION-GUIDE.md)         | How to add citations using a spreadsheet. No SQL required                                                   |
| [docs/SOURCING-GUIDE.md](docs/SOURCING-GUIDE.md)         | Where to legitimately obtain polymer data, and what not to scrape                                           |
| [db/README.md](db/README.md)                             | Schema design decisions                                                                                     |
| [api/README.md](api/README.md)                           | Endpoints and configuration                                                                                 |

---

## Two ideas that shape everything

**Properties are data, not code.** There is no column named `density` and no
TypeScript field for it. Properties are rows in `property_definition` — 55 of
them. Adding "swelling ratio" for hydrogels is an `INSERT`, requiring no
migration, no code change, and no deploy. There is a test that proves this by
inserting a new property and storing a value against it with zero DDL.

**A citation cannot exist without a page.** `citation.locator` carries a database
`CHECK` requiring at least one of page, table, figure, or section. `{}` is
rejected. `{"foo":"bar"}` is rejected. `{"page":412}` is accepted.

That second rule exists because of what came before it: the prototype had a
`sourceId` field on all 269 values, every one of them containing the placeholder
`'src_default'`, and no component ever read it. Citations were an intention that
had never been wired up. Now the database refuses to store one that cannot say
where it came from — enforced structurally, not by convention.

## Testing

```bash
npm run typecheck && npm run lint && npm run build     # frozen prototype (src/), not the shipping frontend
cd web && npm run check && npm test                    # shipping frontend (web/) — astro check + vitest
./db/test.sh                                            # schema checks
cd api && npm test                                      # API integration tests, against a live seeded Postgres
tools/etl/.venv/bin/python -m pytest tools/etl/tests -q       # ETL parser tests
tools/etl/.venv/bin/python -m pytest tools/curation/tests -q  # curation workflow tests
```

Test counts move often enough (new units land tests weekly) that they are not
repeated here — run the commands above, or see each unit's own
`aidlc-docs/construction/*/build-and-test.md`.

Database and API tests run against a real PostgreSQL container rather than a
mock — the value of this code is almost entirely in whether the SQL is
correct — and every test leaves the database exactly as it found it. **CI
does not currently run the database or API test suites** — see
`db/README.md`'s Neon section for what CI actually does and does not do.

## Deployment

**Status, 2026-08-06**: `polycyclopedia.ir` is registered, the ArvanCloud CDN
is created, and TLS is connected via free Let's Encrypt. Object storage (ابر
آروان) is being set up now — see §"Setting up ابر آروان" below. The site has
not been published yet: FE-1 through FE-4 are built (app shell, value atom,
datasheet, homepage/catalog), FE-5 through FE-9 are not, and D10 says nothing
publishes until FE-9 is complete. A first database backup exists and has been
restored-and-verified (`db/backup.sh --verify`) — this closed the highest-
severity gap in the plan (no backups existed at all before). Full
requirements are in
[deployment-requirements.md](aidlc-docs/inception/requirements/deployment-requirements.md),
execution order in [deployment-plan.md](aidlc-docs/inception/plans/deployment-plan.md),
and the answered questions in [deployment-questions.md](aidlc-docs/inception/requirements/deployment-questions.md).

### Setting up ابر آروان (ArvanCloud Object Storage)

The CDN and TLS are done; this is the remaining piece before anything can be
pointed at the domain. From the ArvanCloud panel:

1. **Cloud Storage → Create Bucket.** Region `ir-thr-at1` (Tehran — Q-D7).
   Access level **Public Read** (FR-D9: site objects are publicly readable;
   bucket-level public *listing* is not required and should stay off if the
   panel offers it separately from per-object read).
2. **Static website hosting**: enable it on the bucket, index document
   `index.html`, error document `404.html` — FR-D8. (Astro's static build
   does not emit a `404.html` yet; that is a small addition, not done here.)
3. **Access Keys**: Object Storage → Access Keys → Create. Save the access
   key and secret **immediately** — the secret is shown once. These are
   what `web/deploy.sh` and, later, CI need. Never commit them; never paste
   them into a chat session, including this one.
4. **Connect the bucket to the CDN**: in the CDN panel, under the
   `polycyclopedia.ir` domain already created, point its origin at the
   bucket's static-website endpoint (not the raw S3 endpoint — the
   website endpoint serves `index.html` for a bare path).
5. Note the bucket's **S3 endpoint** (e.g.
   `https://s3.ir-thr-at1.arvanstorage.ir` — confirm the exact hostname in
   the panel, it is region-specific) and the **bucket name**. Both go into
   `web/.env.deploy` (gitignored, never committed):

   ```bash
   export ARVAN_S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
   export ARVAN_BUCKET=polycyclopedia
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   ```

### Deploying a build

```bash
cd web && npm run build          # reads the live API/DB, produces web/dist
source .env.deploy && ./deploy.sh # syncs dist/ to the bucket, correct cache headers per file type
```

`deploy.sh` is FR-D12's "single command": two `aws s3 sync` passes (content-
hashed `_astro/` assets cached for a year, everything else revalidated on
every request per FR-D11), `--delete` so withdrawn files are actually
removed. Requires the AWS CLI — ArvanCloud's object storage is
S3-compatible, no Arvan-specific tooling needed. Full detail in the script's
own header comment.

**Not yet automated**: a `v*`-tag-triggered CI deploy job (FR-D15) needs a
way to get the real curated database into the CI runner first — a fresh CI
Postgres seeded from `db/seeds/*.sql` has none of the citation data that only
exists via live curation imports (`tools/curation/`), so a CI-built site
today would show 0% coverage, not the real number. The missing piece is
restoring the latest `db/backup.sh` dump into CI before building. Until that
lands, deploys are the manual command above, run against the real local
database.

### Backups

```bash
./db/backup.sh            # dump to db/backups/, keeps the most recent 14
./db/backup.sh --verify   # also restores into a throwaway DB and checks every row count matches
```

Local only for now — scheduled upload to object storage (so a lost laptop
does not mean a lost database) is the other half of NFR-D4, not yet built.

### The shape of it

```
  PostgreSQL ──► build reads the DB directly ──► static output ──► Arvan bucket
   (private)                                     HTML + assets      (static site)
                                                 + search index           │
                                                                          ▼
                                                                    Arvan CDN
                                                                 TLS · cache · DDoS
                                                                          │
                                                                          ▼
                                                              polycyclopedia.ir
```

The site is **a build artifact generated from the database**, not a service that
queries it. That is what keeps hosting free and keeps the provider decision
reversible: the output is a directory of files, and any static host can serve it.

The product is **Polypedia**; the domain is **polycyclopedia.ir** because
`polypedia.ir` was not the name that could be had. The wordmark turns that into
the brand's gesture — see
[wordmark-animation-spec.md](aidlc-docs/construction/fe-0/wordmark-animation-spec.md).

### Hybrid: static now, API later

Content is split by **volatility**, not by subject (D54):

| Tier              | What                                                                                                  | Deployed                      |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------- |
| Build-time static | Datasheets, values, citations, Learn, concepts, the prebuilt search index — everything a reader reads | **v1, 100% of the site**      |
| Live API          | Polymer statistics: coverage percentages, catalogue counts, range queries                             | Deferred — not a current goal |
| Never public      | PostgreSQL, curation tooling, admin                                                                   | —                             |

Three rules keep the halves from entangling. **R38**: every API-backed value has a
build-time fallback baked into its HTML, so a page never depends on a service
being up. **R39**: the build reads PostgreSQL directly and never needs the API
reachable. **R40**: the public API stays read-only and CORS-restricted for as long
as it serves statistics only.

### DNS

Almost nothing is set at the registrar. Two records, and that is all:

```
NS   polycyclopedia.ir   a.ns.arvancdn.ir
NS   polycyclopedia.ir   b.ns.arvancdn.ir
```

The letters are assigned per account — ArvanCloud shows them when the domain is
added. **Use the `.ir` nameservers, not `.com`**; Arvan's own documentation
requires the swap because of international-registrar disruption.

Everything else lives in the Arvan DNS panel:

| Record       | Value                                            | Purpose                                                            |
| ------------ | ------------------------------------------------ | ------------------------------------------------------------------ |
| `@` ANAME    | bucket static-website endpoint                   | CNAME is illegal at the apex; ANAME is Arvan's flattening. Proxied |
| `www` CNAME  | `polycyclopedia.ir`                              | Proxied, plus a redirect to the apex — one canonical hostname      |
| `@` TXT      | provider SPF, or `v=spf1 -all` until mail exists | Stops the domain being spoofed                                     |
| `_dmarc` TXT | `v=DMARC1; p=reject;`                            | Same                                                               |
| MX + DKIM    | from the mail provider                           | Arvan sells no mailboxes; email is a separate provider (Q-D2)      |

Skip CAA records unless you know which CA Arvan issues from — a wrong CAA
silently breaks certificate renewal.

### What the free tier covers

Read from ArvanCloud's own product pages on 2026-08-04. Verify in the panel
before depending on it; free-tier terms change.

| Product        | Free allowance                                                     |
| -------------- | ------------------------------------------------------------------ |
| CDN            | Unlimited traffic, SSL certificate, managed DNS, DDoS protection   |
| Object storage | 5 GB storage, 20 GB traffic, custom domain, static website hosting |
| Edge compute   | 100 apps, 100k requests/month                                      |

The number to watch is the **20 GB, which is bucket egress** — consumed only on
CDN cache misses. With sensible cache TTLs the edge absorbs normal traffic
against its unlimited quota. The Learn surface's Three.js and Chart.js bundles
are what would breach it if caching is misconfigured.

### First-time setup

Administrative steps first — they take days and block nothing else.

1. Create an IRNIC handle at [nic.ir](https://www.nic.ir/Home) and complete identity verification (سامانه هدا). Needs national ID and شناسنامه scans, an active mobile number and email.
2. Register `polycyclopedia.ir` **directly at nic.ir**, multi-year. Afterwards, confirm the holder handle is yours — not a reseller's. This is the mistake that costs you the domain.
3. Create the ArvanCloud account and complete its identity verification.
4. Create the bucket; enable static-website hosting with an index and a 404 document; make objects public (bucket-level public access is not needed).
5. Add the domain in the CDN panel, copy the two nameservers into IRNIC, wait for propagation, then enable the cloud, HTTPS, and the HTTP→HTTPS redirect.
6. Point the bucket's custom domain at it, add `www` and its redirect.
7. Store the object-storage access keys as CI secrets.

### Deploying

Arvan's object storage is S3-compatible, so a deploy is one sync:

```bash
aws s3 sync ./dist s3://polypedia-site --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir --delete
```

Triggered by a `v*` git tag (Q-D3); pushes to `main` run CI only. Publishing
stays a deliberate act, per D10. The same artifact deploys to the Cloudflare
mirror without rebuilding, so the two can never diverge.

Astro's directory output (`/fa/materials/ldpe/index.html`) matches how the bucket
resolves folder URLs, so pretty URLs need no rewrite rules.

### The gap this plan found

**There are no database backups.** None. The curated database is the entire asset
— citation work is unrecoverable manual effort — and nothing currently dumps it.
An automated `pg_dump` to object storage, plus one verified restore, must land
before launch. A backup that has never been restored is not a backup.

## License

**Polypedia is six separately-owned things in one repository.** They do not share
a licence, and the distinction matters:

| Layer                                                       | Licence                                                                                            |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Source code**                                             | [GNU AGPL v3.0](LICENSE)                                                                           |
| **Database** — curated values, citations, sources           | Proprietary. Not open data — [database-license.md](docs/legal/database-license.md)                 |
| **Scientific content** — prose, explanations, illustrations | Proprietary. Reading and citing encouraged — [copyright-policy.md](docs/legal/copyright-policy.md) |
| **APIs**                                                    | Terms of access; access conveys no ownership — [api-terms.md](docs/legal/api-terms.md)             |
| **Branding** — name, logo, palette, visual identity         | Proprietary — [branding-policy.md](docs/legal/branding-policy.md)                                  |
| **Trademark**                                               | Proprietary; registration may be pursued — [branding-policy.md](docs/legal/branding-policy.md)     |

**The AGPL covers the source code only, never the repository as a whole.** The
exact file-by-file boundary is in [docs/legal/README.md §3](docs/legal/README.md),
and the exclusions are enumerated in [NOTICE](NOTICE). Forking grants you the
code and nothing else: forks must remove all Polypedia branding, and the database
is not included.

AI training, embeddings, vector stores and RAG dataset construction over
Polypedia data are prohibited without written permission —
[ai-usage-policy.md](docs/legal/ai-usage-policy.md).

Sourced content carries the licensing terms of its original publisher — see
[docs/SOURCING-GUIDE.md](docs/SOURCING-GUIDE.md). Polypedia stores citation
metadata only: no verbatim source text, no page scans. The project holds itself
to the standard it asks of others.

> All documents in `docs/legal/` are **drafts, not reviewed by counsel.** They
> need a qualified lawyer's review before publication or any commercial
> agreement.
