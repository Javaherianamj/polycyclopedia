// One preference, two surfaces, four palettes.
//
// The theme is stored once and shared: choosing dark on the datasheet keeps you
// dark when you walk into Learn. Each surface then renders its OWN
// interpretation of that choice — the datasheet goes warm, Learn goes cool.
// Light is the default (D19).

const KEY = 'polypedia-theme';

export function initTheme() {
  document.documentElement.dataset.theme = localStorage.getItem(KEY) || 'light';
}

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

  // Switch instantly. Animating a theme change looks like a bug, and a
  // transition that starts in a throttled tab may never resolve.
  root.classList.add('no-transition');
  root.dataset.theme = next;
  localStorage.setItem(KEY, next);
  // setTimeout, not requestAnimationFrame: rAF is throttled in a backgrounded
  // or non-compositing tab, which would leave `no-transition` stuck on and kill
  // every hover transition on the page for the rest of the session.
  setTimeout(() => root.classList.remove('no-transition'), 60);

  return next;
}

export function themeButton(labels = { light: 'شب', dark: 'روز' }) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'theme';
  const sync = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    b.textContent = dark ? labels.dark : labels.light;
    b.setAttribute('aria-label', dark ? 'حالت روشن' : 'حالت تاریک');
  };
  b.addEventListener('click', () => {
    toggleTheme();
    sync();
  });
  sync();
  return b;
}
