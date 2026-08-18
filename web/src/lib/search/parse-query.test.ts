import { describe, expect, it } from 'vitest';
import { parseQuery } from './parse-query';
import type { SearchIndexProperty } from './types';

function property(overrides: Partial<SearchIndexProperty> & { key: string }): SearchIndexProperty {
  return {
    nameFa: overrides.key,
    nameEn: overrides.key,
    symbol: null,
    unit: null,
    dataType: 'numeric',
    observedMin: 0,
    observedMax: 100,
    aliasTokens: [overrides.key],
    ...overrides,
  };
}

const tg = property({ key: 'tg', aliasTokens: ['tg'] });
const tensile = property({
  key: 'tensile_strength',
  aliasTokens: ['tensile_strength', 'tensile'],
});
// A property whose first segment is a prefix of `tensile_strength`'s own
// alias set, to exercise "alias that is a prefix of another".
const tensileModulus = property({
  key: 'tensile_modulus',
  aliasTokens: ['tensile_modulus', 'tensile'],
});

const properties = [tg, tensile];

describe('parseQuery', () => {
  it('returns an empty array for empty input', () => {
    expect(parseQuery('', properties)).toEqual([]);
    expect(parseQuery('   ', properties)).toEqual([]);
  });

  it('parses a comparison token with each operator', () => {
    expect(parseQuery('tg>100', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '>', value: 100 },
    ]);
    expect(parseQuery('tg>=100', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '>=', value: 100 },
    ]);
    expect(parseQuery('tg<100', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '<', value: 100 },
    ]);
    expect(parseQuery('tg<=100', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '<=', value: 100 },
    ]);
    expect(parseQuery('tg=100', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '=', value: 100 },
    ]);
  });

  it('parses a negative and a decimal comparison value', () => {
    expect(parseQuery('tg>-40', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '>', value: -40 },
    ]);
    expect(parseQuery('tg>100.5', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '>', value: 100.5 },
    ]);
  });

  it('parses a two-token range ("alias min-max")', () => {
    expect(parseQuery('tensile 40-80', properties)).toEqual([
      { kind: 'range', propertyKey: 'tensile_strength', min: 40, max: 80 },
    ]);
  });

  it('parses a glued range ("alias=min-max")', () => {
    expect(parseQuery('tg=100-160', properties)).toEqual([
      { kind: 'range', propertyKey: 'tg', min: 100, max: 160 },
    ]);
  });

  it('parses a range with negative and decimal bounds', () => {
    expect(parseQuery('tensile -20--5', properties)).toEqual([
      { kind: 'range', propertyKey: 'tensile_strength', min: -20, max: -5 },
    ]);
    expect(parseQuery('tensile 40.5-80.25', properties)).toEqual([
      { kind: 'range', propertyKey: 'tensile_strength', min: 40.5, max: 80.25 },
    ]);
  });

  it('normalizes a range whose min > max by swapping (documented [own call])', () => {
    expect(parseQuery('tensile 80-40', properties)).toEqual([
      { kind: 'range', propertyKey: 'tensile_strength', min: 40, max: 80 },
    ]);
  });

  it('tolerates arbitrary whitespace around and between tokens', () => {
    expect(parseQuery('  tg>100   tensile   40-80  ', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '>', value: 100 },
      { kind: 'range', propertyKey: 'tensile_strength', min: 40, max: 80 },
    ]);
  });

  it('prefers the full key over a shorter alias that is its own prefix', () => {
    // "tensile" is a shared alias between tensile_strength and
    // tensile_modulus in this fixture; the full key always disambiguates.
    const both = [tensile, tensileModulus];
    expect(parseQuery('tensile_modulus>10', both)).toEqual([
      { kind: 'comparison', propertyKey: 'tensile_modulus', op: '>', value: 10 },
    ]);
    expect(parseQuery('tensile_strength>10', both)).toEqual([
      { kind: 'comparison', propertyKey: 'tensile_strength', op: '>', value: 10 },
    ]);
    // The short, colliding alias resolves to whichever property registered
    // it first (first-wins map, business-rules.md's documented limit).
    expect(parseQuery('tensile>10', both)).toEqual([
      { kind: 'comparison', propertyKey: 'tensile_strength', op: '>', value: 10 },
    ]);
  });

  it('reports an unrecognized alias', () => {
    expect(parseQuery('bogus>100', properties)).toEqual([
      { kind: 'unrecognized', raw: 'bogus>100' },
    ]);
  });

  it('reports a real property name with no numeric part as unrecognized', () => {
    expect(parseQuery('tg', properties)).toEqual([{ kind: 'unrecognized', raw: 'tg' }]);
    expect(parseQuery('tensile', properties)).toEqual([
      { kind: 'unrecognized', raw: 'tensile' },
    ]);
  });

  it('reports an unparseable number as unrecognized', () => {
    expect(parseQuery('tg>abc', properties)).toEqual([{ kind: 'unrecognized', raw: 'tg>abc' }]);
    expect(parseQuery('tensile abc-def', properties)).toEqual([
      { kind: 'unrecognized', raw: 'tensile' },
      { kind: 'unrecognized', raw: 'abc-def' },
    ]);
  });

  it('reports pure garbage as unrecognized, token by token', () => {
    expect(parseQuery('###@@@ !!!', properties)).toEqual([
      { kind: 'unrecognized', raw: '###@@@' },
      { kind: 'unrecognized', raw: '!!!' },
    ]);
  });

  it('rejects Persian numerals — English tokens and canonical units only (BR4)', () => {
    // Persian digit for "100" glued to a comparison operator.
    expect(parseQuery('tg>۱۰۰', properties)).toEqual([
      { kind: 'unrecognized', raw: 'tg>۱۰۰' },
    ]);
  });

  it('rejects Persian alias names (BR4 — no translated mini-language)', () => {
    expect(parseQuery('دما>100', properties)).toEqual([
      { kind: 'unrecognized', raw: 'دما>100' },
    ]);
  });

  it('matches tokens case-insensitively but keeps the raw casing in results', () => {
    expect(parseQuery('TG>100', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '>', value: 100 },
    ]);
  });

  it('handles a mix of recognized and unrecognized tokens in one query', () => {
    expect(parseQuery('tg>100 bogus tensile 40-80 ???', properties)).toEqual([
      { kind: 'comparison', propertyKey: 'tg', op: '>', value: 100 },
      { kind: 'unrecognized', raw: 'bogus' },
      { kind: 'range', propertyKey: 'tensile_strength', min: 40, max: 80 },
      { kind: 'unrecognized', raw: '???' },
    ]);
  });

  it('treats a bare alias followed by a non-range token as two separate unrecognized/valid tokens', () => {
    // "tensile" alone (no trailing range) followed by an unrelated token —
    // "tensile" itself has no numeric part so it is unrecognized on its own,
    // and the next token is parsed independently.
    expect(parseQuery('tensile tg>100', properties)).toEqual([
      { kind: 'unrecognized', raw: 'tensile' },
      { kind: 'comparison', propertyKey: 'tg', op: '>', value: 100 },
    ]);
  });
});
