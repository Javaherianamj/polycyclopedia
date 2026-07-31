const fs = require('fs');
let content = fs.readFileSync('src/components/TacticitySimulator.tsx', 'utf8');
content = content.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect } from 'react';");
fs.writeFileSync('src/components/TacticitySimulator.tsx', content);
