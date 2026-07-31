const fs = require('fs');

const m = './src/components/MarketShareChart.tsx';
let c = fs.readFileSync(m, 'utf8');

c = c.replace(/const cTextSecondary = isDark \? '#9A9DA5' : '#6B6E76';/, 
`const cTextSecondary = isDark ? '#9A9DA5' : '#6B6E76';
  const cAccentTertiary = isDark ? '#8B6691' : '#7A5980';`);

c = c.replace(/cAccentPrimary, cAccentSecondary/, `cAccentTertiary, cAccentSecondary`);
fs.writeFileSync(m, c, 'utf8');
