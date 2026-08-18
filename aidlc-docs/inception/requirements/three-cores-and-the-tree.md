# Three cores, one net, and how the material tree actually works

**Created**: 2026-08-03, from the owner's correction.
**Supersedes**: `deep-taxonomy-impact.md` §3–§5.
**Status**: this is the model. Written back for confirmation.

---

## 1. Three cores

| #      | Core                     | What it is                                                                      | State                              |
| ------ | ------------------------ | ------------------------------------------------------------------------------- | ---------------------------------- |
| **C1** | **Datasheet**            | The spine. Wired to the database and to the search engine. The values live here | being built — FE-1 … FE-7          |
| **C2** | **Learning environment** | Interactive, heavy. Its borders and rules are what FE-0 is deciding now         | concepts done; built in FE-8       |
| **C3** | **Educational content**  | Blogs, concept explainers, article reviews — woven into the net                 | later; designed for now, not built |

C1 is the only one connected to search. C2 is deliberately heavy and deliberately
walled off (this is why R24 confines Three.js and Chart.js to it). C3 arrives
last but its _shape_ is decided now, which is why L4 Notebook exists.

## 2. The net — what "Obsidian" actually meant

**Wiki cross-linking, not a graph picture.** Every direction is live:

```
        concepts  ⇄  learning
            ⇅            ⇅
            ╰──  datasheet  ──╯
```

- a **concept** page (extrusion, rheology, fillers, pigments, surface science)
  links to the datasheets and the tools where it applies
- a **learning tool** links back to the datasheet whose numbers it reads, and to
  the concepts it teaches
- a **datasheet** links out to both

Links must therefore be **data, not `<a href>` in prose**, so backlinks work: a
concept page has to be able to answer "which datasheets and tools reference me?"
That is the only structural requirement the metaphor imposes. No graph view is
required; one may exist later as a _learning tool_, which is where L3 now sits.

## 3. The material tree — navigational, not inheriting

### The shape

```
PE                       full page: the general polymer
 ├ LDPE                  branch page
 │   ├ film grade        leaf: only what differs
 │   ├ tube grade        leaf
 │   └ melt grade        leaf
 ├ HDPE                  branch page
 │   ├ film · blow · pipe · injection
 └ LLDPE …
```

### The rule that makes it cheap

**A child page carries only what actually differs. It never repeats the parent.**

Tg, density, the mechanical block, the molecular block — these live on the
general page. A tube-grade page does not restate them and does not inherit them
through any mechanism. If the reader wants Tg, the **breadcrumb at the top of the
site** takes them up to where it lives.

This is why no inheritance is needed. There is nothing to resolve: the value is
either on this page or it is on an ancestor page you can walk to.

### Where the branching happens

**At Processing, and Processing sits at the end of the datasheet.**

The general properties are the same across the branches. Processing is where they
diverge — so the datasheet reads thermal → mechanical → physical → electrical →
molecular → **processing**, and the branch cards sit right there, at the point
where the material stops being one thing.

A property elsewhere on the page that is genuinely grade-dependent can carry the
same card treatment inline, but Processing is the main junction.

### What a leaf page contains

Take _tube grade of LDPE_:

- its **processing window** — the numbers that are actually specific to it
- the **learning tools** that apply here (the processing-window simulator)
- the **concepts** connected at this point — types of extrusion, die design,
  melt fracture
- a breadcrumb up to LDPE → PE for everything general

That is a small page, and small is the point. It is not a datasheet clone with
five fields changed.

## 4. What this changes in what is already built

| Item                                            | Change                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Value inheritance / chain resolution            | **Dropped.** Never needed                                                                                                |
| `v_material_properties`, `/api/materials/:slug` | **Unchanged**                                                                                                            |
| The value atom (FE-2)                           | **Unchanged** — no inherited/specific state. **FE-2 is unblocked**                                                       |
| `material.parent_id`                            | **Still wanted**, but only for hierarchy: breadcrumb, child cards, "where am I". A navigation link, not a data mechanism |
| `property_group.sort_order` for `processing`    | **Currently 10 — it is first.** Must move to last (after `academic`, so 70). One seed `UPDATE`                           |
| Graph as navigation                             | **Dropped.** L3 stays a candidate learning tool                                                                          |
| `topic` / `concept` entity                      | **Still needed** — C3 and the net both require it                                                                        |
| `link` table with backlinks                     | **Still needed** — this is the real requirement behind "Obsidian"                                                        |
| Six-tier Gemini schema                          | **Not implemented.** Mined for content vocabulary only                                                                   |

## 5. Still open

1. **"3D website"** — unresolved and unrelated to the graph question, which is
   now closed. Still worth knowing what it means before FE-1 commits to a
   rendering approach.
2. **Depth of the tree in practice** — PE → LDPE → tube grade is three levels. Is
   that the working maximum, or does LLDPE → C8 → cast film add a fourth? Affects
   breadcrumb design, not the schema.
3. **Do leaf pages get their own citations?** A tube-grade processing window is a
   real measured range and should be citable like anything else. Assuming yes.

## 6. What I got wrong, recorded

I treated `polypedia_architecture_deep_v2.md` as authoritative because it was
presented as the one-year plan, and built an inheritance mechanism, a value-atom
change, and two blocking questions on top of it. It was a generated document with
poor context, and the owner's own model is simpler and better: **don't repeat,
link up**.

The lesson worth keeping: a document handed over is a _statement of intent_, and
intent is what should have been confirmed first — before deriving a schema change
from its wording.
