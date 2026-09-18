# Deep-Tree Polymer Encyclopedia Architecture & Taxonomy (v2.0)

This document expands the structural schema to its furthest granular extent, mapping down to the exact monomeric variations, synthesis methodologies, and application-specific grades. This deep tree is designed for a relational or NoSQL database (like your JSON/Cloudflare Workers setup), where parent nodes pass inherited traits down to highly specific child nodes.

---

## Part 1: The Deep Node Data Schema

To support this level of depth without data duplication, your database should use an inheritance model. 

### Data Structure Blueprint
*   **Tier 1: Superclass** (e.g., Thermoplastics) -> *Defines reversibility of thermal transitions.*
*   **Tier 2: Chemical Family** (e.g., Polyolefins) -> *Defines backbone (C-C), general chemical resistance.*
*   **Tier 3: Main Polymer** (e.g., Polyethylene) -> *Defines monomer (Ethylene), $T_g$ baseline.*
*   **Tier 4: Structural Sub-Type** (e.g., LLDPE) -> *Defines branching architecture.*
*   **Tier 5: Comonomer / Synthesis Variant** (e.g., C8-LLDPE / Octene) -> *Defines precise density ranges and tear strength.*
*   **Tier 6: Processing Grade** (e.g., Cast Film Grade) -> *Defines specific MFI (Melt Flow Index), rheology, and additive packages (slip/antiblock).*

---

## Part 2: The Ultra-Deep Taxonomy

### Group 1: Thermoplastics (Commodity & Engineering)

#### 1.1 Polyolefins & Copolymers
*   **Polyethylene (PE)**
    *   *Low-Density Polyethylene (LDPE)*
        *   Autoclave Process (Highly branched, good optics) -> *Grades: Extrusion Coating, Clarity Film*
        *   Tubular Process (Long-chain branching) -> *Grades: Heavy-duty shrink film, Agricultural film*
    *   *Linear Low-Density Polyethylene (LLDPE)*
        *   Butene Copolymer (C4) -> *Grades: General purpose blown film, blending*
        *   Hexene Copolymer (C6) -> *Grades: High-strength cast film, geomembranes*
        *   Octene Copolymer (C8) -> *Grades: High-performance stretch film, meat packaging*
    *   *High-Density Polyethylene (HDPE)*
        *   Unimodal HDPE -> *Grades: Injection molding (crates/pallets)*
        *   Bimodal/Multimodal HDPE -> *Grades: PE100 Pressure Pipe, High-molecular-weight (HMW) film*
    *   *Specialty PE*
        *   Metallocene PE (mPE) -> *Grades: Plastomers, Elastomers (high toughness)*
        *   Ultra-High-Molecular-Weight PE (UHMWPE) -> *Grades: Sintered sheets, Gel-spun fibers (Dyneema type)*
        *   Cross-linked PE (PEX) -> *Types: PEX-a (Peroxide), PEX-b (Silane), PEX-c (E-beam)*
    *   *Ethylene Copolymers*
        *   Ethylene-Vinyl Acetate (EVA) -> *Nodes by VA%: 2-10% (Film), 15-28% (Hot melt/Foam), 40%+ (Elastomer)*
        *   Ethylene-Vinyl Alcohol (EVOH) -> *Grades by mol% Ethylene (barrier properties)*
        *   Ethylene-Butyl Acrylate (EBA) & Ethylene-Methyl Acrylate (EMA)
*   **Polypropylene (PP)**
    *   *PP Homopolymer (hPP)* -> *Grades: Isotactic (BOPP film, raffia), Syndiotactic, Atactic (amorphous)*
    *   *PP Random Copolymer (rPP)* -> *Comonomer: Ethylene (1-7%) -> Grades: Clarified injection molding, Hot water pipe*
    *   *PP Block Copolymer (bPP / Impact PP)* -> *EPR rubber phase inclusion -> Grades: Automotive interior, Battery cases*
    *   *High Melt Strength PP (HMS-PP)* -> *Grades: Extrusion foaming*

#### 1.2 Styrenic Polymers
*   **Homopolymers**
    *   *General Purpose Polystyrene (GPPS)* -> *Grades: High Heat, High Flow (Cutlery, CD cases)*
    *   *Expanded Polystyrene (EPS)* -> *Grades: Block molding, Shape molding (Pentane blown)*
    *   *Extruded Polystyrene (XPS)* -> *Grades: Insulation boards*
*   **Copolymers & Rubber-Modified**
    *   *High Impact Polystyrene (HIPS)* -> *Polybutadiene grafted -> Grades: ESCR (Environmental Stress Crack Resistant), High-gloss*
    *   *Styrene Acrylonitrile (SAN)* -> *Grades: Cosmetic packaging, battery jars*
    *   *Acrylonitrile Butadiene Styrene (ABS)*
        *   Emulsion ABS -> *Grades: High impact, Platable*
        *   Mass/Continuous ABS -> *Grades: Low gloss, High flow*
    *   *Weatherable Styrenics* -> *ASA (Acrylate rubber), AES (EPDM rubber)*

