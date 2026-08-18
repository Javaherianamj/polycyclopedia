-- =============================================================================
-- Seed: application_property_polarity (FE-6 compare, CR4/CR5/CR6)
-- =============================================================================
-- Deliberately NOT a full 9-application x N-comparable-property matrix. An
-- absent (application, property) row means "not yet decided", which is
-- honest; seeding one for every combination would mean "someone judged
-- this", which would be false for most of them and is exactly the kind of
-- confident-sounding invention this project exists to prevent (see 0006's
-- citation model, repeated here for editorial judgement instead of sourced
-- values). Every row below is a judgement that is well-established, common
-- knowledge in polymer/plastics engineering -- the kind of thing a materials
-- selection guide or a resin manufacturer's own literature states plainly --
-- not a guess extrapolated from a property's name.
--
-- Recurring reasoning, stated once instead of in every row that uses it:
--
--   ESCR (environmental stress cracking resistance) is the single most
--   consistently-applicable judgement in this seed: any part that is a
--   rigid, load-bearing container or liner in sustained contact with a
--   liquid/chemical under stress (pipe walls under hoop stress, tank walls
--   under hydrostatic head, a fuel tank under vibration+fuel exposure, a
--   buried geomembrane under decades of tensile load) fails, when it fails,
--   by slow crack growth from that combination -- which is literally what
--   ASTM D1693 / D2837 (the ESCR/long-term-strength test methods seeded in
--   0004_test_methods.sql) measure, and why pipe/tank-grade PE resins are
--   marketed on their ESCR number specifically.
--
--   Within a polyolefin family, higher density tracks higher stiffness
--   (flexural/tensile modulus) and higher crystallinity -- textbook
--   structure-property behaviour, and the reason HDPE (not LDPE) is the
--   default choice for rigid pipe/tank/bottle applications in the first
--   place.
--
-- Idempotent: ON CONFLICT (application_id, property_id) DO NOTHING backs
-- re-runs, matching uq_application_property_polarity from 0024.
-- =============================================================================

INSERT INTO application_property_polarity
    (application_id, property_id, polarity, rationale_fa, rationale_en)
VALUES

-- -----------------------------------------------------------------------
-- pipes_fittings -- buried/above-ground pressure pipe
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'pipes_fittings'),
    (SELECT id FROM property_definition WHERE key = 'escr'),
    'higher_is_better',
    'ترک ناشی از تنش محیطی (ESCR) شکست کلاسیک لوله‌های تحت فشار دفن‌شده است؛ رزین‌های درجه لوله (PE80/PE100) دقیقاً به‌خاطر ESCR بالا انتخاب می‌شوند.',
    'Slow crack growth under sustained hoop stress is the classic failure mode of buried pressure pipe; pipe-grade PE resins (PE80/PE100) are selected specifically for high ESCR (ASTM D1693/D2837).'
),
(   (SELECT id FROM application WHERE key = 'pipes_fittings'),
    (SELECT id FROM property_definition WHERE key = 'density'),
    'higher_is_better',
    'در خانواده پلی‌اتیلن، چگالی بالاتر با سفتی و مقاومت هیدرواستاتیک بلندمدت بالاتر همراه است؛ به همین دلیل رده‌های لوله PE80/PE100 در انتهای چگالی بالای خانواده PE قرار دارند.',
    'Within the PE family, higher density tracks higher stiffness and higher long-term hydrostatic strength -- the reason PE80/PE100 pipe grades sit at the higher-density end of the PE family.'
),
(   (SELECT id FROM application WHERE key = 'pipes_fittings'),
    (SELECT id FROM property_definition WHERE key = 'flexural_modulus'),
    'higher_is_better',
    'سفتی بالاتر از تغییر شکل بیضی‌شدن لوله مدفون جلوگیری کرده و رده‌بندی فشار بالاتر را ممکن می‌سازد.',
    'Higher stiffness resists ovalization/deflection in buried pipe and supports a higher pressure rating.'
),
(   (SELECT id FROM application WHERE key = 'pipes_fittings'),
    (SELECT id FROM property_definition WHERE key = 'tensile_strength'),
    'higher_is_better',
    'مقاومت کششی بالاتر مستقیماً در برابر فشار داخلی و تنش‌های نصب مقاومت می‌کند.',
    'Higher tensile strength directly resists internal pressure and installation stresses.'
),
(   (SELECT id FROM application WHERE key = 'pipes_fittings'),
    (SELECT id FROM property_definition WHERE key = 'hdt'),
    'higher_is_better',
    'لوله‌های فشار (به‌ویژه لوله‌کشی آب گرم) باید رده فشار خود را در دمای سرویس حفظ کنند.',
    'Pressure pipe (especially hot-water plumbing) must hold its pressure rating at service temperature.'
),

