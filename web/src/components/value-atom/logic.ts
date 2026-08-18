import type { CitationLocator, PropertyValue } from '../../lib/api/types';
import type { Locale } from '../../i18n/config';
import { t } from '../../i18n/t';

// R12/D21: provenance is about whether a value HAS a citation, not its
// editorial workflow status (draft/in_review/published/unsourced) -- nothing
// in R1/R10/R11/R12/R22 gives value_status a reader-facing treatment, and
// v_citation_coverage (the API's own coverage figure) already defines
// citedness this way. `value === null` means the property has no row at all
// for this material (D11's "missing" — a fact FE-3 computes by diffing
// /api/properties against a material's propertyGroups, not something this
// component can know on its own).
export type ProvenanceState = 'missing' | 'uncited' | 'cited';

export function provenanceState(value: PropertyValue | null): ProvenanceState {
  if (value === null) return 'missing';
  return value.citations.length > 0 ? 'cited' : 'uncited';
}

const LOCATOR_KEYS = ['page', 'table', 'figure', 'section'] as const;

// db/migrations/0006_citations.sql's CHECK guarantees at least one of these
// is present; more than one may be (e.g. a value drawn from a table that
// itself sits on a numbered page). All present keys are rendered, in a
// fixed order, not just the first one found.
export function formatLocator(locator: CitationLocator, locale: Locale): string {
  const parts: string[] = [];
  for (const key of LOCATOR_KEYS) {
    const raw = locator[key];
    if (raw === undefined || raw === null) continue;
    parts.push(`${t(locale, `value.citation.${key}`)} ${raw}`);
  }
  return parts.join(' · ');
}
