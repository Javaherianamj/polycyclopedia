const fs = require('fs');

let data = fs.readFileSync('src/components/BranchingSimulator.tsx', 'utf8');

data = data.replace(
  '<span className="text-text-secondary font-medium">میزان شاخه‌داری (Branches per 1000 C)</span>',
  '<span className="text-text-secondary font-medium flex items-center gap-1">میزان شاخه‌داری (Branches per 1000 C) <InfoTooltip text="نشان دهنده تعداد شاخه‌های جانبی (معمولاً بوتیل یا آمیل) در هر هزار اتم کربن ستون فقرات است. افزایش این میزان باعث افت بلورینگی و کاهش چگالی می‌گردد." /></span>'
);

fs.writeFileSync('src/components/BranchingSimulator.tsx', data, 'utf8');
