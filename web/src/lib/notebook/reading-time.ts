// Reading-time estimate for the byline (spec: "Byline, date, reading time
// ..."). Ported from the FE-0 prototype's `readingTimeMinutes()`
// (`design/fe-0/lab/notebook.js`), which counted words in the rendered
// DOM — that only works client-side, after the article has already
// painted. This version is a PURE function over the content module
// itself (`NotebookArticle`), so `LearnNotebook.astro` can compute the
// byline's reading time at render time, server-side, with no flash of
// "— دقیقه مطالعه" before a script runs.
import type { Locale } from '../../i18n/config';
import type { ArticleBlock, NotebookArticle, ProseSegment } from '../../content/notebook/types';

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

function segmentWordCount(segment: ProseSegment, locale: Locale): number {
  switch (segment.kind) {
    case 'text':
      return wordCount(segment.text[locale]);
    case 'note':
      return wordCount(segment.refText[locale]) + wordCount(segment.note[locale]);
    case 'term':
      return wordCount(segment.word[locale]) + wordCount(segment.definition[locale]);
    case 'num':
      return 1;
    case 'liveValue':
      // A live datasheet reading's eventual rendered length depends on
      // live API data this pure module has no access to (and must not
      // fetch — see this file's header on why the estimate stays a pure
      // function). Counted as a single "word" so it is not simply
      // dropped from the estimate, without pretending to know its exact
      // length in either locale.
      return 1;
  }
}

function segmentsWordCount(segments: readonly ProseSegment[], locale: Locale): number {
  return segments.reduce((sum, seg) => sum + segmentWordCount(seg, locale), 0);
}

function blockWordCount(block: ArticleBlock, locale: Locale): number {
  switch (block.kind) {
    case 'heading':
      return wordCount(block.text[locale]);
    case 'para':
    case 'pullquote':
      return segmentsWordCount(block.segments, locale);
    case 'figureSchematic':
      return segmentsWordCount(block.caption, locale);
    case 'figureLive':
      // Figure 2's caption is static i18n chrome (types.ts's own
      // comment), not article-authored prose, so it is intentionally not
      // counted here.
      return 0;
  }
}

export function articleWordCount(article: NotebookArticle, locale: Locale): number {
  let total = wordCount(article.title[locale]) + wordCount(article.standfirst[locale]);
  total += segmentsWordCount(article.review.claim, locale);
  for (const section of article.sections) {
    for (const block of section.blocks) total += blockWordCount(block, locale);
  }
  total += segmentsWordCount(article.closing, locale);
  return total;
}

/** 180 wpm and a 1-minute floor — the same editorial convention the FE-0
 * prototype used (`Math.max(1, Math.round(words / 180))`). An editorial
 * constant, not a measured fact, so it is not something R1 provenance
 * applies to. */
const WORDS_PER_MINUTE = 180;

export function articleReadingTimeMinutes(article: NotebookArticle, locale: Locale): number {
  return Math.max(1, Math.round(articleWordCount(article, locale) / WORDS_PER_MINUTE));
}
