-- =============================================================================
-- Seed: test_method
-- =============================================================================
-- A property value without its test method is not comparable across materials.
-- Tensile strength per ASTM D638 at one crosshead speed is not the same number
-- as tensile strength per ISO 527 at another, and the legacy dataset recorded
-- neither -- which is one reason its values could not be compared rigorously.
--
-- ASTM and ISO are listed as separate rows even where they are near-equivalent
-- (D1238 vs 1133), because a datasheet cites one or the other, not both, and
-- the citation must record what the document actually said.
--
-- The first four pairs are the methods explicitly named in
-- src/components/ResourcesModal.tsx. The remainder cover the other seeded
-- property groups and will be referenced as real datasheets are ingested.
--
-- Idempotent: UNIQUE (standard_body, code) backs ON CONFLICT.
-- =============================================================================

INSERT INTO test_method (standard_body, code, title) VALUES
    -- Named in ResourcesModal.tsx
    ('ASTM', 'D1238', 'Standard Test Method for Melt Flow Rates of Thermoplastics by Extrusion Plastometer'),
    ('ISO',  '1133',  'Plastics - Determination of the melt mass-flow rate (MFR) and melt volume-flow rate (MVR) of thermoplastics'),
    ('ASTM', 'D638',  'Standard Test Method for Tensile Properties of Plastics'),
    ('ISO',  '527',   'Plastics - Determination of tensile properties'),
    ('ASTM', 'D3418', 'Standard Test Method for Transition Temperatures and Enthalpies of Fusion and Crystallization of Polymers by Differential Scanning Calorimetry'),
    ('ISO',  '11357', 'Plastics - Differential scanning calorimetry (DSC)'),
    ('ASTM', 'D7611', 'Standard Practice for Coding Plastic Manufactured Articles for Resin Identification'),
    ('ISO',  '11469', 'Plastics - Generic identification and marking of plastics products'),

    -- Mechanical
    ('ASTM', 'D790',  'Standard Test Methods for Flexural Properties of Unreinforced and Reinforced Plastics and Electrical Insulating Materials'),
    ('ISO',  '178',   'Plastics - Determination of flexural properties'),
    ('ASTM', 'D256',  'Standard Test Methods for Determining the Izod Pendulum Impact Resistance of Plastics'),
    ('ISO',  '180',   'Plastics - Determination of Izod impact strength'),
    ('ASTM', 'D2240', 'Standard Test Method for Rubber Property - Durometer Hardness'),

    -- Physical
    ('ASTM', 'D792',  'Standard Test Methods for Density and Specific Gravity (Relative Density) of Plastics by Displacement'),
    ('ISO',  '1183',  'Plastics - Methods for determining the density of non-cellular plastics'),
    ('ASTM', 'D570',  'Standard Test Method for Water Absorption of Plastics'),
    ('ASTM', 'D542',  'Standard Test Method for Index of Refraction of Transparent Organic Plastics'),
    ('ASTM', 'D3985', 'Standard Test Method for Oxygen Gas Transmission Rate Through Plastic Film and Sheeting Using a Coulometric Sensor'),

    -- Thermal
    ('ASTM', 'D648',  'Standard Test Method for Deflection Temperature of Plastics Under Flexural Load in the Edgewise Position'),
    ('ISO',  '75',    'Plastics - Determination of temperature of deflection under load'),
    ('ASTM', 'D1525', 'Standard Test Method for Vicat Softening Temperature of Plastics'),
    ('ISO',  '306',   'Plastics - Thermoplastic materials - Determination of Vicat softening temperature (VST)'),
    ('ASTM', 'E1131', 'Standard Test Method for Compositional Analysis by Thermogravimetry'),
    ('ASTM', 'C177',  'Standard Test Method for Steady-State Heat Flux Measurements and Thermal Transmission Properties by Means of the Guarded-Hot-Plate Apparatus'),
    ('ASTM', 'E831',  'Standard Test Method for Linear Thermal Expansion of Solid Materials by Thermomechanical Analysis'),

    -- Electrical
    ('ASTM', 'D149',  'Standard Test Method for Dielectric Breakdown Voltage and Dielectric Strength of Solid Electrical Insulating Materials at Commercial Power Frequencies'),
    ('ASTM', 'D150',  'Standard Test Methods for AC Loss Characteristics and Permittivity (Dielectric Constant) of Solid Electrical Insulation'),
    ('ASTM', 'D257',  'Standard Test Methods for DC Resistance or Conductance of Insulating Materials')
ON CONFLICT (standard_body, code) DO NOTHING;
