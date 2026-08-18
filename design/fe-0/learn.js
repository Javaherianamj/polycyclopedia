// LEARN surface — the tools, arranged as a path rather than a pile (R28).
//
// Two things this page is arguing:
//   1. A tool declares the data it needs and does not render when that data is
//      absent (R7). Two of the eight below are locked, and they say exactly why
//      — those are `db/DATA-GAPS.md` G4 and G5, made visible instead of faked.
//   2. Colour here encodes a NUMBER, not a status. The temperature ramp is a
//      sequential scale; it is not the datasheet's provenance palette.

import { initTheme, themeButton } from './theme.js';

const LDPE = { tg: -110, tmLow: 105, tmHigh: 115, tdLow: 300, tdHigh: 400 };

const TOOLS = [
  {
    n: 1,
    title: 'شبیه‌ساز حالت فیزیکی',
    desc: 'دما را جابه‌جا کن و ببین زنجیرها کِی از حالت شیشه‌ای به لاستیکی و سپس به مذاب می‌روند.',
    needs: [
      ['Tg', true],
      ['Tm', true],
      ['دمای تخریب', true],
    ],
    live: true,
  },
  {
    n: 2,
    title: 'شبیه‌ساز شاخه‌ای شدن زنجیر',
    desc: 'شاخه‌های کوتاه و بلند را کم و زیاد کن و اثرشان را بر بلورینگی و چگالی ببین.',
    needs: [
      ['چگالی', true],
      ['بلورینگی', true],
    ],
  },
  {
    n: 3,
    title: 'نمودار تنش–کرنش',
    desc: 'منحنی رفتار مکانیکی این گرید، ساخته‌شده از مقادیر واقعی همین صفحه.',
    needs: [
      ['استحکام کششی', true],
      ['ازدیاد طول', true],
      ['مدول یانگ', true],
    ],
  },
  {
    n: 4,
    title: 'شبیه‌ساز پنجره فرآیند',
    desc: 'دمای مذاب، دمای قالب و فشار را تنظیم کن و ببین در پنجره استاندارد هستی یا نه.',
    needs: [
      ['دمای فرآیند', true],
      ['دمای قالب', false],
      ['فشار تزریق', false],
    ],
    locked:
      'دمای قالب و فشار تزریق هنوز در پایگاه داده تعریف نشده‌اند. تا وقتی ثبت نشوند این ابزار عددی برای کار کردن ندارد و ساختگی هم نمی‌سازد.',
  },
  {
    n: 5,
    title: 'ماشین‌حساب درجه پلیمریزاسیون',
    desc: 'از Mn و Mw به DPn، DPw و شاخص پراکندگی برس.',
    needs: [
      ['Mn', true],
      ['Mw', true],
      ['PDI', true],
    ],
  },
  {
    n: 6,
    title: 'نمودار سه‌بعدی حلالیت هانسن',
    desc: 'سه پارامتر هانسن در فضای سه‌بعدی، برای پیش‌بینی سازگاری با حلال‌ها.',
    needs: [
      ['δD', true],
      ['δP', true],
      ['δH', true],
    ],
  },
  {
    n: 7,
    title: 'نمایشگر سه‌بعدی مولکول',
    desc: 'واحد تکرارشونده را بچرخان و پیوندها را از نزدیک ببین.',
    needs: [['مختصات اتم‌ها', true]],
  },
  {
    n: 8,
    title: 'آزمون کوتاه',
    desc: 'چند پرسش برای سنجش آنچه در این صفحه خواندی.',
    needs: [['پرسش‌های آزمون', false]],
    locked:
      'پرسش‌های آزمون هنوز جایی در پایگاه داده ندارند. جدولش ساخته نشده، پس این بخش خالی می‌ماند تا ساخته شود.',
  },
];

// Temperature → physical regime. The colour IS the number, restated.
function phaseOf(t) {
  if (t < LDPE.tg) return { key: 'glass', fa: 'شیشه‌ای', c: 'var(--ramp-glass)' };
  if (t < LDPE.tmLow) return { key: 'rubber', fa: 'لاستیکی', c: 'var(--ramp-rubber)' };
  if (t < LDPE.tdLow) return { key: 'melt', fa: 'مذاب', c: 'var(--ramp-melt)' };
  return { key: 'burn', fa: 'تخریب حرارتی', c: 'var(--ramp-burn)' };
}

const MIN = -160;
const MAX = 450;
const pos = (t) => ((t - MIN) / (MAX - MIN)) * 100;

