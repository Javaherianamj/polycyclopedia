-- 0002_property_groups_definitions.sql
-- Polypedia seed data: property_group (spec 6.1) and property_definition
-- (spec 6.2 / section 10 — the ~55-row extensibility mechanism).
--
-- Sources:
--  - src/types/polymer.ts for the field set (ProcessingInfo, ThermalProperties,
--    MechanicalProperties, PhysicalProperties, ElectricalProperties,
--    MolecularAcademicInfo).
--  - src/App.tsx for the ui_tab mapping (activeTab: 'ind' | 'eng' | 'aca';
--    'ind' renders ProcessingInfo, 'eng' renders thermal/mechanical/
--    physical/electrical, 'aca' renders MolecularAcademicInfo) and for the
--    handful of InfoTooltip strings reused verbatim as description_fa.
--  - schema-design.md section 10 for group membership / key names.
--
-- Idempotent: every INSERT keys off property_group.key / property_definition.key
-- with ON CONFLICT DO NOTHING.
--
-- Judgment calls (also called out in the final report to the caller):
--  - `bur` (blow-up ratio) is seeded as data_type='text', not numeric/range.
--    The legacy value is a ratio string ("2:1 تا 4:1"), which schema-design.md
--    section 11's own value-string grammar table classifies as "ratio -> text
--    (not numeric)". The spec's illustrative text-type list in section 10
--    doesn't name `bur` explicitly, but leaving it numeric/range would be
--    inconsistent with the grammar table and with the ETL, which cannot
--    parse "2:1 تا 4:1" into value_min/value_max.
--  - `oxygen_permeability`, `co2_permeability`, `hansen_d`, `hansen_p`,
--    `hansen_h` have a blank unit string in the legacy SourcedValue data
--    (src/data/polymersData.ts uses unit: ''). These are not actually
--    dimensionless physical quantities; the legacy data simply omitted the
--    unit. canonical_unit is filled in with the standard unit for that
--    quantity (permeability: cm3.mm/(m2.day.atm); Hansen parameters: the
--    same MPa^0.5 as solubility_parameter, since Hansen parameters are the
--    (dispersion/polar/hydrogen-bonding) decomposition of the same
--    solubility-parameter quantity) rather than left NULL, so the
--    numeric/range CHECK (property_definition_unit_required_chk) is
--    satisfiable and the ETL has something to normalise against.

BEGIN;

-- ---------------------------------------------------------------------------
-- 6.1 property_group
-- ---------------------------------------------------------------------------

INSERT INTO property_group (key, name_fa, name_en, ui_tab, sort_order) VALUES
    ('processing',  'فرآیندپذیری', 'Processing',  'ind', 10),
    ('thermal',     'خواص حرارتی', 'Thermal',     'eng', 20),
    ('mechanical',  'خواص مکانیکی','Mechanical',  'eng', 30),
    ('physical',    'خواص فیزیکی', 'Physical',    'eng', 40),
    ('electrical',  'خواص الکتریکی','Electrical', 'eng', 50),
    ('academic',    'اطلاعات علمی و مولکولی', 'Academic', 'aca', 60)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6.2 property_definition — processing (3)
-- ---------------------------------------------------------------------------

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en, data_type, canonical_unit, allowed_units, plausible_min, plausible_max, symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'processing'), 'process_temp',
     'دمای فرآیند', 'Processing Temperature',
     'بازه دمایی مناسب برای ذوب و شکل‌دهی پلیمر بدون تخریب حرارتی آن.',
     'The temperature range suitable for melting and shaping the polymer without thermal degradation.',
     'range', '°C', ARRAY['°C'], -50, 450, NULL, 10),

    ((SELECT id FROM property_group WHERE key = 'processing'), 'mfi',
     'شاخص جریان مذاب (MFI)', 'Melt Flow Index (MFI)',
     'جرم پلیمر (به گرم) که در مدت ۱۰ دقیقه از یک دای استاندارد تحت وزن و دمای مشخص عبور می‌کند. شاخصی برای روانی مذاب و وزن مولکولی است.',
     'The mass of polymer (in grams) that flows through a standard die under a specified weight and temperature in 10 minutes. An indicator of melt flow and molecular weight.',
     'range', 'g/10min', ARRAY['g/10min'], 0.01, 200, 'MFI', 20),

    ((SELECT id FROM property_group WHERE key = 'processing'), 'bur',
     'نسبت دمش (BUR)', 'Blow-Up Ratio (BUR)',
     'نسبت قطر حباب فیلم به قطر دای در فرآیند تولید فیلم دمشی (Blown Film). کنترل‌کننده آرایش‌یافتگی مولکولی و استحکام دو محوره فیلم است.',
     'The ratio of blown film bubble diameter to die diameter in the blown-film extrusion process. Controls molecular orientation and biaxial film strength.',
     'text', NULL, '{}', NULL, NULL, 'BUR', 30)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6.2 property_definition — thermal (9)
