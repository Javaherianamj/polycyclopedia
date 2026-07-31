const fs = require('fs');
let content = fs.readFileSync('src/components/MolecularViewer3D.tsx', 'utf8');

// Replace PS monomer
content = content.replace(/formula: 'CH₂=CH–C₆H₅',[\s\S]*?\]\s*\};\s*\} else \{/m, 
`formula: 'CH₂=CH–C₆H₅',
          unitWidth: 5.0,
          atoms: [
            { element: 'C', x: -1.7, y: -2.0, z: 0 },
            { element: 'C', x: -0.5, y: -1.3, z: 0 },
            { element: 'H', x: -2.6, y: -1.5, z: 0 },
            { element: 'H', x: -1.7, y: -3.1, z: 0 },
            { element: 'H', x: -0.5, y: -0.2, z: 0 },
            // Benzene ring
            { element: 'C', x: 0.7, y: -2.0, z: 0 },
            { element: 'C', x: 1.9, y: -1.3, z: 0 },
            { element: 'C', x: 0.7, y: -3.4, z: 0 },
            { element: 'C', x: 3.1, y: -2.0, z: 0 },
            { element: 'C', x: 1.9, y: -4.1, z: 0 },
            { element: 'C', x: 3.1, y: -3.4, z: 0 },
            { element: 'H', x: 1.9, y: -0.2, z: 0 },
            { element: 'H', x: -0.2, y: -3.9, z: 0 },
            { element: 'H', x: 4.0, y: -1.5, z: 0 },
            { element: 'H', x: 1.9, y: -5.2, z: 0 },
            { element: 'H', x: 4.0, y: -3.9, z: 0 }
          ]
        };
      } else {`
);

// Replace PS chain
content = content.replace(/formula: '—\[ CH₂ — CH\(C₆H₅\) \]ₙ—',[\s\S]*?\]\s*\};\s*\}/m,
`formula: '—[ CH₂ — CH(C₆H₅) ]ₙ—',
          unitWidth: 2.54,
          atoms: [
            // Backbone
            { element: 'C', x: -1.27, y: 0.0, z: 0.0 },
            { element: 'C', x: 0.0, y: 0.7, z: 0.0 },
            { element: 'H', x: -1.27, y: -0.6, z: -0.87 },
            { element: 'H', x: -1.27, y: -0.6, z: 0.87 },
            { element: 'H', x: 0.0, y: 1.3, z: 0.87 },
            // Benzene ring
            { element: 'C', x: 0.0, y: 1.7, z: -1.1 },
            { element: 'C', x: 1.2, y: 2.0, z: -1.8 },
            { element: 'C', x: -1.2, y: 2.3, z: -1.5 },
            { element: 'C', x: 1.2, y: 2.9, z: -2.9 },
            { element: 'C', x: -1.2, y: 3.2, z: -2.6 },
            { element: 'C', x: 0.0, y: 3.5, z: -3.3 },
            { element: 'H', x: 2.1, y: 1.5, z: -1.5 },
            { element: 'H', x: -2.1, y: 2.1, z: -0.9 },
            { element: 'H', x: 2.1, y: 3.1, z: -3.4 },
            { element: 'H', x: -2.1, y: 3.6, z: -2.9 },
            { element: 'H', x: 0.0, y: 4.2, z: -4.2 }
          ]
        };
      }`
);

