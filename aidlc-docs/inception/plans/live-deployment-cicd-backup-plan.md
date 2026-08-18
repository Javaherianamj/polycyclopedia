# Live Deployment + CI/CD + Backup — Inception Plan

**Stage**: INCEPTION — Workflow Planning
**Created**: 2026-08-18
**Supersedes the static-first framing** in `deployment-plan.md` §2–3 for v1, per owner
decisions below. That document's history and requirement IDs (FR-D*, NFR-D*) still apply.
**Related**: `../requirements/deployment-requirements.md`, `deployment-plan.md` (U11a–d)

---

## 1. Decisions locked (2026-08-18)

| # | Decision | Rationale |
|---|----------|-----------|
| L1 | **Live, database-backed deployment. Static v1 is bypassed.** | Owner wants a live Neon-connected site and to learn the real deployment path (D58). |
| L2 | **The first deployment is a private, password-gated STAGING site.** Not a public launch. | Owner: "close access to polycyclopedia.ir and only enter it myself using a password for now." The real public launch happens later, after data + article. |
| L3 | **Neon is the production database.** | Managed Postgres, built-in point-in-time recovery. Already chosen. |
| L4 | **Backups = Neon's built-in recovery + a scheduled `pg_dump` uploaded off-site** (Arvan object storage). | Independent copy survives even a lost Neon account. Owner-selected. |
| L5 | **The article and the website are separate deliverables.** The article goes to a real venue (preprint / data journal / Zenodo with a DOI); the website is the companion resource it links to. | Citability, a permanent timestamp proving priority, and reviewer access that does not depend on the private site being open. |

### What L2 means for the article
The password gate does **not** harm the article, provided the data is reachable another way
at submission time. Plan:
1. Now → deploy password-gated, for development and learning.
2. At submission → deposit the dataset on **Zenodo** to get a **DOI**; cite that DOI in the paper. Reviewers reach the data via the DOI, not the private site.
3. At/after acceptance → remove the password; the public site goes live alongside the paper.

Do **not** self-host the article as its primary publication venue — that forfeits the DOI,
the permanent archive, and the credibility a real venue provides.

---

## 2. Architecture (live, password-gated staging)

```
                        ┌─────────── owner (with password) ──────────┐
                        ▼                                             │
  polycyclopedia.ir → Arvan CDN (TLS, DDoS, cache)                    │
                        │                                             │
                        ▼                                             │
   ┌─────────────── small Arvan VM (VPS) ───────────────────┐        │
   │  nginx  →  [ HTTP Basic Auth — the password gate ]      │◄───────┘
   │             ├─ Astro site (static build or SSR)         │
   │             └─ Fastify API (Node, systemd/Docker)       │
   └──────────────────────────┬──────────────────────────────┘
                              ▼
                       Neon (managed Postgres — the data)
                              │
        scheduled pg_dump ────┴────────────► Arvan object storage
                                             (independent off-site backup)
```

Live mode needs three running things instead of just files: **Neon** (data), **the VM**
(runs the API + serves pages 24/7), and **nginx** (TLS terminate at CDN, password gate,
reverse-proxy to the API). The VM is the piece a static site did not need.

---

## 3. The pieces, and where each maps to existing work

| Piece | Purpose | Status / existing asset |
|-------|---------|--------------------------|
| **Neon** | Production database | Chosen. Branch currently **empty** — needs schema + data migrated (discrete task, D59). |
| **Arvan VM** | Runs Fastify API + serves Astro | **Not provisioned — owner action.** 1 vCPU / 1–2 GB RAM is enough for a read-only site. |
| **nginx** | TLS/reverse-proxy + **Basic Auth password gate** | To be written (this unit). |
| **Arvan CDN** | HTTPS, caching, DDoS | Already created; TLS via Let's Encrypt connected (2026-08-06). |
| **CI** | Run tests on every push | **Exists** — `.github/workflows/ci.yml`. |
| **CD (deploy job)** | On a `v*` tag: build, then update the VM | To be written. `web/deploy.sh` exists but targets object storage, not the VM — needs rework for the live model. |
| **Backups** | Neon PITR + scheduled off-site dump | `db/backup.sh` exists (manual, verified). Scheduling + Neon target + upload = to be built. |

---

## 4. Execution plan (phased)

### Phase A — provision (owner-gated)
- [ ] **Owner:** create a small Arvan VM (VPS), note its IP; create an SSH key pair; give the deploy key access. *(A "what to click" checklist can be produced on request.)*
- [ ] **Owner:** create/confirm an Arvan object-storage bucket for backups (separate from any web bucket).

### Phase B — database
- [ ] Migrate schema (`db/migrations/*`) into the Neon branch.
- [ ] Load real data into Neon (the curated data, not just `db/seeds/*` — those understate citation coverage).
- [ ] Point the API's connection string at Neon (secret, never committed).

### Phase C — the server
- [ ] Install runtime on the VM (Node + nginx, or Docker + Compose).
- [ ] Run the Fastify API as a managed service (systemd unit or Compose service), restart-on-failure.
- [ ] Build and serve the Astro site (static build behind nginx, or SSR — decide at build time).
- [ ] **nginx Basic Auth** in front of everything (the L2 password gate); confirm the CDN forwards the auth correctly, or gate at the CDN edge.
- [ ] Point the CDN origin at the VM; confirm HTTPS end to end.

### Phase D — CI/CD
- [ ] Add a **tag-triggered deploy job** to `ci.yml`: on `v*`, run tests → build → deploy to the VM over SSH (pull + build + restart).
- [ ] Store the SSH key / deploy secrets as **GitHub Actions secrets** (NFR-D3).
- [ ] Cut a first release tag and **watch a real deploy run** (the learning goal).

### Phase E — backups (L4)
- [ ] Confirm Neon point-in-time recovery is on (managed default).
- [ ] Schedule `pg_dump` of **Neon** (GitHub Actions cron, or a cron on the VM) → upload to Arvan object storage.
- [ ] Verify a restore from the uploaded dump once (prove the copy is real, per the pattern `db/backup.sh --verify` already uses).

### Later (out of scope now)
- Remove the password gate for public launch (after data + article).
- Zenodo dataset deposit + DOI at article submission.
- Cloudflare mirror (U11d) for international access — owner said not yet.

---

## 5. Open items / risks

- **Reaching Neon from an Iranian VM**: the API's outbound connection to Neon (US/EU) must work reliably from Arvan; verify latency/connectivity early in Phase B, before building on top of it.
- **Basic Auth behind a CDN**: some CDNs strip the `Authorization` header or cache authed responses. Confirm Arvan passes it through, or apply the gate at the CDN edge instead of the origin.
- **Cost**: live mode is an ongoing VM cost that static mode avoided. Small, but real.
- **Neon backup redundancy** (from `deployment-plan.md` §7): decide whether the scheduled dump *supplements* or merely duplicates Neon's own recovery — L4 keeps it as an independent safety copy on purpose.

---

## 6. Owner actions required before build starts
1. Provision the Arvan VM and share SSH access.
2. Confirm the backup bucket.
3. (Later, not now) Zenodo deposit for the article's DOI.

Everything else — the API service, the password gate, the CI/CD deploy job, and the
scheduled backup — is buildable once the VM exists.
