const fs = require('fs');

const p = './src/components/LCACircularEconomy.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="inline-flex items-center gap-1\.5 bg-status-success text-bg-surface border-status-success px-2\.5 py-0\.5 rounded text-xs font-bold mb-1\.5"/g,
              'className="inline-flex items-center gap-1.5 bg-status-success/10 text-status-success border border-status-success/30 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2"');

c = c.replace(/className="border-t border border-border-subtle pt-2 text-\[11px\] font-bold text-text-secondary en-mono font-mono tabular-nums flex justify-between items-center"/g,
              'className="border-t border-border-subtle pt-2 mt-2 text-[11px] font-bold text-text-secondary flex justify-between items-center"');
              
c = c.replace(/<span className="text-status-success font-extrabold">\{stg.impact\}<\/span>/g,
              '<span className="text-status-success font-extrabold en-mono font-mono tabular-nums">{stg.impact}</span>');
              
fs.writeFileSync(p, c, 'utf8');