-- ---------------------------------------------------------------------------

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en, data_type, canonical_unit, allowed_units, plausible_min, plausible_max, symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'thermal'), 'tg',
     'دمای انتقال شیشه‌ای', 'Glass Transition Temperature',
     'دمایی است که در آن پلیمر از حالت سخت و شکننده (شیشه‌ای) به حالت انعطاف‌پذیر (لاستیکی) تغییر فاز می‌دهد.',
     'The temperature at which the polymer transitions from a hard, brittle (glassy) state to a flexible (rubbery) state.',
     'numeric', '°C', ARRAY['°C'], -150, 400, 'Tg', 10),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'tm',
     'دمای ذوب', 'Melting Temperature',
     'دمای ذوب بلوری (Melting Temperature) دمایی است که در آن مناطق بلوری پلیمر ذوب شده و به حالت مذاب در می‌آیند.',
     'The crystalline melting temperature: the temperature at which the crystalline regions of the polymer melt into the amorphous melt state.',
     'range', '°C', ARRAY['°C'], 40, 400, 'Tm', 20),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'enthalpy_exp',
     'آنتالپی ذوب تجربی', 'Experimental Heat of Fusion',
     'مقدار گرمای جذب‌شده هنگام ذوب بلورهای پلیمر، اندازه‌گیری‌شده با کالریمتری روبشی تفاضلی (DSC) روی نمونه واقعی.',
     'Heat absorbed on melting the polymer''s crystalline regions, as measured by differential scanning calorimetry (DSC) on an actual sample.',
     'range', 'J/g', ARRAY['J/g'], 0, 300, 'ΔHf', 30),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'enthalpy_100_cryst',
     'آنتالپی ذوب ۱۰۰٪ بلوری', 'Heat of Fusion at 100% Crystallinity',
     'آنتالپی ذوب فرضی یک نمونه کاملاً بلوری (۱۰۰٪ بلورینگی)، مبنای محاسبه درصد بلورینگی تجربی از داده‌های DSC.',
     'The theoretical heat of fusion of a hypothetically 100%-crystalline sample; the reference value used to compute experimental crystallinity fraction from DSC data.',
     'numeric', 'J/g', ARRAY['J/g'], 0, 300, 'ΔH°f', 40),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'degradation_temp',
     'دمای تخریب حرارتی', 'Thermal Degradation Temperature',
     'دمایی است که در آن پیوندهای شیمیایی زنجیره اصلی پلیمر شروع به شکستن کرده و پلیمر تجزیه می‌شود.',
     'The temperature at which the chemical bonds of the polymer backbone begin breaking down and the polymer decomposes.',
     'range', '°C', ARRAY['°C'], 150, 600, 'Td', 50),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'hdt',
     'دمای خمش تحت بار (HDT)', 'Heat Deflection Temperature',
     'دمایی که در آن یک نمونه استاندارد تحت بار خمشی مشخص، مقدار معینی تغییر شکل می‌دهد؛ معیار کاربردپذیری حرارتی زیر بار.',
     'The temperature at which a standard specimen under a specified flexural load deflects by a defined amount; a measure of thermal usability under load.',
     'range', '°C', ARRAY['°C'], 0, 320, 'HDT', 60),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'vicat',
     'دمای نرمی ویکات', 'Vicat Softening Temperature',
     'دمایی که در آن یک سوزن استاندارد تحت بار مشخص به عمق ۱ میلی‌متر در نمونه پلیمری نفوذ می‌کند؛ معیار نرمی حرارتی.',
     'The temperature at which a standard needle under a specified load penetrates 1 mm into the polymer specimen; a measure of thermal softening.',
     'range', '°C', ARRAY['°C'], 0, 320, 'VST', 70),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'conductivity',
     'ضریب هدایت حرارتی', 'Thermal Conductivity',
     'میزان توانایی پلیمر در انتقال گرما از طریق هدایت؛ پلیمرها عموماً عایق حرارتی ضعیفی هستند.',
     'The polymer''s ability to conduct heat; polymers are generally poor thermal conductors.',
     'range', 'W/m·K', ARRAY['W/m·K'], 0.05, 5, 'k', 80),

    ((SELECT id FROM property_group WHERE key = 'thermal'), 'cte',
     'ضریب انبساط حرارتی (CTE)', 'Coefficient of Thermal Expansion',
     'میزان تغییر ابعاد پلیمر به ازای هر درجه تغییر دما؛ پلیمرها نسبت به فلزات ضریب انبساط بسیار بالاتری دارند.',
     'The change in the polymer''s dimensions per degree of temperature change; polymers have a much higher expansion coefficient than metals.',
     'range', 'µm/°C', ARRAY['µm/°C'], 20, 400, 'α', 90)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6.2 property_definition — mechanical (6)
