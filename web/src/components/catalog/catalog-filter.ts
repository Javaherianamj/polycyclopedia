import { matchesCatalogFilter, type CatalogCard } from './filter-logic';

// R13: every result state has its own URL, without a backend -- the filter
// state lives in ?q=/?family=, restored on load, updated via
// history.replaceState (not pushState: filtering isn't a navigation the
// back button should have to step through one keystroke at a time).
const input = document.querySelector<HTMLInputElement>('[data-testid="catalog-search-input"]');
const chips = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-testid="catalog-family-chip"]'),
];
const cards = [...document.querySelectorAll<HTMLAnchorElement>('[data-testid="material-card"]')];
const emptyState = document.querySelector<HTMLElement>('[data-testid="catalog-empty"]');

function cardOf(el: HTMLAnchorElement): CatalogCard {
  return {
    nameFa: el.dataset.nameFa ?? '',
    nameEn: el.dataset.nameEn ?? '',
    code: el.dataset.code ?? '',
    family: el.dataset.family ?? '',
  };
}

function currentFamily(): string | null {
  const active = chips.find((c) => c.classList.contains('is-active'));
  return active?.dataset.family || null;
}

function apply() {
  const query = input?.value ?? '';
  const family = currentFamily();
  let visibleCount = 0;
  for (const card of cards) {
    const visible = matchesCatalogFilter(cardOf(card), { query, family });
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  }
  if (emptyState) emptyState.hidden = visibleCount > 0;

  const url = new URL(window.location.href);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  if (family) url.searchParams.set('family', family);
  else url.searchParams.delete('family');
  window.history.replaceState(null, '', url);
}

// Restore from a shared/bookmarked URL before wiring interaction.
const initial = new URL(window.location.href).searchParams;
if (input && initial.has('q')) input.value = initial.get('q') ?? '';
const initialFamily = initial.get('family');
if (initialFamily) {
  const match = chips.find((c) => c.dataset.family === initialFamily);
  match?.classList.add('is-active');
}

input?.addEventListener('input', apply);
for (const chip of chips) {
  chip.addEventListener('click', () => {
    const isActive = chip.classList.contains('is-active');
    for (const c of chips) c.classList.remove('is-active');
    if (!isActive) chip.classList.add('is-active');
    apply();
  });
}

apply();
