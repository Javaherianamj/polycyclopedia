const fs = require('fs');

const chainAtoms = [
  { element: 'C', x: -1.9, y: -0.4, z: 0 },
  { element: 'C', x: 0, y: 0.4, z: 0 },
  { element: 'H', x: -1.9, y: -1, z: 0.89 },
  { element: 'H', x: -1.9, y: -1, z: -0.89 },
  { element: 'H', x: 0, y: 1, z: -0.89 },
  { element: 'C', x: 0, y: 1.4, z: 1 },
  { element: 'C', x: 1.16, y: 1.87, z: 1.47 },
  { element: 'H', x: 1.99, y: 1.51, z: 1.11 },
  { element: 'C', x: 1.21, y: 2.88, z: 2.48 },
  { element: 'H', x: 2.08, y: 3.24, z: 2.84 },
  { element: 'C', x: 0.05, y: 3.36, z: 2.96 },
  { element: 'H', x: 0.09, y: 4.05, z: 3.65 },
  { element: 'C', x: -1.21, y: 2.88, z: 2.48 },
  { element: 'H', x: -2.08, y: 3.24, z: 2.84 },
  { element: 'C', x: -1.21, y: 1.94, z: 1.54 },
  { element: 'H', x: -2.08, y: 1.61, z: 1.21 }
];

const monomerAtoms = [
  { element: 'C', x: -1, y: 0, z: 0 },
  { element: 'C', x: 0.34, y: 0, z: 0 },
  { element: 'H', x: -1.59, y: 0.94, z: 0 },
  { element: 'H', x: -1.59, y: -0.94, z: 0 },
  { element: 'H', x: 0.89, y: -0.94, z: 0 },
  { element: 'C', x: 1.07, y: 1.26, z: 0 },
  { element: 'C', x: 0.4, y: 2.42, z: 0 },
  { element: 'H', x: -0.58, y: 2.38, z: 0 },
  { element: 'C', x: 1.07, y: 3.68, z: 0 },
  { element: 'H', x: 0.57, y: 4.55, z: 0 },
  { element: 'C', x: 2.41, y: 3.68, "z": 0 },
  { element: 'H', x: 2.86, y: 4.55, z: 0 },
  { element: 'C', x: 3.16, y: 2.47, z: 0 },
  { element: 'H', x: 4.16, y: 2.47, z: 0 },
  { element: 'C', "x": 2.49, "y": 1.31, z: 0 },
  { element: 'H', x: 3.02, y: 0.48, z: 0 }
];

let mv = fs.readFileSync('src/components/MolecularViewer3D.tsx', 'utf8');

// Replace chain atoms
mv = mv.replace(
  /title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌استایرن \(PS\)',[\s\S]*?unitWidth: [\d.]+,[\s\S]*?atoms: \[[\s\S]*?\]/,
  `title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌استایرن (PS)',
          formula: '—[ CH₂ — CH(C₆H₅) ]ₙ—',
          unitWidth: 3.81,
          atoms: ${JSON.stringify(chainAtoms).replace(/"([^"]+)":/g, '$1:').replace(/\{/g, '{ ').replace(/\}/g, ' }')}`
);

// Replace monomer atoms
mv = mv.replace(
  /title: 'مونومر استایرن \(Styrene Monomer\)',[\s\S]*?unitWidth: [\d.]+,[\s\S]*?atoms: \[[\s\S]*?\]/,
  `title: 'مونومر استایرن (Styrene Monomer)',
          formula: 'CH₂=CH–C₆H₅',
          unitWidth: 5.0,
          atoms: ${JSON.stringify(monomerAtoms).replace(/"([^"]+)":/g, '$1:').replace(/\{/g, '{ ').replace(/\}/g, ' }')}`
);

fs.writeFileSync('src/components/MolecularViewer3D.tsx', mv);

let pd = fs.readFileSync('src/data/polymersData.ts', 'utf8');

pd = pd.replace(
  /id: 'ps',[\s\S]*?atoms3d: \[[\s\S]*?\]/m,
  (match) => {
    return match.replace(/atoms3d: \[[\s\S]*?\]/, `atoms3d: ${JSON.stringify(monomerAtoms, null, 6).replace(/"([^"]+)":/g, '$1:')}`);
  }
);

fs.writeFileSync('src/data/polymersData.ts', pd);

console.log('Fixed PS atoms.');
