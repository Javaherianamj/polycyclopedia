# Polymer Encyclopedia Architecture & Taxonomy

Designing a scalable database for an encyclopedia requires decoupling overarching chemical families from their highly specific industrial applications. To keep the platform fast and scalable—especially if you are organizing data into JSON blocks and serving them via edge networks like Cloudflare Workers—the hierarchy must be strictly modular. 

This architecture allows a student to grasp the general properties of Polyethylene, while an industrial user can drill down into the melt flow indices of an LDPE tubular film grade.

## 1. Database Architecture & Data Schema

To seamlessly integrate your interactive JS artifacts and charts, structure your data blocks from general to specific. 

### The Node Concept
*   **Superclass Node:** (e.g., Thermoplastics) Contains general definitions and broad market overviews.
*   **Family Node:** (e.g., Polyolefins) Contains shared chemical structures, general synthesis methods, and historical context (e.g., Ziegler-Natta catalysis).
*   **Main Entry Node:** (e.g., Polyethylene) Contains the "Range" of properties. *Artifact integration: Interactive chart showing density vs. crystallinity across all PEs.*
*   **Sub-entry Node:** (e.g., LDPE) Contains specific structural info (long-chain branching) and general LDPE properties.
*   **Grade/Form Node:** (e.g., LDPE Film Grade, LDPE Extrusion Coating Grade) Contains specific mechanical/rheological properties without listing specific vendor products.

---

## 2. The Comprehensive Taxonomy

This taxonomy outlines approximately 100 Main Entries and over 200 Sub-entries, providing a robust skeleton for the encyclopedia. Spaces for expansion (Copolymers, Blends) are included.

### Group 1: Thermoplastics (Commodity & Engineering)

#### 1.1 Polyolefins
*   **Main: Polyethylene (PE)**
    *   *Sub:* Low-Density Polyethylene (LDPE) -> *Forms: Film, Extrusion Coating, Injection*
    *   *Sub:* High-Density Polyethylene (HDPE) -> *Forms: Blow Molding, Pipe, Monofilament*
    *   *Sub:* Linear Low-Density Polyethylene (LLDPE) -> *Forms: Cast Film, Blown Film*
    *   *Sub:* Ultra-High-Molecular-Weight Polyethylene (UHMWPE) -> *Forms: Machined Parts, Fibers*
    *   *Sub:* Metallocene Polyethylene (mPE)
    *   *Sub:* Very-Low-Density Polyethylene (VLDPE)
    *   *Sub:* Cross-linked Polyethylene (PEX) -> *Forms: PEX-a, PEX-b, PEX-c*
    *   *Sub:* Ethylene-Vinyl Acetate Copolymer (EVA) -> *Grades by VA content*
*   **Main: Polypropylene (PP)**
    *   *Sub:* PP Homopolymer (hPP) -> *Forms: BOPP Film, Injection Molding*
    *   *Sub:* PP Random Copolymer (rPP) -> *Forms: High-Clarity Packaging*
    *   *Sub:* PP Block/Impact Copolymer (iPP) -> *Forms: Automotive bumpers, Crates*
    *   *Sub:* Expanded Polypropylene (EPP)
*   **Main: Polybutene-1 (PB-1)**
    *   *Sub:* Pipe Grade, Hot Melt Adhesive Grade
*   **Main: Polyisobutylene (PIB)**
    *   *Sub:* Low MW, High MW

#### 1.2 Styrenic Polymers
*   **Main: Polystyrene (PS)**
    *   *Sub:* General Purpose Polystyrene (GPPS) -> *Forms: Extrusion, Injection*
    *   *Sub:* High Impact Polystyrene (HIPS)
    *   *Sub:* Expanded Polystyrene (EPS)
    *   *Sub:* Extruded Polystyrene (XPS)
*   **Main: Styrene Copolymers**
    *   *Sub:* Acrylonitrile Butadiene Styrene (ABS) -> *Forms: High Heat, High Flow, Platable*
    *   *Sub:* Styrene Acrylonitrile (SAN)
    *   *Sub:* Acrylonitrile Styrene Acrylate (ASA)
    *   *Sub:* Styrene Maleic Anhydride (SMA)

