const fs = require('fs');
let data = fs.readFileSync('src/App.tsx', 'utf8');

if (!data.includes('InfoTooltip')) {
  data = data.replace(
    "import { PolymerCombobox } from './components/PolymerCombobox';",
    "import { PolymerCombobox } from './components/PolymerCombobox';\nimport { InfoTooltip } from './components/InfoTooltip';"
  );
}

const tooltips = {
  'شاخص چندپخشی (PDI)': 'شاخص پراکندگی (Polydispersity Index) نشان‌دهنده گستردگی توزیع وزن مولکولی است. هرچه PDI به ۱ نزدیک‌تر باشد، طول زنجیرها یکنواخت‌تر است.',
  'جرم مولی وزنی متوسط (Mw)': 'متوسط وزنی وزن مولکولی که بیشتر تحت تاثیر زنجیره‌های بلندتر است و مستقیماً با خواص مکانیکی (مانند استحکام و چقرمگی) ارتباط دارد.',
  'جرم مولی عددی متوسط (Mn)': 'متوسط عددی وزن مولکولی که به تعداد مولکول‌ها بستگی دارد. این پارامتر بر خواص ترمودینامیکی مانند نقطه ذوب و دمای انتقال شیشه‌ای تاثیر می‌گذارد.',
  'محدوده درجه پلیمریزاسیون (DP)': 'درجه پلیمریزاسیون نشان‌دهنده تعداد واحدهای تکرارشونده (مونومر) در یک زنجیره پلیمری است. طول زنجیر مستقیماً بر گرانروی و خواص مکانیکی اثر دارد.',
  'وزن مولکولی گره‌خوردگی (Me)': 'حداقل وزن مولکولی که در آن زنجیره‌های پلیمری با یکدیگر گره می‌خورند (Entanglement). گره‌خوردگی برای ایجاد استحکام و رفتار لاستیکی ضروری است.',
  'شعاع ژیراسیون (Rg)': 'شعاع چرخش (Radius of Gyration) معیاری از اندازه یک کلاف پلیمری در فضا است و نشان می‌دهد جرم ماکرومولکول چگونه حول مرکز جرم توزیع شده است.',
  'گرانروی برشی صفر (η0)': 'گرانروی برشی صفر (Zero-Shear Viscosity) مقاومت پلیمر در برابر جریان در نرخ‌های برشی بسیار پایین (نزدیک به صفر) است که مستقیماً با وزن مولکولی مرتبط است.',
  'ضریب توان سیال (n)': 'در سیالات غیرنیوتنی (Pseudoplastic)، ضریب توان (Power Law Index) نشان‌دهنده شدت رفتار رقیق‌شوندگی برشی (Shear-thinning) است. مقادیر کمتر از ۱ نشان‌دهنده رقیق‌شوندگی است.',
  'دمای ذوب (Tm)': 'دمای ذوب بلوری (Melting Temperature) دمایی است که در آن مناطق بلوری پلیمر ذوب شده و به حالت مذاب در می‌آیند.',
  'دمای انتقال شیشه‌ای (Tg)': 'دمایی است که در آن پلیمر از حالت سخت و شکننده (شیشه‌ای) به حالت انعطاف‌پذیر (لاستیکی) تغییر فاز می‌دهد.',
  'دمای تخریب حرارتی': 'دمایی است که در آن پیوندهای شیمیایی زنجیره اصلی پلیمر شروع به شکستن کرده و پلیمر تجزیه می‌شود.'
};

for (const [key, tooltipText] of Object.entries(tooltips)) {
  const searchStr = `<div className="text-[11px] font-bold text-text-secondary">${key}</div>`;
  const replaceStr = `<div className="text-[11px] font-bold text-text-secondary flex items-center gap-1">${key} <InfoTooltip text="${tooltipText}" /></div>`;
  data = data.replaceAll(searchStr, replaceStr);
}

fs.writeFileSync('src/App.tsx', data, 'utf8');
