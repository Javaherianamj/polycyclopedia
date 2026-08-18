import { describe, expect, it } from 'vitest';
import { formatLocator, provenanceState } from './logic';
import type { Citation, PropertyValue } from '../../lib/api/types';

// Fixture data, clearly labelled as such — not a claim about real Polypedia
// content. Real citation coverage is 0% right now (see root README), so the
// "cited" path has no live page to demonstrate it against; this is where
// that state is actually proven.
function fixtureCitation(overrides: Partial<Citation> = {}): Citation {
  return {
    id: 'c1',
    locator: { page: 233 },
    role: 'primary',
    extractionMethod: 'manual',
    sourceTitle: 'Polymer Handbook',
    sourceEdition: '4th',
    ...overrides,
  };
}

function fixtureValue(overrides: Partial<PropertyValue> = {}): PropertyValue {
  return {
    key: 'density',
    nameFa: 'چگالی',
    nameEn: 'Density',
    symbol: null,
    dataType: 'numeric',
    valueMin: 0.91,
    valueMax: 0.925,
    valueTypical: null,
    valueTextFa: null,
    valueTextEn: null,
    valueEnum: null,
    valueBool: null,
    qualifier: null,
    unit: 'g/cm³',
    display: '0.910 - 0.925 g/cm³',
    status: 'unsourced',
    citations: [],
    ...overrides,
  };
}

describe('provenanceState', () => {
  it('is "missing" when there is no property_value row at all', () => {
    expect(provenanceState(null)).toBe('missing');
  });

  it('is "uncited" for a real, present value with zero citations (the current majority case)', () => {
    expect(provenanceState(fixtureValue({ citations: [] }))).toBe('uncited');
  });

  it('is "cited" once at least one citation is attached, regardless of value_status', () => {
    // value_status is 'draft' here on purpose -- provenance is derived from
    // citations.length, never from the editorial workflow status.
    expect(provenanceState(fixtureValue({ status: 'draft', citations: [fixtureCitation()] }))).toBe(
      'cited',
    );
  });

  it('is "cited" even with multiple citations, including a conflicting one', () => {
    const value = fixtureValue({
      citations: [
        fixtureCitation({ role: 'primary' }),
        fixtureCitation({ id: 'c2', role: 'conflicting' }),
      ],
    });
    expect(provenanceState(value)).toBe('cited');
    expect(value.citations).toHaveLength(2);
  });
});

describe('formatLocator', () => {
  it('renders a single page locator', () => {
    expect(formatLocator({ page: 233 }, 'en')).toBe('p. 233');
    expect(formatLocator({ page: 233 }, 'fa')).toBe('صفحه 233');
  });

  it('renders every present key, in a fixed order, when more than one is present', () => {
    expect(formatLocator({ table: '3-2', page: 45 }, 'en')).toBe('p. 45 · table 3-2');
  });

  it('ignores keys explicitly set to null or undefined', () => {
    expect(formatLocator({ page: 12, table: undefined, figure: null as never }, 'en')).toBe(
      'p. 12',
    );
  });
});