#### 1.3 Vinyl Polymers
*   **Main: Polyvinyl Chloride (PVC)**
    *   *Sub:* Rigid PVC (UPVC) -> *Forms: Pipe, Profile Extrusion*
    *   *Sub:* Flexible/Plasticized PVC -> *Forms: Cable Jacketing, Medical Tubing, Films*
    *   *Sub:* Chlorinated Polyvinyl Chloride (CPVC)
    *   *Sub:* Polyvinylidene Chloride (PVDC) -> *Forms: Barrier Films*
*   **Main: Polyvinyl Alcohols & Acetates**
    *   *Sub:* Polyvinyl Acetate (PVAc) -> *Forms: Emulsions, Adhesives*
    *   *Sub:* Polyvinyl Alcohol (PVOH/PVA) -> *Forms: Water-soluble films*
    *   *Sub:* Polyvinyl Butyral (PVB) -> *Forms: Safety Glass Interlayers*

#### 1.4 Acrylics & Methacrylics
*   **Main: Polymethyl Methacrylate (PMMA)**
    *   *Sub:* Cast Acrylic -> *Forms: Optical sheets*
    *   *Sub:* Extruded Acrylic
    *   *Sub:* Impact-Modified PMMA
*   **Main: Polyacrylonitrile (PAN)**
    *   *Sub:* Precursor for Carbon Fiber, Textile Fibers

#### 1.5 Polyesters (Thermoplastic)
*   **Main: Polyethylene Terephthalate (PET)**
    *   *Sub:* Bottle Grade (High IV)
    *   *Sub:* Fiber Grade
    *   *Sub:* Amorphous PET (APET)
    *   *Sub:* Crystalline PET (CPET)
    *   *Sub:* Glycol-Modified PET (PETG)
*   **Main: Polybutylene Terephthalate (PBT)**
    *   *Sub:* Unfilled, Glass-Filled, Flame Retardant
*   **Main: Polytrimethylene Terephthalate (PTT)**
*   **Main: Polyethylene Naphthalate (PEN)**

#### 1.6 Polyamides (Nylons)
*   **Main: Aliphatic Polyamides**
    *   *Sub:* Polyamide 6 (PA6) -> *Forms: Fiber, Injection, Film*
    *   *Sub:* Polyamide 66 (PA66) -> *Forms: High-strength engineering parts*
    *   *Sub:* Polyamide 11 (PA11) & Polyamide 12 (PA12)
    *   *Sub:* Polyamide 46 (PA46)
*   **Main: Semi-Aromatic Polyamides (Polyphthalamides - PPA)**
*   **Main: Aromatic Polyamides (Aramids)**
    *   *Sub:* Meta-aramid (Nomex type), Para-aramid (Kevlar type)

#### 1.7 Polycarbonates (PC)
*   **Main: Bisphenol-A Polycarbonate**
    *   *Sub:* General Purpose, UV-Stabilized, Optical Grade (CD/DVD), Flame Retardant

#### 1.8 Polyacetals (Polyoxymethylene - POM)
*   **Main: POM Homopolymer (POM-H)**
*   **Main: POM Copolymer (POM-C)**

#### 1.9 High-Performance & Specialty Thermoplastics
*   **Main: Fluoropolymers**
    *   *Sub:* Polytetrafluoroethylene (PTFE) -> *Forms: Granular, Fine Powder, Aqueous Dispersion*
    *   *Sub:* Fluorinated Ethylene Propylene (FEP)
    *   *Sub:* Perfluoroalkoxy Alkane (PFA)
    *   *Sub:* Polyvinylidene Fluoride (PVDF)
*   **Main: Polyether Ether Ketone (PEEK)**
    *   *Sub:* Unfilled, Carbon-Filled, Glass-Filled, Bearing Grade
*   **Main: Polyphenylene Sulfide (PPS)**
    *   *Sub:* Linear, Cross-linked
*   **Main: Polysulfones**
    *   *Sub:* Polysulfone (PSU), Polyethersulfone (PESU), Polyphenylsulfone (PPSU)
