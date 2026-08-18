-- 0018_variance_class.sql
-- Polypedia: U1 v2 FR-4 -- variance_class on property_definition.
--
-- Answers database-revision-questions.md Q4 (A, recommended). Without this,
-- every property looked equally variable, so there was no rule telling a
-- curator when enough sources had been found. Three classes:
--   intrinsic         -- set by chemistry/morphology (density, Tg, Tm,
--                        dielectric constant, Hansen parameters, ...).
--                        Narrow; safe to publish at material level once a
--                        few sources overlap.
--   grade_dependent    -- driven by molecular weight / MFI / comonomer
--                        content (MFI itself, tensile strength, modulus,
--                        hardness, impact, ...). Material level should
--                        publish the *envelope*, not a point number.
--   process_dependent  -- driven by processing history / orientation / mould
--                        geometry (HDT, Vicat, crystallinity, cure and
--                        process temperatures, ...). Should not be published
--                        at material level without a process/grade-class
--                        qualifier at all.
--
-- Classification is this migration's judgement call, not a derived fact --
-- documented per-key below so it can be revisited per property without
-- another migration (UPDATE, not DDL).

BEGIN;

CREATE TYPE variance_class AS ENUM ('intrinsic', 'grade_dependent', 'process_dependent');

ALTER TABLE property_definition
    ADD COLUMN variance_class variance_class NOT NULL DEFAULT 'grade_dependent';

COMMENT ON COLUMN property_definition.variance_class IS
    'How much a property varies across commercial grades of the same material (U1 v2 FR-4). Drives both the publish-threshold trigger (0021) and, eventually, how the frontend renders a value (point number vs. envelope with a caveat). Default grade_dependent is the conservative choice for any property not explicitly classified below -- it demands more sources, not fewer, when nobody has made the call yet.';

-- Chemistry/morphology-set constants: narrow by nature, safe at material
-- level once independent sources overlap.
UPDATE property_definition SET variance_class = 'intrinsic' WHERE key IN (
    'appearance', 'cte', 'degradation_temp', 'density', 'dielectric_constant',
    'dielectric_strength', 'dissipation_factor', 'dp_range', 'entanglement_mw',
    'enthalpy_100_cryst', 'enthalpy_exp', 'ffv', 'flory_huggins_chi',
    'hansen_d', 'hansen_h', 'hansen_p', 'kinetic_notes', 'lamella_thickness',
    'mechanism', 'mn', 'monomer_formula', 'monomer_molar_mass', 'monomer_name',
    'mw', 'pdi', 'persistence_length', 'power_law_index', 'radius_of_gyration',
    'refractive_index', 'repeating_unit', 'rheology_notes',
    'solubility_parameter', 'tg', 'thermo_notes', 'tm', 'unit_cell',
    'volume_resistivity', 'conductivity'
);

-- Processing-history/orientation-driven: must not be published at material
-- level without a process or grade-class qualifier (enforced in 0021).
UPDATE property_definition SET variance_class = 'process_dependent' WHERE key IN (
    'bur', 'crystallinity', 'cure_temperature', 'cure_time', 'gel_time',
    'hdt', 'injection_pressure', 'mould_temp', 'peak_exotherm_temperature',
    'pot_life', 'process_temp', 'spherulite_size', 'vicat'
);

-- Everything else (MFI, tensile strength, modulus, hardness, impact,
-- permeability, water absorption, CO2 footprint, zero-shear viscosity) stays
-- the default grade_dependent -- exactly the properties the owner named as
-- differing "from product to the other".

INSERT INTO schema_migration (version) VALUES ('0018') ON CONFLICT DO NOTHING;

COMMIT;
