// L3 — «شبکه» / GRAPH
//
// A causal graph you push on, not a settings page. Three structural causes
// (branching, cooling rate, molecular weight) sit on vertical drag-tracks.
// Moving one recomputes six derived properties through simple, hand-written
// monotonic relations, which in turn light up (or don't) three terminal
// outcome nodes.
//
// Honesty rules this file follows throughout (R5, R7, spec constraint 7/8):
//   - The MIN/MAX bounds every derived readout is scaled into are the REAL
//     ranges from data.js (density, Tm, young_modulus, tensile_strength,
//     mfi). Those bounds carry their real data.js `status` — most are
//     'unsourced', shown honestly with the dashed grey mark.
//   - The interpolation *between* those bounds — i.e. the causal formulas
//     themselves — is this file's own invention for teaching purposes. It is
//     captioned "نمایشی" (illustrative) on every single derived node, in the
//     side panel, and in the closing note. It is never presented as measured.
//   - "درجه بلورینگی" (crystallinity) has no row in data.js at all — LDPE's
//     crystallinity isn't a curated property yet. Its node is marked
//     "بدون ردیف دیتاشیت" (no datasheet row) rather than borrowing a status
//     that isn't true.

import { material, groups } from '../data.js';
import { initTheme, themeButton } from '../theme.js';

initTheme();

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function svgEl(tag, attrs = {}) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

// ---------------------------------------------------------------- data.js lookup

function propByKey(key) {
  for (const g of groups) {
    const p = g.properties.find((x) => x.key === key);
    if (p) return p;
  }
  return null;
}

const D_DENSITY = propByKey('density'); // '0.910 - 0.925' g/cm3, unsourced
const D_TM = propByKey('tm'); // '105 - 115' °C, unsourced
const D_MODULUS = propByKey('young_modulus'); // '0.15 - 0.35' GPa, unsourced
const D_TENSILE = propByKey('tensile_strength'); // '8 - 15' MPa, unsourced
const D_MFI = propByKey('mfi'); // '0.2 - 20' g/10min, unsourced

// ---------------------------------------------------------------- causal model
//
// Every constant below is a design decision for this mock, not a citation.
// Comments say so at each step so nobody mistakes a slope for a measurement.

const CAUSE_DEFAULT = { branching: 0.55, cooling: 0.4, mw: 0.5 };

function computeDerived(v) {
  // crystallinity (%): more branching and faster cooling both suppress it.
  // 55% down to 30% is a plausible LDPE-ish band, not a sourced figure —
  // crystallinity has no row in data.js to anchor to.
  const cryst = clamp(55 - 20 * v.branching - 10 * v.cooling, 30, 58);
  const cn = (cryst - 30) / (58 - 30); // 0..1

  // Everything below is scaled into the REAL min/max from data.js. The shape
  // of the interpolation (linear, weighted by cn/mw) is illustrative; the
  // endpoints are the actual seeded values.
  const density = 0.91 + 0.015 * cn; // → 0.910 - 0.925
  const tm = 105 + 10 * cn; // → 105 - 115
  const modulus = 0.15 + 0.2 * cn; // → 0.15 - 0.35
  const tensile = clamp(8 + 5 * cn + 2 * v.mw, 8, 15); // → 8 - 15
  const mfi = clamp(20 - 19.6 * v.mw, 0.2, 20); // → 0.2 - 20 (inverse of Mw)

  return { cryst, density, tm, modulus, tensile, mfi };
}

// Outcome bands are this mock's own rule of thumb, not a spec. Said plainly
// in the closing note.
function computeOutcomes(d) {
  return {
    film: d.mfi <= 3,
    inj: d.mfi > 3,
    cable: d.density <= 0.9185,
  };
}

// ---------------------------------------------------------------------- layout
//
// Hand-placed, not force-simulated (spec: "legible and stable"). SVG x grows
// toward the picture's right edge, which is the reading-leading edge in this
// RTL page — causes sit rightmost, outcomes leftmost, the same direction the
// reader's eye already moves in.

