// FE-6: N-way compare table (CR16, uncapped). Hydrated client:load — the
// subject picker, application picker and sort toggle all need JS
// immediately, same posture SearchIsland took for its own controls.
//
// Two async layers, deliberately not one: `fetchSearchIndex` (FE-5's static
// JSON, DataBoundary's outer boundary — this is what names materials/grade
// classes and powers the add-subject picker, and supplies CR8's observed
// property ranges) and `fetchCompareData` (the per-selection API call, its
// own inner loading/error state below) — the outer one rarely fails or
// changes after mount, the inner one refetches whenever the SUBJECT list
// changes. `applicationKey` deliberately does NOT retrigger a fetch:
// `GET /api/compare` returns every application's polarity rules in one
// response (api/src/routes/compare.ts), so picking a different application
// is a pure client-side re-lookup (`polarityByRowKeyFor`), not a new
// round trip.
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Locale } from '../i18n/config';
import { t } from '../i18n/t';
import { DataBoundary } from '../components/states/DataBoundary';
import { fetchSearchIndex, type SearchIndexData } from '../components/search/fetch-index';
import {
  fetchCompareData,
  polarityByRowKeyFor,
  type CompareData,
} from '../components/compare/fetch-compare';
import { SubjectPicker } from '../components/compare/SubjectPicker';
import { ApplicationPicker } from '../components/compare/ApplicationPicker';
import { CompareTable } from '../components/compare/CompareTable';
import { decodeCompareState, encodeCompareState } from '../lib/compare/url-state';
import { filterHiddenRows, sortRows } from '../lib/compare/ordering';
import type { CompareSortMode } from '../lib/compare/types';

interface CompareIslandProps {
  locale: Locale;
  /** BR7-equivalent handoff: CompareHandoffButton.tsx's `?add=slug1,slug2`.
   * Same R23 static-build caveat SearchIsland's `prefillSlug` documents —
   * this prop is forward-compatible but not the real source under today's
   * build; the island falls back to reading `location.search` itself. */
  addSlugs?: string[];
}

export default function CompareIsland({ locale, addSlugs }: CompareIslandProps) {
  return (
    <DataBoundary<SearchIndexData>
      locale={locale}
      fetcher={fetchSearchIndex}
      isEmpty={(d) => d.materials.length === 0}
    >
      {(index) => <CompareApp index={index} locale={locale} addSlugs={addSlugs ?? []} />}
    </DataBoundary>
  );
}

type CompareStatus =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: CompareData };

