# Polypedia database licence

> **Status: DRAFT. Not reviewed by a qualified lawyer.**
> This document was drafted to reflect the project's actual architecture and
> product decisions, not from a template. It is not legal advice, and it is
> not enforceable as written until a lawyer qualified in the relevant
> jurisdiction has reviewed it. See [`README.md`](README.md) for the full
> picture of how this document fits alongside the others.

---

## 1. What this document covers

The Polypedia database is the curated collection of polymer property values,
their citations, their sources, and the coverage metadata that tracks which
values are sourced and which are not. It is layer 2 of the six layers set out
in [`README.md`](README.md), and it is **Polypedia's primary intellectual
asset**.

This document governs the database. It does not govern the source code
(covered by [`/LICENSE`](../../LICENSE)), the written scientific prose
(covered by [copyright-policy.md](copyright-policy.md)), or the platform
brand (covered by [branding-policy.md](branding-policy.md)). For AI, training
and automated-extraction questions specifically, see
[ai-usage-policy.md](ai-usage-policy.md).

**The database is not open data.**

---

## 2. What is permitted

Anyone may, without asking permission:

- **Browse** the site and its material pages
- **Search** the database through the interfaces Polypedia provides
- **Read** property values, their units, and their stated provenance
- **Learn** from the material — use it to understand polymer properties,
  compare materials, or support study and personal research
- **Cite** individual values with attribution — naming Polypedia as the
  source, ideally with a link back to the material page a value came from

Citing a handful of values in a paper, a report, or another web page, with
attribution, is exactly the kind of use this database exists to support.

---

## 3. What requires explicit written permission

The following are **prohibited without a signed agreement or other explicit
written permission from Polypedia**:

- **Bulk download** — retrieving the database, or a substantial part of it,
  in one operation or through repeated automated requests
- **Scraping** — programmatic extraction of values, citations, or coverage
  data from the site or API, whether in one pass or over time
- **Mirroring** — hosting a copy of the database, in whole or in part, on
  another site or service
- **Redistribution** — passing the database, or an export of it, to a third
  party, whether free or paid
- **Creating a competing or derivative database** — using Polypedia's
  compilation as the basis, seed, or validation set for another polymer
  property database
- **Commercial use** — any use in a product, service, or internal tool that
  generates revenue or is offered to customers
- **AI/LLM training** — using the database, in whole or in part, to train,
  fine-tune, or evaluate a machine learning model
- **RAG dataset construction** — indexing or embedding the database to serve
  as a retrieval corpus for a language model

This list is illustrative, not exhaustive. The underlying test is simple: **is
this use of the compilation itself, at scale, rather than a citation of the
individual values it contains?** If yes, ask first.

---

## 4. The key distinction: readable is not free

**A public website that anyone can browse for free is not the same as a
database released under an open licence.** This distinction matters enough to
state on its own.

Polypedia's decision to make the site freely readable — no paywall, no
account requirement, no fee to look up the glass-transition temperature of a
material — is a **product decision**, made because a citation-first reference
work is only useful if people can reach it. It is not a statement about
ownership, and it is not a licence to the underlying compilation.

The same distinction exists everywhere reference works are published online:
a library's reading room is open to the public; that does not make its
catalogue free to copy. Reading a value on a Polypedia page and citing it is
the intended use. Extracting the page's values programmatically, at scale, to
rebuild the underlying dataset elsewhere, is not — regardless of whether the
page itself required a login.

