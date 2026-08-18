// Pure logic for interpreting a slider drag/reset as a change to the
// `sliderFilters` map SearchIsland keeps in state. Extracted so it is
// testable without a browser environment, same pure-logic/thin-island split
// filter-logic.ts (FE-4) and match.ts already established.
//
// THE BUG THIS FILE FIXES: the owner reported that once a filter narrows a
// property and excludes a material, dragging that slider back to its full
// range does NOT bring the material back -- and touching enough sliders
// eventually breaks search entirely. Root cause (confirmed against the
// running app before this fix): `SearchIsland`'s old `handleSliderChange`
// unconditionally wrote `{ propertyKey, min, max }` into `sliderFilters` on
// every change, and NOTHING ever deleted an entry. `match.ts`'s
// `evaluateSubject` treats a subject with no recorded value for a filtered
// property as a hard, permanent fail (BR2+BR5, "no value never matches") --
// that rule is correct for a filter the reader actually intends, but a
// slider dragged back to its full observed range is not supposed to *be* a
// filter anymore. Once touched, it stayed one for the rest of the session:
// every material lacking that property vanished and never came back, no
// matter where the handles sat. With this dataset (10 of 17 materials carry
// zero property values at all -- see aidlc-docs gate record) that made the
// whole search surface collapse after a handful of slider touches, exactly
// as reported.
//
// THE FIX: a slider whose value spans the property's full observed extent
// is treated as "no constraint", identically to a slider that was never
// touched -- its entry is deleted from the map rather than written as a
// full-width filter. `PropertySliderPanel` already falls back to
// `{ min: property.observedMin, max: property.observedMax }` for any
// property key absent from `values` (see its `values[property.key] ?? ...`),
// so deleting the key here is what makes "dragged back to full range" and
// "never touched" collapse into the exact same state on both the data side
// (what `sliderFilters` holds, what `search()` sees) and the render side
// (what the slider displays) -- they are meant to be indistinguishable to
// the reader, and now they are.
import type { ActiveFilter, PropertyKey } from './types';

export interface SliderBounds {
  observedMin: number;
  observedMax: number;
}

/**
 * Applies one slider drag to the current `sliderFilters` map. Returns a new
 * object (never mutates `prev`, so it's safe to hand straight to a React
 * state setter). The new range either:
 *  - narrows the property's entry (or creates one), when it's tighter than
 *    the property's full observed extent on at least one side, or
 *  - deletes the property's entry entirely, when the new range covers the
 *    full observed extent on both sides -- seep the module comment above.
 *
 * `<=`/`>=` rather than `===` deliberately: a native `<input type=range>`
 * clamps to its `min`/`max` attributes at the extremes, so equality is what
 * actually happens in the browser, but this stays correct even if a caller
 * ever hands in a value that overshoots the bounds (e.g. a future
 * programmatic caller) rather than silently leaving a phantom filter behind.
 */
export function applySliderChange(
  prev: Record<PropertyKey, ActiveFilter>,
  propertyKey: PropertyKey,
  value: { min: number; max: number },
  bounds: SliderBounds,
): Record<PropertyKey, ActiveFilter> {
  const next = { ...prev };
  if (value.min <= bounds.observedMin && value.max >= bounds.observedMax) {
    delete next[propertyKey];
    return next;
  }
  next[propertyKey] = { propertyKey, min: value.min, max: value.max };
  return next;
}

/**
 * Explicit per-slider reset -- reaches the same end state as dragging both
 * handles back to the full observed range (`applySliderChange`'s delete
 * branch), but exposed directly for a reset control so a reader isn't stuck
 * fighting a `<input type=range>`'s float `step` arithmetic to land exactly
 * on the boundary by hand.
 */
export function clearSliderFilter(
  prev: Record<PropertyKey, ActiveFilter>,
  propertyKey: PropertyKey,
): Record<PropertyKey, ActiveFilter> {
  const next = { ...prev };
  delete next[propertyKey];
  return next;
}
