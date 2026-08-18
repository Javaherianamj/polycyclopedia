// FE-0 — one renderer, four themes.
//
// Every treatment renders the SAME content through the SAME markup, so what you
// are comparing is the design and not the copywriting. Layout differences are
// expressed as options here rather than as four hand-written pages, which is
// also how FE-1 will work: sections come from the registry (R2), never from JSX.

import { material, groups, strings as S } from './data.js';
import { initTheme, themeButton } from './theme.js';

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

// Latin numerals inside RTL prose need an LTR island (R6, D18).
const num = (v) => `<span class="num" dir="ltr">${v}</span>`;

function valueAtom(p) {
  const wrap = el('span', 'value');

  if (p.status === 'missing') {
    wrap.classList.add('is-missing');
    wrap.innerHTML =
      `<span class="value-missing">${S.missing}</span>` +
      `<a class="value-cta" href="#contribute">${S.missingCta}</a>`;
    return wrap;
  }

  wrap.innerHTML =
    `<span class="value-num">${num(p.value)}</span>` +
    (p.unit ? `<span class="value-unit" dir="ltr">${p.unit}</span>` : '');

  const mark = el('button', `mark mark-${p.status}`);
  mark.type = 'button';
  mark.setAttribute('aria-label', p.status === 'sourced' ? S.sourced : S.unsourced);
  mark.innerHTML = p.status === 'sourced' ? '§' : '?';

  const pop = el('span', 'pop');
  pop.innerHTML =
    p.status === 'sourced'
      ? `<b>${S.sourced}</b><span>${p.citation.workFa}</span>` +
        `<span class="pop-meta" dir="ltr">${p.citation.workEn} · ed. ${p.citation.edition} · p. ${p.citation.page}</span>`
      : `<b>${S.unsourced}</b><span>${S.unsourcedLong}</span>`;

  mark.appendChild(pop);
  wrap.appendChild(mark);
  return wrap;
}

function propertyRow(p) {
  const row = el('div', 'prop');

  const label = el('div', 'prop-label');
  label.innerHTML =
    `<span class="prop-name">${p.nameFa}</span>` +
    (p.symbol ? `<span class="prop-sym" dir="ltr">${p.symbol}</span>` : '');

  // The ⓘ belongs to the property name — "what is this?" — and is deliberately
  // a different target from the provenance mark on the value (D4 resolution).
  const info = el('button', 'info');
  info.type = 'button';
  info.setAttribute('aria-label', p.nameFa);
  info.textContent = 'i';
  info.appendChild(el('span', 'pop pop-info', `<span>${p.descFa}</span>`));
  label.appendChild(info);

  row.appendChild(label);
  row.appendChild(valueAtom(p));
  return row;
}

function section(g) {
  const sec = el('section', `sec sec-${g.key}`);
  sec.id = g.key;

  const head = el('header', 'sec-head');
  head.innerHTML = `<h2>${g.nameFa}</h2><span class="sec-en" dir="ltr">${g.nameEn}</span>`;
  sec.appendChild(head);

  const body = el('div', 'sec-body');
  g.properties.forEach((p) => body.appendChild(propertyRow(p)));
  sec.appendChild(body);

  if (g.note) sec.appendChild(el('p', 'sec-note', g.note));

  // The bridge that turns a pile of widgets into a path (R28, S10).
  if (g.learn) {
    const bridge = el('a', 'bridge');
    bridge.href = '#learn';
    bridge.innerHTML =
      `<span class="bridge-label">${g.learn.label}</span>` +
      `<span class="bridge-hint">${g.learn.hint}</span>` +
      `<span class="bridge-go" aria-hidden="true">←</span>`;
    sec.appendChild(bridge);
  }

  return sec;
}

export function render(root, opts = {}) {
  const { emoji = '🧪' } = opts;
  initTheme();
  root.innerHTML = '';

  // --- top bar -------------------------------------------------------------
  const bar = el('header', 'topbar');
  bar.innerHTML = `
    <div class="topbar-in">
      <a class="brand" href="#"><span class="brand-mark" aria-hidden="true">${emoji}</span>
        <span class="brand-name" dir="ltr">${S.brand}</span></a>
      <nav class="topnav">
        <a href="#">${S.catalog}</a><a href="#">${S.search}</a>
        <a href="#">${S.compare}</a><a href="#">${S.sources}</a>
      </nav>
      <div class="topbar-end">
        <button type="button" class="lang" dir="ltr">FA / EN</button>
      </div>
    </div>`;
  bar.querySelector('.topbar-end').prepend(themeButton());
  root.appendChild(bar);

  root.appendChild(el('div', 'mocknote', S.mockNote));

  // --- hero ----------------------------------------------------------------
  const hero = el('div', 'hero');
  const pct = Math.round((material.coverage.sourced / material.coverage.total) * 100);
  hero.innerHTML = `
    <nav class="crumbs"><a href="#">${S.catalog}</a><span>/</span>
      <a href="#">${material.familyFa}</a><span>/</span><b>${material.code}</b></nav>
    <div class="hero-main">
      <div class="hero-text">
        <div class="hero-code" dir="ltr">${material.code}</div>
        <h1>${material.nameFa}</h1>
        <p class="hero-en" dir="ltr">${material.nameEn} · ${material.familyEn}</p>
        <p class="hero-overview">${material.overviewFa}</p>
      </div>
      <aside class="hero-facts">
        <dl>
          <dt>${S.cas}</dt><dd>${num(material.cas)}</dd>
          <dt>${S.resin}</dt><dd>${num('#' + material.resinCode)}</dd>
          <dt>${S.family}</dt><dd>${material.familyFa}</dd>
          <dt>${S.discovered}</dt><dd>${num(material.discoveryYear)} · <span dir="ltr">${material.discoveryOrg}</span></dd>
        </dl>
      </aside>
    </div>
    <div class="coverage">
      <div class="coverage-bar"><i style="inline-size:${Math.max(pct, 1.5)}%"></i></div>
      <span class="coverage-text">${S.coverage(num(material.coverage.sourced), num(material.coverage.total))}</span>
    </div>
    <div class="surfaces">
      <span class="surface is-on">${S.datasheet}</span>
      <a class="surface" href="#learn">${S.learn} <span aria-hidden="true">←</span></a>
    </div>`;
  root.appendChild(hero);

  // --- body: rail + sections ----------------------------------------------
  const main = el('div', 'main');

  const rail = el('nav', 'rail');
  rail.innerHTML =
    '<ul>' +
    groups
      .map((g, i) => `<li><a href="#${g.key}"${i === 0 ? ' class="on"' : ''}>${g.nameFa}</a></li>`)
      .join('') +
    '</ul>';
  main.appendChild(rail);

  const col = el('div', 'col');
  groups.forEach((g) => col.appendChild(section(g)));

  const tail = el('div', 'tail');
  tail.innerHTML =
    `<a class="tail-card" href="#">${S.similar}</a>` +
    `<a class="tail-card" href="#">${S.quickCompare}</a>`;
  col.appendChild(tail);

  main.appendChild(col);
  root.appendChild(main);

  root.appendChild(el('footer', 'foot', `<span dir="ltr">${S.brand}</span> · ${S.credit}`));

  // Rail follows the scroll. Cheap, and it is the behaviour being judged.
  const links = [...rail.querySelectorAll('a')];
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) =>
          a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id),
        );
      });
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );
  groups.forEach((g) => obs.observe(document.getElementById(g.key)));
}
