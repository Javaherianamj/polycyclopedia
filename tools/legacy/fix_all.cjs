const fs = require('fs');

const formatHelperStr = `const formatVal = (v: any) => v?.value !== undefined ? \`\${v.value} \${v.unit}\`.trim() : v;`;

function wrapInFormat(path) {
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;

  // Add formatVal helper if not present
  if (!content.includes('formatVal(')) {
    if (content.includes('export const')) {
      content = content.replace(/(export const [a-zA-Z0-9_]+(: React\.FC<[^>]+>)? = \([^)]*\) => {)/, `$1\n  ${formatHelperStr}\n`);
    } else if (content.includes('export function')) {
      content = content.replace(/(export function [a-zA-Z0-9_]+\([^)]*\) {)/, `$1\n  ${formatHelperStr}\n`);
    }
  }

  // General regex for `{p.xxx.yyy}` where xxx is a category and p could be polymer, activePolymer, currentPolymer, p, p1, p2
  const cats = ['thermal', 'mechanical', 'physical', 'electrical', 'academic', 'processing'];
  
  // replace {obj.cat.key}
  const regex1 = new RegExp(`\\{([a-zA-Z0-9_]+)\\.(${cats.join('|')})\\.([a-zA-Z0-9_]+)\\}`, 'g');
  const newContent1 = content.replace(regex1, (match, obj, cat, key) => {
    // Avoid re-wrapping
    if (content.includes(`{formatVal(${obj}.${cat}.${key})}`)) return match;
    return `{formatVal(${obj}.${cat}.${key})}`;
  });
  if (newContent1 !== content) {
    content = newContent1;
    changed = true;
  }
  
  // replace ${obj.cat.key}
  const regex2 = new RegExp(`\\$\\{([a-zA-Z0-9_]+)\\.(${cats.join('|')})\\.([a-zA-Z0-9_]+)\\}`, 'g');
  const newContent2 = content.replace(regex2, (match, obj, cat, key) => {
    if (content.includes(`\${formatVal(${obj}.${cat}.${key})}`)) return match;
    return `\${formatVal(${obj}.${cat}.${key})}`;
  });
  if (newContent2 !== content) {
    content = newContent2;
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed ' + path);
  }
}

const files = fs.readdirSync('src/components').filter(f => f.endsWith('.tsx')).map(f => 'src/components/' + f);
files.push('src/App.tsx');

files.forEach(wrapInFormat);
console.log('Done');
