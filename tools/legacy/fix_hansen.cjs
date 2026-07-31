const fs = require('fs');

const p = './src/components/Hansen3DChart.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/color: 'var\(--status-success\)', isPolymer: true, radius: 8/g,
              "color: 'var(--accent-tertiary)', isPolymer: true, radius: 8");

c = c.replace(/className="w-3 h-3 rounded-full border-2 border border-border-subtle" style={{ backgroundColor: 'var\(--status-success\)' }}/g,
              'className="w-3 h-3 rounded-full border-2 border border-border-subtle" style={{ backgroundColor: \'var(--accent-tertiary)\' }}');

c = c.replace(/<span className="text-status-success font-bold">\{polymerCode\} \(فعلی\)<\/span>/g,
              '<span className="text-accent-tertiary font-bold">{polymerCode} (فعلی)</span>');
              
fs.writeFileSync(p, c, 'utf8');
