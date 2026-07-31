const fs = require('fs');
let content = fs.readFileSync('src/components/TacticitySimulator.tsx', 'utf8');

// 1. Fix fonts and names in the buttons
content = content.replace(/<span>ایزوتاتیک \(Isotactic\)<\/span>/g, "<span>ایزوتاکتیک (Isotactic)</span>");
content = content.replace(/<span className="en-mono text-\[10px\] bg-teal-700 text-white font-bold px-1.5 py-0.5 rounded">هم‌جهت<\/span>/g, '<span className="text-[10px] bg-teal-700 text-white font-bold px-2 py-0.5 rounded">هم‌جهت</span>');
content = content.replace(/<span className="en-mono text-\[10px\] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">تناوب یکی‌درمیان<\/span>/g, '<span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">تناوب یکی‌درمیان</span>');
content = content.replace(/<span className="en-mono text-\[10px\] bg-slate-500 text-white font-bold px-1.5 py-0.5 rounded">کاملاً تصادفی<\/span>/g, '<span className="text-[10px] bg-slate-500 text-white font-bold px-2 py-0.5 rounded">کاملاً تصادفی</span>');

// 2. Fix the hover scale effect. 
// Change: <g className="transition-transform duration-200 group-hover:scale-110" transform={`translate(${cx}, ${ringY})`}>
// To: <g transform={`translate(${cx}, ${ringY})`}><g style={{ transformOrigin: '0px 0px' }} className="transition-transform duration-200 group-hover:scale-110">
content = content.replace(
  /<g className="transition-transform duration-200 group-hover:scale-110" transform=\{`translate\(\$\{cx\}, \$\{ringY\}\)`\}>/g,
  '<g transform={`translate(${cx}, ${ringY})`}><g style={{ transformOrigin: "0px 0px" }} className="transition-transform duration-200 group-hover:scale-110">'
);
// Now we need to close the extra <g> at the end of that block.
content = content.replace(
  /                    \)}[\s\S]*?                  <\/g>[\s\S]*?                  <text/g,
  `                    )}
                  </g>
                  </g>
                  <text`
);

// 3. Fix horizontal scroll / responsiveness by removing min-w-[620px] and tightening viewBox
content = content.replace(/<svg className="w-full min-w-\[620px\] h-\[160px\]" viewBox="0 0 620 160">/g, '<svg className="w-full h-auto max-h-[160px]" viewBox="0 0 580 160" preserveAspectRatio="xMidYMid meet">');
content = content.replace(/<line x1="20" y1="80" x2="600" y2="80"/g, '<line x1="20" y1="80" x2="560" y2="80"');

// Fix 5 rings instead of 8 on mobile? Actually since we made it responsive, 8 rings will just be smaller on mobile. That is fine!
// But if user wants exactly 5, I can slice it for mobile. I will just rely on viewBox scaling for now which looks better.

fs.writeFileSync('src/components/TacticitySimulator.tsx', content);
