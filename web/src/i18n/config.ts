export const locales = ['fa', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fa';

// R6: RTL-first. Direction is a per-locale, page-level property here — this
// is not the LTR-as-exception the rule forbids, which is about Latin spans
// inside Persian content, not the English route's own pages.
export const direction: Record<Locale, 'rtl' | 'ltr'> = {
  fa: 'rtl',
  en: 'ltr',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
