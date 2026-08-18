# Deployment (U11) — Clarifying Questions

**Stage**: INCEPTION — Requirements Analysis
**Unit**: U11 `deployment`
**Created**: 2026-08-04
**Status**: awaiting answers

Answer by writing after each `[Answer]:` tag. Options are mutually exclusive.
A recommendation is marked **(recommended)** where there is a clear one, with the
reason given — you are not obliged to take it.

Four decisions are already settled and are **not** re-asked here:

| Settled      | Decision                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product name | **Polypedia** / پلی‌پدیا. The domain is `polycyclopedia.ir` and the gap between the two becomes the wordmark's animated idea, not a compromise                |
| Build model  | **Hybrid.** Build-time static for content that changes rarely or in bulk; live API for polymer statistics. v1 ships 100% static because search is not started |
| Primary host | **ArvanCloud**, domestic. GitHub/Cloudflare remains a secondary international mirror, not the main stream                                                     |
| Email        | **Yes**, mailboxes on the domain are wanted                                                                                                                   |

---

## Q-D1. Who registers the domain and owns the Arvan account?

This is asked first because it is the hardest thing to change later. Moving a
`.ir` domain between an individual IRNIC handle and a company handle is a
transfer with paperwork, not a settings change.

- **A)** Personal — registered under your own national ID, both IRNIC and Arvan **(recommended if no company exists yet)**
- **B)** Company — registered under a registered company's شناسه ملی, using روزنامه رسمی for IRNIC authentication
- **C)** Personal now, transfer to a company later when one exists
- **D)** Other (please describe after `[Answer]:` below)

Reason for the recommendation: option C sounds prudent but costs a transfer plus
a second identity verification. If the company that will licence this to
manufacturers (project-plan.md §2, U13 multi-tenancy) already exists, register as
the company now. If it does not, register personally and accept the later
transfer as a known cost.

`[Answer]`:
A
---

## Q-D2. Which email provider for `@polycyclopedia.ir`?

ArvanCloud does not sell mailboxes, so this is a separate provider regardless.

- **A)** A domestic Iranian mail host (ParsPack, IranServer, MailFa, or similar) **(recommended)**
- **B)** An international provider (Zoho Mail, Google Workspace, Fastmail)
- **C)** Forwarding only — no mailboxes, `info@` simply forwards to an existing personal address
- **D)** Self-hosted mail server on the same machine as the API
- **E)** Other (please describe after `[Answer]:` below)

Reason for the recommendation: A is the only option where payment and account
access reliably work from Iran. Its real cost is **deliverability** — mail from
a domestic host to Gmail or Outlook lands in spam more often, which matters the
day you email a foreign B2B prospect. That is a further argument for holding an
international domain (Q-D4) rather than an argument against A.

D is listed for completeness and is a bad idea: running your own SMTP means
owning reputation, blocklists and spam filtering forever, for the sake of a few
mailboxes.

`[Answer]`:
zoho free plan for now. might migrate to google workspace later
---

## Q-D3. What triggers a production deploy?

Content lands in bulk (a curation batch, a new material), not continuously, and
D10 says nothing publishes until FE-9 is complete.

- **A)** Git tag — pushing a `v*` tag builds and deploys; `main` only runs CI **(recommended)**
- **B)** Every push to `main` deploys automatically
- **C)** Manual only — a workflow you click to run
- **D)** Other (please describe after `[Answer]:` below)

Reason for the recommendation: A makes publishing a deliberate act, which is what
D10 asks for, while keeping it one command. B would have published the site the
moment the rebuild branch merged.

`[Answer]`:
A
---

## Q-D4. Do you want the defensive domain registrations?

- **A)** `polycyclopedia.ir` only — nothing else
- **B)** Also register `polypedia.ir` and redirect it to the main site **(recommended)**
- **C)** B, plus an international domain for the Cloudflare mirror and for email deliverability
- **D)** Other (please describe after `[Answer]:` below)

Facts as of 2026-08-04: neither `polypedia.ir` nor `polycyclopedia.ir` resolves
any nameservers, so both look unregistered — confirm at nic.ir before relying on
this. `polypedia.com` is parked on Sedo, i.e. held by a reseller at a
negotiation price, not available at registration cost.

