// The one unit conversion the NOTEBOOK content shape allows a `liveValue`
// segment to apply (types.ts's `transform?: 'celsiusToFahrenheit'`).
// Arithmetic on an already-real, already-cited-or-not number — never a
// second measurement or a second citation (see types.ts's `ProseSegment`
// header for the full reasoning).
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}