const VB = { w: 1040, h: 620 };

const CAUSES = {
  branching: { x: 950, top: 46, bottom: 168, label: 'شاخه‌ای شدن', hiFa: 'زیاد', loFa: 'کم' },
  cooling: { x: 950, top: 246, bottom: 368, label: 'نرخ سرد شدن', hiFa: 'سریع', loFa: 'آهسته' },
  mw: { x: 950, top: 446, bottom: 568, label: 'وزن مولکولی', hiFa: 'بالا', loFa: 'پایین' },
};

const DERIVED = {
  cryst: { x: 690, y: 150, label: 'درجه بلورینگی', sym: null, unit: '%', dec: 0, dprop: null },
  mfi: {
    x: 690,
    y: 500,
    label: 'شاخص جریان مذاب',
    sym: 'MFI',
    unit: 'g/10min',
    dec: 1,
    dprop: D_MFI,
  },
  density: { x: 420, y: 62, label: 'چگالی', sym: 'ρ', unit: 'g/cm³', dec: 3, dprop: D_DENSITY },
  tm: { x: 420, y: 210, label: 'دمای ذوب بلوری', sym: 'Tm', unit: '°C', dec: 0, dprop: D_TM },
  modulus: { x: 420, y: 358, label: 'مدول یانگ', sym: 'E', unit: 'GPa', dec: 2, dprop: D_MODULUS },
  tensile: {
    x: 420,
    y: 506,
    label: 'استحکام کششی',
    sym: 'σ',
    unit: 'MPa',
    dec: 1,
    dprop: D_TENSILE,
  },
};

const OUTCOMES = {
  film: { x: 130, y: 140, label: 'فیلم دمشی' },
  inj: { x: 130, y: 320, label: 'قالب‌گیری تزریقی' },
  cable: { x: 130, y: 500, label: 'عایق کابل' },
};

const EDGES = [
  { from: 'branching', to: 'cryst', sign: -1 },
  { from: 'cooling', to: 'cryst', sign: -1 },
  { from: 'mw', to: 'mfi', sign: -1 },
  { from: 'cryst', to: 'density', sign: 1 },
  { from: 'cryst', to: 'tm', sign: 1 },
  { from: 'cryst', to: 'modulus', sign: 1 },
  { from: 'cryst', to: 'tensile', sign: 1 },
  { from: 'mw', to: 'tensile', sign: 1 },
  { from: 'mfi', to: 'film', sign: -1 },
  { from: 'mfi', to: 'inj', sign: 1 },
  { from: 'density', to: 'cable', sign: -1 },
];

// reachability from a given cause, for the pulse animation
function downstreamOf(key) {
  const seen = new Set([key]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of EDGES) {
      if (seen.has(e.from) && !seen.has(e.to)) {
        seen.add(e.to);
        grew = true;
      }
    }
  }
  seen.delete(key);
  return seen;
}

// ---------------------------------------------------------------------- state

const state = { ...CAUSE_DEFAULT };

function causeNodeY(key) {
  const c = CAUSES[key];
  return c.bottom - state[key] * (c.bottom - c.top);
}
function causeNodeX(key) {
  return CAUSES[key].x;
}
function nodePoint(key) {
  if (CAUSES[key]) return { x: causeNodeX(key), y: causeNodeY(key) };
  if (DERIVED[key]) return { x: DERIVED[key].x, y: DERIVED[key].y };
  if (OUTCOMES[key]) return { x: OUTCOMES[key].x, y: OUTCOMES[key].y };
  return { x: 0, y: 0 };
}

function fmt(v, dec) {
  return v.toFixed(dec);
}

// ------------------------------------------------------------------- building

const refs = {
  edgePaths: {},
  edgeLabels: {},
  edgePulses: {},
  derivedVal: {},
  outcomeHex: {},
  outcomeGroup: {},
};

