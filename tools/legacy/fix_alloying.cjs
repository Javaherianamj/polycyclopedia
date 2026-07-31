const fs = require('fs');

const p = './src/components/AlloyingSimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="bg-gradient-to-br from-slate-900 to-slate-800 border border-border-subtle text-text-primary rounded-2xl p-6 my-6 shadow-lg"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle rounded-lg p-5 my-6 shadow-sm"');

c = c.replace(/className="inline-flex items-center gap-1\.5 bg-accent-secondary text-bg-surface border-accent-primary px-3 py-1 rounded-full text-xs font-bold mb-2"/g,
              'className="inline-flex items-center gap-1.5 bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary px-3 py-1 rounded-full text-[11px] font-bold mb-3"');
              
fs.writeFileSync(p, c, 'utf8');
