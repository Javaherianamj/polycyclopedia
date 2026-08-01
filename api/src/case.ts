// The one place snake_case Postgres column names become camelCase API
// fields. Route handlers call this instead of hand-mapping fields one by one.

export function toCamelCase<T = Record<string, unknown>>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-zA-Z0-9])/g, (_match, chr: string) => chr.toUpperCase());
    out[camelKey] = value;
  }
  return out as T;
}
