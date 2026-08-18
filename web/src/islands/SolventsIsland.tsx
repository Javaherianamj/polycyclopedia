// FE-8 step 4 — the solvent datasheet (owner's words: "a solvent page too
// as a datasheet of solvents (all in one) ... lets begin with all we have
// on this pdf about them and show this"). One reference table, searchable
// and sortable, over every row `GET /api/solvents` returns — not a
// per-solvent route; that is explicitly the "deepen it later" part the
// owner deferred.
//
// Closest sibling this was built against: SourcesIsland (site-wide
// bibliography) — same DataBoundary/search/URL-state shape. What's new here
// is virtualisation: at ~700 rows, rendering every <tr> at once is exactly
// what the brief warned against, so only the rows in (and just outside) the
// scroll viewport are ever in the DOM. `.sv-table-scroll` is the ONE element
// that scrolls, in both directions (R27's "no page-level horizontal
// overflow", extended here to also carry the vertical scroll rather than
// growing the page to 700 rows tall).
import { useMemo, useRef, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t } from '../i18n/t';
import { DataBoundary } from '../components/states/DataBoundary';
import { fetchSolvents } from '../lib/solvents/fetch-solvents';
import type { Solvent } from '../lib/solvents/types';

interface SolventsIslandProps {
  locale: Locale;
}

// Type alias for the same esbuild-JSX-generic-parsing reason SourcesIsland
// documents: `<DataBoundary<Solvent[]> ...>` silently drops the element.
type SolventList = Solvent[];

export default function SolventsIsland({ locale }: SolventsIslandProps) {
  return (
    <DataBoundary<SolventList>
      locale={locale}
      fetcher={fetchSolvents}
      isEmpty={(d) => d.length === 0}
    >
      {(solvents) => <SolventsApp solvents={solvents} locale={locale} />}
    </DataBoundary>
  );
}

type SortKey = 'name' | 'hansenD' | 'hansenP' | 'hansenH' | 'molarVolume';
type SortDir = 'asc' | 'desc';

const ROW_HEIGHT = 44;
const VIEWPORT_HEIGHT = 560;
const OVERSCAN = 10;

function displayName(s: Solvent, locale: Locale): string {
  // R7/honesty: nameFa is NULL for almost every row (the handbook import
  // does not machine-translate ~700 chemical names) — fall back to the
  // English name rather than render an empty cell.
  if (locale === 'fa') return s.nameFa ?? s.nameEn;
  return s.nameEn;
}

function sortValue(s: Solvent, key: SortKey, locale: Locale): string | number {
  switch (key) {
    case 'name':
      return displayName(s, locale).toLowerCase();
    case 'hansenD':
      return s.hansenD;
    case 'hansenP':
      return s.hansenP;
    case 'hansenH':
      return s.hansenH;
    case 'molarVolume':
      // Nulls sort last regardless of direction — a missing molar volume
      // is not "small", it is absent.
      return s.molarVolume ?? Number.POSITIVE_INFINITY;
  }
}

