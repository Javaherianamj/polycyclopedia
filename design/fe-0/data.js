// FE-0 visual identity exploration — content for the sample screen.
//
// Real LDPE data, taken from the seeded database (db/seeds/0005) and the frozen
// prototype. Numerals are Latin everywhere per D18.
//
// The single "cited" value below is labelled a DESIGN SAMPLE on purpose. No real
// citation exists yet — every one of the 109 seeded values is `unsourced`.
// Inventing a plausible page number, even in a mock, is the exact failure mode
// this project's schema exists to prevent (R5).

export const material = {
  code: 'LDPE',
  nameFa: 'پلی‌اتیلن با چگالی پایین',
  nameEn: 'Low-Density Polyethylene',
  familyFa: 'پلی‌اولفین‌ها',
  familyEn: 'Polyolefins',
  cas: '9002-88-4',
  resinCode: 4,
  discoveryYear: '1933',
  discoveryOrg: 'ICI',
  overviewFa:
    'پلی‌اتیلن با چگالی پایین که با اختصار LDPE شناخته می‌شود، یکی از مهم‌ترین و پرکاربردترین پلیمرهای ترموپلاستیک نیمه‌بلوری در جهان است. این پلیمر عضوی از خانواده بزرگ پلی‌اولفین‌ها محسوب می‌شود و اولین بار در سال 1933 توسط شرکت Imperial Chemical Industries در بریتانیا به روش صنعتی تولید شد.',
  coverage: { sourced: 0, total: 54 },
};

