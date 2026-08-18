// FE-5: property-first search. Hydrated client:load (sliders + text need
// JS immediately) -- frontend-components.md's component hierarchy.
//
// R38 posture: an island may replace a number, never be the only source of
// one -- here the "number" is the whole index, streamed in after hydration
// (BR12), not blocking first paint.
import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '../i18n/config';
import { DataBoundary } from '../components/states/DataBoundary';
import { fetchSearchIndex, type SearchIndexData } from '../components/search/fetch-index';
import { PropertySliderPanel } from '../components/search/PropertySliderPanel';
import { QueryTextBox } from '../components/search/QueryTextBox';
import { ResultsList } from '../components/search/ResultsList';
import { CompareHandoffButton } from '../components/search/CompareHandoffButton';
import { buildPrefillFilters, tokenToFilter } from '../components/search/query-filters';
import { parseQuery } from '../lib/search/parse-query';
import { search } from '../lib/search/match';
import { decodeSearchState, encodeSearchState, getPrefillSlug } from '../lib/search/url-state';
import { applySliderChange, clearSliderFilter } from '../lib/search/slider-filters';
import type { ActiveFilter } from '../lib/search/types';

interface SearchIslandProps {
  locale: Locale;
  /**
   * BR13's `from` slug. frontend-components.md specifies the page reads
   * this server-side and passes it down so the island "never parses the
   * URL for it" -- verified against the running dev server that this
   * project's actual config (`output: 'static'`, no adapter, R23) makes
   * that impossible: `Astro.url` carries no query string at all, even
   * per-request in `astro dev` (there is no server-rendered request to
   * read one from -- every route, dev or build, is prerendered). The prop
   * is kept for forward-compatibility (an adapter would make it correct
   * again) but is not the source of truth today: this component falls
   * back to reading `from` from `location.search` itself via
   * `getPrefillSlug` (url-state.ts, already built for exactly this) when
   * the prop comes back empty, which is the only way BR13 can actually
   * fire under the current static build. [own call — deviation from spec
   * wording, not from the BR13 requirement itself, documented here rather
   * than silently patched around.]
   */
  prefillSlug?: string;
}

export default function SearchIsland({ locale, prefillSlug }: SearchIslandProps) {
  const effectivePrefillSlug =
    prefillSlug || (typeof window !== 'undefined' ? getPrefillSlug(new URL(window.location.href).searchParams) : undefined);

  return (
    <DataBoundary<SearchIndexData>
      locale={locale}
      fetcher={fetchSearchIndex}
      isEmpty={(data) => data.materials.length === 0}
    >
      {(data) => <SearchApp data={data} locale={locale} prefillSlug={effectivePrefillSlug} />}
    </DataBoundary>
  );
}

