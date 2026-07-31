const fs = require('fs');

const p = './src/components/DPCalculator.tsx';
let c = fs.readFileSync(p, 'utf8');

// For DPn and PDI texts, change `text-accent-primary` to `text-accent-secondary` for DPn and `text-accent-tertiary` for PDI.
// Actually, it might be simpler to just globally replace text-accent-primary with text-accent-secondary inside the DPn section, and text-accent-tertiary for the PDI section.
// Or I can just use a regex replace for specific strings.
c = c.replace(/<span className="en-mono font-bold text-accent-primary font-mono tabular-nums">DP<sub>n<\/sub><\/span>/g,
              '<span className="en-mono font-bold text-accent-secondary font-mono tabular-nums">DP<sub>n</sub></span>');

c = c.replace(/<div className="en-mono font-mono tabular-nums text-lg font-black text-accent-primary mt-1">/g,
              '<div className="en-mono font-mono tabular-nums text-lg font-black text-status-success mt-1">');
              
c = c.replace(/<span className="text-accent-primary">DP<sub>n<\/sub><\/span>/g,
              '<span className="text-accent-secondary">DP<sub>n</sub></span>');
              
c = c.replace(/<span className="border-b-2 border border-border-subtle px-2 pb-0\.5 text-accent-primary font-black leading-none">M<sub>n<\/sub><\/span>/g,
              '<span className="border-b-2 border border-border-subtle px-2 pb-0.5 text-accent-secondary font-black leading-none">M<sub>n</sub></span>');

c = c.replace(/<span className="text-accent-primary">PDI<\/span>/g,
              '<span className="text-accent-tertiary">PDI</span>');
              
c = c.replace(/<span className="px-2 pt-0\.5 text-accent-primary font-bold leading-none">M<sub>n<\/sub><\/span>/g,
              '<span className="px-2 pt-0.5 text-accent-tertiary font-bold leading-none">M<sub>n</sub></span>');
              
fs.writeFileSync(p, c, 'utf8');
