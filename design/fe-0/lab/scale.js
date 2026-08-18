// L1 — «مقیاس» / SCALE
//
// The idea (lab-concepts-spec.md): polymer science is a multi-scale discipline,
// so the page IS a zoom. Six full-height stations, one per decade the reader
// scrolls through — 10⁻¹⁰ m to 10⁰ m — with a fixed rail that reads the current
// magnification and a live chain-length slider at the 10⁻⁹ station.
//
// This is a navigation structure, not a card stack: the rail's tick spacing is
// proportional to the log-distance between stations, so the page itself shows
// that the jump from "a chain" to "a lamella" is one decade while the jump from
// "a spherulite" to "the part in your hand" is three. That asymmetry is the one
// fact this page exists to teach before a single word is read.

import { initTheme, themeButton } from '../theme.js';
import { material, groups } from '../data.js';

// ---------------------------------------------------------------- data lookup

function prop(groupKey, propKey) {
  const g = groups.find((x) => x.key === groupKey);
  return g && g.properties.find((p) => p.key === propKey);
}

const YOUNG = prop('mechanical', 'young_modulus'); // 0.15 - 0.35 GPa, unsourced
const DENSITY = prop('physical', 'density'); // 0.910 - 0.925 g/cm3, unsourced
const PROC_TEMP = prop('processing', 'process_temp'); // 180 - 230 C, unsourced

// Latin numerals inside RTL prose need an LTR island (R6, D18) — same helper
// as render.js's `num()`.
const num = (v) => `<span class="num" dir="ltr">${v}</span>`;

// ------------------------------------------------------------------ stations
//
// Object icons and "one sentence of physics" are this agent's own wording —
// the spec table (L1) gives scale / Persian name / object / tools, not prose.
// Numbers are pulled from data.js where a station has a matching property;
// everything else is a scale-of-length statement (bond lengths, spherulite
// diameters) that is textbook geometry, not a measured value from this
// material's datasheet, so it carries no provenance mark.

const STATIONS = [
  {
    exp: -10,
    nameFa: 'مونومر و پیوند',
    nameEn: 'monomer & bond',
    sentence: `یک پیوند کربن–کربن حدود ${num('0.154')} نانومتر طول دارد — این خط‌کش، نه چیز دیگری، واحد این مقیاس است.`,
    icon: 'bond',
    tools: [{ label: 'نمایشگر سه‌بعدی مولکول', state: 'plain' }],
  },
  {
    exp: -9,
    nameFa: 'زنجیر منفرد',
    nameEn: 'single chain',
    sentence:
      'هزاران واحد تکرارشونده به هم می‌پیوندند و زنجیری می‌سازند که در فضا مثل یک گشت تصادفی می‌پیچد.',
    icon: 'chain',
    tools: [
      { label: 'ماشین‌حساب درجه پلیمریزاسیون', state: 'plain' },
      { label: 'نمودار سه‌بعدی حلالیت هانسن', state: 'plain' },
    ],
    live: true,
  },
  {
    exp: -8,
    nameFa: 'لایه بلوری (لاملا)',
    nameEn: 'lamella',
    sentence: 'زنجیر بارها روی خودش تا می‌خورد و ورقه‌ای بلوری به ضخامت چند ده نانومتر می‌سازد.',
    icon: 'lamella',
    tools: [{ label: 'شبیه‌ساز شاخه‌ای شدن زنجیر', state: 'plain' }],
  },
  {
    exp: -6,
    nameFa: 'کروی‌بلور',
    nameEn: 'spherulite',
    sentence:
      'لاملاها از یک نقطه به بیرون رشد می‌کنند و کروی‌بلوری می‌سازند که با چشم غیرمسلح دیده نمی‌شود اما با نور قطبیده قابل مشاهده است.',
    icon: 'spherulite',
    tools: [
      {
        label: 'بلورینگی ↔ چگالی',
        state: 'plain',
        note: DENSITY
          ? `چگالی این گرید ${num(DENSITY.value)}<span dir="ltr">${DENSITY.unit}</span> است — مستقیماً از درصد بلورینگی همین کروی‌بلورها اثر می‌گیرد.`
          : '',
      },
    ],
  },
  {
    exp: -3,
    nameFa: 'قطعه',
    nameEn: 'specimen / part',
    sentence:
      'میلیون‌ها کروی‌بلور و ناحیه بی‌شکل کنار هم قطعه‌ای می‌سازند که زیر بار کششی رفتار می‌کند — دیگر مولکول نیست، ماده است.',
    icon: 'specimen',
    tools: [
      { label: 'نمودار تنش–کرنش', state: 'plain' },
      {
        label: 'شبیه‌ساز پنجره فرآیند',
        state: 'locked',
        reason:
          'دمای قالب و فشار تزریق هنوز در پایگاه داده تعریف نشده‌اند (db/DATA-GAPS.md، G5). فقط دمای فرآیند ' +
          (PROC_TEMP ? `(${num(PROC_TEMP.value)}<span dir="ltr">${PROC_TEMP.unit}</span>)` : '') +
          ' موجود است؛ تا وقتی بقیه ثبت نشوند این ابزار عددی برای کار کردن ندارد و ساختگی هم نمی‌سازد.',
      },
    ],
  },
  {
    exp: 0,
    nameFa: 'چرخه عمر',
    nameEn: 'product & planet',
    sentence:
      'محصول نهایی از خط تولید بیرون می‌آید، عمر می‌کند و روزی باید بازیافت، سوزانده یا دفن شود.',
    icon: 'cycle',
    tools: [{ label: 'LCA / CO₂', state: 'plain' }],
  },
];

