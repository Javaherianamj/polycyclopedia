import { describe, expect, it } from 'vitest';
import { matchesCatalogFilter, matchesFamily, matchesQuery } from './filter-logic';
import type { CatalogCard } from './filter-logic';

const ldpe: CatalogCard = {
  nameFa: 'پلی‌اتیلن با چگالی پایین',
  nameEn: 'Low-Density Polyethylene',
  code: 'LDPE',
  family: 'polyolefins',
};
const pvc: CatalogCard = {
  nameFa: 'پلی وینیل کلراید',
  nameEn: 'Polyvinyl Chloride',
  code: 'PVC',
  family: 'vinyls',
};

describe('matchesQuery', () => {
  it('matches every card when the query is empty', () => {
    expect(matchesQuery(ldpe, '')).toBe(true);
    expect(matchesQuery(ldpe, '   ')).toBe(true);
  });

  it('matches on the English name, case-insensitively', () => {
    expect(matchesQuery(ldpe, 'polyethylene')).toBe(true);
    expect(matchesQuery(ldpe, 'POLYETHYLENE')).toBe(true);
  });

  it('matches on the Persian name', () => {
    expect(matchesQuery(ldpe, 'چگالی')).toBe(true);
  });

  it('matches on the code', () => {
    expect(matchesQuery(ldpe, 'ldpe')).toBe(true);
  });

  it('does not match an unrelated query', () => {
    expect(matchesQuery(ldpe, 'epoxy')).toBe(false);
  });
});

describe('matchesFamily', () => {
  it('matches every card when no family is selected', () => {
    expect(matchesFamily(ldpe, null)).toBe(true);
  });

  it('matches only the named family', () => {
    expect(matchesFamily(ldpe, 'polyolefins')).toBe(true);
    expect(matchesFamily(ldpe, 'vinyls')).toBe(false);
  });
});

describe('matchesCatalogFilter', () => {
  it('requires both the query and the family to match', () => {
    expect(matchesCatalogFilter(pvc, { query: 'chloride', family: 'vinyls' })).toBe(true);
    expect(matchesCatalogFilter(pvc, { query: 'chloride', family: 'polyolefins' })).toBe(false);
    expect(matchesCatalogFilter(pvc, { query: 'polyethylene', family: 'vinyls' })).toBe(false);
  });
});
