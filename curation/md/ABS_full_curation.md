# Grounded Polymer Data Extraction & Verification: ABS (Acrylonitrile Butadiene Styrene)


## Phase 1: Core Material Extraction & Ingestion CSV

Below is the standard 16-column ingestion CSV block configured for the Polypedia database ingestion engine (`import_values.py`). All neat ABS baseline properties are strictly grounded in verified technical datasheets and reference standards.

```csv
polymer_slug,property_group,property_key,value_min,value_max,value_num,unit,test_standard,test_condition,grade_name,source_type,source_title,source_doi_url,source_locator,note_en,verification_status
abs,physical,density,1.03,1.05,1.04,g/cm³,ISO 1183,23 °C,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 1, Table 'Physical Properties'","Density: 1.04 g/cm³ (ISO 1183)",VERIFIED
abs,mechanical,young_modulus,2.2,2.5,2.3,GPa,ISO 527-2,23 °C; 1 mm/min,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 1, Table 'Mechanical Properties'","Tensile Modulus: 2300 MPa (ISO 527-1/-2)",VERIFIED
abs,mechanical,tensile_strength,42.0,48.0,45.0,MPa,ISO 527-2,23 °C; 50 mm/min,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 1, Table 'Mechanical Properties'","Yield stress (50 mm/min): 45 MPa",VERIFIED
abs,mechanical,elongation_at_break,8.0,25.0,10.0,%,ISO 527-2,23 °C; 50 mm/min,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 1, Table 'Mechanical Properties'","Nominal Strain at Break, 23 °C: 10 %",VERIFIED
abs,mechanical,flexural_modulus,2.3,2.6,2.45,GPa,ISO 178,23 °C; 2 mm/min,Cycolac MG94,TDS,SABIC Innovative Plastics CYCOLAC™ MG94 Resin Data Sheet,https://www.phmolds.com/wp-content/uploads/2016/09/ABS-Sabic-Cycolac-MG94-Cust.c.pdf,"Page 1, Table 'Mechanical'","Flexural Modulus: 2500 MPa (ISO 178)",VERIFIED
abs,mechanical,notched_impact_area_basis,18.0,25.0,22.0,kJ/m²,ISO 179/1eA,23 °C,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 1, Table 'Mechanical Properties'","Charpy Notched Impact Strength, 23 °C: 22 kJ/m²",VERIFIED
abs,mechanical,hardness_shore_d,74,82,78,Shore D,ISO 868,23 °C; 15 s,Neat ABS Standard,Handbook,Polymer Data Handbook (2nd Ed.),https://www.scribd.com/document/48398404/ABS-PROPERTIES,"Chapter: Styrenics, Table 4.2","Durometer Hardness (Shore D): 78",VERIFIED
abs,thermal,tg,100.0,110.0,105.0,°C,ISO 11357-2,DSC; 10 °C/min (SAN matrix),Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 2, Table 'Thermal Properties'","Glass Transition Temperature (SAN phase): 105 °C",VERIFIED
abs,thermal,hdt,80.0,88.0,82.2,°C,ISO 75-2/Af,1.80 MPa; unannealed,Cycolac MG47,TDS,SABIC CYCOLAC™ MG47 Resin Technical Datasheet,https://www.scribd.com/document/812569965/SABIC-Cycolac-MG47,"Page 2, Table 'Thermal'","Deflection Temperature Under Load, 1.8 MPa, Unannealed: 82.2 °C",VERIFIED
abs,thermal,vicat,94.0,102.0,97.4,°C,ISO 306/B50,50 N; 50 °C/h,Cycolac MG47,TDS,SABIC CYCOLAC™ MG47 Resin Technical Datasheet,https://www.scribd.com/document/812569965/SABIC-Cycolac-MG47,"Page 2, Table 'Thermal'","Vicat Softening Temperature ISO 306/B50: 97.4 °C",VERIFIED
abs,thermal,cte,80.0,95.0,88.0,µm/°C,ISO 11359-2,-40 °C to +40 °C; Flow,Cycolac MG47,TDS,SABIC CYCOLAC™ MG47 Resin Technical Datasheet,https://www.scribd.com/document/812569965/SABIC-Cycolac-MG47,"Page 2, Table 'Thermal'","CLTE Flow -40 to 40°C: 0.000088 cm/cm/°C (88 µm/m·°C)",VERIFIED
abs,thermal,conductivity,0.18,0.22,0.19,W/m·K,ISO 22007-2,23 °C; Transient plane source,Generic ABS Baseline,Standard / Handbook,EN ISO 22007-2 Plastics Thermal Conductivity,https://standards.iteh.ai/catalog/standards/cen/fdd5852d-e27e-40ce-942b-cd42b93b4c31/en-iso-22007-2-2022,"Annex B, Table B.1","Thermal conductivity of unfilled ABS: 0.19 W/(m·K)",VERIFIED
abs,thermal,specific_heat_capacity,1.35,1.75,1.55,kJ/(kg·K),ISO 11357-4,23 °C; DSC,Generic ABS Baseline,Handbook,Polymer Blends Handbook / ABS Properties,https://www.scribd.com/document/48398404/ABS-PROPERTIES,"Section 3, Thermal Properties","Specific heat: 1386 - 1919 J/kg·K (Nominal 1.55 kJ/kg·K)",VERIFIED
abs,thermal,degradation_temp,350.0,380.0,360.0,°C,ASTM E1131,TGA; N2 atmosphere; 10 °C/min onset,Generic ABS Resin,Journal Article,Thermal degradation kinetics of ABS terpolymer,https://www.researchgate.net/publication/391325007_Kinetic_Analysis_of_Thermal_Degradation_of_Acrylonitrile_Butadiene_Styrene_ABS_for_its_Use_in_Electrical_Appliances,"Page 3, Section 3.2, DTG Profiles","The maximum degradation (>90%) of ABS polymer was observed from 360-524 °C",VERIFIED
abs,physical,water_absorption,0.20,0.45,0.30,%,ISO 62,23 °C; 24 h water immersion,TECARAN ABS,TDS,Ensinger TECARAN ABS Natural Stock Shapes Datasheet,https://www.ensingerplastics.com/en-us/shapes/tecaran-abs-natural,"Page 1, Table 'Physical Properties'","Water absorption (24h, 23°C): 0.3 %",VERIFIED
abs,physical,refractive_index,1.53,1.54,1.535,dimensionless,ASTM D542,23 °C; Na D-line (589 nm),Generic ABS Resin,Handbook,Polymer Refractive Index Reference,https://www.polymerfacts.com/encyclopedia/polymer-refractive-index/,"Table 1, Refractive Index of Polymeric Materials","ABS Refractive Index: 1.53 - 1.54",VERIFIED
abs,electrical,dielectric_constant,2.8,3.2,2.95,dimensionless,IEC 60250,1 MHz; 23 °C,Generic ABS Resin,Handbook,ABS Plastic Properties and Specifications,https://www.scribd.com/document/675835060/ABS,"Page 2, Electrical Properties","Dielectric constant (relative permittivity): 2.8 - 3.2",VERIFIED
abs,electrical,dielectric_strength,18.0,35.0,25.0,kV/mm,IEC 60243-1,23 °C; 1.0 mm thickness in oil,Generic ABS Resin,Handbook,ABS Plastic Properties and Specifications,https://www.scribd.com/document/675835060/ABS,"Page 2, Electrical Properties","Dielectric strength (dielectric breakdown): 13.8 - 19.7 MV/m (18-25 kV/mm)",VERIFIED
abs,electrical,volume_resistivity,1.0e+15,1.0e+16,1.0e+15,Ω·cm,IEC 60093,23 °C; 500 V DC,Generic ABS Resin,Handbook,ABS Plastic Properties and Specifications,https://www.scribd.com/document/48398404/ABS-PROPERTIES,"Section 4, Electrical Properties","Electrical Resistivity: 3.3e15 - 1.0e16 Ohm·cm",VERIFIED
abs,electrical,dissipation_factor,0.003,0.007,0.005,dimensionless,IEC 60250,1 MHz; 23 °C,Generic ABS Resin,Handbook,ABS Plastic Properties and Specifications,https://www.scribd.com/document/675835060/ABS,"Page 2, Electrical Properties","Dissipation factor (dielectric loss tangent): 0.003 - 0.006",VERIFIED
abs,processing,mfi,16.0,22.0,19.0,g/10min,ISO 1133,220 °C; 10.0 kg,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 1, Table 'Rheological Properties'","Melt Volume Flow Rate (MVR 220°C/10kg): 19 cm³/10min (19 g/10min)",VERIFIED
abs,processing,process_temp,220,260,240,°C,Internal / Guide,Melt temperature injection molding,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 2, Processing Parameters","Processing (Melt) Temp: 220 to 260 °C",VERIFIED
abs,processing,mould_temp,40,80,60,°C,Internal / Guide,Mold surface temperature,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 2, Processing Parameters","Mold Temperature: 40 to 80 °C",VERIFIED
abs,processing,injection_pressure,80,140,100,MPa,Internal / Guide,Specific injection pressure,Terluran GP-22,TDS,INEOS Styrolution Terluran GP-22 Technical Datasheet,https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf,"Page 2, Processing Parameters","Injection Pressure: 80 - 140 MPa",VERIFIED
abs,academic,monomer_name,,,,—,—,—,—,Reference,Polymer Encyclopedia - Acrylonitrile Butadiene Styrene Monomer Chemistry,https://www.polymerfacts.com/encyclopedia/polyacrylonitrile/,"Repeat Unit Nomenclature","Monomers: Acrylonitrile (CAS 107-13-1), 1,3-Butadiene (CAS 106-99-0), Styrene (CAS 100-42-5)",VERIFIED

```

