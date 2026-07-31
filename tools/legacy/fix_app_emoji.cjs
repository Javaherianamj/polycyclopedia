const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// import Lightbulb if not already imported
if (!content.includes('Lightbulb,')) {
    content = content.replace('FileText,', 'Lightbulb,\n  FileText,');
}

content = content.replace(
    /<span className="text-blue-500">💡<\/span> تحلیل رفتار مکانیکی/g,
    '<Lightbulb className="w-5 h-5 text-amber-500" /> تحلیل رفتار مکانیکی'
);

fs.writeFileSync('src/App.tsx', content);