-- ---------------------------------------------------------------------------

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en, data_type, canonical_unit, allowed_units, plausible_min, plausible_max, symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'tensile_strength',
     'استحکام کششی', 'Tensile Strength',
     'حداکثر تنش کششی که نمونه پیش از پارگی یا تسلیم تحمل می‌کند.',
     'The maximum tensile stress the specimen withstands before rupture or yield.',
     'range', 'MPa', ARRAY['MPa'], 1, 400, 'σt', 10),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'young_modulus',
     'مدول یانگ', 'Young''s Modulus',
     'شیب بخش خطی منحنی تنش-کرنش؛ معیار سفتی و مقاومت پلیمر در برابر تغییر شکل الاستیک.',
     'The slope of the linear (elastic) region of the stress-strain curve; a measure of the polymer''s stiffness.',
     'range', 'GPa', ARRAY['GPa'], 0.0005, 400, 'E', 20),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'elongation_at_break',
     'ازدیاد طول تا پارگی', 'Elongation at Break',
     'درصد افزایش طول نمونه نسبت به طول اولیه در لحظه پارگی؛ معیار انعطاف‌پذیری و شکل‌پذیری.',
     'The percentage increase in specimen length, relative to its original length, at the moment of rupture; a measure of ductility.',
     'range', '%', ARRAY['%'], 0, 1000, 'εb', 30),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'flexural_modulus',
     'مدول خمشی', 'Flexural Modulus',
     'سفتی پلیمر تحت بارگذاری خمشی سه‌نقطه‌ای؛ نزدیک اما نه لزوماً برابر با مدول یانگ کششی.',
     'The stiffness of the polymer under three-point flexural loading; close to, but not necessarily equal to, the tensile Young''s modulus.',
     'range', 'GPa', ARRAY['GPa'], 0.0005, 400, 'Ef', 40),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'hardness_shore_d',
     'سختی شور D', 'Shore D Hardness',
     'سختی سطحی پلیمرهای نسبتاً سخت، اندازه‌گیری‌شده با دوروسنج شور مقیاس D (۰ تا ۱۰۰).',
     'The surface hardness of relatively hard polymers, measured on the Shore D durometer scale (0-100).',
     'range', 'Shore D', ARRAY['Shore D'], 0, 100, 'HD', 50),

    ((SELECT id FROM property_group WHERE key = 'mechanical'), 'izod_impact',
     'مقاومت ضربه آیزود', 'Izod Impact Strength',
     'انرژی جذب‌شده توسط یک نمونه شیاردار هنگام شکست ضربه‌ای در آزمون آیزود.',
     'The energy absorbed by a notched specimen when fractured by impact in the Izod test.',
     'range', 'J/m', ARRAY['J/m'], 0, 1500, 'IS', 60)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6.2 property_definition — physical (6)
