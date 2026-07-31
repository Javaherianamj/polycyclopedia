const fs = require('fs');
let p = './src/components/CatalogPage.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/text-sm:text-base/g, 'text-sm sm:text-base');
c = c.replace(/hover:bg-slate-850/g, 'hover:bg-bg-surface/80'); // just remove it or fix it
c = c.replace(/group-hover:text-accent-primary group-hover:text-accent-secondary/g, 'group-hover:text-accent-primary');
c = c.replace(/bg-bg-base hover:bg-bg-base/g, 'bg-bg-base hover:bg-bg-surface');

fs.writeFileSync(p, c, 'utf8');
