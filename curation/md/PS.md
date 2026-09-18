# Polymer Data Extraction: Polystyrene (PS)

---

## Phase 1: Core Material Extraction & Ingestion CSV

The standard 16-column baseline CSV dataset for **Polystyrene (PS / GPPS)** is formatted for direct Polypedia ingestion via `import_values.py`:

```csv
polymer_slug,grade,property_group,property_key,value_num,value_min,value_max,unit,original_value,original_unit,test_standard,test_condition,source_title,source_locator,note_en,verification_status
polystyrene,Styrolution PS 158N,physical,density,1.04,1.04,1.04,g/cm³,1040,kg/m³,ISO 1183,23 °C,INEOS Styrolution PS 158N/L TDS,Page 2 - Other Properties,"Density ISO 1183 kg/m³ 1040",verified
polystyrene,Styrolution PS 158N,mechanical,tensile_strength,55,null,null,MPa,55,MPa,ISO 527,23 °C,INEOS Styrolution PS 158N/L TDS,Page 1 - Mechanical Properties,"Tensile Stress at Yield, 23 °C ISO 527 MPa 55",verified
polystyrene,Styrolution PS 158N,mechanical,young_modulus,3.3,null,null,GPa,3300,MPa,ISO 527,23 °C,INEOS Styrolution PS 158N/L TDS,Page 1 - Mechanical Properties,"Tensile Modulus ISO 527 MPa 3300",verified
polystyrene,Styrolution PS 158N,mechanical,elongation_at_break,3,null,null,%,3,%,ISO 527,23 °C,INEOS Styrolution PS 158N/L TDS,Page 1 - Mechanical Properties,"Tensile Strain at Break, 23 °C ISO 527 % 3",verified
polystyrene,Styrolution PS 158N,mechanical,flexural_modulus,2.05,null,null,GPa,2050,MPa,ISO 178,23 °C,INEOS Styrolution PS 158N/L TDS,Page 1 - Mechanical Properties,"Flexural Modulus ISO 178 MPa 2050",verified
polystyrene,Styrolution PS 158N,thermal,hdt,86,null,null,°C,86,°C,ISO 75,1.8 MPa annealed 4h/80°C,INEOS Styrolution PS 158N/L TDS,Page 1 - Thermal Properties,"Heat Deflection Temperature A; (annealed 4 h/80 °C; 1.8 MPa) ISO 75 °C 86",verified
polystyrene,Styrolution PS 158N,thermal,vicat,101,null,null,°C,101,°C,ISO 306,50 N 50 °C/h (VST/B/50),INEOS Styrolution PS 158N/L TDS,Page 1 - Thermal Properties,"Vicat Softening Temperature VST/B/50 (50N, 50 °C/h) ISO 306 °C 101",verified
polystyrene,Styrolution PS 158N,thermal,conductivity,0.17,null,null,W/m·K,0.17,W/(m·K),DIN 52612-1,23 °C,INEOS Styrolution PS 158N/L TDS,Page 2 - Thermal Properties,"Thermal Conductivity DIN 52612-1 W/(m K) 0.17",verified
polystyrene,Styrolution PS 158N,thermal,cte,80,null,null,µm/°C,80,10^-6/°C,ISO 11359,23 °C to 80 °C,INEOS Styrolution PS 158N/L TDS,Page 2 - Thermal Properties,"Coefficient of Linear Thermal Expansion ISO 11359 10^(-6)/°C 80",verified
polystyrene,Generic aPS,thermal,tg,100,90,105,°C,100,°C,DSC / ISO 11357,10 °C/min,Polymer Handbook (Brandrup & Immergut),Section VI/193,"Atactic polystyrene glass transition temperature range 90-105 °C",verified
polystyrene,Generic aPS,thermal,degradation_temp,274,274,415,°C,274 - 415,°C,TGA,10-25 °C/min N2,Thermal Degradation Kinetics of PS (MDPI / ResearchGate),Table 2 / Section 3,"Range of thermal stability 274–415 °C; main mass loss peak at 415–430 °C",verified
polystyrene,Generic aPS,thermal,specific_heat_capacity,1.22,null,null,kJ/(kg·K),1.22,J/(g·K),DSC,25 °C,Polymer Data Handbook (Mark),Table 1,"Solid state specific heat capacity Cp at 298.15 K is 1.22 kJ/(kg·K)",verified
polystyrene,Styrolution PS 158N,physical,water_absorption,0.1,null,null,%,<0.1,%,ISO 62,23 °C saturation,INEOS Styrolution PS 158N/L TDS,Page 2 - Other Properties,"Water Absorption, Saturated at 23 °C ISO 62 % <0.1",verified
polystyrene,Styrolution PS 158N,physical,refractive_index,1.56,null,null,dimensionless,1.56,dimensionless,ISO 489,Sodium D-line 589 nm 23 °C,INEOS Styrolution PS 158N/L TDS,Page 2 - Optical Properties,"Refractive Index, Sodium D Line ISO 489 - 1.56",verified
polystyrene,Styrolution PS 158N,electrical,dielectric_constant,2.5,null,null,dimensionless,2.5,dimensionless,IEC 60250,100 Hz,INEOS Styrolution PS 158N/L TDS,Page 2 - Electrical Properties,"Dielectric Constant (100 Hz) IEC 60250 - 2.5",verified
polystyrene,Total Polystyrene 1540,electrical,dielectric_strength,135,null,null,kV/mm,135,kV/mm,ASTM D149,23 °C in oil,TotalEnergies GPPS 1540 Datasheet,Page 1 - Electrical Properties,"Dielectric Strength D-149 135 kV/mm",verified
polystyrene,Styrolution PS 158N,electrical,volume_resistivity,1e+18,null,null,Ω·cm,>1E16,Ohm·m,IEC 60093,23 °C,INEOS Styrolution PS 158N/L TDS,Page 2 - Electrical Properties,"Volume Resistivity IEC 60093 Ohm*m >1E16",verified
polystyrene,Styrolution PS 158N,electrical,dissipation_factor,0.00009,null,null,dimensionless,0.9e-4,dimensionless,IEC 60250,100 Hz,INEOS Styrolution PS 158N/L TDS,Page 2 - Electrical Properties,"Dissipation Factor (100 Hz) IEC 60250 10^(-4) 0.9",verified
polystyrene,Styrolution PS 158N,processing,process_temp,230,180,280,°C,180 - 280,°C,ISO 294,Injection molding,INEOS Styrolution PS 158N/L TDS,Page 2 - Processing,"Melt Temperature Range ISO 294 °C 180 - 280",verified
polystyrene,Styrolution PS 158N,processing,mould_temp,40,10,60,°C,40 (range 10 - 60),°C,ISO 294,Injection molding,INEOS Styrolution PS 158N/L TDS,Page 2 - Processing,"Mold Temperature Range ISO 294 °C 40 (10 to 60 °C)",verified
polystyrene,Styrolution PS 158N,processing,mfi,3.4,null,null,g/10min,3.3,cm³/10 min,ISO 1133,200 °C / 5 kg,INEOS Styrolution PS 158N/L TDS,Page 1 - Rheological Properties,"Melt Volume Rate, 200 °C/5 kg ISO 1133 cm³/10 min 3.3",verified
polystyrene,Styrolution PS 158N,processing,injection_pressure,100,70,140,MPa,700 - 1400,bar,Internal standard,Injection molding,INEOS Styrolution Processing Guide,Page 2,"Standard injection pressure range 700 to 1400 bar",verified
polystyrene,Generic aPS,academic,monomer_name,null,null,null,null,Styrene (Ethenylbenzene),null,IUPAC / CAS,CAS 100-42-5,PubChem CID 7501,Section 1,"Styrene monomer C8H8 (CAS 100-42-5)",verified

```

