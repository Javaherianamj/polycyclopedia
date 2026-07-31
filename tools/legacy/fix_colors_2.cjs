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
  'bg-\\[#374151\\]': 'bg-bg-surface',
  'bg-blue-950/40': 'bg-accent-secondary',
  'bg-blue-950/60': 'bg-accent-secondary',
  'bg-emerald-950/60': 'bg-status-success',
  'bg-emerald-950/80': 'bg-status-success',
  'bg-\\[#f3f4f6\\]': 'bg-bg-base',
  'bg-orange-950/60': 'bg-status-warning',
  'bg-slate-50/50': 'bg-bg-base',
  'bg-slate-700': 'bg-bg-surface',
  'bg-slate-800/50': 'bg-bg-surface/50',
  'bg-slate-800/60': 'bg-bg-surface/60',
  'bg-slate-900/90': 'bg-bg-surface/90',
  'bg-slate-950/40': 'bg-bg-surface',
  'bg-teal-950/60': 'bg-accent-primary',

  'border-blue-800': 'border-accent-secondary',
  'border-blue-900/60': 'border-accent-secondary',
  'border-emerald-800': 'border-status-success',
  'border-orange-800': 'border-status-warning',
  'border-slate-700/50': 'border-border-subtle',
  'border-slate-700/60': 'border-border-subtle',
  'border-teal-800': 'border-accent-primary',
  'border-teal-900': 'border-accent-primary',
  'border-t-slate-800': 'border-t-border-subtle',

  'fill-white': 'fill-text-primary',
  
  'text-\\[#74b3ce\\]': 'text-accent-secondary',
  'text-emerald-200': 'text-status-success',
  'text-indigo-400': 'text-accent-primary',
  'text-indigo-500': 'text-accent-primary',
  'text-orange-300': 'text-status-warning',
  'text-purple-400': 'text-accent-primary',
  'text-purple-600': 'text-accent-primary',
  'text-rose-200': 'text-status-error',
  'text-rose-300': 'text-status-error',
  'text-rose-400': 'text-status-error',
  'text-sky-400': 'text-accent-primary',
  'text-teal-300': 'text-accent-primary',
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Strip dark: prefixes for color classes we are replacing
  content = content.replace(/dark:(bg|text|border|fill|ring)-([a-zA-Z0-9\[\]#-\/]+)/g, (match, type, color) => {
    return `${type}-${color}`; 
  });
  
  content = content.replace(/(hover|focus):dark:(bg|text|border|fill|ring)-([a-zA-Z0-9\[\]#-\/]+)/g, (match, prefix, type, color) => {
    return `${prefix}:${type}-${color}`; 
  });

  // Apply mappings
  Object.keys(classMap).forEach(key => {
    const val = classMap[key];
    const re = new RegExp(`(?<=[\\s"'\\\`:])` + key + `(?=[\\s"'\\\`])`, 'g');
    content = content.replace(re, val);
  });
  
  Object.keys(classMap).forEach(key => {
    const val = classMap[key];
    let hoverVal = val;
    if (val === 'bg-accent-primary') {
      hoverVal = 'bg-accent-primary-hover';
    }
    const reHover = new RegExp(`(?<=[\\s"'\\\`])hover:` + key + `(?=[\\s"'\\\`])`, 'g');
    content = content.replace(reHover, `hover:${hoverVal}`);
  });

  fs.writeFileSync(file, content, 'utf8');
});
