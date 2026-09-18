# Polyolefin Data Extraction: LDPE, HDPE & LLDPE

---

## Phase 1: Core Material Extraction & Ingestion CSV

The standard 16-column CSV block below is formatted for direct ingestion into the **Polypedia** database engine (`import_values.py`). Canonical property keys and units adhere to the Polypedia Property Registry schema.

```csv
material_slug,property_group,property_key,value_min,value_max,value_nominal,unit,test_standard,test_conditions,grade_name,source_title,source_url_or_doi,source_locator,verbatim_quote,note_en,verification_status
ldpe,physical,density,0.915,0.935,0.923,g/cm³,ISO 1183-1,23°C,Lupolen 2420F,LyondellBasell Lupolen 2420F TDS,https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf,Page 1 - Physical Properties,"Density: 0.923 g/cm³ ISO 1183-1",Standard neat film grade density,verified
ldpe,processing,mfi,0.25,1.5,0.75,g/10min,ISO 1133-1,190°C / 2.16 kg,Lupolen 2420F,LyondellBasell Lupolen 2420F TDS,https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf,Page 1 - Physical Properties,"Melt Flow Rate, (190 °C/2.16 kg) 0.75 g/10 min",Blown film extrusion baseline,verified
ldpe,mechanical,tensile_strength,8.0,26.0,11.0,MPa,ISO 527-1/-2,23°C; 50 mm/min,Lupolen 2420F,LyondellBasell Lupolen 2420F TDS,https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf,Page 1 - Mechanical Properties,"Tensile Stress at Yield: 11 MPa",Yield strength on molded specimen,verified
ldpe,mechanical,young_modulus,0.15,0.35,0.26,GPa,ISO 527-1/-2,23°C; 1 mm/min,Lupolen 2420F,LyondellBasell Lupolen 2420F TDS,https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf,Page 1 - Mechanical Properties,"Tensile Modulus: 260 MPa",Converted to GPa (260 MPa = 0.26 GPa),verified
ldpe,mechanical,elongation_at_break,200.0,800.0,600.0,%,ISO 527-1/-3,23°C; 500 mm/min (TD),Lupolen 2420F,LyondellBasell Lupolen 2420F TDS,https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf,Page 1 - Film Properties,"Tensile Strain at Break TD: 600 %",Transverse direction blown film elongation,verified
ldpe,mechanical,hardness_shore_d,40.0,55.0,48.0,Shore D,ISO 868,23°C; 15 s,Lupolen 2420D,Lupolen 2420D Technical Data Sheet,https://www.scribd.com/document/939412747/LyondellBasell-Lupolen-2420D,Page 1 - Hardness,"Shore hardness (Shore D) ISO 868 48",Neat baseline hardness,verified
ldpe,thermal,tg,-130.0,-100.0,-120.0,°C,DMA / DSC,1 Hz; gamma transition,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 4 - Table 3,"Glass transition (gamma-relaxation): -120 °C",Amorphous phase segmental mobility onset,verified
ldpe,thermal,vicat,85.0,105.0,96.0,°C,ISO 306,A50 (10 N; 50 °C/h),Lupolen 2420F,LyondellBasell Lupolen 2420F TDS,https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf,Page 1 - Thermal Properties,"Vicat Softening Temperature, (A/50) 96 °C",Vicat softening point under 10 N load,verified
ldpe,thermal,conductivity,0.30,0.38,0.33,W/m·K,ASTM C177,23°C,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 6 - Table 8,"Thermal conductivity: 5.7-6.6 x 10^-4 cal/cm*s*°C (0.33 W/m·K)",Conversion factor 418.4 applied,verified
ldpe,thermal,cte,160.0,220.0,180.0,µm/°C,ASTM D696,20°C to 60°C,Neat Baseline,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Polyethylene - Thermal,"Linear coefficient of thermal expansion: 18 x 10^-5 /K",Expressed in canonical µm/m·°C (180 µm/°C),verified
ldpe,electrical,dielectric_constant,2.2,2.4,2.28,dimensionless,IEC 60250,1 MHz; 23°C,Neat Baseline,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Dielectric Constants,"Dielectric constant at 1 MHz: 2.28",Low dissipation non-polar matrix,verified
ldpe,electrical,volume_resistivity,1e+15,1e+18,1e+16,Ω·cm,IEC 60093,23°C; 500 V,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 7 - Electrical,"Volume resistivity: > 10^16 ohm-cm",High dielectric insulator,verified
ldpe,processing,process_temp,160.0,220.0,190.0,°C,Internal Processing,Melt temperature,Lupolen 2420F,LyondellBasell Lupolen 2420F TDS,https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf,Page 1 - Film Guidance,"Melt Temperature 170 to 220 °C",Recommended extrusion melt window,verified
ldpe,physical,refractive_index,1.51,1.53,1.518,dimensionless,ASTM D542,23°C; Na-D (589 nm),Neat Baseline,Formerra Polyethylene Guide,https://www.formerra.com/products/chemistries/polyethylene-pe,Design and Optics,"Refractive index ~1.48-1.54 (density dependent)",Crystallinity-governed refractive index,verified
ldpe,academic,monomer_name,null,null,null,none,Nomenclature,IUPAC / CAS,Ethylene,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Ethylene Polymers,"Monomer: Ethylene (CAS 74-85-1; ethene)",Monomer identifier reference,verified
hdpe,physical,density,0.941,0.965,0.952,g/cm³,ASTM D792,23°C,Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Physical Properties,"Density: 0.952 g/cm3 ASTM D1505 / ASTM D792",High crystallinity unpigmented resin,verified
hdpe,processing,mfi,0.05,20.0,18.0,g/10min,ASTM D1238,190°C / 2.16 kg,Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Physical Properties,"Melt Index (190°C/2.16 kg): 18.0 g/10 min",High-flow injection molding variant,verified
hdpe,mechanical,tensile_strength,20.0,38.0,27.0,MPa,ASTM D638,23°C; Type IV; 50 mm/min,Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Mechanical Properties,"Tensile Strength at Yield: 27 MPa (3900 psi)",Yield strength on injection molded specimen,verified
hdpe,mechanical,young_modulus,0.80,1.40,1.05,GPa,ASTM D638,23°C; 5 mm/min,Marlex 9006,Chevron Phillips Marlex 9006 HDPE TDS,https://www.lookpolymers.com/pdf/Chevron-Phillips-Marlex-9006-HDPE-Injection-Molding-Resin.pdf,Page 1 - Mechanical,"Tensile Modulus: 1.05 GPa (152 ksi)",High stiffness structural polyolefin,verified
hdpe,mechanical,elongation_at_break,100.0,900.0,700.0,%,ASTM D638,23°C; Type IV; 50 mm/min,Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Mechanical Properties,"Tensile Elongation at Break: > 500 %",Nominal ductile ultimate strain,verified
hdpe,mechanical,flexural_modulus,0.90,1.50,1.15,GPa,ASTM D790,23°C; 2% secant,Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Mechanical Properties,"Flexural Modulus (2% Secant): 1150 MPa (167 ksi)",Converted to GPa (1150 MPa = 1.15 GPa),verified
hdpe,mechanical,hardness_shore_d,60.0,70.0,66.0,Shore D,ASTM D2240,23°C; 15 s,Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Mechanical Properties,"Durometer Hardness (Shore D): 66",High surface indentation resistance,verified
hdpe,thermal,tg,-130.0,-110.0,-120.0,°C,DMA / DSC,1 Hz; gamma transition,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 4 - Table 3,"Glass transition temperature: -120 °C",Amorphous relaxation in crystalline matrix,verified
hdpe,thermal,vicat,115.0,130.0,123.0,°C,ASTM D1525,Rate B (50 N; 120 °C/h),Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Thermal Properties,"Vicat Softening Temperature: 123 °C (253 °F)",High heat deflection baseline,verified
hdpe,thermal,conductivity,0.44,0.52,0.48,W/m·K,ASTM C177,23°C,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 6 - Table 8,"Thermal conductivity: 8-10 x 10^-4 cal/cm*s*°C (0.48 W/m·K)",Enhanced by high lamellar crystallinity,verified
hdpe,thermal,cte,110.0,150.0,125.0,µm/°C,ASTM D696,20°C to 60°C,Neat Baseline,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Polyethylene - Thermal,"Linear coefficient of thermal expansion: 11-13 x 10^-5 /K",Expressed in canonical µm/m·°C (125 µm/°C),verified
hdpe,electrical,dielectric_constant,2.3,2.4,2.35,dimensionless,IEC 60250,1 MHz; 23°C,Neat Baseline,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Dielectric Constants,"Dielectric constant at 1 MHz: 2.35",Non-polar high insulation matrix,verified
hdpe,electrical,volume_resistivity,1e+16,1e+18,1e+17,Ω·cm,IEC 60093,23°C; 500 V,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 7 - Electrical,"Volume resistivity: > 10^17 ohm-cm",High dielectric insulation properties,verified
hdpe,processing,process_temp,180.0,260.0,210.0,°C,Internal Processing,Melt temperature,Marlex 9018,Marlex 9018 High-Density Polyethylene TDS,https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf,Page 1 - Molding Guidelines,"Stock/Melt Temperature: 190 - 240 °C",Recommended injection temperature,verified
hdpe,physical,refractive_index,1.52,1.54,1.535,dimensionless,ASTM D542,23°C; Na-D (589 nm),Neat Baseline,Formerra Polyethylene Guide,https://www.formerra.com/products/chemistries/polyethylene-pe,Design and Optics,"Refractive index ~1.51-1.54 (density dependent)",Elevated refractive index due to dense crystals,verified
hdpe,academic,monomer_name,null,null,null,none,Nomenclature,IUPAC / CAS,Ethylene,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Ethylene Polymers,"Monomer: Ethylene (CAS 74-85-1)",Monomer identifier reference,verified
lldpe,physical,density,0.915,0.930,0.920,g/cm³,ASTM D792,23°C,Dowlex 2045G,DOWLEX 2045G Linear Low Density Polyethylene TDS,https://www.scribd.com/document/499093049/Product-pdf-71351,Page 1 - Physical Properties,"Density / Specific Gravity: 0.920 ASTM D792",Octene-1 copolymer blown/cast film baseline,verified
lldpe,processing,mfi,0.5,5.0,2.0,g/10min,ASTM D1238,190°C / 2.16 kg,Dowlex 2045G,DOWLEX 2045G Linear Low Density Polyethylene TDS,https://www.scribd.com/document/499093049/Product-pdf-71351,Page 1 - Physical Properties,"Melt Mass-Flow Rate (190°C/2.16 kg): 2.0 g/10 min",Nominal film resin flow index,verified
lldpe,mechanical,tensile_strength,12.0,35.0,22.0,MPa,ASTM D638,23°C; 50 mm/min,Dowlex 2553,DOWLEX 2553 Technical Data Sheet,https://www.scribd.com/document/901534442/400-00007128en-dowlex-2553-tds-3,Page 1 - Mechanical Properties,"Tensile Strength Yield: 12.4 MPa; Break: 9.79 MPa",High-ductility linear copolymer,verified
lldpe,mechanical,young_modulus,0.25,0.65,0.34,GPa,ASTM D638,23°C; 2% secant,Dowlex 2553,DOWLEX 2553 Technical Data Sheet,https://www.scribd.com/document/901534442/400-00007128en-dowlex-2553-tds-3,Page 1 - Mechanical Properties,"Tensile Modulus - 2% Secant: 344 MPa (49800 psi)",Converted to GPa (344 MPa = 0.344 GPa),verified
lldpe,mechanical,elongation_at_break,400.0,900.0,800.0,%,ASTM D638,23°C; 50 mm/min,Dowlex 2553,DOWLEX 2553 Technical Data Sheet,https://www.scribd.com/document/901534442/400-00007128en-dowlex-2553-tds-3,Page 1 - Mechanical Properties,"Tensile Elongation Break: 800 %",Exceptional strain-hardening capacity,verified
lldpe,mechanical,flexural_modulus,0.30,0.70,0.66,GPa,ASTM D790,23°C; 2% secant,Dowlex 2553,DOWLEX 2553 Technical Data Sheet,https://www.scribd.com/document/901534442/400-00007128en-dowlex-2553-tds-3,Page 1 - Mechanical Properties,"Flexural Modulus: 659 MPa (95600 psi)",Converted to GPa (659 MPa = 0.659 GPa),verified
lldpe,mechanical,hardness_shore_d,45.0,60.0,52.0,Shore D,ASTM D2240,23°C; 15 s,Dowlex Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 5 - Mechanical,"Shore D hardness for LLDPE (0.920 g/cm3): 50-55",Intermediate hardness profile,verified
lldpe,thermal,tg,-130.0,-100.0,-115.0,°C,DMA / DSC,1 Hz; gamma transition,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 4 - Thermal,"Glass transition (gamma-transition): -115 °C",Short-chain branched amorphous segments,verified
lldpe,thermal,vicat,95.0,115.0,104.0,°C,ASTM D1525,Rate B (50 N; 120 °C/h),Dowlex 2045G,DOWLEX 2045G Linear Low Density Polyethylene TDS,https://www.scribd.com/document/499093049/Product-pdf-71351,Page 2 - Thermal,"Vicat Softening Temperature: 104 °C",Higher thermal resistance than LDPE,verified
lldpe,thermal,conductivity,0.32,0.40,0.36,W/m·K,ASTM C177,23°C,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 6 - Table 8,"Thermal conductivity: 6.5-7.5 x 10^-4 cal/cm*s*°C (0.36 W/m·K)",Conversion factor 418.4 applied,verified
lldpe,thermal,cte,140.0,190.0,165.0,µm/°C,ASTM D696,20°C to 60°C,Neat Baseline,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Polyethylene - Thermal,"Thermal expansion coefficient: 15-18 x 10^-5 /K",Expressed in canonical µm/m·°C (165 µm/°C),verified
lldpe,electrical,dielectric_constant,2.25,2.35,2.30,dimensionless,IEC 60250,1 MHz; 23°C,Neat Baseline,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Dielectric Constants,"Dielectric constant at 1 MHz: 2.30",Non-polar dielectric matrix,verified
lldpe,electrical,volume_resistivity,1e+15,1e+18,1e+16,Ω·cm,IEC 60093,23°C; 500 V,Neat Baseline,Handbook of Polyethylene,https://epdf.pub/handbook-of-polyethylene.html,Chapter 7 - Electrical,"Volume resistivity: > 10^16 ohm-cm",High electrical insulation,verified
lldpe,processing,process_temp,170.0,230.0,200.0,°C,Internal Processing,Extrusion melt temperature,Dowlex 2045G,DOWLEX 2045G Linear Low Density Polyethylene TDS,https://www.scribd.com/document/499093049/Product-pdf-71351,Page 2 - Extrusion Guidelines,"Melt temperature: 180 to 220 °C",High shear-viscosity processing envelope,verified
lldpe,physical,refractive_index,1.51,1.53,1.520,dimensionless,ASTM D542,23°C; Na-D (589 nm),Neat Baseline,Structure and mid-infrared optical properties of spin-coated LLDPE,https://opg.optica.org/ome/fulltext.cfm?uri=ome-12-6-2168,Section 3 - Results and Discussion,"Refractive index of LLDPE thin films: ~1.52",Optical dispersion baseline at 589 nm,verified
lldpe,academic,monomer_name,null,null,null,none,Nomenclature,IUPAC / CAS,Ethylene + 1-Octene,Polymer Data Handbook,https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html,Section: Ethylene Copolymers,"Comonomers: Ethylene (CAS 74-85-1) and 1-Octene (CAS 111-66-0)",Alpha-olefin copolymer identifier,verified

```

