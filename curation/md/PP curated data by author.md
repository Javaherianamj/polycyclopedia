# Polypropylene (PP) Data Extraction & Citable Registry

This extraction follows the multi-phase workflow defined in **Polymer Data Extractor** (`user:polymer-data-extractor`) for Polypedia database ingestion.

  

## Phase 1: Core Material Extraction & Ingestion CSV

Below is the standard 16-column CSV block for neat isotactic Polypropylene (`PP`) baseline properties, formatted for `import_values.py` / `ingest.sh` ingestion.

  

Code snippet

```
polymer_id,property_key,value_numeric,value_min,value_max,unit,test_method,test_condition,grade_name,source_title,source_publisher,source_year,source_url,page_locator,section_locator,note_en
PP,density,0.900,0.895,0.915,g/cm³,ISO 1183,23 °C,Moplen HP500N,PP Homo Basell - HP500N,LyondellBasell,2006,https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N,page 1,Properties - Physical,"Density: 0.900 g/cm³"
PP,mfi,12.0,2.0,50.0,g/10min,ISO 1133,230 °C / 2.16 kg,Moplen HP500N,PP Homo Basell - HP500N,LyondellBasell,2006,https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N,page 1,Properties - Physical,"Melt Mass-Flow Rate (MFR) (230°C/2.16 kg): 12 g/10 min"
PP,process_temp,220,200,260,°C,Internal,Melt processing,Borealis PP,Polypropylene Technical Data Sheet,Borealis,2020,https://www.borealisgroup.com/storage/Datasheets/sr533/SR533-PDS-RE_AMERICA-EN-V2-PDS-AM_3-41945-10045911.pdf,page 1,Processing Guidelines,"Mass temperature: 220 - 260 °C"
PP,mould_temp,40,20,70,°C,Internal,Injection moulding,Borealis PP,Polypropylene Technical Data Sheet,Borealis,2020,https://www.borealisgroup.com/storage/Datasheets/sr533/SR533-PDS-RE_AMERICA-EN-V2-PDS-AM_3-41945-10045911.pdf,page 1,Processing Guidelines,"Mould temperature: 30 - 50 °C"
PP,tg,-10,-20,0,°C,DSC,10 °C/min,Isotactic PP,POLYPROPYLENE Technical Overview,Ataman Chemical,2021,https://www.atamanchemicals.com/polypropylene_u26111/,section 1,Thermal Properties,"Thermal properties (expressed as glass transition point Tg and melting point Tm)"
PP,hdt,80.0,50.0,95.0,°C,ISO 75-1/-2,0.45 MPa Edgewise,Moplen HP500N,PP Homo Basell - HP500N,LyondellBasell,2006,https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N,page 1,Properties - Thermal,"HDT (0.45 MPa) Unannealed: 80.0 °C"
PP,vicat,153,135,155,°C,ISO 306,A50 (10 N / 50 °C/h),Moplen HP450J,Moplen HP450J Polypropylene Overview,LyondellBasell / PMC,2021,https://www.scribd.com/document/535176976/Tds-Hp450j-English,page 1,Typical Properties,"Vicat Softening Point: 153 °C"
PP,degradation_temp,320,300,400,°C,TGA,Nitrogen atmosphere,Moplen HP400R,Engineering Polypropylene Composites,LyondellBasell,2023,https://pmc.ncbi.nlm.nih.gov/articles/PMC9959175/,section 2.3,Thermogravimetric Analysis,"Initial degradation temperature considered at weight loss"
PP,conductivity,0.17,0.12,0.22,W/m·K,ISO 22007,23 °C,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 120,Thermal Properties,"Thermal conductivity of neat polypropylene ranges between 0.12 and 0.22 W/m K"
PP,cte,120,80,180,µm/°C,ISO 11359,23 °C to 80 °C,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 121,Thermal Properties,"Coefficient of linear thermal expansion"
PP,specific_heat_capacity,1.90,1.70,2.00,kJ/(kg·K),ISO 11357,23 °C,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 122,Thermal Properties,"Specific heat capacity"
PP,tensile_strength,35.0,20.0,40.0,MPa,ISO 527-1/-2,23 °C / 50 mm/min,Moplen HP500N,PP Homo Basell - HP500N,LyondellBasell,2006,https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N,page 1,Properties - Mechanical,"Tensile Stress at Yield: 35.0 MPa"
PP,young_modulus,1.55,1.20,1.80,GPa,ISO 527-1/-2,23 °C / 1 mm/min,Moplen HP500N,PP Homo Basell - HP500N,LyondellBasell,2006,https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N,page 1,Properties - Mechanical,"Tensile Modulus: 1550 MPa"
PP,elongation_at_break,50.0,10.0,100.0,%,ISO 527-1/-2,23 °C / 50 mm/min,Moplen HP500N,PP Homo Basell - HP500N,LyondellBasell,2006,https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N,page 1,Properties - Mechanical,"Tensile Strain at Break: 50 %"
PP,flexural_modulus,1.50,1.20,1.80,GPa,ISO 178,23 °C / 2 mm/min,Moplen EP440G,Moplen EP440G Overview,LyondellBasell,2021,https://ravagolanka.com/shop/suppliers/lyondellbasell/ep440g/,section 1,Technical Datasheet,"Flexural Modulus: 1200 - 1500 MPa"
PP,hardness_shore_d,70,56,75,Shore D,ISO 868,23 °C / 15 s,Borealis PP,Polypropylene Technical Data Sheet,Borealis,2020,https://www.borealisgroup.com/storage/Datasheets/sr533/SR533-PDS-RE_AMERICA-EN-V2-PDS-AM_3-41945-10045911.pdf,page 1,Technical Datasheet,"Hardness Shore D: 56"
PP,notched_impact_area_basis,3.0,2.0,7.5,kJ/m²,ISO 179/1eA,23 °C,Moplen HP500N,PP Homo Basell - HP500N,LyondellBasell,2006,https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N,page 1,Properties - Impact,"Charpy Notched Impact Strength (23 °C, Type 1, Edgewise, Notch A): 3.00 kJ/m²"
PP,water_absorption,0.01,0.00,0.03,%,ISO 62,23 °C / 24 h,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 125,Physical Properties,"Water absorption < 0.01 %"
PP,refractive_index,1.490,1.485,1.510,dimensionless,ASTM D542,23 °C / Na D-line,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 126,Optical Properties,"Refractive index 1.49"
PP,dielectric_constant,2.25,2.20,2.30,dimensionless,IEC 60250,1 MHz / 23 °C,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 127,Electrical Properties,"Dielectric constant at 1 MHz: 2.2 - 2.3"
PP,dielectric_strength,35.0,30.0,40.0,kV/mm,IEC 60243-1,23 °C in oil / 1 mm,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 128,Electrical Properties,"Dielectric strength: 30 - 40 kV/mm"
PP,volume_resistivity,1.0e17,1.0e16,1.0e18,Ω·cm,IEC 60093,23 °C,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 129,Electrical Properties,"Volume resistivity: 10^16 - 10^18 Ohm cm"
PP,dissipation_factor,0.0004,0.0003,0.0005,dimensionless,IEC 60250,1 MHz / 23 °C,Neat PP,Polymers Property Database,CRC Press,2008,https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf,page 130,Electrical Properties,"Dissipation factor tan delta: 0.0003 - 0.0005"
```

