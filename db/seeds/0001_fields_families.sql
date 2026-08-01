-- 0001_fields_families.sql
-- Polypedia seed data: fields, families, organizations, applications,
-- processing techniques (schema-design.md sections 4.1-4.4).
--
-- Idempotent: every INSERT targets a natural unique key (field.key,
-- family(field_id,key), organization.key, application.key,
-- processing_technique.key) with ON CONFLICT DO NOTHING, so re-running this
-- file is a no-op after the first successful run.

BEGIN;

-- ---------------------------------------------------------------------------
-- field (spec 4.1)
-- ---------------------------------------------------------------------------

INSERT INTO field (key, name_fa, name_en, sort_order) VALUES
    ('thermoplastics',            'ترموپلاستیک‌ها',        'Thermoplastics',              10),
    ('thermosets',                'گرماسخت‌ها',             'Thermosets',                  20),
    ('elastomers',                'الاستومرها',             'Elastomers',                  30),
    ('biopolymers',               'زیست‌پلیمرها',           'Biopolymers',                 40),
    ('composites',                'کامپوزیت‌ها',            'Composites',                  50),
    ('high_performance_polymers', 'پلیمرهای عملکرد بالا',   'High-Performance Polymers',   60)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- family (spec 4.2) — nested under thermoplastics
-- ---------------------------------------------------------------------------

INSERT INTO family (field_id, key, name_fa, name_en, sort_order) VALUES
    ((SELECT id FROM field WHERE key = 'thermoplastics'), 'polyolefins', 'پلی‌اولفین‌ها', 'Polyolefins', 10),
    ((SELECT id FROM field WHERE key = 'thermoplastics'), 'vinyls',      'وینیلی‌ها',     'Vinyls',      20),
    ((SELECT id FROM field WHERE key = 'thermoplastics'), 'polyesters',  'پلی‌استرها',    'Polyesters',  30),
    ((SELECT id FROM field WHERE key = 'thermoplastics'), 'styrenics',   'استایرنی‌ها',   'Styrenics',   40)
ON CONFLICT (field_id, key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- organization (spec 4.3) — manufacturers named for LDPE/HDPE in
-- src/data/polymersData.ts (iranianManufacturers[] / multinationalManufacturers[]).
-- ---------------------------------------------------------------------------

-- Iranian petrochemical companies (kind = manufacturer, country_code = IR).
INSERT INTO organization (key, name_fa, name_en, country_code, kind) VALUES
    ('jam_petrochemical',        'پتروشیمی جم',         'Jam Petrochemical',          'IR', 'manufacturer'),
    ('amirkabir_petrochemical',  'پتروشیمی امیرکبیر',   'Amirkabir Petrochemical',    'IR', 'manufacturer'),
    ('laleh_petrochemical',      'پتروشیمی لاله',       'Laleh Petrochemical',        'IR', 'manufacturer'),
    ('bandar_imam_petrochemical','پتروشیمی بندر امام',  'Bandar Imam Petrochemical',  'IR', 'manufacturer'),
    ('tabriz_petrochemical',     'پتروشیمی تبریز',      'Tabriz Petrochemical',       'IR', 'manufacturer'),
    ('morvarid_petrochemical',   'پتروشیمی مروارید',    'Morvarid Petrochemical',     'IR', 'manufacturer'),
    ('ilam_petrochemical',       'پتروشیمی ایلام',      'Ilam Petrochemical',         'IR', 'manufacturer'),
    ('shazand_petrochemical',    'پتروشیمی شازند',      'Shazand (Arak) Petrochemical','IR', 'manufacturer')
ON CONFLICT (key) DO NOTHING;

-- Multinational manufacturers (name_fa left NULL — only an English trade
-- name is given in the legacy data for these; organization allows name_fa
-- OR name_en per organization_name_present_chk).
INSERT INTO organization (key, name_en, country_code, kind) VALUES
    ('dow_chemical',              'Dow Chemical',              'US', 'manufacturer'),
    ('lyondellbasell',            'LyondellBasell',            'NL', 'manufacturer'),
    ('exxonmobil',                'ExxonMobil',                'US', 'manufacturer'),
    ('sabic',                     'SABIC',                     'SA', 'manufacturer'),
    ('qapco',                     'QAPCO',                     'QA', 'manufacturer'),
    ('ineos',                     'INEOS',                     'GB', 'manufacturer'),
    ('borealis',                  'Borealis',                  'AT', 'manufacturer'),
    ('lg_chem',                   'LG Chem',                   'KR', 'manufacturer'),
    ('mitsubishi_chemical',       'Mitsubishi Chemical',       'JP', 'manufacturer'),
    ('chevron_phillips_chemical', 'Chevron Phillips Chemical', 'US', 'manufacturer'),
    ('mitsui_chemicals',          'Mitsui Chemicals',          'JP', 'manufacturer'),
    ('formosa_plastics',          'Formosa Plastics',          'TW', 'manufacturer')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- application (spec 4.4) — distilled from LDPE/HDPE applications[] in
-- src/data/polymersData.ts.
-- ---------------------------------------------------------------------------

INSERT INTO application (key, name_fa, name_en) VALUES
    ('flexible_packaging_film', 'بسته‌بندی منعطف (فیلم)',                  'Flexible Packaging Film'),
    ('wire_cable_insulation',   'عایق‌کاری الکتریکی سیم و کابل',            'Wire & Cable Insulation'),
    ('agricultural_film',       'فیلم‌های کشاورزی (گلخانه و مالچ)',         'Agricultural Film'),
    ('squeezable_bottles',      'بطری‌های قابل‌فشردن',                       'Squeezable Bottles'),
    ('rigid_packaging_bottles', 'بسته‌بندی صلب (بطری شیر، آبمیوه و مواد شوینده)', 'Rigid Packaging & Bottles'),
    ('pipes_fittings',          'لوله‌کشی و اتصالات (آب، گاز و فاضلاب)',    'Pipes & Fittings'),
    ('chemical_tanks_pallets',  'مخازن شیمیایی و پالت‌ها',                  'Chemical Tanks & Pallets'),
    ('geomembranes',            'ژئوممبران‌های پوشش دفن زباله',              'Geomembranes'),
    ('automotive_fuel_tanks',   'باک بنزین و قطعات خودرو',                  'Automotive Fuel Tanks & Parts')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- processing_technique (spec 4.4) — distilled from LDPE/HDPE
-- processing.techniques[] in src/data/polymersData.ts.
-- ---------------------------------------------------------------------------

INSERT INTO processing_technique (key, name_fa, name_en) VALUES
    ('blown_film',        'تولید فیلم دمشی',      'Blown Film Extrusion'),
    ('injection_molding',  'قالب‌گیری تزریقی',      'Injection Molding'),
    ('rotational_molding', 'قالب‌گیری دورانی',      'Rotational Molding'),
    ('wire_cable_coating', 'پوشش سیم و کابل',       'Wire & Cable Coating'),
    ('pipe_extrusion',     'اکستروژن لوله',         'Pipe Extrusion'),
    ('blow_molding',       'قالب‌گیری دمشی',        'Blow Molding'),
    ('sheet_extrusion',    'اکستروژن ورق',          'Sheet Extrusion')
ON CONFLICT (key) DO NOTHING;

COMMIT;
