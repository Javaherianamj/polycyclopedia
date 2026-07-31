const fs = require('fs');
let content = fs.readFileSync('src/components/MolecularViewer3D.tsx', 'utf8');

// Replace PS monomer
content = content.replace(/formula: 'CH₂=CH–C₆H₅',[\s\S]*?\]\s*\};\s*\} else \{/m, 
`formula: 'CH₂=CH–C₆H₅',
          unitWidth: 5.0,
          atoms: [
            { element: 'C', x: -4.17, y: 0.04, z: 0 },
            { element: 'C', x: -2.84, y: 0.04, z: 0 },
            { element: 'H', x: -4.8, y: 0.6, z: 0 },
            { element: 'H', x: -4.8, y: -0.6, z: 0 },
            { element: 'H', x: -2.5, y: -0.8, z: 0 },
            { element: 'C', x: -0.66, y: -1.22, z: 0 },
            { element: 'C', x: 0.67, y: -1.22, z: 0 },
            { element: 'C', x: 1.39, y: 0.04, z: 0 },
            { element: 'C', x: 0.73, y: 1.19, z: 0 },
            { element: 'C', x: -0.72, y: 1.19, z: 0 },
            { element: 'C', x: -1.39, y: 0.04, z: 0 },
            { element: 'H', x: -1.1, y: -2.0, z: 0 },
            { element: 'H', x: 1.1, y: -2.0, z: 0 },
            { element: 'H', x: 2.3, y: 0.04, z: 0 },
            { element: 'H', x: 1.1, y: 2.0, z: 0 },
            { element: 'H', x: -1.1, y: 2.0, z: 0 }
          ]
        };
      } else {`
);

// Replace PS chain
content = content.replace(/formula: '—\[ CH₂ — CH\(C₆H₅\) \]ₙ—',[\s\S]*?\]\s*\};\s*\}/m,
`formula: '—[ CH₂ — CH(C₆H₅) ]ₙ—',
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
        };
      }`
);

// Replace PET Monomer
content = content.replace(/formula: 'C₈H₆O₄ \+ C₂H₆O₂',[\s\S]*?\]\s*\};\s*\} else \{/m,
`formula: 'C₈H₆O₄ + C₂H₆O₂',
          unitWidth: 12.0,
          atoms: [
            { element: 'C', x: -0.66, y: -1.22, z: 0 },
            { element: 'C', x: 0.67, y: -1.22, z: 0 },
            { element: 'C', x: 1.39, y: 0.04, z: 0 },
            { element: 'C', x: 0.73, y: 1.19, z: 0 },
            { element: 'C', x: -0.72, y: 1.19, z: 0 },
            { element: 'C', x: -1.39, y: 0.04, z: 0 },
            { element: 'H', x: -1.1, y: -2.0, z: 0 },
            { element: 'H', x: 1.1, y: -2.0, z: 0 },
            { element: 'H', x: 1.1, y: 2.0, z: 0 },
            { element: 'H', x: -1.1, y: 2.0, z: 0 },
            { element: 'C', x: 2.84, y: 0.04, z: 0 },
            { element: 'O', x: 2.84, y: 1.26, z: 0 },
            { element: 'O', x: 4.29, y: 0.04, z: 0 },
            { element: 'H', x: 5.0, y: 0.04, z: 0 },
            { element: 'C', x: -2.84, y: 0.04, z: 0 },
            { element: 'O', x: -2.84, y: 1.26, z: 0 },
            { element: 'O', x: -4.29, y: 0.04, z: 0 },
            { element: 'H', x: -5.0, y: 0.04, z: 0 },
            { element: 'O', x: 6.0, y: 0.04, z: 0 },
            { element: 'C', x: 7.45, y: 0.04, z: 0 },
            { element: 'C', x: 8.90, y: 0.04, z: 0 },
            { element: 'O', x: 10.35, y: 0.04, z: 0 },
            { element: 'H', x: 5.3, y: 0.04, z: 0 },
            { element: 'H', x: 11.05, y: 0.04, z: 0 },
            { element: 'H', x: 7.45, y: 0.8, z: 0.8 },
            { element: 'H', x: 7.45, y: -0.8, z: -0.8 },
            { element: 'H', x: 8.90, y: 0.8, z: -0.8 },
            { element: 'H', x: 8.90, y: -0.8, z: 0.8 }
          ]
        };
      } else {`
);

// Replace PET chain
content = content.replace(/formula: '—\[ OC–C₆H₄–CO–O–CH₂–CH₂–O \]ₙ—',[\s\S]*?\]\s*\};\s*\}/m,
`formula: '—[ OC–C₆H₄–CO–O–CH₂–CH₂–O ]ₙ—',
          unitWidth: 14.64,
          atoms: [
            { element: 'O', x: -4.29, y: 0.04, z: 0 },
            { element: 'C', x: -2.84, y: 0.04, z: 0 },
            { element: 'O', x: -2.84, y: 1.26, z: 0 },
            { element: 'C', x: -1.39, y: 0.04, z: 0 },
            { element: 'C', x: -0.66, y: -1.22, z: 0 },
            { element: 'C', x: 0.67, y: -1.22, z: 0 },
            { element: 'C', x: 1.39, y: 0.04, z: 0 },
            { element: 'C', x: 0.73, y: 1.19, z: 0 },
            { element: 'C', x: -0.72, y: 1.19, z: 0 },
            { element: 'C', x: 2.84, y: 0.04, z: 0 },
            { element: 'O', x: 2.84, y: 1.26, z: 0 },
            { element: 'O', x: 4.29, y: 0.04, z: 0 },
            { element: 'C', x: 5.74, y: 0.04, z: 0 },
            { element: 'C', x: 7.19, y: 0.04, z: 0 },
            { element: 'O', x: 8.64, y: 0.04, z: 0 },
            { element: 'H', x: -1.1, y: -2.0, z: 0 },
            { element: 'H', x: 1.1, y: -2.0, z: 0 },
            { element: 'H', x: 1.1, y: 2.0, z: 0 },
            { element: 'H', x: -1.1, y: 2.0, z: 0 },
            { element: 'H', x: 5.74, y: 0.8, z: 0.8 },
            { element: 'H', x: 5.74, y: -0.8, z: -0.8 },
            { element: 'H', x: 7.19, y: 0.8, z: -0.8 },
            { element: 'H', x: 7.19, y: -0.8, z: 0.8 }
          ]
        };
      }`
);

fs.writeFileSync('src/components/MolecularViewer3D.tsx', content);
