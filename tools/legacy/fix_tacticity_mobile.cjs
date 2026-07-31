const fs = require('fs');
let content = fs.readFileSync('src/components/TacticitySimulator.tsx', 'utf8');

// add isMobile
if (!content.includes('const [isMobile')) {
  content = content.replace(
    /const \[rings, setRings\] = useState/,
    `const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [rings, setRings] = useState`
  );
  
  if (!content.includes("useEffect")) {
    content = content.replace(/useState(.*?)} from 'react';/, "useState, useEffect$1} from 'react';");
  }
}

content = content.replace(
  /<svg className="w-full h-auto max-h-\[160px\]" viewBox="0 0 580 160" preserveAspectRatio="xMidYMid meet">/g,
  '<svg className="w-full h-auto max-h-[160px]" viewBox={`0 0 ${isMobile ? 380 : 580} 160`} preserveAspectRatio="xMidYMid meet">'
);

content = content.replace(
  /<line x1="20" y1="80" x2="560" y2="80"/g,
  '<line x1="20" y1="80" x2={isMobile ? 360 : 560} y2="80"'
);

content = content.replace(
  /\{rings\.map\(\(direction, idx\) => \{/g,
  '{rings.slice(0, isMobile ? 5 : 8).map((direction, idx) => {'
);

fs.writeFileSync('src/components/TacticitySimulator.tsx', content);
