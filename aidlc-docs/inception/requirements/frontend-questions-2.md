# Frontend Rebuild — Round 2 questions

Round 1 settled _what the site is_. This round settles _how it is built and how
it looks_. Answer after each `[Answer]:` tag.

Sections A and B block FE-0 (visual identity). Section C blocks FE-1 (app shell)
and is the most expensive group to answer late. Sections D–F block individual
screens and can wait a little. Wherever "X) Other" is offered, write your own
answer as free text after the tag.

---

# A. Visual identity — the material you need to give me

## Question 16

You asked to build the identity together, with examples. To make examples worth
looking at, I need reference points. **Name 2–5 websites, apps or printed
documents whose look you would be happy to be compared to** — and for each, one
sentence on what specifically you like (the typography, the density, the colour,
the motion, the feeling of quality).

They do not have to be polymer or science sites. A bank's dashboard, a magazine,
a hardware product page, a Persian site you admire — all useful. Naming one you
**dislike** is equally useful.

[Answer]:
UIs that i like: Notion site, claude app and website, also their skilijam courses,apple is the perfection,khan academy,wikidata obsidian like graphs are fun and i love graph views,nature comunication is a bit premium i like it not just a news site like natnal geographic, persian:alibaba and jabama are nice, taghche is ok and fidibo is good(mobile)blue bank is awesom(mobile),
idon't like:coursera(too dry and monothone, very strict and user non friendly),wikipedia(too simple i prefer Scholarpedia which is a bit better, but we are not looking forward that type of site),MIT is very old and restricted
i like interaction with site, illustration, beautiful colors and nice theme. rather a beauty wow moment followed by intelectual and data wow

---

## Question 17

**Brand assets.** `public/logo.svg` exists and the header reads "انجمن علمی
مهندسی پلیمر • POLYMER ENGINEERING ASSOCIATION".

A) The association has a real brand — logo, colours, fonts — and Polypedia must follow it. (Please attach or point me to it)

B) The association has a logo only; colour and type are mine to choose

C) Polypedia is its own brand, independent of the association's identity

D) There is no real brand yet — this is the moment to create one

X) Other

[Answer]:
C, we will use their logo for addvertisement on the site but i want a seperate brand
---

## Question 18

**Persian typography.** This is the single biggest lever on whether the site
reads as premium, and it is a decision with licensing consequences.

A) Vazirmatn — modern, free, excellent numerals, very widely used (so: safe, but the site will look like other Iranian sites)

B) Estedad or Sahel — free, more distinctive, slightly less battle-tested

C) A commercial Persian typeface — most distinctive, costs money, needs a licence you own

D) You choose; show me the same page set in three faces and I will pick

X) Other

[Answer]: IRANSansX 'if not possible use estedad'

---

## Question 19

**Numerals in data.** A datasheet full of numbers has to commit. `۱۰۵ - ۱۱۵` or
`105 - 115`?

A) Persian numerals everywhere, including property values — most authentically Persian, hardest to scan for engineers used to Latin figures

B) Latin numerals for all measured values and units; Persian numerals only in body prose (dates, counts)

C) Latin numerals everywhere, including prose

X) Other

[Answer]: C

---

## Question 20

**Dark mode.** The prototype has a working light/dark toggle.

A) Keep both, dark as default — signals "technical tool"

B) Keep both, light as default — signals "reference work"

C) Light only, at least for v1 — halves the design and QA cost of every screen

X) Other

[Answer]: B

---

## Question 21

**"Premium" is ambiguous and I want to get it right.** Which of these is closer
to what you mean?

A) Restraint — a lot of white space, few colours, superb typography, almost no animation. Premium as in a good scientific journal or a Swiss watch catalogue

B) Craft — visible attention to detail, subtle motion, depth and shadow, micro-interactions everywhere. Premium as in a well-made SaaS product

C) Richness — strong colour, illustration, 3D, generous imagery. Premium as in a modern hardware brand's product page

D) Mixed on purpose: A for the Datasheet surface, C for the Learn surface, and the contrast between them is itself the identity

X) Other

[Answer]:
A for datasheet, B for general and in between parts, C for learning. but mostly i meant B
---

# B. Design specifics

## Question 22

**How does a value show it is uncited?** The exact wording and weight matter,
because for months this is what most of the site will say. Which reads better to
you (final Persian wording to be chosen together)?

A) A neutral grey marker on the value; the popover says "منبع ثبت نشده"

B) A visibly different treatment — the number itself in a lighter colour, so an uncited page looks visibly incomplete at a glance

C) A small warning-coloured marker, treating uncited data as a defect to be fixed

D) No marker at all on uncited values; only _cited_ values get a marker, so the marker is a positive signal that grows over time

X) Other

[Answer]:
A, also say in progress or something like we are working on it in persian
---

## Question 23

**The empty-field call to action** (your answer to Q11). "No data yet — add a
source" implies the reader can do something. Today you are the only curator.
What should clicking it actually do?

A) Nothing — it is informational, phrased as "هنوز ثبت نشده" with no action

B) Open a contact/contribution form that emails you

C) Link to a public "how to contribute" page (a real open-contribution model, later)

D) Do nothing for readers, but when _you_ are logged in it becomes a direct link into the curation flow

X) Other

[Answer]: C

---

## Question 24

**Datasheet page structure.** The prototype uses three tabs (صنعتی / دیتاشیت
مهندسی / شیمی و فیزیک پایه). With the Learn tools moved to their own surface
(D2), the datasheet is shorter than it was.

A) Keep the three tabs

