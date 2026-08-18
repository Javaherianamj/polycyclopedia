# Contributing to Polypedia

Thank you for wanting to help. Please read this before opening a pull request —
Polypedia's licensing is split, and the split affects what you contribute and
how.

## The one-minute version

- **Code** is licensed under the [GNU AGPL v3.0](LICENSE).
- **The curated database and scientific content are not.** They are
  proprietary — see [`db/LICENSE`](db/LICENSE) and [`NOTICE`](NOTICE).
- Every contribution requires signing the
  [Contributor Licence Agreement](docs/legal/CONTRIBUTOR_LICENSE_AGREEMENT.md).
- Sign off every commit: `git commit -s`.

## Why there is a CLA

Polypedia is dual-licensed: the code is AGPL for everyone, and a commercial
licence without the AGPL's source-disclosure obligation is sold to
organisations that need one. Selling that exception requires holding the rights
to the whole work.

If contributions arrived with no agreement, each contributor would retain
copyright in their own patch, and Polypedia could no longer license the
combined work commercially without tracking down every one of them. The CLA
exists to keep that door open. It does not take your rights away — you keep
copyright in what you wrote; you grant Polypedia the right to license it.

Read it in full before signing: [`docs/legal/CONTRIBUTOR_LICENSE_AGREEMENT.md`](docs/legal/CONTRIBUTOR_LICENSE_AGREEMENT.md).

## Sign-off

Every commit must carry a `Signed-off-by` line, which you add with:

```bash
git commit -s -m "your message"
```

This is the [Developer Certificate of Origin](https://developercertificate.org/):
you are stating that you wrote the change, or have the right to submit it under
the project's licence. It is a statement about provenance, and it is separate
from the CLA — you need both.

## Contributing DATA is different from contributing CODE

This is the part people get wrong, so it is spelled out.

**Do not paste property values, citations or scientific prose into a pull
request** unless you have read [`docs/legal/database-license.md`](docs/legal/database-license.md)
and the [AI usage policy](docs/legal/ai-usage-policy.md).

Data contributions are governed by a different section of the CLA than code,
because they enter a proprietary compilation rather than an AGPL codebase. In
particular:

- **Every value needs a real, checkable source** — a document and a page, not
  "a datasheet I saw". The `citation_locator_present_chk` constraint in the
  schema enforces this, and it is the single most important rule in the
  project.
- **Never transcribe a substantial portion of any single handbook, standard or
  supplier datasheet.** Individual numbers are facts; a systematically copied
  table is someone else's compilation, and in the EU it is protected by the
  database right regardless of the factual contents.
- **Never submit a value produced by a language model that you have not
  verified against the source document yourself.** A plausible-looking number
  with a fabricated citation is worse than no number, and it is the failure
  mode this project is built to prevent.

If you are not sure whether something you want to add is safe to add, ask
first: legal@polycyclopedia.ir

## Before you open a pull request

```bash
cd web && npx vitest run && npx astro check
cd api && npm test
python3 -m pytest tools/curation/tests/
```

Match the surrounding code: this repo documents *why* in file headers, not just
*what*. If you change a design decision, update the header that records it —
a stale header is treated as a defect here, not as a comment.