#### 1.3 Vinyl & Halogenated Polymers
*   **Polyvinyl Chloride (PVC)**
    *   *Suspension PVC (S-PVC)* -> *Grades: K-value 65-68 (Rigid pipes), K-value 70+ (Flexible calendering)*
    *   *Emulsion/Paste PVC (E-PVC)* -> *Grades: Plastisols (Dip coating, artificial leather)*
    *   *Mass PVC (M-PVC)* -> *Grades: High clarity medical blisters*
*   **Chlorinated & Specialty Vinyls**
    *   *Chlorinated PVC (CPVC)* -> *Grades: Industrial hot water pipe*
    *   *Polyvinylidene Chloride (PVDC)* -> *Grades: Extrudable barrier resin, Aqueous dispersion coating*
*   **Vinyl Acetate & Alcohol**
    *   *PVAc* -> *Grades: Emulsion (Wood glue), Solid (Chewing gum base)*
    *   *PVOH* -> *Nodes by Hydrolysis %: Fully hydrolyzed (Hot water soluble), Partially hydrolyzed (Cold water soluble)*

#### 1.4 Engineering & High-Performance Thermoplastics
*   **Polyamides (Nylons)**
    *   *Aliphatic:* PA6 (Caprolactam), PA66 (HMDA+Adipic), PA46 (High heat), PA11 (Castor oil derived), PA12 (Low moisture absorption)
    *   *Semi-Aromatic (PPA):* PA6T, PA9T, PA10T (SMT electronic connectors)
    *   *Aromatic (Aramids):* PMIA (Meta-aramid, flame retardant), PPTA (Para-aramid, ballistic)
*   **Polyesters**
    *   *PET:* Amorphous (APET), Crystallized (CPET), Bottle Grade (IV 0.7-0.86), Fiber Grade (IV 0.6)
    *   *PBT:* Unfilled, Glass-fiber reinforced (PBT-GF30), Flame Retardant (V-0)
*   **Polycarbonates (PC)**
    *   *BPA-PC:* Standard, Optical (high purity), UV-stabilized, Branch/Flame-retardant
    *   *High-Heat PC:* Copolycarbonates (e.g., BPA/BPTMC)
*   **High-Temperature Sulfur/Ether/Imide Polymers**
    *   *PPS (Polyphenylene Sulfide):* Linear vs. Branched/Cross-linked
    *   *PAEK Family:* PEEK (Polyether ether ketone), PEKK (Polyether ketone ketone)
    *   *Sulfones:* PSU, PESU, PPSU (Medical sterilization grades)
    *   *Imides:* PEI (Polyetherimide - Ultem), PAI (Polyamide-imide)

---

### Group 2: Thermosetting Resins & Coatings (Deep Architecture)

*This section details the intricate matrix of resins and their cross-linking counterparts, crucial for coating and paint engineering.*

