const fs = require('fs');
const p = './src/components/AlloyingSimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="bg-bg-surface border border-border-subtle p-5 rounded-lg my-6 shadow-xs"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-5 rounded-lg my-6 shadow-sm"');
c = c.replace(/className="bg-bg-surface\/90 border border-border-subtle p-3\.5 rounded-xl text-center"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl text-center shadow-sm"');
fs.writeFileSync(p, c, 'utf8');
