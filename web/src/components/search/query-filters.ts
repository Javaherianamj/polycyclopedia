// Pure logic: turns a recognized ParsedToken (from
// `web/src/lib/search/parse-query.ts`, sibling-owned) into the unified
// `ActiveFilter` shape `match.ts` consumes (business-logic-model.md §4).
// Kept in FE-5's own scope (not lib/search/) because it is UI-state
// plumbing -- "what does the text box's parser output mean as a slider
// position" -- not query parsing or matching itself, mirroring the
// pure-logic/DOM-wiring split `filter-logic.ts`/`catalog-filter.ts`
// already established for FE-4.
import type {
  ActiveFilter,
  Operator,
  ParsedToken,
  SearchIndexMaterial,
  SearchIndexProperty,
} from '../../lib/search/types';

// Range filters are always inclusive on both ends (business-rules.md's
// "Validation / constraint notes"), so a comparison operator becomes a
// half-open-in-spirit-but-inclusive-in-representation range bounded by the
// property's own observed extent -- `tg>100` means "100 up to whatever the
// data goes to", not an unbounded filter (there is no unbounded ActiveFilter
// shape, and observedMax is already the true ceiling of what could match).
function comparisonToRange(
  op: Operator,
  value: number,
  observedMin: number,
  observedMax: number,
): { min: number; max: number } {
  switch (op) {
    case '>':
    case '>=':
      return { min: value, max: observedMax };
    case '<':
    case '<=':
      return { min: observedMin, max: value };
    case '=':
      return { min: value, max: value };
  }
}

/** Returns null for tokens that don't reference a known property (BR9's
 * "unrecognized" kind never reaches here -- callers filter those out before
 * calling, since they have no propertyKey to look up). */
export function tokenToFilter(
  token: ParsedToken,
  properties: SearchIndexProperty[],
): ActiveFilter | null {
  if (token.kind === 'unrecognized') return null;

  const property = properties.find((p) => p.key === token.propertyKey);
  if (!property) return null;

  if (token.kind === 'range') {
    return { propertyKey: token.propertyKey, min: token.min, max: token.max };
  }

  const { min, max } = comparisonToRange(
    token.op,
    token.value,
    property.observedMin,
    property.observedMax,
  );
  return { propertyKey: token.propertyKey, min, max };
}

// [own call, revised] Slider-derived and text-derived filters used to be
// reconciled here via a local `mergeFilters`/`intersectFilters` pair, but
// that duplicated `match.ts`'s `buildEffectiveFilters` -- `search()` already
// reconciles same-property duplicates in `state.filters` by intersection
// (business-logic-model.md §4's "narrower bound from each side wins",
// business-rules.md's exact wording), regardless of whether the duplicate
// came from a slider or a text token. `SearchIsland` now hands `search()` a
// flat `[...sliderFilters, ...textFilters]` array and lets `match.ts` be the
// single place that owns intersection -- no second implementation of the
// same rule.

// BR13: `?from=<slug>` pre-fills every eligible slider to that material's
// own value range, with no text tokens pre-filled -- reuses the same
// ActiveFilter application path as a normal slider move (no separate
// pre-fill code path), business-logic-model.md §7.
export function buildPrefillFilters(
  material: SearchIndexMaterial,
  properties: SearchIndexProperty[],
): ActiveFilter[] {
  const eligible = new Set(properties.map((p) => p.key));
  return Object.entries(material.values)
    .filter(([key]) => eligible.has(key))
    .map(([key, band]) => ({ propertyKey: key, min: band.valueMin, max: band.valueMax }));
}