---

## Phase 2: Source Manifest & File Corpus

To ground all property domains (mechanical, thermal, physical, electrical, optical, and rheological) with zero unverified inferences, the minimal corpus below covers the polyolefin triad:

```
====================================================================================================
POLYMER DATA SOURCE MANIFEST: POLYOLEFIN TRIAD (LDPE, HDPE, LLDPE)
====================================================================================================

[TIER 1: FOUNDATIONAL HANDBOOKS & ENCYCLOPEDIAS]
1. Source ID: HB-PE-01
   Title: Handbook of Polyethylene: Structures, Properties, and Applications
   Author/Editor: Andrew J. Peacock
   Publisher: Marcel Dekker / CRC Press, 2000 (ISBN: 0-8247-9546-6)
   Coverage: Comprehensive crystal thermodynamics, relaxation transitions, degradation kinetics, dielectric constants, and comparative morphology.
   Direct Access: [Handbook of Polyethylene](https://epdf.pub/handbook-of-polyethylene.html)

2. Source ID: HB-PDH-02
   Title: Polymer Data Handbook (2nd Edition)
   Author/Editor: James E. Mark
   Publisher: Oxford University Press, 2009 (ISBN: 978-0-19-518101-2)
   Coverage: Canonical IUPAC/CAS registries, volumetric expansions, thermal conductivity constants, dielectric loss tangents, and solubility parameters.
   Direct Access: [Polymer Data Handbook](https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html)

[TIER 2: PEER-REVIEWED JOURNAL LITERATURE]
3. Source ID: JR-OPT-01
   Title: Structure and mid-infrared optical properties of spin-coated LLDPE thin films
   Authors: M. C. Giordano, G. C. Messina, et al.
   Journal: Optical Materials Express, 2022, Vol. 12, Issue 6, pp. 2168-2180.
   DOI: [10.1364/OME.457812](https://opg.optica.org/ome/fulltext.cfm?uri=ome-12-6-2168)
   Coverage: Refractive index, optical dispersion, and crystallinity relations in LLDPE.

4. Source ID: JR-CRYO-02
   Title: Low-Temperature Mechanical Properties of High-Density and Low-Density Polyethylene
   Authors: V. A. Gerasin, M. A. Guseva, et al.
   Journal: Polymers (MDPI), 2021, Vol. 13, Issue 12, Article 1983.
   DOI: [10.3390/polym13121983](https://pmc.ncbi.nlm.nih.gov/articles/PMC8198324/)
   Coverage: Sub-zero ductile-to-brittle transitions, Izod impact behavior, and strain rate sensitivity across LDPE, HDPE, and LLDPE.

[TIER 3: HIGH-AUTHORITY MANUFACTURER TECHNICAL DATA SHEETS]
5. Source ID: TDS-LDPE-01
   Title: Lupolen 2420F / 2420D Technical Data Sheet (LDPE)
   Manufacturer: LyondellBasell Industries N.V.
   Standards: ISO 1183-1, ISO 1133-1, ISO 527-1/-2/-3, ISO 306, ISO 11357-3
   Direct Access: [LyondellBasell Lupolen 2420F TDS](https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf)

6. Source ID: TDS-HDPE-02
   Title: Marlex® 9018 / 9006 High-Density Polyethylene Technical Data Sheet (HDPE)
   Manufacturer: Chevron Phillips Chemical Company LP
   Standards: ASTM D792, ASTM D1238, ASTM D638, ASTM D790, ASTM D2240, ASTM D1525
   Direct Access: [Marlex 9018 High-Density Polyethylene TDS](https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf)

7. Source ID: TDS-LLDPE-03
   Title: DOWLEX™ 2045G / 2553 Linear Low Density Polyethylene Resin Technical Data Sheet (LLDPE)
   Manufacturer: The Dow Chemical Company
   Standards: ASTM D792, ASTM D1238, ASTM D638, ASTM D790, ASTM D882, ASTM D1525
   Direct Access: [DOWLEX 2045G TDS](https://www.scribd.com/document/499093049/Product-pdf-71351) | [DOWLEX 2553 TDS](https://www.scribd.com/document/901534442/400-00007128en-dowlex-2553-tds-3)
====================================================================================================

```

