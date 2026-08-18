-- =============================================================================
-- Seed: property scoping -- applies_to_fields / applies_to_families (G3)
-- =============================================================================
-- Why this matters, restated from DATA-GAPS G3: the rebuilt frontend renders
-- an absent property as a call to action ("no data yet -- add a source").
-- With no scoping at all, every property is offered for every material, so a
-- polystyrene page would show a permanent, unfixable to-do for "melting
-- temperature" -- a number polystyrene does not have, because it is
-- amorphous. Scoping is what turns the empty state from noise into a real
-- work list, and it is what keeps `export_gaps.py --include-missing` from
-- generating the same noise as curation rows.
--
-- TWO LEVELS, ANDed. A property is offered for a material only if it passes
-- both checks. Empty array = "no restriction at this level".
--
--   applies_to_fields    -- coarse: melt-processed vs cure-processed.
--                           Expressible at field level, so it lives there.
--   applies_to_families  -- fine: semi-crystalline vs amorphous.
--                           NOT expressible at field level, which is the
--                           whole reason the column was added: polyethylene
--                           and polystyrene are both thermoplastics, and
--                           only one of them melts.
--
-- MAINTENANCE NOTE, the honest cost of this approach: applies_to_families
-- lists families by key, so adding a new semi-crystalline family (polyamides,
-- polyacetals, PEEK...) means adding it to the seven UPDATEs in section 3
-- below or those properties will be silently hidden from it. The alternative
-- -- a boolean `is_semi_crystalline` on `family` -- was not chosen because it
-- answers exactly one question and the array answers any future one; but the
-- trade is real and this is where to look when a new family's page looks
-- empty.
--
-- Idempotent: safe to run repeatedly. Every statement is an absolute
-- assignment, not an append, so re-running converges rather than accumulates.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Melt-processing properties -- thermoplastics only
-- -----------------------------------------------------------------------------
-- A thermoset does not melt, so it has no melt flow index, no blow-up ratio,
-- no melt processing window and no Vicat softening point. Its processing
-- story is the cure story, already scoped in section 2.
UPDATE property_definition
SET applies_to_fields = ARRAY['thermoplastics']
WHERE key IN (
    'mfi',                 -- melt flow index: requires a melt
    'bur',                 -- blow-up ratio: blown-film specific
    'process_temp',        -- the melt window; thermosets use cure_temperature
    'mould_temp',
    'injection_pressure',
    'vicat'                -- Vicat softening: needs a softening transition
);

-- -----------------------------------------------------------------------------
-- 2. Cure properties -- thermosets only
-- -----------------------------------------------------------------------------
-- Already set by 0006_thermoset_taxonomy_and_properties.sql. Restated here so
-- that this file is the single place to read the whole scoping picture, and
-- so a future edit to 0006 cannot silently disagree with it.
UPDATE property_definition
SET applies_to_fields = ARRAY['thermosets']
WHERE key IN (
    'gel_time',
    'pot_life',
    'cure_time',
    'cure_temperature',
    'peak_exotherm_temperature',
    'hardness_barcol'      -- thermosets are measured on Barcol, not Shore D
);

-- -----------------------------------------------------------------------------
-- 3. Crystallinity-dependent properties -- semi-crystalline families only
-- -----------------------------------------------------------------------------
-- The distinction field cannot express. All four of these families are
-- thermoplastics; only polyolefins (PE, PP) and polyesters (PET) are
-- semi-crystalline. Vinyls (PVC) and styrenics (PS) are amorphous: they have
-- a glass transition and no melting point, no heat of fusion, no crystal
-- unit cell, no lamellae and no spherulites. Offering those seven properties
-- on a PVC or PS page would be asking a curator to source something that does
-- not exist.
UPDATE property_definition
SET applies_to_families = ARRAY['polyolefins', 'polyesters']
WHERE key IN (
    'tm',                  -- amorphous polymers have no melting point
    'enthalpy_exp',        -- heat of fusion: no fusion without crystals
    'enthalpy_100_cryst',
    'crystallinity',       -- trivially zero, so not worth a curation slot
    'unit_cell',           -- no crystal lattice
    'lamella_thickness',   -- no lamellae
    'spherulite_size'      -- no spherulites
);

-- -----------------------------------------------------------------------------
-- 4. Everything else stays unscoped, deliberately
-- -----------------------------------------------------------------------------
-- density, tg, tensile_strength, the electrical block, the Hansen/solubility
-- block and the rest apply to every polymer in every family. hdt is left
-- unscoped on purpose: unlike vicat, heat deflection temperature is measured
-- on thermosets routinely. hardness_shore_d is likewise left unscoped -- rigid
-- thermosets are sometimes reported on the Shore D scale even though Barcol
-- is the usual choice, so it is uncommon rather than meaningless.

-- -----------------------------------------------------------------------------
-- Self-check: fail loudly if a key above was renamed out from under this file
-- -----------------------------------------------------------------------------
-- A silent no-op UPDATE (because someone renamed a property key) would put
-- the scoping back to "applies everywhere" with no signal at all -- exactly
-- the failure this seed exists to prevent.
DO $$
DECLARE
    missing text[];
BEGIN
    SELECT array_agg(k) INTO missing
    FROM unnest(ARRAY[
        'mfi', 'bur', 'process_temp', 'mould_temp', 'injection_pressure', 'vicat',
        'gel_time', 'pot_life', 'cure_time', 'cure_temperature',
        'peak_exotherm_temperature', 'hardness_barcol',
        'tm', 'enthalpy_exp', 'enthalpy_100_cryst', 'crystallinity',
        'unit_cell', 'lamella_thickness', 'spherulite_size'
    ]) AS k
    WHERE NOT EXISTS (SELECT 1 FROM property_definition pd WHERE pd.key = k);

    IF missing IS NOT NULL THEN
        RAISE EXCEPTION
            'seed 0008: these property keys no longer exist and their scoping was silently skipped: %',
            array_to_string(missing, ', ');
    END IF;
END
$$;