*   **Main: Polyimides (PI) & Polyetherimides (PEI)**
    *   *Sub:* Thermosetting PI, Thermoplastic PEI
*   **Main: Liquid Crystal Polymers (LCP)**

---

### Group 2: Thermosetting Resins (Coatings & Matrices)

This section is heavily geared toward paint engineering, surface coatings, and composite matrices.

#### 2.1 Epoxy Resins
*   **Main: Bisphenol-A Epoxies (DGEBA)**
    *   *Sub:* Liquid Epoxies, Solid Epoxies -> *Forms: High-solids coatings, powder coatings*
*   **Main: Bisphenol-F Epoxies**
*   **Main: Novolac Epoxies** (EPN, ECN) -> *Forms: High-temp chemical resistant coatings*
*   **Main: Cycloaliphatic Epoxies** -> *Forms: UV-curable coatings*
*   **Main: Epoxy Curing Agents** *(Crucial paired learning blocks)*
    *   *Sub:* Aliphatic Amines, Cycloaliphatic Amines, Polyamides, Anhydrides

#### 2.2 Polyurethanes (PU) & Polyureas
*   **Main: Isocyanate Prepolymers**
    *   *Sub:* TDI-based, MDI-based, Aliphatic (HDI, IPDI) -> *Forms: Light-stable coatings*
*   **Main: Polyol Components**
    *   *Sub:* Polyether Polyols, Polyester Polyols, Acrylic Polyols
*   **Main: PU Forms & Grades**
    *   *Sub:* Flexible Foams, Rigid Foams, Elastomers, 2K Coatings, Moisture-Cure 1K Coatings

#### 2.3 Unsaturated Polyester Resins (UPR)
*   **Main: Orthophthalic Resins** -> *Forms: General purpose composites*
*   **Main: Isophthalic Resins** -> *Forms: Gel coats, chemical resistant tanks*
*   **Main: Terephthalic Resins**
*   **Main: Dicyclopentadiene (DCPD) Resins**

#### 2.4 Vinyl Ester Resins
*   **Main: Bisphenol-A Vinyl Esters**
*   **Main: Novolac Vinyl Esters**

#### 2.5 Alkyd Resins
*   **Main: Short Oil Alkyds** -> *Forms: Baking enamels, quick-dry industrial*
*   **Main: Medium Oil Alkyds** -> *Forms: Air-drying brushes, OEM finishes*
*   **Main: Long Oil Alkyds** -> *Forms: Architectural paints, wood finishes*
*   **Main: Modified Alkyds** -> *Forms: Urethane-modified, Silicone-modified, Styrenated*

#### 2.6 Amino Resins
*   **Main: Urea-Formaldehyde (UF)** -> *Forms: Wood adhesives, clear baking enamels*
*   **Main: Melamine-Formaldehyde (MF)** -> *Forms: High-durability automotive topcoats, laminates*

#### 2.7 Phenolic Resins
*   **Main: Resol Resins** (Base-catalyzed, 1-step)
*   **Main: Novolac Resins** (Acid-catalyzed, 2-step)

---

### Group 3: Elastomers & Rubbers

#### 3.1 General Purpose Rubbers
*   **Main: Natural Rubber (NR)** -> *Forms: Ribbed Smoked Sheets, Technically Specified Rubber, Latex*
*   **Main: Styrene-Butadiene Rubber (SBR)** -> *Forms: Emulsion SBR, Solution SBR*
*   **Main: Polybutadiene Rubber (BR)** -> *Forms: High-cis, Low-cis*
*   **Main: Synthetic Polyisoprene (IR)**

#### 3.2 Specialty Rubbers
*   **Main: Nitrile Rubber (NBR)** -> *Forms: High-acrylonitrile, Low-acrylonitrile, HNBR*
*   **Main: Chloroprene Rubber (CR - Neoprene)**
*   **Main: Butyl Rubber (IIR)** -> *Forms: Regular, Chlorobutyl, Bromobutyl*
*   **Main: Ethylene Propylene Diene Monomer (EPDM)** -> *Forms: High-diene, Low-diene*
*   **Main: Fluoroelastomers (FKM / FFKM)**
*   **Main: Silicone Rubbers (VMQ, PMQ, FMQ)** -> *Forms: HTV, RTV, LSR*

