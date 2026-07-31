const fs = require('fs');

const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="w-5 h-5 text-accent-primary"/g, 'className="w-4 h-4 text-accent-primary"');
c = c.replace(/viewBox="0 24"/g, 'viewBox="0 0 24 24"');
c = c.replace(/strokeWidth=\{2\.5\}/g, 'strokeWidth={3}');

fs.writeFileSync(p, c, 'utf8');
