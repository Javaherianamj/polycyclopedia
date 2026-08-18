// L4 — «دفترچه» / NOTEBOOK
//
// The lab as a publication: title, standfirst, prose, margin sidenotes, and a
// live figure embedded mid-argument rather than boxed off as a "tool". This
// file assembles the article, wires the one live figure to data.js, and runs
// the small chrome (reading-progress bar, TOC highlight, mobile note toggle).
//
// Citation honesty (spec constraint 7, D5): the review block below reuses,
// verbatim, the exact "DESIGN SAMPLE" citation object data.js attaches to
// `vicat` — same Fa/En labels, same em-dash edition and page. Nothing here
// invents a new fake source; it is the one sample citation the project
// already committed to, rendered through the same mark+pop component
// render.js uses on the datasheet. The claim text is OUR OWN paraphrase, not
// a quoted sentence from any paper — D5 forbids quoting a source's body text,
// citation metadata only.

import { material, groups } from '../data.js';
import { initTheme, themeButton } from '../theme.js';

initTheme();

const num = (v) => `<span class="num" dir="ltr">${v}</span>`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function propByKey(key) {
  for (const g of groups) {
    const p = g.properties.find((x) => x.key === key);
    if (p) return p;
  }
  return null;
}

const D_DENSITY = propByKey('density'); // '0.910 - 0.925' g/cm3, unsourced
const D_TM = propByKey('tm'); // '105 - 115' °C, unsourced

// The one sample citation this whole project allows itself — copied field for
// field from data.js's `vicat` entry, never re-typed with different wording.
const SAMPLE_CITATION = {
  workFa: 'نمونهٔ طراحی — منبع واقعی هنوز ثبت نشده',
  workEn: 'DESIGN SAMPLE — not a real citation',
  edition: '—',
  page: '—',
};

// ------------------------------------------------------------------- markup

function markHtml(citation) {
  return `
    <button type="button" class="mark" aria-label="منبع">
      §
      <span class="pop">
        <b>دارای منبع</b>
        <span>${citation.workFa}</span>
        <span class="pop-meta" dir="ltr">${citation.workEn} · ed. ${citation.edition} · p. ${citation.page}</span>
      </span>
    </button>`;
}

// unsourced variant of the same mark — dashed grey, per the datasheet's own
// "absence of colour is the meaning" convention (D21, e-press.css)
function markUnsourcedHtml(explain) {
  return `
    <button type="button" class="mark mark-unsourced" aria-label="بدون منبع">
      ?
      <span class="pop">
        <b>در حال تکمیل منبع</b>
        <span>${explain || 'منبع این مقدار هنوز ثبت نشده است.'}</span>
      </span>
    </button>`;
}

function noteHtml(id, text) {
  return `<button type="button" class="note-ref" data-note-for="${id}" aria-expanded="false" aria-controls="${id}">*</button><span class="note" id="${id}">${text}</span>`;
}

function termHtml(word, def) {
  return `<span class="term" tabindex="0">${word}<span class="pop">${def}</span></span>`;
}

// -------------------------------------------------------------- figure 1 (static)

function figure1Svg() {
  // Schematic only — explicitly not a microscope image or measured structure.
  const chain = (y, branched) => {
    let d = `M20,${y}`;
    for (let i = 0; i < 11; i++) {
      const x = 20 + i * 26;
      const yy = y + (i % 2 === 0 ? -10 : 10);
      d += ` L${x + 26},${yy}`;
    }
    let branches = '';
    if (branched) {
      // Anchor point must be the ACTUAL chain vertex at index i, not a
      // freshly-guessed one. Vertex i (i>=1) is the endpoint drawn by loop
      // iteration i-1, whose sign is (i-1)%2===0 ? -10 : 10 — i.e. the
      // OPPOSITE parity of `i` itself. Using `i % 2` directly (as before)
      // put every branch 20px off the line it was meant to sit on.
      [3, 5, 8].forEach((i) => {
        const x = 20 + i * 26;
        const yy = y + (i % 2 === 0 ? 10 : -10);
        branches += `<path d="M${x},${yy} l14,-16 l10,4" class="fig1-branch" />`;
      });
    }
    return `<path d="${d}" class="fig1-chain" />${branches}`;
  };
  return `
    <svg viewBox="0 0 340 140" role="img" aria-label="نمایش شماتیک زنجیر خطی در برابر زنجیر شاخه‌دار">
      <text x="330" y="24" class="fig1-label" text-anchor="end">خطی (HDPE)</text>
      ${chain(30, false)}
      <text x="330" y="104" class="fig1-label" text-anchor="end">شاخه‌دار (LDPE)</text>
      ${chain(110, true)}
    </svg>`;
}