#### 3.3 Thermoplastic Elastomers (TPE)
*   **Main: Styrenic Block Copolymers (TPE-S)**
    *   *Sub:* SBS, SEBS, SIS
*   **Main: Thermoplastic Polyurethanes (TPU)**
    *   *Sub:* Polyester-based, Polyether-based
*   **Main: Thermoplastic Vulcanizates (TPV)**
*   **Main: Thermoplastic Polyolefins (TPO)**
*   **Main: Copolyester Elastomers (COPE)**

---

### Group 4: Adhesives, Sealants & Binders

*(Note: Many chemical families here overlap with Resins and Elastomers, but these entries focus specifically on formulation behavior for adhesion).*

*   **Main: Structural Adhesives**
    *   *Sub:* 2-Part Epoxies, Cyanoacrylates, Toughened Acrylics, Anaerobic Adhesives
*   **Main: Pressure Sensitive Adhesives (PSA)**
    *   *Sub:* Acrylic Emulsions, Solvent-based Acrylics, Rubber-based (Hot melt & Solvent)
*   **Main: Hot Melt Adhesives (HMA)**
    *   *Sub:* EVA-based, Polyolefin-based, Metallocene-based, Reactive Polyurethane (PUR)
*   **Main: Sealants**
    *   *Sub:* RTV Silicone Sealants, Polyurethane Sealants, Polysulfide Sealants, Butyl Tapes

---

### Group 5: Biopolymers, Advanced & Additives

#### 5.1 Bioplastics & Biodegradable Polymers
*   **Main: Polylactic Acid (PLA)** -> *Forms: 3D printing filament, compostable packaging*
*   **Main: Polyhydroxyalkanoates (PHA/PHB)**
*   **Main: Polybutylene Adipate Terephthalate (PBAT)**
*   **Main: Polycaprolactone (PCL)**
*   **Main: Natural & Semi-Synthetic**
    *   *Sub:* Cellulose Acetate, Chitosan, Starch-based blends, Lignin-based polymers

#### 5.2 Conducting & Light-Emitting Polymers
*   **Main: Polyaniline (PANI)**
*   **Main: Polythiophene (PT)** -> *Sub: PEDOT:PSS*
*   **Main: Polypyrrole (PPy)**

#### 5.3 Polymer Additives (Educational Artifact Expansion)
*   *This group links to the functional properties of the resins above.*
*   **Main: Plasticizers** (Phthalates, Non-phthalates, Epoxidized Soybean Oil)
*   **Main: Flame Retardants** (Halogenated, ATH, Intumescent)
*   **Main: Stabilizers** (UV Absorbers, HALS, Antioxidants, Thermal Stabilizers for PVC)
*   **Main: Fillers & Reinforcements** (Carbon Black, Silica, Glass Fibers, Carbon Fibers, Nanoclays)

---

## 3. Creating the "Learning Bridge" Data Fields

When writing your JSON backend for each sub-entry, structure it to bridge theory and industry:

1.  **Fundamental Chemistry:** Monomer, Synthesis type (addition/condensation, Ziegler-Natta/Metallocene), Glass Transition ($T_g$), Melting Point ($T_m$).
2.  **General Property Range:** Tensile strength range, elongation range, chemical resistance profile. 
3.  **Industrial Processing Variables:** Melt Flow Index (MFI) considerations, shrinkage, drying requirements.
4.  **Learning Artifacts Array:**
    *   `artifact_type`: "interactive_chart" -> *E.g., MFI vs. Impact Strength.*
    *   `artifact_type`: "mechanism_animation" -> *E.g., Cross-linking mechanism of Poly Resin Co. alkyds with melamine.*
    *   `artifact_type`: "article_review" -> *Summaries of latest research papers.*
5.  **Form/Grade Specifics:** Nested objects containing the specific nuances of "Tubular Film" vs "Cast Film" for LDPE.
