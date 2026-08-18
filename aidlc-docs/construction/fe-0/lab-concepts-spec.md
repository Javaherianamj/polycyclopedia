# FE-0 — The Lab: four concepts

**Written**: 2026-08-03 (Opus, planning)
**Implemented by**: Sonnet agents, per the Model Routing section of `.claude/CLAUDE.md`
**Foundation already written, do not rewrite**: `design/fe-0/lab/lab.css`

---

## Why the first Learn page was rejected

The owner's words: _"too simple and like an AI generated vibe coded thing"_. The
criticism is correct and it is worth naming precisely, because the fix is not
"add more style".

The page was **a vertical stack of eight identical numbered cards**. That layout
is the default output shape of a language model asked to present a list, and it
is recognisable as such. Worse, it was doing no intellectual work:

- Every tool was presented as an equal sibling of every other, when in fact they
  operate on completely different objects at completely different length scales —
  a molecule, a chain, a crystal, a bulk specimen, a machine, a planet.
- The ordering was asserted ("this is a path") but nothing in the layout
  demonstrated it. The user had to take my word for it.
- Nothing about the design was specific to polymer science. Swap the Persian
  strings and it is a settings page.

**The bar for a replacement**: the structure of the page should teach something
before you read a word of it, and it should be a structure that only makes sense
for polymers.

## What changed in the brief

The owner also said the lab will later carry **article reviews and learning
posts**. That is a material change and it arrived at the right time: the lab is
not a toolbox, it is a **publication with live figures**. A tool is a figure
inside an argument, not a tile in a grid. Concept L4 exists specifically because
of this, and the other three are designed so that prose can be dropped into them
without redesign.

## Dark palette

Replaced. The old `#1a1f21` grey-green read as a default dark theme. The new
foundation in `lab.css` is a **blueprint at night** — deep indigo `#101728`.
Light mode also shifts from slate-green to a soft blue-slate `#e9eef4` so the two
modes belong to each other. The warm/cool surface axis (D39) is unchanged and now
stronger: datasheet is cream and ember, lab is blue and indigo.

---

# L1 — «مقیاس» / SCALE

**The idea**: polymer science is a multi-scale discipline, and that is the single
most important thing a beginner has to internalise. So make the page a **zoom**.
The reader scrolls from 10⁻¹⁰ m to 10⁰ m and the tools appear at the scale they
belong to. The navigation is a magnification, not a menu.

**Why it is not generic**: no other subject would organise a lab this way. It is
the structure of the discipline, rendered as the structure of the page.

### Layout

- A fixed vertical **scale rail** on the leading edge (right, in RTL) that reads
  the current magnification as you scroll: `10⁻¹⁰ m` → `10⁻⁹` → `10⁻⁸` → `10⁻⁶`
  → `10⁻³` → `10⁰`. It is a ruler, drawn with tick marks, not a list of links.
- A large **scale readout** pinned near the top: the exponent in Newsreader at
  ~4rem, with the Persian name of that scale beside it.
- Six full-height stations, one per decade. Each station: the scale name, one
  sentence of physics, the object at that scale, and the tool(s) that live there.
- Background luminance shifts very slightly from station to station — darkest at
  the atomic end, lightest at the bulk end. Subtle; a gradient across the whole
  document, not per-section boxes.

### Stations (LDPE)

| Scale   | Persian            | Object                     | Tools                                      |
| ------- | ------------------ | -------------------------- | ------------------------------------------ |
| 10⁻¹⁰ m | مونومر و پیوند     | the repeat unit, C–C bonds | 3D molecular viewer                        |
| 10⁻⁹ m  | زنجیر منفرد        | one chain, Rg, Mn/Mw       | DP calculator · Hansen solubility          |
| 10⁻⁸ m  | لایه بلوری (لاملا) | lamella thickness, folding | branching simulator                        |
| 10⁻⁶ m  | کروی‌بلور          | spherulite, crystallinity  | crystallinity ↔ density readout            |
| 10⁻³ m  | قطعه               | the specimen, the part     | stress–strain · processing window (locked) |
| 10⁰ m   | چرخه عمر           | the product and the planet | LCA / CO₂                                  |

### One live element (required)

At the **10⁻⁹ station**, a small live control: a chain-length slider (DP from 100
to 20 000) that redraws a simple 2D random-walk chain in SVG and reports the
end-to-end distance and radius of gyration. It should visibly become a denser
coil as DP rises. This is cheap, it is real physics (`Rg ∝ √N`), and it makes the
scale idea tangible instead of decorative.

---

# L2 — «نقشه» / MAP

**The idea**: open on the thing polymer engineers actually navigate by — the
**modulus–temperature master curve**. The curve _is_ the menu. Click the glassy
plateau and you get the tools and the physics of stiffness; click the transition
and you get Tg; click the flow region and you get processing and rheology.

**Why it is not generic**: the navigation is a physical model of the material.
Nothing about this layout transfers to another product.

### Layout

- A large SVG plot, log(E) on the vertical axis, temperature on the horizontal,
  drawn from **this material's real Tg, Tm and degradation values**.
- Four coloured regions using `--ramp-*` — and this is legitimate encoding, not
  decoration: the colour is standing in for temperature (R34).