function edgeKey(e) {
  return e.from + '>' + e.to;
}

function quadFor(e) {
  const p0 = nodePoint(e.from);
  const p2 = nodePoint(e.to);
  const mx = (p0.x + p2.x) / 2;
  const my = (p0.y + p2.y) / 2;
  // constant upward bow — purely cosmetic, not encoding anything
  const pc = { x: mx, y: my - 24 };
  return { p0, pc, p2 };
}
function quadPoint(p0, pc, p2, t) {
  const a = (1 - t) * (1 - t),
    b = 2 * (1 - t) * t,
    c = t * t;
  return { x: a * p0.x + b * pc.x + c * p2.x, y: a * p0.y + b * pc.y + c * p2.y };
}

function buildDefs(svg) {
  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: 'gr-arrow',
    viewBox: '0 0 10 10',
    refX: '8',
    refY: '5',
    markerWidth: '7',
    markerHeight: '7',
    orient: 'auto-start-reverse',
  });
  const arrowPath = svgEl('path', { d: 'M0,0 L10,5 L0,10 z', class: 'gr-arrow-fill' });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);
}

function buildEdges(svg) {
  const layer = svgEl('g', { class: 'edges-layer' });
  EDGES.forEach((e) => {
    const { p0, pc, p2 } = quadFor(e);
    const path = svgEl('path', {
      class: 'edge-path' + (e.sign < 0 ? ' sign-neg' : ''),
      d: `M${p0.x},${p0.y} Q${pc.x},${pc.y} ${p2.x},${p2.y}`,
      'marker-end': 'url(#gr-arrow)',
    });
    layer.appendChild(path);
    refs.edgePaths[edgeKey(e)] = path;

    const mid = quadPoint(p0, pc, p2, 0.52);
    const label = svgEl('text', {
      class: 'edge-sign ' + (e.sign > 0 ? 'sign-pos' : 'sign-neg'),
      x: mid.x,
      y: mid.y - 5,
    });
    label.textContent = e.sign > 0 ? '↑' : '↓';
    layer.appendChild(label);
    refs.edgeLabels[edgeKey(e)] = label;

    const pulse = svgEl('circle', { class: 'edge-pulse', r: 4, cx: p0.x, cy: p0.y });
    layer.appendChild(pulse);
    refs.edgePulses[edgeKey(e)] = pulse;
  });
  svg.appendChild(layer);
}

function markBadge(status) {
  const g = svgEl('g', { class: 'mark-badge st-' + (status || 'nodata') });
  g.appendChild(svgEl('circle', { r: 8 }));
  const t = svgEl('text', { 'text-anchor': 'middle', dy: '3' });
  t.textContent = status === 'sourced' ? '§' : status === 'unsourced' ? '?' : '×';
  g.appendChild(t);
  return g;
}

function buildCauseNode(svg, key) {
  const c = CAUSES[key];
  const g = svgEl('g', { class: 'node node-cause' });

  g.appendChild(
    svgEl('line', { class: 'node-cause-track', x1: c.x, x2: c.x, y1: c.top, y2: c.bottom }),
  );

  const loLabel = svgEl('text', { class: 'node-sub', x: c.x, y: c.bottom + 16 });
  loLabel.textContent = c.loFa;
  const hiLabel = svgEl('text', { class: 'node-sub', x: c.x, y: c.top - 8 });
  hiLabel.textContent = c.hiFa;
  g.appendChild(loLabel);
  g.appendChild(hiLabel);

  const nameLabel = svgEl('text', {
    class: 'node-label',
    x: c.x,
    y: c.top - 22,
    'font-weight': '600',
  });
  nameLabel.textContent = c.label;
  g.appendChild(nameLabel);

  const puck = svgEl('circle', {
    class: 'node-cause-puck',
    r: 15,
    cx: c.x,
    cy: causeNodeY(key),
    tabindex: '0',
    role: 'slider',
    'aria-label': c.label,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': Math.round(state[key] * 100),
  });
  g.appendChild(puck);
  refs['puck_' + key] = puck;

  attachDrag(svg, puck, key);
  svg.appendChild(g);
}