Reason for the recommendation: `.ir` registration is cheap and the product is
called Polypedia. Someone typing the product name should not land on a stranger's
page. B costs the price of a coffee; C costs more and can wait until there is a
foreign audience to serve.

`[Answer]`:
polypedia.ir is taken. adding other domains is a possibility for later,for now it's just the Cloudflare mirror.
---

## Q-D5. Publish a placeholder page now?

D10 states that nothing publishes until FE-9 is complete. A holding page is
arguably not a publication, but it is your call, not mine.

- **A)** Yes — a single "به‌زودی" page, so DNS, TLS, the bucket and the deploy pipeline are proven end to end weeks before launch **(recommended)**
- **B)** No — leave the domain dark until FE-9; do not point DNS at anything yet
- **C)** Yes, but gated — a holding page behind basic auth or an unguessable path, visible only to you
- **D)** Other (please describe after `[Answer]:` below)

Reason for the recommendation: the failure mode this prevents is debugging
nameserver propagation, certificate issuance and bucket permissions on launch
day. A holding page exercises every one of them while nothing is at stake. It
does not contradict D10's intent, which is about not showing an unfinished
_product_.

`[Answer]`:
A. but beware we don't add claudflare yet to the domains.
---

## Q-D6. Analytics?

- **A)** None at all
- **B)** Self-hosted, privacy-preserving (Plausible or Umami) on the same machine as the API **(recommended, but only once U11b exists)**
- **C)** A hosted Iranian analytics service
- **D)** Google Analytics
- **E)** Other (please describe after `[Answer]:` below)

Note: D is listed for completeness but has two problems here — it is an external
tracker on a Persian educational site, and access from Iran is unreliable. B
costs nothing extra once the API host exists but is not available in v1, which is
pure static. If you want numbers before then, Arvan's own CDN traffic reports are
already included in the free tier and require no code.

`[Answer]`:
B
---

## Q-D7. Bucket region

- **A)** Tehran (`ir-thr-at1`) **(recommended — default, lowest latency for the majority of users)**
- **B)** A different Arvan region (specify)
- **C)** No preference — pick for me
- **D)** Other (please describe after `[Answer]:` below)

`[Answer]`:
A
---

## Open items NOT asked as questions

Recorded here so they are not lost, but they do not block U11:

1. **ساماندهی registration.** A public Persian content site hosted domestically is
   generally expected to register with samandehi.ir. Not a launch blocker on day
   one; confirm with Arvan support what they require before the site is
   commercial. Becomes non-optional at U13 (multi-tenancy / B2B).
2. **The IRANSansX webfont licence** (project-plan.md §5.6) is still unresolved
   and is a _publishing_ question, not a design one — it becomes real the moment
   the site is publicly served. Estedad (SIL OFL) remains the working fallback.
3. **Data licence** (project-plan.md §5.5) — likewise becomes real at publication.
   The curated database is the asset; publishing it without a stated licence is a
   decision by default rather than by choice.

### Persian Webfont

Decision:

Use Estedad as the default production font.

IRANSansX may be adopted in the future only after purchasing the appropriate commercial webfont license.

Status:
- Current font: Estedad (SIL OFL)
- Future option: IRANSansX (Commercial License)

### Data License Strategy

The Polypedia database is the project's primary intellectual asset.

The database will NOT be publicly distributed in bulk.

Users are allowed to:

- Browse the website.
- Search the database.
- Read articles.
- Learn from the published content.
- Cite Polypedia as a source with proper attribution.

Users are NOT allowed to:

- Download or scrape the database in bulk.
- Mirror significant portions of the database.
- Redistribute database contents.
- Build competing databases from Polypedia.
- Use the database for commercial purposes without a written agreement.
- Train AI or Machine Learning models using Polypedia content or data without explicit written permission.

Commercial integrations will be provided through official APIs, search services, enterprise subscriptions, or separate licensing agreements.

The source code and the database are licensed independently.
### Source Code License

The Polypedia application source code will be released as open source under the Apache License 2.0.

Open sourcing the application does not grant any rights to the Polypedia database, datasets, branding, trademarks, logos, or proprietary content.
