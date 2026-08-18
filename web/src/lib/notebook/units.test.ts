import { describe, expect, it } from 'vitest';
import { celsiusToFahrenheit } from './units';

describe('celsiusToFahrenheit', () => {
  it('converts freezing and boiling reference points correctly', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it('rounds to the nearest whole degree, matching the FE-0 prototype convention', () => {
    // The FE-0 prototype (design/fe-0/lab/notebook.js) computed
    // Math.round((105 * 9) / 5 + 32) === 221 for its own LDPE Tm example.
    expect(celsiusToFahrenheit(105)).toBe(221);
    expect(celsiusToFahrenheit(115)).toBe(239);
  });

  it('handles negative temperatures (e.g. Tg values in this catalog)', () => {
    expect(celsiusToFahrenheit(-110)).toBe(-166);
  });
});
