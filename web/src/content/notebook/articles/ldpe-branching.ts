// Article #1 of the «دفترچه» / NOTEBOOK template — "Why LDPE never packs as
// tightly as HDPE". See ../index.ts for why this exists as a content
// module rather than JSX, and for how a second article gets added.
//
// EVERY NUMBER IN THIS FILE IS ABSENT ON PURPOSE. The mechanism this
// article teaches (branching disrupts crystalline packing → lower
// crystallinity → lower density → different application fit) is the same
// causal chain `causal-graph.ts` (L3/GRAPH) already encodes and
// `spherulite-readout.ts` (SCALE's 10⁻⁶ station) already shows as real
// paired data — this article is prose ABOUT that established mechanism,
// not a new scientific claim. The one place a real number appears is a
// `liveValue` segment, resolved against the live API by
// `LearnNotebook.astro` at render time — never a literal digit typed here
// (R5/R8). Checked against the running API before writing this (2026-08-15):
// LDPE's density and crystallinity are `published`/cited; its Tg and Tm are
// `unsourced` — the article's two provenance marks are therefore expected
// to show BOTH real states, not a cherry-picked one.
import type { NotebookArticle } from '../types';
import { liveValue, note, term, text } from '../segments';

export const ldpeBranchingArticle: NotebookArticle = {
  slug: 'ldpe-branching',
  materialSlug: 'ldpe',
  title: {
    fa: 'چرا LDPE هرگز به فشردگیِ HDPE نمی‌رسد',
    en: 'Why LDPE Never Packs as Tightly as HDPE',
  },
  standfirst: {
    fa: 'نگاهی کوتاه به این‌که چگونه شکل هندسی زنجیر — نه ترکیب شیمیایی — بلورینگی، چگالی و کاربرد نهاییِ این پلیمر را تعیین می‌کند.',
    en: "A short look at how a chain's geometry — not its chemistry — decides a polymer's crystallinity, density, and where it ends up being used.",
  },
  // Ported from the FE-0 prototype's own placeholder date, labelled as a
  // sample for the same reason the review block's citation is labelled as
  // one: an invented publication date is still an invented fact.
  dateSample: '1405/05/25',
  review: {
    claim: [
      text(
        'پژوهشی که هنوز در این پروژه ثبت نشده، رابطهٔ میان درصد و طول شاخه‌های کوتاه و افت دمای ذوب را در گریدهای مختلف پلی‌اتیلن بررسی کرده است. این صفحه ادعای آن پژوهش را نقل‌قول نمی‌کند — فقط نشان می‌دهد ارجاع به یک منبع در این سامانه، وقتی منبع واقعی هنوز ثبت نشده باشد، چه شکلی است.',
        "A study not yet registered in this project examined how short-branch content and length relate to the drop in melting point across different LDPE grades. This block does not quote that study's claim — it only shows what a citation looks like in this system when a real source has not been registered yet.",
      ),
    ],
    // The sample-citation object this whole project allows itself — see
    // ../index.ts's header for why article #1 uses this path rather than
    // attaching a real citation id to an unverified claim.
    sampleCitation: {
      workFa: 'نمونهٔ طراحی — منبع واقعی هنوز ثبت نشده',
      workEn: 'DESIGN SAMPLE — not a real citation',
      edition: '—',
      page: '—',
    },
  },
  sections: [
    {
      id: 's1',
      side: 'r',
      blocks: [
        {
          kind: 'heading',
          id: 's1',
          tocLabel: { fa: 'زنجیر خطی در برابر شاخه‌دار', en: 'Linear vs. branched' },
          text: { fa: 'زنجیر خطی در برابر زنجیر شاخه‌دار', en: 'Linear chains versus branched chains' },
        },
        {
          kind: 'para',
          segments: [
            text(
              'از نگاه شیمیایی، LDPE و HDPE تقریباً یک ترکیب‌اند: هر دو از تکرار همان واحد اتیلن ساخته شده‌اند. آنچه همه‌چیز را عوض می‌کند، شکل زنجیر است. زنجیرهای HDPE تقریباً خطی‌اند؛ LDPE، در فرایند تولید پرفشار خودش، پر از ',
              'Chemically, LDPE and HDPE are close relatives: both are built by repeating the same ethylene unit. What changes everything is chain shape. HDPE\'s chains are close to linear; LDPE, in its own high-pressure production process, grows full of ',
            ),
            note(
              'n-branch',
              'شاخه',
              'branches',
              'شاخهٔ کوتاه در برابر شاخهٔ بلند: شاخه‌های کوتاه عمدتاً بسته‌بندی بلوری را برهم می‌زنند؛ شاخه‌های بلند بیشتر روی رفتار مذاب و ویسکوزیته اثر می‌گذارند — همان تفکیکی که نمودار «شبکه» (L3) با دو گرهٔ ورودی جداگانه نشان می‌دهد.',
              'Short branches versus long branches: short branches mostly disrupt crystalline packing; long branches mostly change melt behaviour and viscosity — the same split the «GRAPH» (L3) page draws with two separate input nodes.',
            ),
            text(
              ' می‌شود — هم شاخه‌های کوتاه و هم شاخه‌های بلند، همگی منشعب از خودِ زنجیر اصلی.',
              " — both short and long, all branching off the main chain itself.",
            ),
          ],
        },
        {
          kind: 'figureSchematic',
          caption: [
            text(
              'شکل ۱ — نمایش شماتیک زنجیر خطی در برابر زنجیر شاخه‌دار. این تصویر برای آموزش کشیده شده است، نه تصویر واقعی میکروسکوپ یا شبیه‌سازی مولکولی.',
              'Figure 1 — a schematic of a linear chain against a branched one. Drawn for teaching, not a real micrograph or molecular simulation.',
            ),
          ],
        },
        {
          kind: 'para',
          segments: [
            text(
              'همین انشعاب باعث می‌شود زنجیرهای LDPE هرگز به‌خوبیِ زنجیرهای خطی در کنار هم چیده نشوند. شاخه‌ها مانند مانع‌های کوچک عمل می‌کنند و نمی‌گذارند بخش بزرگی از ماده به آرایش منظم بلوری برسد.',
              "That branching is exactly why LDPE's chains never pack as neatly as linear ones. The branches act like small obstacles, keeping large regions of the material from ever reaching an ordered crystalline arrangement.",
            ),
          ],
        },
        {
          kind: 'pullquote',
          segments: [
            text(
              'یک زنجیر شاخه‌دار هرگز به‌خوبیِ زنجیر خطی در کنار هم چیده نمی‌شود؛ و همین یک تفاوت هندسی، بلورینگی، چگالی و سفتیِ نهاییِ این پلیمر را تعیین می‌کند.',
              "A branched chain never packs as neatly as a linear one — and that single geometric difference is what decides this polymer's crystallinity, density, and final stiffness.",
            ),
          ],
        },
      ],
    },
    {
      id: 's2',
      side: 'l',
      blocks: [
        {
          kind: 'heading',
          id: 's2',
          tocLabel: { fa: 'بلورینگی', en: 'Crystallinity' },
          text: { fa: 'بلورینگی: خط واسط ساختار و خاصیت', en: 'Crystallinity: where structure meets property' },
        },
        {
          kind: 'para',
          segments: [
            text('بخشی از حجم هر پلیمر نیمه‌بلوری در آرایش منظم قرار می‌گیرد — ', 'Part of every semicrystalline polymer\'s volume settles into an ordered arrangement — '),
            term(
              'درجهٔ بلورینگی',
              'degree of crystallinity',
              'درصدی از حجم پلیمر که در آرایش منظم و بلوری قرار گرفته؛ باقی حجم به‌صورت بی‌شکل (آمورف) باقی می‌ماند.',
              'The percentage of a polymer\'s volume that has settled into an ordered, crystalline arrangement; the remaining volume stays amorphous (unordered).',
            ),
            text(
              ' همین کمیت است — و باقی حجم آمورف می‌ماند. هرچه شاخه‌ها در پلی‌اتیلن بیشتر و بزرگ‌تر باشند، رسیدن به این آرایش منظم دشوارتر می‌شود. برای این گرید، درصد بلورینگی در دیتاشیت ثبت شده: ',
              ' — and the rest stays amorphous. The more and the larger a polyethylene\'s branches, the harder that ordered arrangement is to reach. For this grade, the crystallinity figure on record is: ',
            ),
            liveValue('academic', 'crystallinity'),
            text('.', '.'),
          ],
        },
        {
          kind: 'para',
          segments: [
            text('دمای ذوب بلوری این گرید بین ', "This grade's crystalline melting point is reported between "),
            liveValue('thermal', 'tm'),
            text(' گزارش شده؛ یعنی تقریباً ', ', which is roughly '),
            liveValue('thermal', 'tm', 'celsiusToFahrenheit'),
            text(' درجهٔ فارنهایت', ' Fahrenheit'),
            note(
              'n-conv',
              '*',
              '*',
              'تبدیل واحد مستقیم از همان بازهٔ درجهٔ سلسیوسِ دیتاشیت است؛ این عدد جدیدی نیست، فقط در واحد دیگری نوشته شده.',
              "A direct unit conversion of the same Celsius range on the datasheet — not a new measured number, just written in a different unit.",
            ),
            text(
              '. بازه بودنِ این عدد اتفاقی نیست: گریدهای مختلف LDPE، بسته به میزان و نوع شاخه‌ای‌شدن‌شان، بلورینگیِ کمی متفاوتی دارند و در نتیجه دمای ذوب‌شان هم کمی جابه‌جا می‌شود.',
              ". That this is a range rather than a single number is not an accident: different LDPE grades carry slightly different crystallinity, depending on how much and what kind of branching they have, and their melting points shift accordingly.",
            ),
          ],
        },
        { kind: 'figureLive' },
      ],
    },
    {
      id: 's3',
      side: 'r',
      blocks: [
        {
          kind: 'heading',
          id: 's3',
          tocLabel: { fa: 'چگالی تا کاربرد', en: 'Density to application' },
          text: { fa: 'از چگالی تا کاربرد', en: 'From density to application' },
        },
        {
          kind: 'para',
          segments: [
            text('چگالی این گرید ', "This grade's density is reported at "),
            liveValue('physical', 'density'),
            note(
              'n-density',
              '*',
              '*',
              'چگالی در پلی‌اتیلن مستقیماً با درجهٔ بلورینگی مرتبط است: زنجیرهای منظم‌تر فضای کمتری اشغال می‌کنند و جرم بیشتری در همان حجم جا می‌گیرد.',
              'In polyethylene, density tracks crystallinity directly: more ordered chains occupy less space, so more mass fits in the same volume.',
            ),
            text(
              ' گزارش شده. این عدد کوچک، در عمل، تعیین می‌کند این ماده در کدام خط تولید بنشیند: نزدیک‌تر شدن به کف بازه یعنی بخش آمورف بیشتر و انعطاف‌پذیریِ بهتر — مناسب فیلم دمشی و عایق کابل؛ نزدیک‌تر شدن به سقف بازه یعنی بسته‌بندیِ بلوریِ فشرده‌تر و سفتیِ بیشتر. نمودار «شبکه» (L3) همین زنجیرهٔ علّی — از شاخه‌ای‌شدن تا کاربرد نهایی — را به‌صورت کامل و قابل‌کشیدن نشان می‌دهد.',
              '. In practice, that small number decides which production line this material fits on: closer to the bottom of the range means more amorphous content and better flexibility — suited to blown film and cable insulation; closer to the top means tighter crystalline packing and more stiffness. The «GRAPH» (L3) page shows this exact causal chain — from branching to final application — in full and draggable.',
            ),
          ],
        },
      ],
    },
  ],
  closing: [
    text(
      'این نوشته نخستین سند در قالب «دفترچه» است؛ عددهای بلورینگی، دمای ذوب و چگالیِ بالا همگی به‌صورت زنده از همان دیتاشیتی خوانده می‌شوند که در صفحهٔ اطلاعات این پلیمر است، با همان نشانه‌های منبع. تنها بخش نمایشیِ این صفحه ادعای نقل‌شده در «یک ادعا از یک مقاله» است، که آشکارا نمونهٔ طراحی برچسب خورده — نه بازبینیِ واقعیِ یک مقالهٔ واقعی.',
      'This is the first document in the «NOTEBOOK» template; the crystallinity, melting-point and density figures above are all read live from the same datasheet as this polymer\'s own material page, with the same provenance marks. The one illustrative part of this page is the claim quoted in "A claim from a paper", which is explicitly labelled a design sample — not a real review of a real paper.',
    ),
  ],
};
