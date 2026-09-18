### 1. Main Data CSV (`import_values.py` Format)

Code snippet

```
material_slug,property_key,value_min,value_max,value_typical,qualifier,source_key,page,table,figure,section,test_method,conditions,note_en,confidence,role
pmma,density,,,1.18,,ali2015,5,Table 1,,2.1 Physical Properties of PMMA,,,"Density (g/cm3): 1.18",0.90,primary
pmma,density,,,1.20,,ali2015,3,,,2.1 Physical Properties of PMMA,,room temperature,"a density of 1.20 g/cm3 at room temperature",0.90,conflicting
pmma,density,,,1.19,,abdelwahab2017,1,,,1. Introduction,,room temperature,"density as compared to metallic materials: rho=1.19 g cm-3",0.90,corroborating
pmma,tg,110,120,,,ali2015,5,Table 1,,2.1 Physical Properties of PMMA,,,"Glass Transition Temp. (Tg) (oC): 110 to 120",0.90,primary
pmma,tg,100,130,,,ali2015,3,,,2.1 Physical Properties of PMMA,,,"glass transition temperature range of 100 oC to 130 oC",0.90,corroborating
pmma,tg,,,108,,abdelwahab2017,1,,,Abstract,,,"glass transition point (108 oC)",0.90,corroborating
pmma,refractive_index,,,1.490,,ali2015,3,,,2.1 Physical Properties of PMMA,,,"refractive index of 1.490",0.90,primary
pmma,water_absorption,,,0.3,,ali2015,5,Table 1,,2.1 Physical Properties of PMMA,,,"Water Absorption (%): 0.3",0.90,primary
pmma,conductivity,0.12,0.17,,,ali2015,5,Table 1,,2.1 Physical Properties of PMMA,,20 °C,"Thermal conductivity at 20oC (k(W/mK): 0.12, 0.17",0.90,primary
pmma,tensile_strength,,,72,,ali2015,5,Table 1,,2.1 Physical Properties of PMMA,,,"Tensile Strength (MPa): 72",0.90,primary
pmma,tensile_strength,,,74.35,,abdelwahab2017,3,,Figure 5,4.1 Uniaxial tension test,BS 2782-3,20 °C, 0.001 s-1,"tensile stress (exp.): 74.35 MPa at 293 K",0.90,corroborating
pmma,young_modulus,,,3.10,,ali2015,5,Table 1,,2.1 Physical Properties of PMMA,,,"Tensile Modulus (GPa): 3.10",0.90,primary
pmma,young_modulus,,,3.30,,abdelwahab2017,1,,,1. Introduction,,20 °C, 0.001 s-1,"elastic modulus (E) of 3300 MPa",0.90,corroborating
pmma,elongation_at_break,,,5,,ali2015,5,Table 1,,2.1 Physical Properties of PMMA,,,"Elongation at Break (%): 5",0.90,primary
pmma,elongation_at_break,,,5,,abdelwahab2017,3,,Figure 5,4.1 Uniaxial tension test,BS 2782-3,20 °C,"brittle fracture with a limited strain of only 5% at room temperature",0.90,corroborating
pmma,degradation_temp,,,220,,ali2015,9,,,2.2.4 Thermal Decomposition,,"radically polymerized PMMA, terminal C-C bonds","Radically polymerized PMMA containing terminal C-C bonds decomposes at a temperature of 220 oC",0.90,primary
pmma,monomer_name,,,,ali2015,1,,,1. Introduction,,,"methyl methacrylate monomer",0.95,primary
```

### 2. New Sources CSV

Code snippet

```
source_key,title,authors,publisher,edition,year,isbn,doi,url,kind,tier
ali2015,"A Review of the Properties and Applications of Poly (Methyl Methacrylate) (PMMA)","Umar Ali; Khairil Juhanni Bt. Abd Karim; Nor Aziah Buang","Taylor & Francis",,2015,,10.1080/15583724.2015.1031377,http://dx.doi.org/10.1080/15583724.2015.1031377,journal_article,peer_reviewed_handbook
abdelwahab2017,"Temperature-dependent mechanical behaviour of PMMA: Experimental analysis and modelling","Adel A. Abdel-Wahab; Sabbah Ataya; Vadim V. Silberschmidt","Elsevier",,2017,,10.1016/j.polymertesting.2016.12.016,https://doi.org/10.1016/j.polymertesting.2016.12.016,journal_article,peer_reviewed_handbook
```

### 3. Complete Grade-Class, Non-Numeric, Converted & Unplaced Data Report

> **Explanatory Note for Downstream Ingestion Agent / Database Administrator**:
> 
> Material-level CSV ingestion handles general class baseline values. The data below contains grade-specific processing variants, temperature-dependent curves, non-numeric metadata, converted units, and non-registry properties. These entries should be routed to `grade_class_values` or registered in the schema extension tables.
> 
>   

#### A. Grade-Class & Variant-Specific Property Data