// Rail tick position: fraction of rail height, proportional to log-distance
// from the smallest station (-10) to the largest (0). This is the "the layout
// must be the idea" bit — a 3-decade gap (spherulite → part) is drawn three
// times as long as a 1-decade gap (chain → lamella).
const EXP_MIN = -10;
const EXP_MAX = 0;
const railFrac = (e) => (e - EXP_MIN) / (EXP_MAX - EXP_MIN);

// ---------------------------------------------------------------------- SVG

const svgNS = 'http://www.w3.org/2000/svg';

function objectIcon(kind) {
  const ICONS = {
    bond: `<circle cx="34" cy="50" r="9"/><circle cx="76" cy="50" r="9"/><line x1="43" y1="50" x2="67" y2="50"/>`,
    chain: `<path d="M14 60 Q30 20 46 60 T78 60 T110 40" fill="none"/>`,
    lamella: `<path d="M10 30 L40 30 L40 70 L70 70 L70 30 L100 30" fill="none"/>
              <path d="M10 46 L40 46 L40 86 L70 86 L70 46 L100 46" fill="none" opacity="0.55"/>`,
    spherulite: `<circle cx="55" cy="50" r="34" fill="none"/><circle cx="55" cy="50" r="21" fill="none" opacity="0.6"/>
                 <line x1="55" y1="16" x2="55" y2="84"/><line x1="21" y1="50" x2="89" y2="50"/>
                 <line x1="31" y1="26" x2="79" y2="74"/><line x1="79" y1="26" x2="31" y2="74"/>`,
    specimen: `<rect x="16" y="38" width="30" height="24" rx="2" fill="none"/>
               <path d="M46 44 L64 44 L64 56 L46 56" fill="none"/>
               <rect x="64" y="38" width="30" height="24" rx="2" fill="none"/>`,
    cycle: `<path d="M28 34 A26 26 0 1 1 26 66" fill="none" marker-end="url(#arrow)"/>
            <path d="M22 24 L28 34 L36 26" fill="none"/>`,
  };
  return `<svg viewBox="0 0 110 100" class="obj-icon" aria-hidden="true">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <path d="M0 0 L8 4 L0 8 Z"/></marker></defs>
    ${ICONS[kind] || ''}
  </svg>`;
}

// ------------------------------------------------------------ live element
//
// 10⁻⁹ station, required by the spec: a DP slider (100–20 000) redrawing a 2D
// ideal random-walk chain, reporting end-to-end distance and Rg. Ideal-chain
// scaling (Rg ∝ √N) is real physics, but the drawn walk and the reported
// numbers are a toy model, not a measurement of this material's actual chain
// conformation — captioned as such, per constraint 7.