---

## Phase 2: Source Manifest & File Corpus

| # | Document Title & Publisher | Source Type | Coverage Domain | Direct Access Link / Identifier |
| --- | --- | --- | --- | --- |
| **S1** | [INEOS Styrolution PS 158N/L Technical Data Sheet](https://www.macplast.eu/wp-content/uploads/documenti/st/styrolution%20ps%20158n.pdf) | Official Manufacturer TDS | Mechanical, Thermal, Electrical, Optical, Rheological, Physical | Direct PDF Link |
| **S2** | [TotalEnergies Polystyrene Crystal 1540 Material Datasheet](https://hongrunplastics.com/public/uploads/images/20250612/TotalEnergies%20GPPS%201540.pdf) | Official Manufacturer TDS | High-Flow Rheology, Dielectric Strength, Processing Windows | Direct PDF Link |
| **S3** | [Idemitsu XAREC™ Syndiotactic Polystyrene Technical Overview](https://www.idemitsu.com/en/business/ipc/products/sps/index.html) | Manufacturer Technical Portal | Crystalline SPS, Melting Point ($T_m$), Solder Heat Resistance | Direct Web Link |
| **S4** | [PubChem Compound Summary: Styrene (Monomer)](https://pubchem.ncbi.nlm.nih.gov/compound/Styrene) | Chemical Registry (NIH) | Monomer IUPAC, CAS 100-42-5, Toxicity, Physicochemical Data | [PubChem CID 7501](https://pubchem.ncbi.nlm.nih.gov/compound/Styrene) |
| **S5** | [Kinetics Study on Thermal Degradation of Polystyrene (ResearchGate / MDPI)](https://www.researchgate.net/publication/376141859_Kinetics_Study_on_Thermal_Degradation_of_Polystyrene_and_Sulfonated_Polystyrene_from_Styrofoam_Waste) | Peer-Reviewed Journal Article | TGA Degradation Envelope, Apparent Activation Energy ($E_a$) | [ResearchGate Publication](https://www.researchgate.net/publication/376141859_Kinetics_Study_on_Thermal_Degradation_of_Polystyrene_and_Sulfonated_Polystyrene_from_Styrofoam_Waste) |
| **S6** | [Chemical Recycling of Post-Consumer Polystyrene by Thermal Pyrolysis](https://www.mdpi.com/2073-4360/18/10/1172) | Peer-Reviewed Literature (MDPI) | Pyrolysis Window (400–500 °C), Main Chain Scission Kinetics | [MDPI Polymers 2026](https://www.mdpi.com/2073-4360/18/10/1172) |
| **S7** | [Polystyrene Encyclopedic Overview (Wikipedia)](https://en.wikipedia.org/wiki/Polystyrene) | Reference Synthesis | Tacticity (aPS, sPS, iPS), Solvents, Polymerization Chemistry | [Wikipedia: Polystyrene](https://en.wikipedia.org/wiki/Polystyrene) |

---

## Phase 3: NotebookLM Grounding & Notebook Architecture

**Notebook Title:** `Polystyrene (PS) - Ground Truth Properties (Polypedia)`

### Direct Web URLs to Insert:

1. `https://www.idemitsu.com/en/business/ipc/products/sps/index.html`
2. `https://pubchem.ncbi.nlm.nih.gov/compound/Styrene`
3. `https://en.wikipedia.org/wiki/Polystyrene`
4. `https://www.mdpi.com/2073-4360/18/10/1172`

### Local / Downloaded PDF Documents to Upload:

1. `INEOS_Styrolution_PS_158N_TDS.pdf` ([Mac-Plast Mirror](https://www.macplast.eu/wp-content/uploads/documenti/st/styrolution%20ps%20158n.pdf))
2. `TotalEnergies_Polystyrene_Crystal_1540_TDS.pdf` ([Hongrun Mirror](https://hongrunplastics.com/public/uploads/images/20250612/TotalEnergies%20GPPS%201540.pdf))
3. `Thermal_Degradation_Kinetics_Polystyrene.pdf` ([ResearchGate Record](https://www.researchgate.net/publication/376141859_Kinetics_Study_on_Thermal_Degradation_of_Polystyrene_and_Sulfonated_Polystyrene_from_Styrofoam_Waste))

---

## Phase 4: Modular "Small-Bite" Extraction Prompts for Grounded LLMs / NotebookLM

### Prompt A: Thermal Transitions & Degradation

```text
Role: Extract thermal transition and degradation properties for Polystyrene (PS) with zero inference.
Scope: Glass transition temperature (Tg), melting point (Tm), heat deflection temperature (HDT), Vicat softening point, thermal conductivity, coefficient of linear thermal expansion (CTE), specific heat capacity (Cp), and TGA degradation onset temperature.
Format Requirements:
- Verbatim numerical value & reported unit
- Standard test method (ISO / ASTM / DIN / IEC)
- Exact test conditions (load, heating rate, annealing state)
- Exact document title, page number, and table/figure header
- Exact verbatim quote of the source sentence or table cell
If a parameter is not explicitly stated in the sources, output 'null'.

```

### Prompt B: Mechanical & Tensile Parameters

```text
Role: Extract mechanical and elastoplastic properties for Polystyrene (GPPS and HIPS) with zero inference.
Scope: Tensile modulus (Young's modulus), tensile yield strength, tensile break strength, tensile elongation/strain at break, flexural strength, flexural modulus, Shore D / Ball indentation / Rockwell hardness, and Charpy / Izod impact strength (notched and unnotched).
Format Requirements:
- Verbatim numerical value & unit
- Test standard (e.g., ISO 527, ISO 178, ISO 179, ISO 2039)
- Specimen condition and test speed (e.g., 23 °C, 50 mm/min, 2 mm/min)
- Exact document title, page number, and table header
- Exact verbatim quote of the source cell/sentence

```

### Prompt C: Physical, Optical & Barrier Properties

```text
Role: Extract physical and optical properties for Polystyrene with zero inference.
Scope: Density / specific gravity, bulk density, water absorption (24h immersion and saturation at 23 °C), refractive index (nD at 589 nm), luminous light transmittance (%), and haze (%).
Format Requirements:
- Verbatim numerical value & unit
- Test standard (ISO 1183, ISO 62, ISO 489, ASTM D1003)
- Test conditions (temperature, wavelength, specimen thickness)
- Exact document title, page number, and locator
- Verbatim quote

```

### Prompt D: Electrical & Dielectric Parameters

```text
Role: Extract electrical insulation and dielectric parameters for Polystyrene with zero inference.
Scope: Dielectric constant (relative permittivity) at 100 Hz / 1 kHz / 1 MHz, dielectric dissipation factor (tan delta) at 100 Hz / 1 MHz, dielectric breakdown strength (kV/mm), volume resistivity (Ohm·m or Ohm·cm), and surface resistivity (Ohm).
Format Requirements:
- Verbatim numerical value & unit
- Test standard (IEC 60250, IEC 60093, IEC 62631, ASTM D149)
- Test frequency and temperature conditions
- Document title, page number, and locator
- Verbatim quote

```

### Prompt E: Rheological & Processing Windows

```text
Role: Extract rheological and injection molding / extrusion processing parameters for Polystyrene.
Scope: Melt Flow Index (MFI) / Melt Volume Rate (MVR) with temperature and load, melt processing temperature range, recommended mold temperature, injection pressure, injection speed, linear mold shrinkage (%), and maximum extrusion temperature limit.
Format Requirements:
- Verbatim numerical value / range & unit
- Test standard (ISO 1133, ISO 294)
- Exact test conditions (e.g., 200 °C / 5 kg)
- Document title, page number, and locator
- Verbatim quote

```

### Prompt F: Commercial Grade Differentiators

```text
Role: Isolate and categorize commercial grade families of Polystyrene.
Scope: Contrast General Purpose Polystyrene (GPPS / Crystal PS), High-Impact Polystyrene (HIPS / polybutadiene rubber modified), Expandable Polystyrene (EPS), Extruded Polystyrene (XPS), and Syndiotactic Polystyrene (sPS).
Format Requirements:
- Grade designation & manufacturer name
- Key differentiating metrics (MFR, Charpy notched impact, Vicat, Tm, optical haze)
- Document title, page number, and locator
- Verbatim quote

```

---

## Phase 5: Pipeline & Extraction Tooling Evaluation

```
+---------------------------------------------------------------------------------------------------+
|                                 POLYMER DATA PIPELINE ARCHITECTURE                                |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Academic Papers & Reviews ]        [ Manufacturer Datasheets (TDS) ]      [ Standard Test Specs ]  |
|               |                                       |                               |           |
|               v                                       v                               v           |
|      +-----------------+                     +-----------------+             +-----------------+  |
|      |     GROBID      |                     |    pdfplumber   |             |   PyMuPDF FitZ  |  |
|      | (Header/BibTeX) |                     |  (Table Borders)|             |  (Text Blocks)  |  |
|      +-----------------+                     +-----------------+             +-----------------+  |
|               |                                       |                               |           |
|               +-------------------+-------------------+-------------------------------+           |
|                                   |                                                               |
|                                   v                                                               |
|                        +--------------------+                                                     |
|                        | ChemDataExtractor2 |                                                     |
|                        | (Property Parsing) |                                                     |
|                        +--------------------+                                                     |
|                                   |                                                               |
|                                   v                                                               |
|                        +--------------------+                                                     |
|                        | Grounded LLM /     |                                                     |
|                        | NotebookLM Bites   |                                                     |
|                        +--------------------+                                                     |
|                                   |                                                               |
|                                   v                                                               |
|                        +--------------------+                                                     |
|                        | Polypedia CSV Row  |                                                     |
|                        | (import_values.py) |                                                     |
|                        +--------------------+                                                     |
+---------------------------------------------------------------------------------------------------+

```

### Tool Assessment Matrix

1. **GROBID (Geneva Robust Automated Bibliographic Extraction)**
* **Utility:** Outstanding for parsing academic literature headers, DOIs, authors, affiliations, and structured XML citation trees.
* **Limitation:** Poor handling of industrial multi-column datasheets, property grids, and technical specification tables.


2. **ChemDataExtractor / ChemDataExtractor2**
* **Utility:** Rule-based chemical entity recognition (NER) for extracting $T_g$, $T_m$, and synthesis yields from running prose in journal articles.
* **Limitation:** Fails on proprietary datasheet layouts where property names and test conditions are split across nested table headers.


3. **PyMuPDF (`fitz`) & `pdfplumber**`
* **Utility:** `pdfplumber` offers exact cell coordinate bounding-box extraction for tabular TDS files (e.g., INEOS Styrolution, TotalEnergies tables). `PyMuPDF` is 10x faster for raw text stream extraction.
* **Limitation:** Requires custom regex heuristics to associate footnotes and test standards with corresponding property rows.


4. **Nougat / Table Transformer**
* **Utility:** Neural visual parsing of complex tables and equations into clean Markdown/LaTeX tables.
* **Limitation:** Slower throughput on CPU; occasional numeric hallucination on small subscript digits.



---

## Phase 6: Grade-Class & Commercial Variant Deep-Dive

| Grade Family | Representative Commercial Grade | Key Differentiator Property | Value & Condition | Primary Application |
| --- | --- | --- | --- | --- |
| **Standard GPPS (Crystal PS)** | [Styrolution PS 158N](https://www.macplast.eu/wp-content/uploads/documenti/st/styrolution%20ps%20158n.pdf) | Vicat Softening / Tensile Modulus | Vicat VST/B/50 = 101 °C; $E_t = 3300\text{ MPa}$; Transmittance = 89% | Optical packaging, Petri dishes, XPS blend |
| **High-Flow GPPS** | [Total Polystyrene 1540](https://hongrunplastics.com/public/uploads/images/20250612/TotalEnergies%20GPPS%201540.pdf) | Melt Flow Rate (MFI) | MFI = 12.0 g/10 min (200 °C / 5 kg); Vicat = 91 °C | Thin-wall injection molding, cutlery, jewel boxes |
| **High Impact PS (HIPS)** | [Styrolution PS 486N](https://www.macplast.eu/wp-content/uploads/documenti/st/styrolution%20ps%20158n.pdf) | Charpy Notched Impact / Elongation | Notched Impact = 12–16 kJ/m²; Elongation = 25–40% (Opaque) | Refrigerator liners, dairy containers, toys |
| **Expandable PS (EPS)** | Generic EPS Beads + Pentane | Thermal Conductivity / Density | $\lambda = 0.033\text{ W/(m}\cdot\text{K)}$; Density = 0.015–0.050 g/cm³ | Thermal insulation foam, protective packaging |
| **Syndiotactic PS (sPS)** | [Idemitsu XAREC™ SPS](https://www.idemitsu.com/en/business/ipc/products/sps/index.html) | Melting Point ($T_m$) / Heat Resistance | $T_m = 270\text{ °C}$; HDT = 250 °C (GF reinforced); Solder resistant | Automotive electronics, high-frequency connectors |

---

## Phase 7: Unit Conversion & Mismatch Mapping

| Property Key | Source Printed Value | Source Unit | Conversion Factor | Canonical Polypedia Value | Canonical Unit |
| --- | --- | --- | --- | --- | --- |
| `density` | 1040 | $\text{kg/m}^3$ | $\times 10^{-3}$ | **1.04** | $\text{g/cm}^3$ |
| `young_modulus` | 3300 | $\text{MPa}$ | $\times 10^{-3}$ | **3.30** | $\text{GPa}$ |
| `flexural_modulus` | 2050 | $\text{MPa}$ | $\times 10^{-3}$ | **2.05** | $\text{GPa}$ |
| `mfi` | 3.3 | $\text{cm}^3/10\text{ min}$ (MVR) | $\times \rho\text{ (1.04)}$ | **3.43** | $\text{g/10min}$ |
| `cte` | 80 | $10^{-6}/\text{°C}$ | $1:1$ | **80.0** | $\mu\text{m/°C}$ |
| `specific_heat_capacity` | 1.22 | $\text{J/(g}\cdot\text{K)}$ | $1:1$ | **1.22** | $\text{kJ/(kg}\cdot\text{K)}$ |
| `volume_resistivity` | $> 10^{16}$ | $\Omega\cdot\text{m}$ | $\times 100$ | **$> 1.0\times 10^{18}$** | $\Omega\cdot\text{cm}$ |
| `dissipation_factor` | 0.9 | $10^{-4}$ | $\times 10^{-4}$ | **0.00009** | dimensionless |
| `injection_pressure` | 1000 | $\text{bar}$ | $\times 0.1$ | **100.0** | $\text{MPa}$ |

---

## Phase 8: Full-Address Citation Mapping & Verification

### Source 1: [INEOS Styrolution PS 158N/L Technical Data Sheet (Mac-Plast Mirror)](https://www.macplast.eu/wp-content/uploads/documenti/st/styrolution%20ps%20158n.pdf)

* **Full Reference:** INEOS Styrolution Group GmbH. *Technical Data Sheet: Styrolution® PS 158N/L General Purpose Polystyrene (GPPS)*. Revision Date: 2016-01-17.
* **Grade:** Styrolution PS 158N/L (Heat resistant GPPS pellets).

1. `density`: **1.04 g/cm³** (1040 kg/m³)
* **Locator:** Page 2, Section: "Other Properties", Row 1
* **Verbatim Quote:** `"Density ISO 1183 kg/m³ 1040"`


2. `tensile_strength`: **55 MPa**
* **Locator:** Page 1, Section: "Mechanical Properties", Row 2
* **Verbatim Quote:** `"Tensile Stress at Yield, 23 °C ISO 527 MPa 55"`


3. `young_modulus`: **3.3 GPa** (3300 MPa)
* **Locator:** Page 1, Section: "Mechanical Properties", Row 4
* **Verbatim Quote:** `"Tensile Modulus ISO 527 MPa 3300"`


4. `elongation_at_break`: **3 %**
* **Locator:** Page 1, Section: "Mechanical Properties", Row 3
* **Verbatim Quote:** `"Tensile Strain at Break, 23 °C ISO 527 % 3"`


5. `flexural_modulus`: **2.05 GPa** (2050 MPa)
* **Locator:** Page 1, Section: "Mechanical Properties", Row 8
* **Verbatim Quote:** `"Flexural Modulus ISO 178 MPa 2050"`


6. `vicat`: **101 °C**
* **Locator:** Page 1, Section: "Thermal Properties", Row 1
* **Verbatim Quote:** `"Vicat Softening Temperature VST/B/50 (50N, 50 °C/h) ISO 306 °C 101"`


7. `hdt`: **86 °C**
* **Locator:** Page 1, Section: "Thermal Properties", Row 4
* **Verbatim Quote:** `"Heat Deflection Temperature A; (annealed 4 h/80 °C; 1.8 MPa) ISO 75 °C 86"`


8. `conductivity`: **0.17 W/(m·K)**
* **Locator:** Page 2, Section: "Thermal Properties", Row 2
* **Verbatim Quote:** `"Thermal Conductivity DIN 52612-1 W/(m K) 0.17"`


9. `cte`: **80 µm/°C** ($80\times 10^{-6}/\text{°C}$)
* **Locator:** Page 2, Section: "Thermal Properties", Row 1
* **Verbatim Quote:** `"Coefficient of Linear Thermal Expansion ISO 11359 10^(-6)/°C 80"`


10. `refractive_index`: **1.56**
* **Locator:** Page 2, Section: "Optical Properties", Row 1
* **Verbatim Quote:** `"Refractive Index, Sodium D Line ISO 489 - 1.56"`


11. `dielectric_constant`: **2.5**
* **Locator:** Page 2, Section: "Electrical Properties", Row 1
* **Verbatim Quote:** `"Dielectric Constant (100 Hz) IEC 60250 - 2.5"`


12. `dissipation_factor`: **0.00009** ($0.9\times 10^{-4}$)
* **Locator:** Page 2, Section: "Electrical Properties", Row 2
* **Verbatim Quote:** `"Dissipation Factor (100 Hz) IEC 60250 10^(-4) 0.9"`


13. `volume_resistivity`: **$> 1.0\times 10^{18}\ \Omega\cdot\text{cm}$** ($> 10^{16}\ \Omega\cdot\text{m}$)
* **Locator:** Page 2, Section: "Electrical Properties", Row 4
* **Verbatim Quote:** `"Volume Resistivity IEC 60093 Ohm*m >1E16"`


14. `water_absorption`: **0.1 %** ($< 0.1\%$)
* **Locator:** Page 2, Section: "Other Properties", Row 2
* **Verbatim Quote:** `"Water Absorption, Saturated at 23 °C ISO 62 % <0.1"`


15. `process_temp`: **180 – 280 °C**
* **Locator:** Page 2, Section: "Processing", Row 2
* **Verbatim Quote:** `"Melt Temperature Range ISO 294 °C 180 - 280"`


16. `mould_temp`: **40 °C (range 10 – 60 °C)**
* **Locator:** Page 2, Section: "Processing", Row 3
* **Verbatim Quote:** `"Mold Temperature Range ISO 294 °C 40"`



---

### Source 2: [TotalEnergies Polystyrene Crystal 1540 Datasheet](https://hongrunplastics.com/public/uploads/images/20250612/TotalEnergies%20GPPS%201540.pdf)

* **Full Reference:** Total Petrochemicals & Refining. *Material Datasheet: TOTAL Polystyrene 1540 High Flow Polystyrene*. Last Updated: 2013-08-12.
* **Grade:** Total Polystyrene Crystal 1540.

1. `mfi`: **12.0 g/10 min**
* **Locator:** Page 1, Section: "Rheological Properties", Row 1
* **Verbatim Quote:** `"Melt Flow Index (200 °C - 5 kg) ISO 1133 / ASTM D-1238 Value: 12.00 Units: g/10 min"`


2. `dielectric_strength`: **135 kV/mm** (135,000 kV/m)
* **Locator:** Page 1, Section: "Electrical Properties", Row 1
* **Verbatim Quote:** `"Dielectric Strength ASTM D-149 Value: 135 kV/mm (135000 kV/m)"`



---

## Phase 9: Non-Numeric Metadata Registration

```yaml
polymer_metadata:
  standard_name: "Polystyrene"
  abbreviation: "PS"
  common_variants:
    - "GPPS (General Purpose Polystyrene / Crystal PS)"
    - "HIPS (High Impact Polystyrene / Rubber-toughened)"
    - "EPS (Expandable Polystyrene)"
    - "XPS (Extruded Polystyrene)"
    - "sPS (Syndiotactic Polystyrene)"
  iupac_name: "poly(1-phenylethane-1,2-diyl)"
  cas_registry_number: "9003-53-6"
  monomer:
    name: "Styrene (Ethenylbenzene / Vinylbenzene)"
    formula: "C8H8"
    cas_number: "100-42-5"
    pubchem_cid: 7501
  morphology: "Amorphous (atactic standard commercial grades); Semi-crystalline (syndiotactic metallocene grades, Tm = 270 °C)"
  tacticity_prevalence: "Predominantly atactic (aPS) via free radical bulk/suspension polymerization"
  optical_properties:
    clarity: "High optical transparency (Crystal PS)"
    total_luminous_transmittance: "89% (ASTM D1003, 550 nm)"
    haze: "1.5% (ASTM D1003)"
  flammability_class: "UL 94 HB (Slow burning, releases black sooty smoke and aromatic styrene odor)"
  solubility_profile:
    soluble_in:
      - "Benzene"
      - "Toluene"
      - "Ethylbenzene"
      - "Chloroform"
      - "Tetrahydrofuran (THF)"
      - "Methyl ethyl ketone (MEK)"
      - "Ethyl acetate"
    insoluble_in:
      - "Water"
      - "Lower aliphatic alcohols (Methanol, Ethanol)"
      - "Aliphatic hydrocarbons (Hexane, Heptane)"

```