function buildDerivedNode(key) {
  const d = DERIVED[key];
  const g = svgEl('g', { class: 'node node-derived' });

  g.appendChild(svgEl('circle', { class: 'node-derived-circle', r: 30, cx: d.x, cy: d.y }));

  const nameLabel = svgEl('text', { class: 'node-label', x: d.x, y: d.y - 40 });
  nameLabel.textContent = d.sym ? `${d.label} · ${d.sym}` : d.label;
  g.appendChild(nameLabel);

  const val = svgEl('text', { class: 'node-val', x: d.x, y: d.y + 4 });
  g.appendChild(val);
  refs.derivedVal[key] = val;

  const unit = svgEl('text', { class: 'node-sub', x: d.x, y: d.y + 18 });
  unit.textContent = d.unit;
  g.appendChild(unit);

  const illus = svgEl('text', { class: 'node-illustrative', x: d.x, y: d.y + 46 });
  illus.textContent = 'نمایشی — نه مدلی صحه‌گذاری‌شده';
  g.appendChild(illus);

  const status = d.dprop ? d.dprop.status : null;
  const badge = markBadge(status);
  badge.setAttribute('transform', `translate(${d.x + 24}, ${d.y - 24})`);
  g.appendChild(badge);

  return g;
}

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

function buildOutcomeNode(key) {
  const o = OUTCOMES[key];
  const g = svgEl('g', { class: 'node node-outcome' });

  const hex = svgEl('polygon', { class: 'node-outcome-hex', points: hexPoints(o.x, o.y, 34) });
  g.appendChild(hex);
  refs.outcomeHex[key] = hex;

  const nameLabel = svgEl('text', { class: 'node-label', x: o.x, y: o.y - 2 });
  nameLabel.textContent = o.label;
  g.appendChild(nameLabel);

  const flag = svgEl('text', { class: 'node-sub', x: o.x, y: o.y + 14 });
  g.appendChild(flag);
  refs['outFlag_' + key] = flag;

  refs.outcomeGroup[key] = g;
  return g;
}