-- -----------------------------------------------------------------------
-- wire_cable_insulation -- electrical insulation/jacketing compound
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'wire_cable_insulation'),
    (SELECT id FROM property_definition WHERE key = 'dielectric_strength'),
    'higher_is_better',
    'وظیفه اصلی رزین تحمل ولتاژ بدون شکست الکتریکی است؛ این دقیقاً همان کمیتی است که مقاومت دی‌الکتریک اندازه می‌گیرد.',
    'The resin''s core job is to withstand voltage without dielectric breakdown -- exactly what dielectric strength measures.'
),
(   (SELECT id FROM application WHERE key = 'wire_cable_insulation'),
    (SELECT id FROM property_definition WHERE key = 'volume_resistivity'),
    'higher_is_better',
    'یک عایق خوب تعریف می‌شود به حداقل‌سازی جریان نشتی؛ مقاومت ویژه حجمی بالاتر دقیقاً همین را نشان می‌دهد.',
    'A good insulator is defined by minimizing leakage current; higher volume resistivity is exactly that.'
),
(   (SELECT id FROM application WHERE key = 'wire_cable_insulation'),
    (SELECT id FROM property_definition WHERE key = 'flexural_modulus'),
    'lower_is_better',
    'کابل باید هنگام نصب و در سرویس خم شود؛ ترکیبات درجه کابل عمداً برای انعطاف‌پذیری فرموله می‌شوند، نه سفتی.',
    'Cable must flex during installation and in service; wire/cable-grade compounds are deliberately formulated for flexibility, not stiffness.'
),
(   (SELECT id FROM application WHERE key = 'wire_cable_insulation'),
    (SELECT id FROM property_definition WHERE key = 'water_absorption'),
    'lower_is_better',
    'آب جذب‌شده عملکرد دی‌الکتریک را در طول عمر سرویس (ریسک آب‌درختی) تخریب می‌کند.',
    'Absorbed water degrades dielectric performance over the service life (water-treeing risk).'
),
(   (SELECT id FROM application WHERE key = 'wire_cable_insulation'),
    (SELECT id FROM property_definition WHERE key = 'oxygen_permeability'),
    'not_relevant',
    'نفوذپذیری گاز برای عایق‌بندی الکتریکی معیار عملکرد نیست؛ این خاصیت بسته‌بندی مانع‌دار است، نه کابل.',
    'Gas permeability is not a performance criterion for electrical insulation -- it is a barrier-packaging concern, not a cable one.'
),
(   (SELECT id FROM application WHERE key = 'wire_cable_insulation'),
    (SELECT id FROM property_definition WHERE key = 'co2_permeability'),
    'not_relevant',
    'مشابه نفوذپذیری اکسیژن، نفوذپذیری CO2 هیچ ارتباطی با عملکرد عایق‌بندی الکتریکی ندارد.',
    'Same reasoning as oxygen permeability -- CO2 permeability has no bearing on electrical-insulation performance.'
),

