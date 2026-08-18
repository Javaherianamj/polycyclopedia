// Pure filter/match/rank algorithm (business-logic-model.md §4-5, BR5/BR5a/
// BR6/BR10). No DOM, no fetch, no globals — the UI island calls `search()`
// on every state change and renders whatever it returns.

import type {
  ActiveFilter,
  MissingDataResult,
  NearMissResult,
  PropertyKey,
  SearchIndexGradeClass,
  SearchIndexProperty,
  SearchMaterialsIndex,
  SearchResult,
  SearchResults,
  SearchState,
  ValueBand,
} from './types';
import { NEAR_MISS_MAX_FRACTION } from './types';

interface EffectiveFilter {
  propertyKey: PropertyKey;
  min: number;
  max: number;
}

/**
 * BR5 — when a slider and a parsed text term both constrain the same
 * property, their ranges intersect rather than one overriding the other.
 * `SearchState.filters` is a flat array (sliders contribute one entry,
 * recognized text tokens contribute another) precisely so this function is
 * the single place that reconciles duplicates — order is first-occurrence
 * in `filters`, which is what BR10's "natural order" downstream relies on
 * for `matchedProperties`.
 *
 * [own call] If two filters on the same property don't overlap at all
 * (e.g. a stale slider position and a freshly typed, non-overlapping text
 * range), the intersection is `min > max` — an intentionally empty target
 * that `evaluateSubject` below treats as "no subject can ever satisfy
 * this," not as a crash and not as a near-miss opportunity.
 */
function buildEffectiveFilters(filters: ActiveFilter[]): EffectiveFilter[] {
  const byProperty = new Map<PropertyKey, { min: number; max: number }>();
  const order: PropertyKey[] = [];

  for (const filter of filters) {
    const existing = byProperty.get(filter.propertyKey);
    if (!existing) {
      byProperty.set(filter.propertyKey, { min: filter.min, max: filter.max });
      order.push(filter.propertyKey);
    } else {
      existing.min = Math.max(existing.min, filter.min);
      existing.max = Math.min(existing.max, filter.max);
    }
  }

  return order.map((propertyKey) => {
    const range = byProperty.get(propertyKey)!;
    return { propertyKey, min: range.min, max: range.max };
  });
}

// A failure's `reason` distinguishes three things that all currently fail
// the subject the same way (hard AND, no partial credit) but mean very
// different things to a reader trying to understand why a result vanished:
//  - 'out-of-range': the subject has a recorded value, it just doesn't
//    overlap the filter. The ordinary case.
//  - 'no-value': the subject has NO recorded value for this property at all
//    (BR2+BR5). This is the one item 4 of the fix asks to surface honestly
//    -- see `MissingDataResult`.
//  - 'impossible-filter': buildEffectiveFilters' own [own call] -- a slider
//    and a text term on the same property intersected to nothing (min >
//    max). This is a self-contradictory FILTER, not a fact about the
//    subject's data, so it is deliberately excluded from `missingProperties`
//    below even though it also produces an Infinity miss.
type FailureReason = 'out-of-range' | 'no-value' | 'impossible-filter';

interface Failure {
  propertyKey: PropertyKey;
  missAbsolute: number;
  missFraction: number;
  reason: FailureReason;
}

type SubjectEvaluation =
  | { outcome: 'pass' }
  | { outcome: 'near-miss'; missedProperty: PropertyKey; missAbsolute: number; missFraction: number }
  | { outcome: 'fail'; missingProperties: PropertyKey[] };

/**
 * BR5 (strict AND) + BR5a (near miss) for one subject — a material or a
 * grade class, evaluated only against its own `values` dict (grade classes
 * never inherit the parent material's, per D46/BR6).
 *
 * A subject with no value at all for a filtered property is a hard fail on
 * that property (BR2+BR5's "no value never matches") and is never eligible
 * to be a near miss on it either — there is no meaningful "distance" from a
 * property the subject doesn't carry at all. That is modeled as an
 * `Infinity` miss, which both disqualifies near-miss eligibility (the
 * `Number.isFinite` guard below) and, if it were the only failure, would
 * still correctly fail the "exactly one near-qualifying failure" test.
 */
