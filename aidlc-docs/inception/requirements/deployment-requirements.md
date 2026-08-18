# Deployment Requirements — U11

**Stage**: INCEPTION — Requirements Analysis (Standard depth)
**Unit**: U11 `deployment`
**Created**: 2026-08-04
**Open questions**: `deployment-questions.md` (Q-D1 … Q-D7). This document proceeds
on the recommended answer for each and marks every such place **[assumed]**, per
the owner's standing instruction to keep moving and raise architectural problems
mid-flight rather than halting.

---

## 1. Intent analysis

| Dimension    | Assessment                                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request      | Register `polycyclopedia.ir`, host Polypedia on ArvanCloud's free tier, keep GitHub/Cloudflare as an international mirror, add email on the domain                                    |
| Request type | New capability — the project has never been deployed                                                                                                                                  |
| Scope        | System-wide. Touches build output, CI, DNS, TLS, the API's future home, and the frontend's data-fetch strategy                                                                        |
| Complexity   | Moderate. No hard technical problem; the difficulty is that several decisions are irreversible or slow to reverse (domain ownership, identity verification, the static/live boundary) |
| Blocked by   | Nothing. Registration and identity verification can start today and gate nothing else                                                                                                 |

**Why this is being specified now rather than after FE-9**: the long-lead items
are administrative, not technical. IRNIC identity verification via سامانه هدا
takes days. Nameserver propagation takes hours. Neither benefits from waiting,
and both are on the critical path for launch day but nothing else.

---

## 2. The hybrid model

The owner's decision — _"static for parts which i need to update roughly or on
huge changes, and api for polymer stats"_ — resolves into three tiers separated
by **volatility**, not by subject matter.

```
  TIER 1 — build-time static                     TIER 2 — live API
  ==========================                     =================
  material datasheets                            citation coverage %
  property values + citations                    catalogue counts
  learn surface, concept pages                   range/filter search
  the search index (prebuilt JSON)               comparison queries
  everything the reader reads                    anything continuously changing

  changes in BULK, on a rebuild                  changes CONTINUOUSLY
  no runtime required                            needs Node + Postgres
  v1 = 100% of the site                          v1 = not deployed

                        TIER 3 — never public
                        =====================
                        PostgreSQL, curation tooling, admin
```

**v1 ships entirely as Tier 1.** Tier 2 exists as a contract the frontend is
built against, not as a running service, because search has not started and
polymer statistics are explicitly not the current goal.

The load-bearing consequence, and the reason this section exists at all: a hybrid
build is only safe if the static half never _depends_ on the live half. Three new
rules follow, and they belong alongside R1–R37 in `plans/frontend-plan.md`.

| Rule    | Statement                                                                                                                                                        | Why                                                                                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R38** | Every API-backed value must have a build-time fallback baked into the HTML it appears in. An island may replace a number; it may never be the only source of one | Without this, "the static site works on its own" becomes false the first time an island is added, and stays false silently — the page still renders, just with a hole where a number should be |
| **R39** | The site build must never require the API to be reachable. The build reads PostgreSQL directly                                                                   | Otherwise CI depends on a running service, and a deploy can fail for reasons unrelated to the code being deployed                                                                              |
| **R40** | The public API is read-only, unauthenticated, and CORS-restricted to the site origin, for as long as it serves Tier 2 only                                       | Turning the API on must not change the security posture of the static site. The moment it accepts a write, this rule expires and U12 (auth) becomes a prerequisite                             |

R38 is the one that will be violated first and is the cheapest to enforce: it is
checkable in CI by rendering with the API stubbed out and asserting no element
renders empty.

---

## 3. Functional requirements

### Domain and DNS

- **FR-D1** The domain `polycyclopedia.ir` is registered at IRNIC under the owner's own authenticated handle **[assumed: personal, Q-D1-A]**, never under a reseller's handle.
- **FR-D2** Only NS records are set at IRNIC — the two nameservers ArvanCloud assigns, in their `.ir` form (`*.ns.arvancdn.ir`, not `.com`). All other DNS is managed in the Arvan panel.
- **FR-D3** The apex `polycyclopedia.ir` resolves to the site via an ANAME record pointing at the bucket's static-website endpoint, proxied through the CDN.
- **FR-D4** `www.polycyclopedia.ir` resolves and permanently redirects to the apex. One canonical hostname, chosen as the apex.
- **FR-D5** The domain serves HTTPS with a valid certificate, and HTTP requests redirect to HTTPS.
- **FR-D6** Mail records exist for the chosen provider: MX, an SPF TXT record naming that provider, a DKIM TXT record with the provider's selector, and a DMARC TXT record.
- **FR-D7** Until mailboxes exist, the domain publishes `v=spf1 -all` and a rejecting DMARC policy, so the domain cannot be spoofed while it is unused.

