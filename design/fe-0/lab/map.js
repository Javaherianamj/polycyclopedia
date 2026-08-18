// L2 — «نقشه» / MAP
//
// The idea (lab-concepts-spec.md): the modulus–temperature master curve IS the
// menu. A draggable marker on the curve swaps the tray of tools beneath it, so
// the reader learns that a tool belongs to a physical regime rather than living
// in a flat list. Curve shape follows the spec's semicrystalline narrative:
// glassy plateau → one-decade drop through Tg → a shallow semicrystalline
// plateau held by the crystallites → sharp multi-decade drop at Tm → flow →
// degradation above Td.

import { initTheme, themeButton } from '../theme.js';
import { material, groups } from '../data.js';

function prop(groupKey, propKey) {
  const g = groups.find((x) => x.key === groupKey);
  return g && g.properties.find((p) => p.key === propKey);
}

const YOUNG = prop('mechanical', 'young_modulus'); // 0.15 - 0.35 GPa @ room temp, unsourced
const PROC_TEMP = prop('processing', 'process_temp'); // 180 - 230 C, unsourced
const MFI = prop('processing', 'mfi'); // 0.2 - 20 g/10min, unsourced
const DENSITY = prop('physical', 'density');
const IZOD = prop('mechanical', 'izod_impact'); // status: 'missing' in data.js
const TENSILE = prop('mechanical', 'tensile_strength');
const ELONG = prop('mechanical', 'elongation_at_break');

const num = (v) => `<span class="num" dir="ltr">${v}</span>`;

// ---------------------------------------------------------------- material
//
// Tg and Tm come straight from data.js (`groups[thermal]`). Td (degradation
// onset) has no column in the schema yet — db/DATA-GAPS.md does not list it
// separately, but no simulator on this site has a sourced value for it either.
// `learn.js` already hardcodes 300-400 for the same material for the same
// reason (its own comment: "Temperature → physical regime"); this file reuses
// those two numbers rather than inventing a third pair, and flags them the
// same way: not read from data.js, not presented as measured.
const TG = -110; // data.js thermal.tg
const TM_LO = 105; // data.js thermal.tm (range low)
const TM_HI = 115; // data.js thermal.tm (range high)
const TD_LO = 300; // NOT in data.js — carried from learn.js's convention, illustrative
const TD_HI = 400; // NOT in data.js — same

const T_MIN = -160;
const T_MAX = 450;

// log10(E[GPa]) control points. Anchors at Tg/Tm/Td are the real transition
// temperatures; the modulus VALUES at every point except room temperature are
// this agent's illustrative reading of the spec's prose ("≈1 GPa", "one
// decade", "three-plus decades") — not measurements. Room temperature (25°C)
// is pinned to the real young_modulus range from data.js.
const ROOM_Y = Math.log10(Math.sqrt(0.15 * 0.35)); // geometric mean of YOUNG.value's range, ≈ -0.64
const CTRL = [
  [T_MIN, 0.0],
  [TG, 0.0],
  [TG + 25, ROOM_Y],
  [25, ROOM_Y],
  [TM_LO, ROOM_Y],
  [TM_HI, -4.0],
  [TD_LO, -4.0],
  [TD_HI, -4.3],
  [T_MAX, -4.3],
];

function curveY(t) {
  if (t <= CTRL[0][0]) return CTRL[0][1];
  for (let i = 0; i < CTRL.length - 1; i++) {
    const [t0, y0] = CTRL[i];
    const [t1, y1] = CTRL[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return y0 + f * (y1 - y0);
    }
  }
  return CTRL[CTRL.length - 1][1];
}

function regionOf(t) {
  if (t < TG) return 'glass';
  if (t < TM_LO) return 'plateau';
  if (t < TD_LO) return 'flow';
  return 'degrade';
}

const REGION_META = {
  glass: {
    fa: 'شیشه‌ای',
    ramp: 'var(--ramp-glass)',
    sentence:
      'زیر Tg زنجیرها عملاً منجمدند: فقط ارتعاش‌های کوچک دارند، حرکت بخش‌های بزرگ زنجیر خاموش است — سخت و شکننده.',
  },
  plateau: {
    fa: 'فلات نیمه‌بلوری',
    ramp: 'var(--ramp-rubber)',
    sentence:
      'نواحی بی‌شکل نرم شده‌اند اما بلورها هنوز پابرجایند؛ همین بلورها مدول را تا نزدیکی Tm بالا نگه می‌دارند.',
  },
  flow: {
    fa: 'مذاب',
    ramp: 'var(--ramp-melt)',
    sentence:
      'بالای Tm بلورها ذوب شده‌اند، زنجیرها آزادانه روی هم می‌لغزند و ماده جاری می‌شود — محدوده اکستروژن و تزریق.',
  },
  degrade: {
    fa: 'تخریب حرارتی',
    ramp: 'var(--ramp-burn)',
    sentence:
      'بالای این دما پیوندهای زنجیر اصلی می‌شکنند. این دیگر فرآیند نیست، خرابی برگشت‌ناپذیر است.',
  },
};

