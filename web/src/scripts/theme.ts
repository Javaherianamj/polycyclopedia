// Ported from design/fe-0/theme.js — same key, same behaviour. The
// no-flash read on load is inlined directly in BaseLayout.astro's <head>
// (it must block before first paint; this module, loaded normally, would
// run too late). This file is only the part that runs after that: the
// toggle.
const KEY = 'polypedia-theme';

export function toggleTheme(): 'light' | 'dark' {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

  // Switch instantly. Animating a theme change looks like a bug, and a
  // transition that starts in a throttled tab may never resolve.
  root.classList.add('no-transition');
  root.dataset.theme = next;
  localStorage.setItem(KEY, next);
  // setTimeout, not requestAnimationFrame: rAF is throttled in a
  // backgrounded or non-compositing tab, which would leave `no-transition`
  // stuck on and kill every hover transition for the rest of the session.
  setTimeout(() => root.classList.remove('no-transition'), 60);

  return next;
}
