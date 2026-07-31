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

  // Strip all `dark:` prefixes globally
  content = content.replace(/\bdark:([a-zA-Z0-9\[\]#-\/:]+)/g, '$1');
  
  // Dedup in case we got hover:bg-bg-surface hover:bg-bg-surface
  content = content.replace(/\b([a-zA-Z0-9\[\]#-\/:]+) \1\b/g, '$1');

  fs.writeFileSync(file, content, 'utf8');
});
