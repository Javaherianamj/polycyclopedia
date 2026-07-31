const fs = require('fs');
const p = './src/components/LCACircularEconomy.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="bg-bg-base border border-border-subtle p-4 rounded-md mb-5"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-4 rounded-xl shadow-sm mb-5"');

c = c.replace(/className="bg-bg-base border border-border-subtle p-4 rounded-md flex-col justify-between hover:border-emerald-500\/50 transition-all"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-4 rounded-xl shadow-sm flex-col justify-between hover:border-emerald-500/50 transition-all"');

fs.writeFileSync(p, c, 'utf8');
