const fs = require('fs');

const p = './src/components/DynamicQuiz.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="text-xs font-bold bg-status-success border-status-success border-status-success px-2\.5 py-1 rounded text-status-success"/g,
              'className="text-xs font-bold bg-status-success/10 border border-status-success/30 px-2.5 py-1 rounded text-status-success"');
              
c = c.replace(/className="text-xs font-bold bg-bg-surface border border-border-subtle px-2\.5 py-1 rounded text-text-secondary"/g,
              'className="text-xs font-bold font-sans bg-bg-surface border border-border-subtle px-2.5 py-1 rounded text-text-primary"');
              
// optionStyle = 'border-emerald-500 bg-status-success bg-emerald-950/50 text-emerald-900 text-status-success font-bold';
c = c.replace(/optionStyle = 'border-emerald-500 bg-status-success bg-emerald-950\/50 text-emerald-900 text-status-success font-bold';/g,
              "optionStyle = 'border-status-success bg-status-success/10 text-status-success font-bold';");

c = c.replace(/badgeStyle = 'bg-status-success text-text-primary';/g,
              "badgeStyle = 'bg-status-success text-bg-surface';");
              
c = c.replace(/optionStyle = 'border-rose-500 bg-rose-50 bg-rose-950\/50 text-rose-900 text-status-error font-bold';/g,
              "optionStyle = 'border-status-error bg-status-error/10 text-status-error font-bold';");

c = c.replace(/badgeStyle = 'bg-status-error text-text-primary';/g,
              "badgeStyle = 'bg-status-error text-bg-surface';");

c = c.replace(/\? 'bg-status-success border-emerald-300 border-status-success text-emerald-900 text-status-success'/g,
              "? 'bg-status-success/10 border-status-success/30 text-status-success'");
              
c = c.replace(/: 'bg-rose-50 bg-rose-950\/60 border-rose-300 border-rose-800 text-rose-900 text-status-error'/g,
              ": 'bg-status-error/10 border-status-error/30 text-status-error'");

// Replace the 'text-emerald-800' and 'text-rose-800' inside the feedback
c = c.replace(/text-emerald-800 text-status-success/g, 'text-status-success text-xs font-medium');
c = c.replace(/text-rose-800 text-status-error/g, 'text-status-error text-xs font-medium');

fs.writeFileSync(p, c, 'utf8');
