# API Documentation

## REST APIs

**None exist.** This is a 100% static, client-side single-page application with no backend, no server process, and no network calls for data of any kind (verified: no `fetch(`, `axios`, `XMLHttpRequest`, or API client code anywhere in `src/`). There is nothing to document under a REST/GraphQL/RPC heading.

## Internal Data-Access Pattern

Because there is no API, "data access" in this codebase means: **direct, synchronous, static ES-module import of an in-repo TypeScript constant.**

```ts
// src/App.tsx
import { polymersData } from './data/polymersData';
...
const activePolymer: PolymerData | undefined = polymersData.find((p) => p.id === selectedPolymerId);
```

- `polymersData` (`src/data/polymersData.ts`) is a single exported `const polymersData: PolymerData[]` containing exactly 6 records. It is bundled into the JS at build time — there is no lazy-loading, pagination, or partial-fetch of this dataset; the entire 1278-line source file becomes part of the initial bundle (minus dead-code elimination, which does not apply since every record is used).
- Lookups are plain `Array.prototype.find`/`.filter` calls scattered across `App.tsx`, `CatalogPage.tsx`, `CompareModal.tsx`, `PolymerCombobox.tsx`, and `Navbar.tsx` — there is no single repository/data-access module; each component that needs a lookup either receives the full `polymersData` array as a prop (from `App.tsx`) or (for `App.tsx` itself) imports it directly.
- There is no caching layer, no request/response cycle, and no error/loading state anywhere in the app, because nothing is ever fetched.
- This is the seam that a future real backend (per the project's own roadmap, referenced in `aidlc-docs/audit.md`) would need to replace with an actual data-access/repository layer and asynchronous loading states.

## Data Models

All models are defined in `src/types/polymer.ts` (144 lines, TypeScript interfaces only — no runtime validation/schema library is used, so these types are erased at build time and never checked against the actual data at runtime).

### `SourcedValue` — the universal "cited value" wrapper

- **Fields**:
  - `value: number | string` — the actual measurement. In practice, almost always a formatted display string (e.g. `'0.910 - 0.925'`, `'~ 1.51'`, `'< 0.01'`), not a structured number — see `code-quality-assessment.md`.
  - `unit: string` — e.g. `'°C'`, `'g/10min'`, `'MPa'`. Can be empty string for dimensionless quantities.
  - `sourceId: string` — intended citation/provenance key. **In the current dataset this is always the literal placeholder `'src_default'`** (269 of 269 occurrences).
  - `note?: string` — optional free-text annotation rendered under the value.
- **Relationships**: Used as the type of nearly every leaf property across `ProcessingInfo`, `ThermalProperties`, `MechanicalProperties`, `PhysicalProperties`, `ElectricalProperties`, and `MolecularAcademicInfo`.
- **Validation**: None at runtime. `src/components/SourcedValue.tsx` defensively checks `v?.value === undefined` before rendering, but nothing validates `unit`/`sourceId` shape or content.

### `MarketShareItem`

- **Fields**: `label: string`, `percentage: number`.
- **Relationships**: Array member of `PolymerData.marketShare[]`; percentages are not validated to sum to 100.

### `ProcessingInfo`

- **Fields**: `processTemp: SourcedValue`, `mfi: SourcedValue`, `bur: SourcedValue`, `specialNoteTitle?: string`, `specialNoteContent?: string`, `techniques: string[]`.
- **Relationships**: Nested under `PolymerData.processing`.

### `ThermalProperties`

- **Fields**: `tg: SourcedValue` + shadow `tgValue: number`; `tm: SourcedValue` + shadow `tmValue: number`; `enthalpyExp: SourcedValue`; `enthalpy100Cryst: SourcedValue`; `degradationTemp: SourcedValue` + shadow `degradationValue: number`; `hdt: SourcedValue`; `vicat: SourcedValue`; `conductivity: SourcedValue`; `cte: SourcedValue`.
- **Relationships**: Nested under `PolymerData.thermal`. The three "shadow" numeric fields (`tgValue`, `tmValue`, `degradationValue`) exist purely so `StateSimulator.tsx` has real numbers for its slider bounds — they duplicate, and can drift from, the corresponding `SourcedValue.value` string.
- **Validation**: None — nothing enforces `tgValue` matching `tg.value`.

### `MechanicalProperties`

- **Fields**: `tensileStrength: SourcedValue`, `youngModulus: SourcedValue`, `elongationAtBreak: SourcedValue`, `flexuralModulus: SourcedValue`, `hardnessShoreD: SourcedValue`, `izodImpact?: SourcedValue`, `description?: string`.
- **Relationships**: Nested under `PolymerData.mechanical`; `StressStrainChart.tsx` parses `tensileStrength`/`elongationAtBreak`/`youngModulus` strings back out with regex + `parseFloat` to build its chart series.

### `PhysicalProperties`

- **Fields**: `density: SourcedValue` + shadow `minDensity: number` / `maxDensity: number`; `waterAbsorption: SourcedValue`; `refractiveIndex: SourcedValue`; `oxygenPermeability: SourcedValue`; `co2Permeability: SourcedValue`; `appearance: string`.
- **Relationships**: Nested under `PolymerData.physical`.

### `ChemicalResistanceItem`

- **Fields**: `category: string`, `rating: string`, `colorClass: string` (a literal Tailwind CSS class name, e.g. `'text-status-success'`).
- **Relationships**: Array member of `PolymerData.chemicalResistance[]`. `colorClass` is a presentation concern stored directly in the data model (see `code-structure.md` anti-patterns).

### `ElectricalProperties`

- **Fields**: `dielectricConstant: SourcedValue`, `dielectricStrength: SourcedValue`, `volumeResistivity: SourcedValue`, `dissipationFactor: SourcedValue`.
- **Relationships**: Nested under `PolymerData.electrical`.

### `MolecularAcademicInfo` — the largest and most detailed block

- **Fields**: `monomerName: string`, `monomerFormula: string`, `monomerMolarMass: number`, `repeatingUnit: string`, `crystallinityRange: SourcedValue` + shadow `minCrystallinity: number`/`maxCrystallinity: number`, `unitCell: string`, `lamellaThickness: SourcedValue`, `spheruliteSize: SourcedValue`, `mechanism: string`, `reactorTypes: string[]`, `kineticNotes: string`, `mw: SourcedValue`, `mn: SourcedValue` + shadow `mnDefaultValue: number`, `pdi: SourcedValue`, `dpRange: SourcedValue`, `entanglementMw: SourcedValue`, `radiusOfGyration: SourcedValue`, `zeroShearViscosity: SourcedValue`, `powerLawIndex: SourcedValue`, `rheologyNotes: string`, `solubilityParameter: SourcedValue`, `hansenD: SourcedValue`, `hansenP: SourcedValue`, `hansenH: SourcedValue`, `floryHugginsChi: SourcedValue`, `ffv: SourcedValue`, `persistenceLength: SourcedValue`, `thermoNotes: string`.
- **Relationships**: Nested under `PolymerData.academic`. `mnDefaultValue` seeds `DPCalculator.tsx`'s initial input; `hansenD`/`hansenP`/`hansenH` feed `Hansen3DChart.tsx`. Note: `persistenceLength` is defined in the type and populated in the data, but is **not rendered anywhere in the UI** (not referenced by any `.tsx` file outside the type/data definitions).

### `QuizQuestion`

- **Fields**: `q: string`, `opts: string[]`, `correct: number` (index into `opts`), `fb: string` (feedback shown after answering).
- **Relationships**: Array member of `PolymerData.quiz[]`, consumed by `DynamicQuiz.tsx`.

### `Atom3D`

- **Fields**: `element: 'C' | 'H' | 'O' | 'N' | 'Cl' | 'F'`, `x: number`, `y: number`, `z: number`.
- **Relationships**: Array member of `PolymerData.atoms3d[]`, consumed by `MolecularViewer3D.tsx`. In practice `MolecularViewer3D.tsx` also has its own internal `getBaseAtoms()` geometry generator, so it is not strictly dependent on this array for every view mode.

### `PolymerData` — the root record

- **Fields**: `id: string` (e.g. `'ldpe'`), `nameFa: string`, `nameEn: string`, `code: string` (e.g. `'LDPE'`), `cas: string`, `resinCode: number` (1-7 SPI code), `family: string` (free-text, not an enum/taxonomy), `discoveryYear: string`, `tradeNames: string[]`, `iranianManufacturers: string[]`, `multinationalManufacturers: string[]`, `overviewText: string`, `marketShare: MarketShareItem[]`, `applications: string[]`, `processing: ProcessingInfo`, `thermal: ThermalProperties`, `mechanical: MechanicalProperties`, `physical: PhysicalProperties`, `chemicalResistance: ChemicalResistanceItem[]`, `electrical: ElectricalProperties`, `academic: MolecularAcademicInfo`, `quiz: QuizQuestion[]`, `chainType: 'branched_long_short' | 'linear_pure' | 'isotactic' | 'atactic' | 'polar_cl' | 'aromatic' | 'ester'`, `atoms3d: Atom3D[]`.
- **Relationships**: Root of the entire data model; the sole element type of the `polymersData` array.
- **Validation**: None at runtime. TypeScript's structural typing only guarantees the shape at compile time for whoever hand-authors a new record in `polymersData.ts`; a malformed literal (as happened with `thermal.cte`'s split unit, see `code-structure.md`) still type-checks as long as the field is _some_ string.

