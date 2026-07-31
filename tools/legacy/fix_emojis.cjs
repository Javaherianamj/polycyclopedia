const fs = require('fs');

// Fix ProcessingWindowSimulator
let procContent = fs.readFileSync('src/components/ProcessingWindowSimulator.tsx', 'utf8');
if (!procContent.includes('import { Settings, FileText, CheckCircle, AlertTriangle, AlertOctagon } from')) {
    procContent = procContent.replace(/import React/, "import React");
    procContent = procContent.replace(/import \{ PolymerData \} from '\.\.\/types\/polymer';/, "import { PolymerData } from '../types/polymer';\nimport { Settings, FileText, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';");
}
procContent = procContent.replace(/<span>⚙️<\/span>/g, '<Settings className="w-5 h-5 text-slate-500" />');
procContent = procContent.replace(/<span className="text-base">📜<\/span>/g, '<FileText className="w-4 h-4 text-slate-500" />');
procContent = procContent.replace(/statusColor === 'emerald' \? '✅' : statusColor === 'amber' \? '⚠️' : '🚨'/g,
    "statusColor === 'emerald' ? <CheckCircle className=\"w-4 h-4 text-emerald-600\" /> : statusColor === 'amber' ? <AlertTriangle className=\"w-4 h-4 text-amber-600\" /> : <AlertOctagon className=\"w-4 h-4 text-rose-600\" />"
);
fs.writeFileSync('src/components/ProcessingWindowSimulator.tsx', procContent);

// Fix AlloyingSimulator
let alloyContent = fs.readFileSync('src/components/AlloyingSimulator.tsx', 'utf8');
if (!alloyContent.includes('import { FlaskConical, Target } from')) {
    alloyContent = alloyContent.replace(/import \{ PolymerData \} from '\.\.\/types\/polymer';/, "import { PolymerData } from '../types/polymer';\nimport { FlaskConical, Target } from 'lucide-react';");
}
alloyContent = alloyContent.replace(/<span>🧪<\/span>/g, '<FlaskConical className="w-5 h-5 text-indigo-500" />');
alloyContent = alloyContent.replace(/<span className="text-base">🎯<\/span>/g, '<Target className="w-4 h-4 text-slate-500" />');
fs.writeFileSync('src/components/AlloyingSimulator.tsx', alloyContent);