-- ---------------------------------------------------------------------------

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en, data_type, canonical_unit, allowed_units, plausible_min, plausible_max, symbol, sort_order, is_comparable)
VALUES
    ((SELECT id FROM property_group WHERE key = 'physical'), 'density',
     'چگالی', 'Density',
     'جرم واحد حجم پلیمر در دمای اتاق؛ بازتاب‌دهنده مستقیم درصد بلورینگی در پلیمرهای نیمه‌بلوری.',
     'Mass per unit volume of the polymer at room temperature; directly reflects crystallinity fraction in semicrystalline polymers.',
     'range', 'g/cm³', ARRAY['g/cm³'], 0.8, 2.3, 'ρ', 10, true),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'water_absorption',
     'جذب آب', 'Water Absorption',
     'درصد افزایش وزن پلیمر پس از غوطه‌وری در آب طی مدت‌زمان استاندارد؛ معیار قطبیت و مقاومت رطوبتی.',
     'The percentage weight gain of the polymer after immersion in water for a standard duration; a measure of polarity and moisture resistance.',
     'range', '%', ARRAY['%'], 0, 10, NULL, 20, true),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'refractive_index',
     'ضریب شکست', 'Refractive Index',
     'نسبت سرعت نور در خلأ به سرعت نور در پلیمر؛ تعیین‌کننده شفافیت نوری و درخشندگی سطح.',
     'The ratio of the speed of light in vacuum to the speed of light in the polymer; determines optical clarity and surface gloss.',
     'range', 'dimensionless', ARRAY['dimensionless'], 1.3, 1.7, 'n_D', 30, true),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'oxygen_permeability',
     'نفوذپذیری اکسیژن', 'Oxygen Permeability',
     'میزان عبور گاز اکسیژن از واحد سطح فیلم پلیمری در واحد زمان؛ معیار کلیدی کاربردهای بسته‌بندی مواد غذایی.',
     'The rate of oxygen gas transmission through a unit area of polymer film per unit time; a key metric for food-packaging applications.',
     'range', 'cm³·mm/(m²·day·atm)', ARRAY['cm³·mm/(m²·day·atm)'], 0.01, 20000, 'OTR', 40, true),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'co2_permeability',
     'نفوذپذیری دی‌اکسید کربن', 'CO2 Permeability',
     'میزان عبور گاز دی‌اکسید کربن از واحد سطح فیلم پلیمری در واحد زمان.',
     'The rate of carbon dioxide gas transmission through a unit area of polymer film per unit time.',
     'range', 'cm³·mm/(m²·day·atm)', ARRAY['cm³·mm/(m²·day·atm)'], 0.01, 60000, 'CO2TR', 50, true),

    ((SELECT id FROM property_group WHERE key = 'physical'), 'appearance',
     'ظاهر', 'Appearance',
     'توصیف کیفی ظاهر بصری پلیمر خام (شفاف، نیمه‌شفاف، کدر و غیره).',
     'A qualitative description of the raw polymer''s visual appearance (transparent, translucent, opaque, etc.).',
     'text', NULL, '{}', NULL, NULL, NULL, 60, false)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6.2 property_definition — electrical (4)
-- ---------------------------------------------------------------------------

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en, data_type, canonical_unit, allowed_units, plausible_min, plausible_max, symbol, sort_order)
VALUES
    ((SELECT id FROM property_group WHERE key = 'electrical'), 'dielectric_constant',
     'ثابت دی‌الکتریک', 'Dielectric Constant',
     'نسبت ظرفیت خازنی یک خازن با دی‌الکتریک پلیمری به ظرفیت همان خازن با خلأ؛ معیار قطبش‌پذیری الکتریکی ماده.',
     'The ratio of the capacitance of a capacitor with the polymer as dielectric to its capacitance with vacuum; a measure of electrical polarizability.',
     'range', 'dimensionless', ARRAY['dimensionless'], 1, 10, 'εr', 10),

    ((SELECT id FROM property_group WHERE key = 'electrical'), 'dielectric_strength',
     'استحکام دی‌الکتریک', 'Dielectric Strength',
     'حداکثر میدان الکتریکی که پلیمر پیش از شکست الکتریکی (سوراخ‌شدگی) تحمل می‌کند.',
     'The maximum electric field the polymer withstands before dielectric breakdown (puncture).',
     'range', 'kV/mm', ARRAY['kV/mm'], 1, 100, NULL, 20),

    ((SELECT id FROM property_group WHERE key = 'electrical'), 'volume_resistivity',
     'مقاومت ویژه حجمی', 'Volume Resistivity',
     'مقاومت الکتریکی یک واحد مکعب از ماده؛ معیار کیفیت عایق‌کاری الکتریکی.',
     'The electrical resistance of a unit cube of the material; a measure of insulating quality.',
     'range', 'Ω·cm', ARRAY['Ω·cm'], 0.000001, 100000000000000000000, 'ρv', 30),

    ((SELECT id FROM property_group WHERE key = 'electrical'), 'dissipation_factor',
     'ضریب اتلاف', 'Dissipation Factor',
     'نسبت انرژی الکتریکی تلف‌شده به‌صورت گرما به انرژی ذخیره‌شده در هر چرخه میدان متناوب؛ هرچه کمتر، عایق‌کاری بهتر است.',
     'The ratio of electrical energy dissipated as heat to energy stored per cycle of an alternating field; lower is a better insulator.',
     'range', 'dimensionless', ARRAY['dimensionless'], 0, 0.5, 'tan δ', 40)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6.2 property_definition — academic (27)