function evaluateSubject(
  values: Record<PropertyKey, ValueBand>,
  filters: EffectiveFilter[],
): SubjectEvaluation {
  const failures: Failure[] = [];

  for (const filter of filters) {
    // An intersection that came out empty (min > max) can never be
    // satisfied or narrowly missed — see buildEffectiveFilters' [own call].
    // Not a 'no-value' failure: the filter itself is self-contradictory,
    // independent of anything this subject does or doesn't carry.
    if (filter.min > filter.max) {
      failures.push({
        propertyKey: filter.propertyKey,
        missAbsolute: Infinity,
        missFraction: Infinity,
        reason: 'impossible-filter',
      });
      continue;
    }

    const band = values[filter.propertyKey];
    if (!band) {
      failures.push({
        propertyKey: filter.propertyKey,
        missAbsolute: Infinity,
        missFraction: Infinity,
        reason: 'no-value',
      });
      continue;
    }

    const overlaps = band.valueMin <= filter.max && band.valueMax >= filter.min;
    if (overlaps) continue;

    const missAbsolute =
      band.valueMax < filter.min ? filter.min - band.valueMax : band.valueMin - filter.max;

    // Guard the zero-span filter (min === max): BR5a's threshold is a
    // fraction of the filter's own span, and 20% of nothing is nothing —
    // [own call] any nonzero miss against a zero-width target disqualifies
    // outright (missFraction = Infinity) rather than dividing by zero or
    // treating every miss as either "0% off" or "infinitely off" some other
    // way. Only an exact point match (already the `overlaps` branch above,
    // since valueMin <= max === min <= valueMax collapses to valueMin <=
    // min <= valueMax) counts as satisfying a zero-span filter at all.
    const span = filter.max - filter.min;
    const missFraction = span === 0 ? Infinity : missAbsolute / span;

    failures.push({ propertyKey: filter.propertyKey, missAbsolute, missFraction, reason: 'out-of-range' });
  }

  if (failures.length === 0) return { outcome: 'pass' };

  if (failures.length === 1) {
    const [failure] = failures;
    if (Number.isFinite(failure.missAbsolute) && failure.missFraction <= NEAR_MISS_MAX_FRACTION) {
      return {
        outcome: 'near-miss',
        missedProperty: failure.propertyKey,
        missAbsolute: failure.missAbsolute,
        missFraction: failure.missFraction,
      };
    }
  }

  const missingProperties = failures.filter((f) => f.reason === 'no-value').map((f) => f.propertyKey);
  return { outcome: 'fail', missingProperties };
}

function matchedPropertiesOf(filters: EffectiveFilter[]): PropertyKey[] {
  return filters.map((f) => f.propertyKey);
}

/**
 * BR5/BR5a/BR6/BR10 — the whole client-side filter/match/rank algorithm.
 *
 * [own call] Zero active filters returns `{ primary: [], nearMisses: [] }`.
 * The alternative — strict AND over an empty filter set is vacuously true,
 * so every material AND every one of its grade classes would "pass" — was
 * rejected: combined with BR6's suppression rule it would make every
 * material disappear behind an explosion of its own (mostly data-sparse)
 * grade classes the instant the page loads with nothing selected, which is
 * not a useful "no criteria chosen yet" state. Nothing is shown until the
 * reader picks at least one filter, matching BR5b's "the property the
 * reader chose to filter on is what the result is about" — with no chosen
 * property there is nothing for a result to be about.
 */