function SolventsApp({ solvents, locale }: { solvents: Solvent[]; locale: Locale }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? solvents.filter((s) => {
          return (
            s.nameEn.toLowerCase().includes(q) ||
            (s.nameFa ?? '').toLowerCase().includes(q) ||
            (s.systematicName ?? '').toLowerCase().includes(q) ||
            (s.casNumber ?? '').toLowerCase().includes(q)
          );
        })
      : solvents;

    const sorted = [...rows].sort((a, b) => {
      const av = sortValue(a, sortKey, locale);
      const bv = sortValue(b, sortKey, locale);
      let cmp: number;
      if (typeof av === 'string' && typeof bv === 'string') {
        cmp = av.localeCompare(bv, locale);
      } else {
        cmp = (av as number) - (bv as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [solvents, query, sortKey, sortDir, locale]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }

  const total = filtered.length;
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(total, startIndex + visibleCount);
  const visibleRows = filtered.slice(startIndex, endIndex);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = Math.max(0, (total - endIndex) * ROW_HEIGHT);

  const columns: {
    key: SortKey;
    labelKey:
      | 'solvents.columnName'
      | 'solvents.columnHansenD'
      | 'solvents.columnHansenP'
      | 'solvents.columnHansenH'
      | 'solvents.columnMolarVolume';
  }[] = [
    { key: 'name', labelKey: 'solvents.columnName' },
    { key: 'hansenD', labelKey: 'solvents.columnHansenD' },
    { key: 'hansenP', labelKey: 'solvents.columnHansenP' },
    { key: 'hansenH', labelKey: 'solvents.columnHansenH' },
    { key: 'molarVolume', labelKey: 'solvents.columnMolarVolume' },
  ];

  return (
    <div className="sv-app">
      <div className="sv-controls">
        <input
          type="search"
          className="sv-search"
          placeholder={t(locale, 'solvents.searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setScrollTop(0);
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
          }}
          data-testid="solvents-search-input"
        />
        <p className="sv-row-count" data-testid="solvents-row-count">
          {t(locale, 'solvents.rowCount')
            .replace('{shown}', String(total))
            .replace('{total}', String(solvents.length))}
        </p>
      </div>

      {total === 0 ? (
        <div className="state-empty" data-testid="solvents-list-empty">
          {t(locale, 'solvents.noMatches')}
        </div>
      ) : (
        <div
          className="sv-table-scroll"
          ref={scrollRef}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          style={{ maxBlockSize: VIEWPORT_HEIGHT }}
          data-testid="solvents-table-scroll"
        >
          <table className="sv-table" data-testid="solvents-table">
            <caption className="sr-only">{t(locale, 'solvents.tableCaption')}</caption>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} scope="col">
                    <button
                      type="button"
                      className="sv-sort-btn"
                      onClick={() => toggleSort(col.key)}
                      aria-pressed={sortKey === col.key}
                      data-testid={`solvents-sort-${col.key}`}
                    >
                      {t(locale, col.labelKey)}
                      {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
                <th scope="col">{t(locale, 'solvents.columnSystematicName')}</th>
                <th scope="col">{t(locale, 'solvents.columnCas')}</th>
                <th scope="col">{t(locale, 'solvents.columnProvenance')}</th>
              </tr>
            </thead>
            <tbody>
              {topSpacer > 0 && (
                <tr aria-hidden="true" style={{ blockSize: topSpacer }}>
                  <td colSpan={8} style={{ padding: 0, border: 0 }} />
                </tr>
              )}
              {visibleRows.map((s) => (
                <tr
                  key={s.key}
                  data-testid={`solvents-row-${s.key}`}
                  style={{ blockSize: ROW_HEIGHT }}
                >
                  <th scope="row" className="sv-cell-name">
                    {displayName(s, locale)}
                  </th>
                  <td dir="ltr" className="sv-cell-num num">
                    {s.hansenD.toFixed(1)}
                  </td>
                  <td dir="ltr" className="sv-cell-num num">
                    {s.hansenP.toFixed(1)}
                  </td>
                  <td dir="ltr" className="sv-cell-num num">
                    {s.hansenH.toFixed(1)}
                  </td>
                  <td dir="ltr" className="sv-cell-num num">
                    {s.molarVolume != null ? s.molarVolume.toFixed(1) : '—'}
                  </td>
                  <td className="sv-cell-systematic">{s.systematicName ?? '—'}</td>
                  <td dir="ltr" className="sv-cell-cas num">
                    {s.casNumber ?? '—'}
                  </td>
                  <td>
                    <span
                      className={s.cited ? 'src-mark src-mark-cited' : 'src-mark src-mark-uncited'}
                    >
                      {t(locale, s.cited ? 'value.sourced' : 'value.uncited')}
                    </span>
                  </td>
                </tr>
              ))}
              {bottomSpacer > 0 && (
                <tr aria-hidden="true" style={{ blockSize: bottomSpacer }}>
                  <td colSpan={8} style={{ padding: 0, border: 0 }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
