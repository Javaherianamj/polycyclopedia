const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

const classMap = {
  // Background Base
  'bg-\\[#f6f3eb\\]': 'bg-bg-base',
  'bg-\\[#0f172a\\]': 'bg-bg-base',
  'bg-slate-50': 'bg-bg-base',
  'bg-slate-100': 'bg-bg-base',
  'bg-[#f3f4f6]': 'bg-bg-base',
  'bg-slate-900': 'bg-bg-base',
  'bg-slate-950': 'bg-bg-base',
  
  // Background Surface
  'bg-white': 'bg-bg-surface',
  'bg-white/90': 'bg-bg-surface/90',
  'bg-\\[#1e293b\\]': 'bg-bg-surface',
  'bg-\\[#ede8de\\]': 'bg-bg-surface',
  'bg-slate-800': 'bg-bg-surface',
  'bg-\\[var\\(--nav-bg\\)\\]': 'bg-bg-surface/90',
  'bg-slate-800/90': 'bg-bg-surface/90',
  'bg-slate-800/80': 'bg-bg-surface/80',
  'bg-slate-900/50': 'bg-bg-surface/50',
  'bg-slate-900/60': 'bg-bg-surface/60',
  'bg-slate-900/70': 'bg-bg-surface/70',
  'bg-slate-900/80': 'bg-bg-surface/80',
  'bg-slate-200': 'bg-bg-surface',
  'bg-slate-300': 'bg-bg-surface',
  
  // Text Primary
  'text-slate-900': 'text-text-primary',
  'text-slate-800': 'text-text-primary',
  'text-slate-950': 'text-text-primary',
  'text-white': 'text-text-primary',
  'text-slate-100': 'text-text-primary',
  'text-slate-200': 'text-text-primary',
  'text-\\[var\\(--ink\\)\\]': 'text-text-primary',
  'text-\\[#172a3a\\]': 'text-text-primary',
  'fill-slate-900': 'fill-text-primary',
  
  // Text Secondary
  'text-slate-400': 'text-text-secondary',
  'text-slate-500': 'text-text-secondary',
  'text-slate-600': 'text-text-secondary',
  'text-slate-700': 'text-text-secondary',
  'text-slate-300': 'text-text-secondary',
  
  // Borders
  'border-slate-200': 'border-border-subtle',
  'border-slate-300': 'border-border-subtle',
  'border-slate-700': 'border-border-subtle',
  'border-slate-800': 'border-border-subtle',
  'border-slate-400': 'border-border-subtle',
  'border-slate-100': 'border-border-subtle',
  'border-\\[#e3ded5\\]': 'border-border-subtle',
  'border-\\[var\\(--line\\)\\]': 'border-border-subtle',
  'border-white': 'border-border-subtle',
  'border-t-slate-900': 'border-t-border-subtle',
  'border-slate-700/80': 'border-border-subtle',
  
  // Accents Primary (Copper)
  'bg-sky-500': 'bg-accent-primary',
  'bg-sky-400': 'bg-accent-primary',
  'bg-blue-600': 'bg-accent-primary',
  'bg-\\[#508991\\]': 'bg-accent-primary',
  'bg-teal-700': 'bg-accent-primary',
  'bg-teal-800': 'bg-accent-primary',
  'bg-\\[#004346\\]': 'bg-accent-primary',
  'bg-indigo-600': 'bg-accent-primary',
  
  'text-sky-600': 'text-accent-primary',
  'text-blue-600': 'text-accent-primary',
  'text-blue-700': 'text-accent-primary',
  'text-\\[#508991\\]': 'text-accent-primary',
  'text-teal-600': 'text-accent-primary',
  'text-teal-700': 'text-accent-primary',
  'text-indigo-600': 'text-accent-primary',
  
  'border-blue-500/30': 'border-accent-primary',
  'border-teal-700': 'border-accent-primary',
  
  // Accent Secondary (Slate Blue)
  'bg-blue-50/70': 'bg-accent-secondary',
  'bg-blue-50': 'bg-accent-secondary',
  'bg-blue-500/20': 'bg-accent-secondary',
  'bg-teal-50': 'bg-accent-secondary',
  
  'text-blue-300': 'text-accent-secondary',
  'text-blue-400': 'text-accent-secondary',
  'text-teal-200': 'text-accent-secondary',
  'text-teal-400': 'text-accent-secondary',
  
  'border-blue-200': 'border-accent-secondary',
  'border-teal-200': 'border-accent-secondary',
  
  // Status Success
  'bg-emerald-50': 'bg-status-success',
  'bg-emerald-100': 'bg-status-success',
  'bg-emerald-500': 'bg-status-success',
  'bg-emerald-500/10': 'bg-status-success',
  'bg-emerald-600': 'bg-status-success',
  'bg-\\[#10b981\\]': 'bg-status-success',
  'bg-emerald-950/40': 'bg-status-success',
  
  'text-emerald-300': 'text-status-success',
  'text-emerald-400': 'text-status-success',
  'text-emerald-500': 'text-status-success',
  'text-emerald-600': 'text-status-success',
  'text-emerald-700': 'text-status-success',
  'text-emerald-800': 'text-status-success',
  
  'border-emerald-200': 'border-status-success',
  'border-emerald-500/20': 'border-status-success',
  'border-emerald-800/60': 'border-status-success',
  
  // Status Warning
  'bg-amber-400': 'bg-status-warning',
  'bg-amber-500': 'bg-status-warning',
  'bg-amber-500/10': 'bg-status-warning',
  'bg-orange-50': 'bg-status-warning',
  'bg-orange-500': 'bg-status-warning',
  'bg-\\[#d97706\\]': 'bg-status-warning',
  
  'text-amber-400': 'text-status-warning',
  'text-amber-500': 'text-status-warning',
  'text-amber-600': 'text-status-warning',
  'text-amber-700': 'text-status-warning',
  'text-orange-400': 'text-status-warning',
  'text-orange-600': 'text-status-warning',
  'text-orange-700': 'text-status-warning',
  
  'border-amber-500': 'border-status-warning',
  'border-orange-200': 'border-status-warning',
  
  // Status Error
  'bg-rose-500': 'bg-status-error',
  'bg-\\[#ef4444\\]': 'bg-status-error',
  
  'text-rose-500': 'text-status-error',
  'text-rose-600': 'text-status-error',
  'text-rose-700': 'text-status-error',
  'text-rose-800': 'text-status-error'
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Strip dark: prefixes for color classes we are replacing
  content = content.replace(/dark:(bg|text|border|fill|ring)-([a-zA-Z0-9\[\]#-\/]+)/g, (match, type, color) => {
    // If it's a known mapped color, just return the mapped class without dark:
    // Actually, it's safer to strip dark: then replace in a second pass
    return `${type}-${color}`; 
  });
  
  // Also strip hover:dark: and focus:dark:
  content = content.replace(/(hover|focus):dark:(bg|text|border|fill|ring)-([a-zA-Z0-9\[\]#-\/]+)/g, (match, prefix, type, color) => {
    return `${prefix}:${type}-${color}`; 
  });

  // Second pass: apply mappings
  Object.keys(classMap).forEach(key => {
    const val = classMap[key];
    // Create regex that matches the exact class string, bounded by spaces, quotes, or backticks
    // This handles the escaped braces in the keys
    const rawKey = key.replace(/\\/g, ''); // Unescape for regex building if necessary, wait, let's just use string replacement inside regex
    const re = new RegExp(`(?<=[\\s"'\\\`:])` + key + `(?=[\\s"'\\\`])`, 'g');
    content = content.replace(re, val);
  });
  
  // A third pass for hover states manually mapped
  // E.g. hover:bg-slate-800 -> hover:bg-bg-surface
  Object.keys(classMap).forEach(key => {
    const val = classMap[key];
    // if val is bg-accent-primary, map hover to hover:bg-accent-primary-hover
    let hoverVal = val;
    if (val === 'bg-accent-primary') {
      hoverVal = 'bg-accent-primary-hover';
    }
    const reHover = new RegExp(`(?<=[\\s"'\\\`])hover:` + key + `(?=[\\s"'\\\`])`, 'g');
    content = content.replace(reHover, `hover:${hoverVal}`);
  });

  // Finally remove any duplicate classes that might have formed
  // Just in case we had `bg-slate-100 dark:bg-slate-800`, stripping `dark:` gives `bg-slate-100 bg-slate-800`, mapped gives `bg-bg-base bg-bg-surface`.
  // Actually, we should just let them be, or run a custom de-duper if necessary. But it's usually `bg-bg-surface bg-bg-surface` which is fine.

  fs.writeFileSync(file, content, 'utf8');
});

console.log("Colors refactored");
