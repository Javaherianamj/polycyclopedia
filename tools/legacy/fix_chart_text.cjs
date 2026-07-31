const fs = require('fs');

const m = './src/components/MarketShareChart.tsx';
let c = fs.readFileSync(m, 'utf8');
c = c.replace(/const textColor = isDark \? 'var\(--border-subtle\)' : 'var\(--bg-surface\)';/g, "const textColor = 'var(--text-primary)';");
fs.writeFileSync(m, c, 'utf8');

const s = './src/components/StressStrainChart.tsx';
let c2 = fs.readFileSync(s, 'utf8');
c2 = c2.replace(/const textColor = isDark \? 'var\(--border-subtle\)' : 'var\(--bg-surface\)';/g, "const textColor = 'var(--text-primary)';");
fs.writeFileSync(s, c2, 'utf8');
