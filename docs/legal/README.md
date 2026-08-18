# Polypedia — legal and licensing

> **Status: DRAFT. Not reviewed by a qualified lawyer.**
> Every document in this directory was drafted to reflect the project's actual
> architecture and product decisions, not from a template. That makes them
> useful and internally consistent. It does not make them legal advice, and it
> does not make them enforceable as written. Before the site is published, and
> certainly before any commercial agreement is signed, these need review by a
> lawyer qualified in the relevant jurisdiction — particularly the Terms of
> Service, the Privacy Policy, and the Contributor Licence Agreement, which are
> the three that create real obligations.

---

## 1. The one principle

**Polypedia is six separately-owned things that happen to live in one
repository.** They are not one product with one licence, and the most expensive
mistake available here is letting them blur together.

| #   | Layer                  | What it covers                                                                              | Owner     | Licence                                             | Document                                   |
| --- | ---------------------- | ------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------- | ------------------------------------------ |
| 1   | **Source code**        | Application code, build tooling, schema migrations, ETL and curation scripts, tests         | Polypedia | **GNU AGPL v3.0**                                   | [`/LICENSE`](../../LICENSE)                |
| 2   | **Database**           | Curated property values, citations, sources, coverage — the compilation                     | Polypedia | **Proprietary.** Not open data                      | [database-license.md](database-license.md) |
| 3   | **Scientific content** | Written prose, material overviews, learning material, explanations, illustrations, diagrams | Polypedia | **Proprietary.** Reading and citing encouraged      | [copyright-policy.md](copyright-policy.md) |
| 4   | **APIs**               | Public and enterprise API access                                                            | Polypedia | **Terms of access.** Access never conveys ownership | [api-terms.md](api-terms.md)               |
| 5   | **Branding**           | Name, logo, wordmark, icons, palette, UI/UX identity, illustrations, domains, marketing     | Polypedia | **Proprietary.** Not covered by the code licence    | [branding-policy.md](branding-policy.md)   |
| 6   | **Trademark**          | The Polypedia mark and the پلی‌پدیا mark                                                    | Polypedia | **Proprietary.** Registration may be pursued        | [branding-policy.md](branding-policy.md)   |

Cross-cutting documents:

| Document | Governs |
|---|---|
| [terms-of-service.md](terms-of-service.md) | The contract between Polypedia and anyone using the site or API |
| [ai-usage-policy.md](ai-usage-policy.md) | Training, embeddings, vector stores, RAG, automated extraction |
| [privacy-policy.md](privacy-policy.md) | What is collected from visitors, and what is not |
| [CONTRIBUTOR_LICENSE_AGREEMENT.md](CONTRIBUTOR_LICENSE_AGREEMENT.md) | What a contributor grants when they submit data, review, or educational material |

**The rule that follows from the table**: forking the code grants layer 1 and
nothing else. A fork is lawful, useful, and welcome. A fork that keeps the name,
the logo, or the database is none of those things.

---

## 2. Project identity

Polypedia is an independent scientific platform.

The project began in collaboration with the **Scientific Association of Polymer
Engineering**, which is acknowledged as the **founding academic partner**. The
Association may have its own section within the platform — news, educational
material, association activities — and that section's content belongs to the
Association.

The Association is an academic collaborator, not the owner of the platform.
Software development, infrastructure, branding, the database, the APIs, the AI
systems, the products and all commercial activity belong to the Polypedia
project.

**Approved wording**, to be used verbatim wherever attribution appears:

> Originally developed in collaboration with the Scientific Association of
> Polymer Engineering.

or, where a short form is needed:

> Founding Academic Partner: Scientific Association of Polymer Engineering.

Neither form implies ownership, endorsement of commercial offerings, or
Association liability for platform content.

---

## 3. Where the licence boundary physically falls

This is the part that is easy to state and easy to get wrong, because the code
and the data currently live in the same tree.

**The AGPL applies to the source code only. It does not apply repo-wide.**
Applying it repo-wide would grant a perpetual, irrevocable, worldwide licence
over the curated database — the exact opposite of the decision in layer 2. The
`LICENSE` file at the root must always be read together with this section and
with [`/NOTICE`](../../NOTICE).

### Covered by the AGPL

| Path | Why |
|---|---|
| `src/`, `api/src/`, `api/test/` | Application and service code |
| `db/migrations/`, `db/tests/`, `db/run.sh`, `db/test.sh` | Schema definition and schema tests — structure, not content |
| `tools/etl/`, `tools/curation/`, `tools/legacy/` | Tooling |
| `.github/`, build and lint configuration | Tooling |
| `db/seeds/0001`, `0002`, `0004`, `0006` | Structural seeds: fields, families, the property registry, test methods, taxonomy scaffolding. These define *what can be recorded*, not what was found |

### NOT covered — proprietary, all rights reserved

| Path | What it is |
|---|---|
| `db/seeds/0005_materials_ldpe_hdpe.sql` | **Mixed file — see the defect below.** Contains 109 curated property-value and citation inserts alongside 26 structural inserts |
| `curation/*.csv` | Working citation data — `ldpe.csv`, `sources.csv` |
| `src/data/polymersData.ts` | The legacy prototype dataset |
| `docs/` (prose guides) | Written content |
| `assets/`, `public/`, `design/` | Brand and visual identity |
| Any future export, dump, or fixture containing curated values | The database in another shape |

