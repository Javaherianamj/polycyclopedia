# Polypedia — Terms of Service

> **Status: DRAFT. Not reviewed by a qualified lawyer.** This document is
> written to reflect Polypedia's actual architecture and product decisions. It
> is not legal advice and is not enforceable as written until a lawyer
> qualified in the relevant jurisdiction has reviewed it — before the site is
> published, and certainly before any commercial agreement is signed.

**Version 0.1 · Drafted 2026-08-04**

---

## 0. Scope

These Terms of Service ("Terms") govern access to and use of the Polypedia
platform — پلی‌پدیا — including its website, database content, scientific
content, and any API made available under [api-terms.md](api-terms.md). By
reading, searching, or otherwise using Polypedia, you agree to these Terms. If
you do not agree, do not use the platform.

Polypedia is six separately-owned things sharing one product; see
[README.md](README.md) for the full layer map. These Terms are the contract
that sits across all six. They do not restate what each layer's document
already says — where a clause belongs to a specific layer, this document links
to it instead.

---

## 1. Acceptable use

Polypedia exists to be read, searched, learned from, and cited. The following
are explicitly encouraged:

- Reading material pages, property values, and learning content for personal,
  academic, or professional education.
- Searching and browsing the catalogue, including by target property ranges.
- Citing Polypedia values and content in academic work, engineering notes,
  reports, and publications, in accordance with the [Attribution
  policy](#5-attribution-policy) below.
- Linking to Polypedia pages from other sites and documents.
- Forking the source code under [`/LICENSE`](../../LICENSE), subject to
  [`/NOTICE`](../../NOTICE) and [README.md §3](README.md#3-where-the-licence-boundary-physically-falls).

---

## 2. Prohibited activities

The following are prohibited on the platform, regardless of intent:

- Attempting to gain unauthorized access to Polypedia systems, accounts, or
  non-public data.
- Interfering with or disrupting the platform's availability or integrity,
  including by overwhelming it with automated traffic.
- Circumventing or attempting to circumvent rate limits, authentication, or
  other technical access controls.
- Misrepresenting Polypedia data, content, or citations as your own original
  work, or altering a cited value without disclosing the alteration.
- Using Polypedia content to train, fine-tune, embed, or build a retrieval
  corpus for an AI system, except as permitted by
  [ai-usage-policy.md](ai-usage-policy.md).
- Reproducing, redistributing, or re-serving the database or scientific
  content beyond the licences described in [database-license.md](database-license.md)
  and [copyright-policy.md](copyright-policy.md).
- Using the Polypedia name, the پلی‌پدیا name, the logo, or other brand
  elements in a way not permitted by [branding-policy.md](branding-policy.md).
- Any use that violates applicable law.

Violations may result in access being blocked or restricted by technical
means, without notice.

---

## 3. Scraping and automated-access restrictions

Polypedia asks of others what it asks of itself: see
[SOURCING-GUIDE.md](../SOURCING-GUIDE.md) for the inbound discipline this
policy mirrors.

- Bulk, automated extraction of the database or site content — by crawler,
  scraper, script, or any other automated means — is prohibited except where
  explicitly permitted by an API agreement under [api-terms.md](api-terms.md)
  or by `robots.txt`.
- Automated access must identify itself honestly (a truthful user agent) and
  must respect `robots.txt` and any rate limits communicated by the platform,
  technically or in writing.
- Systematic reconstruction of the database or a substantial part of it
  through repeated individual page reads is treated as scraping and is
  prohibited, whether performed by a human or a script.
- These restrictions exist because the compilation itself — the selection,
  verification, and citation of values — is the asset Polypedia is built to
  protect; see [README.md §5](README.md#5-what-the-database-claim-actually-rests-on)
  for the reasoning.

---

## 4. API usage

Where Polypedia offers a public or enterprise API, access to and use of it is
governed by [api-terms.md](api-terms.md), which these Terms incorporate by
reference. No API is live as of this draft; see api-terms.md for current
status. This document does not restate the API's terms.

---

## 5. Attribution policy

Citing Polypedia correctly is not just requested, it is how the platform's
value — verified, sourced compilation work — is credited rather than
laundered into an uncredited copy elsewhere.

When citing a Polypedia value or page, include: the platform name, the
material or page cited, the retrieval date, and the URL. For example:

> Polypedia (پلی‌پدیا). "Low-Density Polyethylene (LDPE)." Retrieved
> 2026-08-04 from https://polycyclopedia.ir/materials/ldpe.

Where a specific property value is cited rather than the page as a whole,
also state the property and, if shown, the underlying source Polypedia itself
cites for that value — Polypedia's citation popover displays this metadata
per material property (work, edition, page; see
[README.md §5](README.md#5-what-the-database-claim-actually-rests-on) and the
frontend's D5 decision, which limits that popover to metadata only).

**Citation coverage matters to how you cite.** As of this draft, the database
holds two materials and 109 property values at 11% citation coverage — most
values are marked `draft` or `unsourced`, not yet traced to a verified
reference. When citing an unsourced value, say so, rather than presenting it
as independently verified. See [Limitation of liability](#8-limitation-of-liability)
below.

---

## 6. Intellectual property

Polypedia is six separately-owned layers, not one blanket claim. Each layer's
ownership, licence, and permitted use are defined in its own document — this
section does not restate them, it points to them:

| Layer | Document |
|---|---|
| Source code | [`/LICENSE`](../../LICENSE) and [`/NOTICE`](../../NOTICE) |
| Database (curated values, citations, sources) | [database-license.md](database-license.md) |
| Scientific content (prose, overviews, illustrations) | [copyright-policy.md](copyright-policy.md) |
| Branding and trademark | [branding-policy.md](branding-policy.md) |
| AI, embeddings, RAG, and training uses | [ai-usage-policy.md](ai-usage-policy.md) |

Nothing in these Terms grants a licence broader than the one granted in the
applicable layer document.

---

## 7. Commercial licensing

Use of Polypedia's database, scientific content, or branding beyond what
[database-license.md](database-license.md), [copyright-policy.md](copyright-policy.md),
and [branding-policy.md](branding-policy.md) permit for ordinary reading and
citation requires a commercial licence.

To obtain one: contact Polypedia in writing describing the intended use — the
data or content required, the product it will be used in, and the expected
scale of use. Polypedia will respond with the applicable terms, which are
agreed in a separate written licence agreement; nothing in these Terms
constitutes an offer of such a licence. Commercial API integrations follow the
same route and are additionally subject to [api-terms.md](api-terms.md).

Contact: legal@polycyclopedia.ir.[^contact]

---

## 8. Limitation of liability

Polypedia is a scientific reference under active construction, not a
finished, fully-verified handbook. As of this draft, the database holds two
materials and 109 property values at **11% citation coverage**; the remainder
is explicitly marked `draft` or `unsourced` in the interface. Coverage and
status indicators are shown precisely so that a reader can judge, value by
value, how much confidence the platform itself has in what it is showing.

**Polypedia content and data are provided "as is," without warranty of
accuracy, completeness, or fitness for a particular purpose.** Property
values, ranges, and derived content must not be relied upon as the sole basis
for engineering, safety, regulatory, or purchasing decisions. Where a value
has not been sourced, or where citation coverage for a family or property is
low, treat it as a starting point for independent verification against a
primary reference — not as a verified fact.

To the maximum extent permitted by applicable law, Polypedia and its
contributors are not liable for any loss or damage arising from reliance on
platform content, including indirect, incidental, or consequential damages.
This limitation does not apply where liability cannot lawfully be excluded.

---

## 9. Account responsibilities

**No user accounts exist on Polypedia today.** This section applies only if
and when Polypedia introduces accounts.

Where accounts are offered, an account holder will be responsible for:

- The accuracy of information provided when creating an account.
- Maintaining the confidentiality of their credentials and for all activity
  under their account.
- Notifying Polypedia promptly of any suspected unauthorized use.

Account-specific terms — creation, verification, suspension, and closure —
will be published here once accounts exist, alongside
[privacy-policy.md](privacy-policy.md) governing what account data is
collected.

---

## 10. Changes to these Terms

Polypedia may revise these Terms as the platform evolves — most likely as
accounts, the public API, or commercial licensing move from planned to live.
Material changes will be dated and versioned at the top of this document.
Continued use of the platform after a revised version is published
constitutes acceptance of the revised Terms. Where required by applicable
law, material changes will be announced through the platform itself.

---

## 11. Governing law

These Terms are governed by the laws of the Islamic Republic of Iran.
`[COUNSEL: confirm]` Note the practical limits on enforcement against parties
outside Iran; see [README.md §5](README.md#5-what-the-database-claim-actually-rests-on)
for how Polypedia's enforcement strategy accounts for this.

---

## 12. Contact

Questions about these Terms: legal@polycyclopedia.ir.[^contact]

[^contact]: This mailbox does not exist yet; it depends on U11c.
