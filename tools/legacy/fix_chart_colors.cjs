const fs = require('fs');

const m = './src/components/MarketShareChart.tsx';
let c = fs.readFileSync(m, 'utf8');

c = c.replace(/const textColor = 'var\(--text-primary\)';/, 
`const textColor = isDark ? '#EDEDEE' : '#1C1E22';
  const cAccentPrimary = isDark ? '#C9793D' : '#A85F28';
  const cAccentSecondary = isDark ? '#486581' : '#3E5670';
  const cStatusSuccess = isDark ? '#3BA99C' : '#2F8A7F';
  const cStatusWarning = isDark ? '#D9A441' : '#B8842F';
  const cStatusError = isDark ? '#D9605F' : '#C24B4A';
  const cTextSecondary = isDark ? '#9A9DA5' : '#6B6E76';
  const cBgBase = isDark ? '#15171B' : '#F6F2E7';
`);

c = c.replace(/backgroundColor: \['var\(--accent-primary\)', 'var\(--accent-secondary\)', 'var\(--status-success\)', 'var\(--status-warning\)', 'var\(--status-error\)', 'var\(--text-secondary\)'\],/,
`backgroundColor: [cAccentPrimary, cAccentSecondary, cStatusSuccess, cStatusWarning, cStatusError, cTextSecondary],`);

c = c.replace(/borderColor: 'var\(--bg-base\)'/, `borderColor: cBgBase`);

fs.writeFileSync(m, c, 'utf8');

const s = './src/components/StressStrainChart.tsx';
let c2 = fs.readFileSync(s, 'utf8');

c2 = c2.replace(/const textColor = 'var\(--text-primary\)';/, 
`const textColor = isDark ? '#EDEDEE' : '#1C1E22';
  const cAccentPrimary = isDark ? '#C9793D' : '#A85F28';
  const cAccentSecondary = isDark ? '#486581' : '#3E5670';
  const cStatusSuccess = isDark ? '#3BA99C' : '#2F8A7F';
  const cStatusWarning = isDark ? '#D9A441' : '#B8842F';
  const cStatusError = isDark ? '#D9605F' : '#C24B4A';
  const cBorderSubtle = isDark ? '#2A2D33' : '#E3DDCE';
`);

c2 = c2.replace(/const gridColor = 'var\(--border-subtle\)';/, `const gridColor = cBorderSubtle;`);
c2 = c2.replace(/borderColor: 'var\(--accent-primary\)'/g, `borderColor: cAccentPrimary`);
c2 = c2.replace(/borderColor: 'var\(--status-success\)'/g, `borderColor: cStatusSuccess`);
c2 = c2.replace(/borderColor: 'var\(--accent-secondary\)'/g, `borderColor: cAccentSecondary`);
c2 = c2.replace(/borderColor: 'var\(--status-warning\)'/g, `borderColor: cStatusWarning`);
c2 = c2.replace(/borderColor: 'var\(--status-error\)'/g, `borderColor: cStatusError`);

fs.writeFileSync(s, c2, 'utf8');
