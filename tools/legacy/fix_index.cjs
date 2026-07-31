const fs = require('fs');
let p = './index.html';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/selection:bg-teal-600/g, 'selection:bg-accent-primary');
c = c.replace(/selection:text-white/g, 'selection:text-bg-surface');
fs.writeFileSync(p, c, 'utf8');
