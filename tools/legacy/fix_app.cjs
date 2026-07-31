const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace block backgrounds
content = content.replace(/bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded/g, 'bg-[#f6f3eb] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm');
content = content.replace(/bg-slate-50 dark:bg-slate-950 p-2\.5 rounded border border-slate-200 dark:border-slate-800/g, 'bg-[#f6f3eb] dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm');
content = content.replace(/bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2\.5 rounded/g, 'bg-[#f6f3eb] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-sm');

// Replace labels (text-[11px] text-slate-500)
content = content.replace(/className="text-\[11px\] text-slate-500"/g, 'className="text-[11px] font-bold text-slate-600 dark:text-slate-400"');
content = content.replace(/className="text-\[11px\] text-slate-500 mb-1/g, 'className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1');

// Replace values (en-mono font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100)
content = content.replace(/className="en-mono font-mono tabular-nums text-sm font-bold/g, 'dir="ltr" className="en-mono font-mono tabular-nums text-sm font-black mt-0.5');

// Additional adjustments for specific text colors inside the property blocks
content = content.replace(/text-slate-900 dark:text-slate-100/g, 'text-slate-800 dark:text-slate-200');

fs.writeFileSync('src/App.tsx', content);
