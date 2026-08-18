// BR11: zero primary results reuses the *copy and CSS class* of the
// existing EmptyState family (R4) -- not a new empty-state variant. The
// literal `.astro` component can't be imported into a React island (Astro
// components never hydrate), so this mirrors DataBoundary.tsx's own
// established pattern of sharing the `.state-empty` classname/copy key
// across the two template runtimes instead (see DataBoundary.tsx's
// comment and web/README.md).
//
// [own call, deviation from a literal reading of BR11] `search()` returns
// `{primary: [], nearMisses: []}` whenever zero filters are active at all
// (match.ts's own documented choice -- "nothing is shown until the reader
// picks at least one filter"). That is a *different* situation from "the
// reader filtered and nothing matched": nothing is missing from the data in
// the cold-load case, the reader just hasn't asked a question yet, so
// BR11's "no data yet" EmptyState copy ("Nothing to show here") would be
// actively misleading there. EmptyState is now reserved strictly for
// "filters active, zero matches"; a distinct `search.startPrompt` invites
// the reader to move a slider or type a query instead. BR11 itself (reuse
// EmptyState's copy/class, not a bespoke component, for the true empty
// case) is honoured as written -- this only narrows *when* that case
// applies.
//
// BR5a: near misses render as a CLEARLY SEPARATED secondary set below the
// primary list -- never interleaved, never affecting primary order. Zero
// near misses renders nothing at all, not an empty heading.
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import type { MissingDataResult, NearMissResult, SearchIndexProperty, SearchResult } from '../../lib/search/types';
import { SearchResultCard } from './SearchResultCard';
import { propertyName } from './format';

interface ResultsListProps {
  primary: SearchResult[];
  nearMisses: NearMissResult[];
  /** Item 4 of the filter-persistence fix: subjects hard-excluded because
   * they carry no recorded value at all for one of the active filters
   * (BR2+BR5, unchanged) -- previously a silent drop, now a disclosed,
   * collapsible group instead of a name that just stopped appearing. */
  missingData: MissingDataResult[];
  properties: SearchIndexProperty[];
  locale: Locale;
  /** Whether any slider or recognized text token is currently constraining
   * the result set -- distinguishes "cold load, nothing asked yet" from
   * "filtered down to zero", see the module comment above. */
  hasActiveFilters: boolean;
}

export function ResultsList({
  primary,
  nearMisses,
  missingData,
  properties,
  locale,
  hasActiveFilters,
}: ResultsListProps) {
  const propertyByKey = new Map(properties.map((p) => [p.key, p]));
  return (
    <div className="search-results" data-testid="search-results-list">
      <h2 className="search-panel-heading">
        {t(locale, 'search.resultsHeading')}
        <span className="search-results-count">
          {' '}
          — {t(locale, 'search.resultsCount').replace('{count}', String(primary.length))}
        </span>
      </h2>

      {primary.length === 0 && !hasActiveFilters ? (
        <div className="search-start-prompt" data-testid="search-results-start-prompt">
          {t(locale, 'search.startPrompt')}
        </div>
      ) : primary.length === 0 ? (
        <div className="state-empty" data-testid="search-results-empty">
          {t(locale, 'state.empty')}
        </div>
      ) : (
        <div className="search-result-grid" data-testid="search-results-primary">
          {primary.map((result) => (
            <SearchResultCard
              key={`${result.material.slug}:${result.gradeClass?.key ?? ''}`}
              result={result}
              properties={properties}
              locale={locale}
            />
          ))}
        </div>
      )}

      {nearMisses.length > 0 ? (
        <div className="search-near-misses" data-testid="search-results-near-misses">
          <h3 className="search-panel-heading search-near-heading">{t(locale, 'search.nearMissHeading')}</h3>
          <div className="search-result-grid search-result-grid-near">
            {nearMisses.map((result) => (
              <SearchResultCard
                key={`near:${result.material.slug}:${result.gradeClass?.key ?? ''}`}
                result={result}
                properties={properties}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ) : null}

      {missingData.length > 0 ? (
        <details className="search-missing-data" data-testid="search-results-missing-data">
          <summary className="search-missing-data-summary">
            {t(locale, 'search.missingDataSummary').replace('{count}', String(missingData.length))}
          </summary>
          <ul className="search-missing-data-list">
            {missingData.map((result) => {
              const subject = result.gradeClass ?? result.material;
              const name = locale === 'fa' ? subject.nameFa : subject.nameEn;
              const propertyNames = result.missingProperties
                .map((key) => {
                  const property = propertyByKey.get(key);
                  return property ? propertyName(property, locale) : key;
                })
                .join(t(locale, 'search.listSeparator'));
              return (
                <li
                  key={`missing:${result.material.slug}:${result.gradeClass?.key ?? ''}`}
                  className="search-missing-data-item"
                  data-testid={`search-missing-data-item-${result.gradeClass ? `${result.material.slug}-${result.gradeClass.key}` : result.material.slug}`}
                >
                  <span className="search-missing-data-name">{name}</span>
                  <span className="search-missing-data-reason">
                    {t(locale, 'search.missingDataReason').replace('{properties}', propertyNames)}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
