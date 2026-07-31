const fs = require('fs');
const content = fs.readFileSync('src/data/polymersData.ts', 'utf8');
// Compile the file to get the data
// Wait, polymersData.ts has imports?