B) One long page with a sticky section navigator down the side — better for scanning, much better for Ctrl+F and for search-engine indexing

C) One long page on desktop, tabs on mobile

X) Other

[Answer]:
aren't we using tabs for learing and datasheet to be seperated? if not introduce me to some examples on construction i can not decide which for now! two tabs, or one long tab with a button to learnin env, or you have other ideas... which i hope.

---

## Question 25

**How is a property search actually composed?** "Tg > 100 AND tensile 40–80" is
the goal; the interface for building it is the hard part.

A) Pick a property from a list, then a range slider bounded by the real data. Repeat to add more conditions

B) A spreadsheet-like filter row: property, operator, value — closest to how engineers think, densest, least friendly on mobile

C) Start from a material you like and ask for "similar but stiffer" — comparative rather than absolute

D) A single text box that parses what you type ("tg>100 tensile 40-80")

E) A + D: sliders as the primary interface, with a text field for people who know what they want

X) Other

[Answer]:
E+C, E is the main searching env, but we have c at the end of each polymers entry, along side the quick comparison tool
---

## Question 26

**Search results.** What does a result row show by default?

A) Just the material — name, family, coverage. Click through for values

B) The material plus the properties you filtered on, so you can see how each one scored

C) A full comparison table of all results across the filtered properties — results _are_ a comparison

X) Other

[Answer]:
B with the button to see each by clickin on them or a full comparison between all of them using comparison tool
---

# C. Technical decisions — these block FE-1

## Question 27

**Framework.** The prototype is React 19 + Vite, client-rendered, hash routes.
D7 says SEO is secondary now but real later, and D13 wants bilingual URLs. The
cost of changing this later is high; the cost of choosing now is low.

A) Stay React + Vite, add a real router, add prerendering later if SEO matters. Least new to learn, least ceremony

B) Move to **Astro** with React islands — static HTML per material page out of the box, so SEO and first-paint on Iranian mobile networks are solved by construction; the interactive tools stay React

C) Move to **Next.js** — the heaviest option, real SSR, but it assumes a Node host, which interacts with the undecided hosting question

D) You decide and justify it

X) Other

[Answer]: D

**My recommendation if you pick D:** B. Every material page is a document that
changes rarely — the exact shape static generation is for. It gives you fast
first paint on a phone over a slow network and search-engine visibility without
running a Node server, which also keeps the hosting decision open. The
simulators stay React components, unchanged.

---

## Question 28

**Hosting** is still open decision #1 in `project-plan.md`, and it now constrains
question 27. Any movement?

A) Domestic Iranian provider

B) VPS abroad (Hetzner / OVH-style)

C) A static host + CDN — Cloudflare Pages, which you are already on

D) Still undecided — assume static-friendly and keep options open

X) Other

[Answer]:
i willl first use a free or static one, but later probably will move to a domestic provider(stay toned and keep the option), vps abroad is not on the table
---

## Question 29

**Bilingual URL scheme** (D13).

A) `/fa/ldpe` and `/en/ldpe` — explicit, prerenderable, best for search engines

B) `/ldpe` for Persian with `?lang=en` — simpler, worse for indexing

C) Separate subdomains

X) Other

[Answer]: A

---

## Question 30

**When English content is missing** — which it is today for every material
overview (see `db/DATA-GAPS.md` G6) — what does the English page do?

A) Show the Persian text with a clear "not yet translated" note

B) Hide the section entirely

C) Machine-translate on the fly and label it as machine-translated

D) Do not offer English on a material until its English content exists

X) Other

[Answer]:
add english one to database
---

## Question 31

**Testing.** The frontend currently has zero tests; CI runs typecheck, lint,
format and build. The database has 16 constraint checks, the API 17 tests,
curation 84.

A) Match that standard — unit tests for logic, component tests for the value atom and the four states, a few end-to-end journeys

B) Tests for logic and the value atom only; screens are verified by eye

C) No frontend tests; CI's existing gates are enough

X) Other

[Answer]: A

---

# D. Practical

## Question 32

**Who builds this, and over what period?** It changes how much I should
decompose, document and hand off, versus just build.

A) You and me, no deadline — quality over speed

B) You and me, with a target date (which is: ______)

C) Others will join and need to be able to pick it up

X) Other

[Answer]: A

---

## Question 33

**Performance floor.** The prototype loads Three.js, Chart.js and a 3D viewer.
On a mid-range Android phone over an Iranian mobile network, that is a slow
first visit — and Q8 says mobile is most people's first impression.

A) Hard budget: the datasheet page must be usable in under 3 seconds on a slow connection, and heavy tools load only when opened

B) Reasonable effort, no hard budget

C) Not a concern — the audience is on decent connections

X) Other

[Answer]:
in that model, i was planing the same thing i want you to do, first thing is datasheet and must be as fast as possible, then they go to learning tools, when they decide to go there you should load heavy stuff! so we need those tools and they are a signature, but also they must be wanted not always out of the box
---

## Question 34

**Anything in the prototype you already know you want gone.** You said it "needs
formation and several fixes". Now is the cheapest moment to say what you never
liked — a section, an interaction, a colour, a page. Free text.

[Answer]:
i love the colors but i want you to come up with a color identity completely. you can understand what is my taste of color, pintres and vintage like colors mostly and soft edges. keep it in mind. issues of site are a bit in polystyrene and there are several font issues wich annoys me the most. also on mobile some parts are bigger than picture so the picture of the web shifts to left! hate it. and there is no loading on it! i love the emokies there i think keep them they are minimal and nice so use them. i hate the bad order! in there we have random order and no real learning curve or data sorts.
