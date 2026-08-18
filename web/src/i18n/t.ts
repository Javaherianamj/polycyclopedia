import fa from './fa.json';
import en from './en.json';
import type { Locale } from './config';

const dictionaries = { fa, en } satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof typeof fa;

// R14: no user-visible string is written inline in a component. A missing
// key throws at build time rather than rendering silently, so the rule has
// a build-time backstop rather than depending entirely on code review.
export function t(locale: Locale, key: MessageKey): string {
  const dictionary = dictionaries[locale];
  const value = dictionary[key];
  if (value === undefined) {
    throw new Error(`Missing i18n key "${key}" for locale "${locale}"`);
  }
  return value;
}
