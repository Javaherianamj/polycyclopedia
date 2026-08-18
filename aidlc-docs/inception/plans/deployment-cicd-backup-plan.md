# Deployment + CI/CD + Backup — Inception Plan (static-first, password-gated v1)

**Stage**: INCEPTION — Workflow Planning
**Created**: 2026-08-18 · **Revised**: 2026-08-19 to static-first per owner decision
**Related**: `deployment-plan.md` (U11a–d, FR-D*/NFR-D*), `../requirements/deployment-requirements.md`

---

## 0. Scope decision — READ FIRST

**v1 is a STATIC, password-gated site. The dynamic / live-database deployment is
CANCELLED for now and must not be reintroduced until the owner explicitly asks.**

- No live API server in production. No paid VM. No SSR.
- The site is built to static HTML/JS/CSS and served from ArvanCloud object
  storage + CDN — the path the codebase was already designed for
  (`astro.config.mjs`: `output: 'static'`, R23 "nothing may require a Node
  server at runtime").
- Access is gated so only the owner can view it (see §4).

This reverses owner decisions D57–D59 in `deployment-plan.md` §13. Those are
superseded; do not act on them.

---

## 1. Decisions locked

| # | Decision |
|---|----------|
| S1 | **Static output only.** `output: 'static'`; deploy is files on object storage + CDN. |
| S2 | **Private, password-gated staging.** Only the owner can view it for now; public launch is later, after data + article. |
| S3 | **The build reads the local DB at build time.** Real curated data lives in the local Postgres; the static build is produced against it, then uploaded. CI cannot build the real site because it has no real data (it would understate coverage). |
| S4 | **Backups = Neon PITR (once data lives there) + a scheduled `pg_dump` uploaded off-site** to Arvan object storage. |
| S5 | **Article ≠ website.** The paper goes to a real venue (preprint / data journal / **Zenodo DOI**); the site is the companion resource. Reviewers reach data via the DOI, so the password gate never blocks the article. |

---

## 2. Architecture

```
  LOCAL (owner's machine)                         PRODUCTION (ArvanCloud)
  =====================                           =======================
  Postgres (real data)                            Arvan object storage
       │  db/run.sh (migrations+seeds)              (static website hosting,
       │  curation imports (real cited data)         index + 404 documents)
       ▼                                                     ▲
  Fastify API (localhost:3001)                               │ web/deploy.sh
       ▲                                                     │ (aws s3 sync x2,
       │ build reads API at build time                      │  cache headers,
  cd web && npm run build:search-index && npm run build      │  --delete)
       │  → web/dist (static HTML/JS/CSS + search index)     │
       └─────────────────────────────────────────────────────┘
                                                             │
                                                       Arvan CDN
                                                  (TLS, cache, DDoS,
                                                   + access gate §4)
                                                             │
                                                       polycyclopedia.ir
```

Nothing in production runs code. The database is a *build-time input*, never a
runtime dependency of the served site.

---

## 3. CI/CD

**CI (exists):** `.github/workflows/ci.yml` — typecheck, lint, format, tests, and
build on every push/PR. Keep as-is. Note: CI's Astro build has no DB, so it is a
*compile/smoke* build, not the real-data build.

**CD (v1): local build + deploy — the working path today.**
```bash
# 1. bring the local DB up to date (real data)
./db/run.sh
#    + curation imports for real cited values (tools/curation/import_*.py)

# 2. start the API against it (separate shell): cd api && npm run dev

# 3. build the static site against the live local API + a fresh search index
cd web
npm run build:search-index
PUBLIC_API_BASE_URL=http://localhost:3001 npm run build   # → web/dist

# 4. deploy
source web/.env.deploy && ./web/deploy.sh                 # sync to Arvan bucket
```
This is `README.md` §"Deploy" made explicit, plus the search-index step. It works
the moment the bucket + access keys exist.

**CD (automated, optional): `.github/workflows/deploy.yml`.** A tag-triggered
(`v*`) job that reproduces the database *from committed source* (migrations +
seeds + curation CSVs), builds, and deploys. This is "proper" CD, but its data
fidelity depends on the DB being fully reproducible from committed files — the
discipline worth keeping regardless. Drafted; needs the owner's Arvan secrets as
GitHub Actions secrets and one verification run before it is trusted.

---

## 4. The password gate (S2) — options, because pure object storage cannot do it

Object storage serves files publicly; it has no HTTP Basic Auth. So the gate is
configured at the CDN / access layer, in the Arvan panel — **owner action, not
code**:

1. **CDN access rule / IP allowlist (preferred if available):** restrict the site
   to the owner's IP(s) in the Arvan CDN panel. Simple, real, no password to leak.
2. **CDN edge Basic Auth (if Arvan supports it):** a username/password prompt at
   the edge. Confirm the CDN passes/enforces `Authorization` before relying on it.
3. **Keep the bucket unlinked + `noindex`:** obscurity only — NOT real security;
   acceptable only as a stopgap combined with option 1 or 2.

Whatever is chosen, it is removed at public launch (after data + article).

---

## 5. Backups (S4)

- Once real data lives on Neon: rely on Neon's point-in-time recovery, **plus** a
  scheduled `pg_dump` (GitHub Actions cron or a local cron) uploaded to Arvan
  object storage as an independent copy. Verify one restore (the pattern
  `db/backup.sh --verify` already implements).
- Until then, `db/backup.sh` protecting the local Postgres is the only backup of
  anything real — keep running it.

---

## 6. Task list

### Code / config (this repo — I can do)
- [x] Confirm static output + existing deploy tooling (`astro.config.mjs`, `web/deploy.sh`).
- [x] **Add `web/src/pages/404.astro`** so static hosting has an error document (FR-D8). Dependency-free; `astro check` clean.
- [x] **One-command local deploy** `web/build-and-deploy.sh` — guards (API reachable, creds present) → `build:search-index` → `build` → `deploy.sh`. This is the v1 CD.
- [ ] **Automated `.github/workflows/deploy.yml`** (tag-triggered, DB reproduced from committed source) — DEFERRED until (a) the owner's Arvan secrets exist as GitHub Actions secrets, and (b) a full DB rebuild from committed migrations+seeds+curation CSVs is verified to reproduce the real data. Not shipped unverified.

### Owner actions (panel / accounts — only the owner can)
- [ ] Create the Arvan object-storage bucket; enable static-website hosting; set index + `404.html`; make objects public.
- [ ] Generate object-storage access keys; put them in `web/.env.deploy` (local) and as **GitHub Actions secrets** (for the workflow).
- [ ] Configure the access gate (§4) in the CDN panel.
- [ ] (Later) Zenodo dataset deposit → DOI, at article submission.

### Verification
- [ ] First real deploy: build locally, `./web/deploy.sh`, confirm the site loads through the CDN behind the gate.
- [ ] Confirm a redeploy is idempotent and `--delete` removes withdrawn files (FR-D12).
