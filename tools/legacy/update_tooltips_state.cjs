const fs = require('fs');

let data = fs.readFileSync('src/components/StateSimulator.tsx', 'utf8');

if (!data.includes('InfoTooltip')) {
  data = data.replace(
    "import { Thermometer, ThermometerSun, ThermometerSnowflake, Flame, ArrowLeftRight, Settings2 } from 'lucide-react';",
    "import { Thermometer, ThermometerSun, ThermometerSnowflake, Flame, ArrowLeftRight, Settings2 } from 'lucide-react';\nimport { InfoTooltip } from './InfoTooltip';"
  );
}

data = data.replace(
  '<span>تنظیم دمای نمونه:</span>',
  '<span className="flex items-center gap-1">تنظیم دمای نمونه: <InfoTooltip text="با تغییر دمای نمونه، می‌توانید تغییر فازها (شیشه‌ای، لاستیکی، مذاب) و رفتار ماکرومولکولی پلیمر را بر اساس دماهای انتقال شیشه‌ای (Tg) و ذوب (Tm) مشاهده کنید." /></span>'
);

fs.writeFileSync('src/components/StateSimulator.tsx', data, 'utf8');
