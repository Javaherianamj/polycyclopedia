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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Regex deduplicator for repeated identical classes
  content = content.replace(/\b(bg-bg-[a-z]+) \1\b/g, '$1');
  content = content.replace(/\b(text-text-[a-z]+) \1\b/g, '$1');
  content = content.replace(/\b(border-border-[a-z]+) \1\b/g, '$1');
  content = content.replace(/\b(text-accent-[a-z]+) \1\b/g, '$1');
  content = content.replace(/\b(bg-accent-[a-z]+) \1\b/g, '$1');

  // Conflicting classes logic
  // bg-bg-surface bg-bg-base -> bg-bg-surface (it's usually a component, surface is better)
  content = content.replace(/\bbg-bg-surface bg-bg-base\b/g, 'bg-bg-surface');
  content = content.replace(/\bbg-bg-base bg-bg-surface\b/g, 'bg-bg-surface');
  
  // text-text-secondary text-text-primary -> text-text-secondary
  content = content.replace(/\btext-text-secondary text-text-primary\b/g, 'text-text-secondary');
  content = content.replace(/\btext-text-primary text-text-secondary\b/g, 'text-text-secondary');
  
  // Accents conflicts
  content = content.replace(/\btext-accent-primary text-accent-secondary\b/g, 'text-accent-primary');
  content = content.replace(/\btext-accent-secondary text-accent-primary\b/g, 'text-accent-primary');
  
  content = content.replace(/\bbg-accent-primary bg-accent-secondary\b/g, 'bg-accent-primary');
  content = content.replace(/\bbg-accent-secondary bg-accent-primary\b/g, 'bg-accent-primary');
  
  // Clean up multiple spaces
  content = content.replace(/  +/g, ' ');

  fs.writeFileSync(file, content, 'utf8');
});
