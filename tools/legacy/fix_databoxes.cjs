const fs = require('fs');

const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="bg-bg-surface border border-border-subtle p-3 rounded-xl shadow-sm"/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm"');
              
c = c.replace(/className="bg-bg-surface border border-border-subtle p-2\.5 rounded-xl shadow-sm/g,
              'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-sm');

fs.writeFileSync(p, c, 'utf8');
