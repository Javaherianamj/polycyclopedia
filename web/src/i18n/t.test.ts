import { describe, expect, it } from 'vitest';
import { t, type MessageKey } from './t';
import fa from './fa.json';
import en from './en.json';
import { locales } from './config';

const keys = Object.keys(fa) as MessageKey[];

describe('t', () => {
  it('resolves every key for every locale', () => {
    for (const locale of locales) {
      for (const key of keys) {
        expect(t(locale, key)).toEqual(expect.any(String));
        expect(t(locale, key).length).toBeGreaterThan(0);
      }
    }
  });

  it('throws on a missing key rather than rendering silently', () => {
    // R14's build-time backstop — cast past the type system the way a
    // stale reference to a removed key would slip through in practice.
    expect(() => t('fa', 'not.a.real.key' as MessageKey)).toThrow(/Missing i18n key/);
  });

  it('fa and en carry exactly the same key set', () => {
    // R15: Persian is authored first and English is verified against it —
    // this is the automated form of that check, catching drift a reviewer
    // could otherwise miss.
    expect(Object.keys(en).sort()).toEqual(Object.keys(fa).sort());
  });
});
