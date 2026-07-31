const fs = require('fs');
let content = fs.readFileSync('src/components/StressStrainChart.tsx', 'utf8');
content = content.replace(/const parseVal = \(str\) => \{/g, "const parseVal = (str: any) => {");
fs.writeFileSync('src/components/StressStrainChart.tsx', content);