const DP_MIN = 100;
const DP_MAX = 20000;
const STEP_NM = 0.25; // illustrative Kuhn-ish step length, NOT a cited value — see caption

function randomWalkPoints(n) {
  // capped so the SVG stays legible and fast to build; physics readout below
  // still uses the real requested N.
  const drawn = Math.min(n, 6000);
  let x = 0;
  let y = 0;
  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0;
  const pts = [[0, 0]];
  for (let i = 0; i < drawn; i++) {
    const a = Math.random() * Math.PI * 2;
    x += Math.cos(a);
    y += Math.sin(a);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    pts.push([x, y]);
  }
  return { pts, bounds: { minX, maxX, minY, maxY } };
}

function liveChainTool() {
  const wrap = document.createElement('div');
  wrap.className = 'chain-tool';
  wrap.innerHTML = `
    <div class="chain-head">
      <h3>گشت تصادفی زنجیر</h3>
      <span>مدل ساده‌شده — نه دیتاشیت</span>
    </div>
    <div class="chain-body">
      <svg viewBox="-110 -110 220 220" class="chain-svg" aria-hidden="true">
        <polyline class="chain-walk" points="" fill="none"/>
      </svg>
      <div class="chain-readout">
        <label for="dp-slider">درجه پلیمریزاسیون (DP)</label>
        <input id="dp-slider" type="range" min="${DP_MIN}" max="${DP_MAX}" value="800" step="10" />
        <div class="chain-nums">
          <div><span>DP</span><b class="num" dir="ltr" id="dp-val">800</b></div>
          <div><span>فاصله سر تا سر، R</span><b class="num" dir="ltr" id="r-val">—</b></div>
          <div><span>شعاع ژیراسیون، R<sub>g</sub></span><b class="num" dir="ltr" id="rg-val">—</b></div>
        </div>
      </div>
    </div>
    <p class="chain-caption">
      مدل گشت تصادفی ایده‌آل (freely-jointed chain) با طول گام نمایشی ${num(STEP_NM)} نانومتر —
      رابطه R<sub>g</sub> ∝ √N فیزیک واقعی است، اما این عدد و این نقشه اندازه‌گیری هیچ نمونه‌ای
      نیستند و نباید به‌عنوان مقدار سنجیده‌شده این گرید خوانده شوند.
    </p>`;

  const slider = wrap.querySelector('#dp-slider');
  const dpVal = wrap.querySelector('#dp-val');
  const rVal = wrap.querySelector('#r-val');
  const rgVal = wrap.querySelector('#rg-val');
  const poly = wrap.querySelector('.chain-walk');

  let raf = null;
  const redraw = () => {
    const n = +slider.value;
    dpVal.textContent = n;

    const R = STEP_NM * Math.sqrt(n); // ideal chain end-to-end (RMS)
    const Rg = R / Math.sqrt(6);
    rVal.textContent = R.toFixed(1) + ' nm';
    rgVal.textContent = Rg.toFixed(1) + ' nm';

    const { pts, bounds } = randomWalkPoints(n);
    const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1);
    const scale = 190 / span;
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const str = pts
      .map(([x, y]) => `${((x - cx) * scale).toFixed(1)},${((y - cy) * scale).toFixed(1)}`)
      .join(' ');
    poly.setAttribute('points', str);
  };

  slider.addEventListener('input', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(redraw);
  });
  redraw();

  return wrap;
}

// ---------------------------------------------------------------- tool chip

function toolChip(t) {
  const chip = document.createElement('div');
  chip.className = 'tchip' + (t.state === 'locked' ? ' is-locked' : '');
  chip.innerHTML = `<span class="tchip-label">${t.label}</span>`;
  if (t.state === 'locked') {
    chip.innerHTML += `<p class="tchip-reason">${t.reason}</p>`;
  } else if (t.note) {
    chip.innerHTML += `<p class="tchip-note">${t.note}</p>`;
  }
  return chip;
}

// --------------------------------------------------------------- stations