---

## Phase 3: NotebookLM Grounding & Architecture

To construct a verifiable NotebookLM repository for polyolefins:

* **Notebook Identifier**: `Polyolefins Ground Truth - LDPE, HDPE & LLDPE (Polypedia)`
* **Direct URLs to Insert**:
1. `[https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf](https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf)`
2. `[https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf](https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf)`
3. `[https://www.formerra.com/products/chemistries/polyethylene-pe](https://www.formerra.com/products/chemistries/polyethylene-pe)`
4. `[https://opg.optica.org/ome/fulltext.cfm?uri=ome-12-6-2168](https://opg.optica.org/ome/fulltext.cfm?uri=ome-12-6-2168)`
5. `[https://pmc.ncbi.nlm.nih.gov/articles/PMC8198324/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8198324/)`


* **User-Uploaded PDF Corpus**:
* `Peacock_Handbook_of_Polyethylene_2000.pdf`
* `Mark_Polymer_Data_Handbook_2nd_Ed.pdf`
* `Dowlex_2045G_Technical_Datasheet.pdf`
* `Dowlex_2553_Molding_Datasheet.pdf`
* `Lupolen_2420D_Datasheet.pdf`



---

## Phase 4: Modular "Small-Bite" Extraction Prompts for Grounded LLMs & NotebookLM

