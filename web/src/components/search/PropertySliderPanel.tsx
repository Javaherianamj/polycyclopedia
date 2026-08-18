// One PropertySlider per property present in search-properties.json -- the
// panel never hardcodes a property list (BR2, R2's "no property list in
// JSX", already established for the registry-driven datasheet).
//
// Removal affordances (fix for "a touched filter could never be removed"):
// a chip per active filter (visible summary + one-click removal, item 2 of
// the fix) sits above the slider list, and a "clear all" button appears
// next to the heading whenever at least one filter is active. Neither
// changes anything about the sliders themselves -- both just call the same
// `onClear`/`onClearAll` the island already wires to `clearSliderFilter`.
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import type { SearchIndexProperty } from '../../lib/search/types';
import { PropertySlider } from './PropertySlider';
import { formatRange, propertyName } from './format';

interface PropertySliderPanelProps {
  properties: SearchIndexProperty[];
  values: Record<string, { min: number; max: number }>;
  onChange: (propertyKey: string, value: { min: number; max: number }) => void;
  onClear: (propertyKey: string) => void;
  onClearAll: () => void;
  locale: Locale;
}

export function PropertySliderPanel({
  properties,
  values,
  onChange,
  onClear,
  onClearAll,
  locale,
}: PropertySliderPanelProps) {
  // `values` only ever carries keys for filters actually in `sliderFilters`
  // (SearchIsland's `sliderValues` memo) -- an untouched-or-restored slider
  // has no entry here at all, which is exactly the invariant the whole fix
  // depends on. So "active filter count" and "chip list contents" both fall
  // straight out of this map with no separate bookkeeping.
  const activeKeys = properties.filter((p) => values[p.key]);

  return (
    <div className="search-slider-panel" data-testid="search-slider-panel">
      <div className="search-panel-heading-row">
        <h2 className="search-panel-heading">{t(locale, 'search.filtersHeading')}</h2>
        {activeKeys.length > 0 ? (
          <button
            type="button"
            className="search-clear-all"
            onClick={onClearAll}
            data-testid="search-clear-all-filters"
          >
            {t(locale, 'search.clearAllFilters')}
          </button>
        ) : null}
      </div>

      {activeKeys.length > 0 ? (
        <ul className="search-active-chips" data-testid="search-active-filter-chips">
          {activeKeys.map((property) => {
            const value = values[property.key];
            const label = `${propertyName(property, locale)}: ${formatRange(value.min, value.max, property.unit)}`;
            return (
              <li key={property.key}>
                <button
                  type="button"
                  className="search-chip"
                  onClick={() => onClear(property.key)}
                  aria-label={t(locale, 'search.removeFilter').replace('{property}', propertyName(property, locale))}
                  data-testid={`search-chip-${property.key}`}
                >
                  <span className="search-chip-label">{label}</span>
                  <span className="search-chip-glyph" aria-hidden="true">
                    ×
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="search-slider-list">
        {properties.map((property) => {
          const isActive = Boolean(values[property.key]);
          const value = values[property.key] ?? { min: property.observedMin, max: property.observedMax };
          return (
            <PropertySlider
              key={property.key}
              property={property}
              value={value}
              isActive={isActive}
              onChange={(v) => onChange(property.key, v)}
              onClear={() => onClear(property.key)}
              locale={locale}
            />
          );
        })}
      </div>
    </div>
  );
}
