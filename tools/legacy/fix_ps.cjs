const fs = require('fs');
let content = fs.readFileSync('src/components/MolecularViewer3D.tsx', 'utf8');

const oldPSRepeating = `        return {
          title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌استایرن (PS)',
          formula: '—[ CH₂ — CH(C₆H₅) ]ₙ—',
          unitWidth: 3.0,
          atoms: [
            { element: 'C', x: -1.50, y: 0.00, z: 0 },
            { element: 'C', x: 0.00, y: 0.00, z: 0 },
            { element: 'H', x: -1.50, y: -0.5, z: -0.8 },
            { element: 'H', x: -1.50, y: -0.5, z: 0.8 },
            { element: 'H', x: 0.00, y: -0.8, z: 0 },
            { element: 'C', x: 0.73, y: 0.19, z: 1.0 },
            { element: 'C', x: 2.06, y: 0.19, z: 1.0 },
            { element: 'C', x: 2.78, y: 1.45, z: 1.0 },
            { element: 'C', x: 2.12, y: 2.60, z: 1.0 },
            { element: 'C', x: 0.67, y: 2.60, z: 1.0 },
            { element: 'C', x: 0.00, y: 1.45, z: 1.0 },
            { element: 'H', x: 0.3, y: -0.6, z: 1.0 },
            { element: 'H', x: 2.4, y: -0.6, z: 1.0 },
            { element: 'H', x: 3.7, y: 1.45, z: 1.0 },
            { element: 'H', x: 2.5, y: 3.4, z: 1.0 },
            { element: 'H', x: 0.3, y: 3.4, z: 1.0 }
          ]
        };`;

const newPSRepeating = `        return {
          title: 'زنجیر پلیمری و واحد تکرارشونده پلی‌استایرن (PS)',
          formula: '—[ CH₂ — CH(C₆H₅) ]ₙ—',
          unitWidth: 2.54,
          atoms: [
            { element: 'C', x: -1.27, y: -0.4, z: 0 },
            { element: 'C', x: 0, y: 0.4, z: 0 },
            { element: 'H', x: -1.27, y: -1.0, z: 0.89 },
            { element: 'H', x: -1.27, y: -1.0, z: -0.89 },
            { element: 'H', x: 0, y: 1.0, z: -0.89 },
            { element: 'C', x: 0, y: 1.4, z: 1.0 },
            { element: 'C', x: 1.34, y: 1.4, z: 1.0 },
            { element: 'C', x: 2.07, y: 2.29, z: 1.89 },
            { element: 'C', x: 1.4, y: 3.11, z: 2.71 },
            { element: 'C', x: -0.06, y: 3.11, z: 2.71 },
            { element: 'C', x: -0.73, y: 2.29, z: 1.89 },
            { element: 'H', x: 1.86, y: 0.73, z: 0.33 },
            { element: 'H', x: 3.15, y: 2.31, z: 1.91 },
            { element: 'H', x: 1.96, y: 3.77, z: 3.37 },
            { element: 'H', x: -0.62, y: 3.77, z: 3.37 },
            { element: 'H', x: -1.81, y: 2.31, z: 1.91 }
          ]
        };`;

content = content.replace(oldPSRepeating, newPSRepeating);
fs.writeFileSync('src/components/MolecularViewer3D.tsx', content);
