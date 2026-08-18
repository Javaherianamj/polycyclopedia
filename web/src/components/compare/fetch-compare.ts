// FE-6 — table assembly. Turns `GET /api/compare`'s raw `CompareApiRow[]`
// (server-side eligibility/citation resolution — see
// `api/src/routes/compare.ts`'s header) into real `CompareRow[]` by calling
// the logic agent's `computeDifference` (CR8/CR9/CR10), the one piece of
// per-row arithmetic this unit does not own or reimplement.
//
// `hasCitationAsymmetry` (CR18) is computed here rather than in
// `difference.ts`, because it isn't a difference-shaped question — it's true
// whenever a row's present cells mix `isCited: true` and `isCited: false`,
// regardless of how different (or overlapping) their values are.
//
// CR8's observed range does NOT come from the compare endpoint (it returns
// only the requested subjects' own cells, not the property's whole dataset
// span) — it comes from the same static `search-properties.json` FE-5
// already ships (`SearchIndexProperty.observedMin/observedMax`), imported
// read-only via `components/search/fetch-index.ts`. One source of "what is
// this property's real-world range" rather than a second one computed here.

import { computeDifference } from '../../lib/compare/difference';
import type { CompareCell, CompareRow, CompareSubject, Polarity } from '../../lib/compare/types';
import { getCompareTable } from '../../lib/api/client';
import type {
  ApiResult,
  CompareApiApplication,
  CompareApiPolarityRule,
  CompareApiRow,
} from '../../lib/api/types';
import type { SearchIndexData } from '../search/fetch-index';

export interface RowPolarity {
  polarity: Polarity;
  rationaleFa: string | null;
  rationaleEn: string | null;
}

export interface CompareData {
  /** Canonical (property-group, then property sort_order) order — the ONLY
   * order this array is ever held in. `ordering.ts`'s `sortRows(rows,
   * 'grouped')` is an identity copy that depends on callers never mutating
   * or re-storing a shuffled array as "canonical" (its own module comment).
   * Derive display order fresh each render; never sort this array in place. */
  rows: CompareRow[];
  subjects: CompareSubject[];
  applications: CompareApiApplication[];
  /** Every rule for every application, unfiltered — CR4's "no application
   * selected -> no polarity" gate is applied by the caller (which rules it
   * actually looks up), not by narrowing this map. */
  polarityRules: CompareApiPolarityRule[];
  /** Rows excluded by CR13 (fewer than 2 subjects hold a value) — surfaced
   * so the UI can distinguish "nothing to compare" from "nothing shared". */
  excludedRowCount: number;
}

/** CR4/CR5 — the rules for one application, keyed by rowKey (via
 * propertyKey, since polarity is per-property, not per-conditions — the
 * same polarity applies to "tensile strength (yield)" and "(break)" alike). */
export function polarityByRowKeyFor(
  rows: CompareRow[],
  polarityRules: CompareApiPolarityRule[],
  applicationKey: string | undefined,
): Map<string, RowPolarity> {
  const map = new Map<string, RowPolarity>();
  if (!applicationKey) return map; // CR4 — no application, no polarity, full stop.

  const rulesByProperty = new Map(
    polarityRules.filter((r) => r.applicationKey === applicationKey).map((r) => [r.propertyKey, r]),
  );
  for (const row of rows) {
    const rule = rulesByProperty.get(row.propertyKey);
    if (rule) {
      map.set(row.rowKey, {
        polarity: rule.polarity,
        rationaleFa: rule.rationaleFa,
        rationaleEn: rule.rationaleEn,
      });
    }
  }
  return map;
}

function toCell(apiCell: CompareApiRow['cells'][number]): CompareCell {
  return {
    subjectRef: apiCell.subjectRef,
    band: apiCell.band,
    representative: apiCell.representative,
    isCited: apiCell.isCited,
  };
}

function observedRangeFor(
  propertyKey: string,
  index: SearchIndexData,
): { min: number; max: number } {
  const property = index.properties.find((p) => p.key === propertyKey);
  return property ? { min: property.observedMin, max: property.observedMax } : { min: 0, max: 0 };
}

function assembleRow(apiRow: CompareApiRow, index: SearchIndexData): CompareRow {
  const cells = apiRow.cells.map(toCell);
  const { min: observedMin, max: observedMax } = observedRangeFor(apiRow.propertyKey, index);
  const diff = computeDifference(cells, observedMin, observedMax);
  const hasCitationAsymmetry = cells.some((c) => c.isCited) && cells.some((c) => !c.isCited);

  return {
    rowKey: apiRow.rowKey,
    propertyKey: apiRow.propertyKey,
    nameFa: apiRow.nameFa,
    nameEn: apiRow.nameEn,
    symbol: apiRow.symbol,
    unit: apiRow.unit,
    conditions: apiRow.conditions,
    groupKey: apiRow.groupKey,
    groupNameFa: apiRow.groupNameFa,
    groupNameEn: apiRow.groupNameEn,
    cells,
    ...diff,
    hasCitationAsymmetry,
  };
}

/**
 * `subjectRefs.length === 0` returns an empty table without a network call —
 * "nothing picked yet" is a distinct state from "the API has nothing to say"
 * (mirrors `search/match.ts`'s zero-filters short-circuit).
 */
export async function fetchCompareData(
  subjectRefs: string[],
  index: SearchIndexData,
): Promise<ApiResult<CompareData>> {
  if (subjectRefs.length === 0) {
    return {
      ok: true,
      data: { rows: [], subjects: [], applications: [], polarityRules: [], excludedRowCount: 0 },
    };
  }

  const result = await getCompareTable(subjectRefs);
  if (!result.ok) return result;

  const rows = result.data.rows.map((row) => assembleRow(row, index));

  return {
    ok: true,
    data: {
      rows,
      subjects: result.data.subjects,
      applications: result.data.applications,
      polarityRules: result.data.polarityRules,
      excludedRowCount: result.data.excludedRowCount,
    },
  };
}
