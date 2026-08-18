# FE-5 — Domain Entities

Technology-agnostic shapes for FE-5's business logic. TypeScript used as
notation only, matching this repo's existing convention in
`web/src/lib/api/types.ts` — these are new types for FE-5, not additions to
that file (nothing here comes from the API; it's all build-time-generated,
per D54).

## Build-time index (generated, static JSON)

```ts
// search-materials.json
interface SearchIndexMaterial {
  slug: string;
  nameFa: string;
  nameEn: string;
  familyKey: string;
  familyNameFa: string;
  familyNameEn: string;
  citationCoveragePct: number;
  // Only properties this material has a real value for, and only among
  // eligible (is_searchable + has data somewhere) properties — BR2.
  values: Record<PropertyKey, { valueMin: number; valueMax: number; valueTypical: number | null }>;
}

// A named resin population under a material (grade_class table, migration
// 0016) — e.g. ldpe/film, hdpe/injection. Carries ONLY the property values
// the class itself states; it never inherits the material's, per D46.
// BR6 (Q6=B) makes these first-class search subjects.
interface SearchIndexGradeClass {
  key: string;            // grade_class.key, unique per material, e.g. "film"
  materialSlug: string;   // parent, for the "LDPE › Film" lockup and the URL
  nameFa: string;
  nameEn: string;
  values: Record<PropertyKey, { valueMin: number; valueMax: number; valueTypical: number | null }>;
}

// search-properties.json
type PropertyKey = string; // property_definition.key, e.g. "tg", "tensile_strength"

interface SearchIndexProperty {
  key: PropertyKey;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  unit: string | null;
  dataType: 'numeric' | 'range';
  observedMin: number;
  observedMax: number;
  aliasTokens: string[]; // BR3, derived from `key`
}
```

## Query / filter model (client-side, in-memory)

```ts
type Operator = '>' | '>=' | '<' | '<=' | '=';

// One recognized token from the free-text box, before being folded into
// ActiveFilter — kept separate so unrecognized tokens (BR9) can be reported
// without polluting the filter set.
type ParsedToken =
  | { kind: 'comparison'; propertyKey: PropertyKey; op: Operator; value: number }
  | { kind: 'range'; propertyKey: PropertyKey; min: number; max: number }
  | { kind: 'unrecognized'; raw: string };

// The unified shape both sliders and parsed text terms produce (business-logic-model.md §4).
interface ActiveFilter {
  propertyKey: PropertyKey;
  min: number;
  max: number;
}

// The full client-side search state — this is also exactly what URLSearchState (below) serializes.
interface SearchState {
  filters: ActiveFilter[];
  rawQueryText: string;
  unrecognizedTokens: string[];
}
```

## Result model

```ts
interface SearchResult {
  material: SearchIndexMaterial;
  // Set when this result is a grade class rather than the generic material
  // (BR6, Q6=B). The parent material is still carried above it so the card
  // can render the "LDPE › Film" lockup without a second lookup.
  gradeClass?: SearchIndexGradeClass;
  // The properties that were actually filtered on for this search, per D25
  // ("result shows the material plus the properties filtered on") — a
  // subset of the subject's values' keys, one entry per active ActiveFilter.
  matchedProperties: PropertyKey[];
}

// BR5a — a subject that failed strict AND on exactly one filter, narrowly.
interface NearMissResult extends SearchResult {
  missedProperty: PropertyKey;
  // Signed distance from the nearest edge of the filter range, in the
  // property's canonical unit, and the same distance as a fraction of the
  // filter's span (the ≤0.20 that qualified it). Both are carried because
  // the card shows the first and BR10 orders by the second.
  missAbsolute: number;
  missFraction: number;
}
```

## URL state (R13 — shareable, real paths)

```ts
// Query-string encoding of SearchState, e.g.
// /en/search?tg=100-160&tensile_strength=30-50&q=tensile+40-80
interface URLSearchState {
  // One `propertyKey=min-max` param per active ActiveFilter — sliders and
  // resolved text-filters serialize identically, so a shared URL re-derives
  // the same slider positions on load without needing to re-run the parser.
  [propertyKey: string]: string; // "min-max"
} & {
  q?: string; // the raw text-box contents, kept verbatim so unrecognized-token hints survive a reload
  from?: string; // BR13 pre-fill source material slug, consumed once on load
}
```

## Relationships

- `SearchIndexMaterial.values` keys are always a subset of the
  `SearchIndexProperty` set — the index generator only ever writes a value
  for a property already determined eligible (BR2), so the client never
  needs to re-check eligibility per material.
- `ParsedToken[kind=unrecognized]` never becomes an `ActiveFilter` — it only
  ever surfaces as UI text (BR9), never participates in matching.
- `URLSearchState` and `SearchState.filters` are lossless round-trips of
  each other; `rawQueryText`/`q` is carried separately because the same
  `ActiveFilter` set can be reached by slider-only interaction with no text
  at all, and the raw text is needed to redisplay unrecognized-token hints,
  not to recompute filters.
