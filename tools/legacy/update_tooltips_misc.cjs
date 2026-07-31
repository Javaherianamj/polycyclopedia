const fs = require('fs');

function addTooltip(file, searchStr, replaceStr) {
  let data = fs.readFileSync(file, 'utf8');
  if (!data.includes('InfoTooltip')) {
    data = data.replace(
      "import {",
      "import { InfoTooltip } from './InfoTooltip';\nimport {"
    );
  }
  data = data.replace(searchStr, replaceStr);
  fs.writeFileSync(file, data, 'utf8');
}

addTooltip(
  'src/components/LCACircularEconomy.tsx',
  '<span className="text-text-secondary">درصد مواد بازیافتی (PCR):</span>',
  '<span className="text-text-secondary flex items-center gap-1">درصد مواد بازیافتی (PCR): <InfoTooltip text="درصد استفاده از مواد بازیافتی پس از مصرف (Post-Consumer Recycled). افزایش این مقدار باعث کاهش قابل توجه ردپای کربن و مصرف انرژی در مقایسه با مواد پتروشیمی بکر (Virgin) می‌شود." /></span>'
);

addTooltip(
  'src/components/AlloyingSimulator.tsx',
  '<span className="text-text-secondary font-medium">درصد ترکیب (Blend Ratio):</span>',
  '<span className="text-text-secondary font-medium flex items-center gap-1">درصد ترکیب (Blend Ratio): <InfoTooltip text="درصد افزودن فاز الاستومر یا پلیمر دوم به ماتریس پایه. این کار معمولاً برای بهبود چقرمگی (Toughness) یا مقاومت ضربه انجام می‌شود، اما ممکن است مقاومت کششی را کاهش دهد." /></span>'
);

addTooltip(
  'src/components/BranchingSimulator.tsx',
  '<div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div>شاخه‌های جانبی</div>',
  '<div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div>شاخه‌های جانبی <InfoTooltip text="شاخه‌های جانبی (Branches) در ساختار پلیمرها (مانند LDPE) باعث کاهش بلورینگی، افزایش انعطاف‌پذیری و تغییر در رفتار جریان مذاب (کاهش چگالی و تغییر ویسکوزیته) می‌شوند." /></div>'
);

