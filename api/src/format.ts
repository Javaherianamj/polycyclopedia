// The one place that turns numeric property values into a human-readable
// display string. This replaces the legacy model where the display string
// WAS the data (`'0.910 - 0.925'`) -- here the numerics are the source of
// truth and the string is derived, server-side, once.

export interface FormatValueInput {
  valueMin?: number | null;
  valueMax?: number | null;
  valueTypical?: number | null;
  qualifier?: string | null;
  unit?: string | null;
}

// Numbers at or beyond this magnitude (or below it and non-zero) render in
// scientific notation instead of expanded decimal form. Volume resistivity
// values like 1e16 - 1e18 would otherwise print as an 18-digit integer.
const SCIENTIFIC_UPPER_BOUND = 1e6;
const SCIENTIFIC_LOWER_BOUND = 1e-4;

// Cap on decimal places when aligning a min/max pair, purely as a safety net
// against floating-point representation noise (e.g. 0.1 + 0.2). Every value
// in this schema is a seeded, clean decimal, so this bound is never expected
// to bind in practice.
const MAX_ALIGNED_DECIMALS = 10;

function shouldUseScientific(n: number): boolean {
  const abs = Math.abs(n);
  return abs !== 0 && (abs >= SCIENTIFIC_UPPER_BOUND || abs < SCIENTIFIC_LOWER_BOUND);
}

function formatScientific(n: number): string {
  // toExponential() with no argument keeps exactly as many significant
  // digits as the number actually has, e.g. (1e16).toExponential() ->
  // "1e+16", (1.234e17).toExponential() -> "1.234e+17". No precision lost.
  return n.toExponential();
}

function decimalPlacesOf(n: number): number {
  if (Number.isInteger(n)) return 0;
  const str = n.toString();
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) return 0;
  return Math.min(str.length - dotIndex - 1, MAX_ALIGNED_DECIMALS);
}

function formatPlainNumber(n: number): string {
  return shouldUseScientific(n) ? formatScientific(n) : n.toString();
}

function formatRange(min: number, max: number): string {
  if (shouldUseScientific(min) || shouldUseScientific(max)) {
    return `${formatPlainNumber(min)} - ${formatPlainNumber(max)}`;
  }
  // Align decimal places so "0.91" next to "0.925" renders as
  // "0.910 - 0.925" rather than the visually inconsistent "0.91 - 0.925".
  const decimals = Math.max(decimalPlacesOf(min), decimalPlacesOf(max));
  return `${min.toFixed(decimals)} - ${max.toFixed(decimals)}`;
}

/**
 * Render a numeric property value as a display string.
 *
 * Examples this function must produce (see functional design / task spec):
 *   { valueTypical: -110, unit: '°C' }                          -> "-110 °C"
 *   { valueMin: 0.91, valueMax: 0.925, unit: 'g/cm³' }           -> "0.910 - 0.925 g/cm³"
 *   { valueTypical: 1.51, qualifier: '~' }                       -> "~ 1.51"
 *   { valueMax: 0.01, qualifier: '<', unit: '%' }                -> "< 0.01 %"
 *   { valueMin: 1e16, valueMax: 1e18, unit: 'Ω·cm' }             -> "1e+16 - 1e+18 Ω·cm"
 *
 * Returns null when there is no numeric value to render at all (the caller
 * is responsible for falling back to value_text / value_enum / value_bool
 * for non-numeric property data types).
 */
export function formatValue(input: FormatValueInput): string | null {
  const { valueMin, valueMax, valueTypical, qualifier, unit } = input;

  let core: string | null = null;
  if (valueMin != null && valueMax != null) {
    core = formatRange(valueMin, valueMax);
  } else if (valueTypical != null) {
    core = formatPlainNumber(valueTypical);
  } else if (valueMin != null) {
    core = formatPlainNumber(valueMin);
  } else if (valueMax != null) {
    core = formatPlainNumber(valueMax);
  }

  if (core === null) return null;

  const withQualifier = qualifier ? `${qualifier} ${core}` : core;
  return unit ? `${withQualifier} ${unit}` : withQualifier;
}