Nothing about free access changes the ownership position in
[section 5](#5-what-the-ownership-claim-rests-on) below, and nothing about
free access grants any of the rights withheld in
[section 3](#3-what-requires-explicit-written-permission).

---

## 5. What the ownership claim rests on

Stating this precisely matters, because overclaiming here would undermine
the credibility of the whole set of legal documents.

- **Individual facts are not owned.** The glass-transition temperature of
  LDPE is a physical constant. Polypedia does not own it, and does not claim
  to own it, or any other individual property value.
- **The compilation is owned.** What is protected is the selection,
  verification, arrangement, normalisation, and citation of those values —
  the editorial work that turns scattered handbook and datasheet entries into
  a coherent, sourced, comparable dataset. That editorial work is original
  and substantial, and it is the asset this document protects.
- **Iran provides no *sui generis* database right.** Unlike the EU, Iranian
  law does not grant a standalone database right independent of copyright.
  The claim here therefore rests on **copyright in the compilation**,
  **contract** (the Terms of Service governing use of the site and any API),
  and **confidentiality** for anything not published. Because there is no
  database right to fall back on, the acceptable-use terms in
  [section 3](#3-what-requires-explicit-written-permission) carry more of the
  weight here than they would in a jurisdiction with one.

In practice, enforcement rests on, in descending order of effectiveness:
licensing terms for commercial users who want to be compliant; technical
measures (rate limits, authentication, `robots.txt` — see
[ai-usage-policy.md](ai-usage-policy.md) for detail); contract; and
litigation, which is realistic domestically and largely theoretical against a
scraper operating abroad.

---

## 6. What a reader may rely on

A reader citing a Polypedia value may rely on:

- The value as displayed, together with the provenance state shown alongside
  it. Every value on the site carries a provenance marker — it is either
  attributed to a specific source (work, edition, page) or it is explicitly
  marked as uncited. A value never appears without one or the other; there is
  no silent gap where a citation might have been.
- The material-level coverage indicator shown on each material's page, which
  states plainly how much of that material's data is sourced.
- The citation metadata shown for a sourced value — the work, edition, and
  page it came from — which is what should appear in a downstream citation.
  Polypedia does not display quoted source text or scanned pages alongside a
  value, so a reader will not find a passage to reproduce, only the pointer
  to where one could look it up.

A reader should **not** rely on the absence of a citation marker as a
guarantee of accuracy — an uncited value is presented as such precisely
because it has not yet been independently verified against a source Polypedia
can name. As of this writing, the database holds two materials and 109
property values, of which roughly 11% carry a citation; the remainder are
shown, not hidden, and are marked uncited. Coverage will grow over time and
is not uniform across materials or properties.

---

## 7. Commercial access

Organisations that want to use the database at a scale or for a purpose
covered in [section 3](#3-what-requires-explicit-written-permission) should
contact Polypedia to discuss a licence. Depending on the intended use, this
may take the form of:

- **An official API**, with terms and rate limits appropriate to the use case
- **An enterprise agreement**, for internal or product use at scale
- **A subscription**, for ongoing access to updates and coverage growth
- **A licensing contract**, for redistribution, derivative-database, or
  training use

No such offering exists today — there is no public API, no subscription
tier, and no self-service licensing flow yet. Organisations with a
commercial interest should reach out directly so terms can be worked out on a
case-by-case basis while these products are built.

---

## 8. Where the boundary physically falls

This document governs the *database as a compilation*, wherever it appears —
on the live site, through any future API, or in an export. For the specific
question of which files in this repository are covered by the AGPL-3.0
source-code licence and which are not, see
[`README.md` §3](README.md#3-where-the-licence-boundary-physically-falls).
In short: schema and structural seed files that define *what can be
recorded* are code; the curated values themselves, wherever they are
committed, are database — governed by this document, not by
[`/LICENSE`](../../LICENSE).

---

## 9. Requesting permission

To request any use covered in [section 3](#3-what-requires-explicit-written-permission),
contact `legal@polycyclopedia.ir`.[^contact]

[^contact]: This mailbox does not exist yet. It depends on U11c and will be
    live before this document is treated as binding.

---

## 10. Governing law

This document is governed by the law of the Islamic Republic of Iran.
`[COUNSEL: confirm]`

Enforcement against a party operating outside Iran is, as a practical matter,
limited to the effectiveness of the technical and contractual measures
described in [section 5](#5-what-the-ownership-claim-rests-on); litigation
abroad is largely theoretical for a project at this stage.

---

*Version 0.1 — drafted 2026-08-04.*
