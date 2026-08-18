// BR9: an unrecognized alias token or unparseable number is dropped from
// the active filter set (not a hard query error) and surfaced as a hint
// beneath the text box, never silently discarded.
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';

interface UnrecognizedTokenHintsProps {
  tokens: string[];
  locale: Locale;
}

export function UnrecognizedTokenHints({ tokens, locale }: UnrecognizedTokenHintsProps) {
  return (
    <ul className="search-unrecognized-hints" data-testid="search-unrecognized-hints">
      {tokens.map((token) => (
        <li key={token} className="search-unrecognized-hint" data-testid="search-unrecognized-hint">
          {t(locale, 'search.unrecognizedToken').replace('{token}', token)}
        </li>
      ))}
    </ul>
  );
}
