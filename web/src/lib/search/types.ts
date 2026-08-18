// FE-5 search — the shared type contract.
//
// Written up-front, ahead of both the index builder and the matching logic,
// so the build-time producer and the client-side consumer are held to the
// same shape by the compiler rather than by convention. Mirrors
// `aidlc-docs/construction/fe-5/functional-design/domain-entities.md`;
// keep the two in step.
//
// Nothing here comes from the API. Per D54/R39 the whole unit reads two
// static JSON files generated at build time straight from PostgreSQL.

export type PropertyKey = string; // property_definition.key, e.g. "tg"

export interface ValueBand {
  valueMin: number;
  valueMax: number;
  valueTypical: number | null;
}

// ------------------------------------------------------------ build-time index

export interface SearchIndexMaterial {
  slug: string;
  nameFa: string;
  nameEn: string;
  familyKey: string;
  familyNameFa: string;
  familyNameEn: string;
  citationCoveragePct: number;
  /** Only properties this material has a real value for, among eligible ones (BR2). */
  values: Record<PropertyKey, ValueBand>;
}

/**
 * A named resin population under a material (`grade_class`, migration 0016) —
 * e.g. ldpe/film, hdpe/injection. Carries ONLY the values the class itself
 * states and never inherits its parent material's, per D46. BR6 (Q6=B) makes
 * these first-class search subjects.
 */
export interface SearchIndexGradeClass {
  key: string;
  materialSlug: string;
  nameFa: string;
  nameEn: string;
  values: Record<PropertyKey, ValueBand>;
}

export interface SearchIndexProperty {
  key: PropertyKey;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  unit: string | null;
  dataType: 'numeric' | 'range';
  /** Observed min/max across real data — never plausible_min/max (BR2). */
  observedMin: number;
  observedMax: number;
  /** Derived mechanically from `key`, never hand-maintained (BR3). */
  aliasTokens: string[];
}

/** `search-materials.json` */
export interface SearchMaterialsIndex {
  materials: SearchIndexMaterial[];
  gradeClasses: SearchIndexGradeClass[];
}

/** `search-properties.json` */
export interface SearchPropertiesIndex {
  properties: SearchIndexProperty[];
}

// -------------------------------------------------------------- query model

export type Operator = '>' | '>=' | '<' | '<=' | '=';

export type ParsedToken =
  | { kind: 'comparison'; propertyKey: PropertyKey; op: Operator; value: number }
  | { kind: 'range'; propertyKey: PropertyKey; min: number; max: number }
  | { kind: 'unrecognized'; raw: string };

/** The unified shape both sliders and parsed text terms produce. */
export interface ActiveFilter {
  propertyKey: PropertyKey;
  min: number;
  max: number;
}

export interface SearchState {
  filters: ActiveFilter[];
  rawQueryText: string;
  unrecognizedTokens: string[];
}

// ------------------------------------------------------------- result model

export interface SearchResult {
  material: SearchIndexMaterial;
  /** Set when the result is a grade class rather than the generic material (BR6). */
  gradeClass?: SearchIndexGradeClass;
  /** The properties actually filtered on, per D25 — one per active filter. */
  matchedProperties: PropertyKey[];
}

/** BR5a — failed strict AND on exactly one filter, by ≤20% of its span. */
export interface NearMissResult extends SearchResult {
  missedProperty: PropertyKey;
  /** Distance from the nearest edge of the filter range, in canonical units. */
  missAbsolute: number;
  /** That distance as a fraction of the filter's span. BR10 orders on this. */
  missFraction: number;
}

/**
 * A subject excluded because it carries NO recorded value at all for one or
 * more of the currently active filters — BR2+BR5's "no value never
 * matches", made visible instead of a silent drop from the result set. This
 * is deliberately not folded into `NearMissResult`: a property the subject
 * doesn't carry has no meaningful "distance" from the filter (match.ts's
 * `evaluateSubject` already disqualifies it from near-miss eligibility via
 * the `Infinity` miss), so it needs its own honest label rather than being
 * silently absent OR mislabelled as a near miss it structurally can't be.
 * Semantics are unchanged from before this existed — a missing-value subject
 * still never appears in `primary`; this only makes the exclusion legible.
 */
export interface MissingDataResult extends SearchResult {
  /** The subset of the active filters this subject has no recorded value
   * for at all (as opposed to a value that's simply out of range). */
  missingProperties: PropertyKey[];
}

/** What the matcher returns: BR5a keeps `primary`/`nearMisses` strictly
 * separate; `missingData` is a third, also-disjoint bucket (see
 * `MissingDataResult`) — a subject appears in at most one of the three. */
export interface SearchResults {
  primary: SearchResult[];
  nearMisses: NearMissResult[];
  missingData: MissingDataResult[];
}

/** BR5a's qualifying threshold, as a fraction of the filter's own span. */
export const NEAR_MISS_MAX_FRACTION = 0.2;
