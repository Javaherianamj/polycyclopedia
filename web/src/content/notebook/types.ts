// L4 — «دفترچه» / NOTEBOOK content shape (lab-concepts-spec.md). See this
// directory's index.ts for the full account of WHY article prose lives
// here rather than in fa.json/en.json (R14's t() dictionaries are built
// for short, flat, REUSED UI strings; a multi-paragraph article with
// embedded sidenotes/terms/live-datasheet references is neither short nor
// reused, and flattening it into one-off keys would throw away exactly
// the structure that lets a second article be a data addition instead of
// a parallel rendering implementation).
//
// Every string below is BILINGUAL (`{ fa, en }`) inline, not a t() key,
// for that same reason. Numbers are never inline text here — see
// `LiveValueSegment`'s own comment for why, and for the seam a second
// article extends.

export interface Bilingual {
  fa: string;
  en: string;
}

/**
 * One inline unit of prose. A paragraph (or a caption, or a pull-quote) is
 * an ARRAY of these, rendered in reading order — this is what lets a
 * sidenote reference, a hover-term, or a live datasheet reading sit in the
 * middle of a sentence without string concatenation or `set:html`/
 * `dangerouslySetInnerHTML` (which would require the content module to
 * author raw markup, defeating the point of a typed content shape).
 */
export type ProseSegment =
  | { kind: 'text'; text: Bilingual }
  /** A Latin-numeral run inside RTL prose (D18/R6) — e.g. a plain count
   * that is not a datasheet fact (so `liveValue` does not apply) and must
   * never be reshaped by bidi. */
  | { kind: 'num'; value: string }
  /** A Tufte-style margin sidenote (spec: "definitions, unit conversions,
   * and citations"). `id` must be unique within the article — it doubles
   * as the DOM id the mobile toggle button controls and the anchor the
   * desktop float lands near (learn-notebook.css/notebook-chrome.ts). */
  | { kind: 'note'; id: string; refText: Bilingual; note: Bilingual }
  /** An inline term with a hover/focus definition (spec: "one inline term
   * with a hover definition, to show how teaching prose behaves in this
   * system"). */
  | { kind: 'term'; word: Bilingual; definition: Bilingual }
  /**
   * THE non-hardcoded-number seam (R8: "values come from data where they
   * exist; hardcoded gets a comment saying so and why" — this doc IS that
   * comment for every number this article states). Never a literal
   * number: a POINTER to a live property on the article's bound material,
   * resolved server-side in `LearnNotebook.astro` against a real
   * `MaterialDetail` fetched from the running API, and rendered with its
   * real provenance mark by `InlineCitedValue.astro` — exactly the same
   * fact, in exactly the same units, that the material's own datasheet
   * page shows for this property, never a second/independent number.
   *
   * `transform: 'celsiusToFahrenheit'` is the one unit conversion this
   * article needs. It is arithmetic on the SAME live number (`lib/
   * notebook/units.ts`), captioned as a conversion by the surrounding
   * prose, never a second citation or a second fact.
   *
   * EXTENSION SEAM for a second article: a new `{ group, key }` pair is a
   * one-line addition here; a genuinely new transform is a few lines in
   * `units.ts` plus one switch branch in `LearnNotebook.astro`'s
   * resolver. This is deliberately NOT a fully generic property-path/
   * formula engine — one demonstration article does not earn that
   * abstraction, and a small closed set is easier to audit against R5
   * than an open-ended one would be. */
  | { kind: 'liveValue'; group: string; key: string; transform?: 'celsiusToFahrenheit' };

export type ArticleBlock =
  | { kind: 'heading'; id: string; tocLabel: Bilingual; text: Bilingual }
  | { kind: 'para'; segments: ProseSegment[] }
  | { kind: 'pullquote'; segments: ProseSegment[] }
  /** Figure 1 — the static linear-vs-branched schematic
   * (`lib/notebook/chain-schematic.ts`). Non-live by construction: an
   * illustration, not a measurement (R7/R8 — nothing here is read from
   * any data source, real or otherwise, and the caption says so). */
  | { kind: 'figureSchematic'; caption: ProseSegment[] }
  /** Figure 2 — the live density/crystallinity readout
   * (`NotebookFigureIsland`). Its caption is static CHROME text (i18n),
   * not content: it describes the mechanism ("this reads from the
   * datasheet"), not a fact about a specific material, so it belongs
   * with the other chrome strings, not here. */
  | { kind: 'figureLive' };

export interface NotebookSection {
  id: string;
  /** Alternating spread side, ported verbatim from the FE-0 prototype's
   * own magazine-mirroring device (design/fe-0/lab/notebook.css's header)
   * — 'r'/'l' are PHYSICAL sides, not logical inline-start/end, on
   * purpose; see learn-notebook.css for why. */
  side: 'r' | 'l';
  blocks: ArticleBlock[];
}

export interface NotebookReview {
  /** D5: metadata only, no quoted body text. This is the article's OWN
   * paraphrase of what a (possibly not-yet-registered) source would
   * claim — never a quotation of any real paper's actual sentences. */
  claim: ProseSegment[];
  /** The sample-citation object this whole project allows itself
   * (index.ts's header explains the decision not to attach a real
   * citation to an unverified claim here). Rendered through the exact
   * same `.nb-mark`/popover mechanism a real citation would use — see
   * `LearnNotebook.astro`'s review-block markup. */
  sampleCitation: { workFa: string; workEn: string; edition: string; page: string };
}

export interface NotebookArticle {
  slug: string;
  /** The material this article is fundamentally ABOUT — its prose and its
   * byline material code. The live figure can still be repointed to
   * whatever material the reader arrives bound to or picks
   * (`NotebookFigureIsland`); this is only the article's own default. */
  materialSlug: string;
  title: Bilingual;
  standfirst: Bilingual;
  /** Ported from the FE-0 prototype's own "(تاریخ نمونه)"/"(sample date)"
   * tag: an invented publication date is still an invented fact (that
   * file's own comment), so this stays a labelled placeholder, never
   * presented as real editorial metadata. Latin numerals (D18/R6). */
  dateSample: string;
  review: NotebookReview;
  sections: NotebookSection[];
  closing: ProseSegment[];
}