// -------------------------------------------------------------------- tray
//
// Each entry belongs to the region where it is physically meaningful. Locked
// entries carry the same honesty text as learn.js / db/DATA-GAPS.md — a
// missing value does not render as if the tool worked (R7).

const TRAY = [
  {
    label: IZOD ? IZOD.nameFa : 'مقاومت ضربه ایزود',
    region: 'glass',
    locked: true,
    reason: 'این مقدار هنوز در پایگاه داده ثبت نشده است (data.js: status "missing").',
  },
  {
    label: 'نمودار تنش–کرنش',
    region: 'plateau',
    locked: false,
    note:
      TENSILE && ELONG
        ? `استحکام کششی ${num(TENSILE.value)}<span dir="ltr">${TENSILE.unit}</span> و ازدیاد طول ${num(ELONG.value)}<span dir="ltr">%</span> — از همین دیتاشیت.`
        : '',
  },
  {
    label: 'بلورینگی ↔ چگالی',
    region: 'plateau',
    locked: false,
    note: DENSITY ? `چگالی ${num(DENSITY.value)}<span dir="ltr">${DENSITY.unit}</span>.` : '',
  },
  {
    label: 'شاخص جریان مذاب (MFI)',
    region: 'flow',
    locked: false,
    note: MFI
      ? `${num(MFI.value)}<span dir="ltr">${MFI.unit}</span> — معیار غیرمستقیم وزن مولکولی مذاب.`
      : '',
  },
  {
    label: 'شبیه‌ساز پنجره فرآیند',
    region: 'flow',
    locked: true,
    reason:
      'دمای قالب و فشار تزریق هنوز در پایگاه داده تعریف نشده‌اند (db/DATA-GAPS.md، G5). فقط دمای فرآیند ' +
      (PROC_TEMP ? `(${num(PROC_TEMP.value)}<span dir="ltr">${PROC_TEMP.unit}</span>)` : '') +
      ' موجود است.',
  },
];

const OFF_CURVE = [
  { label: 'نمایشگر سه‌بعدی مولکول', hint: 'به دما وابسته نیست — ساختار مولکول ثابت است.' },
  {
    label: 'نمودار سه‌بعدی حلالیت هانسن',
    hint: 'به دما وابسته نیست — پارامترهای انحلال‌پذیری در دمای مرجع تعریف می‌شوند.',
  },
];

// ----------------------------------------------------------------- geometry

const VB_W = 900;
const VB_H = 460;
const M = { l: 58, r: 22, t: 22, b: 54 };
const PLOT_W = VB_W - M.l - M.r;
const PLOT_H = VB_H - M.t - M.b;
const Y_MIN = -4.6;
const Y_MAX = 0.6;

const xOf = (t) => M.l + ((t - T_MIN) / (T_MAX - T_MIN)) * PLOT_W;
const yOf = (y) => M.t + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * PLOT_H;
const tOf = (x) => T_MIN + ((x - M.l) / PLOT_W) * (T_MAX - T_MIN);

function pathFor(tFrom, tTo, step = 4) {
  const pts = [];
  for (let t = tFrom; t <= tTo; t += step)
    pts.push(`${xOf(t).toFixed(1)},${yOf(curveY(t)).toFixed(1)}`);
  pts.push(`${xOf(tTo).toFixed(1)},${yOf(curveY(tTo)).toFixed(1)}`);
  return 'M' + pts.join(' L');
}

function fmtModulus(y) {
  const e = Math.pow(10, y);
  if (e >= 1) return e.toFixed(2) + ' GPa';
  if (e >= 0.001) return (e * 1000).toFixed(0) + ' MPa';
  return e.toExponential(1) + ' GPa';
}

// --------------------------------------------------------------------- SVG

