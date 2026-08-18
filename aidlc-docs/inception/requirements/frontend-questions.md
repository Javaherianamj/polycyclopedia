# Frontend Rebuild — Clarification Questions

Answer after each `[Answer]:` tag. Free text is fine; option letters are just
shortcuts. Anything left blank will be resolved with the default noted in
brackets and recorded as an assumption. Wherever "X) Other" is offered, write
your own answer as free text after the tag.

---

## Question 1

Who is the **primary** user the site must serve, when their needs conflict?

A) University students learning polymer science (the simulators and the quiz are the point)

B) Practising engineers looking up a specific number fast (the datasheet is the point)

C) Procurement / specification buyers choosing between materials and producers (compare and Iranian-manufacturer data are the point)

D) Researchers who need the citation itself, not the number (provenance is the point)

E) All four equally — the site must not favour one

X) Other

[Answer]:
E- and each must have their way to achive their need. as it is we have datasheet in one topic of each entry, learning tools in other! so they can choose wehre to go. also we will add a searching tool to site like the comparison one--> that is the engine everything is held on!
---

## Question 2

The prototype puts a **reference datasheet** and a **teaching lab** (12 simulators,
3D viewer, quiz) on the same page. These want opposite layouts: lookup wants
dense and scannable, teaching wants linear and playful. How should the rebuild
resolve this?

A) Keep them merged as today — tabs inside one material page

B) Split: a "datasheet" surface for values, and a separate "Learn / Lab" surface for the interactive tools, cross-linked

C) Datasheet is the product; simulators become secondary, collapsed by default

D) Lab is the product; the datasheet becomes a reference panel inside it

X) Other

[Answer]: B

---

## Question 3

Today **every one of the 109 seeded values is `unsourced`** and both materials are
`draft`. What does the public site show while the citation campaign is running?

A) Show everything, with an honest per-value marker — most of the site will read "unsourced" for months

B) Show only `published` materials — meaning the site is empty until the first material is fully cited

C) Show everything, but put a prominent per-material coverage indicator ("12% sourced") so the reader calibrates

D) Show sourced values normally and hide unsourced ones inside a "show uncited data" toggle, off by default

X) Other

[Answer]:
C and D. we show sources on hover, for the ones without source it should say source not added or...
---

## Question 4

How **visible** should provenance be on a value, in the default view?

A) Invisible until asked — a small superscript marker that opens a popover with source + page

B) Always visible — a source name or icon rendered next to every value

C) A per-section status strip (e.g. "Thermal: 8/9 values sourced") plus per-value detail on demand

D) A dedicated "Sources" tab per material listing every value → source mapping

X) Other

[Answer]:
C and D. a sources list is on the home page, a sources list is also for every entry which is like a csv of data with their source. also no demand they can hover and see the source in the datasheet page-->A, decide wether marker is better or hover.since we need one for sources and one for explaining what that propertie is and explaining it.
---

## Question 5

**Snippet policy** (open decision #3 in `project-plan.md`, now blocking the citation
popover design). How much of the source may the site show?

A) Citation metadata only — book, edition, page. No source text at all

B) Metadata plus a short quoted line (< ~25 words) from the cited page

C) Metadata plus a scanned/cropped image of the cited table or line

D) Undecided — design the popover so any of these can be switched on later

X) Other

[Answer]: A

---

## Question 6

The stated headline feature (U7) is **property-first search** — "Tg > 100 AND
tensile 40–80". The current site has no place for it: everything starts with
"pick a polymer". Where does it belong?

A) It _is_ the homepage — a search/filter surface first, catalog second

B) Co-equal — homepage offers both "browse families" and "find by properties"

C) A separate page reachable from the nav; browsing stays the front door

D) Later — browse and datasheet first, search after citation coverage is real

X) Other

[Answer]: B

---

## Question 7

How will people **find** the site? This decides rendering strategy (a client-side
SPA with hash routes is close to invisible to search engines).

A) Search engines matter a lot — Persian polymer queries should land on our material pages (implies real URLs + server-rendered or pre-rendered pages)