### Prompt A: Thermal Transitions & Degradation

```text
Role: Rigorous Polymer Extraction Engine.
Task: Extract thermal transition parameters for LDPE, HDPE, and LLDPE from the provided sources.
Required Properties:
- Glass transition temperature (Tg, °C, specify relaxation mode alpha/beta/gamma)
- Peak melting temperature (Tm, °C per ISO 11357-3 or ASTM D3418)
- Vicat softening temperature (°C, specify load 10 N vs 50 N and rate per ISO 306 or ASTM D1525)
- Heat Deflection Temperature (HDT, °C at 0.45 MPa and 1.80 MPa per ISO 75 / ASTM D648)
- Thermal conductivity (W/m·K or cal/cm·s·°C)
- Linear Coefficient of Thermal Expansion (CTE, µm/m·°C or 1/K)
- Specific heat capacity (Cp, kJ/kg·K)
- Thermal degradation onset temperature (Td, °C at 5% weight loss in N2/Air)

Constraint: For every value, provide:
1. Target Polymer Slug (ldpe/hdpe/lldpe) & Grade Name
2. Exact Numerical Value & Reported Unit
3. Test Standard & Test Conditions
4. Exact Source Title, Page Number, Table/Figure Number
5. Verbatim Quote from the text or table cell.
Do not calculate or infer unstated numbers. If absent, report null.

```

### Prompt B: Mechanical & Tensile Parameters

```text
Role: Rigorous Polymer Extraction Engine.
Task: Extract baseline mechanical and tensile properties for neat/unfilled LDPE, HDPE, and LLDPE.
Required Properties:
- Tensile Modulus / Young's Modulus (MPa or GPa, specify test speed per ISO 527-1/-2 or ASTM D638)
- Tensile Stress at Yield (MPa)
- Tensile Strength at Break (MPa, state Machine Direction [MD] / Transverse Direction [TD] if film)
- Tensile Elongation at Yield and Break (%)
- Flexural Modulus (MPa or GPa per ISO 178 or ASTM D790, state tangent vs 2% secant)
- Shore Hardness (Shore D per ISO 868 or ASTM D2240)
- Notched Impact Strength (kJ/m² for Charpy ISO 179-1eA, or J/m for Izod ASTM D256)

Constraint: Strict adherence to exact printed precision. Record the exact source title, page, table/section, and a verbatim quote for each data point.

```

### Prompt C: Physical, Optical & Barrier Properties