### Known defect, must be fixed before the code licence is advertised

`db/seeds/0005_materials_ldpe_hdpe.sql` **mixes both layers in one file** — 26
structural inserts and 109 curated value and citation inserts. A file cannot be
half AGPL. Split it into a structural seed (AGPL) and a data seed
(proprietary), or move the data seed out of the licensed tree entirely.

Until that split lands, treat the whole file as proprietary. This is tracked as a
prerequisite, not a nice-to-have: the licence boundary is only as clear as the
file boundary.

---

## 4. What is already public, and what that means

The repository at `github.com/Javaherianamj/polymer-encyclopedia` is **public**,
and has been for some time. Until now it carried **no licence file at all**.

Two consequences, and the first is better news than it sounds:

1. **No rights have been granted away.** Publishing source without a licence is
   "all rights reserved" by default. GitHub's terms let others view and fork
   *within GitHub*; they do not grant redistribution, commercial use, or
   database rights. The historical commits are therefore more restrictive than
   the AGPL, not less.

2. **Adding any code licence without the scope limitation in §3 would be the actual
   giveaway.** It would license the seed data, permanently and irrevocably, to
   everyone who has ever cloned the repository. This is why `LICENSE` ships
   alongside `NOTICE` and this document, and why §3 is not optional prose.

Separately, and worth saying plainly: **anything in a public repository can be
copied whether or not it is lawful to do so.** Licensing decides what is
permitted and what is actionable. It does not decide what is possible. If the
curated database is to remain the project's primary asset, it should eventually
live outside the public tree — served through the API, not committed to git.

Note also that decision D10 ("no publish until FE-9 complete") governs the
**site**. It has never governed the repository. The data has been publicly
readable throughout.

---

## 5. What the database claim actually rests on

Overclaiming here would make the whole set of documents less credible, so state
it accurately:

- **Individual facts are not owned.** The glass-transition temperature of LDPE is
  a physical constant. Polypedia does not own it and does not claim to.
- **The compilation is owned.** What is protectable is the selection,
  verification, arrangement, normalisation and citation of those values — the
  editorial work that turns scattered handbook entries into a coherent, sourced
  dataset. That work is substantial, original, and is the asset.
- **Iran provides no *sui generis* database right.** Unlike the EU, there is no
  standalone database right to lean on. The claim therefore rests on three
  things together: copyright in the compilation, **contract** (the Terms of
  Service, which is why acceptable-use terms matter more here than they would
  elsewhere), and confidentiality for anything not published.
- **Scientific content is straightforwardly copyrighted** — prose, illustrations
  and explanations are original works and need no special theory.

Practically, enforcement rests on four layers, in descending order of
effectiveness: **licensing terms for commercial users who want to be compliant**;
**technical measures** (rate limits, authentication, `robots.txt`); **contract**;
and **litigation**, which is realistic domestically and largely theoretical
against a foreign scraper. Documents should be written for the first layer — the
company that wants to pay and needs to know how.

---

## 6. Conventions for every document here

Anyone writing or amending a document in this directory follows these:

1. **Open with the DRAFT / not-legal-advice banner** used at the top of this file.
2. **Never mix the six layers.** If a document must mention another layer, link
   to that layer's document rather than restating its terms — a restatement will
   drift and then the two will conflict.
3. **No generic placeholder text.** No "Company Name", no "[Insert jurisdiction]",
   no lorem clauses. Every clause must be true of *this* platform: a
   Persian-language, citation-first polymer reference, currently holding two
   materials and 109 property values at 11% citation coverage, not yet deployed,
   with no user accounts.
4. **Do not describe features that do not exist as though they do.** There are no
   accounts, no payments, no analytics and no public API today. Write those
   clauses in the conditional — "where accounts are offered" — and say plainly
   what the current state is.
5. **Governing law**: Islamic Republic of Iran. Mark it `[COUNSEL: confirm]`,
   and note the practical limits of enforcement against parties abroad.
6. **Contact**: `legal@polycyclopedia.ir`. This mailbox **does not exist yet** —
   it depends on U11c. Any document that names it must footnote that.
7. **Cross-reference by relative path**, so the set stays navigable both in the
   repository and when rendered on the site.
8. **Keep the Persian brand name** پلی‌پدیا intact wherever it appears.
9. **Date every document** and carry a version line, because these will change.

---

## 7. Related project documentation

| Document | Relevance |
|---|---|
| [`/README.md`](../../README.md) | Project overview and the deployment runbook |
| [deployment-requirements.md](../../aidlc-docs/inception/requirements/deployment-requirements.md) | FR-D and NFR-D requirements, including what must be served at launch |
| [SOURCING-GUIDE.md](../SOURCING-GUIDE.md) | Where data may legitimately be obtained, and what must not be scraped — the inbound counterpart to these outbound policies |
| [frontend-plan.md](../../aidlc-docs/inception/plans/frontend-plan.md) | D5: citation metadata only, no verbatim source text, no scans |

**The symmetry in that third row is deliberate and worth preserving.** Polypedia
asks others not to scrape it. `SOURCING-GUIDE.md` is the rule that Polypedia does
not scrape others. If the inbound discipline ever slips, the outbound policy
becomes indefensible.
