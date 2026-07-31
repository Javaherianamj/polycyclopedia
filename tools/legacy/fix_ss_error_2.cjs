const fs = require('fs');

const s = './src/components/StressStrainChart.tsx';
let c2 = fs.readFileSync(s, 'utf8');

c2 = c2.replace(/const cAccentTertiary = isDark \? '#C9793D' : '#A85F28';/, '');

fs.writeFileSync(s, c2, 'utf8');