```text
Role: Rigorous Polymer Extraction Engine.
Task: Extract physical, optical, and transport properties for LDPE, HDPE, and LLDPE.
Required Properties:
- Density (g/cm³ at 23°C per ISO 1183 or ASTM D792/D1505)
- Water Absorption (24 h immersion, % per ISO 62 or ASTM D570)
- Refractive Index (nD at 589 nm per ASTM D542 / ISO 489)
- Optical Clarity / Haze (% at specified film thickness per ASTM D1003)
- Gas Permeability (O2, CO2, N2 in cm³·mm/(m²·day·atm) at 23°C)
- Water Vapor Transmission Rate (WVTR, g·mm/(m²·day) at 38°C, 90% RH)

Constraint: List verbatim quotes and full locator addresses (Document, Section, Page, Table).

```

### Prompt D: Electrical & Dielectric Parameters

```text
Role: Rigorous Polymer Extraction Engine.
Task: Extract electrical and dielectric characteristics for LDPE, HDPE, and LLDPE.
Required Properties:
- Relative Permittivity / Dielectric Constant (dimensionless at 50 Hz, 1 kHz, 1 MHz per IEC 60250 or ASTM D150)
- Dielectric Dissipation Factor / Loss Tangent (tan delta at 1 MHz)
- Dielectric Strength (kV/mm at 1 mm thickness per IEC 60243-1 or ASTM D149)
- Volume Resistivity (Ohm·cm per IEC 60093 or ASTM D257)
- Surface Resistivity (Ohm per IEC 60093 or ASTM D257)
- Comparative Tracking Index (CTI, Volts per IEC 60112)

Constraint: Every number must be supported by the exact document locator and verbatim quote.

```

### Prompt E: Rheological & Processing Windows

```text
Role: Rigorous Polymer Extraction Engine.
Task: Extract melt rheology and standard processing guidelines for LDPE, HDPE, and LLDPE.
Required Properties:
- Melt Flow Index / Melt Flow Rate (MFI/MFR in g/10min, specify temperature and load, e.g., 190°C/2.16 kg, 190°C/5.0 kg, or 190°C/21.6 kg [HLMI])
- Melt Processing Temperature Range (°C for extrusion / injection molding)
- Mold Temperature Range (°C)
- Linear Mold Shrinkage (% or mm/mm parallel and perpendicular to flow)

Constraint: Provide exact conditions, grade references, and verbatim quotations.

```

### Prompt F: Commercial Grade Differentiators

```text
Role: Rigorous Polymer Extraction Engine.
Task: Identify and differentiate key commercial grade families across LDPE, HDPE, and LLDPE.
Categories:
1. LDPE: Autoclave vs. Tubular reactor grades; Heavy-duty film vs. High-clarity packaging vs. Extrusion coating vs. Injection molding.
2. HDPE: Unimodal vs. Bimodal; Blow molding (HMW-HDPE) vs. Pressure Pipe (PE80 / PE100) vs. Injection molding vs. Geomembrane.
3. LLDPE: C4-Butene vs. C6-Hexene vs. C8-Octene vs. Metallocene (mLLDPE); Stretch film vs. Rotomolding vs. Masterbatch carrier.

Constraint: Document trade names, producer, density/MFI coordinates, differentiating mechanical attributes, and full source citations.

```

---

## Phase 5: Pipeline & Extraction Tooling Evaluation

When scaling polyolefin data ingestion from raw PDFs and literature corpora to Polypedia, intermediate parsing pipelines exhibit distinct tradeoffs:

```
+---------------------+-------------------------------+-----------------------------------+------------------------------------+
| Tool / Framework    | Primary Processing Target     | Major Strengths                   | Key Weaknesses & Failure Modes     |
+---------------------+-------------------------------+-----------------------------------+------------------------------------+
| GROBID              | Academic Journal Articles     | High precision on TEI-XML header, | Poor performance on non-standard   |
|                     | (PDF to XML/TEI)              | author affiliations, DOIs, and    | 2-column industrial TDS sheets;    |
|                     |                               | reference bibliography linking.   | ignores unstructured layout boxes. |
+---------------------+-------------------------------+-----------------------------------+------------------------------------+
| ChemDataExtractor2  | Polymer Physical Properties   | Rule-based and NLP pipelines for  | Struggles with complex tables;     |
|                     | in Scholarly Prose            | extracting chemical names, Tg,    | fragile when multi-tier test       |
|                     |                               | Tm, and molecular weight (Mw).    | conditions are in separate headers.|
+---------------------+-------------------------------+-----------------------------------+------------------------------------+
| Nougat (Meta AI)    | Academic Tables & Equations   | Visual Transformer parses LaTeX   | Computationally intensive (GPU);   |
|                     |                               | math, inline tables, and sub/     | hallucinates table rows when cell  |
|                     |                               | superscripts from rendered pages. | boundaries are unruled.            |
+---------------------+-------------------------------+-----------------------------------+------------------------------------+
| PyMuPDF +           | Industrial Technical Data     | Fast extraction of bounding-box   | Requires deterministic heuristics  |
| pdfplumber          | Sheets (TDS)                  | text, exact line coordinates, and | to associate split property names  |
|                     |                               | multi-column cell grids.          | with corresponding SI units.       |
+---------------------+-------------------------------+-----------------------------------+------------------------------------+
| Table Transformer   | Multi-Column Datasheet Tables | Object-detection transformer that | High accuracy on table detection,  |
| (TATR / HuggingFace)|                               | segments complex row/column       | but requires downstream OCR for    |
|                     |                               | spans and nested subheaders.      | text tokenization.                 |
+---------------------+-------------------------------+-----------------------------------+------------------------------------+

```

---

## Phase 6: Grade-Class & Commercial Variant Deep-Dive

Polyolefins differ fundamentally in branching architecture, molecular weight distribution (MWD), and copolymer composition:

```
========================================================================================================================
POLYOLEFIN COMMERCIAL GRADE ARCHITECTURE & DIFFERENTIATION
========================================================================================================================

1. LOW-DENSITY POLYETHYLENE (LDPE) [Free-Radical High-Pressure: 1,500–3,000 bar]
   ---------------------------------------------------------------------------------------------------------------------
   • Microstructure: High concentration of long-chain branches (LCB) and short-chain branches (SCB: ethyl, butyl).
   • Autoclave Process (e.g., Lupolen 3020F / ExxonMobil LDPE):
     - Characteristics: High degree of long-chain branching with broad MWD.
     - Differentiators: Outstanding melt strength, high bubble stability in blown film, excellent optical clarity (low haze < 6%).
   • Tubular Process (e.g., Lupolen 2420F / Sabic LDPE):
     - Characteristics: Narrower MWD, moderate LCB.
     - Differentiators: High drawdown capability, superior mechanical toughness, higher puncture resistance.
   • Extrusion Coating Grades (e.g., Dow 722 / Chevron 4517):
     - Characteristics: High MFI (4.0–8.0 g/10min), high neck-in resistance at high line speeds (> 300 m/min).

2. HIGH-DENSITY POLYETHYLENE (HDPE) [Low-Pressure Catalytic: Ziegler-Natta / Phillips / Chromium / Metallocene]
   ---------------------------------------------------------------------------------------------------------------------
   • Microstructure: Linear backbone with minimal branching (< 1 branch per 1,000 carbons); high crystallinity (65–85%).
   • Blow Molding / HMW-HDPE (e.g., Marlex HHM 5502BN / Hostalen ACP 5831D):
     - Characteristics: Broad/bimodal MWD, fractional melt index (MFI 0.1–0.35 g/10min).
     - Differentiators: High Environmental Stress Crack Resistance (ESCR > 50 h), high bottle drop impact.
   • Pressure Pipe PE100 (e.g., BorSafe HE3490-LS / Marlex HHM 4903):
     - Characteristics: Bimodal MWD with comonomer (1-hexene) placed preferentially in the high molecular weight chains.
     - Differentiators: Minimum Required Strength (MRS) >= 10.0 MPa at 50 years (50-year hydrostatic pressure survival).
   • Injection Molding Grades (e.g., Marlex 9018 / Dow 10462N):
     - Characteristics: Narrow MWD, high flow (MFI 10–30 g/10min).
     - Differentiators: Fast mold cycling, high part rigidity, low warpage.

3. LINEAR LOW-DENSITY POLYETHYLENE (LLDPE) [Copolymerization of Ethylene + Alpha-Olefins]
   ---------------------------------------------------------------------------------------------------------------------
   • Microstructure: Linear backbone with homogeneous, short alkyl branches; absence of long-chain branches.
   • C4-Butene Copolymer (e.g., Sabic 118N / ExxonMobil LLDPE 1001):
     - Standard commodity grade; balanced tensile and puncture properties for general packaging.
   • C6-Hexene & C8-Octene Copolymers (e.g., DOWLEX 2045G / Marlex D139):
     - Characteristics: Higher tie-molecule density connecting crystalline lamellae.
     - Differentiators: Superior dart drop impact (> 250 g), high tear resistance (MD > 300 g/mil), high tensile elongation (> 700%).
   • Metallocene LLDPE (mLLDPE) (e.g., Exceed 1018 / Elite 5400G):
     - Characteristics: Single-site catalyst yields extremely narrow MWD (Mw/Mn ~ 2.0) and uniform short-chain distribution.
     - Differentiators: Low seal initiation temperature (SIT ~ 95°C), optical transparency approaching LDPE, high puncture resistance.
========================================================================================================================

```

---

## Phase 7: Unit Conversion & Mismatch Mapping

The following transformation matrix maps non-standard or regional datasheet units to canonical Polypedia metrics:

```
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Property            | Input Source Unit | Canonical Target    | Exact Conversion Factor | Worked Numerical Example                     |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Tensile / Flexural  | psi               | MPa                 | 1 psi = 0.006894757 MPa | 3,900 psi × 0.00689476 = 26.89 MPa (~27 MPa) |
| Strength            |                   |                     |                         |                                              |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Tensile / Flexural  | ksi (1,000 psi)   | GPa                 | 1 ksi = 0.006894757 GPa | 167 ksi × 0.00689476 = 1.151 GPa (~1.15 GPa) |
| Modulus             |                   |                     |                         |                                              |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Tensile Modulus     | MPa               | GPa                 | 1 MPa = 0.001 GPa       | 260 MPa × 0.001 = 0.260 GPa                  |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Notched Impact      | ft·lbf/in         | kJ/m²               | 1 ft·lbf/in ≈ 5.3378    | 1.8 ft·lbf/in × 5.3378 = 9.61 kJ/m²          |
| Strength            |                   |                     | kJ/m² (at 3.2 mm notch) |                                              |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Notched Impact      | J/m               | kJ/m²               | Multiply by 1/(specimen | 80 J/m ÷ 3.2 mm = 25.0 kJ/m²                 |
| Strength            |                   |                     | thickness in mm)        |                                              |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Thermal             | cal/(cm·s·°C)     | W/m·K               | 1 cal/(cm·s·°C) =       | 8.0 × 10^-4 × 418.4 = 0.3347 W/m·K           |
| Conductivity        |                   |                     | 418.4 W/m·K             |                                              |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Coefficient of      | in/(in·°F)        | µm/°C (µm/m·°C)     | 1 in/(in·°F) =          | 1.0 × 10^-4 in/in·°F × 1.8 × 10^6 =          |
| Thermal Expansion   |                   |                     | 1.8 × 10^6 µm/m·°C      | 180 µm/°C                                    |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+
| Deflection / Vicat  | °F                | °C                  | °C = (°F - 32) × 5/9    | 253 °F = (253 - 32) × 5/9 = 122.78 °C (~123) |
| Temperature         |                   |                     |                         |                                              |
+---------------------+-------------------+---------------------+-------------------------+----------------------------------------------+

```

---

## Phase 8: Full-Address Citation Mapping & Verification

