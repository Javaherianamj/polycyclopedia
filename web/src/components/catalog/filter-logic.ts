// Pure matching logic, extracted from catalog-filter.ts's DOM wiring so it
// is testable without a browser environment. D6/FE-4: this is a client-side
// substring filter over the already-rendered card list, not a call to
// /api/materials?q= — real property-based search is FE-5/API-1's job.
export interface CatalogCard {
  nameFa: string;
  nameEn: string;
  code: string;
  family: string;
}

export function matchesQuery(card: CatalogCard, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (
    card.nameFa.toLowerCase().includes(q) ||
    card.nameEn.toLowerCase().includes(q) ||
    card.code.toLowerCase().includes(q)
  );
}

export function matchesFamily(card: CatalogCard, family: string | null): boolean {
  return family === null || card.family === family;
}

export function matchesCatalogFilter(
  card: CatalogCard,
  filter: { query: string; family: string | null },
): boolean {
  return matchesQuery(card, filter.query) && matchesFamily(card, filter.family);
}
