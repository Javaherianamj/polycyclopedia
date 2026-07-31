const fs = require('fs');

function fixFile(p) {
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/text-sm:text-lg/g, 'text-sm sm:text-lg');
  fs.writeFileSync(p, c, 'utf8');
}

fixFile('./src/components/Navbar.tsx');
fixFile('./src/components/StateSimulator.tsx');