-- ---------------------------------------------------------------------------

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, description_fa, description_en, data_type, canonical_unit, allowed_units, plausible_min, plausible_max, symbol, sort_order, is_comparable)
VALUES
    ((SELECT id FROM property_group WHERE key = 'academic'), 'monomer_name',
     'نام مونومر', 'Monomer Name',
     'نام مونومر (یا مونومرهای) سازنده زنجیر پلیمر.',
     'The name of the monomer (or monomers) the polymer chain is built from.',
     'text', NULL, '{}', NULL, NULL, NULL, 10, false),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'monomer_formula',
     'فرمول شیمیایی مونومر', 'Monomer Chemical Formula',
     'فرمول شیمیایی مولکولی مونومر.',
     'The molecular chemical formula of the monomer.',
     'text', NULL, '{}', NULL, NULL, NULL, 20, false),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'monomer_molar_mass',
     'جرم مولی مونومر', 'Monomer Molar Mass',
     'جرم مولی مونومر (M0)، مبنای محاسبه درجه پلیمریزاسیون از وزن مولکولی.',
     'The molar mass of the monomer (M0), the basis for computing degree of polymerization from molecular weight.',
     'numeric', 'g/mol', ARRAY['g/mol'], 10, 1000, 'M0', 30, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'repeating_unit',
     'واحد تکرارشونده', 'Repeating Unit',
     'ساختار شیمیایی واحد تکرارشونده در زنجیر پلیمر.',
     'The chemical structure of the repeating unit along the polymer chain.',
     'text', NULL, '{}', NULL, NULL, NULL, 40, false),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'crystallinity',
     'درصد بلورینگی', 'Crystallinity',
     'درصد حجمی یا وزنی مناطق منظم بلوری در ساختار پلیمر نیمه‌بلوری.',
     'The volume or mass fraction of ordered crystalline regions in a semicrystalline polymer''s structure.',
     'range', '%', ARRAY['%'], 0, 100, 'Xc', 50, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'unit_cell',
     'سلول واحد بلوری', 'Unit Cell',
     'ابعاد و تقارن سلول واحد بلوری پلیمر (مثلاً ارتورومبیک، مونوکلینیک).',
     'The dimensions and symmetry of the polymer''s crystalline unit cell (e.g. orthorhombic, monoclinic).',
     'text', NULL, '{}', NULL, NULL, NULL, 60, false),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'lamella_thickness',
     'ضخامت لایه بلوری (لاملا)', 'Lamella Thickness',
     'ضخامت لایه‌های بلوری تشکیل‌دهنده اسفرولیت‌ها در پلیمرهای نیمه‌بلوری.',
     'The thickness of the crystalline lamellae that make up spherulites in semicrystalline polymers.',
     'range', 'nm', ARRAY['nm'], 1, 100, 'Lc', 70, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'spherulite_size',
     'اندازه اسفرولیت', 'Spherulite Size',
     'قطر متوسط اسفرولیت‌های کروی‌شکل تشکیل‌شده حین انجماد پلیمر نیمه‌بلوری.',
     'The average diameter of the spherical spherulites formed during solidification of a semicrystalline polymer.',
     'range', 'µm', ARRAY['µm'], 0.1, 1000, NULL, 80, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'mechanism',
     'مکانیزم پلیمریزاسیون', 'Polymerization Mechanism',
     'مکانیزم شیمیایی سنتز پلیمر (مثلاً رادیکال آزاد، کاتالیزوری، تراکمی) و شرایط فرآیندی آن.',
     'The chemical synthesis mechanism (e.g. free-radical, catalytic, condensation) and its process conditions.',
     'text', NULL, '{}', NULL, NULL, NULL, 90, false),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'kinetic_notes',
     'یادداشت‌های سینتیکی', 'Kinetic Notes',
     'ملاحظات سینتیکی واکنش پلیمریزاسیون (انتقال زنجیر، بک‌بایتینگ، و غیره) که بر ساختار نهایی زنجیر اثر می‌گذارند.',
     'Kinetic considerations of the polymerization reaction (chain transfer, backbiting, etc.) that affect the resulting chain structure.',
     'text', NULL, '{}', NULL, NULL, NULL, 100, false),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'mw',
     'وزن مولکولی وزنی', 'Weight-Average Molecular Weight',
     'میانگین وزن مولکولی وزن‌دهی‌شده بر اساس جرم؛ به زنجیرهای بلندتر وزن بیشتری می‌دهد.',
     'The mass-weighted average molecular weight of the polymer chains; weights longer chains more heavily.',
     'range', 'g/mol', ARRAY['g/mol'], 1000, 10000000, 'Mw', 110, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'mn',
     'وزن مولکولی عددی', 'Number-Average Molecular Weight',
     'میانگین وزن مولکولی وزن‌دهی‌شده بر اساس تعداد زنجیرها.',
     'The chain-count-weighted average molecular weight of the polymer chains.',
     'range', 'g/mol', ARRAY['g/mol'], 500, 5000000, 'Mn', 120, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'pdi',
     'شاخص چندپخشی', 'Polydispersity Index',
     'شاخص پراکندگی (Polydispersity Index) نشان‌دهنده گستردگی توزیع وزن مولکولی است. هرچه PDI به ۱ نزدیک‌تر باشد، طول زنجیرها یکنواخت‌تر است.',
     'The polydispersity index reflects the breadth of the molecular weight distribution. The closer PDI is to 1, the more uniform the chain lengths.',
     'range', 'dimensionless', ARRAY['dimensionless'], 1, 50, 'PDI', 130, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'dp_range',
     'بازه درجه پلیمریزاسیون', 'Degree of Polymerization Range',
     'تعداد واحدهای مونومری تکرارشونده در یک زنجیر پلیمر متوسط.',
     'The number of repeating monomer units in an average polymer chain.',
     'range', 'dimensionless', ARRAY['dimensionless'], 10, 100000, 'DP', 140, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'entanglement_mw',
     'وزن مولکولی درهم‌تنیدگی', 'Entanglement Molecular Weight',
     'وزن مولکولی بحرانی که بالاتر از آن گره‌خوردگی‌های فیزیکی زنجیرها بر رئولوژی مذاب غالب می‌شود.',
     'The critical molecular weight above which physical chain entanglements dominate melt rheology.',
     'numeric', 'g/mol', ARRAY['g/mol'], 200, 20000, 'Me', 150, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'radius_of_gyration',
     'شعاع ژیراسیون', 'Radius of Gyration',
     'شعاع چرخش (Radius of Gyration) معیاری از اندازه یک کلاف پلیمری در فضا است و نشان می‌دهد جرم ماکرومولکول چگونه حول مرکز جرم توزیع شده است.',
     'The radius of gyration is a measure of the size of a polymer coil in space, describing how the macromolecule''s mass is distributed around its center of mass.',
     'range', 'nm', ARRAY['nm'], 1, 200, 'Rg', 160, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'zero_shear_viscosity',
     'ویسکوزیته برشی صفر', 'Zero-Shear Viscosity',
     'ویسکوزیته مذاب پلیمر در حد نرخ برشی صفر، معیار مقاومت ذاتی مذاب در برابر جریان.',
     'The melt viscosity of the polymer in the limit of zero shear rate; a measure of the melt''s intrinsic resistance to flow.',
     'range', 'Pa·s', ARRAY['Pa·s'], 1, 1000000000, 'η0', 170, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'power_law_index',
     'شاخص قانون توان', 'Power-Law Index',
     'توان n در مدل رئولوژیکی قانون توان که میزان رفتار شبه‌پلاستیک (Shear-Thinning) مذاب را کمّی می‌کند.',
     'The exponent n in the power-law rheological model, quantifying the melt''s shear-thinning behavior.',
     'range', 'dimensionless', ARRAY['dimensionless'], 0, 1, 'n', 180, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'rheology_notes',
     'یادداشت‌های رئولوژیکی', 'Rheology Notes',
     'ملاحظات کیفی رفتار رئولوژیکی مذاب پلیمر (شبه‌پلاستیک بودن، استحکام مذاب، و غیره).',
     'Qualitative notes on the polymer melt''s rheological behavior (shear-thinning, melt strength, etc.).',
     'text', NULL, '{}', NULL, NULL, NULL, 190, false),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'solubility_parameter',
     'پارامتر حلالیت', 'Solubility Parameter',
     'پارامتر حلالیت هیلدبراند (δ)، معیار انرژی چسبندگی درون‌مولکولی و پیش‌بینی‌کننده سازگاری با حلال‌ها و پلیمرهای دیگر.',
     'The Hildebrand solubility parameter (δ), a measure of intermolecular cohesive energy density used to predict compatibility with solvents and other polymers.',
     'range', 'MPa^0.5', ARRAY['MPa^0.5'], 10, 30, 'δ', 200, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'hansen_d',
     'پارامتر هانسن - پراکندگی', 'Hansen Parameter - Dispersion',
     'مؤلفه پراکندگی (نیروهای وان‌در‌والس) پارامتر حلالیت سه‌بعدی هانسن.',
     'The dispersion (van der Waals forces) component of the three-dimensional Hansen solubility parameter.',
     'range', 'MPa^0.5', ARRAY['MPa^0.5'], 0, 25, 'δd', 210, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'hansen_p',
     'پارامتر هانسن - قطبی', 'Hansen Parameter - Polar',
     'مؤلفه قطبی (برهم‌کنش دوقطبی-دوقطبی) پارامتر حلالیت سه‌بعدی هانسن.',
     'The polar (dipole-dipole interaction) component of the three-dimensional Hansen solubility parameter.',
     'range', 'MPa^0.5', ARRAY['MPa^0.5'], 0, 20, 'δp', 220, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'hansen_h',
     'پارامتر هانسن - پیوند هیدروژنی', 'Hansen Parameter - Hydrogen Bonding',
     'مؤلفه پیوند هیدروژنی پارامتر حلالیت سه‌بعدی هانسن.',
     'The hydrogen-bonding component of the three-dimensional Hansen solubility parameter.',
     'range', 'MPa^0.5', ARRAY['MPa^0.5'], 0, 40, 'δh', 230, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'flory_huggins_chi',
     'پارامتر برهم‌کنش فلوری-هاگینز', 'Flory-Huggins Interaction Parameter',
     'پارامتر بدون بعد χ که انرژی آزاد اختلاط پلیمر-حلال (یا پلیمر-پلیمر) را کمّی می‌کند؛ هرچه کمتر، سازگاری بیشتر.',
     'The dimensionless parameter χ quantifying the free energy of mixing of a polymer-solvent (or polymer-polymer) pair; lower values mean better compatibility.',
     'range', 'dimensionless', ARRAY['dimensionless'], -1, 2, 'χ', 240, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'ffv',
     'کسر حجم آزاد', 'Fractional Free Volume',
     'کسری از حجم پلیمر که به‌صورت فضای خالی بین زنجیرها وجود دارد؛ عامل اصلی کنترل‌کننده نفوذپذیری گازها.',
     'The fraction of the polymer''s volume that exists as empty space between chains; the primary factor controlling gas permeability.',
     'range', 'dimensionless', ARRAY['dimensionless'], 0, 0.5, 'FFV', 250, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'persistence_length',
     'طول پایداری زنجیر', 'Persistence Length',
     'معیاری از سفتی خمشی موضعی زنجیر پلیمر؛ فاصله‌ای که در آن جهت‌گیری زنجیر همبستگی خود را از دست می‌دهد.',
     'A measure of a polymer chain''s local bending stiffness: the distance over which the chain''s orientation loses correlation.',
     'range', 'nm', ARRAY['nm'], 0.1, 100, 'lp', 260, true),

    ((SELECT id FROM property_group WHERE key = 'academic'), 'thermo_notes',
     'یادداشت‌های ترمودینامیکی', 'Thermodynamic Notes',
     'ملاحظات کیفی ترمودینامیکی تکمیلی، مانند مبنای محاسبه بلورینگی تجربی.',
     'Supplementary qualitative thermodynamic notes, such as the basis used for computing experimental crystallinity.',
     'text', NULL, '{}', NULL, NULL, NULL, 270, false)
ON CONFLICT (key) DO NOTHING;

COMMIT;
