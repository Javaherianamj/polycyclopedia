// FE-7 — the site-wide bibliography (D4's "a sources list site-wide").
// Hydrated client:load, same posture as CompareIsland/SearchIsland: this
// page needs no build-time enumeration (unlike the per-material sources
// route, which is static/per-slug), and DataBoundary's real error state
// (with retry) is exactly the right behaviour while `GET /api/sources` is
// still being built by the sibling agent in parallel -- see
// components/sources/fetch-sources.ts's own comment.
//
// R33/D36: tier and kind are shown as plain labels, not a star rating or a
// computed "authority score" -- the data doesn't support inventing a
// ranking, and a rating widget would itself be a claim this unit has no
// basis for. Sort is alphabetical by title, not by tier.
import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '../i18n/config';
import { t, type MessageKey } from '../i18n/t';
import { DataBoundary } from '../components/states/DataBoundary';
import { fetchSources } from '../components/sources/fetch-sources';
import type { SourceSummary } from '../components/sources/types';

interface SourcesIslandProps {
  locale: Locale;
}

function kindLabel(locale: Locale, kind: string): string {
  const key = `sources.kind.${kind}` as MessageKey;
  try {
    return t(locale, key);
  } catch {
    return kind;
  }
}

function tierLabel(locale: Locale, tier: string): string {
  const key = `sources.tier.${tier}` as MessageKey;
  try {
    return t(locale, key);
  } catch {
    return tier;
  }
}

function readUrlState(): { q: string; tier: string } {
  if (typeof window === 'undefined') return { q: '', tier: '' };
  const params = new URL(window.location.href).searchParams;
  return { q: params.get('q') ?? '', tier: params.get('tier') ?? '' };
}

// Type alias, not `SourceSummary[]` written directly as the JSX generic
// argument below -- `<DataBoundary<SourceSummary[]> ...>` parses in plain
// .ts but esbuild's JSX transform (used for this project's .tsx files)
// mis-parses the `[]` inside a JSX opening tag's generic-argument position
// and silently drops the whole element (no diagnostic, no console error --
// found the hard way, verified in the browser: DataBoundary's own render
// never ran). CompareIsland avoids this only because SearchIndexData is
// already a named type, not an inline array -- same root cause, easy to
// hit again, hence this comment.
type SourceList = SourceSummary[];

export default function SourcesIsland({ locale }: SourcesIslandProps) {
  return (
    <DataBoundary<SourceList>
      locale={locale}
      fetcher={fetchSources}
      isEmpty={(d) => d.length === 0}
    >
      {(sources) => <SourcesApp sources={sources} locale={locale} />}
    </DataBoundary>
  );
}

function SourcesApp({ sources, locale }: { sources: SourceSummary[]; locale: Locale }) {
  const [query, setQuery] = useState(() => readUrlState().q);
  const [tier, setTier] = useState(() => readUrlState().tier);

  // R13: search text and tier filter are reflected in the URL so a filtered
  // bibliography view is a shareable/bookmarkable address, same contract
  // CompareIsland's url-state gives the compare table.
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tier) params.set('tier', tier);
    url.search = params.toString();
    window.history.replaceState(null, '', url);
  }, [query, tier]);

  const tiers = useMemo(() => {
    const set = new Set<string>();
    for (const s of sources) set.add(s.tier);
    return [...set].sort();
  }, [sources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources
      .filter((s) => (tier ? s.tier === tier : true))
      .filter((s) => {
        if (!q) return true;
        return (
          s.title.toLowerCase().includes(q) ||
          (s.authors ?? '').toLowerCase().includes(q) ||
          (s.publisher ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title, locale));
  }, [sources, query, tier, locale]);

  return (
    <div className="src-app">
      <div className="src-controls">
        <input
          type="search"
          className="src-search"
          placeholder={t(locale, 'sources.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="sources-search-input"
        />
        <div className="src-tier-chips" role="group" aria-label={t(locale, 'sources.columnTier')}>
          <button
            type="button"
            className={tier === '' ? 'src-tier-chip src-tier-chip-on' : 'src-tier-chip'}
            aria-pressed={tier === ''}
            onClick={() => setTier('')}
            data-testid="sources-tier-all"
          >
            {t(locale, 'sources.filterAllTiers')}
          </button>
          {tiers.map((tierValue) => (
            <button
              key={tierValue}
              type="button"
              className={tier === tierValue ? 'src-tier-chip src-tier-chip-on' : 'src-tier-chip'}
              aria-pressed={tier === tierValue}
              onClick={() => setTier(tierValue)}
              data-testid={`sources-tier-${tierValue}`}
            >
              {tierLabel(locale, tierValue)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="state-empty" data-testid="sources-list-empty">
          {t(locale, 'sources.noMatches')}
        </div>
      ) : (
        <div className="src-table-scroll">
          <table className="src-biblio-table" data-testid="sources-biblio-table">
            <caption className="sr-only">{t(locale, 'sources.tableCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t(locale, 'sources.columnTitle')}</th>
                <th scope="col">{t(locale, 'sources.columnKind')}</th>
                <th scope="col">{t(locale, 'sources.columnTier')}</th>
                <th scope="col">{t(locale, 'sources.columnDocuments')}</th>
                <th scope="col">{t(locale, 'sources.columnValues')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((source) => (
                <tr key={source.id} data-testid={`sources-row-${source.id}`}>
                  <th scope="row" className="src-biblio-title">
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer noopener">
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                    {(source.authors || source.year) && (
                      <span className="src-biblio-meta">
                        {[source.authors, source.year].filter(Boolean).join(' · ')}
                        {source.edition
                          ? ` · ${t(locale, 'value.citation.edition')} ${source.edition}`
                          : ''}
                      </span>
                    )}
                  </th>
                  <td>{kindLabel(locale, source.kind)}</td>
                  <td>{tierLabel(locale, source.tier)}</td>
                  <td dir="ltr">
                    {t(locale, 'sources.documentsCount').replace(
                      '{count}',
                      String(source.documents.length),
                    )}
                  </td>
                  <td dir="ltr">
                    {t(locale, 'sources.valuesSupported').replace(
                      '{count}',
                      String(source.valueCount),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