-- -----------------------------------------------------------------------
-- flexible_packaging_film -- flexible barrier/wrapping film
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'flexible_packaging_film'),
    (SELECT id FROM property_definition WHERE key = 'tensile_strength'),
    'higher_is_better',
    'فیلم نازک باید تنش‌های کششی خطوط بسته‌بندی پرسرعت و جابجایی را بدون پارگی تحمل کند.',
    'Thin film must survive the tensile stresses of high-speed packaging lines and handling without tearing.'
),
(   (SELECT id FROM application WHERE key = 'flexible_packaging_film'),
    (SELECT id FROM property_definition WHERE key = 'elongation_at_break'),
    'higher_is_better',
    'فیلم باید بدون پارگی کشیده و منطبق شود (پیچیدن، آب‌بندی)؛ ازدیاد طول بالا ویژگی تعریف‌کننده رزین‌های درجه فیلم است.',
    'Film needs to stretch/conform (wrapping, sealing) without tearing; high elongation at break is a defining film-grade property.'
),
(   (SELECT id FROM application WHERE key = 'flexible_packaging_film'),
    (SELECT id FROM property_definition WHERE key = 'oxygen_permeability'),
    'lower_is_better',
    'دلیل اصلی وجود بسته‌بندی انعطاف‌پذیر تماسی با غذا، ایجاد مانع در برابر اکسیژن برای افزایش عمر قفسه است.',
    'Food-contact flexible packaging exists largely to provide an oxygen barrier that extends shelf life.'
),
(   (SELECT id FROM application WHERE key = 'flexible_packaging_film'),
    (SELECT id FROM property_definition WHERE key = 'co2_permeability'),
    'lower_is_better',
    'همان منطق مانع اکسیژن برای بسته‌بندی با اتمسفر اصلاح‌شده در مورد CO2 نیز صدق می‌کند.',
    'Same barrier logic as oxygen applies to CO2 for modified-atmosphere packaging.'
),

-- -----------------------------------------------------------------------
-- agricultural_film -- mulch/greenhouse film
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'agricultural_film'),
    (SELECT id FROM property_definition WHERE key = 'elongation_at_break'),
    'higher_is_better',
    'فیلم کشاورزی (مالچ/گلخانه) باید روی زمین ناهموار کشیده شود و بادهای فصلی را بدون پارگی تحمل کند.',
    'Agricultural (mulch/greenhouse) film must stretch over uneven ground and withstand seasonal wind loading without tearing.'
),
(   (SELECT id FROM application WHERE key = 'agricultural_film'),
    (SELECT id FROM property_definition WHERE key = 'tensile_strength'),
    'higher_is_better',
    'باید نصب مکانیکی و بارگذاری چندفصلی آب‌وهوا/باد را بدون شکست تحمل کند.',
    'Must survive mechanical laying and multi-season wind/weather loading without failure.'
),
(   (SELECT id FROM application WHERE key = 'agricultural_film'),
    (SELECT id FROM property_definition WHERE key = 'escr'),
    'not_relevant',
    'ترک ناشی از تنش محیطی، حالت شکست قطعات ضخیم و صلب تحت تنش پایدار است؛ فیلم نازک کشاورزی در معرض ترکیب تنش پایدار + تماس شیمیایی که ESCR اندازه می‌گیرد نیست، بنابراین این خاصیت برای این کاربرد تمایزدهنده نیست.',
    'ESCR is a bulk/rigid-part failure mode under sustained stress; thin agricultural film is not exposed to the sustained-stress-plus-chemical conditions ESCR measures, so it does not discriminate for this application.'
),

-- -----------------------------------------------------------------------
-- automotive_fuel_tanks -- HDPE fuel tank
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'automotive_fuel_tanks'),
    (SELECT id FROM property_definition WHERE key = 'escr'),
    'higher_is_better',
    'دیواره باک در تماس دائم با سوخت/افزودنی‌ها و تحت تنش مکانیکی است -- کاربرد کتاب‌درسی ESCR؛ رزین‌های باک سوخت HDPE دقیقاً برای همین انتخاب می‌شوند.',
    'The tank wall is in continuous contact with fuel/additives while under mechanical stress -- the textbook ESCR use case; HDPE fuel-tank resins are selected specifically for this.'
),
(   (SELECT id FROM application WHERE key = 'automotive_fuel_tanks'),
    (SELECT id FROM property_definition WHERE key = 'flexural_modulus'),
    'higher_is_better',
    'صلبیت ساختاری برای باک خودنگهدار زیر بدنه لازم است.',
    'Structural rigidity is needed for a self-supporting under-body tank.'
),
(   (SELECT id FROM application WHERE key = 'automotive_fuel_tanks'),
    (SELECT id FROM property_definition WHERE key = 'tensile_strength'),
    'higher_is_better',
    'باید بارگذاری ضربه‌ای/تصادف را بدون پارگی تحمل کند.',
    'Must survive impact/crash loading without rupture.'
),
(   (SELECT id FROM application WHERE key = 'automotive_fuel_tanks'),
    (SELECT id FROM property_definition WHERE key = 'density'),
    'higher_is_better',
    'رده‌های HDPE با چگالی بالاتر سفتی و مقاومت نفوذپذیری بهتری برای باک سوخت ارائه می‌دهند.',
    'Higher-density HDPE grades give better stiffness and permeation resistance for a fuel tank.'
),