// -------------------------------------------------------------- figure 2 (live)

// Density → illustrative crystallinity read-out. The density RANGE and its
// endpoints are real (data.js `density`, status 'unsourced'); the straight
// line mapping density to a crystallinity estimate is this file's own
// simplification, captioned as such — same discipline as graph.js.
const DENSITY_MIN = 0.91;
const DENSITY_MAX = 0.925;
const CRYST_AT_MIN = 30; // %, illustrative
const CRYST_AT_MAX = 58; // %, illustrative

function crystFromDensity(rho) {
  const t = (rho - DENSITY_MIN) / (DENSITY_MAX - DENSITY_MIN);
  return CRYST_AT_MIN + t * (CRYST_AT_MAX - CRYST_AT_MIN);
}

function figure2Html() {
  return `
    <div class="fig-live-badge"><i></i>شکل زنده — از دیتاشیت می‌خواند</div>
    <div class="fig2-row">
      <div class="fig2-track-wrap">
        <div class="fig2-track" id="fig2-track">
          <div class="fig2-fill" id="fig2-fill"></div>
          <div class="fig2-handle" id="fig2-handle" tabindex="0" role="slider"
               aria-label="چگالی، بین ${D_DENSITY ? D_DENSITY.value : ''} گرم بر سانتی‌متر مکعب"
               aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <div class="fig2-scale">
          <span>${DENSITY_MIN.toFixed(3)}</span>
          <span>${DENSITY_MAX.toFixed(3)} g/cm³</span>
        </div>
      </div>
      <div class="fig2-readout">
        <span class="num" id="fig2-rho">—</span>
        <span class="lbl">چگالی ${D_DENSITY ? markUnsourcedHtml(D_DENSITY.descFa) : ''}</span>
        <span class="num" id="fig2-cryst" style="margin-top:6px;">—</span>
        <span class="lbl">درجهٔ بلورینگی برآوردشده — نمایشی</span>
      </div>
    </div>
    <p class="fig-cap">
      <b>شکل ۲ —</b> بازهٔ چگالی از همان دیتاشیتی خوانده می‌شود که در صفحهٔ اصلی این پلیمر
      است (وضعیت: در حال تکمیل منبع). رابطهٔ خطی‌ای که چگالی را به یک برآورد از درجهٔ
      بلورینگی وصل می‌کند نمایشی است و مدلی صحه‌گذاری‌شده نیست — دقیقاً همان احتیاطی که
      در «شبکه» (L3) هم رعایت شده.
    </p>`;
}