function buildGraph(container) {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${VB.w} ${VB.h}`,
    role: 'img',
    'aria-label': 'نمودار علّی خواص LDPE',
  });
  buildDefs(svg);
  buildEdges(svg);
  Object.keys(DERIVED).forEach((k) => svg.appendChild(buildDerivedNode(k)));
  Object.keys(OUTCOMES).forEach((k) => svg.appendChild(buildOutcomeNode(k)));
  Object.keys(CAUSES).forEach((k) => buildCauseNode(svg, k));
  container.appendChild(svg);
  return svg;
}

// -------------------------------------------------------------------- drag

function clientToPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

function attachDrag(svg, puck, key) {
  const c = CAUSES[key];
  let dragging = false;

  function setFromY(y) {
    const clamped = clamp(y, c.top, c.bottom);
    state[key] = (c.bottom - clamped) / (c.bottom - c.top);
    onCauseChanged(key);
  }

  puck.addEventListener('pointerdown', (evt) => {
    dragging = true;
    puck.classList.add('is-dragging');
    puck.setPointerCapture(evt.pointerId);
    evt.preventDefault();
  });
  puck.addEventListener('pointermove', (evt) => {
    if (!dragging) return;
    const p = clientToPoint(svg, evt);
    setFromY(p.y);
  });
  const end = (evt) => {
    if (!dragging) return;
    dragging = false;
    puck.classList.remove('is-dragging');
    try {
      puck.releasePointerCapture(evt.pointerId);
    } catch {
      /* already released */
    }
  };
  puck.addEventListener('pointerup', end);
  puck.addEventListener('pointercancel', end);

  // keyboard access: the track is vertical regardless of text direction, so
  // only Up/Down are bound — Left/Right are deliberately left alone since in
  // an RTL document they read as "back/forward", not "more/less".
  puck.addEventListener('keydown', (evt) => {
    const step = 0.03;
    if (evt.key === 'ArrowUp') {
      state[key] = clamp(state[key] + step, 0, 1);
      onCauseChanged(key);
      evt.preventDefault();
    } else if (evt.key === 'ArrowDown') {
      state[key] = clamp(state[key] - step, 0, 1);
      onCauseChanged(key);
      evt.preventDefault();
    }
  });
}

// -------------------------------------------------------------------- render

let derivedNow = computeDerived(state);
let outcomesNow = computeOutcomes(derivedNow);

const DERIVED_FMT = {
  cryst: (d) => fmt(d.cryst, 0),
  mfi: (d) => fmt(d.mfi, 1),
  density: (d) => fmt(d.density, 3),
  tm: (d) => fmt(d.tm, 0),
  modulus: (d) => fmt(d.modulus, 2),
  tensile: (d) => fmt(d.tensile, 1),
};

function paintCauses() {
  Object.keys(CAUSES).forEach((k) => {
    const puck = refs['puck_' + k];
    if (!puck) return;
    puck.setAttribute('cy', causeNodeY(k));
    puck.setAttribute('aria-valuenow', Math.round(state[k] * 100));
  });
}

function paintEdgePositions() {
  EDGES.forEach((e) => {
    const { p0, pc, p2 } = quadFor(e);
    const path = refs.edgePaths[edgeKey(e)];
    path.setAttribute('d', `M${p0.x},${p0.y} Q${pc.x},${pc.y} ${p2.x},${p2.y}`);
    const mid = quadPoint(p0, pc, p2, 0.52);
    const label = refs.edgeLabels[edgeKey(e)];
    label.setAttribute('x', mid.x);
    label.setAttribute('y', mid.y - 5);
  });
}

function paintDerived() {
  Object.keys(DERIVED).forEach((k) => {
    refs.derivedVal[k].textContent = DERIVED_FMT[k](derivedNow);
  });
}

function paintOutcomes() {
  Object.keys(OUTCOMES).forEach((k) => {
    const suited = outcomesNow[k];
    refs.outcomeHex[k].classList.toggle('is-suited', suited);
    refs.outcomeGroup[k].classList.toggle('is-suited', suited);
    refs['outFlag_' + k].textContent = suited ? 'مسیر مناسب' : 'خارج از بازه';
  });
}

function paintPanel() {
  Object.keys(DERIVED).forEach((k) => {
    const row = panelRefs[k];
    if (row) row.val.textContent = DERIVED_FMT[k](derivedNow);
  });
  Object.keys(OUTCOMES).forEach((k) => {
    const card = outcomeCardRefs[k];
    if (!card) return;
    card.el.classList.toggle('is-suited', outcomesNow[k]);
    card.flag.textContent = outcomesNow[k] ? 'مسیر مناسب' : 'خارج از بازه';
  });
}

function pulse(originKey, downstreamKeys) {
  if (reduceMotion()) return;
  const full = new Set([originKey, ...downstreamKeys]);
  const relevant = EDGES.filter((e) => full.has(e.from) && full.has(e.to));
  relevant.forEach((e, i) => {
    const el = refs.edgePulses[edgeKey(e)];
    if (!el) return;
    const { p0, pc, p2 } = quadFor(e);
    const start = performance.now() + i * 40;
    const dur = 480;
    function step(now) {
      const t = clamp((now - start) / dur, 0, 1);
      if (now < start) {
        requestAnimationFrame(step);
        return;
      }
      const pt = quadPoint(p0, pc, p2, t);
      el.setAttribute('cx', pt.x);
      el.setAttribute('cy', pt.y);
      el.style.opacity = t < 0.92 ? 0.9 : 0.9 * (1 - (t - 0.92) / 0.08);
      if (t < 1) requestAnimationFrame(step);
      else el.style.opacity = 0;
    }
    requestAnimationFrame(step);
  });
}

function onCauseChanged(key) {
  derivedNow = computeDerived(state);
  outcomesNow = computeOutcomes(derivedNow);
  paintCauses();
  paintEdgePositions();
  paintDerived();
  paintOutcomes();
  paintPanel();
  pulse(key, downstreamOf(key));
}

// ------------------------------------------------------------------- side panel

const panelRefs = {};
const outcomeCardRefs = {};

function buildPanel(root) {
  const panel = document.createElement('aside');
  panel.className = 'gr-panel';
  panel.innerHTML = `<h2>خوانش زنده</h2>`;

  Object.keys(DERIVED).forEach((k) => {
    const d = DERIVED[k];
    const row = document.createElement('div');
    row.className = 'gr-row';

    const name = document.createElement('div');
    name.className = 'gr-row-name';
    name.innerHTML = `${d.label}${d.sym ? `<span class="sym">${d.sym}</span>` : ''}`;

    const val = document.createElement('div');
    val.className = 'gr-row-val';
    val.innerHTML = `<small>${d.unit}</small>`;

    const status = d.dprop ? d.dprop.status : null;
    const markSpan = document.createElement('span');
    markSpan.className =
      'gr-row-mark ' +
      (status === 'sourced' ? 'st-sourced' : status === 'unsourced' ? 'st-unsourced' : 'st-nodata');
    markSpan.textContent = status === 'sourced' ? '§' : status === 'unsourced' ? '?' : '×';
    markSpan.title =
      status === 'sourced'
        ? 'دارای منبع'
        : status === 'unsourced'
          ? 'در حال تکمیل منبع'
          : 'بدون ردیف دیتاشیت';
    val.appendChild(markSpan);

    const tag = document.createElement('div');
    tag.className = 'gr-row-tag';
    const info = document.createElement('span');
    info.className = 'gr-info';
    info.textContent = 'i';
    info.tabIndex = 0;
    const pop = document.createElement('span');
    pop.className = 'pop';
    pop.textContent = d.dprop
      ? `بازهٔ واقعی این مقدار (${d.dprop.value} ${d.dprop.unit || ''}) از دیتاشیت است و وضعیتش «${
          status === 'sourced' ? 'دارای منبع' : 'در حال تکمیل منبع'
        }» است. رابطهٔ علّی که این عدد را داخل آن بازه جابه‌جا می‌کند، ساختهٔ همین صفحه برای آموزش است، نه یک مدل صحه‌گذاری‌شده.`
      : 'درجه بلورینگی هنوز ردیفی در دیتاشیت ندارد. بازه و رابطهٔ نمایش‌داده‌شده کاملاً ساختهٔ همین صفحه برای آموزش است.';
    info.appendChild(pop);
    tag.appendChild(document.createTextNode('نمایشی'));
    tag.appendChild(info);

    row.appendChild(name);
    row.appendChild(val);
    row.appendChild(tag);
    panel.appendChild(row);
    panelRefs[k] = { val };
  });

  const note = document.createElement('p');
  note.className = 'gr-panel-note';
  note.textContent =
    'کشیدن هر یک از سه گره سمت راست، این ستون و نمودار را با فرمول‌های ساده و نمایشیِ همین صفحه به‌روزرسانی می‌کند.';
  panel.appendChild(note);

  root.appendChild(panel);
}

function buildOutcomesStrip(slot) {
  slot.classList.add('gr-outcomes');
  slot.innerHTML = '<h2>کاربردهای پایین‌دست</h2>';
  const grid = document.createElement('div');
  grid.className = 'gr-outcome-grid';

  const COPY = {
    film: 'وقتی MFI پایین است، مذاب برای دمش فیلم به‌اندازه کافی چسبناک می‌ماند.',
    inj: 'MFI بالاتر یعنی مذاب روان‌تر است — مناسب پرشدن سریع قالب در تزریق.',
    cable: 'چگالی پایین‌تر یعنی بخش بی‌شکل بیشتر و انعطاف‌پذیری بهتر برای عایق کابل.',
  };

  Object.keys(OUTCOMES).forEach((k) => {
    const card = document.createElement('div');
    card.className = 'oc-card';
    card.innerHTML = `
      <div class="oc-title"><span>${OUTCOMES[k].label}</span><span class="oc-flag">—</span></div>
      <p>${COPY[k]}</p>`;
    grid.appendChild(card);
    outcomeCardRefs[k] = { el: card, flag: card.querySelector('.oc-flag') };
  });

  slot.appendChild(grid);
}

// ------------------------------------------------------------------------ boot

export function renderGraph(root) {
  root.innerHTML = `
    <header class="labbar">
      <div class="wrap">
        <a class="labbrand" href="../e.html">
          <span aria-hidden="true">🧪</span>
          <span dir="ltr">Polypedia</span>
          <small>Lab</small>
        </a>
        <a class="pill" href="../e.html">← بازگشت به دیتاشیت</a>
        <span class="spacer"></span>
        <span id="theme-slot"></span>
      </div>
    </header>

    <div class="wrap gr-hero">
      <div class="eyebrow" dir="ltr">L3 · GRAPH</div>
      <h1>شبکهٔ علّیِ ${material.nameFa}</h1>
      <p>
        خواص این پلیمر مستقل از هم نیستند: شاخه‌ای شدن زنجیر روی بلورینگی اثر می‌گذارد،
        بلورینگی روی چگالی و سفتی، و این‌ها با هم تعیین می‌کنند این ماده برای کدام
        کاربرد مناسب است. سه گرهٔ راست‌ترین نمودار را بکش و ببین اثرش چطور پایین‌دست
        جاری می‌شود.
      </p>
      <div class="gr-hint"><b>راهنما:</b> گره‌های راست را عمودی بکش؛ با کیبورد هم می‌شود
        (فوکس کن، کلیدهای جهت‌دار).</div>
    </div>

    <div class="wrap gr-stage">
      <div class="gr-figure">
        <div class="gr-legend">
          <span><i class="sw-cause"></i>علت ساختاری — قابل کشیدن</span>
          <span><i class="sw-derived"></i>خاصیت مشتق‌شده — فقط‌خواندنی</span>
          <span><i class="sw-outcome"></i>کاربرد نهایی</span>
        </div>
        <div class="gr-svg-slot"></div>
      </div>
    </div>

    <div class="wrap gr-outcomes-slot"></div>

    <div class="wrap gr-closing">
      <p>
        <b>این نمودار یک مدل صحه‌گذاری‌شده نیست.</b> جهت هر یال (٪↑/↓) از دانش عمومی
        علم پلیمر گرفته شده، اما شیب دقیق رابطه‌ها و بازه‌های «مناسب/نامناسب» کاربردها
        ساختهٔ همین صفحه برای آموزش‌اند. تنها چیزی که در این صفحه واقعاً از دیتاشیت
        می‌آید، کمینه و بیشینهٔ هر خاصیت مشتق‌شده است — و وضعیت منبع‌دار بودن هرکدام،
        دقیقاً همان‌طور که روی دیتاشیت علامت خورده، همین‌جا هم علامت خورده.
      </p>
    </div>

    <footer class="labfoot"><div class="wrap">
      <span dir="ltr">Polypedia</span> · آزمایشگاه — صفحه نمونه برای انتخاب هویت بصری
    </div></footer>
  `;

  root.querySelector('#theme-slot').replaceWith(themeButton());

  const svgSlot = root.querySelector('.gr-svg-slot');
  buildGraph(svgSlot);
  buildPanel(root.querySelector('.gr-stage'));
  buildOutcomesStrip(root.querySelector('.gr-outcomes-slot'));

  paintDerived();
  paintOutcomes();
  paintPanel();
}
