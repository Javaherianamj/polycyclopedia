# Polypedia — Contributor License Agreement (Data, Review & Educational Content)

> **Status: DRAFT. Not reviewed by a qualified lawyer.**
> This agreement was drafted to reflect Polypedia's actual data-contribution
> workflow, not a generic template. It is not legal advice and is not yet in
> force as a binding agreement — see [`README.md`](README.md) for how it
> relates to the platform's other legal documents. Do not treat acceptance of
> this document as currently enforceable until it has been reviewed by
> counsel and a real acceptance mechanism (§8) exists.

**Version**: 0.1 · **Last updated**: 2026-08-04

---

## 0. The plain-language version — read this first

If you contribute curated data, citations, review, or educational content to
Polypedia, you are donating your work to a database that **Polypedia licenses
commercially** to other companies (see [`README.md`](README.md) §5 and
[`database-license.md`](database-license.md)). That is a legitimate thing for
a project to do, and it is exactly the kind of thing contributors are
justified in feeling misled about if it is left unstated. So: stated, plainly,
before anything else in this document — your citation of a Tg value, your
review of an article draft, your translation of a learning page, becomes part
of an asset Polypedia may sell access to.

In exchange, you keep credit for what you did (§5), you are never asked to
give up more than a licence (§2), and you are never asked to fabricate or copy
anything to get there (§4). If that trade isn't one you want to make for a
given contribution, don't submit it — nothing obliges you to.

---

## 1. Scope

This agreement covers non-code contributions to Polypedia, specifically:

- **Curated property values**, submitted through the CSV workflow described in
  [`../CURATION-GUIDE.md`](../CURATION-GUIDE.md) (`gaps.csv` entries — values,
  ranges, qualifiers, test conditions);
- **Citations and sources**, submitted as `sources.csv` entries or as page,
  table, figure, or section references attached to a value;
- **Article and literature review** — evaluating, correcting, or verifying
  existing content or submitted data;
- **Educational and explanatory content** — learning-surface material, concept
  explanations, material overviews; and
- **Translations** of any of the above between Persian and English.

**Code contributions are out of scope** — see §7.

---

## 2. The grant

By submitting a contribution within the scope of §1, you grant Polypedia a
**perpetual, irrevocable, worldwide, royalty-free, non-exclusive licence** to
use, reproduce, adapt, translate, publish, and **commercially license** the
contribution, in whole or in part, as part of the Polypedia database, the
platform's scientific content, and any product built on either.

This is a **licence, not an assignment of copyright** — you keep ownership of
your contribution; Polypedia is granting itself broad permission to use it,
rather than you handing ownership over, because a licence secures everything
the project actually needs (commercial use, sublicensing, adaptation) without
requiring you to give up authorship of your own work.

---

## 3. What this licence lets Polypedia do

Under the grant in §2, Polypedia may, without further permission or payment:

- include your contribution in the curated database described in
  [`README.md`](README.md) §5, alongside other contributors' work;
- edit, normalise, re-format, or correct your contribution as part of ordinary
  curation and editorial review;
- publish it on the Polypedia site and through the Polypedia API;
- sublicense it to commercial API and data-licensing customers under
  [`api-terms.md`](api-terms.md) and [`database-license.md`](database-license.md); and
- retain and use it even if you later stop contributing.

---

## 4. Your warranties

By submitting a contribution, you state that:

1. **It is your own work, or you hold the rights to submit it.** You wrote the
   review, performed the translation, or are otherwise entitled to grant the
   licence in §2 — you are not passing along someone else's unlicensed work as
   your own.
2. **It is not copied verbatim from a copyrighted source.** Per
   [`../SOURCING-GUIDE.md`](../SOURCING-GUIDE.md) and project decision **D5**,
   contributions to the database are **citation metadata only** — the value,
   its unit, the source, the page or table it came from. Verbatim source text
   and page scans are never submitted, never requested, and will be rejected
   if found. A citation is a pointer to where a value can be verified, not a
   copy of the page it was read from.
3. **You have not violated any publisher's or provider's terms in obtaining
   it.** Handbooks and paywalled articles may be read and cited; their terms
   of service around bulk extraction and redistribution must not be violated
   to do so (see `../SOURCING-GUIDE.md` Part 2, Tier 3, on sources that may be
   consulted but not scraped or bulk-copied).
4. **You have not invented a page number, value, or citation.** Per
   [`../CURATION-GUIDE.md`](../CURATION-GUIDE.md), an unsourced gap is left
   blank, not filled with a plausible-looking fabrication.

---

## 5. Attribution and credit

This is the reciprocal half of the bargain in §0, and it is meant concretely,
not as a gesture:

