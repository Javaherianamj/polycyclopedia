# Deployment Plan — U11

**Stage**: INCEPTION — Workflow Planning
**Requirements**: `../requirements/deployment-requirements.md` (FR-D1 … FR-D21, NFR-D1 … NFR-D7)
**Open questions**: `../requirements/deployment-questions.md` (Q-D1 … Q-D7)
**Created**: 2026-08-04

---

## 1. Why U11 splits into four

`project-plan.md` carries U11 as one unit, "hosting, backups, migrations in CI,
monitoring", sized 3–5 days and blocked on the hosting decision. The hosting
decision is now made, and the unit does not hold together as one piece: half of
it is free, static and doable today; the other half needs a paid machine and is
not wanted yet.

| Unit                      | What it is                                                                | Cost                   | Blocked by                                        | Size       |
| ------------------------- | ------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------- | ---------- |
| **U11a** `static-hosting` | Domain, DNS, bucket, CDN, TLS, deploy pipeline, database backups          | Free tier + domain fee | Nothing                                           | 2–3 days   |
| **U11b** `api-hosting`    | A machine running PostgreSQL + the Fastify API at `api.polycyclopedia.ir` | Paid VM                | Wanting Tier 2 at all — i.e. search or live stats | 2–3 days   |
| **U11c** `email`          | Mailboxes on the domain, MX/SPF/DKIM/DMARC                                | Mailbox fee            | Q-D2                                              | half a day |
| **U11d** `mirror`         | The same artifact deployed to Cloudflare/GitHub for international access  | Free                   | U11a                                              | half a day |

**Only U11a is in scope now.** U11c can run in parallel with it — it touches
different DNS records and nothing else. U11d is a small addition once U11a's
pipeline exists. U11b is deferred by the owner's own framing: polymer statistics
are "not our goal now".

The dependency that matters is that **U11b is a prerequisite for U12 (auth and
admin)**, which is itself a prerequisite for U13 (multi-tenancy, the B2B
product). So the paid machine is not avoidable forever — it is simply not needed
for a read-only encyclopedia.

---

## 2. The deployment architecture

```
  DEVELOPMENT                    CI (GitHub Actions)              PRODUCTION
  ===========                    ===================              ==========

  PostgreSQL  ──────dump────►  restore into CI job
  (local, private)                     │
                                       │ build reads the DB directly (R39)
                                       ▼
  Astro source  ─────────────►  static output: HTML, assets,
                                prebuilt search index JSON
                                       │
                                       │ on a v* tag (FR-D15)
                                       ├──────────────────────►  Arvan bucket
                                       │      aws s3 sync         (static website)
                                       │                                │
                                       │                                ▼
                                       │                          Arvan CDN
                                       │                       TLS · cache · DDoS
                                       │                                │
                                       │                                ▼
                                       │                    polycyclopedia.ir
                                       │
                                       └──────────────────────►  Cloudflare mirror
                                              same artifact           (U11d)

  DEFERRED — U11b
  ===============
  Arvan VM: PostgreSQL + Fastify  ────►  api.polycyclopedia.ir  ────►  islands
                                                                       (Tier 2)
  Never reachable from the public internet except through the API.
```

Read the diagram for one property above all: **the arrow from the API to the site
does not exist at build time.** The site is complete before the API is consulted.
That is R38/R39 drawn rather than stated.

---

## 3. U11a execution order

Ordered by lead time, not by logical dependency — the slow administrative steps
start first because they block launch day and nothing else.

### Phase 1 — administrative (start immediately, days of waiting)