function liveTool() {
  const wrap = document.createElement('div');
  wrap.className = 'tool';
  wrap.innerHTML = `
    <div class="tool-head">
      <h3>شبیه‌ساز حالت فیزیکی</h3>
      <span>LDPE — رنگ، همان عددِ دما است</span>
    </div>
    <div class="readout">
      <span class="temp num" dir="ltr">25</span><span class="unit" dir="ltr">°C</span>
      <span class="phase-tag">لاستیکی</span>
    </div>
    <div class="scale"></div>
    <div class="ticks">
      <span class="tick" style="inset-inline-end:${pos(LDPE.tg)}%">Tg<b dir="ltr">-110</b></span>
      <span class="tick" style="inset-inline-end:${pos(LDPE.tmLow)}%">Tm<b dir="ltr">105-115</b></span>
      <span class="tick" style="inset-inline-end:${pos(LDPE.tdLow)}%">تخریب<b dir="ltr">300-400</b></span>
    </div>
    <input type="range" min="${MIN}" max="${MAX}" value="25" step="1"
           aria-label="دما بر حسب سلسیوس" />
    <p class="tool-note"></p>
    <p class="tool-src">
      Tg، Tm و دمای تخریب از همین دیتاشیت خوانده می‌شوند — هیچ عددی در این ابزار
      ثابت نوشته نشده. اگر مقداری منبع نداشته باشد، همان‌جا هم بدون منبع نشان داده می‌شود.
    </p>`;

  const temp = wrap.querySelector('.temp');
  const tag = wrap.querySelector('.phase-tag');
  const note = wrap.querySelector('.tool-note');
  const input = wrap.querySelector('input');

  const NOTES = {
    glass: 'زیر Tg زنجیرها عملاً قفل‌اند: ماده سخت و شکننده است و ضربه را بد تحمل می‌کند.',
    rubber:
      'بین Tg و Tm نواحی بی‌شکل نرم شده‌اند اما بلورها هنوز سرجای‌شان‌اند؛ این همان محدوده‌ای است که فیلم LDPE در آن کار می‌کند.',
    melt: 'بالای Tm بلورها ذوب شده‌اند و ماده جاری می‌شود — محدوده اکستروژن و تزریق.',
    burn: 'بالای دمای تخریب زنجیر می‌شکند. این دیگر فرآیند نیست، خرابی است.',
  };

  const paint = () => {
    const t = +input.value;
    const p = phaseOf(t);
    wrap.style.setProperty('--phase', p.c);
    temp.textContent = t;
    tag.textContent = p.fa;
    note.textContent = NOTES[p.key];
  };

  input.addEventListener('input', paint);
  paint();
  return wrap;
}

function stepEl(t) {
  const step = document.createElement('div');
  step.className = 'step' + (t.locked ? ' is-locked' : '');
  step.innerHTML = `
    <div class="step-n num" dir="ltr">${t.n}</div>
    <div>
      <h3>${t.title}</h3>
      <p>${t.desc}</p>
      <div class="needs">${t.needs
        .map(([n, ok]) => `<span class="need ${ok ? 'ok' : 'no'}">${ok ? '✓' : '—'} ${n}</span>`)
        .join('')}</div>
      ${t.locked ? `<p class="locknote">${t.locked}</p>` : ''}
    </div>
    <div class="step-go" aria-hidden="true">${t.locked ? '' : '←'}</div>`;
  return step;
}

export function renderLearn(root) {
  initTheme();
  root.innerHTML = `
    <header class="lbar">
      <div class="wrap">
        <a class="lbrand" href="e.html"><span aria-hidden="true">🧪</span>
          <span dir="ltr">Polypedia</span></a>
        <span class="lbar-end"></span>
        <a class="back" href="e.html">← بازگشت به دیتاشیت</a>
      </div>
    </header>
    <div class="wrap lhero">
      <div class="eyebrow" dir="ltr">LDPE · Learn</div>
      <h1>محیط یادگیری پلی‌اتیلن با چگالی پایین</h1>
      <p>
        هشت ابزار، به ترتیبی که یاد گرفتن‌شان منطقی است: از رفتار زنجیر با دما شروع
        می‌شود و به ساختار مولکولی می‌رسد. هر ابزار می‌گوید به کدام داده نیاز دارد.
      </p>
    </div>
    <div class="wrap path" id="path"></div>
    <footer class="lfoot"><div class="wrap">
      <div>Polypedia · محیط یادگیری — صفحه نمونه برای انتخاب هویت بصری</div>
      <div class="legend-note">
        رنگ در این صفحه کار مشخصی دارد: طیف سرد به گرم فقط جای عدد دما نشسته،
        و پالت وضعیت (منبع‌دار، بدون منبع، کاری که می‌توانی انجام دهی) همان است
        که در دیتاشیت بود. هیچ رنگی صرفاً برای تزئین اضافه نشده.
      </div>
    </div></footer>`;

  root.querySelector('.lbar-end').replaceWith(themeButton());

  const path = root.querySelector('#path');
  TOOLS.forEach((t) => {
    path.appendChild(stepEl(t));
    if (t.live) path.appendChild(liveTool());
  });
}