function plotSVG() {
  const yTicks = [1, 0, -1, -2, -3, -4];
  const regions = [
    [T_MIN, TG, 'glass'],
    [TG, TM_LO, 'plateau'],
    [TM_LO, TD_LO, 'flow'],
    [TD_LO, T_MAX, 'degrade'],
  ];

  const bands = regions
    .map(
      ([a, b, key]) =>
        `<rect x="${xOf(a).toFixed(1)}" y="${M.t}" width="${(xOf(b) - xOf(a)).toFixed(1)}" height="${PLOT_H}"
          fill="${REGION_META[key].ramp}" opacity="0.12"/>`,
    )
    .join('');

  const gridY = yTicks
    .map((y) => {
      const e = Math.pow(10, y);
      const label = e >= 1 ? String(e) : e.toFixed(Math.max(0, -y));
      return `<line x1="${M.l}" x2="${VB_W - M.r}" y1="${yOf(y)}" y2="${yOf(y)}" class="gridline"/>
      <text x="${M.l - 10}" y="${yOf(y) + 4}" class="axis-y num" dir="ltr" text-anchor="end">${label}</text>`;
    })
    .join('');

  const xTicks = [-100, 0, 100, 200, 300, 400];
  const gridX = xTicks
    .map(
      (t) =>
        `<text x="${xOf(t)}" y="${VB_H - M.b + 20}" class="axis-x num" dir="ltr" text-anchor="middle">${t}</text>`,
    )
    .join('');

  const refLines = [
    [TG, 'Tg'],
    [TM_LO, 'Tm'],
    [TD_LO, 'Td'],
  ]
    .map(
      ([t, label]) =>
        `<line x1="${xOf(t)}" x2="${xOf(t)}" y1="${M.t}" y2="${VB_H - M.b}" class="refline"/>
         <text x="${xOf(t)}" y="${M.t - 8}" class="ref-label" text-anchor="middle">${label}</text>`,
    )
    .join('');

  const solid = pathFor(T_MIN, TD_LO);
  const dashed = pathFor(TD_LO, T_MAX);

  return `
  <svg viewBox="0 0 ${VB_W} ${VB_H}" class="modulus-plot" role="img" dir="ltr"
       aria-label="نمودار مدول بر حسب دما برای LDPE">
    ${bands}
    ${gridY}
    <line x1="${M.l}" x2="${VB_W - M.r}" y1="${VB_H - M.b}" y2="${VB_H - M.b}" class="axis-line"/>
    <line x1="${M.l}" x2="${M.l}" y1="${M.t}" y2="${VB_H - M.b}" class="axis-line"/>
    ${gridX}
    ${refLines}
    <text class="plateau-label" x="${(xOf(TG) + xOf(TM_LO)) / 2}" y="${yOf(ROOM_Y) - 14}" text-anchor="middle">فلات نیمه‌بلوری — بلورها هنوز پابرجایند</text>
    <path d="${solid}" class="curve-solid" fill="none"/>
    <path d="${dashed}" class="curve-dashed" fill="none"/>
    <circle class="anchor-dot" cx="${xOf(25)}" cy="${yOf(ROOM_Y)}" r="4.5"></circle>
    <g class="marker" id="marker" tabindex="0" role="slider" aria-label="دما"
       aria-valuemin="${T_MIN}" aria-valuemax="${T_MAX}" aria-valuenow="25">
      <line class="marker-line" y1="${M.t}" y2="${VB_H - M.b}"></line>
      <circle class="marker-dot" r="8"></circle>
    </g>
    <text x="${M.l - 44}" y="${M.t + 4}" class="axis-title" transform="rotate(-90 ${M.l - 44} ${M.t + 4})">log(E) — GPa</text>
    <text x="${VB_W - M.r}" y="${VB_H - 8}" class="axis-title" text-anchor="end">دما — <tspan dir="ltr">°C</tspan></text>
  </svg>`;
}

// -------------------------------------------------------------------- tray

function trayChip(t) {
  const chip = document.createElement('div');
  chip.className = 'mchip' + (t.locked ? ' is-locked' : '');
  chip.dataset.region = t.region;
  chip.innerHTML =
    `<span class="mchip-label">${t.label}</span>` +
    (t.locked
      ? `<p class="mchip-reason">${t.reason}</p>`
      : t.note
        ? `<p class="mchip-note">${t.note}</p>`
        : '');
  return chip;
}

// -------------------------------------------------------------------- main