function stationEl(s, i) {
  const sec = document.createElement('section');
  sec.className = 'station';
  sec.id = `st-${i}`;
  sec.dataset.exp = s.exp;

  sec.innerHTML = `
    <div class="station-ghost num" dir="ltr" aria-hidden="true">10<sup>${s.exp}</sup></div>
    <div class="wrap station-in">
      <div class="station-obj">${objectIcon(s.icon)}</div>
      <div class="station-text">
        <div class="station-exp num" dir="ltr">10<sup>${s.exp}</sup> m</div>
        <h2>${s.nameFa}</h2>
        <p class="station-en" dir="ltr">${s.nameEn}</p>
        <p class="station-sentence">${s.sentence}</p>
        <div class="station-tools"></div>
      </div>
    </div>`;

  const toolsWrap = sec.querySelector('.station-tools');
  s.tools.forEach((t) => toolsWrap.appendChild(toolChip(t)));

  if (s.live) {
    sec.querySelector('.station-text').appendChild(liveChainTool());
  }

  return sec;
}

// -------------------------------------------------------------------- rail

function railEl() {
  const rail = document.createElement('nav');
  rail.className = 'scale-rail';
  rail.setAttribute('aria-label', 'مقیاس صفحه');
  rail.innerHTML =
    '<div class="rail-track">' +
    STATIONS.map(
      (s, i) =>
        `<button type="button" class="rail-tick" data-i="${i}" style="inset-block-start:${(railFrac(s.exp) * 100).toFixed(2)}%">
          <span class="rail-dot"></span>
          <span class="rail-num num" dir="ltr">10<sup>${s.exp}</sup></span>
        </button>`,
    ).join('') +
    '</div>';
  return rail;
}

// -------------------------------------------------------------------- main

export function renderScale(root) {
  initTheme();
  root.innerHTML = `
    <header class="labbar">
      <div class="wrap">
        <a class="labbrand" href="../e.html"><span aria-hidden="true">🧪</span>
          <span dir="ltr">Polypedia</span><small>Lab</small></a>
        <span class="pill act concept-badge" dir="ltr">L1 · SCALE</span>
        <span class="spacer"></span>
        <a class="pill back-pill" href="../e.html">→<span class="back-pill-text"> بازگشت به دیتاشیت</span></a>
        <span id="theme-slot"></span>
      </div>
    </header>

    <div class="scale-readout wrap">
      <div class="sr-num num" dir="ltr" id="sr-exp">10<sup>${STATIONS[0].exp}</sup></div>
      <div class="sr-name">
        <b id="sr-name-fa">${STATIONS[0].nameFa}</b>
        <span dir="ltr" id="sr-name-en">${STATIONS[0].nameEn}</span>
      </div>
    </div>

    <main class="scale-doc" id="scale-doc"></main>

    <footer class="labfoot"><div class="wrap">
      <span dir="ltr">Polypedia</span> · مقیاس — صفحه نمونه برای انتخاب هویت بصری،
      از ${num(material.nameEn)}
    </div></footer>`;

  root.querySelector('#theme-slot').replaceWith(themeButton());

  const doc = root.querySelector('#scale-doc');
  doc.appendChild(railEl());
  const stationsWrap = document.createElement('div');
  stationsWrap.className = 'stations';
  STATIONS.forEach((s, i) => stationsWrap.appendChild(stationEl(s, i)));
  doc.appendChild(stationsWrap);

  // --- scroll → active station -------------------------------------------
  const ticks = [...root.querySelectorAll('.rail-tick')];
  const expEl = root.querySelector('#sr-exp');
  const nameFaEl = root.querySelector('#sr-name-fa');
  const nameEnEl = root.querySelector('#sr-name-en');

  const setActive = (i) => {
    ticks.forEach((t) => t.classList.toggle('on', +t.dataset.i === i));
    const s = STATIONS[i];
    expEl.innerHTML = `10<sup>${s.exp}</sup>`;
    nameFaEl.textContent = s.nameFa;
    nameEnEl.textContent = s.nameEn;
  };

  const sections = [...root.querySelectorAll('.station')];
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        setActive(sections.indexOf(e.target));
      });
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach((s) => obs.observe(s));

  // Clicking a rail tick jumps to that station (the ruler doubles as a menu).
  ticks.forEach((t) => {
    t.addEventListener('click', () => {
      sections[+t.dataset.i].scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  });

  setActive(0);
}
