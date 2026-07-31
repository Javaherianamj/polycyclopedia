const fs = require('fs');

const p = './src/components/StateSimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/\{\/\* Prominent Current State Indicator \*\/\}[\s\S]*?\{\/\* Key Thermal Thresholds Cards \*\/\}/m,
              '</div>\n        {/* Key Thermal Thresholds Cards */}');

fs.writeFileSync(p, c, 'utf8');
