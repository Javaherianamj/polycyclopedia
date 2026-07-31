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
  c = c.replace(/className="grid-cols/g, 'className="grid grid-cols');
  fs.writeFileSync(file, c, 'utf8');
});
