-- 0025_resin_and_flammability_properties.sql
--
-- Adds the 12 properties that the PP/PVC/PMMA curation pass (2026-08-12) had
-- real, well-cited data for but no registry key to put it in. Every one of
-- them was extracted, verified against a verbatim quote, and then had to be
-- dropped on import -- which is data loss caused by the registry, not by the
-- source or the curator.
--
-- Two deliberate groupings:
--
-- 1. Polymer-general properties (flexural_strength, limiting_oxygen_index,
--    molding_shrinkage, and the four resin/lot specs) are unscoped: they are
--    measured for many polymers, not just the one that happened to surface
--    them. inherent_viscosity in particular is a headline PET spec and the
--    standard PA molecular-weight proxy, not a PVC curiosity.
--
-- 2. Four properties ARE definitionally PVC-only and are scoped to the
--    `vinyls` family so they never render as a permanent gap on every other
--    material: k_value (Fikentscher K, a PVC trade convention),
--    residual_vcm (vinyl chloride monomer -- only PVC has one),
--    cell_classification (ASTM D1784 is a PVC standard), and
--    dehydrochlorination_onset (only a chlorinated backbone can lose HCl).
--
-- dehydrochlorination_onset is intentionally SEPARATE from degradation_temp
-- rather than folded into it. They are different measurements and they
-- disagree for good reason: Qiao 2003 puts HCl evolution at ~150 C while Yu
-- 2016 puts mass-loss onset at 250-320 C. Collapsing them into one key would
-- have forced a fake conflict between two correct numbers.
--
-- NOT added, because they are existing properties under a datasheet alias --
-- adding them would have split one property across two keys:
--     specific_gravity    -> density
--     tensile_modulus     -> young_modulus
--     durometer_hardness  -> hardness_shore_d
--
-- Idempotent: ON CONFLICT (key) DO NOTHING, safe to re-run.

BEGIN;

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en,
     data_type, canonical_unit, plausible_min, plausible_max,
     applies_to_families, sort_order)