-- -----------------------------------------------------------------------
-- chemical_tanks_pallets -- chemical storage tank / pallet
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'chemical_tanks_pallets'),
    (SELECT id FROM property_definition WHERE key = 'escr'),
    'higher_is_better',
    'کاربرد کلاسیک ESCR: مخزن نگهداری مواد شیمیایی تحت تنش پایدار و تماس شیمیایی تهاجمی است.',
    'The canonical ESCR application: a chemical storage tank under sustained stress and aggressive chemical contact.'
),
(   (SELECT id FROM application WHERE key = 'chemical_tanks_pallets'),
    (SELECT id FROM property_definition WHERE key = 'density'),
    'higher_is_better',
    'رده‌های HDPE با چگالی بالاتر برای انتخاب رزین مخزن/پالت، سفت‌تر و از نظر شیمیایی مقاوم‌تر هستند.',
    'Higher-density HDPE grades are stiffer and chemically tougher, the standard basis for tank/pallet resin selection.'
),
(   (SELECT id FROM application WHERE key = 'chemical_tanks_pallets'),
    (SELECT id FROM property_definition WHERE key = 'flexural_modulus'),
    'higher_is_better',
    'صلبیت لازم برای مخزن خودنگهدار یا کف پالت باربر.',
    'Rigidity is needed for a self-supporting tank or a load-bearing pallet deck.'
),
(   (SELECT id FROM application WHERE key = 'chemical_tanks_pallets'),
    (SELECT id FROM property_definition WHERE key = 'tensile_strength'),
    'higher_is_better',
    'بار هیدرواستاتیک مایع ذخیره‌شده یا بارهای قفسه‌بندی پالت را تحمل می‌کند.',
    'Withstands the hydrostatic load of stored liquid, or pallet racking loads.'
),

-- -----------------------------------------------------------------------
-- geomembranes -- buried liner
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'geomembranes'),
    (SELECT id FROM property_definition WHERE key = 'escr'),
    'higher_is_better',
    'لاینر مدفون تحت تنش کششی پایدار برای دهه‌ها است؛ استانداردهای ژئوممبران HDPE (سبک GRI-GM13) حداقل ESCR را دقیقاً به این دلیل تعیین می‌کنند که رشد آهسته ترک، غالب‌ترین حالت شکست بلندمدت است.',
    'A buried liner is under sustained tensile stress for decades; HDPE geomembrane specs (GRI-GM13-style) set a minimum ESCR precisely because slow crack growth is the dominant long-term failure mode.'
),
(   (SELECT id FROM application WHERE key = 'geomembranes'),
    (SELECT id FROM property_definition WHERE key = 'tensile_strength'),
    'higher_is_better',
    'لاینر باید در برابر سوراخ‌شدگی/تنش نصب و بار بلندمدت مقاومت کند.',
    'The liner must resist puncture/installation stress and long-term load.'
),
(   (SELECT id FROM application WHERE key = 'geomembranes'),
    (SELECT id FROM property_definition WHERE key = 'elongation_at_break'),
    'higher_is_better',
    'باید با نشست زیرلایه و درزها بدون شکست ترد منطبق شود.',
    'Must conform to subgrade settlement and seams without brittle failure.'
),
(   (SELECT id FROM application WHERE key = 'geomembranes'),
    (SELECT id FROM property_definition WHERE key = 'density'),
    'higher_is_better',
    'استانداردهای رایج ژئوممبران HDPE حداقل بازه چگالی را الزامی می‌کنند، چون با توازن سفتی/ESCR مورد نیاز این کاربرد همبستگی دارد.',
    'Standard HDPE geomembrane specs require a minimum density band because it correlates with the stiffness/ESCR balance the application needs.'
),

