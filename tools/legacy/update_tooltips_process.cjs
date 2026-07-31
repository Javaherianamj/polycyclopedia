const fs = require('fs');

let data = fs.readFileSync('src/components/ProcessingWindowSimulator.tsx', 'utf8');

// add import if missing
if (!data.includes('InfoTooltip')) {
  data = data.replace(
    "import { AlertTriangle, Settings, CheckCircle2, ChevronDown } from 'lucide-react';",
    "import { AlertTriangle, Settings, CheckCircle2, ChevronDown } from 'lucide-react';\nimport { InfoTooltip } from './InfoTooltip';"
  );
}

data = data.replace(
  '<span className="text-text-secondary">دمای مذاب (Melt Temp):</span>',
  '<span className="text-text-secondary flex items-center gap-1">دمای مذاب (Melt Temp): <InfoTooltip text="دمای مذاب (Melt Temperature) دمای پلیمر در حالت مذاب درون سیلندر تزریق است. این دما باید به اندازه کافی بالا باشد تا گرانروی کاهش یابد، اما نه آنقدر بالا که باعث تخریب حرارتی (Degradation) پلیمر شود." /></span>'
);

data = data.replace(
  '<span className="text-text-secondary">دمای قالب (Mold Temp):</span>',
  '<span className="text-text-secondary flex items-center gap-1">دمای قالب (Mold Temp): <InfoTooltip text="دمای قالب (Mold Temperature) به دمای سطوح داخلی قالب در دستگاه تزریق پلاستیک گفته می‌شود. تنظیم صحیح این دما برای کنترل سرعت سرد شدن، درصد بلورینگی و جلوگیری از اعوجاج قطعه بسیار حیاتی است." /></span>'
);

data = data.replace(
  '<span className="text-text-secondary">فشار تزریق (Pressure):</span>',
  '<span className="text-text-secondary flex items-center gap-1">فشار تزریق (Pressure): <InfoTooltip text="فشار تزریق نیرویی است که مذاب پلیمری را به درون کویته قالب می‌راند. فشار نامناسب می‌تواند منجر به نقص‌هایی مانند پرنشدن کامل (Short Shot) یا ایجاد پلیسه (Flash) شود." /></span>'
);

fs.writeFileSync('src/components/ProcessingWindowSimulator.tsx', data, 'utf8');
