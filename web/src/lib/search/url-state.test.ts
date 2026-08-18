import { describe, expect, it } from 'vitest';
import { decodeSearchState, encodeSearchState, getPrefillSlug } from './url-state';
import { parseQuery } from './parse-query';
import { tokenToFilter } from '../../components/search/query-filters';
import type { SearchIndexProperty, SearchState } from './types';

function state(overrides: Partial<SearchState> = {}): SearchState {
  return { filters: [], rawQueryText: '', unrecognizedTokens: [], ...overrides };
}

describe('encodeSearchState', () => {
  it('encodes an empty state as empty params', () => {
    const params = encodeSearchState(state());
    expect([...params.entries()]).toEqual([]);
  });

  it('encodes one param per active filter as "propertyKey=min-max"', () => {
    const params = encodeSearchState(
      state({ filters: [{ propertyKey: 'tg', min: 100, max: 160 }] }),
    );
    expect(params.get('tg')).toBe('100-160');
  });

  it('encodes negative and decimal bounds', () => {
    const params = encodeSearchState(
      state({ filters: [{ propertyKey: 'tg', min: -20, max: -5.5 }] }),
    );
    expect(params.get('tg')).toBe('-20--5.5');
  });

  it('carries the raw query text verbatim under q', () => {
    const params = encodeSearchState(state({ rawQueryText: 'tg>100 bogus' }));
    expect(params.get('q')).toBe('tg>100 bogus');
  });

  it('omits q entirely when rawQueryText is empty', () => {
    const params = encodeSearchState(state({ rawQueryText: '' }));
    expect(params.has('q')).toBe(false);
  });
});

describe('decodeSearchState', () => {
  it('decodes an empty params into an empty state', () => {
    const result = decodeSearchState(new URLSearchParams());
    expect(result).toEqual({ filters: [], rawQueryText: '', unrecognizedTokens: [] });
  });

  it('decodes a "min-max" param back into a filter', () => {
    const params = new URLSearchParams('tg=100-160');
    const result = decodeSearchState(params);
    expect(result.filters).toEqual([{ propertyKey: 'tg', min: 100, max: 160 }]);
  });

  it('decodes negative and decimal bounds', () => {
    const params = new URLSearchParams();
    params.set('tg', '-20--5.5');
    const result = decodeSearchState(params);
    expect(result.filters).toEqual([{ propertyKey: 'tg', min: -20, max: -5.5 }]);
  });

  it('recovers q verbatim, including text that would surface unrecognized-token hints', () => {
    const params = new URLSearchParams();
    params.set('q', 'tg>100 bogus');
    const result = decodeSearchState(params);
    expect(result.rawQueryText).toBe('tg>100 bogus');
    // unrecognizedTokens is derived, not URL-persisted — see module doc.
    expect(result.unrecognizedTokens).toEqual([]);
  });

  it('ignores the reserved q and from keys when building filters', () => {
    const params = new URLSearchParams();
    params.set('q', 'tg>100');
    params.set('from', 'ldpe');
    params.set('tg', '100-160');
    const result = decodeSearchState(params);
    expect(result.filters).toEqual([{ propertyKey: 'tg', min: 100, max: 160 }]);
  });

  it('skips a malformed range param instead of throwing', () => {
    const params = new URLSearchParams();
    params.set('tg', 'not-a-range');
    params.set('tensile_strength', '40-80');
    const result = decodeSearchState(params);
    expect(result.filters).toEqual([{ propertyKey: 'tensile_strength', min: 40, max: 80 }]);
  });
});