export function renderMap(root) {
  initTheme();
  root.innerHTML = `
    <header class="labbar">
      <div class="wrap">
        <a class="labbrand" href="../e.html"><span aria-hidden="true">🧪</span>
          <span dir="ltr">Polypedia</span><small>Lab</small></a>
        <span class="pill act concept-badge" dir="ltr">L2 · MAP</span>
        <span class="spacer"></span>
        <a class="pill back-pill" href="../e.html">→<span class="back-pill-text"> بازگشت به دیتاشیت</span></a>
        <span id="theme-slot"></span>
      </div>
    </header>

    <div class="wrap map-hero">
      <div class="eyebrow" dir="ltr">LDPE · MAP</div>
      <h1>نقشه مدول–دما</h1>
      <p>منحنی، منو است. نشانگر را روی محور دما بکش و ببین در هر ناحیه چه ابزاری معنا دارد.</p>
    </div>

    <div class="wrap map-body">
      <div class="plot-wrap">${plotSVG()}</div>

      <div class="readout">
        <div class="readout-main">
          <span class="ro-temp num" dir="ltr">25</span><span class="ro-unit" dir="ltr">°C</span>
          <span class="ro-state" id="ro-state">فلات نیمه‌بلوری</span>
        </div>
        <div class="readout-sub">
          <span>مدول تقریبی</span>
          <b class="num" dir="ltr" id="ro-mod">—</b>
        </div>
        <p class="ro-sentence" id="ro-sentence"></p>
        <p class="ro-caption">
          دمای Tg، Tm و شروع تخریب واقعی همین ماده هستند (Tg و Tm از دیتاشیت؛ دمای تخریب هنوز در پایگاه
          داده ثبت نشده). شکل و شیب دقیق منحنی بین این نقاط نمایشی است، نه اندازه‌گیری‌شده — تنها نقطهٔ
          دمای اتاق مستقیماً از بازهٔ واقعی مدول یانگ (${YOUNG ? num(YOUNG.value) + ' <span dir="ltr">' + YOUNG.unit + '</span>' : ''}) گرفته شده.
        </p>
      </div>

      <div class="tray" id="tray">
        <h2 class="tray-title">ابزارهای این ناحیه</h2>
        <div class="tray-grid" id="tray-grid"></div>
      </div>

      <div class="offcurve">
        <h2 class="tray-title">ابزارهایی که به دما وابسته نیستند</h2>
        <div class="tray-grid">
          ${OFF_CURVE.map((o) => `<div class="mchip off"><span class="mchip-label">${o.label}</span><p class="mchip-note">${o.hint}</p></div>`).join('')}
        </div>
      </div>
    </div>

    <footer class="labfoot"><div class="wrap">
      <span dir="ltr">Polypedia</span> · نقشه — صفحه نمونه برای انتخاب هویت بصری، از
      ${num(material.nameEn)}
    </div></footer>`;

  root.querySelector('#theme-slot').replaceWith(themeButton());

  const trayGrid = root.querySelector('#tray-grid');
  TRAY.forEach((t) => trayGrid.appendChild(trayChip(t)));

  const svg = root.querySelector('.modulus-plot');
  const marker = root.querySelector('#marker');
  const tempEl = root.querySelector('.ro-temp');
  const stateEl = root.querySelector('#ro-state');
  const modEl = root.querySelector('#ro-mod');
  const sentenceEl = root.querySelector('#ro-sentence');
  const chips = [...trayGrid.querySelectorAll('.mchip')];

  function setTemp(t) {
    t = Math.max(T_MIN, Math.min(T_MAX, t));
    const y = curveY(t);
    const region = regionOf(t);
    const meta = REGION_META[region];

    marker.querySelector('.marker-dot').setAttribute('cx', xOf(t));
    marker.querySelector('.marker-dot').setAttribute('cy', yOf(y));
    marker.querySelector('.marker-line').setAttribute('x1', xOf(t));
    marker.querySelector('.marker-line').setAttribute('x2', xOf(t));
    marker.setAttribute('aria-valuenow', Math.round(t));
    marker.style.setProperty('--region-c', meta.ramp);

    tempEl.textContent = Math.round(t);
    stateEl.textContent = meta.fa;
    stateEl.style.background = meta.ramp;
    modEl.textContent = fmtModulus(y);
    sentenceEl.textContent = meta.sentence;

    chips.forEach((c) => {
      const on = c.dataset.region === region;
      c.classList.toggle('is-active', on);
      c.classList.toggle('is-dim', !on);
    });
  }

  // ---- drag handling -------------------------------------------------
  function clientToTemp(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = pt.matrixTransform(ctm.inverse());
    return tOf(loc.x);
  }

  let dragging = false;
  const onMove = (e) => {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const t = clientToTemp(p.clientX, p.clientY);
    if (t != null) setTemp(t);
  };
  const start = (e) => {
    dragging = true;
    onMove(e);
  };
  const stop = () => {
    dragging = false;
  };

  marker.addEventListener('pointerdown', (e) => {
    dragging = true;
    marker.setPointerCapture(e.pointerId);
    onMove(e);
  });
  marker.addEventListener('pointermove', onMove);
  marker.addEventListener('pointerup', stop);
  marker.addEventListener('pointercancel', stop);

  // Whole plot is draggable too, not just the small handle — easier to grab.
  svg.addEventListener('pointerdown', (e) => {
    if (e.target === marker || marker.contains(e.target)) return;
    const t = clientToTemp(e.clientX, e.clientY);
    if (t != null) setTemp(t);
  });

  marker.addEventListener('keydown', (e) => {
    const t = +marker.getAttribute('aria-valuenow');
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      // Numeric axis is LTR regardless of page direction (R6) — right = up.
      setTemp(t + dir * 5);
      e.preventDefault();
    }
  });

  setTemp(25);
}
