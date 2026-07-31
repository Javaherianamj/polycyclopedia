const fs = require('fs');

const s = './src/components/StressStrainChart.tsx';
let c2 = fs.readFileSync(s, 'utf8');

c2 = c2.replace(/const cAccentTertiary = isDark \? '#8B6691' : '#7A5980';\s*const cAccentTertiary = isDark \? '#8B6691' : '#7A5980';/, 
`const cAccentTertiary = isDark ? '#8B6691' : '#7A5980';`);

fs.writeFileSync(s, c2, 'utf8');