## Component Prop Interfaces (the closest analogue to an "internal API" surface)

Every feature component in `src/components/` exposes a typed `Props` interface as its effective contract with `App.tsx`. Representative examples (full list in `component-inventory.md`):

- `CatalogPageProps` — `{ polymers: PolymerData[]; onSelectPolymer: (id: string) => void; onOpenResources?: () => void; initialFamily?: string }`
- `CompareModalProps` — `{ polymers: PolymerData[]; onClose: () => void }`
- `NavbarProps` — `{ polymers, selectedPolymerId, onSelectPolymer, onGoToCatalog, onToggleCompare, onOpenResources, isDark, onToggleTheme }`
- `StateSimulatorProps` / `BranchingSimulatorProps` / `TacticitySimulatorProps` / `AlloyingSimulatorProps` / `ProcessingWindowSimulatorProps` / `LCACircularEconomyProps` / `DPCalculatorProps` — all `{ polymer: PolymerData }`
- `DynamicQuizProps` — `{ questions: QuizQuestion[]; polymerCode: string }`
- `MolecularViewer3DProps` — `{ atoms?: Atom3D[]; monomerName: string; polymerCode: string; isDark: boolean }`

These are compile-time-only contracts (React props), not a network-serializable API — listed here because the reverse-engineering template calls for "Internal APIs" and this is the nearest equivalent in a backend-less codebase.
