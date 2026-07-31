const fs = require('fs');

const p = './src/components/TacticitySimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="bg-bg-base border border-border-subtle p-3 rounded"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm"');

fs.writeFileSync(p, c, 'utf8');
