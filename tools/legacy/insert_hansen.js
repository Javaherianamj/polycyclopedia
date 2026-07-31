const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert import
if (!content.includes('Hansen3DChart')) {
  content = content.replace(
    /import \{ Poly/,
    "import { Hansen3DChart } from './components/Hansen3DChart';\nimport { Poly"
  );
  
  // Insert component
  const target = `{formatVal(activePolymer.academic.thermoNotes)}
                      </p>
                    </div>`;
  const replaceWith = `{formatVal(activePolymer.academic.thermoNotes)}
                      </p>

                      <Hansen3DChart 
                        polymerCode={activePolymer.code}
                        d={activePolymer.academic.hansenD?.value || 0}
                        p={activePolymer.academic.hansenP?.value || 0}
                        h={activePolymer.academic.hansenH?.value || 0}
                      />
                    </div>`;
  content = content.replace(target, replaceWith);
  fs.writeFileSync('src/App.tsx', content);
}
