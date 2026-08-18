// Pure row ordering/filtering for the compare table — CR7 (two sort modes)
// and the "hide identical rows" affordance. No DOM, no fetch, no globals.
//
// Contract: `rows` is always supplied in canonical property-group order —
// the order the (out-of-scope) table-assembly step emits rows in, which is
// property-group order then each group's own `sort_order` (mirrors how
// `search/match.ts` trusts `index.materials`' walk order for BR10's primary
// results). `sortMode: 'grouped'` restores exactly that order; it does not
// re-derive group order from whatever order `rows` happens to arrive in,
// because if the caller feeds it an already difference-sorted array there
// would be no way to recover the true canonical order from the array alone
// (`CompareRow` carries a `groupKey` but no group-level sequence number).
// `sortMode: 'difference'` is the only mode that computes a new order.

import type { CompareRow, CompareSortMode } from './types';

/**
 * CR7 'difference' mode ordering, as a 3-way tier:
 *   0. Not overlapping — genuinely has a clear winner. Sorted by
 *      differenceScore descending.
 *   1. Overlapping, but not zero-span (CR10 — "sunk": there's some spread
 *      between representative values, but the bands overlap so it isn't a
 *      meaningful difference).
 *   2. Zero-span (differenceScore === 0) — every present subject has the
 *      same representative value. Always last, below tier 1, matching the
 *      spec's explicit "zero-span rows last" on top of "overlapping rows
 *      sunk". A zero-span row is provably also an overlapping row (equal
 *      representative values sit inside every subject's own band, so all
 *      bands share that point) — see difference.test.ts — so tier 2 is
 *      always a subset of what CR10 would flag anyway; it just gets its own
 *      tier so it sorts below overlapping-but-different rows too.
 *
 * Within a tier, ties break on `differenceScore` descending, then on
 * `rowKey` ascending as a final deterministic tie-break so equal-score rows
 * never reorder between renders regardless of input array order or JS
 * engine sort stability.
 */
function differenceTier(row: CompareRow): 0 | 1 | 2 {
  if (row.differenceScore === 0) return 2;
  if (row.isOverlapping) return 1;
  return 0;
}

function compareByDifference(a: CompareRow, b: CompareRow): number {
  const tierDiff = differenceTier(a) - differenceTier(b);
  if (tierDiff !== 0) return tierDiff;
  if (b.differenceScore !== a.differenceScore) return b.differenceScore - a.differenceScore;
  return a.rowKey < b.rowKey ? -1 : a.rowKey > b.rowKey ? 1 : 0;
}

/**
 * CR7 — sorts (a copy of) `rows` per `mode`. Never mutates its input.
 * `'grouped'` is an identity copy per the module contract above; `'difference'`
 * computes a fresh, stable, deterministic order.
 */
export function sortRows(rows: CompareRow[], mode: CompareSortMode): CompareRow[] {
  if (mode === 'grouped') {
    return [...rows];
  }
  return [...rows].sort(compareByDifference);
}

/**
 * The "hide identical rows" toggle. [own call] "Identical" is read literally
 * — every present subject shares the same representative value
 * (`differenceScore === 0`) — not "overlapping". A row where bands overlap
 * but representative values genuinely differ (CR10's 0.918–0.925 vs
 * 0.923–0.930 example) still has real, if inconclusive, numbers to show;
 * hiding it would throw away information the reader might still want. Only
 * true ties (nothing to see at all) get hidden by this toggle.
 */
export function filterHiddenRows(rows: CompareRow[], hideIdenticalRows: boolean): CompareRow[] {
  if (!hideIdenticalRows) return [...rows];
  return rows.filter((row) => row.differenceScore !== 0);
}