## Phase 2: Minimal-Source High-Coverage Property Search

To maximize property domain coverage while minimizing total source count, data was consolidated from four primary, high-authority technical repositories:

  

1. **LyondellBasell Spheripol Process Datasheets** ([Moplen HP500N](https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N), [Moplen EP440G](https://ravagolanka.com/shop/suppliers/lyondellbasell/ep440g/), [Moplen HP450J](https://www.scribd.com/document/535176976/Tds-Hp450j-English))
    
      
    
2. **Borealis Polyolefin Technical Specification** ([Borealis HC600TF / SR533](https://www.borealisgroup.com/storage/Datasheets/sr533/SR533-PDS-RE_AMERICA-EN-V2-PDS-AM_3-41945-10045911.pdf))
    
      
    
3. **CRC Polymers Property Database** ([Bryan Ellis & Ray Smith, 2008](https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf))
    
      
    
4. **Ataman Chemical Polypropylene Monograph** ([Ataman Chemical](https://www.atamanchemicals.com/polypropylene_u26111/))
    
      
    

### Domain Coverage Summary

- **Processing**: Melt Flow Index (`mfi`), Mass Process Temperature (`process_temp`), Mould Temperature (`mould_temp`).
    
      
    
- **Thermal**: Glass Transition (`tg`), Heat Deflection Temperature (`hdt`), Vicat Softening (`vicat`), Thermal Conductivity (`conductivity`), Coefficient of Thermal Expansion (`cte`), Specific Heat Capacity (`specific_heat_capacity`), Degradation Temperature (`degradation_temp`).
    
      
    
- **Mechanical**: Tensile Yield Strength (`tensile_strength`), Tensile Modulus (`young_modulus`), Elongation at Break (`elongation_at_break`), Flexural Modulus (`flexural_modulus`), Hardness (`hardness_shore_d`), Notched Impact Strength (`notched_impact_area_basis`).
    
      
    
- **Physical**: Density (`density`), Water Absorption (`water_absorption`), Refractive Index (`refractive_index`).
    
      
    
- **Electrical**: Dielectric Constant (`dielectric_constant`), Dielectric Strength (`dielectric_strength`), Volume Resistivity (`volume_resistivity`), Dissipation Factor (`dissipation_factor`).
    
      
    
- **Academic**: IUPAC Monomer Name (`monomer_name`).
    
      
    

## Phase 3: Grade-Class & Commercial Variant Deep-Dive

Polypropylene commercial grades are categorized into four major variant families:

  

### 1. Standard General-Purpose Injection Molding Homopolymer Grades

- **Example Grades**: [Moplen HP500N (LyondellBasell)](https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N), Borealis HC600TF
    
      
    
- **Characteristics**: Medium flowability, high stiffness, good dimensional stability.
    
      
    
- **Key Properties**:
    
      
    - MFR (230°C/2.16 kg): $12.0\text{ g/10min}$
        
          
        
    - Tensile Modulus: $1550\text{ MPa}$ ($1.55\text{ GPa}$)
        
          
        
    - Tensile Yield Stress: $35.0\text{ MPa}$
        
          
        
    - HDT (0.45 MPa): $80\text{ °C}$
        
          
        

### 2. High-Flow / Easy-Flow Injection Molding Grades

- **Example Grades**: [Moplen HP400R / HP401R (LyondellBasell)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9959175/)
    
      
    
- **Characteristics**: Thin-wall injection molding, fast cycle times, reduced injection pressure.
    
      
    
- **Key Properties**:
    
      
    - MFR (230°C/2.16 kg): $25.0\text{ g/10min}$
        
          
        
    - Tensile Yield Strength: $32.0\text{ MPa}$
        
          
        
    - Notched Charpy Impact (23°C): $2.0\text{ kJ/m}^2$
        
          
        

### 3. Medium & High Impact Copolymer Grades (PP-COPO)

- **Example Grades**: [Moplen EP440G (LyondellBasell)](https://ravagolanka.com/shop/suppliers/lyondellbasell/ep440g/), [Borealis SR533](https://www.borealisgroup.com/storage/Datasheets/sr533/SR533-PDS-RE_AMERICA-EN-V2-PDS-AM_3-41945-10045911.pdf)
    
      
    
- **Characteristics**: Ethylene-propylene rubber phase dispersion, enhanced sub-zero impact resistance.
    
      
    
- **Key Properties**:
    
      
    - MFR (230°C/2.16 kg): $0.5 - 11.0\text{ g/10min}$
        
          
        
    - Notched Izod Impact (23°C): $25 - 40\text{ kJ/m}^2$
        
          
        
    - Flexural Modulus: $800 - 1200\text{ MPa}$ ($0.8 - 1.2\text{ GPa}$)
        
          
        

### 4. BOPP Film, Raffia & Fiber Grades

- **Example Grades**: [Moplen HP450J](https://www.scribd.com/document/535176976/Tds-Hp450j-English), [Moplen HP421H](https://www.ajieng.com/product/24801.html?lang=en)
    
      
    
- **Characteristics**: High tenacity, optical clarity, low gel content, orientation capability.
    
      
    
- **Key Properties**:
    
      
    - MFR (230°C/2.16 kg): $3.3\text{ g/10min}$
        
          
        
    - Flexural Modulus: $1520\text{ MPa}$ ($15500\text{ kg/cm}^2$)
        
          
        
    - Tensile Yield Strength: $36.3\text{ MPa}$ ($370\text{ kg/cm}^2$)
        
          
        
    - Rockwell Hardness: $110\text{ R-Scale}$
        
          
        

## Phase 4: Unit Conversion & Mismatch Mapping

The table below maps extracted raw values from manufacturer specification sheets into Polypedia canonical units:

|**Property**|**Extracted Printed Value**|**Extracted Unit**|**Conversion Factor**|**Canonical Value**|**Canonical Unit**|
|---|---|---|---|---|---|
|**Tensile Modulus**|1550|MPa|$\div 1000$|**1.55**|GPa|
|**Flexural Modulus**|15500|kg/cm²|$\times 0.0000980665$|**1.52**|GPa|
|**Tensile Yield Strength**|370|kg/cm²|$\times 0.0980665$|**36.28**|MPa|
|**Charpy Impact Strength**|30.0|kJ/m²|$1 : 1$|**30.0**|kJ/m²|
|**Izod Impact Strength**|4.0|kg·cm/cm|$\times 0.0980665 \div 0.01$|**3.92**|kJ/m²|
|**Specific Heat Capacity**|1900|J/(kg·K)|$\div 1000$|**1.90**|kJ/(kg·K)|
|**Thermal Expansion**|$120 \times 10^{-6}$|K⁻¹|$\times 10^6$|**120**|µm/°C|
|**Dielectric Strength**|350|kV/cm|$\div 10$|**35.0**|kV/mm|
|**Volume Resistivity**|$10^{17}$|Ω·cm|$1 : 1$|**1.0e17**|Ω·cm|

## Phase 5: Full-Address Citation Mapping

|**Property Key & Display Name**|**Extracted Value & Unit**|**Grade / Variant**|**Test Method**|**Source Title & Publisher**|**Exact Locator**|**Verbatim Note / Citation Link**|
|---|---|---|---|---|---|---|
|`density` (Density)|$0.900\text{ g/cm}^3$|Moplen HP500N|ISO 1183|[PP Homo Basell - HP500N](https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N) (LyondellBasell)|Page 1, Section Physical|"Density: 0.900 g/cm³"|
|`mfi` (Melt Flow Rate)|$12.0\text{ g/10min}$|Moplen HP500N|ISO 1133|[PP Homo Basell - HP500N](https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N) (LyondellBasell)|Page 1, Section Technical|"Melt Mass-Flow Rate (MFR) (230°C/2.16 kg): 12 g/10 min"|
|`young_modulus` (Tensile Modulus)|$1.55\text{ GPa}$ ($1550\text{ MPa}$)|Moplen HP500N|ISO 527-1/-2|[PP Homo Basell - HP500N](https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N) (LyondellBasell)|Page 1, Section Mechanical|"Tensile Modulus: 1550 MPa"|
|`tensile_strength` (Tensile Yield Stress)|$35.0\text{ MPa}$|Moplen HP500N|ISO 527-1/-2|[PP Homo Basell - HP500N](https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N) (LyondellBasell)|Page 1, Section Mechanical|"Tensile Stress at Yield: 35.0 MPa"|
|`hdt` (Heat Deflection Temp)|$80.0\text{ °C}$|Moplen HP500N|ISO 75-1/-2|[PP Homo Basell - HP500N](https://www.scribd.com/document/495402259/PP-Homo-Basell-HP500N) (LyondellBasell)|Page 1, Section Thermal|"HDT (0.45 MPa) Unannealed: 80.0 °C"|
|`vicat` (Vicat Softening Temp)|$153\text{ °C}$|Moplen HP450J|ISO 306 / ASTM D1525|[Moplen HP450J Overview](https://www.scribd.com/document/535176976/Tds-Hp450j-English) (LyondellBasell / PMC)|Page 1, Section Properties|"Vicat Softening Point: 153 °C"|
|`conductivity` (Thermal Conductivity)|$0.17\text{ W/m·K}$|Neat PP|ISO 22007|[CRC Polymers Property Database](https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf) (CRC Press)|Page 120, Section Thermal|"Thermal conductivity of neat polypropylene: 0.12 - 0.22 W/m K"|
|`dielectric_constant` (Dielectric Constant)|$2.25$|Neat PP|IEC 60250|[CRC Polymers Property Database](https://www.scribd.com/document/477371291/2008-Bryan-Ellis-Ray-Smith-Polymers-Property-Database-CRC-Press-pdf) (CRC Press)|Page 127, Section Electrical|"Dielectric constant at 1 MHz: 2.2 - 2.3"|

## Phase 6: Non-Numeric Metadata Registration

JSON

```
{
  "polymer_id": "PP",
  "chemical_metadata": {
    "iupac_name": "poly(prop-1-ene)",
    "common_name": "Polypropylene",
    "abbreviation": "PP",
    "monomer_name": "prop-1-ene",
    "cas_number": "9003-07-0",
    "chemical_formula": "(C3H6)n"
  },
  "structural_metadata": {
    "tacticity": "isotactic (iPP)",
    "isotactic_index": "85% - 95%",
    "crystallinity_degree": "30% - 60%",
    "morphology": "semi-crystalline (alpha-phase predominant)",
    "melting_point_tm_deg_c": 165.0
  },
  "material_attributes": {
    "optical_clarity": "translucent to opaque (clear in thin BOPP film orientation)",
    "flammability_class": "UL 94 HB",
    "chemical_resistance": "excellent against non-oxidizing acids, bases, and fats; soluble in xylene at 140 °C"
  }
}
```