// status: 'unsourced' | 'sourced' | 'missing'
export const groups = [
  {
    key: 'processing',
    nameFa: 'فرآیندپذیری',
    nameEn: 'Processing',
    learn: {
      label: 'شبیه‌ساز پنجره فرآیند',
      hint: 'دما و فشار را جابه‌جا کن و پنجره شکل‌دهی را ببین',
    },
    properties: [
      {
        key: 'process_temp',
        nameFa: 'دمای فرآیند',
        symbol: null,
        value: '180 - 230',
        unit: '°C',
        status: 'unsourced',
        descFa: 'بازه دمایی مذاب که در آن پلیمر بدون تخریب حرارتی قابل شکل‌دهی است.',
      },
      {
        key: 'mfi',
        nameFa: 'شاخص جریان مذاب',
        symbol: 'MFI',
        value: '0.2 - 20',
        unit: 'g/10min',
        status: 'unsourced',
        descFa:
          'جرم پلیمر مذابی که در ده دقیقه تحت بار استاندارد از روزنه عبور می‌کند؛ معیار غیرمستقیم وزن مولکولی.',
      },
      {
        key: 'bur',
        nameFa: 'نسبت دمش',
        symbol: 'BUR',
        value: '2:1 تا 4:1',
        unit: '',
        status: 'unsourced',
        descFa: 'نسبت قطر حباب فیلم دمشی به قطر دای؛ جهت‌گیری زنجیرها را تعیین می‌کند.',
      },
    ],
  },
  {
    key: 'thermal',
    nameFa: 'خواص حرارتی',
    nameEn: 'Thermal',
    learn: { label: 'شبیه‌ساز حالت فیزیکی', hint: 'دما را تغییر بده و گذر شیشه‌ای و ذوب را ببین' },
    properties: [
      {
        key: 'tg',
        nameFa: 'دمای انتقال شیشه‌ای',
        symbol: 'Tg',
        value: '-110',
        unit: '°C',
        status: 'unsourced',
        descFa:
          'دمایی که در آن پلیمر از حالت سخت و شکننده (شیشه‌ای) به حالت انعطاف‌پذیر (لاستیکی) تغییر فاز می‌دهد.',
      },
      {
        key: 'tm',
        nameFa: 'دمای ذوب بلوری',
        symbol: 'Tm',
        value: '105 - 115',
        unit: '°C',
        status: 'unsourced',
        descFa: 'دمایی که در آن مناطق بلوری پلیمر ذوب شده و به حالت مذاب در می‌آیند.',
      },
      {
        key: 'vicat',
        nameFa: 'نقطه نرمی ویکات',
        symbol: null,
        value: '85 - 95',
        unit: '°C',
        status: 'sourced',
        citation: {
          workFa: 'نمونهٔ طراحی — منبع واقعی هنوز ثبت نشده',
          workEn: 'DESIGN SAMPLE — not a real citation',
          edition: '—',
          page: '—',
        },
        descFa:
          'دمایی که در آن سوزن استاندارد تحت بار مشخص به عمق یک میلی‌متر در نمونه فرو می‌رود.',
      },
      {
        key: 'conductivity',
        nameFa: 'رسانندگی گرمایی',
        symbol: 'k',
        value: '0.33 - 0.40',
        unit: 'W/m·K',
        status: 'unsourced',
        descFa: 'توان انتقال گرما در واحد ضخامت؛ در طراحی زمان خنک‌کاری قالب تعیین‌کننده است.',
      },
      {
        key: 'cte',
        nameFa: 'ضریب انبساط حرارتی',
        symbol: 'CTE',
        value: null,
        unit: 'µm/m·°C',
        status: 'missing',
        descFa: 'میزان تغییر ابعاد قطعه به ازای هر درجه تغییر دما.',
      },
    ],
  },
  {
    key: 'mechanical',
    nameFa: 'خواص مکانیکی',
    nameEn: 'Mechanical',
    learn: { label: 'نمودار تنش–کرنش', hint: 'منحنی را برای این گرید رسم کن' },
    note: 'مقاومت ضربه‌ای LDPE به‌ویژه در دماهای پایین بسیار بالاست، اما رفتار خزشی آن در بارگذاری طولانی‌مدت قابل توجه است و باید در طراحی قطعات دیده شود.',
    properties: [
      {
        key: 'tensile_strength',
        nameFa: 'استحکام کششی',
        symbol: 'σ',
        value: '8 - 15',
        unit: 'MPa',
        status: 'unsourced',
        descFa: 'بیشینه تنشی که نمونه پیش از گسیختگی در آزمون کشش تحمل می‌کند.',
      },
      {
        key: 'young_modulus',
        nameFa: 'مدول یانگ',
        symbol: 'E',
        value: '0.15 - 0.35',
        unit: 'GPa',
        status: 'unsourced',
        descFa: 'شیب ناحیه خطی منحنی تنش–کرنش؛ معیار سفتی ماده.',
      },
      {
        key: 'elongation_at_break',
        nameFa: 'ازدیاد طول تا پارگی',
        symbol: 'ε',
        value: '100 - 650',
        unit: '%',
        status: 'unsourced',
        descFa: 'درصد افزایش طول نمونه تا لحظه گسیختگی؛ معیار نرمی و شکل‌پذیری.',
      },
      {
        key: 'hardness_shore_d',
        nameFa: 'سختی شور D',
        symbol: null,
        value: '40 - 50',
        unit: '',
        status: 'unsourced',
        descFa: 'مقاومت سطح در برابر فرورفتگی، اندازه‌گیری‌شده با سختی‌سنج شور D.',
      },
      {
        key: 'izod_impact',
        nameFa: 'مقاومت ضربه ایزود',
        symbol: null,
        value: null,
        unit: 'kJ/m²',
        status: 'missing',
        descFa: 'انرژی جذب‌شده هنگام شکست نمونه شیاردار تحت ضربه آونگی.',
      },
    ],
  },
  {
    // Added 2026-08-03. The L3/L4 agent reported crystallinity as having "no
    // datasheet row" — true of this sample file, but NOT of the database, where
    // LDPE carries 40–55 % (db/seeds/0005, unsourced like everything else).
    // The omission was mine. Recorded here so no future work treats it as a
    // real data gap.
    key: 'academic',
    nameFa: 'اطلاعات علمی و مولکولی',
    nameEn: 'Academic',
    learn: { label: 'ماشین‌حساب درجه پلیمریزاسیون', hint: 'از Mn و Mw به DP و شاخص پراکندگی' },
    properties: [
      {
        key: 'crystallinity',
        nameFa: 'درصد بلورینگی',
        symbol: 'Xc',
        value: '40 - 55',
        unit: '%',
        status: 'unsourced',
        descFa: 'درصد حجمی یا وزنی مناطق منظم بلوری در ساختار پلیمر نیمه‌بلوری.',
      },
    ],
  },
  {
    key: 'physical',
    nameFa: 'خواص فیزیکی',
    nameEn: 'Physical',
    learn: null,
    properties: [
      {
        key: 'density',
        nameFa: 'چگالی',
        symbol: 'ρ',
        value: '0.910 - 0.925',
        unit: 'g/cm³',
        status: 'unsourced',
        descFa: 'جرم در واحد حجم؛ در پلی‌اتیلن مستقیماً با درجه بلورینگی مرتبط است.',
      },
      {
        key: 'water_absorption',
        nameFa: 'جذب آب',
        symbol: null,
        value: '< 0.01',
        unit: '%',
        status: 'unsourced',
        descFa: 'درصد افزایش جرم نمونه پس از غوطه‌وری استاندارد در آب.',
      },
      {
        key: 'refractive_index',
        nameFa: 'ضریب شکست',
        symbol: 'n',
        value: '~ 1.51',
        unit: '',
        status: 'unsourced',
        descFa: 'نسبت سرعت نور در خلأ به سرعت آن در ماده.',
      },
    ],
  },
];

export const strings = {
  brand: 'Polypedia',
  brandFa: 'پلی‌پدیا',
  tagline: 'دانشنامه مهندسی پلیمر',
  catalog: 'کاتالوگ',
  search: 'جستجوی خواص',
  compare: 'مقایسه',
  sources: 'منابع',
  datasheet: 'دیتاشیت',
  learn: 'محیط یادگیری',
  learnCta: 'رفتن به محیط یادگیری',
  unsourced: 'در حال تکمیل منابع',
  unsourcedLong: 'منبع این مقدار هنوز ثبت نشده است. در حال تکمیل است.',
  sourced: 'دارای منبع',
  missing: 'هنوز ثبت نشده',
  missingCta: 'کمک به تکمیل این داده',
  coverage: (s, t) => `${s} از ${t} مقدار دارای منبع`,
  cas: 'شناسه CAS',
  resin: 'کد بازیافت',
  family: 'خانواده',
  discovered: 'سال توسعه',
  similar: 'پلیمرهای مشابه، اما سفت‌تر',
  quickCompare: 'مقایسه سریع',
  credit: 'با همکاری انجمن علمی مهندسی پلیمر',
  mockNote:
    'صفحه نمونه برای انتخاب هویت بصری — داده‌ها واقعی‌اند، ارجاع منبع نمونه است و منبع واقعی هنوز ثبت نشده.',
};