function SearchApp({
  data,
  locale,
  prefillSlug,
}: {
  data: SearchIndexData;
  locale: Locale;
  prefillSlug?: string;
}) {
  const { materials, gradeClasses, properties } = data;

  // Restored once on mount: a shared URL's own filters win over `?from`'s
  // pre-fill (R13 -- "loading a shared URL reproduces the exact state");
  // `?from` only applies when there's nothing else to restore (BR13).
  const [sliderFilters, setSliderFilters] = useState<Record<string, ActiveFilter>>(() => {
    if (typeof window === 'undefined') return {};
    const decoded = decodeSearchState(new URL(window.location.href).searchParams);
    if (decoded.filters.length > 0) {
      return Object.fromEntries(decoded.filters.map((f) => [f.propertyKey, f]));
    }
    if (prefillSlug) {
      const source = materials.find((m) => m.slug === prefillSlug);
      if (source) {
        const prefilled = buildPrefillFilters(source, properties);
        return Object.fromEntries(prefilled.map((f) => [f.propertyKey, f]));
      }
    }
    return {};
  });

  const [rawQueryText, setRawQueryText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const decoded = decodeSearchState(new URL(window.location.href).searchParams);
    return decoded.rawQueryText;
  });

  const parsedTokens = useMemo(() => parseQuery(rawQueryText, properties), [rawQueryText, properties]);

  const unrecognizedTokens = useMemo(
    () => parsedTokens.filter((tok) => tok.kind === 'unrecognized').map((tok) => tok.raw),
    [parsedTokens],
  );

  const textFilters = useMemo(
    () =>
      parsedTokens
        .map((tok) => tokenToFilter(tok, properties))
        .filter((f): f is ActiveFilter => f !== null),
    [parsedTokens, properties],
  );

  // Reconciliation of same-property duplicates (a slider and a recognized
  // text token both constraining e.g. `tg`) is `search()`'s job
  // (`match.ts`'s `buildEffectiveFilters`, business-logic-model.md §4) --
  // this is deliberately just a flat concatenation, not a second merge step.
  const activeFilters = useMemo(
    () => [...Object.values(sliderFilters), ...textFilters],
    [sliderFilters, textFilters],
  );

  const searchState = useMemo(
    () => ({ filters: activeFilters, rawQueryText, unrecognizedTokens }),
    [activeFilters, rawQueryText, unrecognizedTokens],
  );

  const results = useMemo(
    () => search(searchState, { materials, gradeClasses }, properties),
    [searchState, materials, gradeClasses, properties],
  );

  // R13: every filter change updates the URL via history.replaceState, so a
  // shared/bookmarked URL reproduces the exact state. `from` is consumed
  // once above and never re-serialized (encodeSearchState has no `from`
  // field in its output once real filters exist).
  //
  // SECOND BUG FOUND WHILE VERIFYING THE FIRST ONE: this used to encode
  // `searchState.filters` -- the merged `[...sliderFilters, ...textFilters]`
  // -- which puts a `propertyKey=min-max` param in the URL for a
  // *text-derived* filter too (e.g. typing `tg>100` wrote `tg=100-120`
  // alongside `q=tg%3E100`). `decodeSearchState` can't tell a slider param
  // from a text-shorthand param apart -- nothing in the URL format marks
  // origin -- so on the *next* load that `tg` param was read back as a
  // genuine slider entry and given a chip and a reset button, even though
  // the reader never touched the tg slider. Clicking that chip's "x" then
  // deleted the fabricated `sliderFilters.tg` entry, but did nothing to
  // `rawQueryText` (still `"tg>100"`), so `textFilters` regenerated the
  // exact same tg constraint on the very next render and the URL sync below
  // wrote `tg=100-120` straight back -- the chip visibly disappeared while
  // the filter it claimed to remove kept working. Textbook "silently leaves
  // an invisible constraint active", exactly what the fix brief warned
  // against.
  //
  // THE FIX: encode only `sliderFilters` as range params -- `rawQueryText`
  // (already in `q`) is the single source of truth for text-derived filters,
  // and `parseQuery`/`tokenToFilter` deterministically regenerate the same
  // `tg` filter from it on every load, so nothing is lost from the shared
  // URL (R13 still holds) -- only the *redundant, misattributed* param goes
  // away. This also makes chip provenance correct: `sliderValues` (fed to
  // `PropertySliderPanel`) is built from `sliderFilters` alone, so a chip
  // now appears if and only if the reader can actually make it disappear by
  // clicking it. A filter that came from typed text is only ever removable
  // by editing or clearing the text -- "clear all" (below) does exactly
  // that; per-chip removal deliberately does not pretend to.
  const urlSyncState = useMemo(
    () => ({ filters: Object.values(sliderFilters), rawQueryText, unrecognizedTokens }),
    [sliderFilters, rawQueryText, unrecognizedTokens],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = encodeSearchState(urlSyncState).toString();
    window.history.replaceState(null, '', url);
  }, [urlSyncState]);

  // THE FIX (see slider-filters.ts for the full mechanism and why it was
  // needed): a drag that lands back on the property's full observed range
  // deletes the filter entry instead of writing a full-width one, so
  // "restored" and "never touched" become the exact same state. Needs the
  // property's own observedMin/Max to know what "full range" even means for
  // this key -- looked up from the registry `properties` already holds.
  function handleSliderChange(propertyKey: string, value: { min: number; max: number }) {
    const property = properties.find((p) => p.key === propertyKey);
    setSliderFilters((prev) =>
      property
        ? applySliderChange(prev, propertyKey, value, property)
        : // Defensive fallback: the panel only ever calls onChange for a
          // property it rendered a slider for, so this should be
          // unreachable. If the registry lookup ever does miss, fail toward
          // keeping the reader's just-set constraint rather than silently
          // discarding it.
          { ...prev, [propertyKey]: { propertyKey, ...value } },
    );
  }

  // Per-slider reset control (PropertySlider's "Reset" button) and the
  // chip list's per-chip remove button both call this -- same end state as
  // dragging the slider back to full range, exposed directly so a reader
  // isn't stuck fighting a `<input type=range>` step to land exactly on the
  // boundary by hand.
  function handleSliderClear(propertyKey: string) {
    setSliderFilters((prev) => clearSliderFilter(prev, propertyKey));
  }

  // "Clear all filters": resets every slider AND the text query box, back
  // to the exact cold-load state (`activeFilters.length === 0`,
  // `search.startPrompt` shown) -- the natural complement of "start over",
  // not just "clear the sliders".
  function handleClearAllFilters() {
    setSliderFilters({});
    setRawQueryText('');
  }

  const sliderValues = useMemo(() => {
    const out: Record<string, { min: number; max: number }> = {};
    for (const [key, f] of Object.entries(sliderFilters)) out[key] = { min: f.min, max: f.max };
    return out;
  }, [sliderFilters]);

  const resultSlugs = useMemo(
    () => [...new Set(results.primary.map((r) => r.material.slug))],
    [results.primary],
  );

  return (
    <div className="search-app">
      <QueryTextBox
        value={rawQueryText}
        onChange={setRawQueryText}
        unrecognizedTokens={unrecognizedTokens}
        locale={locale}
      />
      <div className="search-layout">
        <PropertySliderPanel
          properties={properties}
          values={sliderValues}
          onChange={handleSliderChange}
          onClear={handleSliderClear}
          onClearAll={handleClearAllFilters}
          locale={locale}
        />
        <div className="search-main">
          <ResultsList
            primary={results.primary}
            nearMisses={results.nearMisses}
            missingData={results.missingData}
            properties={properties}
            locale={locale}
            hasActiveFilters={activeFilters.length > 0}
          />
          <CompareHandoffButton resultSlugs={resultSlugs} locale={locale} />
        </div>
      </div>
    </div>
  );
}