// SearchIsland must only ever pass this module SLIDER-origin filters when
// syncing the URL, never the merged `[...sliderFilters, ...textFilters]`
// it hands to `search()`. Found while verifying the "full range means no
// filter" fix, live in the running app: encoding the merged set wrote a
// `propertyKey=min-max` param for a *text-derived* filter too (typing
// `tg>100` also wrote `tg=100-120`, indistinguishable in the URL from a
// real slider drag). On the next load `decodeSearchState` can't tell the
// two apart, so that `tg` param was read back as a genuine slider entry —
// it got a chip and a reset button the reader never earned by touching the
// tg slider, and clicking that chip's "x" deleted the fabricated
// `sliderFilters.tg` entry while `rawQueryText` (still `"tg>100"`)
// regenerated the identical constraint on the very next render. The chip
// visibly disappeared; the filter it claimed to remove kept working. This
// suite pins the contract the fix relies on: encode only the caller's own
// slider map, let `q` be the single source of truth for anything
// text-derived, and prove the round trip still reconstructs the exact same
// effective constraint through re-parsing rather than a redundant param.
describe('URL sync contract: text-derived filters must not get their own range param', () => {
  const tg: SearchIndexProperty = {
    key: 'tg',
    nameFa: 'دمای انتقال شیشه‌ای',
    nameEn: 'Glass Transition Temperature',
    symbol: 'Tg',
    unit: '°C',
    dataType: 'numeric',
    observedMin: -120,
    observedMax: 120,
    aliasTokens: ['tg'],
  };
  const density: SearchIndexProperty = {
    key: 'density',
    nameFa: 'چگالی',
    nameEn: 'Density',
    symbol: null,
    unit: 'g/cm³',
    dataType: 'numeric',
    observedMin: 0.895,
    observedMax: 1.4,
    aliasTokens: ['density'],
  };
  const properties = [tg, density];

  it('omits a range param for a property only a text token constrains', () => {
    // Simulates SearchIsland exactly: one real slider filter (density) plus
    // a text query that also constrains tg -- but tg was never dragged, so
    // it must never appear in `sliderFilters`.
    const sliderFilters = { density: { propertyKey: 'density', min: 0.9, max: 1.4 } };
    const rawQueryText = 'tg>100';

    const params = encodeSearchState({
      filters: Object.values(sliderFilters),
      rawQueryText,
      unrecognizedTokens: [],
    });

    expect(params.get('density')).toBe('0.9-1.4');
    expect(params.has('tg')).toBe(false); // the bug: this used to be "100-120"
    expect(params.get('q')).toBe('tg>100');
  });

  it('a reload from that URL reconstructs the same effective tg constraint via q, not a fabricated slider entry', () => {
    const params = new URLSearchParams();
    params.set('density', '0.9-1.4');
    params.set('q', 'tg>100');

    const decoded = decodeSearchState(params);
    // What SearchIsland seeds `sliderFilters` from — must NOT contain tg.
    expect(decoded.filters).toEqual([{ propertyKey: 'density', min: 0.9, max: 1.4 }]);

    // What SearchIsland recomputes `textFilters` from every render — DOES
    // still produce the tg constraint, so nothing is lost from the shared
    // URL (R13) even though it isn't a standalone param.
    const textFilters = parseQuery(decoded.rawQueryText, properties)
      .map((tok) => tokenToFilter(tok, properties))
      .filter((f): f is NonNullable<typeof f> => f !== null);
    expect(textFilters).toEqual([{ propertyKey: 'tg', min: 100, max: 120 }]);
  });
});

describe('getPrefillSlug', () => {
  it('reads the from param', () => {
    const params = new URLSearchParams('from=ldpe');
    expect(getPrefillSlug(params)).toBe('ldpe');
  });

  it('returns undefined when absent', () => {
    expect(getPrefillSlug(new URLSearchParams())).toBeUndefined();
  });
});

describe('round-trip: encode(decode(x)) === x, over a spread of states', () => {
  const cases: SearchState[] = [
    state(),
    state({ filters: [{ propertyKey: 'tg', min: 100, max: 160 }] }),
    state({
      filters: [
        { propertyKey: 'tg', min: 100, max: 160 },
        { propertyKey: 'tensile_strength', min: 40, max: 80 },
      ],
    }),
    state({ filters: [{ propertyKey: 'tg', min: -40.5, max: -5.25 }] }),
    state({ rawQueryText: 'tg>100 tensile 40-80' }),
    state({
      filters: [{ propertyKey: 'tg', min: 100, max: 160 }],
      rawQueryText: 'tg>100 bogus ???',
    }),
    state({ filters: [{ propertyKey: 'density', min: 0, max: 0 }] }), // zero-span filter
  ];

  for (const original of cases) {
    it(`round-trips: filters=${JSON.stringify(original.filters)} q=${JSON.stringify(original.rawQueryText)}`, () => {
      const decoded = decodeSearchState(encodeSearchState(original));
      expect(decoded.filters).toEqual(original.filters);
      expect(decoded.rawQueryText).toBe(original.rawQueryText);
    });
  }

  it('decode -> encode reproduces the same params for well-formed input', () => {
    const params = new URLSearchParams();
    params.set('tg', '100-160');
    params.set('tensile_strength', '40-80');
    params.set('q', 'tg>100 tensile 40-80');
    const roundTripped = encodeSearchState(decodeSearchState(params));

    const originalEntries = [...params.entries()].sort();
    const roundTrippedEntries = [...roundTripped.entries()].sort();
    expect(roundTrippedEntries).toEqual(originalEntries);
  });
});
