import { describe, expect, it } from 'vitest';
import { articleReadingTimeMinutes, articleWordCount } from './reading-time';
import { ldpeBranchingArticle } from '../../content/notebook/articles/ldpe-branching';
import type { NotebookArticle } from '../../content/notebook/types';

function minimalArticle(overrides: Partial<NotebookArticle> = {}): NotebookArticle {
  return {
    slug: 'fixture',
    materialSlug: 'ldpe',
    title: { fa: 'یک دو سه', en: 'one two three' },
    standfirst: { fa: 'چهار پنج', en: 'four five' },
    dateSample: '1405/01/01',
    review: {
      claim: [{ kind: 'text', text: { fa: 'شش هفت هشت', en: 'six seven eight' } }],
      sampleCitation: { workFa: 'نمونه', workEn: 'sample', edition: '—', page: '—' },
    },
    sections: [],
    closing: [{ kind: 'text', text: { fa: 'نه ده', en: 'nine ten' } }],
    ...overrides,
  };
}

describe('articleWordCount', () => {
  it('counts words across title, standfirst, review claim and closing', () => {
    // fa: 3 + 2 + 3 + 2 = 10 words. en: same shape = 10 words.
    expect(articleWordCount(minimalArticle(), 'fa')).toBe(10);
    expect(articleWordCount(minimalArticle(), 'en')).toBe(10);
  });

  it('counts a heading, a paragraph, a note (both halves) and a term (both halves)', () => {
    const article = minimalArticle({
      sections: [
        {
          id: 's1',
          side: 'r',
          blocks: [
            { kind: 'heading', id: 's1', tocLabel: { fa: 'الف', en: 'a' }, text: { fa: 'یک عنوان', en: 'a heading' } },
            {
              kind: 'para',
              segments: [
                { kind: 'text', text: { fa: 'متن پاراگراف', en: 'paragraph text' } },
                { kind: 'note', id: 'n1', refText: { fa: '*', en: '*' }, note: { fa: 'یادداشت حاشیه', en: 'margin note' } },
                { kind: 'term', word: { fa: 'واژه', en: 'term' }, definition: { fa: 'تعریف واژه', en: 'term definition' } },
                { kind: 'num', value: '42' },
              ],
            },
          ],
        },
      ],
    });
    // Base (title+standfirst+claim+closing) = 10, plus heading(2) + para
    // text(2) + note(1+2=3) + term(1+2=3) + num(1) = 10 + 2+2+3+3+1 = 21
    expect(articleWordCount(article, 'fa')).toBe(21);
  });

  it('a figureLive block contributes nothing (its caption is i18n chrome, not content)', () => {
    const withLive = minimalArticle({
      sections: [{ id: 's1', side: 'r', blocks: [{ kind: 'figureLive' }] }],
    });
    expect(articleWordCount(withLive, 'fa')).toBe(articleWordCount(minimalArticle(), 'fa'));
  });
});

describe('articleReadingTimeMinutes', () => {
  it('never reports less than 1 minute, even for a very short article', () => {
    expect(articleReadingTimeMinutes(minimalArticle(), 'fa')).toBeGreaterThanOrEqual(1);
  });

  it('the real shipped article reads as at least 1 minute in both locales', () => {
    expect(articleReadingTimeMinutes(ldpeBranchingArticle, 'fa')).toBeGreaterThanOrEqual(1);
    expect(articleReadingTimeMinutes(ldpeBranchingArticle, 'en')).toBeGreaterThanOrEqual(1);
  });

  it('is monotonic: a strictly longer article never reports a shorter read', () => {
    const short = minimalArticle();
    const long = minimalArticle({
      closing: [
        {
          kind: 'text',
          text: {
            fa: Array(400).fill('کلمه').join(' '),
            en: Array(400).fill('word').join(' '),
          },
        },
      ],
    });
    expect(articleWordCount(long, 'fa')).toBeGreaterThan(articleWordCount(short, 'fa'));
    expect(articleReadingTimeMinutes(long, 'fa')).toBeGreaterThan(articleReadingTimeMinutes(short, 'fa'));
  });
});
