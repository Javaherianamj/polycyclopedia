// Groups a row set that is already ORDER BY'd by the group key into
// contiguous buckets, preserving SQL's ordering. Used for the
// property-groups-with-nested-properties shape shared by
// GET /api/materials/:slug and GET /api/properties.

export function groupConsecutiveBy<T, K>(
  rows: T[],
  keyFn: (row: T) => K,
): Array<{ key: K; rows: T[] }> {
  const result: Array<{ key: K; rows: T[] }> = [];
  for (const row of rows) {
    const key = keyFn(row);
    const last = result[result.length - 1];
    if (last && last.key === key) {
      last.rows.push(row);
    } else {
      result.push({ key, rows: [row] });
    }
  }
  return result;
}