### Hosting and delivery

- **FR-D8** The built site is stored in an ArvanCloud object-storage bucket with static-website hosting enabled, an index document and a 404 document.
- **FR-D9** All site objects are publicly readable. Bucket-level public access is not required and is not granted.
- **FR-D10** ArvanCloud CDN fronts the bucket, terminating TLS and caching responses.
- **FR-D11** Cache policy distinguishes immutable from mutable assets: content-hashed assets cached long, HTML cached short, so a redeploy is visible without a manual purge of everything.
- **FR-D12** A deploy is a single command that syncs the build output to the bucket and removes files no longer present.

### Build and release

- **FR-D13** The site builds to fully static output. No route requires a Node runtime at serve time (preserves R23, D27).
- **FR-D14** The build reads material, property, citation and coverage data from PostgreSQL and bakes it into the output, including the prebuilt search index (frontend-plan.md §4 option (b)).
- **FR-D15** Deployment is triggered by a git tag **[assumed: Q-D3-A]**; pushes to `main` run CI only.
- **FR-D16** The same build artifact can be deployed to the international mirror (Cloudflare/GitHub) without rebuilding, so the two can never diverge.
- **FR-D17** A rebuild can be run after a curation batch without a code change, since new citations are data, not code.

### API (specified now, deployed later)

- **FR-D18** The API is served from `api.polycyclopedia.ir`, a separate hostname, so it can move hosts without touching the site.
- **FR-D19** The API remains the read-only Fastify service already built in `api/`. U11 does not extend it.
- **FR-D20** PostgreSQL is never exposed publicly. Only the API process reaches it.
- **FR-D21** When the API is unreachable, every page still renders correctly with its build-time values (R38).

---

## 4. Non-functional requirements

- **NFR-D1 — Cost.** v1 runs entirely within ArvanCloud's free tier: CDN basic (unlimited traffic, SSL, managed DNS, DDoS protection) and object storage basic (5 GB storage, 20 GB traffic). The only unavoidable spend is domain registration and, later, mailboxes.
- **NFR-D2 — Origin traffic budget.** The free 20 GB is _bucket egress_, consumed only on CDN cache misses. Cache TTLs must be set so that normal traffic is served from the edge. This is the single number most likely to be breached, and the Learn surface's Three.js and Chart.js bundles are what would breach it.
- **NFR-D3 — No secrets in the browser.** The deploy credentials live in CI secrets. `pg` must never reach a browser bundle — the existing separation of `api/package.json` from the root `package.json` is what guarantees this and must survive the Astro rebuild.
- **NFR-D4 — Recoverability.** The site is reproducible from the repository plus a database dump. Losing the bucket costs a rebuild, not data. This requires that database backups exist, which they currently do not.
- **NFR-D5 — Portability.** Nothing in the build may depend on an ArvanCloud-specific feature. The output is a directory of files; any static host can serve it. This is what keeps the international mirror honest and keeps the provider decision reversible.
- **NFR-D6 — Sovereign risk.** `.ir` has no ICANN/UDRP protection and the registry operates under domestic rules. The mitigation is the international mirror plus, if Q-D4-C is taken, a foreign domain — not a technical control.
- **NFR-D7 — Accessibility and performance budgets** from frontend-plan.md §6 are asserted in CI and remain in force at deploy time; a deploy must not be a way to bypass them.

---

## 5. Constraints taken as given

| Constraint                                                        | Source                                |
| ----------------------------------------------------------------- | ------------------------------------- |
| Nothing may require a Node host at serve time                     | D27, R23                              |
| VPS abroad is off the table; domestic provider preferred          | D27                                   |
| No publish before FE-9 is complete                                | D10                                   |
| Citation metadata only — no verbatim source text, no page scans   | D5                                    |
| ArvanCloud sells no mailboxes                                     | ArvanCloud product range              |
| `.ir` registration requires authenticated identity via سامانه هدا | IRNIC policy, in force since Dey 1404 |

---

## 6. Risks

