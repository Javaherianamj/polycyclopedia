const fs = require('fs');

let data = fs.readFileSync('src/components/LCACircularEconomy.tsx', 'utf8');

// Replace lcaStages array
const stagesRegex = /const lcaStages = \[[\s\S]*?\];/;
const newStages = `const lcaStages = [
    {
      stage: '۱. استخراج خوراک پتروشیمی',
      icon: <Droplet className="w-5 h-5 text-accent-tertiary" />,
      desc: 'کرکینگ نفتا و گاز طبیعی جهت تولید مونومرهای اولیه',
      impact: \`\${(virginCo2 * 0.45).toFixed(1)} kg CO₂e\`,
      badge: 'Upstream',
      badgeClass: 'bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary/20'
    },
    {
      stage: '۲. سنتز و پلیمریزاسیون',
      icon: <Dna className="w-5 h-5 text-accent-secondary" />,
      desc: 'واکنش‌های کاتالیستی صنعتی، گرانول‌سازی و افزودنی‌زدایی',
      impact: \`\${(virginCo2 * 0.35).toFixed(1)} kg CO₂e\`,
      badge: 'Synthesis',
      badgeClass: 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20'
    },
    {
      stage: '۳. شکل‌دهی و تولید قطعه',
      icon: <Factory className="w-5 h-5 text-status-warning" />,
      desc: 'تزریق پلاستیک، اکستروژن یا قالب‌گیری بادی در کارخانجات پایینی',
      impact: \`\${(virginCo2 * 0.20).toFixed(1)} kg CO₂e\`,
      badge: 'Processing',
      badgeClass: 'bg-status-warning/10 text-status-warning border border-status-warning/20'
    },
    {
      stage: '۴. چرخه بازیافت و پایان عمر (EoL)',
      icon: <Recycle className="w-5 h-5 text-status-success" />,
      desc: \`بازیافت مکانیکی (ASTM D7611) یا بازیافت شیمیایی پیرولیز\`,
      impact: pcrShare > 0 ? \`کاهش \${savingsPercent}٪ کربن\` : 'پتانسیل بازیافت',
      badge: 'Circular Loop',
      badgeClass: 'bg-status-success/10 text-status-success border border-status-success/20'
    },
  ];`;
data = data.replace(stagesRegex, newStages);

// Replace the result row (Net footprint and reduction)
const resultRowRegex = /<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs font-bold text-text-secondary mt-2 pt-3 border-t border-border-subtle">[\s\S]*?<\/div>\s*<\/div>/;
const newResultRow = `<div className="flex items-center justify-between gap-3 text-xs font-bold text-text-secondary mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <span>ردپای کربن نهایی:</span>
            <span className="en-mono font-mono tabular-nums text-sm font-black text-text-primary bg-bg-base px-2 py-0.5 rounded border border-border-subtle" dir="ltr">
              {netCo2} kg CO₂e
            </span>
          </div>
          <div className="text-status-success font-bold tabular-nums inline-flex items-center gap-1.5">
            <span className="en-mono font-mono font-black">{savingsPercent}%</span> کاهش CO₂
          </div>
        </div>
      </div>`;
data = data.replace(resultRowRegex, newResultRow);

// Replace the card footer
const cardFooterRegex = /<div className="mt-auto border-t border-border-subtle pt-2 flex flex-col gap-0\.5">[\s\S]*?<\/div>/g;
const newCardFooter = `<div className="mt-auto border-t border-border-subtle pt-3 flex items-center justify-between">
              <span className="text-[10px] text-text-secondary font-bold">شاخص آلایندگی:</span>
              <span className="text-text-primary font-bold en-mono font-mono tabular-nums text-[11px] bg-bg-base border border-border-subtle px-2 py-1 rounded-md shadow-xs" dir="ltr">{stg.impact}</span>
            </div>`;
data = data.replace(cardFooterRegex, newCardFooter);

// Replace the badge class
data = data.replace(
  /<span className="text-\[10px\] font-bold text-accent-secondary bg-accent-secondary\/10 border border-accent-secondary\/20 px-2 py-0\.5 rounded en-mono font-mono tracking-wider uppercase">/g,
  '<span className={`text-[9px] font-bold px-2 py-0.5 rounded-full en-mono font-mono tracking-wider uppercase ${stg.badgeClass}`}>'
);


fs.writeFileSync('src/components/LCACircularEconomy.tsx', data, 'utf8');
