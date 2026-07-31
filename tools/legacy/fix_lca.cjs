const fs = require('fs');
let p = './src/components/LCACircularEconomy.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/text-status-success bg-status-success/g, 'text-bg-surface bg-status-success');
c = c.replace(/text-\[11px\]/g, 'text-xs');
c = c.replace(/text-\[10px\]/g, 'text-[11px]');
fs.writeFileSync(p, c, 'utf8');
