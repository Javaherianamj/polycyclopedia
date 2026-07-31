const fs = require('fs');
const p = './src/components/AlloyingSimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<div className="bg-status-success border-status-success p-3\.5 rounded-xl text-xs flex items-start gap-2\.5">[\s\S]*?<\/div>\s*<\/div>/,
`<div className="bg-status-success/10 border border-status-success/30 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
        <Target className="w-5 h-5 text-status-success mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-status-success mb-1">کاربردهای صنعتی ویژه (Alloy Application):</div>
          <p className="text-text-primary leading-relaxed text-xs">{applicationTarget}</p>
        </div>
      </div>
    </div>`);

fs.writeFileSync(p, c, 'utf8');
