const fs = require('fs');

let file = fs.readFileSync('src/types/polymer.ts', 'utf8');

file = file.replace('export interface ProcessingInfo {', `export interface SourcedValue {
  value: number | string;
  unit: string;
  sourceId: string;
}

export interface ProcessingInfo {`);

const keysToTransform = [
  'tg', 'tm', 'enthalpyExp', 'enthalpy100Cryst', 'degradationTemp', 'hdt', 'vicat', 'conductivity', 'cte',
  'tensileStrength', 'youngModulus', 'elongationAtBreak', 'flexuralModulus', 'hardnessShoreD', 'izodImpact',
  'density', 'waterAbsorption', 'refractiveIndex', 'oxygenPermeability', 'co2Permeability',
  'dielectricConstant', 'dielectricStrength', 'volumeResistivity', 'dissipationFactor',
  'mw', 'mn', 'pdi', 'dpRange', 'entanglementMw', 'radiusOfGyration', 'zeroShearViscosity', 'powerLawIndex',
  'solubilityParameter', 'hansenD', 'hansenP', 'hansenH', 'floryHugginsChi', 'ffv', 'persistenceLength',
  'crystallinityRange', 'lamellaThickness', 'spheruliteSize', 'mfi', 'processTemp', 'bur'
];

keysToTransform.forEach(key => {
  const regex1 = new RegExp(`\\s+${key}:\\s*string;`, 'g');
  file = file.replace(regex1, `\n  ${key}: SourcedValue;`);
  
  const regex2 = new RegExp(`\\s+${key}\\?:\\s*string;`, 'g');
  file = file.replace(regex2, `\n  ${key}?: SourcedValue;`);
});

fs.writeFileSync('src/types/polymer.ts', file, 'utf8');
console.log('Fixed types');