#### 2.1 Polyurethanes (PU) & Polyureas
*   **Isocyanate Components (A-Side)**
    *   *Aromatic:* TDI (80/20, 65/35 blends), MDI (Polymeric MDI, Pure 4,4'-MDI) -> *Use: Foams, interior elastomers*
    *   *Aliphatic (Light Stable):* HDI (Trimer, Biuret, Uretdione), IPDI, H12MDI -> *Use: Automotive clearcoats, aerospace*
*   **Polyol Components (B-Side)**
    *   *Polyether Polyols:* PTMEG (High resilience), PPG, PEG (Water-blown foams)
    *   *Polyester Polyols:* Adipate-based (Oil resistant), Phthalic-based
    *   *Acrylic Polyols:* High-solids automotive refinish
    *   *Polycarbonate Polyols:* Ultra-durable elastomeric coatings
*   **PU Systems**
    *   *2K PUR:* Solvent-borne, High-solids, Water-borne (PUDs)
    *   *1K Moisture-Cure:* Isocyanate-terminated prepolymers
    *   *Blocked Isocyanates:* 1K baking enamels (unblocking at 120-160°C)

#### 2.2 Alkyd Resins (By Oil Length & Type)
*   **Short Oil Alkyds (<40% oil)**
    *   *Drying/Semi-drying (TOFA, Soybean):* Air-dry industrial primers
    *   *Non-drying (Coconut, Castor):* Plasticizers for nitrocellulose lacquers, baking enamels (cross-linked with Melamine)
*   **Medium Oil Alkyds (40-60% oil)** -> *Linseed, Soya -> OEM finishes, implement enamels*
*   **Long Oil Alkyds (>60% oil)** -> *Linseed, Safflower -> Architectural brushes, exterior trim (High penetration)*
*   **Modified Alkyds**
    *   *Styrenated/Acrylated Alkyds:* Fast-dry industrial
    *   *Urethane Alkyds:* Wood floor varnishes (high abrasion)
    *   *Silicone Alkyds:* Heat-resistant, extreme weatherability (Navy ship coatings)

#### 2.3 Epoxy Resins & Curing Systems
*   **Base Epoxies**
    *   *DGEBA (Bisphenol-A):* Liquid (EEW 180-190), Solid (EEW 500-4000 for Powder Coatings/Baking)
    *   *DGEBF (Bisphenol-F):* Lower viscosity, higher chemical resistance
    *   *Novolac Epoxies (EPN/ECN):* High cross-link density, extreme chemical tank linings
    *   *Cycloaliphatic Epoxies:* UV-curable, excellent arc-track resistance (Electronics)
*   **Curing Agents (Hardeners)**
    *   *Aliphatic Amines (DETA, TETA):* Fast cure, poor blush resistance
    *   *Cycloaliphatic Amines (IPDA):* Water-spot resistant, low temperature cure
    *   *Polyamides & Polyamidoamines:* Flexible, long pot life, good wetting (Marine primers)
    *   *Phenalkamines (Cashew nut shell liquid derived):* Low temp/high humidity cure, surface tolerant
    *   *Anhydrides (MTHPA):* High temp baking, electrical potting

#### 2.4 Amino Resins (Cross-linkers)
*   **Melamine-Formaldehyde (MF)**
    *   *Highly Alkylated (HMMM):* Needs strong acid catalyst, high flexibility
    *   *Partially Alkylated:* Fast cure, weak acid catalyzed
    *   *Butylated Melamines:* Excellent compatibility with Alkyds
*   **Urea-Formaldehyde (UF)** -> *Acid curing wood finishes (conversion varnishes)*

---

### Group 3: Elastomers (Deep Vulcanization & Backbone Metrics)

#### 3.1 Diene Rubbers
*   **Natural Rubber (NR / Polyisoprene)**
    *   *Grades:* RSS (Ribbed Smoked Sheet), TSR (Technically Specified - e.g., SMR 20), CV (Constant Viscosity)
*   **Styrene-Butadiene Rubber (SBR)**
    *   *Emulsion SBR (E-SBR):* Cold polymerized (Series 1500), Oil-extended (Series 1700)
    *   *Solution SBR (S-SBR):* High vinyl (Tire tread, low rolling resistance)
*   **Polybutadiene (BR)**
    *   *Neodymium/Cobalt Catalyzed:* High-cis (>96%), excellent abrasion resistance

#### 3.2 Saturated & Specialty Rubbers
*   **EPDM**
    *   *Diene Types:* ENB (Fast cure), DCPD (Peroxide cure compatible)
*   **Chloroprene (Neoprene / CR)**
    *   *G-Type (Thiuram modified):* Mastication required
    *   *W-Type (Mercaptan modified):* Storage stable
*   **Nitrile Rubber (NBR)**
    *   *ACN Content:* Low (18% - Cold flexible), High (45% - High oil/fuel resistant)
    *   *Hydrogenated (HNBR):* Extreme heat and sour gas resistance
*   **Fluoroelastomers (FKM)**
    *   *Copolymers (VDF/HFP), Terpolymers (VDF/HFP/TFE), Perfluoroelastomers (FFKM - Kalrez)*

---

## Part 3: Deep Interactive Artifact Integration mapping

Within your database, each terminal node (e.g., *"Short Oil Non-Drying Alkyd"* or *"HDPE Bimodal Pipe Grade"*) should contain an `artifacts_array`. Here is how you map them to the deep schema:

1.  **Rheology & Processing Artifacts (JS Charts):**
    *   *Attached to:* Thermoplastics -> Grade Nodes.
    *   *Content:* Interactive shear rate vs. viscosity curves (log-log plots). The user changes the MFI slider to see how the viscosity curve shifts.
2.  **Cross-linking Mechanism Animations (WebGL/JS):**
    *   *Attached to:* Thermosets -> Curing System Nodes (e.g., Polyurethane 2K).
    *   *Content:* Step-growth polymerization animations. Show an isocyanate group reacting with a hydroxyl group, highlighting the urethane linkage formation.
3.  **Property Radar Charts (Interactive):**
    *   *Attached to:* Family Nodes (e.g., comparing Nylons).
    *   *Content:* A dynamic radar chart comparing PA6, PA66, and PA12 across vectors like: Moisture Absorption, Melting Point, Impact Strength, and Cost.
4.  **Formulation Calculators (Edge Compute/Workers):**
    *   *Attached to:* Epoxy and PU nodes.
    *   *Content:* An EEW (Epoxide Equivalent Weight) to AHEW (Amine Hydrogen Equivalent Weight) stoichiometric mixing ratio calculator. Students input generic resin values; industry users input specific datasheet values.