- **Per-value attribution.** Every curated property value carries its
  citation and, where curation is attributed at the row level, the
  contributor who entered it. This is structural to the schema, not a
  courtesy — the citation *is* what makes the value trustworthy.
- **A contributors record.** Polypedia maintains, and intends to publish, a
  record of who has contributed data, review, or educational content, so that
  contribution is visible beyond a single value's citation.
- **Review and translation credit.** Substantial article review or
  translation work is credited on the content it touches, in a form
  appropriate to that content type (a byline, a "reviewed by" note, a
  translator credit).
- **What credit is not**: it is not co-ownership, and it does not entitle a
  contributor to revenue from commercial licensing of the database (§2–3).
  The trade is credit and a public, citable body of work in exchange for the
  licence granted in §2 — stated plainly, as promised in §0.

---

## 6. No obligation to use

Polypedia is not obliged to use, publish, retain, or even review any
contribution submitted under this agreement. A contribution may be rejected,
left unmerged, or held pending further sourcing (for example, if it fails the
plausibility or citation checks in `../CURATION-GUIDE.md` Step 3) without that
constituting a breach of this agreement.

---

## 7. Moral rights

To the extent moral rights (attribution and integrity) apply to your
contribution under applicable law, you agree that Polypedia's ordinary
editorial activity under §3 — correcting, normalising, translating, or editing
a contribution for accuracy or house style — does not infringe them. Where
moral rights cannot be waived outright under applicable law, you agree not to
assert them in a way that would prevent Polypedia's ordinary use of the
contribution under §2–3.

---

## 8. Code is different

**This agreement does not cover code.** Code contributions — to the
application, schema migrations, ETL, curation tooling, or tests — are
governed separately: they are contributed **inbound under the GNU Affero General Public License
2.0**, the same licence Polypedia's source code is released under outbound,
so no separate grant or asymmetry is needed. See [`/LICENSE`](../../LICENSE)
and [`README.md`](README.md) §3 for the code/data boundary. If a contribution
mixes code and data (for example, a seed file — see `README.md` §3's note on
`db/seeds/0005_materials_ldpe_hdpe.sql`), the data portion is covered by this
agreement and the code portion by AGPL-3.0, not one licence for the whole
file.

---

## 9. Corrections and withdrawal

You may ask Polypedia to correct or withdraw a contribution at any time, by
contacting **legal@polycyclopedia.ir**.[^1]

- **Corrections** — an error you find in your own submitted data or text will
  be fixed as ordinary curation, the same as any other correction.
- **Withdrawal** — Polypedia will stop using and remove a withdrawn
  contribution going forward, on a good-faith basis.
- **The honest limit**: once a value has been published, cited by others,
  incorporated into derivative compilations, or sublicensed to a commercial
  customer under §3, it may not be possible to fully unwind its prior
  publication or downstream use. Withdrawal is honoured prospectively; it is
  not a guarantee that every trace of prior, lawful use under §2 can be
  recalled. This limit is stated here rather than glossed over, in keeping
  with §0.

---

## 10. How this agreement is accepted

The intended mechanism is a **checkbox at submission time**, presented as part
of the curation workflow (`../CURATION-GUIDE.md`), confirming acceptance of
this agreement before a contribution is imported. **This tooling does not
exist yet** — today, contribution happens through direct collaboration with
the project rather than a self-serve submission flow, so acceptance is, for
now, a **signed statement** (including an emailed confirmation) obtained
before a contribution is merged. This section will be updated to describe the
actual mechanism once the submission flow is built.

---

## 11. Governing law

This agreement is governed by the laws of the Islamic Republic of Iran.
`[COUNSEL: confirm]` — including enforceability of the licence grant in §2
against contributors located abroad.

---

## 12. Contact

Questions about this agreement, corrections, or withdrawal requests:
**legal@polycyclopedia.ir**.[^1]

[^1]: This mailbox does not exist yet — it depends on mail service being
    configured for the domain (`deployment-requirements.md`, U11c/FR-D6).
    Until it exists, check [`README.md`](../../README.md) for the project's
    current contact point.

---

## Related documents

- [`README.md`](README.md) — the six-layer licensing overview this agreement
  fits into
- [`database-license.md`](database-license.md) — how the database this
  agreement feeds is licensed onward
- [`api-terms.md`](api-terms.md) — commercial licensing terms referenced in §3
- [`../SOURCING-GUIDE.md`](../SOURCING-GUIDE.md) — where data may legitimately
  be obtained; the standard this agreement's warranties (§4) rest on
- [`../CURATION-GUIDE.md`](../CURATION-GUIDE.md) — the submission workflow
  this agreement's acceptance mechanism (§10) attaches to
- [`/LICENSE`](../../LICENSE) — the AGPL-3.0 licence governing code
  contributions (§8), out of scope for this agreement
