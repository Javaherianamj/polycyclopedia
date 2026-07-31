const fs = require('fs');

const file = fs.readFileSync('src/data/polymersData.ts', 'utf8');

// Define keys to transform
const keysToTransform = [
  'tg', 'tm', 'enthalpyExp', 'enthalpy100Cryst', 'degradationTemp', 'hdt', 'vicat', 'conductivity', 'cte',
  'tensileStrength', 'youngModulus', 'elongationAtBreak', 'flexuralModulus', 'hardnessShoreD', 'izodImpact',
  'density', 'waterAbsorption', 'refractiveIndex', 'oxygenPermeability', 'co2Permeability',
  'dielectricConstant', 'dielectricStrength', 'volumeResistivity', 'dissipationFactor',
  'mw', 'mn', 'pdi', 'dpRange', 'entanglementMw', 'radiusOfGyration', 'zeroShearViscosity', 'powerLawIndex',
  'solubilityParameter', 'hansenD', 'hansenP', 'hansenH', 'floryHugginsChi', 'ffv', 'persistenceLength',
  'crystallinityRange', 'lamellaThickness', 'spheruliteSize', 'mfi', 'processTemp', 'bur'
];

let newFile = file;

keysToTransform.forEach(key => {
  const regex = new RegExp(`^(\\s+)${key}:\\s*'([^']+)'(,?)$`, 'gm');
  newFile = newFile.replace(regex, (match, indent, stringValue, comma) => {
    // try to split value and unit
    let value = stringValue;
    let unit = '';
    
    // special cases
    if (stringValue.includes('°C')) {
      value = stringValue.replace(' °C', '').replace('°C', '').trim();
      unit = '°C';
    } else if (stringValue.includes('J/g')) {
      value = stringValue.replace(' J/g', '').trim();
      unit = 'J/g';
    } else if (stringValue.includes('W/m·K')) {
      value = stringValue.replace(' W/m·K', '').trim();
      unit = 'W/m·K';
    } else if (stringValue.includes('µm/°C')) {
      value = stringValue.replace(' µm/°C', '').trim();
      unit = 'µm/°C';
    } else if (stringValue.includes('MPa')) {
      value = stringValue.replace(' MPa', '').trim();
      unit = 'MPa';
    } else if (stringValue.includes('GPa')) {
      value = stringValue.replace(' GPa', '').trim();
      unit = 'GPa';
    } else if (stringValue.includes('%')) {
      value = stringValue.replace(' %', '').replace('%', '').trim();
      unit = '%';
    } else if (stringValue.includes('g/cm³')) {
      value = stringValue.replace(' g/cm³', '').trim();
      unit = 'g/cm³';
    } else if (stringValue.includes('J/m')) {
      value = stringValue.replace(' J/m', '').trim();
      unit = 'J/m';
    } else if (stringValue.includes('kV/mm')) {
      value = stringValue.replace(' kV/mm', '').trim();
      unit = 'kV/mm';
    } else if (stringValue.includes('Ω·cm')) {
      value = stringValue.replace(' Ω·cm', '').trim();
      unit = 'Ω·cm';
    } else if (stringValue.includes('g/mol')) {
      value = stringValue.replace(' g/mol', '').trim();
      unit = 'g/mol';
    } else if (stringValue.includes('Pa·s')) {
      value = stringValue.replace(' Pa·s', '').trim();
      unit = 'Pa·s';
    } else if (stringValue.includes('MPa^0.5')) {
      value = stringValue.replace(' MPa^0.5', '').trim();
      unit = 'MPa^0.5';
    } else if (stringValue.includes('Å')) {
      value = stringValue.replace(' Å', '').trim();
      unit = 'Å';
    } else if (stringValue.includes('nm')) {
      value = stringValue.replace(' nm', '').trim();
      unit = 'nm';
    } else if (stringValue.includes('µm')) {
      value = stringValue.replace(' µm', '').trim();
      unit = 'µm';
    } else if (stringValue.includes('g/10min')) {
      value = stringValue.replace(' g/10min', '').trim();
      unit = 'g/10min';
    }
    
    let isNumeric = !isNaN(Number(value));
    let valStr = isNumeric ? Number(value) : `'${value}'`;
    
    return `${indent}${key}: { value: ${valStr}, unit: '${unit}', sourceId: 'src_default' }${comma}`;
  });
});

fs.writeFileSync('src/data/polymersData.ts', newFile, 'utf8');
console.log('Done refactoring data');
