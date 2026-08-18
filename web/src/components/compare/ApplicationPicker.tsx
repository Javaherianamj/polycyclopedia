// FE-6 — CR4: the ONE control that turns polarity colour on at all. Absent
// or set back to "none", the table carries zero good/bad hue regardless of
// what `application_property_polarity` says (enforced upstream too — see
// `client.ts#getCompareTable`'s comment about omitting the query param
// entirely, not sending an empty one).
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';
import type { CompareApiApplication } from '../../lib/api/types';

interface ApplicationPickerProps {
  applications: CompareApiApplication[];
  applicationKey: string | undefined;
  onChange: (key: string | undefined) => void;
  locale: Locale;
}

export function ApplicationPicker({
  applications,
  applicationKey,
  onChange,
  locale,
}: ApplicationPickerProps) {
  return (
    <div className="cmp-application" data-testid="compare-application-picker">
      <label className="cmp-application-label" htmlFor="compare-application-select">
        {t(locale, 'compare.applicationLabel')}
      </label>
      <select
        id="compare-application-select"
        className="cmp-application-select"
        value={applicationKey ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        data-testid="compare-application-select"
      >
        <option value="">{t(locale, 'compare.applicationNone')}</option>
        {applications.map((app) => (
          <option key={app.key} value={app.key}>
            {locale === 'fa' ? app.nameFa : app.nameEn}
          </option>
        ))}
      </select>
      <p className="cmp-application-hint">{t(locale, 'compare.applicationHint')}</p>
    </div>
  );
}
