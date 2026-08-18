# Polypedia — API Terms

> **Status: DRAFT. Not reviewed by a qualified lawyer.** This document is
> written to reflect Polypedia's actual architecture and product decisions. It
> is not legal advice and is not enforceable as written until a lawyer
> qualified in the relevant jurisdiction has reviewed it — before any API is
> made live, and certainly before any commercial agreement is signed.

**Version 0.1 · Drafted 2026-08-04**

---

## 0. Status

**No Polypedia API is live today.** A read-only public API and a separately
licensed enterprise API may be offered in the future; a read-only service
exists in the codebase (`api/`) but is not currently deployed or reachable.
These Terms are drafted in advance so that, when either API is switched on,
its terms are not written under launch pressure. Where a clause below
describes something conditionally, it applies once that offering exists, not
before.

These Terms govern access to and use of any Polypedia API and are
incorporated by reference into [terms-of-service.md](terms-of-service.md),
which governs the platform as a whole.

---

## 1. Two tiers, when offered

| Tier | Description |
|---|---|
| **Public API** | Read-only. Intended for polymer statistics and similar aggregate queries. Unauthenticated or lightly authenticated, rate-limited. |
| **Enterprise API** | Broader read access, agreed per licence. Requires a written commercial agreement under [database-license.md](database-license.md) and [terms-of-service.md §7](terms-of-service.md#7-commercial-licensing). |

Neither tier is live as of this draft. Their existence here is a statement of
intent, not an offer of current access.

---

## 2. Commercial integrations require a written agreement

Any commercial use of a Polypedia API — embedding results in a product,
serving customers, or building a paid feature on top of it — requires a
separate written agreement, regardless of which tier is used. Casual,
non-commercial use of a future public API for personal or academic purposes
does not require a separate agreement, subject to the rate limits and
restrictions in this document.

To request a commercial agreement, follow [terms-of-service.md
§7](terms-of-service.md#7-commercial-licensing).

---

## 3. Rate limits and authentication

Where an API is live, rate limits and/or authentication (such as an API key)
may apply. The specific limits and authentication mechanism will be published
in the API's own developer documentation when that API is made available, and
may differ between the public and enterprise tiers. Exceeding published rate
limits, or attempting to circumvent authentication, is prohibited and may
result in access being throttled, suspended, or revoked without notice.

---

## 4. API access never conveys ownership or redistribution rights

**This is the operative clause of this document.** Access to a Polypedia API
— public or enterprise, free or paid — is a limited right to query and
display results. It does not, under any circumstance, convey:

- Ownership of, or any licence to, the underlying database described in
  [database-license.md](database-license.md);
- A right to redistribute, resell, re-serve, or mirror API responses, in
  whole or in part, as a dataset, feed, or competing API;
- A right to reconstruct a substantial part of the database by aggregating
  repeated API queries; or
- Any licence broader than what this document and the applicable written
  agreement (for commercial use) explicitly grant.

Every API response remains subject to [database-license.md](database-license.md)
and, where scientific content is included, [copyright-policy.md](copyright-policy.md).
Querying the API is not an alternative route to the rights those documents
withhold.

---

## 5. Permitted use

Subject to the applicable tier's rate limits and any written agreement:

- Querying the API for the purpose of displaying results to end users of your
  own application, with attribution as described in
  [terms-of-service.md §5](terms-of-service.md#5-attribution-policy).
- Short-lived caching of API responses for performance — reducing repeated
  identical queries within a normal request-serving window.
- Building internal tools, research workflows, or prototypes that call the
  API directly, subject to the rate limits of the tier used.

---

## 6. Prohibited use

- Re-serving API responses as your own API, dataset, or product, in whole or
  in part.
- Storing API responses to build a persistent local copy of the database, or
  a substantial subset of it, in place of querying the live API.
- Retaining cached responses beyond what is reasonably necessary for
  performance; a cache is not a licence to hold a permanent offline mirror.
- Using an API key or access credential beyond the account or agreement it
  was issued under, including sharing it with a third party.
- Using API access to train, fine-tune, or build a retrieval corpus for an AI
  system, except as permitted by [ai-usage-policy.md](ai-usage-policy.md).
- Any use prohibited under [terms-of-service.md §2](terms-of-service.md#2-prohibited-activities)
  or §3 (scraping and automated access), which apply to API use as they do to
  the site.

---

## 7. Caching and storage limits

Caching API responses to serve your own users efficiently is permitted.
Building a store that functions as a substitute for the API — one that lets
a downstream consumer query your copy instead of Polypedia's — is not,
regardless of whether it is called a "cache." Specific storage-duration and
volume limits, where Polypedia sets them for a given tier, will be stated in
that tier's developer documentation or written agreement; absent a stated
limit, retain only what current performance genuinely requires.

---

## 8. Suspension and termination

Polypedia may suspend or terminate API access, with or without notice, for
violation of these Terms, of [terms-of-service.md](terms-of-service.md), or
of a separate written agreement, and for enterprise access, as that
agreement's own termination terms provide.

---

## 9. Related documents

This document governs API-specific terms only. It does not restate:

- [database-license.md](database-license.md) — ownership and licensing of
  the underlying data.
- [ai-usage-policy.md](ai-usage-policy.md) — training, embeddings, vector
  stores, RAG, and other automated-extraction uses, including via the API.
- [terms-of-service.md](terms-of-service.md) — the platform-wide contract
  this document sits under.

---

## 10. Changes to these Terms

These Terms will be revised before either API tier is switched on, and again
as needed afterward. Material changes will be dated and versioned at the top
of this document. Continued use of an API after a revised version is
published constitutes acceptance of the revised Terms.

---

## 11. Governing law and contact

These Terms are governed by the laws of the Islamic Republic of Iran.
`[COUNSEL: confirm]`

Questions about these Terms, or requests for commercial API access:
legal@polycyclopedia.ir.[^contact]

[^contact]: This mailbox does not exist yet; it depends on U11c.
