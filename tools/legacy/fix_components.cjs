const fs = require('fs');

const formatHelperStr = `const formatVal = (v: any) => v?.value !== undefined ? \`\${v.value} \${v.unit}\`.trim() : v;`;

function fixFile(path, regexes) {
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;
  
  if (!content.includes('formatVal(')) {
    content = content.replace(/(export const [a-zA-Z0-9]+: React\.FC<[^>]+> = \([^)]+\) => {)/, `$1\n  ${formatHelperStr}\n`);
    // for non-FC components if any
    if (content.indexOf(formatHelperStr) === -1) {
      content = content.replace(/(export function [a-zA-Z0-9]+\([^)]*\) {)/, `$1\n  ${formatHelperStr}\n`);
    }
  }

  regexes.forEach(r => {
    let oldContent = content;
    content = content.replace(r.search, r.replace);
    if (content !== oldContent) changed = true;
  });

  if (changed) {
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Fixed ${path}`);
  }
}

// In StateSimulator.tsx
fixFile('src/components/StateSimulator.tsx', [
  { search: /\{polymer\.thermal\.tg\}/g, replace: '{formatVal(polymer.thermal.tg)}' },
  { search: /\{polymer\.thermal\.tm\}/g, replace: '{formatVal(polymer.thermal.tm)}' },
  { search: /\$\{polymer\.thermal\.tg\}/g, replace: '${formatVal(polymer.thermal.tg)}' },
  { search: /\$\{polymer\.thermal\.tm\}/g, replace: '${formatVal(polymer.thermal.tm)}' }
]);

// In CompareModal.tsx
fixFile('src/components/CompareModal.tsx', [
  { search: /\{p1\.([a-zA-Z]+)\.([a-zA-Z]+)\}/g, replace: '{formatVal(p1.$1.$2)}' },
  { search: /\{p2\.([a-zA-Z]+)\.([a-zA-Z]+)\}/g, replace: '{formatVal(p2.$1.$2)}' },
  { search: /\{p1\.code\}/g, replace: '{p1.code}' },
  { search: /\{p2\.code\}/g, replace: '{p2.code}' },
  { search: /\{p1\.nameFa\}/g, replace: '{p1.nameFa}' },
  { search: /\{p2\.nameFa\}/g, replace: '{p2.nameFa}' },
  // Wait, formatVal handles anything, so {formatVal(p1.code)} is safe, but let's be careful
]);

// In CatalogPage.tsx
fixFile('src/components/CatalogPage.tsx', [
  { search: /\{p\.thermal\.tg\}/g, replace: '{formatVal(p.thermal.tg)}' },
  { search: /\{p\.thermal\.tm\}/g, replace: '{formatVal(p.thermal.tm)}' },
  { search: /\{p\.physical\.density\}/g, replace: '{formatVal(p.physical.density)}' },
  { search: /\{p\.mechanical\.tensileStrength\}/g, replace: '{formatVal(p.mechanical.tensileStrength)}' },
  { search: /\{p\.mechanical\.youngModulus\}/g, replace: '{formatVal(p.mechanical.youngModulus)}' }
]);

console.log("Done fixing components");
