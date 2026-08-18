// BR7: sends the full current result set to FE-6's (not yet built) compare
// route, uncapped -- any limit is FE-6's decision, not FE-5's. Same
// `?add=` param name BottomLinks.astro already uses for a single slug
// (datasheet/BottomLinks.astro), extended to a comma-separated list here.
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';

interface CompareHandoffButtonProps {
  resultSlugs: string[];
  locale: Locale;
}

export function CompareHandoffButton({ resultSlugs, locale }: CompareHandoffButtonProps) {
  const disabled = resultSlugs.length === 0;
  const href = disabled ? undefined : `/${locale}/compare?add=${resultSlugs.join(',')}`;

  return (
    <a
      className="search-compare-button home-cta home-cta-primary"
      href={href}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      data-testid="search-compare-all-button"
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {t(locale, 'search.compareButton')}
    </a>
  );
}
