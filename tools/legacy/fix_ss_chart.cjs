const fs = require('fs');

const s = './src/components/StressStrainChart.tsx';
let c2 = fs.readFileSync(s, 'utf8');

c2 = c2.replace(/const cBorderSubtle = isDark \? '#2A2D33' : '#E3DDCE';/, 
`const cBorderSubtle = isDark ? '#2A2D33' : '#E3DDCE';
  const cAccentTertiary = isDark ? '#8B6691' : '#7A5980';`);

c2 = c2.replace(/borderColor: cAccentPrimary, \/\/ purple/g, `borderColor: cAccentTertiary, // purple`);
c2 = c2.replace(/backgroundColor: cAccentPrimary/g, `backgroundColor: cAccentTertiary`);
c2 = c2.replace(/cAccentPrimary/g, `cAccentTertiary`); // just replace all of them just in case
fs.writeFileSync(s, c2, 'utf8');
