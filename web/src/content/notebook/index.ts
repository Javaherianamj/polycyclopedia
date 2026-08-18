// L4 — «دفترچه» / NOTEBOOK — the content registry.
//
// CONTENT-SHAPE DECISION (build brief: "decide the shape... state your
// choice, and make it obvious how article #2 gets added"):
//
// Article prose lives in typed TypeScript modules under this directory
// (`types.ts`'s `NotebookArticle`, authored via `segments.ts`'s builders,
// one file per article under `articles/`) — NOT as Astro content
// collections, NOT hardcoded into `LearnNotebook.astro`'s JSX/markup, and
// NOT folded into `fa.json`/`en.json`.
//
// Why not i18n (fa.json/en.json)? `t()` (i18n/t.ts) is built for short,
// FLAT, REUSED UI strings — a label that appears on every page render,
// looked up by one key, in one of two fixed strings. An article is
// neither short nor reused: it is a few thousand words of structured
// prose, per locale, used exactly once, with sidenotes/hover-terms/live
// datasheet references embedded MID-SENTENCE. Flattening that into
// `fa.json` keys would (a) explode the 452-key dictionary with dozens of
// one-off, never-reused strings, defeating the point of a shared
// dictionary, and (b) throw away the STRUCTURE — which run of text is a
// sidenote, which is a hover term, which is a live number — that this
// file's types exist to carry. That structure is exactly what makes a
// second article a data addition rather than new rendering code, so
// keeping it is worth the deliberate departure from "every string is a
// t() key." Non-prose CHROME around the article (byline labels, the TOC
// heading, figure-mechanism captions, provenance-mark labels) still goes
// through `t()` exactly like every other Learn surface — see
// `LearnNotebook.astro` and the `learn.notebook.*` keys in fa.json/en.json.
//
// Why not Astro content collections? Content collections are built for a
// COLLECTION read generically (a blog index, a docs tree) via
// frontmatter + Markdown, resolved through Astro's own schema/query
// layer. This template's defining requirement is closer to the opposite:
// a small, CLOSED set of typed segment kinds (`text`/`num`/`note`/`term`/
// `liveValue`) that a renderer pattern-matches exhaustively (TypeScript's
// own exhaustiveness checking on `ProseSegment['kind']` is the safety net
// that a Markdown+frontmatter body would not give us — nothing stops a
// second article's Markdown from embedding a raw citation number that
// skips the `liveValue` seam entirely). A plain typed module gets that
// guarantee for free and needs no new dependency or Astro config change
// (build brief: "no new dependencies").
//
// HOW ARTICLE #2 GETS ADDED: write `articles/<slug>.ts` exporting a
// `NotebookArticle` (see `ldpe-branching.ts` for the worked example —
// every `text()`/`note()`/`term()`/`liveValue()` call in that file is the
// vocabulary a second author writes against), then add it to
// `NOTEBOOK_ARTICLES` below. `LearnNotebook.astro`, `NotebookFigureIsland`,
// `chain-schematic.ts` and `reading-time.ts` all already operate on
// `NotebookArticle` generically — none of them know this project has only
// one article today, so none of them need to change. The one thing NOT
// yet built is a multi-article INDEX/listing page (today's single route,
// `/{locale}/learn/notebook`, renders `NOTEBOOK_ARTICLES[0]` directly) —
// that is a real, stated gap, not a silent one: see this repo's build
// brief header in `LearnNotebook.astro` for why it was left for the day a
// second article actually exists, rather than built speculatively now.
//
// THE REVIEW BLOCK'S CITATION (D5, R5): checked `GET /api/sources`
// (1,290 rows) before writing this — the database DOES hold real
// citations, but none of them was verified by this agent as actually
// supporting the SPECIFIC claim `ldpe-branching.ts`'s review block
// paraphrases (branch content vs. melting-point depression across LDPE
// grades). Attaching a real citation id to a claim nobody checked that
// source against would be its own kind of fabrication — a false
// ATTRIBUTION, not a false number, but exactly the failure mode this
// project's schema exists to prevent either way. So article #1 uses the
// sample-citation path instead: the same `نمونهٔ طراحی`/"DESIGN SAMPLE"
// object `design/fe-0/lab/data.js`'s `vicat` entry already committed to,
// rendered through the same mark+popover mechanism a real citation would
// use. A future article backed by a citation someone has actually read
// against its claim can set `review.sampleCitation` from a real
// `Citation` instead — nothing about the shape needs to change for that.
import type { NotebookArticle } from './types';
import { ldpeBranchingArticle } from './articles/ldpe-branching';

export const NOTEBOOK_ARTICLES: readonly NotebookArticle[] = [ldpeBranchingArticle];

export function getNotebookArticle(slug: string): NotebookArticle | undefined {
  return NOTEBOOK_ARTICLES.find((a) => a.slug === slug);
}

export type { NotebookArticle, NotebookSection, ArticleBlock, ProseSegment, Bilingual } from './types';
