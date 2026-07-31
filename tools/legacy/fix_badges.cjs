const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
  });
  return results;
}

walk('./src').forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Fix badges with same text and bg
  c = c.replace(/text-status-warning bg-status-warning/g, 'text-bg-surface bg-status-warning');
  c = c.replace(/bg-status-warning text-status-warning/g, 'bg-status-warning text-bg-surface');
  
  c = c.replace(/text-status-success bg-status-success/g, 'text-bg-surface bg-status-success');
  c = c.replace(/bg-status-success text-status-success/g, 'bg-status-success text-bg-surface');
  
  c = c.replace(/text-status-error bg-status-error/g, 'text-bg-surface bg-status-error');
  c = c.replace(/bg-status-error text-status-error/g, 'bg-status-error text-bg-surface');
  
  c = c.replace(/text-accent-primary bg-accent-primary/g, 'text-bg-surface bg-accent-primary');
  c = c.replace(/bg-accent-primary text-accent-primary/g, 'bg-accent-primary text-bg-surface');

  c = c.replace(/text-accent-secondary bg-accent-secondary/g, 'text-bg-surface bg-accent-secondary');
  c = c.replace(/bg-accent-secondary text-accent-secondary/g, 'bg-accent-secondary text-bg-surface');

  fs.writeFileSync(file, c, 'utf8');
});
