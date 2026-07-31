const fs = require('fs');

const p = './src/components/StateSimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

// Center thermometer
c = c.replace(/className="flex-col items-center justify-center/g, 'className="flex flex-col items-center justify-center');
// Fix flex-col globally in StateSimulator just in case
c = c.replace(/className="flex-col/g, 'className="flex flex-col');

// Slider color dynamic
c = c.replace(/className="w-full h-2 bg-border-subtle rounded-lg cursor-pointer accent-accent-primary relative z-10"/g,
              'className="w-full h-2 bg-border-subtle rounded-lg cursor-pointer relative z-10" style={{ accentColor: color }}');

// Glassy phase box
c = c.replace(/badgeColor = 'bg-accent-primary text-bg-surface border-blue-500\/30';/g,
              "badgeColor = 'bg-accent-primary/10 border-accent-primary/30';");
// Rubbery phase box
c = c.replace(/badgeColor = 'bg-status-success text-bg-surface border-emerald-500\/30';/g,
              "badgeColor = 'bg-status-success/10 border-status-success/30';");
// Melt phase box
c = c.replace(/badgeColor = 'bg-status-warning text-bg-surface border-amber-500\/30';/g,
              "badgeColor = 'bg-status-warning/10 border-status-warning/30';");
// Degradation phase box
c = c.replace(/badgeColor = 'bg-rose-500\/10 text-status-error border-rose-500\/30';/g,
              "badgeColor = 'bg-status-error/10 border-status-error/30';");

// And make the active phase box text color better
c = c.replace(/<div className={`p-5 rounded-xl border \$\{badgeColor\} bg-bg-base shadow-sm transition-all mt-4`}>/g,
              '<div className={`p-5 rounded-xl border ${badgeColor} shadow-sm transition-all mt-4`}>');

fs.writeFileSync(p, c, 'utf8');