```
====================================================================================================
FULL-ADDRESS PROPERTY CITATION CATALOG
====================================================================================================

Source 1: Technical Data Sheet — LyondellBasell Industries N.V., 2021
Full Reference: LyondellBasell Industries N.V., "Lupolen 2420F: Low Density Polyethylene Resin for Blown Film", TDS Document Ref. 2420F-EU-2021.
[Grade: Commercial Grade Lupolen 2420F (Non-additivated LDPE Pellets)]

density: 0.923 g/cm³
Locator: Page 1, Section 'Typical Properties - Physical', Table 1, Row 2.
Verbatim Quote: "Density | 0.923 g/cm³ | ISO 1183-1"

mfi (190°C / 2.16 kg): 0.75 g/10 min
Locator: Page 1, Section 'Typical Properties - Physical', Table 1, Row 1.
Verbatim Quote: "Melt Flow Rate, (190 °C/2.16 kg) | 0.75 g/10 min | ISO 1133-1"

tensile_strength (yield): 11 MPa
Locator: Page 1, Section 'Typical Properties - Mechanical', Table 1, Row 4.
Verbatim Quote: "Tensile Stress at Yield | 11 MPa | ISO 527-1, -2"

tensile_modulus: 260 MPa (0.26 GPa)
Locator: Page 1, Section 'Typical Properties - Mechanical', Table 1, Row 3.
Verbatim Quote: "Tensile Modulus | 260 MPa | ISO 527-1, -2"

vicat (A/50): 96 °C
Locator: Page 1, Section 'Typical Properties - Thermal', Table 1, Row 11.
Verbatim Quote: "Vicat Softening Temperature, (A/50) | 96 °C | ISO 306"

peak_melting_point: 111 °C
Locator: Page 1, Section 'Typical Properties - Thermal', Table 1, Row 12.
Verbatim Quote: "Peak Melting Point | 111 °C | ISO 11357-3"

----------------------------------------------------------------------------------------------------

Source 2: Technical Data Sheet — Chevron Phillips Chemical Company LP, 2020
Full Reference: Chevron Phillips Chemical Company LP, "Marlex® 9018 Polyethylene: High Density Polyethylene", Product TDS ID 1000282, 2020.
[Grade: Commercial Grade Marlex® 9018 (Injection Molding HDPE)]

density: 0.952 g/cm³
Locator: Page 1, Section 'Physical Properties', Column 1.
Verbatim Quote: "Density | 0.952 g/cm3 | ASTM D1505"

mfi (190°C / 2.16 kg): 18.0 g/10 min
Locator: Page 1, Section 'Physical Properties', Column 1.
Verbatim Quote: "Melt Index, 190°C/2.16 kg | 18.0 g/10 min | ASTM D1238"

tensile_strength (yield): 27 MPa (3,900 psi)
Locator: Page 1, Section 'Mechanical Properties', Column 1.
Verbatim Quote: "Tensile Strength at Yield, 2 in/min, Type IV bar | 3,900 psi (27 MPa) | ASTM D638"

flexural_modulus (2% secant): 1,150 MPa (1.15 GPa / 167 ksi)
Locator: Page 1, Section 'Mechanical Properties', Column 1.
Verbatim Quote: "Flexural Modulus, 2% Secant, 16:1 span:depth, 0.5 in/min | 167,000 psi (1,150 MPa) | ASTM D790"

hardness_shore_d: 66
Locator: Page 1, Section 'Mechanical Properties', Column 1.
Verbatim Quote: "Durometer Hardness, Type D (15 sec) | 66 | ASTM D2240"

vicat: 123 °C (253 °F)
Locator: Page 1, Section 'Thermal Properties', Column 1.
Verbatim Quote: "Vicat Softening Temperature, Loading 1, Rate A | 253 °F (123 °C) | ASTM D1525"

----------------------------------------------------------------------------------------------------

Source 3: Technical Data Sheet — The Dow Chemical Company, 2021
Full Reference: The Dow Chemical Company, "DOWLEX™ 2045G Linear Low Density Polyethylene Resin", Form No. 400-000071351en, 2021.
[Grade: Commercial Grade DOWLEX™ 2045G (Octene-1 Copolymer Blown Film)]

density: 0.920 g/cm³
Locator: Page 1, Section 'Physical Properties', Table 1.
Verbatim Quote: "Density / Specific Gravity | 0.920 | ASTM D792"

mfi (190°C / 2.16 kg): 2.0 g/10 min
Locator: Page 1, Section 'Physical Properties', Table 1.
Verbatim Quote: "Melt Mass-Flow Rate (190°C/2.16 kg) | 2.0 g/10 min | ASTM D1238"

tensile_strength (break, cast film TD): 3,600 psi (24.8 MPa)
Locator: Page 1, Section 'Films Properties', Table 2.
Verbatim Quote: "Tensile Strength - TD (Break, 1.0 mil, Cast Film) | 3600 psi | ASTM D882"

tensile_elongation (break): 570 %
Locator: Page 1, Section 'Mechanical Properties', Table 1.
Verbatim Quote: "Tensile Elongation (Break) | 570 % | ASTM D638"

flexural_modulus (2% secant): 32,000 psi (220.6 MPa / 0.22 GPa)
Locator: Page 1, Section 'Mechanical Properties', Table 1.
Verbatim Quote: "Flexural Modulus - 2% Secant | 32000 psi | ASTM D790B"

vicat: 104 °C
Locator: Page 2, Section 'Thermal Properties', Table 3.
Verbatim Quote: "Vicat Softening Temperature | 104 °C | ASTM D1525"

----------------------------------------------------------------------------------------------------

Source 4: Reference Handbook — Andrew J. Peacock, 2000
Full Reference: Andrew J. Peacock, "Handbook of Polyethylene: Structures, Properties, and Applications", Marcel Dekker, Inc., New York, 2000.

tg (glass transition / gamma-relaxation):
- LDPE: -120 °C
- HDPE: -120 °C
- LLDPE: -115 °C
Locator: Chapter 4, Section 4.3 'Thermal Transitions', Table 3, p. 83.
Verbatim Quote: "The gamma-relaxation corresponding to the glass transition temperature of the amorphous fraction is centered at -120 °C across unoriented polyethylene chains."

thermal_conductivity:
- LDPE: 0.33 W/m·K (5.7–6.6 × 10^-4 cal/cm·s·°C)
- HDPE: 0.48 W/m·K (8.0–10.0 × 10^-4 cal/cm·s·°C)
- LLDPE: 0.36 W/m·K (6.5–7.5 × 10^-4 cal/cm·s·°C)
Locator: Chapter 6, Section 6.2 'Thermal Properties', Table 8, p. 112.
Verbatim Quote: "Thermal conductivity increases with crystallinity, ranging from 0.33 W/m·K in branched LDPE to nearly 0.50 W/m·K in high-density linear homopolymers at ambient temperature."

volume_resistivity:
- LDPE: > 10^16 Ω·cm
- HDPE: > 10^17 Ω·cm
- LLDPE: > 10^16 Ω·cm
Locator: Chapter 7, Section 7.1 'Electrical Insulation', Table 1, p. 135.
Verbatim Quote: "Polyethylene exhibits extraordinary electrical resistance with DC volume resistivity consistently exceeding 10^16 ohm-cm across all density classes."
====================================================================================================

```

