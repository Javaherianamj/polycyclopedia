const fs = require('fs');

['./src/components/MarketShareChart.tsx', './src/components/StressStrainChart.tsx'].forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/className="bg-bg-surface border border-border-subtle rounded-lg p-5 my-6 shadow-xs"/g,
                'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle rounded-lg p-5 my-6 shadow-sm"');
  fs.writeFileSync(p, c, 'utf8');
});
