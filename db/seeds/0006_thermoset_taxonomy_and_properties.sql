-- =============================================================================
-- Seed: thermoset resin taxonomy + cure-specific property definitions
-- =============================================================================
-- The existing property registry was populated from the legacy prototype,
-- which covered only six thermoplastics. Thermoset resins (epoxy, phenolic,
-- unsaturated polyester) are characterised differently: they do not melt
-- (no tm, no mfi) and are instead defined by their CURE behaviour -- gel
-- time, cure temperature, peak exotherm, pot life, and post-cure hardness
-- measured on a different scale (Barcol, not Shore D).
--
-- This is exactly what the registry-driven design exists for: adding a
-- property or a family is a seed INSERT, not a schema migration. Nothing
-- here touches db/migrations/.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Family taxonomy: thermoset-resins (parent) with three sub-families, under
-- the already-seeded 'thermosets' field.
-- -----------------------------------------------------------------------------
INSERT INTO family (field_id, parent_id, key, name_fa, name_en, sort_order)
VALUES (
    (SELECT id FROM field WHERE key = 'thermosets'),
    NULL,
    'thermoset-resins',
    'رزین‌های گرماسخت',
    'Thermoset Resins',
    10
)
ON CONFLICT (field_id, key) DO NOTHING;

INSERT INTO family (field_id, parent_id, key, name_fa, name_en, sort_order)
VALUES
    ((SELECT id FROM field WHERE key = 'thermosets'),
     (SELECT id FROM family WHERE key = 'thermoset-resins'),
     'epoxies', 'اپوکسی‌ها', 'Epoxies', 1),
    ((SELECT id FROM field WHERE key = 'thermosets'),
     (SELECT id FROM family WHERE key = 'thermoset-resins'),
     'phenolics', 'فنولیک‌ها', 'Phenolics', 2),
    ((SELECT id FROM field WHERE key = 'thermosets'),
     (SELECT id FROM family WHERE key = 'thermoset-resins'),
     'unsaturated-polyesters', 'پلی‌استرهای غیراشباع', 'Unsaturated Polyesters', 3)
ON CONFLICT (field_id, key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- New property definitions, scoped to thermosets via applies_to_fields.
-- Cure-process properties join the existing 'processing' group; Barcol
-- hardness joins 'mechanical' alongside the existing Shore D hardness --
-- both groups already exist and drive the current UI tabs, so no frontend
-- change is required to display these once cited.
-- -----------------------------------------------------------------------------

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en,
     data_type, canonical_unit, allowed_units, plausible_min, plausible_max,
     applies_to_fields, symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'processing'),
     'gel_time', 'زمان ژل شدن', 'Gel Time',
     'مدت زمان از اختلاط تا شروع ژل شدن رزین',
     'Time from mixing to the onset of gelation.',
     'numeric', 'min', ARRAY['min','s','hr'], 0, 1440,
     ARRAY['thermosets'], NULL, 40),

    ((SELECT id FROM property_group WHERE key = 'processing'),
     'pot_life', 'عمر کاری', 'Pot Life',
     'مدت زمانی که رزین مخلوط‌شده پس از اختلاط قابل استفاده باقی می‌ماند',
     'Working time after mixing before viscosity rises too far to use.',
     'numeric', 'min', ARRAY['min','s','hr'], 0, 1440,
     ARRAY['thermosets'], NULL, 41),

    ((SELECT id FROM property_group WHERE key = 'processing'),
     'cure_time', 'زمان پخت', 'Cure Time',
     'مدت زمان لازم برای رسیدن به پخت کامل یا کاربردی در دمای مشخص',
     'Time to reach full or practical cure at a stated temperature.',
     'numeric', 'min', ARRAY['min','hr'], 0, 10080,
     ARRAY['thermosets'], NULL, 42),

    ((SELECT id FROM property_group WHERE key = 'processing'),
     'cure_temperature', 'دمای پخت', 'Cure Temperature',
     'دمای معمول برای پخت رزین',
     'Typical temperature at which the resin is cured.',
     'numeric', '°C', ARRAY['°C'], 0, 300,
     ARRAY['thermosets'], NULL, 43),

    ((SELECT id FROM property_group WHERE key = 'processing'),
     'peak_exotherm_temperature', 'دمای اوج گرمازایی', 'Peak Exotherm Temperature',
     'بیشینه دمای رسیده‌شده در طول واکنش پخت گرمازا',
     'Maximum temperature reached during the exothermic cure reaction.',
     'numeric', '°C', ARRAY['°C'], 0, 400,
     ARRAY['thermosets'], NULL, 44),

    ((SELECT id FROM property_group WHERE key = 'mechanical'),
     'hardness_barcol', 'سختی بارکول', 'Barcol Hardness',
     'سختی اندازه‌گیری‌شده به روش بارکول (ASTM D2583)، معمول برای گرماسخت‌های پخت‌شده',
     'Hardness measured on the Barcol scale (ASTM D2583), standard for cured thermosets.',
     'numeric', 'Barcol', ARRAY['Barcol'], 0, 100,
     ARRAY['thermosets'], NULL, 61)
ON CONFLICT (key) DO NOTHING;

-- Barcol hardness test method, referenced from property_value.test_method_id
-- once curators start citing it.
INSERT INTO test_method (standard_body, code, title)
VALUES ('ASTM', 'D2583', 'Standard Test Method for Indentation Hardness of Rigid Plastics by Means of a Barcol Impressor')
ON CONFLICT (standard_body, code) DO NOTHING;
