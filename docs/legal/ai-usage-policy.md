# Polypedia AI usage policy

> **Status: DRAFT. Not reviewed by a qualified lawyer.**
> This document was drafted to reflect the project's actual architecture and
> product decisions, not from a template. It is not legal advice, and it is
> not enforceable as written until a lawyer qualified in the relevant
> jurisdiction has reviewed it. See [`README.md`](README.md) for the full
> picture of how this document fits alongside the others.

---

## 1. Scope

This document sets out what automated and AI-related uses of Polypedia's
database and scientific content are permitted, and what require explicit
written permission. It is the AI-specific counterpart to
[database-license.md](database-license.md), which governs the database
generally, and to [copyright-policy.md](copyright-policy.md), which governs
the written scientific content. Where this document and either of those
overlap, the more specific rule here controls for AI and automated-extraction
questions.

---

## 2. Prohibited without written permission

The following require a signed agreement or other explicit written
permission from Polypedia before they may be performed against any part of
Polypedia's database or scientific content:

- **AI training** — using the content, in whole or in part, to train,
  fine-tune, distil, or otherwise improve a machine learning model
- **LLM training** — the same, specifically for large language models,
  including instruction-tuning and reinforcement learning from the content
- **Foundation-model training** — inclusion in a pretraining corpus for a
  general-purpose model, whether the inclusion is direct or through a
  third-party dataset that itself scraped Polypedia
- **Embeddings generation** — computing vector embeddings of Polypedia pages,
  values, or text for any downstream storage or retrieval purpose
- **Vector database creation** — indexing Polypedia content into a vector
  store, whether for internal use or as a product
- **RAG dataset generation** — assembling Polypedia content into a corpus
  intended to be retrieved and injected into a language model's context at
  inference time
- **Automated extraction of any kind** — any script, crawler, agent, or
  scheduled job that systematically reads Polypedia pages or API responses
  and stores the extracted values, beyond what a browser needs to render a
  single page for a single human reader

This list follows directly from
[database-license.md §3](database-license.md#3-what-requires-explicit-written-permission)
and does not loosen or narrow it. It exists to spell out the AI-specific
cases explicitly, because "may I scrape this" and "may I put this in a RAG
pipeline" are, in substance, the same question with different tooling.

---

## 3. Polypedia's own use of its own data

**Polypedia retains the right to use its own database and content to build
and operate Polypedia's own AI systems.** This is not a special exemption
requiring justification — it follows from ownership of the compilation
described in
[database-license.md §5](database-license.md#5-what-the-ownership-claim-rests-on).
If and when Polypedia builds a model, an assistant, a search ranker, or any
other AI system on top of its own curated data, that use is not governed by
the restrictions in [section 2](#2-prohibited-without-written-permission) —
those restrictions apply to third parties.

No such system exists today. This section states the position plainly so it
does not need to be revisited each time one is built.

---

## 4. Requesting permission

Uses in [section 2](#2-prohibited-without-written-permission) may be
permitted on a case-by-case basis. To request permission, contact
`legal@polycyclopedia.ir`.[^contact]

**Research and academic requests are considered.** A university lab, a
graduate student, or a research group with a legitimate, non-commercial
research use — including training or evaluating a model as part of a
published study — should write in and describe the intended use, scope, and
publication plans. Consideration does not mean automatic approval: Polypedia
may ask for attribution terms, may limit the scope of data released, or may
decline, but a research framing is a reason to ask rather than a licence to
proceed without asking.

[^contact]: This mailbox does not exist yet. It depends on U11c and will be
    live before this document is treated as binding.

---

## 5. Technical measures

This policy is backed, or will be backed, by technical controls:

- **`robots.txt`**, directing well-behaved crawlers on what may and may not
  be automatically fetched
- **AI-crawler directives**, specifically naming known AI-training crawlers
  and declining them
- **Rate limits**, on any API surface, to make bulk extraction impractical
  even for a crawler that ignores `robots.txt`
- **Authentication**, where an endpoint's sensitivity warrants it, once
  accounts exist

None of these exist yet — there is no public API, no rate limiting
infrastructure, and no account system today. They are described here as the
intended technical layer of enforcement, to be built alongside the products
that need them.

**Honestly stated: these are signals and controls, not guarantees.**
`robots.txt` and named AI-crawler directives are requests that a compliant
crawler chooses to honour; they stop nothing on their own. Rate limits and
authentication raise the cost of automated extraction but do not make it
impossible. As set out in
[database-license.md §5](database-license.md#5-what-the-ownership-claim-rests-on),
the layers that actually do the work, in order of effectiveness, are
licensing terms for commercial actors who want to be compliant, these
technical measures, contract, and — realistically, only domestically —
litigation. A determined, foreign, non-compliant scraper is not stopped by
any of them; it is a known limitation, not a claim being made falsely here.

---

## 6. How this interacts with citation

**Quoting a value with attribution is fine. Ingesting the corpus is not.**

Nothing in this document restricts the ordinary, intended use described in
[database-license.md §2](database-license.md#2-what-is-permitted): reading a
value, and citing it — including a person using an AI assistant to look up a
single property and asking it to quote that value with a citation back to
Polypedia, the way they might ask it to quote a citation from any other
reference work.

What this document restricts is the corpus-level operation: pointing a
crawler, an embedding pipeline, or a training job at Polypedia and having it
consume the database or content as a dataset, whether the output is a model,
a vector index, or a retrieval corpus. The line is the same one drawn in
[database-license.md §3](database-license.md#3-what-requires-explicit-written-permission) —
a citation of the individual value is welcome; a systematic reconstruction of
the compilation is not.

---

## 7. Governing law

This document is governed by the law of the Islamic Republic of Iran.
`[COUNSEL: confirm]`

As with [database-license.md](database-license.md), enforcement against a
party operating outside Iran is limited in practice to the effectiveness of
the technical and contractual measures described above; litigation abroad is
largely theoretical for a project at this stage.

---

*Version 0.1 — drafted 2026-08-04.*
