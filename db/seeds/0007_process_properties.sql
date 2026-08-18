-- =============================================================================
-- Seed: processing-window and LCA property definitions (DATA-GAPS G5)
-- =============================================================================
-- Three numbers were living inside React components rather than in the
-- database:
--
--   ProcessingWindowSimulator.tsx -- melt/mould temperature and pressure
--     windows per polymer id, presented to the reader with ISO/ASTM
--     references beside them.
--   LCACircularEconomy.tsx -- baseCo2Map, kg CO2e per kg of virgin resin.
--
-- Both were shown as sourced facts and neither could be cited, corrected or
-- extended to a new material without editing TypeScript. The CO2 figures are
-- the more serious: they are exactly the kind of number the whole citation
-- architecture exists to discipline.
--
-- process_temp already exists (the melt window). These add the rest. Once a
-- material has them the simulators read them like any other value, and
-- render nothing when they are absent -- which is the correct behaviour for
-- a newly-curated material that nobody has measured yet.
--
-- Note on where these values belong: with material_process in place
-- (migration 0011), the temperature and pressure rows should be attached to
-- a material_process row (subject_type = 'material_process'), not to the
-- material -- an injection mould temperature is a property of injection
-- moulding, not of the polymer. co2_footprint_virgin is genuinely a property
-- of the material itself and attaches there.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en,
     data_type, canonical_unit, allowed_units, plausible_min, plausible_max,
     symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'processing'), 'mould_temp',
     'دمای قالب', 'Mould Temperature',
     'دمای سطح قالب در فرآیندهای تزریقی و بادی. سرعت سرد شدن، درجه بلورینگی نهایی و کیفیت سطح قطعه را کنترل می‌کند.',
     'The mould surface temperature in injection and blow moulding. Controls cooling rate, final crystallinity and part surface quality.',
     'range', '°C', ARRAY['°C'], -20, 300, NULL, 15),

    ((SELECT id FROM property_group WHERE key = 'processing'), 'injection_pressure',
     'فشار تزریق', 'Injection Pressure',
     'فشار اعمالی برای پر کردن حفره قالب در فرآیند قالب‌گیری تزریقی.',
     'The pressure applied to fill the mould cavity during injection moulding.',
     'range', 'MPa', ARRAY['MPa', 'bar'], 1, 300, 'P', 25),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'co2_footprint_virgin',
     'ردپای کربن رزین بکر', 'Carbon Footprint (Virgin Resin)',
     'کیلوگرم معادل دی‌اکسید کربن منتشرشده به ازای هر کیلوگرم رزین بکر تولیدشده (از گهواره تا دروازه). عددی وابسته به منطقه و روش تولید — همیشه باید به منبع ارجاع داده شود.',
     'Kilograms of CO2 equivalent emitted per kilogram of virgin resin produced (cradle-to-gate). Region- and process-dependent, so it must always be cited.',
     'range', 'kg CO₂e/kg', ARRAY['kg CO₂e/kg'], 0, 30, NULL, 90)
ON CONFLICT (key) DO NOTHING;

-- always_review: an LCA number is regional, methodology-dependent and ages
-- badly. Flagging it here means the review queue surfaces it on every edit
-- rather than trusting it to stay correct silently.
UPDATE property_definition
SET always_review = true
WHERE key = 'co2_footprint_virgin';
