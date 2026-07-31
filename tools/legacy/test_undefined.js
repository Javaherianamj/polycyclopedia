const fs = require('fs');
const file = fs.readFileSync('src/data/polymersData.ts', 'utf8');
const lines = file.split('\n');
lines.forEach((line, i) => {
  if (line.includes('value:') && !line.includes('sourceId:')) {
    console.log(i + 1, line);
  }
  if (line.includes('value: undefined')) {
    console.log("UNDEFINED!", i + 1, line);
  }
});
// let's parse the file!