- [x] Create an IRNIC handle at nic.ir and complete identity verification (سامانه هدا). Requires national ID card and شناسنامه scans, an active mobile number and email
- [x] Register `polycyclopedia.ir` **directly at nic.ir** — confirmed registered 2026-08-06
- [x] Register `polypedia.ir` if Q-D4-B is taken — **N/A, `polypedia.ir` was already taken by someone else** (Q-D4 answer); defensive registration of it is not possible. Additional domains deferred (owner's answer to Q-D4)
- [x] Create the ArvanCloud account and complete its identity verification
- [ ] Ask Arvan support what they require regarding ساماندهی for a public Persian content site

### Phase 2 — infrastructure (an afternoon, once Phase 1 clears)

- [ ] Create the bucket in `ir-thr-at1` **[assumed Q-D7-A]** — in progress 2026-08-06; runbook in root `README.md` §"Setting up ابر آروان"
- [ ] Enable static-website hosting; set index and 404 documents (FR-D8) — the build does not emit `404.html` yet, a small gap to close before this step
- [x] Add the domain in the Arvan CDN panel; copy the two assigned nameservers — CDN created 2026-08-06
- [ ] Set exactly those two NS records at IRNIC, in `.ir` form (FR-D2) — confirm directly; a `_acme-challenge` TXT record exists (see `.gitignore`) consistent with DNS pointing at Arvan already, but not independently verified here
- [x] Wait for propagation; enable the CDN cloud, HTTPS and HTTP→HTTPS redirect (FR-D5) — **TLS connected via free Let's Encrypt**, confirmed 2026-08-06
- [ ] Point the bucket's custom domain at the CDN domain (FR-D3) — blocked on the bucket existing
- [ ] Add the `www` record and the redirect to apex (FR-D4)
- [ ] Add `v=spf1 -all` and a rejecting DMARC record (FR-D7) — replaced by real values in U11c
- [ ] Deploy a holding page and confirm the whole chain end to end **[assumed Q-D5-A]** — owner confirmed A, with the explicit caveat: **do not add the Cloudflare mirror yet** (Q-D5 answer)

### Phase 3 — pipeline

- [x] Write the deploy script (`web/deploy.sh`) — FR-D12, single command, `--delete` for withdrawn files, run manually today; access keys are created in the bucket step above, not yet generated
- [ ] Store access keys as CI secrets (NFR-D3) — blocked on the bucket/keys existing
- [ ] Add a deploy job to `.github/workflows/ci.yml`, triggered on `v*` tags (FR-D15) — **blocked on Phase 4**: CI's Postgres would be freshly seeded, with none of the real citation data that only exists via live curation imports, so a CI-built site would understate coverage. Needs the CI job to restore a real backup first, not build from `db/seeds/*.sql` alone
- [x] Set cache headers per FR-D11: long for content-hashed assets, short for HTML — implemented in `web/deploy.sh`, not yet exercised against a real bucket
- [ ] Confirm a deploy is idempotent and that `--delete` removes withdrawn files (FR-D12) — can't verify without a bucket to deploy to
- [ ] Prove FR-D16 by deploying the same artifact to a second target

### Phase 4 — the gap this analysis found

- [x] **`db/backup.sh`: `pg_dump` on demand** (NFR-D4) — first real backup taken and verified 2026-08-06 (7 materials, 216 property values, 12 citations, 114 evidence rows, all restored and row-count-matched)
- [x] **Restore that dump into an empty database once, and verify the citation count matches.** — `db/backup.sh --verify` does exactly this, run successfully 2026-08-06
- [ ] **Automate the dump on a schedule**, and upload it to object storage (not just local disk) — not yet built; local-only backups remain a single-machine risk

Phase 4 was listed last but was the highest-severity item in the whole unit —
**closed for the manual case** 2026-08-06. The remaining piece (scheduling +
off-machine storage) is real work, not urgent in the same way "zero backups
existed" was.

---

## 4. Stages to run for U11a

Per the AI-DLC adaptive principle, most CONSTRUCTION stages do not apply — this
unit provisions infrastructure and writes a pipeline, it does not add a feature.

| Stage                 | Decision          | Reason                                                                                           |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| Functional Design     | **SKIP**          | No data model and no business logic. The schema is untouched                                     |
| NFR Requirements      | **DONE**          | Folded into `deployment-requirements.md` §4 as NFR-D1 … NFR-D7                                   |
| NFR Design            | **RUN (minimal)** | Cache policy and the credential/secret boundary are genuine design decisions with a wrong answer |
| Infrastructure Design | **RUN**           | This unit _is_ infrastructure. Output: the runbook in README plus the CI job                     |
| Code Generation       | **RUN**           | The deploy workflow, the cache-header configuration, the backup script                           |
| Build and Test        | **RUN**           | Success criteria 1–8 in `deployment-requirements.md` §7 are the test plan                        |

---

## 5. What this changes elsewhere

| Document                   | Change                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend-plan.md`         | Add R38, R39, R40 (hybrid-build safety) and the wordmark decision D54. §4's "decide at FE-5 start" is now decided: static index for v1, live API afterwards, both — not either |
| `project-plan.md`          | U11 replaced by U11a–U11d; open decision §5.1 "Hosting" closes; a new blocker appears — no database backups                                                                    |
| `README.md`                | Gains a Deployment section: the runbook, the DNS table, the free-tier limits                                                                                                   |
| `.github/workflows/ci.yml` | Gains a tag-triggered deploy job                                                                                                                                               |
| `api/README.md`            | Gains the `api.polycyclopedia.ir` hostname and its CORS constraint (R40), marked as not yet deployed                                                                           |

---

## 6. Honest status

**Corrected 2026-08-12** — this section previously said "nothing in this plan
has been executed," which was already stale by the time it was written and is
directly contradicted by §3's own checked boxes above. The real status, per
§3: domain registered, ArvanCloud account and CDN created, TLS connected via
Let's Encrypt, `db/backup.sh` written and run for real with a verified
restore. What remains open: the object-storage bucket (blocked on the owner
finishing panel setup), the CI deploy job, and the scheduled off-machine
backup upload. **The site itself has never been published** — that part of
the original claim was and remains true; see the "Nothing has been published"
note in `aidlc-state.md`'s U11a section, which is not contradicted by
anything above (registering a domain and connecting TLS is not publishing).

The ArvanCloud capabilities cited in this document were read from
ArvanCloud's own product and documentation pages on 2026-08-04, not recalled
— but free-tier terms change. Verify the limits in the panel before depending
on them.

## 7. Open items found during 2026-08-12 documentation cleanup

Recorded here rather than fixed, per that pass's scope (docs/config only —
no code, no infrastructure decisions):

- **No `404.astro`/`404.html` exists anywhere in `web/src/pages/`.** Phase 2
  above already flags this ("the build does not emit `404.html` yet") but it
  is worth restating plainly: the static host's error document (FR-D8) has
  nothing to point at yet. This needs a page under `web/src/pages/`, which is
  sibling-agent territory (frontend code), not something this pass creates.
- **Neon and U11b/backups need re-examination, not yet acted on.** The owner
  has separately confirmed Neon (managed Postgres) as the project's database
  going forward (see `db/README.md` "Neon is the database, going forward").
  Two conclusions in this document and in `project-plan.md` were reached
  under a local-Docker-only assumption and may no longer hold:
  - **`db/backup.sh` (Phase 4 above) is a local-only `pg_dump` with no
    scheduled off-machine copy.** Neon includes its own point-in-time
    recovery and branching once the real data actually lives there — but as
    of 2026-08-12 the Neon branch has no schema and no data (verified by
    direct query), so `db/backup.sh` protecting the local Docker container
    is still the only backup of anything real. This changes once (if) the
    live data is migrated onto Neon; it has not been decided whether Neon's
    own backup story replaces, supplements, or is redundant with
    `db/backup.sh`'s scheduled-upload gap. Flagging for an owner/engineering
    decision, not deciding here.
  - **U11b `api-hosting` is framed below and in `project-plan.md` as
    "deferred, needs a paid VM."** That framing bundled two needs together:
    a place to run PostgreSQL, and a place to run the Fastify API process.
    If Neon becomes the production database, the PostgreSQL half of that
    need is already met by a managed service, and U11b may shrink to "a
    place to run the Fastify API" — a smaller, possibly cheaper unit (e.g.
    a serverless function or a lighter host) than "a paid VM running both."
    This is a real change to U11b's shape and cost, not a documentation
    typo — it belongs to whoever plans U11b next, not to this cleanup pass.

---

## 13. Owner decision, 2026-08-12 — late deployment, database-backed

Taken during the FE-6 inception round. This **reverses** part of §12/D54's
"v1 ships 100% static" and cancels the staged pre-deployment.

| #   | Decision | Source |
| --- | -------- | ------ |
| D57 | **Pre-deployment is cancelled.** No interim/preview deploy. The site is deployed once, at the end, when the feature units are complete | owner |
| D58 | **Deployment is late and full, with a live database connection** — not a static export standing alone. Neon is the production database, and the deployed site connects to it | owner |
| D59 | **Sequencing: finish the frontend units first, then Neon migration, then CI/CD.** Neon currently has no schema and no data; migrating it is a discrete task to be run deliberately, not a side effect of a deploy | owner |

### Consequences — flagged, not yet resolved

- **R39 needs re-reading, not deleting.** "The build never requires the API to
  be reachable" was about not letting a *service* outage fail a deploy. A
  build-time read of PostgreSQL was always allowed and is now the main path.
  What changes is D54's "v1 ships 100% static" claim, which no longer holds
  as written.
- **R38's build-time fallback rule gets more important, not less.** With a live
  database in the serving path, the question of what renders when the database
  is unreachable becomes a real production concern rather than a hypothetical.
- **U11b `api-hosting` moves back onto the critical path.** A database-backed
  deployment needs somewhere for the API process to run; it can no longer be
  deferred indefinitely as it could under a pure-static v1.
- **ArvanCloud object storage alone may no longer be sufficient**, since object
  storage cannot host a live API. The hosting decision (D56) needs revisiting
  against D58 before the deploy unit starts.
