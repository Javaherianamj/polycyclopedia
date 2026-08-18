// Plain controlled text input; parsing (business-logic-model.md §3) runs in
// the pure `parseQuery` function (web/src/lib/search/parse-query.ts, called
// from the island's onChange handler, not inline here -- same pure-logic-
// first split as filter-logic.ts/catalog-filter.ts).
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import { UnrecognizedTokenHints } from './UnrecognizedTokenHints';

interface QueryTextBoxProps {
  value: string;
  onChange: (raw: string) => void;
  unrecognizedTokens: string[];
  locale: Locale;
}

export function QueryTextBox({ value, onChange, unrecognizedTokens, locale }: QueryTextBoxProps) {
  return (
    <div className="search-query-box">
      <label htmlFor="search-query-input" className="search-query-label">
        {t(locale, 'search.queryLabel')}
      </label>
      <input
        id="search-query-input"
        type="text"
        className="search-query-input"
        data-testid="search-query-input"
        placeholder={t(locale, 'search.queryPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir="ltr"
        autoComplete="off"
        spellCheck={false}
      />
      {unrecognizedTokens.length > 0 ? (
        <UnrecognizedTokenHints tokens={unrecognizedTokens} locale={locale} />
      ) : null}
    </div>
  );
}