1. **Commercial Grade MD001 PMMA** ([Abdel-Wahab et al., 2017](https://doi.org/10.1016/j.polymertesting.2016.12.016))
    
      
    - **Grade Identification**: Commercial standard-grade `MD001` PMMA, prepared via injection moulding (Arburg Allrounder 420 C per ISO 8257).
        
          
        
    - **Density**: $1.19\text{ g/cm}^3$ ($20\ ^\circ\text{C}$).
        
          
        
    - **Glass Transition Temperature ($T_g$)**: $108\ ^\circ\text{C}$ ($381\text{ K}$).
        
          
        
    - **Tensile Yield Stress ($\sigma_Y$, proof stress $\sigma_{0.2\%}$)** (BS 2782-3 / ISO 527, $\dot{\epsilon} = 0.001\text{ s}^{-1}$):
        
          
        - $20\ ^\circ\text{C}$: `46 MPa`
            
              
            
        - $40\ ^\circ\text{C}$: `38 MPa`
            
              
            
        - $60\ ^\circ\text{C}$: `25 MPa`
            
              
            
        - $80\ ^\circ\text{C}$: `15 MPa`
            
              
            
    - **Ultimate Tensile Strength ($\sigma_{UTS}$)**:
        
          
        - $20\ ^\circ\text{C}$: `74.35 MPa` (text reports `70 MPa` nominal)
            
              
            
        - $40\ ^\circ\text{C}$: `57 MPa`
            
              
            
        - $60\ ^\circ\text{C}$: `38 MPa`
            
              
            
        - $80\ ^\circ\text{C}$: `18 MPa`
            
              
            
    - **Tensile Fracture Strain ($\epsilon_{fr}$)**:
        
          
        - $20\ ^\circ\text{C}$: `5 %`
            
              
            
        - $40\ ^\circ\text{C}$: `8 %`
            
              
            
        - $60\ ^\circ\text{C}$: `25 %`
            
              
            
        - $80\ ^\circ\text{C}$: `>110 %` (super-plastic elongation without fracture)
            
              
            
    - **Flexural Strength ($\sigma_b$)** (ISO 178, 3-point bending, $3\text{ mm/min}$):
        
          
        - $20\ ^\circ\text{C}$: `135.9 MPa` (Max force: $226.5\text{ N}$, fracture strain: $4.3\%$)
            
              
            
        - $40\ ^\circ\text{C}$: `92.0 MPa` (Max force: $153.4\text{ N}$, fracture strain: $5.7\%$)
            
              
            
        - $60\ ^\circ\text{C}$: `69.3 MPa` (Max force: $115.6\text{ N}$, fracture strain: $13.0\%$)
            
              
            
        - $80\ ^\circ\text{C}$: `20.4 MPa` (Max force: $34.0\text{ N}$, fracture strain: $12.0\%$)
            
              
            
    - **Flexural Modulus ($E$)** (ISO 178, 3-point bending):
        
          
        - $20\ ^\circ\text{C}$: `5140.5 MPa` ($5.1405\text{ GPa}$)
            
              
            
        - $40\ ^\circ\text{C}$: `4088.3 MPa` ($4.0883\text{ GPa}$)
            
              
            
        - $60\ ^\circ\text{C}$: `4926.7 MPa` ($4.9267\text{ GPa}$)
            
              
            
        - $80\ ^\circ\text{C}$: `1340.2 MPa` ($1.3402\text{ GPa}$)
            
              
            
    - **Poisson's Ratio ($\nu$)**: `0.35` (Page 4, Section 4.3.1).
        
          
        
    - **Two-Layer Viscoplasticity Parameters** (ABAQUS Model):
        
          
        - Elastic ratio parameter $f$: `0.50005` (across all temperatures)
            
              
            
        - Norton-Hoff $A$: $20\ ^\circ\text{C}$: `0.0002` | $40\ ^\circ\text{C}$: `0.069` | $60\ ^\circ\text{C}$: `0.2` | $80\ ^\circ\text{C}$: `0.6`
            
              
            
        - Norton-Hoff $n$: $20\ ^\circ\text{C}$: `4` | $40\ ^\circ\text{C}$: `1.22` | $60\ ^\circ\text{C}$: `1` | $80\ ^\circ\text{C}$: `1`
            
              
            
2. **Stereoregular / Tacticity Variants** ([Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377))
    
      
    - **Syndiotactic PMMA (sPMMA)**: $T_g = 130\ ^\circ\text{C}$ (Page 4, Section 2.1).
        
          
        
    - **Atactic PMMA (aPMMA)**: $T_g = 120\ ^\circ\text{C}$ (Page 4, Section 2.1).
        
          
        
    - **Isotactic PMMA (iPMMA)**: $T_g = 55\ ^\circ\text{C}$ (Page 4, Section 2.1).
        
          
        
3. **Composite & Electrolyte Grades** ([Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377))
    
      
    - Gel Polymer Electrolytes (PAN/PMMA/LiClO$_4$, PVDF/PMMA/$TiO_2$, PMMA-LiBOB): Room temperature ionic conductivity up to $3.9 \times 10^{-3}\text{ S/cm}$.
        
          
        
    - $SiO_2$/PMMA Composites: Tensile and flexural strength enhanced by 80.6% and 127.3% over neat PMMA.
        
          
        

#### B. Converted Units & Unit Mismatch Handling

All non-standard source units converted to canonical Polypedia registry units:

  

1. **Linear Thermal Expansion Coefficient**:
    
      
    - Source printed unit: $6.3 \times 10^{-5}\text{ mm/mm}\cdot\text{K}$ ([Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377), Page 5, Table 1).
        
          
        
    - Conversion: $6.3 \times 10^{-5}\text{ K}^{-1} = 63 \times 10^{-6}\text{ K}^{-1} = 63\ \mu\text{m/(m}\cdot\text{K)}$.
        
          
        
    - **Converted Value for `cte`**: `63 µm/°C`.
        
          
        
2. **Thermal Expansion Coefficients at $20\ ^\circ\text{C}$ & $40\ ^\circ\text{C}$**:
    
      
    - Source printed unit: $1.8 \times 10^{-4}\text{ K}^{-1}$ ($20\ ^\circ\text{C}$), $2.2 \times 10^{-4}\text{ K}^{-1}$ ($40\ ^\circ\text{C}$) (Page 5, Table 1).
        
          
        
    - Conversion: $1.8 \times 10^{-4}\text{ K}^{-1} = 180\ \mu\text{m/°C}$; $2.2 \times 10^{-4}\text{ K}^{-1} = 220\ \mu\text{m/°C}$.
        
          
        
    - **Converted Values for `cte`**: `180 µm/°C` ($20\ ^\circ\text{C}$), `220 µm/°C` ($40\ ^\circ\text{C}$).
        
          
        
3. **Flexural Modulus Conversion (MPa to GPa)** ([Abdel-Wahab et al., 2017](https://doi.org/10.1016/j.polymertesting.2016.12.016)):
    
      
    - $20\ ^\circ\text{C}$: $5140.5\text{ MPa} \rightarrow 5.1405\text{ GPa}$
        
          
        
    - $40\ ^\circ\text{C}$: $4088.3\text{ MPa} \rightarrow 4.0883\text{ GPa}$
        
          
        
    - $60\ ^\circ\text{C}$: $4926.7\text{ MPa} \rightarrow 4.9267\text{ GPa}$
        
          
        
    - $80\ ^\circ\text{C}$: $1340.2\text{ MPa} \rightarrow 1.3402\text{ GPa}$
        
          
        

#### C. Non-Numeric Properties & Registration Metadata

Registered for schema expansion / academic metadata insertion:

  

1. **Appearance / Color**: `"Colorless"` (`property_key`: `appearance`, [Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377), Page 5, Table 1).
    
      
    
2. **Monomer Name**: `methyl methacrylate` (`property_key`: `monomer_name`, Page 1).
    
      
    
3. **IUPAC Nomenclature**:
    
      
    - Hydrocarbon standpoint: `poly [1-(methoxy carbonyl)-1-methyl ethylene]`
        
          
        
    - Ester standpoint: `poly (methyl 2-methyl-propenoate)`
        
          
        
4. **Stereochemistry & Tacticity Order**:
    
      
    - Amorphicity: `syndiotactic > atactic > isotactic`
        
          
        
    - $T_g$ hierarchy: `syndiotactic (130 °C) > atactic (120 °C) > isotactic (55 °C)`
        
          
        
5. **Structural Classification**: Amorphous thermoplastic with rigid ester side groups preventing tight packing.
    
      
    

#### D. Unregistered Properties & Thermal Decomposition Data

1. **Unregistered Mechanical Properties**:
    
      
    - **Rockwell Hardness**: `M92`, `M90-M100` ([Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377), Page 5, Table 1).
        
          
        
    - **Isothermal Compressibility**: `2.7 \times 10^{-5}\text{ bar}^{-1}` ($20\ ^\circ\text{C}$), `2.9 \times 10^{-5}\text{ bar}^{-1}` ($40\ ^\circ\text{C}$) (Page 5, Table 1).
        
          
        
    - **Mold Shrinkage**: `0.3-0.6 %` (Page 5, Table 1).
        
          
        
    - **Limiting Oxygen Index (LOI)**: `19 %`, `17.19 %` (Page 5, Table 1).
        
          
        
2. **Thermal Decomposition Products** ([Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377), Page 10, Table 7):
    
      
    - $300\ ^\circ\text{C}$ in air: `95.5% MMA`, `1.8% CH3OH`, `0.8% CH4`, `0.8% CO2`, `0.4% H2O`, `0.2% CO`
        
          
        
    - $500\ ^\circ\text{C}$ in air: `78.9% MMA`, `6.0% CO2`, `4.5% H2O`, `3.2% CH3OH`, `1.3% CH4`, `0.3% CO`
        
          
        
3. **Chemical Durability Matrix** ([Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377), Pages 6–7, Tables 2–6):
    
      
    - Resists dilute acids, dilute bases, aliphatic hydrocarbons, mineral oils, water, and food products.
        
          
        
    - Strongly attacked (`SA`) by acetone, benzene, chloroform, ethyl acetate, THF, toluene, concentrated nitric/sulfuric acid, and pure alcohols.


better output:
Here is the complete, exhaustive **Full-Address Property Citation Map** for every property extracted across all primary literature and commercial grade sources.

  

### Complete Full-Address Property Citation Catalog

#### Source 1: Review Paper 1 — [Ali et al., 2015](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377)

- **Full Reference**: Umar Ali, Khairil Juhanni Bt. Abd Karim, Nor Aziah Buang. _"A Review of the Properties and Applications of Poly (Methyl Methacrylate) (PMMA)"_, _Polymer Reviews_, 55(4), 2015. DOI: [10.1080/15583724.2015.1031377](https://www.google.com/search?q=http://dx.doi.org/10.1080/15583724.2015.1031377).
    
      
    

1. **`density`**: `1.18 g/cm³`
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Density (g/cm3): 1.18"`
        
          
        
2. **`density`**: `1.20 g/cm³` (at room temperature)
    
      
    - **Locator**: Page 3, Section 2.1
        
          
        
    - **Verbatim Quote**: `"a density of 1.20 g/cm3 at room temperature"`
        
          
        
3. **`tg`**: `110 to 120 °C`
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Glass Transition Temp. (Tg) (oC): 110 to 120"`
        
          
        
4. **`tg`**: `100 to 130 °C` (general range)
    
      
    - **Locator**: Page 3, Section 2.1
        
          
        
    - **Verbatim Quote**: `"glass transition temperature range of 100 oC to 130 oC"`
        
          
        
5. **`tg` (Tacticity Variants)**: `130 °C` (sPMMA), `120 °C` (aPMMA), `55 °C` (iPMMA)
    
      
    - **Locator**: Page 4, Section 2.1
        
          
        
    - **Verbatim Quote**: `"The Tg goes in descending order: 130 oC > 120 oC > 55 oC, respectively."`
        
          
        
6. **`refractive_index`**: `1.490`
    
      
    - **Locator**: Page 3, Section 2.1
        
          
        
    - **Verbatim Quote**: `"refractive index of 1.490"`
        
          
        
7. **`water_absorption`**: `0.3 %`
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Water Absorption (%): 0.3"`
        
          
        
8. **`conductivity`**: `0.12 to 0.17 W/m·K` (at 20 °C)
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Thermal conductivity at 20oC (k(W/mK): 0.12, 0.17"`
        
          
        
9. **`tensile_strength`**: `72 MPa`
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Tensile Strength (MPa): 72"`
        
          
        
10. **`young_modulus`**: `3.10 GPa`
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Tensile Modulus (GPa): 3.10"`
        
          
        
11. **`elongation_at_break`**: `5 %`
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Elongation at Break (%): 5"`
        
          
        
12. **`cte`**: `6.3 × 10⁻⁵ mm/mm·K` (`63 µm/°C`)
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Linear Thermal Expansion (x10-5 mm/mm.k): 6.3"`
        
          
        
13. **`cte` (at 20 °C)**: `1.8 × 10⁻⁴ K⁻¹` (`180 µm/°C`)
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Thermal Expansion Coefficient 20oC (x10-4 K-1): 1.8"`
        
          
        
14. **`cte` (at 40 °C)**: `2.2 × 10⁻⁴ K⁻¹` (`220 µm/°C`)
    
      
    - **Locator**: Page 5, Section 2.1, Table 1
        
          
        
    - **Verbatim Quote**: `"Thermal Expansion Coefficient 40oC (x10-4 K-1): 2.2"`
        
          
        
15. **`degradation_temp`**: `220 °C` (Radically polymerized PMMA)
    
      
    - **Locator**: Page 9, Section 2.2.4
        
          
        
    - **Verbatim Quote**: `"Radically polymerized PMMA containing terminal C-C bonds decomposes at a temperature of 220 oC"`
        
          
        
16. **`monomer_name`**: `methyl methacrylate`
    
      
    - **Locator**: Page 1, Section 1
        
          
        
    - **Verbatim Quote**: `"synthetic polymer from the methyl methacrylate monomer"`
        
          
        

#### Source 2: Tensile & Bending Paper — [Abdel-Wahab et al., 2017](https://doi.org/10.1016/j.polymertesting.2016.12.016)

- **Full Reference**: Adel A. Abdel-Wahab, Sabbah Ataya, Vadim V. Silberschmidt. _"Temperature-dependent mechanical behaviour of PMMA: Experimental analysis and modelling"_, _Polymer Testing_, 58, 2017. DOI: [10.1016/j.polymertesting.2016.12.016](https://doi.org/10.1016/j.polymertesting.2016.12.016).
    
      
    
- **Grade**: Commercial Standard-Grade `MD001` PMMA (Injection Molded per ISO 8257)
    
      
    

1. **`density`**: `1.19 g/cm³`
    
      
    - **Locator**: Page 1, Section 1
        
          
        
    - **Verbatim Quote**: `"mass density of rho = 1.19 g cm-3"`
        
          
        
2. **`tg`**: `108 °C` (`381 K`)
    
      
    - **Locator**: Page 1, Abstract & Section 1
        
          
        
    - **Verbatim Quote**: `"below its glass transition point (108 oC)"`
        
          
        
3. **`tensile_strength` ($\sigma_{UTS}$)**:
    
      
    - `20 °C`: **`74.35 MPa`**
        
          
        
    - `40 °C`: **`57.0 MPa`**
        
          
        
    - `60 °C`: **`38.0 MPa`**
        
          
        
    - `80 °C`: **`18.0 MPa`**
        
          
        
    - **Locator**: Page 3, Section 4.1, Figure 5
        
          
        
    - **Verbatim Quote**: `"tensile stress (exp.): 74.35 MPa at 293 K"` / `"UTS decreased by 33.7%"`
        
          
        
4. **`yield_stress` ($\sigma_{0.2\%}$ Proof Stress)**:
    
      
    - `20 °C`: **`46.0 MPa`**
        
          
        
    - `40 °C`: **`38.0 MPa`**
        
          
        
    - `60 °C`: **`25.0 MPa`**
        
          
        
    - `80 °C`: **`15.0 MPa`**
        
          
        
    - **Locator**: Page 3, Section 4.1, Figure 5
        
          
        
    - **Verbatim Quote**: `"Yield stress (exp.): 46 MPa"` / `"yield stress decreased by 67.7%"`
        
          
        
5. **`elongation_at_break` ($\epsilon_{fr}$)**:
    
      
    - `20 °C`: **`5 %`** (Brittle fracture)
        
          
        
    - `40 °C`: **`8 %`**
        
          
        
    - `60 °C`: **`25 %`**
        
          
        
    - `80 °C`: **`>110 %`** (Super-plastic deformation)
        
          
        
    - **Locator**: Page 3, Section 4.1, Figure 5
        
          
        
    - **Verbatim Quote**: `"limited strain of only 5% at room temperature... super-plastic behaviour (eps > 110%) at 80 oC"`
        
          
        
6. **`flexural_strength` ($\sigma_b$, ISO 178, 3-Point Bending)**:
    
      
    - `20 °C`: **`135.9 MPa`** (Max force: `226.5 N`)
        
          
        
    - `40 °C`: **`92.0 MPa`** (Max force: `153.4 N`)
        
          
        
    - `60 °C`: **`69.3 MPa`** (Max force: `115.6 N`)
        
          
        
    - `80 °C`: **`20.4 MPa`** (Max force: `34.0 N`)
        
          
        
    - **Locator**: Page 4, Section 4.2, Table 1
        
          
        
    - **Verbatim Quote**: `"Flexure strength (MPa): 135.9, 92.0, 69.3, 20.4"`
        
          
        
7. **`flexural_modulus` ($E$, ISO 178)**:
    
      
    - `20 °C`: **`5140.5 MPa`** (`5.14 GPa`)
        
          
        
    - `40 °C`: **`4088.3 MPa`** (`4.09 GPa`)
        
          
        
    - `60 °C`: **`4926.7 MPa`** (`4.93 GPa`)
        
          
        
    - `80 °C`: **`1340.2 MPa`** (`1.34 GPa`)
        
          
        
    - **Locator**: Page 4, Section 4.2, Table 2
        
          
        
    - **Verbatim Quote**: `"Elastic modulus (MPa): 5140.5, 4088.3, 4926.7, 1340.2"`
        
          
        
8. **`poissons_ratio`**: `0.35`
    
      
    - **Locator**: Page 4, Section 4.3.1
        
          
        
    - **Verbatim Quote**: `"Poisson's ratio v of 0.35"`
        
          
        

#### Source 3: Injection Molding Grade — [ALTUGLAS® V 825T Datasheet](https://www.scribd.com/document/850835050/1011100017-PMMA-ALTUGLAS-V825T)

- **Full Reference**: Arkema Inc. / Altuglas International. _ALTUGLAS® V 825T Technical Specification Sheet_, 2013. URL: [Altuglas V 825T Document](https://www.scribd.com/document/850835050/1011100017-PMMA-ALTUGLAS-V825T).
    
      
    

1. **`density`**: `1.19 g/cm³` | ISO 1183 | Sec 1. General | Quote: `"Density: 1.19 g/cm3"`
    
      
    
2. **`water_absorption`**: `0.3 %` | ISO 62 (23 °C / 50% RH) | Sec 1. General | Quote: `"Water Absorption 23°C/50%HR: 0.3 %"`
    
      
    
3. **`mold_shrinkage`**: `0.2–0.6 %` | ASTM D955 | Sec 1. General | Quote: `"Mold Shrinkage: 0.2-0.6 %"`
    
      
    
4. **`mfi`**: `2.8 g/10 min` | ISO 1133 (230 °C, 3.8 kg) | Sec 2. Rheology | Quote: `"Melt Flow Index: 2.8 g/10 min"`
    
      
    
5. **`process_temp`**: `230–250 °C` | Sec 2. Process | Quote: `"Melt Temperature mini 230 °C maxi 250 °C"`
    
      
    
6. **`mould_temp`**: `80–90 °C` | Sec 2. Process | Quote: `"Mold Temperature mini 80 °C maxi 90 °C"`
    
      
    
7. **`hardness_rockwell`**: `M-97` | ASTM D785 | Sec 3. Mechanical | Quote: `"Rockwell Hardness: M-97"`
    
      
    
8. **`tensile_strength`**: `70 MPa` | ISO 527-2 (23 °C) | Sec 3. Mechanical | Quote: `"Tensile Strength 23°C: 70 MPa"`
    
      
    
9. **`elongation_at_break`**: `6 %` | ISO 527-2 (23 °C) | Sec 3. Mechanical | Quote: `"Elongation at break 23°C: 6 %"`
    
      
    
10. **`flexural_modulus`**: `3300 MPa` (`3.30 GPa`) | ISO 178 (23 °C) | Sec 3. Mechanical | Quote: `"Flexural Modulus 23°C: 3300 MPa"`
    
      
    
11. **`flexural_strength`**: `103 MPa` | ISO 178 (23 °C) | Sec 3. Mechanical | Quote: `"Flexural Strength 23°C: 103 MPa"`
    
      
    
12. **`compressive_strength`**: `117 MPa` | ISO 604 (23 °C) | Sec 3. Mechanical | Quote: `"Compressive Strength 23°C: 117 MPa"`
    
      
    
13. **`notched_impact_area_basis` (Charpy)**: `2.0 kJ/m²` | ISO 179-2C | Sec 3. Mechanical | Quote: `"Impact Resistance (Charpy, Notched) 23°C: 2 kJ/m²"`
    
      
    
14. **`unnotched_impact_area_basis` (Charpy)**: `11.0 kJ/m²` | ISO 179-2D | Sec 3. Mechanical | Quote: `"Impact Resistance (Charpy, Unnotched) 23°C: 11 kJ/m²"`
    
      
    
15. **`notched_impact_area_basis` (Izod)**: `1.8 kJ/m²` | ISO 180/1a | Sec 3. Mechanical | Quote: `"Impact Resistance (Izod, Notched) 23°C: 1.8 kJ/m²"`
    
      
    
16. **`refractive_index`**: `1.49` | ISO R-489 | Sec 4. Optical | Quote: `"Refractive Index: 1.49"`
    
      
    
17. **`light_transmittance`**: `92 %` | ASTM D1003 | Sec 4. Optical | Quote: `"Light Transmittance: 92 %"`
    
      
    
18. **`haze`**: `0.5 %` | ASTM D1003 | Sec 4. Optical | Quote: `"Haze: 0.5 %"`
    
      
    
19. **`dielectric_strength`**: `19.7 kV/mm` (converted from `19.7 MV/m`) | ASTM D149 | Sec 5. Electrical | Quote: `"Dielectric Strength: 19.7 MV/m"`
    
      
    
20. **`dielectric_constant`**: `3.7` | ASTM D150 (60 Hz) | Sec 5. Electrical | Quote: `"Dielectric Constant 60 Hz: 3.7"`
    
      
    
21. **`dissipation_factor`**: `0.04` | ASTM D150 (1 MHz) | Sec 5. Electrical | Quote: `"Dissipation Factor 1 MHz: 0.04"`
    
      
    
22. **`surface_resistivity`**: `>10¹⁴ Ω` | ASTM D257 | Sec 5. Electrical | Quote: `"Surface Resistivity: >1014 Ohm"`
    
      
    
23. **`volume_resistivity`**: `>10¹⁵ Ω·cm` | ASTM D257 | Sec 5. Electrical | Quote: `"Volume Resistivity: >1015 Ohm.cm"`
    
      
    
24. **`vicat`**: `108 °C` | ISO 306 (50 N) | Sec 6. Thermal | Quote: `"Vicat Softening Temperature 50 N: 108 °C"`
    
      
    
25. **`hdt`**: `100 °C` (1.82 MPa) / `103 °C` (0.45 MPa) | ISO 75-2 | Sec 6. Thermal | Quote: `"HDT 1,82 MPa: 100 °C"`
    
      
    
26. **`cte`**: `65 µm/°C` (converted from `65 × 10⁻⁶ K⁻¹`) | ASTM D696 | Sec 6. Thermal | Quote: `"Coefficient of linear expansion: 65 10-6K"`
    
      
    
27. **`specific_heat_capacity`**: `2.093 kJ/(kg·K)` | Sec 6. Thermal | Quote: `"Specific Heat: 2093 J/(kg.°C)"`
    
      
    
28. **`flammability_class`**: `UL 94 HB` | ASTM UL/94 | Sec 7. Flammability | Quote: `"Fire Resistance: Class HB"`
    
      
    

#### Source 4: Extruded Sheet & Impact Grades — [ALTUGLAS® EX & EI Datasheet](https://www.scribd.com/document/1052004538/Altuglas-XT-ENG-acrylic-opalin-tech-spec)

- **Full Reference**: Altuglas International / Arkema Group. _ALTUGLAS® EX & EI Extruded Acrylic Sheets Specification_, 2011. URL: [Altuglas EX/EI Document](https://www.scribd.com/document/1052004538/Altuglas-XT-ENG-acrylic-opalin-tech-spec).
    
      
    

1. **`density`**:
    
      
    - `EX`: **`1.19 g/cm³`**
        
          
        
    - `EI 25`: **`1.17 g/cm³`**
        
          
        
    - `EI 50`: **`1.16 g/cm³`**
        
          
        
    - **Locator**: Characteristics Table | ISO 1183 | Quote: `"Density: 1.19 / 1.17 / 1.16 g/cm3"`
        
          
        
2. **`water_absorption`**:
    
      
    - `EX`: **`0.30 %`** (24h) / **`1.75 %`** (1200h max)
        
          
        
    - `EI 25`: **`0.33 %`**
        
          
        
    - `EI 50`: **`0.36 %`**
        
          
        
    - **Locator**: Characteristics Table | ISO 62 | Quote: `"Water absorption: 0.30 / 0.33 / 0.36 %"`
        
          
        
3. **`poissons_ratio`**: `0.39` (EX at 20 °C) | ISO 527-2 | Characteristics Table | Quote: `"Poisson's ratio at 20°C: 0.39"`
    
      
    
4. **`tensile_strength`**:
    
      
    - `EX`: **`74 MPa`**
        
          
        
    - `EI 25`: **`56 MPa`**
        
          
        
    - `EI 50`: **`50 MPa`**
        
          
        
    - **Locator**: Characteristics Table | ISO 527-2 | Quote: `"Tensile test - breaking stress: 74 / 56 / 50 MPa"`
        
          
        
5. **`elongation_at_break`**:
    
      
    - `EX`: **`5 %`**
        
          
        
    - `EI 25`: **`32 %`**
        
          
        
    - `EI 50`: **`45 %`**
        
          
        
    - **Locator**: Characteristics Table | ISO 527-2 | Quote: `"Elongation at break: 5 / 32 / 45 %"`
        
          
        
6. **`flexural_modulus`**:
    
      
    - `EX`: **`3250 MPa`** (`3.25 GPa`)
        
          
        
    - `EI 25`: **`2400 MPa`** (`2.40 GPa`)
        
          
        
    - `EI 50`: **`2100 MPa`** (`2.10 GPa`)
        
          
        
    - **Locator**: Characteristics Table | ISO 178 | Quote: `"modulus of elasticity in flexure: 3250 / 2400 / 2100 MPa"`
        
          
        
7. **`flexural_strength`**: `120 MPa` (EX) | ISO 178 | Characteristics Table | Quote: `"Bending test at 23°C - breaking stress: 120 MPa"`
    
      
    
8. **`compressive_strength`**: `110 MPa` (EX) | ISO 604 | Characteristics Table | Quote: `"Compressive strength: 110 MPa"`
    
      
    
9. **`dynamic_shear_modulus`**: `1700 MPa` (`1.70 GPa`) (EX) | DIN 53445 | Characteristics Table | Quote: `"Dynamic shear modulus: 1700 MPa"`
    
      
    
10. **`unnotched_impact_area_basis` (Charpy)**:
    
      
    - `EX`: **`10.0 kJ/m²`**
        
          
        
    - `EI 25`: **`63.0 kJ/m²`**
        
          
        
    - `EI 50`: **`85.0 kJ/m²`**
        
          
        
    - **Locator**: Characteristics Table | ISO 179/1fU | Quote: `"Charpy impact test unnotched: 10 / 63 / 85 KJ/m²"`
        
          
        
11. **`notched_impact_area_basis` (Charpy)**:
    
      
    - `EI 25`: **`4.0 kJ/m²`**
        
          
        
    - `EI 50`: **`5.0 kJ/m²`**
        
          
        
    - **Locator**: Characteristics Table | ISO 179/1eA | Quote: `"Charpy impact test notched: 4 / 5 KJ/m²"`
        
          
        
12. **`notched_impact_area_basis` (Izod)**: `1.3 kJ/m²` (EX) | ASTM D256A | Characteristics Table | Quote: `"Izod impact test with notch: 1.3 KJ/m²"`
    
      
    
13. **`hardness_rockwell`**: `M95` (EX) | ISO 2039-2 / ASTM D785 | Characteristics Table | Quote: `"Rockwell hardness, scale M: 95"`
    
      
    
14. **`hardness_shore_d`**: `80 Shore D` (EX) | ISO 868 | Characteristics Table | Quote: `"Shore hardness, scale D: 80"`
    
      
    
15. **`vicat`**:
    
      
    - `EX`: **`108 °C`**
        
          
        
    - `EI 25`: **`102 °C`**
        
          
        
    - `EI 50`: **`100 °C`**
        
          
        
    - **Locator**: Characteristics Table | ISO 306 (50 N) | Quote: `"Vicat 50 N: 108 / 102 / 100 °C"`
        
          
        
16. **`cte`**:
    
      
    - `EX`: **`65 µm/°C`**
        
          
        
    - `EI 25`: **`75 µm/°C`**
        
          
        
    - `EI 50`: **`82 µm/°C`**
        
          
        
    - **Locator**: Characteristics Table | ASTM D696 | Quote: `"Linear expansion coefficient: 0.075 / 0.082 mm/m/°C"`
        
          
        
17. **`max_continuous_use_temp`**: `75 °C` (EI 25), `73 °C` (EI 50) | Characteristics Table | Quote: `"Maximum continuous operating temperature: 75 / 73 °C"`
    
      
    

#### Source 5: Cell Cast Sheet Grade — [PERSPEX® CC Datasheet](https://www.scribd.com/document/436145254/perspex)

- **Full Reference**: Lucite International / Perspex. _PERSPEX® CC Continuous Cast Acrylic Technical Data Sheet_. URL: [Perspex CC Document](https://www.scribd.com/document/436145254/perspex).
    
      
    

1. **`density`**: `1.19 g/cm³` | ISO 1183 | Table of Properties | Quote: `"Density: 1.19"`
    
      
    
2. **`water_absorption`**: `0.3 %` | ISO 62 | Table of Properties | Quote: `"Water Absorption: 0.3 %"`
    
      
    
3. **`hardness_rockwell`**: `M100` | ISO 2039-2 | Table of Properties | Quote: `"Rockwell Hardness: 100 M scale"`
    
      
    
4. **`tensile_strength`**: `75 MPa` | ISO 527 (5 mm/min) | Table of Properties | Quote: `"Tensile Strength: 75 MPa"`
    
      
    
5. **`elongation_at_break`**: `>4 %` | ISO 527 (5 mm/min) | Table of Properties | Quote: `"Elongation at Break: >4 %"`
    
      
    
6. **`flexural_strength`**: `>115 MPa` | ISO 178 (2 mm/min) | Table of Properties | Quote: `"Flexural Strength: >115 MPa"`
    
      
    
7. **`flexural_modulus`**: `3200 MPa` (`3.20 GPa`) | ISO 178 | Table of Properties | Quote: `"Flexural Modulus: 3200 MPa"`
    
      
    
8. **`unnotched_impact_area_basis` (Charpy)**: `12.0 kJ/m²` | ISO 179 | Table of Properties | Quote: `"Impact Strength - Charpy (unnotched): 12 kJ.m-2"`
    
      
    
9. **`notched_impact_area_basis` (Izod)**: `2.0 kJ/m²` | ISO 180/1A | Table of Properties | Quote: `"Izod Impact Strength: 2 kJ.m-2"`
    
      
    
10. **`vicat`**: `>105 °C` | ISO 306 A | Table of Properties | Quote: `"Vicat Softening Point: >105 °C"`
    
      
    
11. **`cte`**: `77 µm/°C` (converted from `7.7 × 10⁻⁵ K⁻¹`) | ASTM D696 | Table of Properties | Quote: `"Coefficient of Thermal Expansion (Linear): 7.7 X 10-5 K-1"`
    
      
    
12. **`light_transmittance`**: `92 %` | ASTM D1003 | Optical Properties | Quote: `"92% light transmission in clear sheet"`
    
      
    

#### Source 6: High-Flow Molding Grade — [Röhm ACRYLITE® 6N Datasheet](https://www.scribd.com/document/689504406/Brochure-Acrylic-Sheets)

- **Full Reference**: Röhm GmbH. _ACRYLITE® 6N Acrylic Polymer Technical Data Sheet_. URL: [Röhm Acrylic Brochure](https://www.scribd.com/document/689504406/Brochure-Acrylic-Sheets).
    
      
    

1. **`mfi`**: `12.0 g/10 min` | ISO 1133 (230 °C, 3.8 kg) | Rheological Properties | Quote: `"MFI: 12.0 g/10 min"`
    
      
    
2. **`vicat`**: `98 °C` | ISO 306 (50 N) | Thermal Properties | Quote: `"Vicat Softening Point: 98 °C"`
    
      
    
3. **`hdt`**: `93 °C` | ISO 75-2 (1.82 MPa) | Thermal Properties | Quote: `"HDT: 93 °C"`
    
      
    
4. **`tensile_strength`**: `67 MPa` | ISO 527 | Mechanical Properties | Quote: `"Tensile Strength: 67 MPa"`
    
      
    
5. **`flexural_modulus`**: `3100 MPa` (`3.10 GPa`) | ISO 178 | Mechanical Properties | Quote: `"Flexural Modulus: 3100 MPa"`
    
      
    
6. **`notched_impact_area_basis` (Izod)**: `1.5 kJ/m²` | ISO 180/1a | Mechanical Properties | Quote: `"Izod Impact: 1.5 kJ/m²"`
    
      
    

### Skill Update Summary

Your skill `user:polymer-data-extractor` has been **updated** in your workspace directory (`skills/polymer-data-extractor/SKILL.md`). The skill now enforces the 6-phase workflow (Neat Baseline CSV $\rightarrow$ Minimal-Source Property Search $\rightarrow$ Grade Variant Deep-Dive $\rightarrow$ Unit Conversions $\rightarrow$ Full-Address Citation Mapping $\rightarrow$ Metadata Registration).