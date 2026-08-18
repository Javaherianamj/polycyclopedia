// FE-6 formatting helpers. Latin numerals everywhere (D18), same posture as
// `components/search/format.ts` — not reused directly because that module's
// `formatNumber` is tuned for search's ranges, not CR9's percent-vs-absolute
// delta or CR11's condition labels; duplicating one tiny function beats
// reaching into a sibling-owned directory for it.

export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatRange(min: number, max: number, unit: string | null): string {
  const range = min === max ? formatNumber(min) : `${formatNumber(min)}–${formatNumber(max)}`;
  return unit ? `${range} ${unit}` : range;
}

/**
 * CR11 — "Tensile strength (yield)" / "Tensile strength (break)". Renders a
 * row's `conditions` object as a parenthetical, values only (the keys —
 * `basis`, `load_kg` — are internal identifiers, not reader-facing labels).
 * Empty/absent conditions render nothing, matching `Conditions` = `{}`
 * meaning "unconditioned" (types.ts).
 */
export function formatConditions(conditions: Record<string, string | number>): string | null {
  const values = Object.values(conditions);
  if (values.length === 0) return null;
  return values.map((v) => String(v)).join(', ');
}

/** CR9 — the row's delta readout, in whichever form `deltaKind` says. */
export function formatDelta(
  deltaKind: 'relative_percent' | 'absolute',
  deltaValue: number,
  unit: string | null,
): string {
  if (deltaKind === 'relative_percent') {
    return `${formatNumber(deltaValue)}%`;
  }
  return unit ? `${formatNumber(deltaValue)} ${unit}` : formatNumber(deltaValue);
}
