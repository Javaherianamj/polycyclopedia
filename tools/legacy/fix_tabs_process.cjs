const fs = require('fs');

const pApp = './src/App.tsx';
let cApp = fs.readFileSync(pApp, 'utf8');

cApp = cApp.replace(/\? 'bg-bg-surface text-accent-secondary shadow-xs border-border-subtle'/g,
                    "? 'bg-accent-secondary/10 border border-accent-secondary/30 text-text-primary shadow-sm'");

fs.writeFileSync(pApp, cApp, 'utf8');

const pProc = './src/components/ProcessingWindowSimulator.tsx';
let cProc = fs.readFileSync(pProc, 'utf8');

// Fix unreadable info banner
cProc = cProc.replace(/className="bg-accent-secondary border-accent-secondary border-accent-secondary p-3\.5 rounded-xl text-xs text-text-secondary mb-5 flex items-start gap-2\.5"/g,
                      'className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl text-xs text-text-primary mb-5 flex items-start gap-2.5 shadow-sm"');

// Fix sliders color and class
cProc = cProc.replace(/className="flex items-center justify-between text-xs font-bold mb-2">\s*<span className="text-text-secondary">دمای مذاب \(Melt Temp\):<\/span>\s*<span className="en-mono font-black text-accent-primary text-sm">\{meltTemp\}°C<\/span>/g,
                      `className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-text-secondary">دمای مذاب (Melt Temp):</span>
            <span className="en-mono font-black text-status-warning text-sm">{meltTemp}°C</span>`);
cProc = cProc.replace(/className="w-full accent-blue-600 cursor-pointer"/g,
                      `className="w-full cursor-pointer" style={{ accentColor: 'var(--status-warning)' }}`);

cProc = cProc.replace(/className="w-full accent-emerald-600 cursor-pointer"/g,
                      `className="w-full cursor-pointer" style={{ accentColor: 'var(--status-success)' }}`);

cProc = cProc.replace(/className="flex items-center justify-between text-xs font-bold mb-2">\s*<span className="text-text-secondary">فشار تزریق\/اکستروژن:<\/span>\s*<span className="en-mono font-black text-accent-primary text-sm">\{pressure\} bar<\/span>/g,
                      `className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-text-secondary">فشار تزریق/اکستروژن:</span>
            <span className="en-mono font-black text-accent-tertiary text-sm">{pressure} bar</span>`);
cProc = cProc.replace(/className="w-full accent-purple-600 cursor-pointer"/g,
                      `className="w-full cursor-pointer" style={{ accentColor: 'var(--accent-tertiary)' }}`);

// Fix defect diagnosis card
cProc = cProc.replace(/\? 'bg-emerald-50\/80 bg-emerald-950\/50 border-emerald-300 border-status-success'/g,
                      "? 'bg-status-success/10 border-status-success/30'");
cProc = cProc.replace(/: statusColor === 'amber'\s*\?\s*'bg-amber-50\/80 bg-amber-950\/50 border-amber-300 border-amber-800'/g,
                      ": statusColor === 'amber' ? 'bg-status-warning/10 border-status-warning/30'");
cProc = cProc.replace(/: 'bg-rose-50\/80 bg-rose-950\/50 border-rose-300 border-rose-800'/g,
                      ": 'bg-status-error/10 border-status-error/30'");

cProc = cProc.replace(/\? 'text-amber-800 text-amber-300'/g, "? 'text-status-warning'");

fs.writeFileSync(pProc, cProc, 'utf8');
