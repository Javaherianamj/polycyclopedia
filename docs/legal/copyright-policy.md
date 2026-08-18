# Polypedia — Copyright Policy (Scientific Content)

> **Status: DRAFT. Not reviewed by a qualified lawyer.**
> This document was drafted to reflect the project's actual architecture and
> product decisions, not from a template. It is not legal advice and is not
> enforceable as written. Before the site is published, it needs review by a
> lawyer qualified in the relevant jurisdiction.

This document covers layer 3 of [the licensing overview](README.md):
scientific content — the written prose, material overviews, learning material,
explanations, illustrations and diagrams that make up Polypedia. It does not
cover the curated database of property values and citations (layer 2 — see
[database-license.md](database-license.md)) or the source code (layer 1 —
AGPL-3.0, see [`/LICENSE`](../../LICENSE)).

---

## 1. Read freely

Polypedia exists to make polymer science legible in Persian. **Reading it,
learning from it, and pointing other people to it is exactly what it is for,**
and nothing in this document is meant to discourage that. If you are a student,
an engineer, a teacher, or simply curious, use the site the way it was built to
be used.

This policy exists to protect the editorial work behind the content — the
writing, the verification, the explanations that turn scattered technical
literature into something a Persian-speaking reader can actually follow — not
to restrict reading it.

---

## 2. Citing Polypedia is encouraged

If Polypedia's explanations, overviews, or figures are useful in your own
work — a report, a thesis, a course assignment, an article — **citing the
source is welcomed, not merely tolerated.** A citation is also how you protect
yourself: it is the difference between referencing a source and reproducing one
without attribution.

A reasonable citation format:

> پلی‌پدیا (Polypedia). "[صفحه یا موضوع مورد استفاده / page or topic used]."
> دسترسی در [تاریخ / date accessed]. https://polycyclopedia.ir/[path]

Or in an English-language academic style:

> Polypedia. "[Page title]." Accessed [date]. https://polycyclopedia.ir/[path].

Cite the specific page or material you used, not the site generally, the same
way you would cite a specific chapter of a handbook rather than the handbook's
publisher.

---

## 3. What is not permitted

Without permission, the following are not allowed:

- **Unauthorised copying of substantial content** — see §4 for what
  "substantial" means in practice
- **Database extraction** — systematically pulling content page by page, field
  by field, whether by hand or by automated tooling, to reconstruct the
  underlying material outside Polypedia
- **Republication** — posting Polypedia's written explanations, overviews, or
  illustrations on another site or in another publication, attributed or not
- **Commercial redistribution** — selling, bundling, or otherwise
  commercialising Polypedia's content, or a derivative of it, as part of a
  product or service

None of this is about ordinary reading, quoting, or citing. It is about taking
the content itself and putting it somewhere else.

---

## 4. What counts as "substantial"

A rule with no worked examples is not a usable rule, so here is the practical
version.

**Almost certainly fine:**
- Quoting a sentence or two from a material overview in your own writing, with
  attribution
- Copying a single property value with its citation into your own notes or
  report — that value is a fact, and facts are not owned (see
  [database-license.md](database-license.md) for the full reasoning)
- Screenshotting one page to illustrate a point in a presentation or a review,
  with attribution
- Paraphrasing an explanation in your own words for your own material

**Almost certainly not fine:**
- Copying a full material page — overview, explanation and figures together —
  onto another site or into another document, even with attribution
- Scripting a crawl of multiple pages to assemble a local copy of Polypedia's
  written content
- Copying enough pages, or enough of one page, that someone reading the copy no
  longer has a reason to visit Polypedia itself

The test that sits behind both lists: **would this substitute for a visit to
Polypedia, for the person reading your copy?** A citation and a quoted line
sends a reader here. A reproduced page does not need to.

If a specific use sits between these two lists, ask — see §6.

---

## 5. Classroom, thesis and academic use

This is common enough, and useful enough, that it should not require asking
first. All of the following are fine:

- **Classroom use** — projecting, printing, or distributing a Polypedia page or
  figure to a class, with attribution
- **Thesis and coursework use** — citing Polypedia as a source, quoting a
  passage with attribution, or reproducing a single figure with attribution and
  a citation
- **Academic and research use generally** — referencing the project or its
  content in a paper, so long as it is cited rather than presented as the
  paper's own original material

What this does not cover: building a derivative reference work, dataset, or
publication substantially out of Polypedia's content and presenting it as your
own compilation. That is republication under a different name, and §3 still
applies.

---

## 6. Requesting permission for more

For anything beyond §§2, 4 and 5 — bulk use, republication, commercial use, or
anything you are unsure falls inside "substantial" — email
legal@polycyclopedia.ir<sup>†</sup> with what you want to use, how, and for what
purpose. Academic and non-commercial requests in good faith are the easy case;
say so plainly in the request.

---

## 7. Polypedia holds itself to the same standard

The inbound counterpart to this policy is
[`../SOURCING-GUIDE.md`](../SOURCING-GUIDE.md), which governs how Polypedia's
own curators gather data. It is not incidental that the two documents mirror
each other: **Polypedia stores citation metadata only** — the work, edition and
page a value came from — **never verbatim source text and never page scans**
(decision D5). The database records where a value can be verified; it does not
reproduce the page it was verified on.

Asking others not to copy Polypedia's content while copying other people's
content would be indefensible. The project's data-gathering discipline is
written to be exactly as strict as this policy asks readers to be, and that
symmetry is deliberate.

---

## 8. Governing law

This policy is governed by the laws of the Islamic Republic of Iran
`[COUNSEL: confirm]`. Enforcement against domestic reuse is realistic;
enforcement against reuse originating abroad is, practically, far more
limited and would depend on the specific jurisdiction involved.

---

**Version**: 1.0 — 2026-08-04

<sup>†</sup> This mailbox does not exist yet; it depends on the deployment work
tracked as U11c.
