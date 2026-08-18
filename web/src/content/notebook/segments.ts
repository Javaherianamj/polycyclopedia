// Small builder functions for `ProseSegment` (types.ts) — purely
// ergonomic sugar so an article file reads as prose-with-annotations
// rather than a wall of object literals. This is the file a second
// article's author actually types against; see index.ts for the full
// "how article #2 gets added" account.
import type { ProseSegment } from './types';

export function text(fa: string, en: string): ProseSegment {
  return { kind: 'text', text: { fa, en } };
}

/** A Latin-numeral run inside RTL prose (D18/R6) — for a plain count that
 * is not itself a datasheet fact (use `liveValue` for those). */
export function num(value: string): ProseSegment {
  return { kind: 'num', value };
}

export function note(id: string, refFa: string, refEn: string, noteFa: string, noteEn: string): ProseSegment {
  return { kind: 'note', id, refText: { fa: refFa, en: refEn }, note: { fa: noteFa, en: noteEn } };
}

export function term(wordFa: string, wordEn: string, defFa: string, defEn: string): ProseSegment {
  return { kind: 'term', word: { fa: wordFa, en: wordEn }, definition: { fa: defFa, en: defEn } };
}

export function liveValue(
  group: string,
  key: string,
  transform?: 'celsiusToFahrenheit',
): ProseSegment {
  return { kind: 'liveValue', group, key, transform };
}
