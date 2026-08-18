// One dual-handle range slider per eligible property (BR2). Two overlapping
// native <input type="range"> elements -- the standard dependency-free
// dual-slider technique -- rather than a UI library (R24: no heavy libs in
// any route outside Learn). Bounded by observedMin/observedMax, never
// plausible_min/max (BR2).
import { useId, useState } from 'react';
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import type { SearchIndexProperty } from '../../lib/search/types';
import { formatRange, propertyName } from './format';

interface PropertySliderProps {
  property: SearchIndexProperty;
  value: { min: number; max: number };
  /** True exactly when this property has an entry in `sliderFilters` --
   * i.e. it's narrower than the full observed range. Drives the reset
   * control below: shown only when there's actually something to reset,
   * so an untouched slider (the common case across 55+ properties) doesn't
   * carry a mostly-decorative disabled button. */
  isActive: boolean;
  onChange: (v: { min: number; max: number }) => void;
  /** Per-slider removal affordance -- the fix's item 2. Same end state as
   * dragging both handles back to the full observed range, without having
   * to actually do that by hand. */
  onClear: () => void;
  locale: Locale;
}

export function PropertySlider({ property, value, isActive, onChange, onClear, locale }: PropertySliderProps) {
  const id = useId();
  const { observedMin, observedMax } = property;
  const span = observedMax - observedMin || 1;
  const step = span > 20 ? 1 : span / 100;

  const lowPct = ((value.min - observedMin) / span) * 100;
  const highPct = ((value.max - observedMin) / span) * 100;

  // Classic dual-<input type=range> bug: the two thumbs are two full-width
  // inputs stacked on top of each other (pointer-events:none everywhere but
  // the thumb itself -- see search.css). Whichever DOM node has the higher
  // z-index wins the click, and a static z-index means one handle becomes
  // physically unreachable the moment the two values are close together or
  // equal ("squeeze them" -- the owner's report). Two-part fix:
  //  1. `activeHandle` tracks which thumb the pointer/keyboard most recently
  //     engaged and pins it on top for the duration of that interaction, so
  //     a drag that's already in progress never gets stolen by the other
  //     thumb sliding underneath it.
  //  2. Absent an active drag, z-index is chosen by *position*: whichever
  //     handle sits past the track's midpoint is the one a user reaching for
  //     that side of the track is most likely to mean, so it goes on top.
  //     This is what makes the very first click on a coincident pair land on
  //     the correct handle instead of always favouring the DOM-later one.
  const [activeHandle, setActiveHandle] = useState<'min' | 'max' | null>(null);
  const minOnTop = activeHandle ? activeHandle === 'min' : lowPct > 50;

  function handleMinChange(next: number) {
    onChange({ min: Math.min(next, value.max), max: value.max });
  }
  function handleMaxChange(next: number) {
    onChange({ min: value.min, max: Math.max(next, value.min) });
  }

  return (
    <div className="search-slider" data-testid={`search-slider-${property.key}`}>
      <div className="search-slider-head">
        <label htmlFor={`${id}-min`} className="search-slider-label">
          {propertyName(property, locale)}
          {property.symbol ? <span className="search-slider-symbol"> ({property.symbol})</span> : null}
        </label>
        <span className="search-slider-value">{formatRange(value.min, value.max, property.unit)}</span>
      </div>
      <div className="search-slider-track" style={{ ['--low' as string]: `${lowPct}%`, ['--high' as string]: `${highPct}%` }}>
        <input
          id={`${id}-min`}
          type="range"
          className="search-slider-input search-slider-input-min"
          style={{ zIndex: minOnTop ? 3 : 2 }}
          min={observedMin}
          max={observedMax}
          step={step}
          value={value.min}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          onPointerDown={() => setActiveHandle('min')}
          onFocus={() => setActiveHandle('min')}
          onPointerUp={() => setActiveHandle(null)}
          onBlur={() => setActiveHandle(null)}
          aria-label={`${propertyName(property, locale)} min`}
        />
        <input
          id={`${id}-max`}
          type="range"
          className="search-slider-input search-slider-input-max"
          style={{ zIndex: minOnTop ? 2 : 3 }}
          min={observedMin}
          max={observedMax}
          step={step}
          value={value.max}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          onPointerDown={() => setActiveHandle('max')}
          onFocus={() => setActiveHandle('max')}
          onPointerUp={() => setActiveHandle(null)}
          onBlur={() => setActiveHandle(null)}
          aria-label={`${propertyName(property, locale)} max`}
        />
      </div>
      <div className="search-slider-bounds">
        <span>{formatRange(observedMin, observedMin, null)}</span>
        <span>{formatRange(observedMax, observedMax, null)}</span>
      </div>
      {isActive ? (
        <button
          type="button"
          className="search-slider-reset"
          onClick={onClear}
          data-testid={`search-slider-reset-${property.key}`}
          aria-label={t(locale, 'search.removeFilter').replace('{property}', propertyName(property, locale))}
        >
          {t(locale, 'search.resetFilterLabel')}
        </button>
      ) : null}
    </div>
  );
}
