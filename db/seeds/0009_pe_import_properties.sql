-- 0009_pe_import_properties.sql
-- Polypedia: new properties needed by the P1-PE cited-data import
-- (curation/cited data-by author-p1-PE.md), added rather than skipped per
-- the owner's explicit instruction: "ask me if you want to add something
-- new and do it! i was telling you to do so!" — the first pass of the
-- import left 8 facts out because no property_definition matched; this
-- seed adds 8 new properties (see db/DATA-GAPS.md-adjacent
-- curation/new_properties.md for the pre-seed record of what was missing
-- and why) so every fact with a real citation and an unambiguous unit can
-- be imported, not just the ones that happened to fit an existing key.
--
-- Deliberately NOT added: a shrinkage/CTE fact from Encyclopedia of Polymer
-- Science and Technology vol1 p549 stays out, because the source table's
-- own column headers are ambiguous in the extracted text (two properties,
-- one set of numbers) — that is a real-world ambiguity to resolve with the
-- owner, not a missing-property problem a new INSERT can fix.

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en,
     data_type, canonical_unit, allowed_units, plausible_min, plausible_max,
     variance_class, symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'thermal'), 'brittleness_temp',
     'دمای ترد شدن', 'Brittleness Temperature (F50)',
     'دمایی که در آن ۵۰٪ نمونه‌ها تحت ضربه دچار شکست تردمانند می‌شوند (ASTM D746).',
     'Temperature at which 50% of impact-tested specimens fail in a brittle manner (ASTM D746).',
     'numeric', '°C', ARRAY['°C'], -196, 50, 'process_dependent', NULL, 200),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'escr',
     'مقاومت به ترک‌خوردگی تنشی محیطی', 'Environmental Stress-Crack Resistance (ESCR)',
     'زمان تا شکست تحت تنش ثابت در حضور عامل فعال سطحی (ASTM D1693)، بسته به شرایط آزمون (A/B/C در فیلد conditions ثبت می‌شود).',
     'Time to failure under constant stress in the presence of a surfactant (ASTM D1693). Test condition (A/B/C) recorded in the conditions field.',
     'numeric', 'h', ARRAY['h'], 0, 5000, 'grade_dependent', NULL, 205),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'comonomer_content',
     'درصد کومونومر', 'Comonomer Content',
     'درصد وزنی کومونومر (مثلاً هگزن در LLDPE) که چگالی و سایر خواص را کنترل می‌کند — عامل اصلی تفاوت بین گریدها.',
     'Weight percent of comonomer (e.g. hexene in LLDPE), the primary driver of density and other grade-dependent properties.',
     'numeric', 'wt%', ARRAY['wt%'], 0, 20, 'grade_dependent', NULL, 210),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'tensile_impact_strength',
     'مقاومت ضربه کششی', 'Tensile Impact Strength',
     'انرژی جذب‌شده در آزمون ضربه کششی، بر حسب انرژی به ازای سطح مقطع — آزمونی متفاوت از ضربه آیزود دارای شیار.',
     'Energy absorbed in a tensile impact test, energy per cross-sectional area — a different test from notched Izod impact.',
     'numeric', 'kJ/m²', ARRAY['kJ/m²'], 0, 500, 'grade_dependent', NULL, 215),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'notched_impact_area_basis',
     'مقاومت ضربه شیاردار (بر مبنای سطح مقطع)', 'Notched Impact Strength (Area Basis)',
     'مقاومت ضربه آیزود شیاردار بر حسب انرژی به ازای سطح مقطع (kJ/m²، ASTM D256) — با izod_impact (J/m، انرژی به ازای عرض شیار) یکی نیست و بدون دانستن ضخامت نمونه قابل تبدیل نیست.',
     'Notched Izod impact strength in energy-per-cross-section-area terms (kJ/m², ASTM D256) — NOT the same quantity as izod_impact (J/m, energy per notch width) and not convertible to it without specimen thickness.',
     'numeric', 'kJ/m²', ARRAY['kJ/m²'], 0, 500, 'grade_dependent', NULL, 220),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'heat_resistance_temp',
     'دمای مقاومت حرارتی', 'Heat Resistance Temperature',
     'دمای کاربرد حرارتی مداوم گزارش‌شده در دیتاشیت‌های تجاری — روش آزمون استاندارد مشخصی در منبع ذکر نشده، متفاوت از HDT.',
     'Continuous-use heat resistance temperature as reported in commercial datasheets — no specific standard test method given in the source; not the same as HDT.',
     'numeric', '°C', ARRAY['°C'], -40, 300, 'process_dependent', NULL, 225),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'specific_heat_capacity',
     'گرمای ویژه', 'Specific Heat Capacity',
     'مقدار انرژی گرمایی لازم برای افزایش دمای واحد جرم پلیمر به اندازه یک درجه.',
     'The amount of heat energy required to raise the temperature of a unit mass of the polymer by one degree.',
     'range', 'kJ/(kg·K)', ARRAY['kJ/(kg·K)'], 0.5, 5, 'intrinsic', NULL, 230),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'heat_of_combustion',
     'گرمای احتراق', 'Heat of Combustion',
     'انرژی آزادشده در احتراق کامل واحد جرم پلیمر.',
     'The energy released on complete combustion of a unit mass of the polymer.',
     'numeric', 'kJ/g', ARRAY['kJ/g'], 10, 60, 'intrinsic', NULL, 235)
ON CONFLICT (key) DO NOTHING;