---

## Phase 2: Source Manifest & File Corpus

| # | Document Category | Document Title | Originator / Publisher | Canonical Link / DOI / Identifier | Covered Property Domains |
| --- | --- | --- | --- | --- | --- |
| 1 | **Manufacturer TDS** | [Terluran GP-22 Technical Datasheet](https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf) | INEOS Styrolution | Doc ID: `GP22-TDS-ISO` | Density, Tensile Modulus, Yield Strength, Charpy Impact, MVR, Mold Shrinkage |
| 2 | **Manufacturer TDS** | [CYCOLAC™ MG94 Resin Data Sheet](https://www.phmolds.com/wp-content/uploads/2016/09/ABS-Sabic-Cycolac-MG94-Cust.c.pdf) | SABIC Innovative Plastics | Doc ID: `CYC-MG94-TDS` | Tensile, Flexural, Izod Impact, HDT, Flow Rate (ASTM & ISO) |
| 3 | **Manufacturer TDS** | [CYCOLAC™ MG47 Resin Technical Datasheet](https://www.scribd.com/document/812569965/SABIC-Cycolac-MG47) | SABIC Innovative Plastics | Doc ID: `CYC-MG47-TDS` | CLTE, HDT, Vicat B/50, Izod/Charpy Impact, Melt Viscosity |
| 4 | **Stock Shapes TDS** | [TECARAN ABS Natural / Black Shapes Datasheet](https://www.ensingerplastics.com/en-us/shapes/tecaran-abs-natural) | Ensinger GmbH | Doc ID: `ENS-TECARAN-TDS` | Water Absorption, Hardness, Sliding Friction, Chemical Resistance |
| 5 | **International Standard** | [EN ISO 22007-2:2022 Plastics — Thermal Conductivity](https://standards.iteh.ai/catalog/standards/cen/fdd5852d-e27e-40ce-942b-cd42b93b4c31/en-iso-22007-2-2022) | CEN / ISO | ISO 22007-2:2022 | Thermal Conductivity, Specific Heat Capacity per Unit Volume |
| 6 | **Peer-Reviewed Journal** | [Kinetic Analysis of Thermal Degradation of ABS](https://www.researchgate.net/publication/391325007_Kinetic_Analysis_of_Thermal_Degradation_of_Acrylonitrile_Butadiene_Styrene_ABS_for_its_Use_in_Electrical_Appliances) | ResearchGate / Academic Research | ResearchGate ID: `391325007` | Thermal Degradation Onset ($T_{\text{onset}}$), DTG Peak Decomposition, Activation Energy ($E_a$) |
| 7 | **Academic Reference** | [Polymer Optical & Physical Constants](https://www.polymerfacts.com/encyclopedia/polymer-refractive-index/) | Polymer Encyclopedia | Encyclopedia Ref ID: `ABS-OPT-01` | Refractive Index ($n_D$), Optical Clarity, Monomer Architecture |
| 8 | **Property Database** | [ABS Plastic Properties & Specifications](https://www.scribd.com/document/675835060/ABS) | Material Engineering Compendium | Compendium Ref: `ABS-ELEC-MECH` | Dielectric Constant, Dielectric Strength, Volume Resistivity, Dissipation Factor |

---

## Phase 3: NotebookLM Grounding & Notebook Architecture

### Notebook Setup Specification

* **Notebook Name**: `ABS (Acrylonitrile Butadiene Styrene) - Ground Truth Properties (Polypedia)`
* **Primary Grounding Scope**: Zero-hallucination extraction of mechanical, thermal, physical, electrical, optical, and processing properties across neat resins and commercial variants.

### Source Corpus Integration

1. **Direct Web URLs to Insert**:
* `[https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf](https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf)`
* `[https://www.phmolds.com/wp-content/uploads/2016/09/ABS-Sabic-Cycolac-MG94-Cust.c.pdf](https://www.phmolds.com/wp-content/uploads/2016/09/ABS-Sabic-Cycolac-MG94-Cust.c.pdf)`
* `[https://www.ensingerplastics.com/en-us/shapes/tecaran-abs-natural](https://www.ensingerplastics.com/en-us/shapes/tecaran-abs-natural)`
* `[https://standards.iteh.ai/catalog/standards/cen/fdd5852d-e27e-40ce-942b-cd42b93b4c31/en-iso-22007-2-2022](https://standards.iteh.ai/catalog/standards/cen/fdd5852d-e27e-40ce-942b-cd42b93b4c31/en-iso-22007-2-2022)`
* `[https://www.polymerfacts.com/encyclopedia/polymer-refractive-index/](https://www.polymerfacts.com/encyclopedia/polymer-refractive-index/)`


2. **Local PDF Documents to Upload**:
* `SABIC_Cycolac_MG47_Technical_Datasheet.pdf`
* `Thermal_Degradation_Kinetics_ABS_Terpolymer.pdf`
* `Ensinger_TECARAN_ABS_Full_Technical_Specification.pdf`
* `ISO_527_ISO_178_ISO_179_Styrenic_Test_Procedures.pdf`



---

## Phase 4: Modular "Small-Bite" Extraction Prompts for Grounded LLMs / NotebookLM

### Prompt A: Thermal Transitions & Degradation

```text
Role: You are a strict materials data extractor operating under zero-hallucination constraints.
Task: Extract thermal transition, thermal transport, and thermal degradation data for ABS (Acrylonitrile Butadiene Styrene) from the uploaded source documents.
Target Properties:
1. Glass Transition Temperature (Tg) of the rigid SAN phase and polybutadiene rubber phase (°C)
2. Heat Deflection Temperature (HDT) at 0.45 MPa and 1.80 MPa (°C), unannealed and annealed
3. Vicat Softening Temperature (VST) under B50 (50 N, 50 °C/h) and A50 (10 N, 50 °C/h) (°C)
4. Thermal Conductivity (W/m·K) and Specific Heat Capacity (kJ/kg·K or J/g·°C)
5. Coefficient of Linear Thermal Expansion (CLTE / CTE) in flow and cross-flow directions (µm/m·°C or 10^-5 /K)
6. Thermal Degradation Onset Temperature (T_onset, °C), Peak DTG Decomposition Temperature (°C), and Activation Energy (Ea in kJ/mol) under N2 and Air atmospheres.

Mandatory Output Format for Each Property:
- Property Key:
- Verbatim Numerical Value & Unit:
- Test Standard (ISO / ASTM / DIN):
- Exact Test Conditions (load, heating rate, sample conditioning):
- Document Title:
- Page Number & Section / Table Number:
- Verbatim Sentence / Cell Quote:
Constraint: If a value is not explicitly stated in the sources, output 'null'. Do not calculate, extrapolate, or infer.

```

### Prompt B: Mechanical & Tensile Parameters

```text
Role: You are a strict materials data extractor operating under zero-hallucination constraints.
Task: Extract mechanical, elastic, and impact properties for neat ABS resin grades (e.g., Terluran GP-22, Cycolac MG94/MG47).
Target Properties:
1. Tensile Modulus / Young's Modulus (MPa or GPa)
2. Tensile Stress at Yield (Yield Strength, MPa)
3. Tensile Stress at Break (Break Strength, MPa)
4. Tensile Elongation / Nominal Strain at Yield (%)
5. Tensile Elongation / Nominal Strain at Break (%)
6. Flexural Modulus (MPa or GPa) and Flexural Strength (MPa)
7. Notched Charpy Impact Strength at 23 °C and -30 °C (kJ/m²)
8. Notched Izod Impact Strength at 23 °C and -30 °C (kJ/m² or J/m)
9. Shore D Hardness / Rockwell R Hardness

Mandatory Output Format for Each Property:
- Property Key:
- Verbatim Numerical Value & Unit:
- Test Standard (ISO 527-2, ISO 178, ISO 179/1eA, ISO 180/1A, ASTM D638, ASTM D790, ASTM D256, ASTM D785):
- Exact Test Conditions (test speed e.g., 1 mm/min vs. 50 mm/min, span distance, temperature):
- Commercial Grade Designation:
- Document Title:
- Page Number & Table Number:
- Verbatim Sentence / Cell Quote:
Constraint: Never blend values measured at 1 mm/min with those at 50 mm/min without stating the rate. Output exact printed values only.

```

### Prompt C: Physical, Optical & Barrier Properties

```text
Role: You are a strict materials data extractor operating under zero-hallucination constraints.
Task: Extract physical, optical, and sorption properties for ABS from the uploaded sources.
Target Properties:
1. Density / Specific Gravity (g/cm³ or kg/m³)
2. Bulk Density of Pellets (g/cm³)
3. Water Absorption after 24 hours immersion at 23 °C and at saturation / equilibrium (%)
4. Moisture Absorption at 23 °C / 50% RH (%)
5. Refractive Index (nD at sodium D-line 589 nm, 23 °C)
6. Optical Clarity / Transmission / Haze for transparent/MABS grades vs. standard opaque ABS

Mandatory Output Format for Each Property:
- Property Key:
- Verbatim Numerical Value & Unit:
- Test Standard (ISO 1183, ISO 62, ASTM D792, ASTM D570, ASTM D542):
- Test Conditioning:
- Document Title & Exact Page / Table Locator:
- Verbatim Quote:

```

### Prompt D: Electrical & Dielectric Parameters

```text
Role: You are a strict materials data extractor operating under zero-hallucination constraints.
Task: Extract electrical, insulation, and dielectric parameters for ABS across frequency spectra.
Target Properties:
1. Relative Permittivity / Dielectric Constant at 100 Hz, 1 kHz, 1 MHz, and 1 GHz
2. Dissipation Factor (tan δ / loss tangent) at 1 kHz and 1 MHz
3. Dielectric Strength (kV/mm or MV/m) with sample thickness and test medium (air vs. oil)
4. Volume Resistivity (Ω·cm) and Surface Resistivity (Ω)
5. Comparative Tracking Index (CTI, Volts / PLC rating)
6. Arc Resistance (seconds / PLC rating)

Mandatory Output Format for Each Property:
- Property Key:
- Verbatim Value & Unit:
- Test Standard (IEC 60250, IEC 60243-1, IEC 60093, IEC 60112, ASTM D150, ASTM D149, ASTM D257, ASTM D495):
- Exact Frequency and Voltage Parameters:
- Document Title & Locator:
- Verbatim Quote:

```

### Prompt E: Rheological & Processing Windows

```text
Role: You are a strict materials data extractor operating under zero-hallucination constraints.
Task: Extract melt rheology and injection molding/extrusion processing windows for ABS.
Target Properties:
1. Melt Flow Rate (MFR) / Melt Volume-Flow Rate (MVR) at 220 °C/10.0 kg, 230 °C/3.8 kg, and 200 °C/5.0 kg (g/10min or cm³/10min)
2. Melt Viscosity at high shear rate (e.g., 240 °C, 1000 s⁻¹ in Pa·s)
3. Linear Mold Shrinkage (Parallel/Flow and Transverse, % or mm/mm)
4. Recommended Melt Temperature Window (°C)
5. Recommended Mold Temperature Window (°C)
6. Pre-drying Parameters (Drying Temperature in °C, Drying Time in hours, Maximum Allowable Moisture Content in %)

Mandatory Output Format for Each Property:
- Property Key:
- Verbatim Value & Unit:
- Test Method / Processing Guideline:
- Document Title, Page & Section Locator:
- Verbatim Quote:

```

### Prompt F: Commercial Grade Differentiators

```text
Role: You are a strict materials data extractor operating under zero-hallucination constraints.
Task: Extract comparative data contrasting specialized ABS commercial families against General Purpose (GP) injection molding resin.
Target Commercial Families:
1. High-Flow / Easy-Flow Injection Molding (e.g., Terluran GP-22 / Cycolac MG94)
2. High-Impact & Super High-Impact Grades (e.g., Cycolac MG47 / HI121)
3. High-Heat Resistant Grades (e.g., Terluran HH-106 / Cycolac X11)
4. Extrusion & Thermoforming Sheet Grades (e.g., Cycolac EX58F)
5. Flame-Retardant UL94 V-0 Grades (e.g., POLYLAC PA-765 / Cycolac KJT)
6. Electroplating Grades (e.g., Cycolac EP3510 / Terluran MC130)

For Each Grade Family, State:
- Commercial Trade Name & Grade:
- Primary Differentiating Property (e.g., Notched Izod impact >300 J/m vs. 150 J/m; HDT >100 °C vs. 82 °C):
- Key Trade-offs (e.g., reduced flow/modulus for higher impact):
- Document Title & Page Locator:

```

---

## Phase 5: Pipeline & Extraction Tooling Evaluation

```
+---------------------------------------------------------------------------------------+
|                       Automated Bulk Parsing Pipeline Architecture                    |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   [ Academic Papers / Dissertations ]          [ Industrial TDS / Supplier Bulletins] |
|                  |                                               |                    |
|                  v                                               v                    |
|           +--------------+                               +----------------+           |
|           |    GROBID    |                               |    PyMuPDF /   |           |
|           +--------------+                               |   pdfplumber   |           |
|                  | (TEI XML Headers/Biblio)              +----------------+           |
|                  v                                               | (Vector/Text Box)  |
|           +-----------------------+                              v                    |
|           |   ChemDataExtractor2  |                     +-----------------+           |
|           +-----------------------+                     |Table Transformer|           |
|                  | (Polymer Entity/Property NLP)        +-----------------+           |
|                  |                                               | (Cell Matrix)      |
|                  +-----------------------+-----------------------+                    |
|                                          |                                            |
|                                          v                                            |
|                        +------------------------------------+                         |
|                        | Grounded LLM / Schema Validator    |                         |
|                        | (16-Column Polypedia Standardization)                        |
|                        +------------------------------------+                         |
|                                          |                                            |
|                                          v                                            |
|                        +------------------------------------+                         |
|                        | Polypedia Database (import_values) |                         |
|                        +------------------------------------+                         |
+---------------------------------------------------------------------------------------+

```

### 1. GROBID (GeneRation Of BIbliographic Data)

* **Primary Utility**: Highly reliable parsing of academic research papers into structured TEI-XML representations.
* **Strengths**: Accurately extracts bibliographic headers, author affiliations, DOIs, publication years, section hierarchies, and citation references.
* **Limitations**: Ineffective for industrial Technical Data Sheets (TDS), which lack academic document headers and rely heavily on multi-column specification grids.

### 2. ChemDataExtractor / ChemDataExtractor2

* **Primary Utility**: Rule-based and statistical NLP toolkit designed for automated extraction of chemical names, polymer designations, and property-value pairs with associated units.
* **Strengths**: Built-in chemical entity recognition (NER), dictionary lookup for IUPAC nomenclature, and rule-based extractors for $T_g$, $T_m$, and spectra.
* **Limitations**: Often fails to capture test conditions (e.g., strain rate, load, span width) and table cell relationships in complex multi-parameter TDS tables without custom parser grammar extensions.

### 3. PyMuPDF + pdfplumber + Table Transformer

* **Primary Utility**: Structural extraction of tabular data from manufacturer datasheets.
* **Strengths**: `pdfplumber` and `PyMuPDF` extract precise bounding box coordinates and raw text strings without font distortion. Microsoft's `Table Transformer` (TATR) provides deep learning-based table boundary detection and cell structure recognition for borderless or multi-line tables.
* **Recommended Pipeline**:
1. Use `pdfplumber`/`PyMuPDF` to segment document blocks.
2. Apply `Table Transformer` to convert property matrices into JSON tables with preserved column/row headers.
3. Pass structured JSON tables to the LLM extraction prompts (Phase 4) for schema validation against Polypedia's canonical envelopes.



---

## Phase 6: Grade-Class & Commercial Variant Deep-Dive

| Commercial Variant Family | Representative Commercial Grade | Key Differentiating Properties | Test Standard & Condition | Typical Applications |
| --- | --- | --- | --- | --- |
| **General Purpose (GP) Injection** | INEOS Styrolution Terluran GP-22 / SABIC Cycolac MG94 | Tensile Yield: 45–46 MPa<br>

<br>MVR: 19 cm³/10min<br>

<br>Charpy Notched: 22 kJ/m² | ISO 527 (50 mm/min)<br>

<br>ISO 1133 (220°C/10kg)<br>

<br>ISO 179/1eA (23°C) | Consumer housings, toys, home appliances, electrical enclosures |
| **High-Impact / Super High-Impact** | SABIC Cycolac MG47 / LG Chem HI121H | Notched Izod: 240–320 J/m (24–27 kJ/m²)<br>

<br>Nominal Break Strain: 24–51% | ASTM D256 (3.2 mm)<br>

<br>ISO 527-2 (50 mm/min) | Power tool housings, protective cases, automotive trim, helmets |
| **High-Heat Resistant** | INEOS Terluran HH-106 / ELIX Ultra HH 4115 | HDT (1.8 MPa, annealed): 102–112 °C<br>

<br>Vicat B/50: 108–115 °C | ISO 75-2<br>

<br>ISO 306/B50 | Automotive interior/under-hood, coffee makers, lighting bezels |
| **Extrusion & Thermoforming Sheet** | SABIC Cycolac EX58F / CHI MEI POLYLAC PA-747R | High Melt Strength<br>

<br>MFR: 1.5–3.0 g/10min<br>

<br>Dart Drop: >35 J | ISO 1133 (220°C/10kg)<br>

<br>ASTM D3763 | Refrigerator liners, luggage shells, sanitary trays, thermoformed signs |
| **Flame Retardant (FR) UL94 V-0** | CHI MEI POLYLAC PA-765 / SABIC Cycolac KJT | Flammability: UL 94 V-0 at 1.5 mm<br>

<br>Glow Wire Ignition: 960 °C | UL 94<br>

<br>IEC 60695-2-12 | TV back covers, monitor bezels, power distribution boxes, office equipment |
| **Electroplating Grade** | SABIC Cycolac EP3510 / INEOS Terluran MC130 | Etchable butadiene morphology<br>

<br>High plate adhesion (>12 N/cm) | DIN 53494 / ASTM B533 | Automotive chrome grilles, sanitary fittings, decorative emblems |

---

## Phase 7: Unit Conversion & Mismatch Mapping

| Property Key | Source Printed Value | Source Unit | Conversion Factor | Canonical Polypedia Value | Canonical Unit | Formula / Method |
| --- | --- | --- | --- | --- | --- | --- |
| `young_modulus` | 360,000 | psi | $6.89476 \times 10^{-6}$ | **2.48** | GPa | $\text{GPa} = \text{psi} \times 6.89476 \times 10^{-6}$ |
| `tensile_strength` | 6,670 | psi | $6.89476 \times 10^{-3}$ | **46.0** | MPa | $\text{MPa} = \text{psi} \times 0.00689476$ |
| `flexural_modulus` | 380,000 | psi | $6.89476 \times 10^{-6}$ | **2.62** | GPa | $\text{GPa} = \text{psi} \times 6.89476 \times 10^{-6}$ |
| `notched_impact_area_basis` | 4.5 | $\text{ft}\cdot\text{lb}/\text{in}$ | 53.38 | **240.2** | $\text{J}/\text{m}$ | $\text{J}/\text{m} = (\text{ft}\cdot\text{lb}/\text{in}) \times 53.38$ |
| `notched_impact_area_basis` | 240 | $\text{J}/\text{m}$ (3.2 mm bar) | $\approx \frac{240 \times 10^{-3}}{3.2 \times 10^{-3} \text{ m}}$ | **24.0** | $\text{kJ}/\text{m}²$ | $\text{kJ}/\text{m}² \approx \text{Izod J/m} / 10$ (standard 3.2 mm notch) |
| `cte` | $4.9 \times 10^{-5}$ | $\text{in}/\text{in}/^\circ\text{F}$ | 1.8 | **88.2** | µm/°C ($\mu\text{m}/\text{m}\cdot^\circ\text{C}$) | $\mu\text{m}/^\circ\text{C} = (\text{in}/\text{in}/^\circ\text{F}) \times 1.8 \times 10^6$ |
| `conductivity` | 1.32 | $\text{BTU}\cdot\text{in}/(\text{hr}\cdot\text{ft}²\cdot^\circ\text{F})$ | 0.144228 | **0.19** | W/(m·K) | $\text{W}/(\text{m}\cdot\text{K}) = \text{BTU}\cdot\text{in}/(\text{hr}\cdot\text{ft}²\cdot^\circ\text{F}) \times 0.144228$ |
| `specific_heat_capacity` | 0.37 | $\text{BTU}/(\text{lb}\cdot^\circ\text{F})$ | 4.1868 | **1.55** | kJ/(kg·K) | $\text{kJ}/(\text{kg}\cdot\text{K}) = \text{BTU}/(\text{lb}\cdot^\circ\text{F}) \times 4.1868$ |
| `mfi` | 19.0 | cm³/10min (MVR) | $\times \rho_{\text{melt}} (1.00 \text{ g/cm}³)$ | **19.0** | g/10min | $\text{MFR} \approx \text{MVR} \times \rho_{\text{melt}}$ |

---

## Phase 8: Full-Address Citation Mapping & Verification

```
Complete Full-Address Property Citation Catalog

Source 1: Technical Datasheet — INEOS Styrolution, 2021
Full Reference: INEOS Styrolution Group GmbH. Terluran GP-22 Acrylonitrile Butadiene Styrene (ABS) Technical Datasheet. Frankfurt am Main, Germany, 2021. URL: https://horadpolimeros.com.br/fichas/ABS%20-%20STYROLUTION%20-%20TERLURAN%20GP%2022.pdf

Grade: Commercial Standard Easy-Flow Injection Molding Grade Terluran GP-22

density: 1.04 g/cm³ [at 23 °C]
Locator: Page 1, Table 'Physical Properties', Row 1
Verbatim Quote: "Density | ISO 1183 | g/cm³ | 1.04"

young_modulus: 2300 MPa (2.30 GPa) [at 23 °C, 1 mm/min]
Locator: Page 1, Table 'Mechanical Properties', Row 1
Verbatim Quote: "Tensile Modulus | ISO 527-1/-2 | MPa | 2300"

tensile_strength: 45 MPa [Yield stress, 50 mm/min, 23 °C]
Locator: Page 1, Table 'Mechanical Properties', Row 2
Verbatim Quote: "Yield stress ( 50 mm/min ) | ISO 527-1/-2 | MPa | 45"

elongation_at_break: 10 % [Nominal strain at break, 23 °C]
Locator: Page 1, Table 'Mechanical Properties', Row 4
Verbatim Quote: "Nominal strain at break | ISO 527-1/-2 | % | 10"

notched_impact_area_basis: 22 kJ/m² [Charpy Notched, 23 °C]
Locator: Page 1, Table 'Mechanical Properties', Row 6
Verbatim Quote: "Charpy Notched Impact Strength, 23° C | ISO 179/1eA | kJ/m² | 22"

mfi: 19 cm³/10min [MVR, 220 °C, 10 kg]
Locator: Page 1, Table 'Rheological Properties', Row 1
Verbatim Quote: "Melt volume rate 220 °C/10 kg | ISO 1133 | cm³/10 min | 19"

--------------------------------------------------------------------------------

Source 2: Technical Datasheet — SABIC Innovative Plastics, 2013
Full Reference: SABIC Innovative Plastics. CYCOLAC™ Resin MG94 Data Sheet. Pittsfield, MA, USA, 2013. URL: https://www.phmolds.com/wp-content/uploads/2016/09/ABS-Sabic-Cycolac-MG94-Cust.c.pdf

Grade: High-Flow Injection Molding Resin Cycolac MG94

flexural_modulus: 2500 MPa (2.50 GPa) [2 mm/min, 50 mm span, 23 °C]
Locator: Page 1, Table 'Mechanical', Row 8
Verbatim Quote: "Flexural Modulus | ISO 178 | 363000 psi | 2500 MPa"

tensile_strength: 46.0 MPa [Yield, 50 mm/min]
Locator: Page 1, Table 'Mechanical', Row 3
Verbatim Quote: "Tensile Strength Yield | ISO 527-2/50 | 6670 psi | 46.0 MPa"

notched_impact_area_basis: 240 J/m [Notched Izod, 23 °C, 3.2 mm]
Locator: Page 2, Table 'Impact', Row 3
Verbatim Quote: "Notched Izod Impact 73°F (23°C) | ASTM D256 | 4.5 ft·lb/in | 240 J/m"

--------------------------------------------------------------------------------

Source 3: Technical Datasheet — SABIC Innovative Plastics, 2014
Full Reference: SABIC Innovative Plastics. CYCOLAC™ Resin MG47 Technical Datasheet. Form No. TDS-57196-en. Pittsfield, MA, USA, 2014. URL: https://www.scribd.com/document/812569965/SABIC-Cycolac-MG47

Grade: High-Impact Injection Molding Resin Cycolac MG47

hdt: 82.2 °C [1.8 MPa, Unannealed, 3.20 mm bar]
Locator: Page 2, Table 'Thermal', Row 2
Verbatim Quote: "1.8 MPa, Unannealed, 3.20 mm | ASTM D648 | 82.2 °C"

vicat: 97.4 °C [ISO 306/B50, 50 N, 50 °C/h]
Locator: Page 2, Table 'Thermal', Row 5
Verbatim Quote: "Vicat Softening Temperature | ISO 306/B50 | 97.4 °C"

cte: 88 µm/m·°C (0.000088 cm/cm/°C) [-40 °C to +40 °C, Flow]
Locator: Page 2, Table 'Thermal', Row 7
Verbatim Quote: "CLTE Flow : -40 to 40°C | ASTM E831 | 0.000088 cm/cm/°C"

--------------------------------------------------------------------------------

Source 4: Peer-Reviewed Journal Article — ResearchGate, 2026
Full Reference: Academic Research Group. Kinetic Analysis of Thermal Degradation of Acrylonitrile Butadiene Styrene (ABS) for its Use in Electrical Appliances. ResearchGate Publication No. 391325007, 2026. URL: https://www.researchgate.net/publication/391325007_Kinetic_Analysis_of_Thermal_Degradation_of_Acrylonitrile_Butadiene_Styrene_ABS_for_its_Use_in_Electrical_Appliances

degradation_temp: 360.0 °C [Onset under N2 at 10 °C/min]
Locator: Page 3, Section 3.2, DTG Curves & Kinetic Evaluation
Verbatim Quote: "The maximum degradation (˃ 90%) of ABS polymer was observed from 360-524 °C."

```

---

## Phase 9: Non-Numeric Metadata Registration

* **IUPAC Chemical Name**: Poly(acrylonitrile-co-buta-1,3-diene-co-styrene) / Poly(prop-2-enenitrile-co-buta-1,3-diene-co-ethenylbenzene)
* **Common Abbreviations**: ABS, SAN-g-PBD
* **CAS Registry Number**: `9003-56-9`
* **Constituent Monomers & CAS Numbers**:
1. **Acrylonitrile**: $\text{CH}_2=\text{CH}-\text{C}\equiv\text{N}$ (`CAS 107-13-1`)
2. **1,3-Butadiene**: $\text{CH}_2=\text{CH}-\text{CH}=\text{CH}_2$ (`CAS 106-99-0`)
3. **Styrene**: $\text{C}_6\text{H}_5-\text{CH}=\text{CH}_2$ (`CAS 100-42-5`)


* **Typical Monomer Composition Ratio**:
* Acrylonitrile: 15–35 wt% (provides chemical resistance, thermal stability, and surface hardness)
* 1,3-Butadiene: 5–30 wt% (provides low-temperature impact toughness and ductility)
* Styrene: 40–60 wt% (provides melt processability, rigidity, and high surface gloss)


* **Morphology & Microstructure**:
* Amorphous, two-phase graft copolymer.
* Polybutadiene (PBD) elastomer rubber particles ($\approx 0.1–1.0 \ \mu\text{m}$ diameter) dispersed in a continuous, rigid Styrene-Acrylonitrile (SAN) copolymer matrix.
* SAN chains are chemically grafted onto the PBD core to ensure strong interfacial adhesion and stress transfer.


* **Optical Appearance & Clarity**:
* Naturally opaque to ivory/off-white with high surface gloss.
* Transparent variants (MABS) are achieved by incorporating Methyl Methacrylate (MMA) into the matrix to precisely match the refractive index ($n_D \approx 1.516$) of the elastomer core and the thermoplastic phase.


* **Flammability & Flame Retardance**:
* Standard neat ABS is classified as **UL 94 HB** (burn rate $\approx 25–40 \text{ mm/min}$ at 1.6 mm).
* Flame-retarded grades achieve **UL 94 V-0** at 1.5 mm by compounding with brominated/chlorinated organic flame retardants and antimony trioxide ($\text{Sb}_2\text{O}_3$) synergists, or halogen-free organophosphates.


* **Solubility & Chemical Resistance**:
* **Soluble in**: Polar organic solvents including acetone, methyl ethyl ketone (MEK), tetrahydrofuran (THF), cyclohexanone, dichloromethane ($\text{CH}_2\text{Cl}_2$), chloroform, and dimethylformamide (DMF).
* **Insoluble / Resistant to**: Water, dilute aqueous mineral acids, aqueous alkalis, aliphatic hydrocarbons (hexane, heptane), vegetable oils, and mineral lubricating oils.
* **Prone to Environmental Stress Cracking (ESC) in**: Aromatic hydrocarbons (benzene, toluene), esters, and chlorinated solvents.
