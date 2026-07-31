const fs = require('fs');
const content = fs.readFileSync('src/data/polymersData.ts', 'utf8');

// Match any { ..., sourceId: ... }
const regex = /\{([^}]+sourceId[^}]+)\}/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const inner = match[1];
  if (!inner.includes('value:')) {
    console.log("MISSING VALUE:", match[0]);
  }
}
console.log("Done checking missing values.");
