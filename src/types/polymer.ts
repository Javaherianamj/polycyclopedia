export interface MarketShareItem {
  label: string;
  percentage: number;
}

export interface SourcedValue {
  value: number | string;
  unit: string;
  sourceId: string;
  note?: string;
}

export interface ProcessingInfo {
  processTemp: SourcedValue; // e.g. "180 - 230 °C"
  mfi: SourcedValue; // e.g. "0.2 - 20 g/10min"
  bur: SourcedValue; // e.g. "2:1 تا 4:1"
  specialNoteTitle?: string;
  specialNoteContent?: string;
  techniques: string[];
}

export interface ThermalProperties {
  tg: SourcedValue; // Glass Transition Temp
  tgValue: number; // Numeric for slider (-110)
  tm: SourcedValue; // Melting Temp
  tmValue: number; // Numeric for slider (110)
  enthalpyExp: SourcedValue; // Experimental Enthalpy
  enthalpy100Cryst: SourcedValue; // 100% Cryst Enthalpy
  degradationTemp: SourcedValue; // Degradation Temp
  degradationValue: number; // Numeric for slider (350)
  hdt: SourcedValue; // Heat Deflection Temp
  vicat: SourcedValue; // Vicat Softening
  conductivity: SourcedValue; // Thermal Conductivity
  cte: SourcedValue; // Coefficient of Thermal Expansion
}

export interface MechanicalProperties {
  tensileStrength: SourcedValue;
  youngModulus: SourcedValue;
  elongationAtBreak: SourcedValue;
  flexuralModulus: SourcedValue;
  hardnessShoreD: SourcedValue;
  izodImpact?: SourcedValue;
  description?: string;
}

export interface PhysicalProperties {
  density: SourcedValue; // e.g. "0.910 - 0.925 g/cm³"
  minDensity: number;
  maxDensity: number;
  waterAbsorption: SourcedValue;
  refractiveIndex: SourcedValue;
  oxygenPermeability: SourcedValue;
  co2Permeability: SourcedValue;
  appearance: string;
}

export interface ChemicalResistanceItem {
  category: string;
  rating: string;
  colorClass: string; // e.g. 'text-status-success'
}

export interface ElectricalProperties {
  dielectricConstant: SourcedValue;
  dielectricStrength: SourcedValue;
  volumeResistivity: SourcedValue;
  dissipationFactor: SourcedValue;
}

export interface MolecularAcademicInfo {
  monomerName: string;
  monomerFormula: string;
  monomerMolarMass: number; // M_0 in g/mol
  repeatingUnit: string;
  crystallinityRange: SourcedValue;
  minCrystallinity: number;
  maxCrystallinity: number;
  unitCell: string; // e.g. "7.4, 4.93, 2.55 Å"
  lamellaThickness: SourcedValue;
  spheruliteSize: SourcedValue;
  mechanism: string;
  reactorTypes: string[];
  kineticNotes: string;
  mw: SourcedValue; // M_w
  mn: SourcedValue; // M_n
  mnDefaultValue: number;
  pdi: SourcedValue;
  dpRange: SourcedValue;
  entanglementMw: SourcedValue;
  radiusOfGyration: SourcedValue;
  zeroShearViscosity: SourcedValue;
  powerLawIndex: SourcedValue;
  rheologyNotes: string;
  solubilityParameter: SourcedValue;
  hansenD: SourcedValue;
  hansenP: SourcedValue;
  hansenH: SourcedValue;
  floryHugginsChi: SourcedValue;
  ffv: SourcedValue; // Fractional Free Volume
  persistenceLength: SourcedValue;
  thermoNotes: string;
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  correct: number;
  fb: string;
}

export interface Atom3D {
  element: 'C' | 'H' | 'O' | 'N' | 'Cl' | 'F';
  x: number;
  y: number;
  z: number;
}

export interface PolymerData {
  id: string; // e.g. 'ldpe', 'hdpe', 'pp', 'pvc', 'pet', 'ps'
  nameFa: string;
  nameEn: string;
  code: string; // e.g. 'LDPE'
  cas: string;
  resinCode: number; // 1, 2, 3, 4, 5, 6, 7
  family: string;
  discoveryYear: string;
  tradeNames: string[];
  iranianManufacturers: string[];
  multinationalManufacturers: string[];
  overviewText: string;
  marketShare: MarketShareItem[];
  applications: string[];
  processing: ProcessingInfo;
  thermal: ThermalProperties;
  mechanical: MechanicalProperties;
  physical: PhysicalProperties;
  chemicalResistance: ChemicalResistanceItem[];
  electrical: ElectricalProperties;
  academic: MolecularAcademicInfo;
  quiz: QuizQuestion[];
  chainType:
    | 'branched_long_short'
    | 'linear_pure'
    | 'isotactic'
    | 'atactic'
    | 'polar_cl'
    | 'aromatic'
    | 'ester';
  atoms3d: Atom3D[];
}
