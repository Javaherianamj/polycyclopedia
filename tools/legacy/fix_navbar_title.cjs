const fs = require('fs');

const p = './src/components/Navbar.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/className="flex flex-col">\s*<span className="font-black text-sm sm:text-lg tracking-tight text-text-primary leading-none">\s*Polypedia\s*<\/span>/,
              `className="flex flex-col text-right">
              <span className="font-black text-lg sm:text-2xl tracking-tight text-accent-primary leading-none font-mono en-mono">
                Polypedia
              </span>`);
              
fs.writeFileSync(p, c, 'utf8');
