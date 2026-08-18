# Polypedia — Privacy Policy

> **Status: DRAFT. Not reviewed by a qualified lawyer.**
> This document describes what Polypedia actually collects today, and is
> written to stay accurate as the platform grows rather than to describe a
> product that does not yet exist. It is not legal advice and is not yet
> enforceable as a binding policy. See [`README.md`](README.md) for how this
> document relates to the other five layers of Polypedia's legal
> documentation.

**Version**: 0.1 · **Last updated**: 2026-08-04

---

## 1. The short version

Polypedia, today, is a static website. There are no user accounts, no
payments, no analytics, and no third-party trackers or advertising anywhere on
the site. The only thing stored on your device is a single, non-tracking
preference. That is a genuine, deliberate feature of the current
architecture, not an oversight — and this policy says so plainly rather than
padding itself out with clauses that don't yet apply.

Everything below is organised into **what happens today** and **what would
happen if a feature that doesn't exist yet is added**. The second kind of
clause is written in the conditional and is clearly marked. Nothing in this
document should be read as implying that accounts, analytics, or an API
already exist — they do not.

---

## 2. What is collected today

### 2.1 Information you provide

None. There is no account creation, no sign-in, no contact form, no comment
system, and no newsletter sign-up on the site itself. Browsing and reading
Polypedia requires giving us nothing.

### 2.2 Information stored on your device

The site stores exactly one thing in your browser's `localStorage`: your
**light/dark theme preference**. It:

- stays on your device,
- is never transmitted to any server,
- is not a cookie, is not used for tracking or identification, and is not
  linked to any other data, and
- can be cleared at any time by clearing your browser's site data for
  `polycyclopedia.ir`.

No other cookies, local storage entries, or device identifiers are set by
Polypedia.

### 2.3 Information collected by our hosting provider

The site is served from **ArvanCloud** (object storage behind ArvanCloud's
CDN), an Iranian infrastructure provider. Like effectively every web host and
CDN, ArvanCloud's edge and storage layers process standard **access logs** for
every request — this is infrastructure-level logging, not something Polypedia
configures or opts into:

- IP address,
- user agent (browser and operating system string),
- the URL requested, and
- timestamp and response status.

ArvanCloud processes this data **as a processor acting on Polypedia's
instructions**, for operating and securing the infrastructure (serving pages,
caching, DDoS protection). Polypedia does not separately collect, aggregate,
or analyse these logs. They exist because ArvanCloud's platform generates
them, not because Polypedia built anything to use them.

### 2.4 What is not collected

To be concrete about the absence, since an empty list is easy to read as
carelessness rather than a choice:

- No analytics of any kind (no Google Analytics, no self-hosted analytics, no
  pixel trackers) — none has been chosen or deployed.
- No advertising, no ad networks, no ad identifiers.
- No third-party embeds that load external scripts or fonts.
- No fingerprinting.
- No location data.
- No data is sold, rented, or shared with third parties for their own
  purposes.

---

## 3. If these arrive: conditional clauses

The sections below describe how Polypedia **would** handle data if the
corresponding feature is built. They exist so this document does not need a
rewrite the day one of these ships — only an update to say it has shipped.
None of the following is currently true.

### 3.1 If user accounts are introduced

Where accounts are offered, Polypedia would collect the minimum needed to
operate one — at minimum an email address and authentication credentials
(stored hashed, never in plain text) — and would update this policy, in this
section, to state exactly what is collected, why, and for how long, before
accounts go live.

### 3.2 If analytics are introduced

Where an analytics tool is adopted, this section would name the specific tool,
state what it collects, whether it is self-hosted or third-party, and whether
it is cookie-based or cookie-free, before it is switched on. The intent, not
yet committed to a specific vendor, is to prefer privacy-respecting,
aggregate, non-cross-site-tracking analytics if and when this is built.

### 3.3 If a public API with API keys is introduced

`deployment-requirements.md` (FR-D18–FR-D21) specifies a read-only,
unauthenticated public API for site data, with no accounts and no write
access — nothing there requires collecting personal data. If a future,
separate tier requires registration (for example, a rate-limited or
commercial API key), this section would be updated to describe what
registration data is collected and how API usage is logged, before that tier
launches.

### 3.4 If payments are introduced

Where a paid product (for example, commercial API or data licensing under
[`api-terms.md`](api-terms.md)) is introduced, payment details would be
handled by a third-party payment processor and would never be stored on
Polypedia's own infrastructure. This section would then name the processor.

---

## 4. Who processes data, and where it is stored

| Party | Role | What it processes | Location |
| --- | --- | --- | --- |
| Polypedia | Controller | Determines why and how data is processed | Iran |
| ArvanCloud | Processor | Object storage, CDN, access logs (§2.3) | Iran |

At present, no other third party receives any data on Polypedia's behalf.
Where this changes — a mail provider for `@polycyclopedia.ir` addresses (see
`deployment-requirements.md` FR-D6), an analytics vendor, a payment
processor — that party and its role would be added to this table before it
begins processing anything.

---

## 5. Retention

- **Theme preference (§2.2)**: retained on your device only, until you clear
  it. Polypedia has no copy.
- **Access logs (§2.3)**: retained by ArvanCloud per its own operational and
  security-log retention practice. Polypedia does not separately export,
  aggregate, or retain these logs beyond what ArvanCloud's platform holds.

Where accounts, analytics, or other data collection are introduced, this
section would state a specific retention period for each new data category.

---

## 6. What Polypedia never does

Regardless of what is added under §3, the following commitments hold:

- **No sale of personal data.** Personal data is never sold, rented, or
  traded.
- **No advertising profiles.** Polypedia does not build behavioural or
  advertising profiles of visitors, and does not permit third parties to do so
  through the site.
- **No data broker relationships.**

---

## 7. Your rights

Because Polypedia collects essentially no personal data today (§2), there is
little to request access to, correct, or delete beyond the ArvanCloud access
logs described in §2.3, which Polypedia does not itself hold a copy of.

Where accounts or other personal-data collection are introduced (§3), this
section would be expanded to state, concretely, how to request access to,
correction of, export of, or deletion of your data.

In the meantime, questions or requests can be sent to
**legal@polycyclopedia.ir**.[^1]

[^1]: This mailbox does not exist yet — it depends on mail service being
    configured for the domain (`deployment-requirements.md`, U11c/FR-D6).
    Until it exists, requests have no working channel; check
    [`README.md`](../../README.md) for the project's current contact point.

---

## 8. Children

Polypedia is a general scientific reference and is not directed at children.
It does not knowingly collect personal data from anyone, of any age — see §2.
If accounts are introduced (§3.1), this section would state an age policy
before account creation goes live.

---

## 9. Changes to this policy

This policy is versioned (top of document) and dated at every change. Material
changes — in particular, the introduction of any feature described
conditionally in §3 — will be reflected here with an updated version and date
at the point that feature ships, not after.

---

## 10. Governing law

This policy is governed by the laws of the Islamic Republic of Iran.
`[COUNSEL: confirm]` — including how Iranian data-protection rules, and any
cross-border considerations arising from ArvanCloud's Iranian infrastructure,
apply here.

---

## 11. Contact

**legal@polycyclopedia.ir**[^1] for any question about this policy.

---

## Related documents

- [`README.md`](README.md) — how this document fits with the other five legal
  layers
- [`api-terms.md`](api-terms.md) — terms for API access, referenced in §3.3–3.4
- [`../../aidlc-docs/inception/requirements/deployment-requirements.md`](../../aidlc-docs/inception/requirements/deployment-requirements.md) — the hosting architecture this policy describes