B) Mostly direct/word-of-mouth inside the association and universities — SEO is a nice-to-have

C) Unknown / not thought about yet

X) Other

[Answer]:
B-->ihave not thought about seo but it is in our vision, secondary(we had 1000 requests on claudeflare in 2 week when we published the prototype(this was the second prototype and the first one was aweful)
---

## Question 8

**Device priority.** The current datasheet is a dense desktop layout with wide
tables and 3D canvases.

A) Mobile-first — most Iranian users are on phones; desktop is the enhancement

B) Desktop-first — this is a workbench tool used at a desk

C) True dual — dense desktop layout and a genuinely different mobile layout, both designed

X) Other

[Answer]:
C- first impresion of most users is on mobile(telegram add) and as a searchable datasheet later serious uses might be on descktop so both matter a lot(and both are a bit worked on in prototype)
---

## Question 9

**What happens to the current UI?** You said "keep it as a prototype".

A) Freeze it as a reference; build the new frontend fresh alongside it, switch over when ready

B) Refactor in place, screen by screen, behind the API — the site never stops working

C) Keep it live as-is at a "classic" URL while the new one is built

X) Other

[Answer]: A

---

## Question 10

**Delivery order.** What do you want working first?

A) Same site, real data — swap the 6 bundled polymers for the API, change nothing visually (U3). Fastest proof, no new design

B) New design system + rebuilt catalog and datasheet, then everything else

C) Citation UI first — make the provenance visible even on a rough layout, because that is the product thesis

D) Property search first — the differentiator, even if the rest still looks like the prototype

X) Other

[Answer]:
X- i won't publish this until done thoroghly, so do them in the correct and best order for execution
---

## Question 11

**Partial data.** With ~55 registry properties and a growing catalog, most new
materials will have most fields empty for a long time.

A) Show every registry property, with empty ones rendered as "—" (honest, but pages look sparse)

B) Show only properties that have a value; a "show all fields" toggle reveals the rest

C) Show a group only if it has at least one value; hide empty groups entirely

D) Show empty fields as a call to action ("no data yet — contribute a source")

X) Other

[Answer]:
D-also change database docs to have that in mind for further steps
---

## Question 12

**Visual identity.** What should the site feel like?

A) Authoritative reference work — dense typography, print/handbook feel, restrained colour

B) Modern technical product — cards, generous whitespace, accent colour, SaaS-like

C) Close to the current prototype's look, cleaned up and made consistent

D) Academic/institutional — matching the Polymer Engineering Association's identity (do you have brand assets, colours, a logo spec?)

X) Other

[Answer]:
B-also Build a visual identity with me step by step,with some examples.the website must stand out(different parts need different visual-datasheet parts must be a little dryer and learning parts mus be interactive and fun to look at. also we need attraction for user and also premuim feel)
---

## Question 13

**Language.** `project-plan.md` defers English/bilingual as premature.

A) Confirmed — Persian only, and the rebuild need not carry i18n plumbing

B) Persian only now, but build the i18n seam so English is a content task later, not a rewrite

C) Bilingual from the start

X) Other

[Answer]:
C-but the main language is persian and we decide based on it. also keep the room for other languages
---

## Non-blocking, answer if you have an opinion

**14.** Are the 12 interactive simulators all worth rebuilding? Ranked keep/cut
would save real time. (Current set: state slider, stress-strain, branching,
tacticity, alloying, processing window, DP calculator, Hansen 3D, molecular
viewer 3D, LCA/CO₂, market share, quiz.)

[Answer]:
No,most of them are fine! so keep them and i we will examine them later for modification-add this to plan
**15.** Should a material page show **grades** (producer products) once U6 lands,
or stay strictly generic-material? This changes the page's information hierarchy,
so it is cheaper to decide now than to retrofit.

[Answer]:
yes. have this option available for future, under the generics i might want to be able to switch to an specific grade.

goal:
using aidlc building a premium visual identity is a very important state of front
