const fs = require('fs');

const p = './src/components/StateSimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="p-3\.5 rounded-xl border border-border-subtle bg-bg-base shadow-sm hover:border-accent-primary hover:shadow-md transition-all text-right cursor-pointer group"/g,
              'className="p-3.5 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md shadow-sm hover:border-accent-primary hover:shadow-md transition-all text-right cursor-pointer group"');

c = c.replace(/className="bg-bg-surface border border-border-subtle rounded-lg p-5 my-6 shadow-xs"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle rounded-lg p-5 my-6 shadow-sm"');
              
fs.writeFileSync(p, c, 'utf8');
