# Polypedia — Branding and Trademark Policy

> **Status: DRAFT. Not reviewed by a qualified lawyer.**
> This document was drafted to reflect the project's actual architecture and
> product decisions, not from a template. It is not legal advice and is not
> enforceable as written. Before the site is published, it needs review by a
> lawyer qualified in the relevant jurisdiction.

This document covers layers 5 and 6 of [the licensing overview](README.md):
branding and trademark. See that document for how these two layers relate to
the other four — most importantly the source code, which is licensed
separately and much more permissively.

---

## 1. The brand is not open source

**The Polypedia source code is AGPL-3.0. The Polypedia brand is not.** These
are two different decisions, made for two different reasons, and the entire
purpose of this document is to keep them from being confused.

The AGPL gives anyone the right to take the code, modify it, run it, and
redistribute it — including commercially — provided they pass the same
freedoms on, and provided that if they run a modified version as a network
service they offer its users the corresponding source. That grant is
deliberate and stands. It says nothing about whether a modified copy may call
itself "Polypedia," use the logo, or otherwise present itself as the Polypedia
project. It may not, absent written permission. A code licence and an open
brand are different things, and open source projects that don't separate them
tend to regret it — a low-quality fork trading on the original's name is a reputational
problem, not a licensing one, and the licence is the only tool available to
prevent it.

---

## 2. What is proprietary

All rights reserved, regardless of what the code licence permits elsewhere in
this repository:

- The **Polypedia** name and the **پلی‌پدیا** name
- The logo
- The wordmark (see §5)
- Icons
- Visual identity generally, including the colour palette
- The UI/UX identity — the distinctive look, feel and interaction patterns of
  the product, as opposed to the code that implements them
- Illustrations
- Brand assets of any kind
- The official domains
- Marketing materials

None of these are licensed under the AGPL, and none are made available by
implication through access to the source code. See [`/NOTICE`](../../NOTICE)
for the file-level statement of this boundary.

---

## 3. Forking

A fork of this repository is lawful, useful, and welcome. The AGPL means
exactly that — on the AGPL's terms, which travel with the fork.

**A fork gets the code and nothing else.** It grants no right to the
Polypedia name, the پلی‌پدیا name, the logo, icons, the visual identity, the
trademark, or any other official branding. A fork that keeps any of these is
not exercising the code licence — it is doing something the code licence does
not cover.

**Forks must remove all Polypedia branding**, unless explicit written
permission has been granted. Concretely, as of this writing, that means at
least the following:

| What | Where |
|---|---|
| Page title and meta text | `index.html` — currently `Polypedia \| دایرةالمعارف تخصصی پلیمرها` |
| App metadata | `metadata.json` — the `name` and `description` fields |
| The logo file | `public/logo.svg` |
| The wordmark and any animated rendering of it | wherever the component implementing the spec in `aidlc-docs/construction/fe-0/wordmark-animation-spec.md` is used |
| Brand references in UI components | e.g. `src/components/Navbar.tsx`, `src/components/ResourcesModal.tsx`, and any other component that renders the name, wordmark or logo |
| The `design/` directory | visual design source files |
| Any domain configuration | do not deploy a fork to `polycyclopedia.ir` or any Polypedia-controlled domain, and do not register a confusingly similar domain to present a fork as the original |
| Persian-language occurrences | پلی‌پدیا appears wherever the English name does; both must go, not just one |

This list is a starting point, not a substitute for actually searching the
tree — `grep -ri "polypedia"` and its Persian equivalent, applied to whatever
has been added or changed since this document was written, is the reliable
check. A fork that has replaced the name in the README but left it in the page
`<title>` has not removed the branding.

What forking does **not** require: renaming variables, database tables,
internal identifiers, or anything else that is implementation rather than
brand presentation. The dividing line is what a user or reader would see or
recognise as identifying the project, not what a developer would see in the
source.

---

## 4. Permitted uses — no permission needed

The following are fine without asking, and this section means what it says:

- **Writing about Polypedia** — reviews, articles, course material, comparisons,
  criticism
- **Linking to Polypedia** — from any site, for any non-deceptive purpose
- **Citing Polypedia** — as a source, per [the copyright policy](copyright-policy.md)
- **Press coverage** — using the name and a reasonable, accurate description of
  what the project is
- **Academic use** — referencing the project, its data, or its platform in
  papers, theses, or coursework, including using the name and a screenshot
  where illustrative

This is nominative use: using the name to refer to the actual thing, not to
imply sponsorship, affiliation, or origin from Polypedia. A press article that
says "Polypedia, a Persian-language polymer reference, ..." needs no
permission. A competing product that calls itself "Polypedia Pro" or reuses the
logo to suggest it is an official Polypedia offering does need permission,
because that use has moved from referring to the project to impersonating it.

---

## 5. The wordmark

The wordmark is a proprietary design asset. Its structure, motion and rationale
are specified in
[`aidlc-docs/construction/fe-0/wordmark-animation-spec.md`](../../aidlc-docs/construction/fe-0/wordmark-animation-spec.md);
that specification is not restated here. Use of the wordmark, animated or
static, is governed by this document — it is part of the visual identity listed
in §2, not a separately licensed asset.

---

## 6. Trademark status

The Polypedia and پلی‌پدیا marks are currently **unregistered**. They are
nonetheless proprietary: unregistered use in commerce still creates rights in
many jurisdictions, and this document treats both marks as belonging to the
project regardless of registration status.

**Formal trademark registration may be pursued as the project grows.**
Registration, when and if it happens, will not change the substance of this
policy — it changes the strength of the remedies available if the policy is
violated.

---

## 7. The founding academic partner acknowledgement

Per [the licensing overview §2](README.md#2-project-identity), the project
began in collaboration with the **Scientific Association of Polymer
Engineering**, credited as the academic partner. That credit is
exactly that — a credit, not a co-brand.

**What the Association's mark may be used for**: appearing, by the
Association's own name and mark, in the approved acknowledgement wording set
out in the licensing overview, and within any section of the platform that the
Association's own content occupies.

**What it may not be used for**: implying that the Association owns, operates,
or is responsible for Polypedia generally; implying the Association's
endorsement of Polypedia's commercial offerings, the database, or the API;
appearing on Polypedia-branded materials in a way that suggests joint
ownership; or being combined with the Polypedia logo or wordmark to create a
merged identity. The Association is an academic collaborator credited for a
real contribution, not a co-branding partner, and this document treats that
distinction as binding on both directions — Polypedia does not present itself
as the Association's platform, and does not present the Association as
Polypedia's co-owner.

---

## 8. Governing law

This policy is governed by the laws of the Islamic Republic of Iran
`[COUNSEL: confirm]`. As with the rest of the project's legal documents,
enforcement against a domestic infringer is realistic; enforcement against a
fork or infringing use hosted abroad is, practically, far more limited and
would depend on the specific jurisdiction involved.

---

**Version**: 1.0 — 2026-08-04

For anything not covered here, see [the licensing overview](README.md), or
contact legal@polycyclopedia.ir.<sup>†</sup>

<sup>†</sup> This mailbox does not exist yet; it depends on the deployment work
tracked as U11c.
