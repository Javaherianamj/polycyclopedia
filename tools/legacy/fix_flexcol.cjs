const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/className="flex-col /g, 'className="flex flex-col ');
    newContent = newContent.replace(/className="flex-col"/g, 'className="flex flex-col"');
    newContent = newContent.replace(/className={`flex-col /g, 'className={`flex flex-col ');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
});