export function search(
  state: SearchState,
  index: SearchMaterialsIndex,
  _properties: SearchIndexProperty[],
): SearchResults {
  const effectiveFilters = buildEffectiveFilters(state.filters);

  if (effectiveFilters.length === 0) {
    return { primary: [], nearMisses: [], missingData: [] };
  }

  const matchedProperties = matchedPropertiesOf(effectiveFilters);

  const gradeClassesByMaterial = new Map<string, SearchIndexGradeClass[]>();
  for (const gradeClass of index.gradeClasses) {
    const list = gradeClassesByMaterial.get(gradeClass.materialSlug) ?? [];
    list.push(gradeClass);
    gradeClassesByMaterial.set(gradeClass.materialSlug, list);
  }

  const primary: SearchResult[] = [];
  const nearMisses: NearMissResult[] = [];
  const missingData: MissingDataResult[] = [];

  const pushNearMiss = (result: SearchResult, evaluation: Extract<SubjectEvaluation, { outcome: 'near-miss' }>) => {
    nearMisses.push({
      ...result,
      missedProperty: evaluation.missedProperty,
      missAbsolute: evaluation.missAbsolute,
      missFraction: evaluation.missFraction,
    });
  };

  // Item 4 of the fix: "no value never matches" (BR2+BR5) used to be a
  // silent drop — a subject failed with an Infinity miss and simply never
  // appeared anywhere, primary or near-miss. That's the same mechanism that
  // made a full-range slider dangerous (see slider-filters.ts), and even
  // with that fixed, an *intentionally* narrow filter still hard-excludes
  // every subject with no recorded value for it — correctly, per BR2/BR5,
  // but invisibly. This only adds visibility; it changes no pass/fail
  // outcome. Extends the near-miss mechanism's own pattern (a third
  // strictly-separate bucket) rather than inventing a parallel one.
  const pushMissingData = (result: SearchResult, evaluation: Extract<SubjectEvaluation, { outcome: 'fail' }>) => {
    if (evaluation.missingProperties.length === 0) return;
    missingData.push({ ...result, missingProperties: evaluation.missingProperties });
  };

  // BR10 — primary results preserve the index's natural (catalog) order:
  // walk `index.materials` in order, and for each one, decide material vs.
  // grade-class granularity right there (BR6).
  for (const material of index.materials) {
    const gradeClasses = gradeClassesByMaterial.get(material.slug) ?? [];

    const passingGradeClasses: SearchIndexGradeClass[] = [];
    for (const gradeClass of gradeClasses) {
      const evaluation = evaluateSubject(gradeClass.values, effectiveFilters);
      if (evaluation.outcome === 'pass') {
        passingGradeClasses.push(gradeClass);
      } else if (evaluation.outcome === 'near-miss') {
        pushNearMiss({ material, gradeClass, matchedProperties }, evaluation);
      } else {
        pushMissingData({ material, gradeClass, matchedProperties }, evaluation);
      }
    }

    if (passingGradeClasses.length > 0) {
      // BR6 — grade class is more specific and wins: the parent material
      // is suppressed for this (fully-matched) filter set entirely, even
      // if the material's own values would also have passed.
      for (const gradeClass of passingGradeClasses) {
        primary.push({ material, gradeClass, matchedProperties });
      }
      continue;
    }

    const materialEvaluation = evaluateSubject(material.values, effectiveFilters);
    if (materialEvaluation.outcome === 'pass') {
      primary.push({ material, matchedProperties });
    } else if (materialEvaluation.outcome === 'near-miss') {
      pushNearMiss({ material, matchedProperties }, materialEvaluation);
    } else {
      pushMissingData({ material, matchedProperties }, materialEvaluation);
    }
  }

  // BR10 — near misses order by miss magnitude ascending; primary keeps
  // the natural order already built above (strict AND has no degrees).
  // missingData has no analogous ordering rule (there's no "how missing" to
  // rank by) so it keeps the same natural walk order as primary.
  nearMisses.sort((a, b) => a.missFraction - b.missFraction);

  return { primary, nearMisses, missingData };
}