-- -----------------------------------------------------------------------
-- rigid_packaging_bottles -- rigid bottle (household chemical, cosmetic)
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'rigid_packaging_bottles'),
    (SELECT id FROM property_definition WHERE key = 'flexural_modulus'),
    'higher_is_better',
    'بسته‌بندی صلب طبق تعریف: حفظ شکل زیر بارهای چیدمان/جابجایی.',
    'Rigid packaging, by definition: shape retention under stacking/handling loads.'
),
(   (SELECT id FROM application WHERE key = 'rigid_packaging_bottles'),
    (SELECT id FROM property_definition WHERE key = 'tensile_strength'),
    'higher_is_better',
    'تنش‌های افتادن/جابجایی را بدون ترک‌خوردگی تحمل می‌کند.',
    'Withstands drop/handling stresses without cracking.'
),
(   (SELECT id FROM application WHERE key = 'rigid_packaging_bottles'),
    (SELECT id FROM property_definition WHERE key = 'density'),
    'higher_is_better',
    'رده‌های HDPE با چگالی بالاتر انتخاب استاندارد برای بطری صلب (در مقابل بطری فشردنی) هستند، چون چگالی با سفتی همبستگی دارد.',
    'Higher-density HDPE grades are the standard choice for rigid (vs. squeezable) bottles because density tracks stiffness.'
),
(   (SELECT id FROM application WHERE key = 'rigid_packaging_bottles'),
    (SELECT id FROM property_definition WHERE key = 'escr'),
    'higher_is_better',
    'بطری محتوای شیمیایی خانگی/آرایشی را تحت تنش پایدار ناشی از شکل ظرف نگه می‌دارد -- کاربرد کلاسیک حساس به ESCR.',
    'The bottle holds household-chemical/cosmetic contents under sustained stress from the container shape -- a classic ESCR-sensitive use case.'
),

-- -----------------------------------------------------------------------
-- squeezable_bottles -- flexible squeeze bottle
-- -----------------------------------------------------------------------
(   (SELECT id FROM application WHERE key = 'squeezable_bottles'),
    (SELECT id FROM property_definition WHERE key = 'flexural_modulus'),
    'lower_is_better',
    'بطری فشردنی باید زیر فشار دست به‌صورت الاستیک تغییر شکل داده و برگردد؛ مدول خمشی پایین، نیاز تعریف‌کننده است -- برعکس بطری صلب.',
    'A squeeze bottle must deform elastically under hand pressure and rebound; low flexural modulus is the defining requirement -- the opposite of the rigid-bottle case.'
),
(   (SELECT id FROM application WHERE key = 'squeezable_bottles'),
    (SELECT id FROM property_definition WHERE key = 'elongation_at_break'),
    'higher_is_better',
    'چرخه‌های تکراری فشردن-رهاسازی به شکل‌پذیری نیاز دارند تا از ترک خستگی جلوگیری شود.',
    'Repeated squeeze-release cycling needs ductility to avoid fatigue cracking.'
),
(   (SELECT id FROM application WHERE key = 'squeezable_bottles'),
    (SELECT id FROM property_definition WHERE key = 'escr'),
    'higher_is_better',
    'همچنان یک مایع را در دیواره‌ای تحت تنش نگه می‌دارد؛ ESCR همچنان در برابر ترک‌خوردگی محافظت می‌کند، حتی با اینکه هدف سفتی برعکس بطری صلب است.',
    'It still holds a liquid product against a stressed wall; ESCR still protects against cracking even though the stiffness target is the opposite of the rigid-bottle case.'
)

ON CONFLICT (application_id, property_id) DO NOTHING;