- A **draggable marker** on the curve. Dragging it updates a readout: temperature,
  approximate modulus, physical state, and one sentence about what the chains are
  doing there.
- Below the plot, a **tray** that swaps content as the marker moves — showing only
  the tools relevant to the current region, with the others visibly greyed rather
  than hidden, so the reader learns that tools belong to regimes.
- A separate, clearly-labelled section beneath for the tools that are **not**
  temperature-dependent (molecular viewer, Hansen) — do not force them onto the
  curve. Being honest about what does not fit is part of the design.

### Curve shape for a semicrystalline polymer (LDPE)

Glassy plateau ≈ 1 GPa below Tg → drop of roughly one decade through Tg →
**crystallinity holds a shallow plateau** between Tg and Tm (this is the
interesting part and is what distinguishes semicrystalline from amorphous) →
sharp drop of three-plus decades at Tm → flow region → degradation above Td.

Label the shallow plateau explicitly. It is the single best thing this page can
teach.

---

# L3 — «شبکه» / GRAPH

**The idea**: polymer properties are causally linked, and engineers reason along
those links: branching → crystallinity → density → stiffness → application.
Render it as a **force-directed graph you can push on**. Drag the "branching"
node up and watch crystallinity, density and modulus move downstream in real
time.

**Why this one**: the owner named Obsidian-style graph views and Wikidata as
things they enjoy (round-1 Q16). This is that, but where the edges mean
causation rather than "these pages link to each other" — which is the version
that actually teaches.

### Layout

- SVG force-directed graph, ~12 nodes, hand-placed rather than randomly
  simulated so it is legible and stable. Light physics for drag response only.
- Node types, distinguished by shape and by the existing status palette:
  - **structural causes** (branching, cooling rate, Mw) — draggable inputs

    > **Corrected 2026-08-03.** This list originally read "branching, tacticity,
    > Mw". **Tacticity does not apply to LDPE** — a CH₂–CH₂ backbone has no
    > stereocentres, so there is nothing to be iso-, syndio- or atactic about.
    > It is a PP/PVC/PS concept. The implementing agent caught the error and
    > substituted cooling/crystallisation rate, which is correct and is what
    > shipped. Recorded rather than quietly edited: a domain error in a spec is
    > exactly the kind of thing this project cannot afford to lose track of.

  - **derived properties** (crystallinity, density, Tm, modulus, tensile) — read-only,
    each carrying its provenance mark exactly as on the datasheet (R1)
  - **outcomes** (film, injection moulding, cable insulation) — terminal
- Edges are directional, labelled with the sign of the relationship (↑/↓), and
  animate a pulse along their length when an upstream value changes.
- Dragging an input recomputes downstream nodes through simple, **clearly
  documented** monotonic relations, and every derived node shows a caption saying
  the trend is illustrative, not a validated model. **This must be explicit** —
  a plausible-looking number with no basis is exactly what this project exists to
  prevent (R5).

---

# L4 — «دفترچه» / NOTEBOOK

**The idea**: the shape the lab has to grow into. An article — title, standfirst,
prose, margin notes — with **live figures embedded inside the argument**. The
tool is not a card; it is figure 3.

**Why now**: per the brief change noted above — if the lab is built as a menu it
has to be rebuilt when the first post arrives; if it is built as a publication, a
post is just another document in it.

### Layout

- Two-column reading measure: main column ~62ch, plus a **margin column for
  sidenotes** (Tufte-style) holding definitions, unit conversions, and citations.
  On mobile the sidenotes collapse inline behind a marker.
- A table-of-contents rail with reading progress.
- Byline, date, reading time, and a **review block**: a quoted claim from a paper
  with its citation rendered through the same provenance component as the
  datasheet — metadata only, no quoted body text (D5). Label the sample citation
  `نمونهٔ طراحی` exactly as `data.js` does; no invented sources.
- At least one **live figure mid-article** with a real caption ("شکل ۲ — ...")
  and a note that it reads its values from the datasheet.
- One **pull-quote** and one **inline term with a hover definition**, to show how
  teaching prose behaves in this system.

---

## Not built, recorded for later

**«میز» / THE BENCH.** Frame each tool as _the instrument that produced the
number_: DSC for Tm and enthalpy, tensile tester for modulus, GPC for Mw, MFI
tester for melt flow. This connects the lab directly to the `test_method` table
that already exists in the database, and it teaches provenance in the deepest
sense — not just which book says 105–115 °C, but what machine was run to find
out. Strong candidate for a later pass; overlaps with L4 and does not need its
own concept page yet.

---

## Constraints for all four

1. `lab/lab.css` is written and is the foundation. **Read it, use its tokens, do
   not rewrite it.** Add per-concept CSS in its own file.
2. Persian, RTL, Latin numerals in LTR islands (D18, R6).
3. Both themes must work. The theme toggle comes from `../theme.js` — import it,
   do not reimplement it.
4. No `transition: all` (R35).
5. No horizontal overflow at 320/375/768 (R27).
6. A tool with missing data does not render as if it worked — processing window
   and quiz stay locked with their real reasons (R7, `db/DATA-GAPS.md` G4/G5).
7. Never invent a citation, a source, or a number presented as measured.
8. Values come from `../data.js` where they exist. Anything hardcoded gets a
   comment saying so and why.
9. `prefers-reduced-motion` respected everywhere.
