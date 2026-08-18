// Reuses MaterialCard's visual language (FE-4, .material-card/.coverage-bar
// tokens from catalog.css) but is not a raw reuse of MaterialCard itself --
// that component has no slot for per-search matched-property display, so
// this is a sibling sharing tokens where they already match
// (frontend-components.md).
//
// BR5b: the reader chose a property to filter on, so that is what the card
// leads with -- the matched properties' actual values render above the
// material name, never buried under a bare name.
// BR6: a grade-class result renders the "LDPE › Film" lockup so it is never
// mistaken for the generic material.
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import type { NearMissResult, SearchIndexProperty, SearchResult } from '../../lib/search/types';
import { formatRange, propertyName } from './format';

// `properties` isn't in the spec's minimal prop list, but matched values
// need the registry to resolve unit/name/symbol for display -- the index's
// per-material `values` map only carries raw numbers ([own call], needed to
// satisfy BR5b's "actual values" requirement at all).
interface SearchResultCardProps {
  result: SearchResult | NearMissResult;
  properties: SearchIndexProperty[];
  locale: Locale;
}

function isNearMiss(result: SearchResult | NearMissResult): result is NearMissResult {
  return 'missedProperty' in result;
}

export function SearchResultCard({ result, properties, locale }: SearchResultCardProps) {
  const { material, gradeClass, matchedProperties } = result;
  const subject = gradeClass ?? material;
  const name = locale === 'fa' ? subject.nameFa : subject.nameEn;
  const materialName = locale === 'fa' ? material.nameFa : material.nameEn;
  const slug = material.slug;
  const near = isNearMiss(result) ? result : null;

  const propertyByKey = new Map(properties.map((p) => [p.key, p]));

  return (
    <a
      className={`search-result-card${near ? ' search-result-card-near' : ''}`}
      href={`/${locale}/m/${slug}/`}
      data-testid={`search-result-card-${gradeClass ? `${slug}-${gradeClass.key}` : slug}`}
    >
      <div className="search-result-values">
        {matchedProperties.map((key) => {
          const property = propertyByKey.get(key);
          const band = subject.values[key];
          if (!property || !band) return null;
          return (
            <div key={key} className="search-result-value" data-testid={`search-result-value-${key}`}>
              <span className="search-result-value-label">
                {propertyName(property, locale)}
                {property.symbol ? ` (${property.symbol})` : ''}
              </span>
              <span className="search-result-value-amount">
                {formatRange(band.valueMin, band.valueMax, property.unit)}
              </span>
            </div>
          );
        })}
      </div>

      {near ? (
        <p className="search-result-near-reason" data-testid={`search-result-near-reason-${slug}`}>
          {(() => {
            const missedProperty = propertyByKey.get(near.missedProperty);
            return t(locale, 'search.nearMissReason')
              .replace('{property}', missedProperty ? propertyName(missedProperty, locale) : near.missedProperty)
              .replace('{amount}', Math.abs(near.missAbsolute).toString())
              .replace('{unit}', missedProperty?.unit ?? '');
          })()}
        </p>
      ) : null}

      <div className="search-result-name">
        {gradeClass ? (
          <span className="search-result-lockup">
            <span className="search-result-lockup-material">{materialName}</span>
            <span className="search-result-lockup-sep" aria-hidden="true">
              {' '}
              {t(locale, 'search.gradeClassSeparator')}{' '}
            </span>
            <span className="search-result-lockup-grade">{name}</span>
          </span>
        ) : (
          name
        )}
      </div>
    </a>
  );
}