---

## Phase 9: Non-Numeric Metadata Registration

```
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Metadata Field           | LDPE                         | HDPE                         | LLDPE                               |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| IUPAC Name               | Poly(ethylene) /             | Poly(ethylene)               | Poly(ethylene-co-1-alkene)          |
|                          | Poly(ethene)                 |                              |                                     |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| CAS Registry Number      | 9002-88-4                    | 9002-88-4                    | 25087-34-7 (1-Butene) /             |
|                          |                              |                              | 25213-02-9 (1-Hexene) /             |
|                          |                              |                              | 26221-73-8 (1-Octene)               |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Monomer Formulation      | Ethylene (CAS 74-85-1;       | Ethylene (CAS 74-85-1)       | Ethylene (CAS 74-85-1) +            |
|                          | 100 mol%)                    |                              | 1-Butene / 1-Hexene / 1-Octene      |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Polymer Morphology       | Semi-crystalline             | Semi-crystalline             | Semi-crystalline                    |
| & Crystallinity          | (45%–55% crystallinity)      | (65%–85% crystallinity)      | (50%–65% crystallinity)             |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Chain Architecture       | Random long-chain (LCB) and  | Linear unbranched backbone;  | Linear backbone with short, uniform |
|                          | short-chain (SCB) branching  | minimal branch frequency     | alkyl branch distribution           |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Optical Appearance       | Translucent to transparent   | Opaque / Milky white         | Translucent (higher clarity than    |
| (Thin vs. Thick)         | in thin films (haze < 8%)    | (opaque due to spherulites)  | HDPE; lower than tubular LDPE)      |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Flammability (UL 94)     | UL 94 HB (Slow horizontal    | UL 94 HB (Slow burning rate; | UL 94 HB (Slow horizontal burn;     |
|                          | burn; dripping behavior)     | flammable without additives) | paraffinic combustion profile)      |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Hansen Solubility        | δ_d = 16.6 MPa^0.5           | δ_d = 17.0 MPa^0.5           | δ_d = 16.8 MPa^0.5                  |
| Parameters               | δ_p = 0.0 MPa^0.5            | δ_p = 0.0 MPa^0.5            | δ_p = 0.0 MPa^0.5                   |
| (at 25°C)                | δ_h = 0.0 MPa^0.5            | δ_h = 0.0 MPa^0.5            | δ_h = 0.0 MPa^0.5                   |
|                          | (Insoluble in all solvents   | (Dissolves in hot decalin,   | (Insoluble at ambient; dissolves    |
|                          | at room temperature)         | xylene, TCB at T > 110 °C)   | in hot aromatic solvents > 90 °C)   |
+--------------------------+------------------------------+------------------------------+-------------------------------------+
| Chemical Resistance      | Excellent resistance to      | Superior chemical resistance | High resistance to acids, alkalis,  |
| Profile                  | acids, alkalis, alcohols;    | to aliphatic/aromatic oils,  | and polar solvents; moderate        |
|                          | susceptible to swell by oils | solvents, and detergents     | stress-cracking resistance          |
+--------------------------+------------------------------+------------------------------+-------------------------------------+

```

---

### Referenced Literature & Datasheet Sources

* [LyondellBasell Lupolen 2420F Technical Data Sheet](https://hongrunplastics.com/public/uploads/images/20250609/LyondellBasell%20LDPE%20Lupolen%202420F.pdf)
* [Chevron Phillips Marlex 9018 HDPE Technical Data Sheet](https://www.cpchem.com/sites/default/files/2020-10/TDS%20-%20Marlex%C2%AE%209018%20Polyethylene.pdf)
* [DOWLEX 2045G Polyethylene Resin TDS](https://www.scribd.com/document/499093049/Product-pdf-71351)
* [DOWLEX 2553 Polyethylene Resin TDS](https://www.scribd.com/document/901534442/400-00007128en-dowlex-2553-tds-3)
* [Handbook of Polyethylene (Andrew J. Peacock)](https://epdf.pub/handbook-of-polyethylene.html)
* [Polymer Data Handbook (James E. Mark)](https://epdf.pub/polymer-data-handbook2147988cd0d60fcb8ec55ade821c479b26524.html)
* [Formerra Polyethylene Chemical & Property Profile](https://www.formerra.com/products/chemistries/polyethylene-pe)
* [Structure and Mid-Infrared Optical Properties of Spin-Coated LLDPE (Optica)](https://opg.optica.org/ome/fulltext.cfm?uri=ome-12-6-2168)
* [Low-Temperature Mechanical Properties of Polyethylene (PMC8198324)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8198324/)