| Risk                                                                                 | Severity                                                                                                | Mitigation                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No database backups exist.** NFR-D4 assumes a dump; nothing currently produces one | **Highest.** The curated database is the entire asset, and citation work is unrecoverable manual effort | Automated `pg_dump` to object storage must land in U11a, before launch, not after. This is a gap found during this analysis, not a known item carried in |
| Free-tier origin traffic exceeded                                                    | Medium                                                                                                  | NFR-D2 cache policy; Arvan's traffic report is free and should be checked in the first week                                                              |
| IRNIC verification delays launch                                                     | Medium                                                                                                  | Start it now; it blocks nothing else                                                                                                                     |
| Domain registered under a reseller's handle                                          | Low probability, severe if it happens                                                                   | Register directly at nic.ir; verify the holder handle after registration                                                                                 |
| Domestic mail deliverability to foreign recipients                                   | Medium, and only matters for B2B outreach                                                               | Accepted for now (Q-D2); revisit when there is foreign outreach                                                                                          |
| Site and mirror diverge                                                              | Low                                                                                                     | FR-D16 — one artifact, two targets                                                                                                                       |
| ساماندهی not registered when required                                                | Low now, rises with commercial use                                                                      | Tracked in `deployment-questions.md`; confirm with Arvan before commercial launch                                                                        |

---

## 7. Success criteria

| #   | Criterion                                                                                       |
| --- | ----------------------------------------------------------------------------------------------- |
| 1   | `https://polycyclopedia.ir` serves the site with a valid certificate, and `www` redirects to it |
| 2   | A tagged release builds and deploys with no manual step beyond pushing the tag                  |
| 3   | The deployed site is byte-identical to a local `build` of the same commit                       |
| 4   | Every page renders correctly with the API unreachable (R38, FR-D21)                             |
| 5   | Mail sent to the domain arrives, and SPF, DKIM and DMARC all pass on mail sent from it          |
| 6   | A database dump is produced automatically and has been restored once, successfully, as a test   |
| 7   | Bucket egress over the first month is measured and sits inside the free 20 GB                   |
| 8   | The same artifact deploys to the international mirror and serves identically                    |

---

## 8. Licensing and policy requirements — added 2026-08-04

The licensing decisions recorded in [`docs/legal/README.md`](../../../docs/legal/README.md)
are not only paperwork; several of them are things the deployment must actually
do. They are requirements, not intentions.

- **FR-D22** The legal documents are served as real routes on the site, under both language trees (`/fa/legal/…`, `/en/legal/…`), and are linked from the footer of every page. A policy nobody can reach is not in force.
- **FR-D23** `robots.txt` is served from the apex and disallows AI training crawlers by name, backing [ai-usage-policy.md](../../../docs/legal/ai-usage-policy.md). This is a signal and a stated boundary, not a technical guarantee — see `docs/legal/README.md` §5.
- **FR-D24** Every page footer carries the copyright notice, the founding-academic-partner acknowledgement, and links to the Terms of Service and the licensing overview.
- **FR-D25** When the API deploys (U11b), rate limiting and — beyond the public tier — authentication are in place before it is publicly reachable. These are what make the bulk-extraction prohibitions enforceable rather than merely stated.
- **FR-D26** `db/seeds/0005_materials_ldpe_hdpe.sql` is split into a structural seed (Apache 2.0) and a data seed (proprietary) **before the Apache licence is advertised anywhere**. A file cannot be half-licensed. Until the split lands, the whole file is proprietary.
- **FR-D27** The `legal@polycyclopedia.ir` mailbox exists before publication. Every legal document names it as the contact route, so U11c stops being optional at launch.

### Consequences for the plan

| Consequence                                                    | Where it lands                       |
| -------------------------------------------------------------- | ------------------------------------ |
| FR-D22 and FR-D24 are frontend work                            | FE-9 hardening, not U11a             |
| FR-D23 and FR-D26 are U11a                                     | Phase 3, alongside the pipeline      |
| FR-D25 becomes a U11b entry criterion                          | The API may not go public without it |
| FR-D27 promotes U11c from parallel-optional to launch-blocking | `deployment-plan.md` §1              |

### Additional success criteria

| #   | Criterion                                                                                          |
| --- | -------------------------------------------------------------------------------------------------- |
| 9   | The legal routes resolve in both languages and are reachable from every page footer                |
| 10  | `robots.txt` is served and names the AI crawlers it disallows                                      |
| 11  | `db/seeds/0005` is split, and no file in the Apache-licensed tree contains curated property values |
| 12  | `legal@polycyclopedia.ir` receives mail                                                            |

### The open risk this creates

The repository has been **public** throughout development while carrying no
licence file. Nothing was granted away — unlicensed publication is "all rights
reserved" — but the curated data has been publicly readable and cloneable the
whole time, and git history cannot be un-published. The mitigation is forward-
looking only: apply the licence with the §3 scope limitation, split the mixed
seed file, and move the database out of the public tree as it grows in value, so
that it is served through the API rather than committed. Recorded here because it
is a deployment-shaped problem, not only a legal one.