VALUES
    -- --- Polymer-general -------------------------------------------------
    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'flexural_strength',
     'استحکام خمشی', 'Flexural Strength',
     'حداکثر تنشی که ماده در آزمون خمش سه‌نقطه‌ای پیش از شکست تحمل می‌کند.',
     'The maximum stress the material withstands in a three-point bend test before failure.',
     'range', 'MPa', 1, 500, '{}', 35),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'limiting_oxygen_index',
     'شاخص اکسیژن حدی', 'Limiting Oxygen Index (LOI)',
     'حداقل درصد اکسیژن در جو آزمون که برای ادامه سوختن ماده لازم است؛ معیار خودخاموش‌شوندگی.',
     'The minimum percentage of oxygen in the test atmosphere needed to sustain combustion -- a measure of self-extinguishing behaviour.',
     'range', '%', 5, 100, '{}', 95),

    ((SELECT id FROM property_group WHERE key = 'processing'), 'molding_shrinkage',
     'جمع‌شدگی قالب‌گیری', 'Molding Shrinkage',
     'درصد کاهش ابعاد قطعه پس از خروج از قالب و سرد شدن، در جهت جریان مذاب.',
     'The percentage dimensional reduction of a part after demoulding and cooling, measured in the flow direction.',
     'range', '%', 0, 10, '{}', 25),

    -- --- Resin / lot specifications (general) ----------------------------
    ((SELECT id FROM property_group WHERE key = 'physical'), 'inherent_viscosity',
     'ویسکوزیته ذاتی', 'Inherent Viscosity (IV)',
     'معیار غیرمستقیم وزن مولکولی رزین که از اندازه‌گیری ویسکوزیته محلول رقیق به دست می‌آید.',
     'An indirect measure of resin molecular weight, obtained from the viscosity of a dilute solution.',
     'range', 'dL/g', 0.2, 3, '{}', 60),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'relative_viscosity',
     'ویسکوزیته نسبی', 'Relative Viscosity',
     'نسبت ویسکوزیته محلول پلیمر به ویسکوزیته حلال خالص؛ شاخص رایج وزن مولکولی در پلی‌آمیدها.',
     'The ratio of polymer-solution viscosity to pure-solvent viscosity; the common molecular-weight index for polyamides.',
     'range', 'dimensionless', 1, 10, '{}', 61),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'bulk_density',
     'چگالی توده', 'Bulk Density',
     'جرم واحد حجم رزین به صورت پودر یا گرانول، شامل فضای خالی بین ذرات (با چگالی ماده متفاوت است).',
     'Mass per unit volume of the resin as powder or pellets, including the voids between particles -- distinct from material density.',
     'range', 'g/cm³', 0.1, 1.5, '{}', 62),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'average_particle_size',
     'اندازه متوسط ذرات', 'Average Particle Size',
     'قطر متوسط ذرات رزین پودری، مؤثر بر جذب نرم‌کننده و رفتار فرآیند.',
     'The mean diameter of powdered resin particles, which governs plasticiser uptake and processing behaviour.',
     'range', 'µm', 1, 2000, '{}', 63),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'volatile_content',
     'مواد فرار', 'Volatile Content',
     'درصد رطوبت و مواد فرار باقی‌مانده در رزین که پیش از فرآیند باید خشک شود.',
     'The percentage of residual moisture and volatiles in the resin, which must be dried off before processing.',
     'range', '%', 0, 5, '{}', 64),

    -- --- PVC-only, scoped to `vinyls` ------------------------------------
    ((SELECT id FROM property_group WHERE key = 'physical'), 'k_value',
     'مقدار K (فیکنچر)', 'K-Value (Fikentscher)',
     'شاخص قراردادی وزن مولکولی PVC؛ K بالاتر یعنی زنجیره بلندتر، مقاومت بیشتر و فرآیندپذیری دشوارتر.',
     'The conventional molecular-weight index for PVC; a higher K means longer chains, greater strength and harder processing.',
     'range', 'dimensionless', 30, 100, '{vinyls}', 65),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'residual_vcm',
     'مونومر وینیل کلراید باقی‌مانده', 'Residual VCM',
     'غلظت باقی‌مانده مونومر وینیل کلراید در رزین؛ به دلیل سرطان‌زایی VCM یک شاخص ایمنی سخت‌گیرانه است.',
     'The residual concentration of vinyl chloride monomer in the resin -- a strictly limited safety metric, since VCM is a carcinogen.',
     'range', 'ppm', 0, 100, '{vinyls}', 66),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'cell_classification',
     'رده‌بندی سلولی (ASTM D1784)', 'PVC Cell Classification (ASTM D1784)',
     'کد استاندارد ASTM D1784 که حداقل مقادیر چند خاصیت PVC را در یک رشته عددی خلاصه می‌کند (مثلاً 16344).',
     'The ASTM D1784 code summarising minimum values of several PVC properties in one numeric string (e.g. 16344).',
     'text', NULL, NULL, NULL, '{vinyls}', 67),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'dehydrochlorination_onset',
     'دمای شروع حذف HCl', 'Dehydrochlorination Onset Temperature',
     'دمایی که در آن آزادسازی گاز HCl از زنجیره PVC آغاز می‌شود؛ با دمای شروع کاهش وزن یکسان نیست و معمولاً بسیار پایین‌تر است.',
     'The temperature at which HCl evolution from the PVC backbone begins -- not the same as, and usually far below, the mass-loss onset temperature.',
     'range', '°C', 100, 400, '{vinyls}', 96)
ON CONFLICT (key) DO NOTHING;

-- Self-registration. Every other migration in this directory ends with this
-- line; 0025 was authored without it, which is why its 12 properties landed
-- in the database while `schema_migration` still reported 24 applied. The
-- runner (db/run.sh) does NOT record versions itself -- it skips files whose
-- version is already recorded and otherwise just executes them, trusting each
-- file to register itself. Without this line the migration was silently
-- re-executed on every run.sh invocation (harmless only because the INSERT
-- above is ON CONFLICT DO NOTHING) and the API's /health check, which
-- compares applied count against file count, failed permanently.
INSERT INTO schema_migration (version) VALUES ('0025') ON CONFLICT DO NOTHING;

COMMIT;