function CompareApp({
  index,
  locale,
  addSlugs,
}: {
  index: SearchIndexData;
  locale: Locale;
  addSlugs: string[];
}) {
  const [subjectRefs, setSubjectRefs] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const params = new URL(window.location.href).searchParams;
    const decoded = decodeCompareState(params);
    if (decoded.subjectRefs.length > 0) return decoded.subjectRefs;
    // R13's handoff caveat, same one SearchIsland's `prefillSlug` documents:
    // `?add=` only ever applies when there is no real `subjects` state to
    // restore yet (a shared/bookmarked compare URL always wins).
    const addParam = params.get('add');
    if (addParam) return addParam.split(',').filter((s) => s !== '');
    return addSlugs;
  });

  const [applicationKey, setApplicationKey] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return decodeCompareState(new URL(window.location.href).searchParams).applicationKey;
  });

  const [sortMode, setSortMode] = useState<CompareSortMode>(() => {
    if (typeof window === 'undefined') return 'difference';
    return decodeCompareState(new URL(window.location.href).searchParams).sortMode;
  });

  const [hideIdenticalRows, setHideIdenticalRows] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return decodeCompareState(new URL(window.location.href).searchParams).hideIdenticalRows;
  });

  const [status, setStatus] = useState<CompareStatus>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: 'loading' });
    fetchCompareData(subjectRefs, index).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setStatus({ kind: 'error', message: result.error.message });
        return;
      }
      setStatus({ kind: 'ready', data: result.data });
    });
    return () => {
      cancelled = true;
    };
  }, [subjectRefs, index]);

  // R13/CR17: every state change updates the URL via history.replaceState.
  const compareState = useMemo(
    () => ({ subjectRefs, applicationKey, sortMode, hideIdenticalRows }),
    [subjectRefs, applicationKey, sortMode, hideIdenticalRows],
  );
  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = encodeCompareState(compareState).toString();
    window.history.replaceState(null, '', url);
  }, [compareState]);

  // CR7: "rows should visibly settle into their new order when toggled."
  // View Transitions (feature-detected, no polyfill/library -- R24) animate
  // each <tr>'s `view-transition-name` (set in CompareTable.tsx) between its
  // old and new position automatically. `flushSync` forces the state update
  // to commit synchronously inside the transition callback, which the API
  // requires to capture an accurate "after" snapshot. Falls straight back to
  // a plain `setSortMode` with no animation at all where unsupported --
  // never a hand-rolled transform loop duplicating what the browser already
  // does. `prefers-reduced-motion` is handled entirely in compare.css
  // (`::view-transition-*` collapsed to `animation: none`), not here — same
  // split every other animated surface in this app uses (tokens/motion.css).
  function changeSortMode(mode: CompareSortMode) {
    const doc =
      typeof document !== 'undefined'
        ? (document as Document & { startViewTransition?: (cb: () => void) => void })
        : undefined;
    if (doc?.startViewTransition) {
      doc.startViewTransition(() => flushSync(() => setSortMode(mode)));
    } else {
      setSortMode(mode);
    }
  }

  function handleAdd(ref: string) {
    setSubjectRefs((prev) => (prev.includes(ref) ? prev : [...prev, ref]));
  }
  function handleRemove(ref: string) {
    setSubjectRefs((prev) => prev.filter((r) => r !== ref));
  }
  function handleClear() {
    setSubjectRefs([]);
  }

  // `status.data.rows` is ALWAYS held in the canonical (property-group)
  // order the API returned it in — `sortRows`/`filterHiddenRows` are called
  // fresh from that canonical array on every render, never chained onto a
  // previously-sorted result. This is the contract `ordering.ts` documents:
  // 'grouped' is an identity copy, not a re-derivation, so the source array
  // must never itself be the shuffled one.
  const displayedRows = useMemo(() => {
    if (status.kind !== 'ready') return [];
    const sorted = sortRows(status.data.rows, sortMode);
    return filterHiddenRows(sorted, hideIdenticalRows);
  }, [status, sortMode, hideIdenticalRows]);

  const subjects = status.kind === 'ready' ? status.data.subjects : [];
  const applications = status.kind === 'ready' ? status.data.applications : [];

  // CR4/CR5 — a pure client-side re-lookup on `applicationKey` change, not a
  // refetch (see the module comment). `displayedRows`, not the full
  // `status.data.rows`, so a hidden/reordered row's polarity is never
  // computed for nothing.
  const polarityByRowKey = useMemo(() => {
    if (status.kind !== 'ready') return new Map();
    return polarityByRowKeyFor(displayedRows, status.data.polarityRules, applicationKey);
  }, [status, displayedRows, applicationKey]);

  return (
    <div className="cmp-app">
      <SubjectPicker
        index={index}
        subjects={subjects}
        subjectRefs={subjectRefs}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onClear={handleClear}
        locale={locale}
      />

      {subjectRefs.length < 2 ? (
        <div className="cmp-start-prompt" data-testid="compare-start-prompt">
          {subjectRefs.length === 0
            ? t(locale, 'compare.startPrompt')
            : t(locale, 'compare.onePrompt')}
        </div>
      ) : (
        <>
          <div className="cmp-controls">
            <ApplicationPicker
              applications={applications}
              applicationKey={applicationKey}
              onChange={setApplicationKey}
              locale={locale}
            />

            <div className="cmp-sort" data-testid="compare-sort-toggle">
              <span className="cmp-sort-label">{t(locale, 'compare.sortLabel')}</span>
              <div
                className="cmp-sort-buttons"
                role="group"
                aria-label={t(locale, 'compare.sortLabel')}
              >
                <button
                  type="button"
                  className={
                    sortMode === 'difference' ? 'cmp-sort-btn cmp-sort-btn-on' : 'cmp-sort-btn'
                  }
                  aria-pressed={sortMode === 'difference'}
                  onClick={() => changeSortMode('difference')}
                  data-testid="compare-sort-difference"
                >
                  {t(locale, 'compare.sortDifference')}
                </button>
                <button
                  type="button"
                  className={
                    sortMode === 'grouped' ? 'cmp-sort-btn cmp-sort-btn-on' : 'cmp-sort-btn'
                  }
                  aria-pressed={sortMode === 'grouped'}
                  onClick={() => changeSortMode('grouped')}
                  data-testid="compare-sort-grouped"
                >
                  {t(locale, 'compare.sortGrouped')}
                </button>
              </div>

              <label className="cmp-hide-identical">
                <input
                  type="checkbox"
                  checked={hideIdenticalRows}
                  onChange={(e) => setHideIdenticalRows(e.target.checked)}
                  data-testid="compare-hide-identical"
                />
                {t(locale, 'compare.hideIdentical')}
              </label>
            </div>
          </div>

          {status.kind === 'loading' ? (
            <div className="state-loading" role="status" aria-live="polite">
              <span className="state-spinner" aria-hidden="true" />
              <span>{t(locale, 'state.loading')}</span>
            </div>
          ) : status.kind === 'error' ? (
            <div className="state-error" role="alert" data-testid="compare-table-error">
              <p className="state-error-title">{t(locale, 'state.error.title')}</p>
              <p>{status.message}</p>
            </div>
          ) : (
            <CompareTable
              rows={displayedRows}
              subjects={subjects}
              polarityByRowKey={polarityByRowKey}
              applicationKey={applicationKey}
              locale={locale}
            />
          )}
        </>
      )}
    </div>
  );
}
