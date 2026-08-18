// L4 — «دفترچه» / NOTEBOOK's page chrome: reading-progress bar, TOC
// scroll-spy, and the mobile sidenote toggle. Plain DOM script, not a
// React island — none of this needs component state or live data (build
// brief: "only genuinely interactive parts... are islands or small
// scripts"), and `SectionRail.astro`'s own `section-rail.ts` already
// established this exact pattern (a plain module `<script>` doing
// IntersectionObserver-based scroll-spy) for the datasheet's rail. This
// file is that same pattern, extended with a progress bar and a sidenote
// toggle the datasheet's rail does not need.

// ---------------------------------------------------------- reading progress
{
  const bar = document.querySelector<HTMLElement>('.nb-progress-fill');
  const article = document.querySelector<HTMLElement>('.nb-article');
  if (bar && article) {
    const paint = () => {
      const rect = article.getBoundingClientRect();
      // Same "finish near the end of the viewport, not exactly at the
      // last pixel" easing the FE-0 prototype used: total scrollable
      // distance is the article's height minus half a viewport, so the
      // bar reaches 100% a little before the reader hits the very last
      // line, which reads as complete rather than perpetually short.
      const total = rect.height - window.innerHeight * 0.5;
      const passed = -rect.top;
      const pct = total > 0 ? Math.max(0, Math.min(100, (passed / total) * 100)) : 0;
      bar.style.inlineSize = `${pct}%`;
    };
    document.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }
}

// ------------------------------------------------------------------- TOC
{
  const rail = document.querySelector<HTMLElement>('.nb-toc');
  if (rail) {
    const links = [...rail.querySelectorAll<HTMLAnchorElement>('a')];
    const targets = links
      .map((a) => {
        const id = a.getAttribute('href')?.slice(1);
        return id ? document.getElementById(id) : null;
      })
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            for (const link of links) {
              link.classList.toggle('on', link.getAttribute('href') === `#${entry.target.id}`);
            }
          }
        },
        // Same band SectionRail's scroll-spy uses: a heading counts as
        // "current" once it has cleared the top 20% of the viewport and
        // before it reaches the bottom 30%, so the highlighted section is
        // whichever one occupies the reading position, not literally
        // whatever is nearest the top edge.
        { rootMargin: '-20% 0px -70% 0px' },
      );
      for (const target of targets) observer.observe(target);
    }
  }
}

// -------------------------------------------------------------- sidenotes
{
  document.querySelectorAll<HTMLButtonElement>('.nb-note-ref').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.noteFor;
      const noteEl = id ? document.getElementById(id) : null;
      if (!noteEl) return;
      const open = noteEl.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}
