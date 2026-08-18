// Small formatting helpers shared by the slider panel and result cards.
// Latin numerals everywhere (D18) -- no locale-aware digit substitution.

export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatRange(min: number, max: number, unit: string | null): string {
  const range = min === max ? formatNumber(min) : `${formatNumber(min)}–${formatNumber(max)}`;
  return unit ? `${range} ${unit}` : range;
}

export function propertyName(
  property: { nameFa: string; nameEn: string },
  locale: 'fa' | 'en',
): string {
  return locale === 'fa' ? property.nameFa : property.nameEn;
}
