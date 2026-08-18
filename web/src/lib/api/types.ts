// Hand-written against the real route handlers, not an assumption:
// api/src/routes/{materials,properties,coverage,health}.ts and
// api/src/errors.ts. Keep this file in sync if those change — there is no
// OpenAPI spec to generate from yet.

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface HealthResponse {
  status: 'ok';
  database: 'connected';
  migrations: number;
}

// ---------------------------------------------------------------- materials

export interface MaterialListItem {
  slug: string;
  nameFa: string;
  nameEn: string;
  code: string | null;
  field: string;
  family: string;
  familyNameFa: string;
  familyNameEn: string;
  status: string;
  citationCoverage: number;
}

export interface MaterialsListResponse {
  data: MaterialListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface MaterialsListParams {
  field?: string;
  family?: string;
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// db/migrations/0006_citations.sql's citation_locator_present_chk requires
// at least one of these, non-null; any combination may be present.
export interface CitationLocator {
  page?: number | string;
  table?: string;
  figure?: string;
  section?: string;
}

// R11: work, edition and page -- nothing else. sourceTitle/sourceEdition
// come from a join the API added specifically to satisfy this rule (FE-2).
// sourceTier/sourceKind were added in FE-7 (api/src/citations.ts) for the
// sources surfaces, which need to show a reader how credible a backing
// source is; the FE-2 value-atom popover is free to keep ignoring them
// per R11.
export interface Citation {
  id: string;
  locator: CitationLocator;
  role: 'primary' | 'corroborating' | 'conflicting' | 'derived_from' | string;
  extractionMethod: string;
  sourceTitle: string;
  sourceEdition: string | null;
  /** source_tier enum, e.g. 'peer_reviewed_handbook' | 'standard' |
   * 'manufacturer_datasheet' | 'vendor_marketing' | 'community'. Optional
   * only so existing test fixtures built before FE-7 (e.g.
   * src/components/value-atom/logic.test.ts, src/lib/pages/
   * material-detail.test.ts) type-check without updating them out of this
   * unit's scope -- a real API response always carries it. */
  sourceTier?: string;
  /** source_kind enum, e.g. 'handbook' | 'textbook' | 'standard' |
   * 'datasheet' | 'journal_article' | 'encyclopedia' | 'website' | 'internal'.
   * Optional for the same reason as sourceTier above. */
  sourceKind?: string;
}

// R3: display is the API's formatted string. The frontend does not format
// this itself — it renders `display` as-is.
export interface PropertyValue {
  key: string;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  dataType: 'numeric' | 'range' | 'text' | 'enum' | 'boolean' | string;
  valueMin: number | null;
  valueMax: number | null;
  valueTypical: number | null;
  /** Text-typed values are a _fa/_en pair (db/migrations/0030), like nameFa/
   * nameEn above. Either half may be null; fall back to the other rather than
   * rendering nothing. */
  valueTextFa: string | null;
  valueTextEn: string | null;
  valueEnum: string | null;
  valueBool: boolean | null;
  qualifier: string | null;
  unit: string | null;
  display: string | null;
  status: string;
  citations: Citation[];
  /**
   * `property_value.conditions` (db/migrations/0005), e.g. `{basis: "yield"}`
   * vs `{basis: "break"}` — what makes two rows of the "same" property
   * distinct measurements (FE-6 CR11). `MATERIAL_PROPERTY_VALUES_SQL` /
   * `MATERIAL_GRADE_CLASS_PROPERTY_VALUES_SQL` (api/src/routes/materials.ts)
   * select `pv.conditions` and always return an object (`{}` when
   * unconditioned — the column is `NOT NULL DEFAULT '{}'`). Optional/nullable
   * here only for callers constructing a `PropertyValue` by hand (test
   * fixtures) without needing to specify it — a real API response always has
   * it. Used by `GradeClassBand.astro`'s condition label (see its own
   * comment). [own call, FE-6 scope]
   */
  conditions?: Record<string, string | number> | null;
}

export interface PropertyGroup<TProperty> {
  key: string;
  nameFa: string;
  nameEn: string;
  properties: TProperty[];
}

export interface ChemicalResistanceRow {
  reagentFa: string;
  reagentEn: string;
  rating: string;
  noteFa: string | null;
  noteEn: string | null;
  status: string;
}

export interface MarketShareRow {
  segmentFa: string;
  segmentEn: string;
  percentage: number;
  region: string;
  year: number;
  status: string;
}

export interface MaterialStructure {
  atoms: unknown;
}

// FE-3 "processing" rail section. Backed by material_process (not the bare
// junction table material_processing_technique) — see api/src/routes/
// materials.ts's MATERIAL_PROCESSING_TECHNIQUES_SQL comment for why.
export interface ProcessingTechnique {
  key: string;
  nameFa: string;
  nameEn: string;
  noteFa: string | null;
  noteEn: string | null;
  status: string;
}

// D3/R12: every material page states its own coverage above the fold.
export interface MaterialCoverage {
  totalValues: number;
  citedValues: number;
  coveragePct: number;
}

// FE-3b: the resin-population rung between material and a specific
// commercial grade (db/migrations/0016_grade_class.sql) — e.g. ldpe/film vs.
// ldpe/injection, each with its own cited density/MFI/tensile band. D46: NO
// value inheritance — propertyGroups here carries ONLY what was explicitly
// cited for this class, never a copy of the parent material's values, so
// this is deliberately NOT the same shape as buildMaterialSections' output
// (which fills in every candidate property, missing or not, from the full
// registry). A grade class with no cited values at all in a given group
// simply does not carry that group — there is nothing to invite a
// contribution for here (that invitation belongs on the material page).
export interface GradeClass {
  key: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  status: string;
  propertyGroups: PropertyGroup<PropertyValue>[];
  processingTechniques: ProcessingTechnique[];
}

export interface MaterialDetail {
  slug: string;
  nameFa: string;
  nameEn: string;
  code: string | null;
  status: string;
  overviewFa: string | null;
  overviewEn: string | null;
  discoveryYear: string | null;
  chainType: string | null;
  field: { key: string; nameFa: string; nameEn: string };
  family: { key: string; nameFa: string; nameEn: string };
  coverage: MaterialCoverage;
  identifiers: Record<string, string>;
  propertyGroups: PropertyGroup<PropertyValue>[];
  chemicalResistance: ChemicalResistanceRow[];
  marketShare: MarketShareRow[];
  structure: MaterialStructure | null;
  processingTechniques: ProcessingTechnique[];
  // R7/R4: empty for the 4 of 7 seeded materials with no grade classes —
  // that renders no band at all (GradeClassBand.astro), not an empty shell.
  gradeClasses: GradeClass[];
}

// ---------------------------------------------------------------- properties

// R2: no property list is written in JSX — sections, order and grouping come
// from this response.
export interface PropertyDefinition {
  key: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string | null;
  descriptionEn: string | null;
  symbol: string | null;
  dataType: string;
  unit: string | null;
  allowedUnits: string[];
  isSearchable: boolean;
  isComparable: boolean;
  // Both empty = applies everywhere; otherwise ANDed. Lets a consumer tell
  // "nobody has sourced this yet for this material" (show the invitation to
  // contribute) apart from "this property does not apply to this material at
  // all" (show nothing) — see db/seeds/0008_property_scoping.sql.
  appliesToFields: string[];
  appliesToFamilies: string[];
}

export interface PropertiesResponse {
  data: PropertyGroup<PropertyDefinition>[];
  total: number;
}

// ---------------------------------------------------------------- coverage

export interface CoverageRow {
  slug: string;
  nameFa: string;
  nameEn: string;
  totalValues: number;
  citedValues: number;
  coveragePct: number;
}

export interface CoverageResponse {
  data: CoverageRow[];
}

// ---------------------------------------------------------------- compare (FE-6)
//
// GET /api/compare?subjects=ldpe,hdpe/film (api/src/routes/compare.ts).
// Deliberately NOT the same shape as web/src/lib/compare/types.ts's
// CompareRow/CompareTable -- this is the raw material (resolved subjects,
// rows keyed by (property, conditions) with only the cells a subject
// actually has a value for) that FE-6's pure client-logic package turns
// into a CompareRow (differenceScore, deltaKind, emphasis, etc. are all
// computed client-side, not by this API). Field names mirror
// CompareSubject/CompareCell/Conditions from that file wherever the shape
// is the same, so mapping one onto the other is closer to a cast than a
// rewrite.

// Mirrors web/src/lib/compare/types.ts's CompareSubjectKind/CompareSubject.
export type CompareApiSubjectKind = 'material' | 'grade_class';

export interface CompareApiSubject {
  kind: CompareApiSubjectKind;
  /** "ldpe" for a material, "ldpe/film" for a grade class (CR14). */
  ref: string;
  materialSlug: string;
  /** Present only when kind === 'grade_class'. */
  gradeClassKey?: string;
  nameFa: string;
  nameEn: string;
  familyKey: string;
}

/** Mirrors web/src/lib/compare/types.ts's Conditions. */
export type CompareApiConditions = Record<string, string | number>;

export interface CompareApiCell {
  subjectRef: string;
  /** value_min/value_max/value_typical, collapsed to a point when needed. */
  band: { valueMin: number; valueMax: number; valueTypical: number | null };
  /** value_typical ?? midpoint(min, max) -- used for ordering and typography. */
  representative: number;
  /** CR18 -- whether this particular value carries a citation. */
  isCited: boolean;
}

export interface CompareApiRow {
  /** Deterministic (property, conditions) key -- CR11's true row identity. */
  rowKey: string;
  propertyKey: string;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  unit: string | null;
  /** CR11 -- render in the row label, always. Empty object = unconditioned. */
  conditions: CompareApiConditions;
  groupKey: string;
  groupNameFa: string;
  groupNameEn: string;
  /**
   * Only subjects with a real value for this exact (property, conditions)
   * row -- CR12, absence is never a cell. Always >= 2 entries: rows with
   * fewer are excluded before this array is built (CR13, see
   * excludedRowCount on the parent response).
   */
  cells: CompareApiCell[];
}

// CR5/CR6. From application_property_polarity (db/migrations/0024) --
// editorial judgement, never a citation. Empty when that table doesn't
// exist yet (a sibling migration this endpoint tolerates missing) or has no
// rows for a given (application, property) pair, not an error.
export type CompareApiPolarity = 'higher_is_better' | 'lower_is_better' | 'not_relevant';

export interface CompareApiApplication {
  key: string;
  nameFa: string;
  nameEn: string;
}

export interface CompareApiPolarityRule {
  applicationKey: string;
  propertyKey: string;
  polarity: CompareApiPolarity;
  rationaleFa: string;
  rationaleEn: string;
}

export interface CompareResponse {
  subjects: CompareApiSubject[];
  rows: CompareApiRow[];
  /** CR13 -- count of eligible (property, conditions) rows only one
   *  requested subject could answer, excluded from `rows` above. */
  excludedRowCount: number;
  applications: CompareApiApplication[];
  polarityRules: CompareApiPolarityRule[];
}

export interface CompareParams {
  /** Comma-separated refs, e.g. "ldpe,hdpe/film" (CR14, CR16 -- uncapped). */
  subjects: string[];
}

// ---------------------------------------------------------------- sources (FE-7)
//
// GET /api/materials/:slug/sources (api/src/routes/sources.ts) -- the
// per-material "CSV of data with their source" (frontend-plan.md D4): every
// live property value for the material AND every one of its grade classes
// (D46 -- grade classes are the best-cited data in the project and are
// never folded into the material's own rows), each row carrying whatever
// citations back it, `[]` when none. `[]` is deliberate, not an omission --
// CR-style honesty means an unsourced value is reported, not hidden.

export type SourcesRowSubjectKind = 'material' | 'grade_class';

export interface SourcesRowSubject {
  kind: SourcesRowSubjectKind;
  /** Present only when kind === 'grade_class'. */
  key?: string;
  nameFa?: string;
  nameEn?: string;
}

export interface SourcesRowGroup {
  key: string;
  nameFa: string;
  nameEn: string;
}

export interface SourcesRowProperty {
  key: string;
  nameFa: string;
  nameEn: string;
  symbol: string | null;
  dataType: 'numeric' | 'range' | 'text' | 'enum' | 'boolean' | string;
}

export interface SourcesRow {
  subject: SourcesRowSubject;
  group: SourcesRowGroup;
  propertyValueId: string;
  property: SourcesRowProperty;
  /** Same formatted string as PropertyValue.display -- the API's rendering,
   * never recomputed client-side (R3). */
  display: string | null;
  conditions: Record<string, string | number>;
  status: string;
  /** `[]` = uncited. Never a citation without a locator (schema-enforced,
   * db/migrations/0006_citations.sql's citation_locator_present_chk). */
  citations: Citation[];
}

export interface SourcesCoverageBucket {
  totalValues: number;
  citedValues: number;
  uncitedValues: number;
  coveragePct: number;
}

export interface MaterialSourcesResponse {
  material: { slug: string; nameFa: string; nameEn: string };
  coverage: SourcesCoverageBucket & {
    materialLevel: SourcesCoverageBucket;
    gradeClassLevel: SourcesCoverageBucket;
  };
  rows: SourcesRow[];
}

// GET /api/sources (api/src/routes/sources.ts) -- the site-wide
// bibliography: every `source` row (cited or not yet), its documents, and
// how many distinct editorial values it backs. Ordered by tier (the
// source_tier enum's own declaration order IS a credibility ranking --
// peer_reviewed_handbook first), then by valueCount within a tier.

export interface SourceDocument {
  id: string;
  mimeType: string | null;
  pageCount: number | null;
  language: string | null;
  retrievedAt: string | null;
}

export interface BibliographySource {
  id: string;
  /** source_kind enum. */
  kind: string;
  /** source_tier enum -- see the ordering note above. */
  tier: string;
  title: string;
  authors: string | null;
  publisher: string | null;
  edition: string | null;
  year: number | null;
  isbn: string | null;
  doi: string | null;
  url: string | null;
  /** Raw citation rows pointing at this source. */
  citationCount: number;
  /** Distinct editorial property values this source backs (across
   * materials and grade classes), resolved the same way
   * fetchCitationsByValueId resolves an observation up to its editorial
   * row -- not a raw evidence-row count. */
  valueCount: number;
  documents: SourceDocument[];
}

export interface BibliographyResponse {
  data: BibliographySource[];
  total: number;
}

// ---------------------------------------------------------------- client result

// Every client function returns this instead of throwing, so callers can
// tell "empty" apart from "error" — the distinction R4's four states need.
export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; error: { code: string; message: string } };
