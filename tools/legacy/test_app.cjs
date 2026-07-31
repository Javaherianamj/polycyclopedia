const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const keysToTransform = [
  'tg', 'tm', 'enthalpyExp', 'enthalpy100Cryst', 'degradationTemp', 'hdt', 'vicat', 'conductivity', 'cte',
  'tensileStrength', 'youngModulus', 'elongationAtBreak', 'flexuralModulus', 'hardnessShoreD', 'izodImpact',
  'density', 'waterAbsorption', 'refractiveIndex', 'oxygenPermeability', 'co2Permeability',
  'dielectricConstant', 'dielectricStrength', 'volumeResistivity', 'dissipationFactor',
  'mw', 'mn', 'pdi', 'dpRange', 'entanglementMw', 'radiusOfGyration', 'zeroShearViscosity', 'powerLawIndex',
  'solubilityParameter', 'hansenD', 'hansenP', 'hansenH', 'floryHugginsChi', 'ffv', 'persistenceLength',
  'crystallinityRange', 'lamellaThickness', 'spheruliteSize', 'mfi', 'processTemp', 'bur'
];

keysToTransform.forEach(k => {
  const r = new RegExp(`\\{activePolymer\\.[a-zA-Z0-9_]+\\.${k}\\}`, 'g');
  const matches = content.match(r);
  if (matches) {
    console.log(`Found missing formatVal for ${k}:`, matches);
  }
});