function wireFigure2(container) {
  const track = container.querySelector('#fig2-track');
  const fill = container.querySelector('#fig2-fill');
  const handle = container.querySelector('#fig2-handle');
  const rhoOut = container.querySelector('#fig2-rho');
  const crystOut = container.querySelector('#fig2-cryst');

  let value = 0.5; // 0..1 within [DENSITY_MIN, DENSITY_MAX]

  function paint() {
    const rho = DENSITY_MIN + value * (DENSITY_MAX - DENSITY_MIN);
    const cryst = crystFromDensity(rho);
    fill.style.inlineSize = `${value * 100}%`;
    handle.style.insetInlineStart = `${value * 100}%`;
    handle.setAttribute('aria-valuenow', Math.round(value * 100));
    rhoOut.textContent = rho.toFixed(3) + ' g/cm³';
    crystOut.textContent = '≈ ' + cryst.toFixed(0) + '%';
  }

  function setFromClientX(clientX) {
    const rect = track.getBoundingClientRect();
    // RTL: the track's visual start (right edge) is value = 0.
    const fromRight = rect.right - clientX;
    value = clamp(fromRight / rect.width, 0, 1);
    paint();
  }

  let dragging = false;
  handle.addEventListener('pointerdown', (evt) => {
    dragging = true;
    handle.setPointerCapture(evt.pointerId);
  });
  handle.addEventListener('pointermove', (evt) => {
    if (!dragging) return;
    setFromClientX(evt.clientX);
  });
  const end = (evt) => {
    dragging = false;
    try {
      handle.releasePointerCapture(evt.pointerId);
    } catch {
      /* already released */
    }
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  // The fill grows from the track's right edge toward the left as value
  // rises (matching this page's RTL reading direction, same convention as
  // the top progress bar). So ArrowLeft — which moves the handle further
  // left, deeper into the filled zone — increases the value; ArrowRight
  // decreases it. ArrowUp/ArrowDown are kept as direction-agnostic synonyms.
  handle.addEventListener('keydown', (evt) => {
    const step = 0.03;
    if (evt.key === 'ArrowUp' || evt.key === 'ArrowLeft') {
      value = clamp(value + step, 0, 1);
      paint();
      evt.preventDefault();
    } else if (evt.key === 'ArrowDown' || evt.key === 'ArrowRight') {
      value = clamp(value - step, 0, 1);
      paint();
      evt.preventDefault();
    }
  });
  track.addEventListener('pointerdown', (evt) => {
    if (evt.target === handle) return;
    setFromClientX(evt.clientX);
  });

  paint();
}

// -------------------------------------------------------------------- article

// Three sections, each wrapped in an alternating .nb-block. At >=1040px this
// mirrors the reading column: block 1 text-right/notes-left, block 2
// text-left/notes-right, block 3 back to text-right/notes-left — a magazine
// spread rather than one column pinned to a single edge for the whole
// article. Below 1040px the modifier classes are inert (see notebook.css);
// content stacks exactly as before.
function articleHtml() {
  const tmFahrenheitLow = Math.round((105 * 9) / 5 + 32);
  const tmFahrenheitHigh = Math.round((115 * 9) / 5 + 32);

  const section1 = `
      <h2 id="s1">زنجیر خطی در برابر زنجیر شاخه‌دار</h2>
      <p>
        از نگاه شیمی، LDPE و HDPE تقریباً یک ترکیب‌اند: هر دو از تکرار همان واحد
        اتیلن ساخته شده‌اند. تفاوتی که همه چیز را عوض می‌کند، شکل زنجیر است. HDPE
        زنجیرهایی تقریباً خطی دارد؛ LDPE در فرایند تولید پرفشار خود، پر از
        ${noteHtml('n-branch', 'شاخهٔ کوتاه در برابر شاخهٔ بلند: شاخه‌های کوتاه عمدتاً بسته‌بندی بلوری را به‌هم می‌زنند؛ شاخه‌های بلند بیشتر روی رفتار مذاب و ویسکوزیته اثر می‌گذارند.')} می‌شود —
        هم شاخه‌های کوتاه و هم شاخه‌های بلند، منشعب از خودِ زنجیر اصلی.
      </p>
      <div class="fig">
        ${figure1Svg()}
        <p class="fig-cap">
          <b>شکل ۱ —</b> نمایش شماتیک زنجیر خطی در برابر شاخه‌دار. این تصویر برای
          آموزش کشیده شده، نه تصویری واقعی از میکروسکوپ یا شبیه‌سازی مولکولی.
        </p>
      </div>
      <p>
        همین انشعاب باعث می‌شود زنجیرهای LDPE هرگز به‌خوبی زنجیرهای خطی در کنار هم
        چیده نشوند. شاخه‌ها مثل مانع‌های کوچک عمل می‌کنند و اجازه نمی‌دهند بخش‌های
        بزرگی از ماده به آرایش منظم بلوری برسند.
      </p>

      <blockquote class="pull">
        یک زنجیر شاخه‌دار هرگز به‌خوبیِ زنجیر خطی در کنار هم چیده نمی‌شود؛ و همین یک
        تفاوت هندسی، چگالی، سفتی و حتی کدری این پلیمر را تعیین می‌کند.
      </blockquote>`;

  const section2 = `
      <h2 id="s2">بلورینگی: خط واسطِ ساختار و خاصیت</h2>
      <p>
        بخشی از حجم هر پلیمر نیمه‌بلوری در آرایش منظم قرار می‌گیرد —
        ${termHtml('درجهٔ بلورینگی', 'درصدی از حجم پلیمر که در آرایش منظم و بلوری قرار گرفته؛ باقی حجم به‌صورت بی‌شکل (آمورف) باقی می‌ماند.')}
        همین کمیت است — و باقی حجم آمورف می‌ماند. در ${material.nameFa}، درجهٔ بلورینگی
        هنوز ردیفی در دیتاشیت ندارد
        ${noteHtml('n-nodata', 'یعنی برخلاف چگالی یا Tm، عددی برای بلورینگی این گرید در پایگاه‌دادهٔ پروژه ثبت نشده — این صفحه به‌جای ساختن یک عدد، این خلأ را آشکار نگه می‌دارد.')},
        اما چگالی و دمای ذوب — که هر دو مستقیماً از آن تأثیر می‌گیرند — ثبت شده‌اند.
      </p>
      <p>
        دمای ذوب بلوری این گرید بین
        ${num(D_TM ? D_TM.value : '')} درجهٔ سلسیوس گزارش شده؛ یعنی تقریباً
        ${num(tmFahrenheitLow)} تا ${num(tmFahrenheitHigh)} درجهٔ فارنهایت
        ${noteHtml('n-conv', `تبدیل واحد مستقیم از همان بازهٔ ${D_TM ? D_TM.value : ''}°C دیتاشیت — این عدد جدیدی نیست، فقط در واحد دیگری نوشته شده.`)}.
        این بازه، نه یک عدد قطعی، دقیقاً به همین دلیل بازه است: گریدهای مختلف LDPE
        درجهٔ بلورینگی کمی متفاوت دارند.
      </p>

      <div class="fig" id="fig2-mount">
        ${figure2Html()}
      </div>`;

  const section3 = `
      <h2 id="s3">از چگالی تا کاربرد</h2>
      <p>
        چگالی این گرید بین ${num(D_DENSITY ? D_DENSITY.value : '')} گرم بر
        سانتی‌متر مکعب
        ${noteHtml('n-density', D_DENSITY ? D_DENSITY.descFa : '')}
        گزارش شده. این عدد کوچک، در عمل، تعیین می‌کند این ماده در کدام خط تولید
        بنشیند: چگالی پایین‌تر یعنی بخش آمورف بیشتر و انعطاف‌پذیری بهتر — مناسب
        فیلم دمشی و عایق کابل؛ نزدیک‌تر شدن به سقف بازه یعنی سفتی کمی بیشتر برای
        قالب‌گیری تزریقی. نمودار «شبکه» (L3) همین زنجیرهٔ علّی را به‌صورت کامل و
        قابل‌کشیدن نشان می‌دهد.
      </p>`;

  const block = (html, side) => `<section class="nb-block nb-block--${side}">${html}</section>`;

  return `
    <article class="article">
      ${block(section1, 'r')}
      ${block(section2, 'l')}
      ${block(section3, 'r')}
    </article>`;
}

// ---------------------------------------------------------------------- boot

function readingTimeMinutes(root) {
  const text = root.querySelector('.article').textContent || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function wireNoteToggles(root) {
  root.querySelectorAll('.note-ref').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.noteFor;
      const note = root.querySelector('#' + id);
      if (!note) return;
      const open = note.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

function wireProgress(root) {
  const bar = root.querySelector('#read-progress-fill');
  const article = root.querySelector('.article');
  function paint() {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.5;
    const passed = -rect.top;
    const pct = clamp(total > 0 ? (passed / total) * 100 : 0, 0, 100);
    bar.style.inlineSize = pct + '%';
  }
  document.addEventListener('scroll', paint, { passive: true });
  window.addEventListener('resize', paint);
  paint();
}

function wireToc(root) {
  const links = [...root.querySelectorAll('.toc-rail a')];
  if (!links.length) return;
  const sections = links
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) =>
          a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id),
        );
      });
    },
    { rootMargin: '-15% 0px -70% 0px' },
  );
  sections.forEach((s) => obs.observe(s));
}

