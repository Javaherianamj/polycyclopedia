// FE-7 — types this unit owns. Deliberately NOT added to web/src/lib/api/
// types.ts (that file's edits belong to the sibling agent building the API
// concurrently, per this unit's file scope). `SourceSummary` mirrors the
// real, landed `GET /api/sources` response (api/src/routes/sources.ts,
// verified against the running dev API 2026-08-12) — field names
// (`citationCount`, `valueCount`, `documents`) match that endpoint exactly
// rather than the aggregate names this file originally guessed while the
// endpoint was still mid-flight.
export type SourceKind =
  | 'handbook'
  | 'textbook'
  | 'standard'
  | 'datasheet'
  | 'journal_article'
  | 'encyclopedia'
  | 'website'
  | 'internal'
  | string;

export type SourceTier =
  | 'peer_reviewed_handbook'
  | 'standard'
  | 'manufacturer_datasheet'
  | 'vendor_marketing'
  | 'community'
  | string;

export interface SourceDocumentSummary {
  id: string;
  mimeType: string | null;
  pageCount: number | null;
  language: string | null;
  retrievedAt: string | null;
}

export interface SourceSummary {
  id: string;
  kind: SourceKind;
  tier: SourceTier;
  title: string;
  authors: string | null;
  publisher: string | null;
  edition: string | null;
  year: number | null;
  isbn: string | null;
  doi: string | null;
  url: string | null;
  /** Count of citation rows against this source (may exceed `valueCount`
   * when one value carries more than one citation from the same source). */
  citationCount: number;
  /** Count of distinct property values this source has at least one
   * citation/evidence row for. NOT a ranking signal (kind/tier already
   * convey authority) — purely "how much of the site leans on this work". */
  valueCount: number;
  documents: SourceDocumentSummary[];
}

export interface SourcesListResponse {
  data: SourceSummary[];
  total: number;
}
