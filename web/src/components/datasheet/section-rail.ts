// Scroll-spy for the sticky section rail (S2: "the sticky section rail
// jumps to any group and reflects scroll position"). Ported from
// design/fe-0/render.js's already-working IntersectionObserver, unchanged
// in approach -- FE-0 built this correctly the first time, there was
// nothing to fix.
const rail = document.querySelector<HTMLElement>('.rail');
if (rail) {
  const links = [...rail.querySelectorAll<HTMLAnchorElement>('a')];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          link.classList.toggle('on', link.getAttribute('href') === `#${entry.target.id}`);
        }
      }
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );
  for (const link of links) {
    const id = link.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (target) observer.observe(target);
  }
}