export function renderNotebook(root) {
  root.innerHTML = `
    <div class="read-progress"><i id="read-progress-fill"></i></div>

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

    <div class="nb-wrap nb-head">
      <div class="eyebrow" dir="ltr">L4 · NOTEBOOK</div>
      <h1>چرا LDPE هرگز به فشردگیِ HDPE نمی‌رسد</h1>
      <p class="nb-standfirst">
        یک نگاه کوتاه به اینکه چطور شکل هندسیِ زنجیر — نه ترکیب شیمیایی —
        بلورینگی، چگالی و کاربرد نهایی یک پلیمر ساده را تعیین می‌کند.
      </p>
      <div class="nb-byline">
        <b>تحریریه پلی‌پدیا</b><span class="dot">·</span>
        <!-- Latin numerals per D18/R25 (the Persian digits here were a slip),
             and marked as a placeholder: this is a mock, and an invented
             publication date is still an invented fact. -->
        <span>${num('1405/05/13')} <i>(تاریخ نمونه)</i></span><span class="dot">·</span>
        <span id="reading-time">— دقیقه مطالعه</span><span class="dot">·</span>
        <span dir="ltr">${material.code}</span>
      </div>

      <div class="nb-review">
        <h2>یک ادعا از یک مقاله</h2>
        <p>
          پژوهشی که هنوز در این پروژه ثبت نشده، رابطهٔ میان درصد شاخه‌های کوتاه
          و افت دمای ذوب را در گریدهای مختلف پلی‌اتیلن بررسی کرده است. این
          صفحه ادعای آن پژوهش را نقل‌قول نمی‌کند — فقط نشان می‌دهد ارجاع به یک
          منبع در این سامانه، وقتی منبع واقعی هنوز ثبت نشده باشد، چه شکلی است.
        </p>
        <div class="nb-cite">منبع: ${SAMPLE_CITATION.workFa} ${markHtml(SAMPLE_CITATION)}</div>
      </div>
    </div>

    <nav class="toc-rail">
      <h2>فهرست</h2>
      <ol>
        <li><a href="#s1">زنجیر خطی در برابر شاخه‌دار</a></li>
        <li><a href="#s2">بلورینگی</a></li>
        <li><a href="#s3">از چگالی تا کاربرد</a></li>
      </ol>
    </nav>

    <div class="nb-wrap nb-body">
      ${articleHtml()}
    </div>

    <div class="nb-wrap nb-closing">
      <p>
        این مقاله یک نمونهٔ طراحی است، نه یک مطلب منتشرشده. عدد بلورینگیِ داخل
        شکل ۲ نمایشی است؛ چگالی و دمای ذوب واقعی‌اند و از همان دیتاشیتی خوانده
        می‌شوند که در صفحهٔ اصلی ${material.nameFa} است — با همان وضعیت «در حال
        تکمیل منبع» که آنجا هم دارند.
      </p>
    </div>

    <footer class="labfoot"><div class="wrap">
      <span dir="ltr">Polypedia</span> · آزمایشگاه — صفحه نمونه برای انتخاب هویت بصری
    </div></footer>
  `;

  root.querySelector('#theme-slot').replaceWith(themeButton());

  const rtMin = readingTimeMinutes(root);
  root.querySelector('#reading-time').innerHTML = `${num(rtMin)} دقیقه مطالعه`;

  wireFigure2(root.querySelector('#fig2-mount'));
  wireNoteToggles(root);
  wireProgress(root);
  wireToc(root);
}
