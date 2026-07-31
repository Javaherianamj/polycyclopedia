const fs = require('fs');

let data = fs.readFileSync('src/data/polymersData.ts', 'utf8');

// We want to replace `{ value: 'some value (some persian note)', unit: '...' }` 
// with `{ value: 'some value', note: 'some persian note', unit: '...' }`

const regex = /value:\s*'([^']+)\s*\(([^)]+)\)'/g;

data = data.replace(regex, (match, p1, p2) => {
  return `value: '${p1.trim()}', note: '${p2.trim()}'`;
});

fs.writeFileSync('src/data/polymersData.ts', data, 'utf8');