// Fix PET
content = content.replace(/formula: 'C₈H₆O₄ \+ C₂H₆O₂',[\s\S]*?\]\s*\};\s*\} else \{/m,
`formula: 'C₈H₆O₄ + C₂H₆O₂',
          unitWidth: 10.0,
          atoms: [
            // Terephthalic Acid
            { element: 'C', x: -2.5, y: 0.0, z: 0.0 },
            { element: 'C', x: -1.8, y: 1.2, z: 0.0 },
            { element: 'C', x: -1.8, y: -1.2, z: 0.0 },
            { element: 'C', x: -0.4, y: 1.2, z: 0.0 },
            { element: 'C', x: -0.4, y: -1.2, z: 0.0 },
            { element: 'C', x: 0.3, y: 0.0, z: 0.0 },
            { element: 'H', x: -2.3, y: 2.1, z: 0.0 },
            { element: 'H', x: -2.3, y: -2.1, z: 0.0 },
            { element: 'H', x: 0.1, y: 2.1, z: 0.0 },
            { element: 'H', x: 0.1, y: -2.1, z: 0.0 },
            // Left Acid Group
            { element: 'C', x: -4.0, y: 0.0, z: 0.0 },
            { element: 'O', x: -4.6, y: 1.0, z: 0.0 },
            { element: 'O', x: -4.6, y: -1.1, z: 0.0 },
            { element: 'H', x: -5.5, y: -1.1, z: 0.0 },
            // Right Acid Group
            { element: 'C', x: 1.8, y: 0.0, z: 0.0 },
            { element: 'O', x: 2.4, y: 1.0, z: 0.0 },
            { element: 'O', x: 2.4, y: -1.1, z: 0.0 },
            { element: 'H', x: 3.3, y: -1.1, z: 0.0 },
            // Ethylene Glycol (dx=4.5)
            { element: 'O', x: 5.5, y: 0.5, z: 0.0 },
            { element: 'C', x: 6.5, y: -0.3, z: 0.0 },
            { element: 'C', x: 7.8, y: 0.5, z: 0.0 },
            { element: 'O', x: 8.8, y: -0.3, z: 0.0 },
            { element: 'H', x: 4.7, y: 0.1, z: 0.0 },
            { element: 'H', x: 9.6, y: 0.1, z: 0.0 },
            { element: 'H', x: 6.5, y: -0.9, z: 0.8 },
            { element: 'H', x: 6.5, y: -0.9, z: -0.8 },
            { element: 'H', x: 7.8, y: 1.1, z: 0.8 },
            { element: 'H', x: 7.8, y: 1.1, z: -0.8 }
          ]
        };
      } else {`
);

// Fix PET chain
content = content.replace(/formula: '—\[ OC–C₆H₄–CO–O–CH₂–CH₂–O \]ₙ—',[\s\S]*?\]\s*\};\s*\}/m,
`formula: '—[ OC–C₆H₄–CO–O–CH₂–CH₂–O ]ₙ—',
          unitWidth: 10.8,
          atoms: [
            // Terephthalate Part
            { element: 'C', x: -4.5, y: 0.0, z: 0.0 }, // C=O (left)
            { element: 'O', x: -4.5, y: 1.2, z: 0.0 },
            { element: 'C', x: -3.1, y: -0.4, z: 0.0 }, // Ring start
            { element: 'C', x: -2.3, y: 0.7, z: 0.0 },
            { element: 'C', x: -2.3, y: -1.5, z: 0.0 },
            { element: 'C', x: -0.9, y: 0.7, z: 0.0 },
            { element: 'C', x: -0.9, y: -1.5, z: 0.0 },
            { element: 'C', x: -0.1, y: -0.4, z: 0.0 }, // Ring end
            { element: 'H', x: -2.8, y: 1.6, z: 0.0 },
            { element: 'H', x: -2.8, y: -2.4, z: 0.0 },
            { element: 'H', x: -0.4, y: 1.6, z: 0.0 },
            { element: 'H', x: -0.4, y: -2.4, z: 0.0 },
            { element: 'C', x: 1.3, y: 0.0, z: 0.0 }, // C=O (right)
            { element: 'O', x: 1.3, y: 1.2, z: 0.0 },
            // Ethylene Glycol Part
            { element: 'O', x: 2.3, y: -0.8, z: 0.0 },
            { element: 'C', x: 3.6, y: -0.3, z: 0.0 },
            { element: 'C', x: 4.8, y: -1.0, z: 0.0 },
            { element: 'O', x: 6.0, y: -0.4, z: 0.0 },
            { element: 'H', x: 3.6, y: 0.8, z: 0.0 },
            { element: 'H', x: 3.6, y: -0.8, z: 0.9 },
            { element: 'H', x: 4.8, y: -2.1, z: 0.0 },
            { element: 'H', x: 4.8, y: -0.5, z: 0.9 }
          ]
        };
      }`
);

fs.writeFileSync('src/components/MolecularViewer3D.tsx', content);
