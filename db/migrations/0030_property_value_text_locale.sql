-- 0030_property_value_text_locale.sql
-- Splits property_value.value_text into a value_text_fa / value_text_en pair.
--
-- Why: value_text was the last human-readable string in the schema stored as
-- a single field. Everything else is already a _fa/_en pair -- material.name_fa
-- /name_en, property_definition.description_fa/_en, chemical_resistance.
-- reagent_fa/_en, market_share_datum.segment_fa/_en, and note_fa/note_en on
-- this very table, one column along. Because text-typed values had nowhere to
-- put a translation, both languages were crammed into the one column
-- ('اتیلن (Ethylene)'), which renders as mixed script whichever locale the
-- reader asked for -- visible on /en/learn?material=hdpe, where the DP
-- calculator's provenance note reads 'اتیلن (Ethylene)' on an English page.
--
-- Additive on purpose: value_text is kept, not dropped. Nothing that reads it
-- breaks, and it can be removed once no reader references it. Migrations here
-- are forward-only (db/run.sh), so the drop must be its own version anyway.

BEGIN;

-- ---------------------------------------------------------------------------
-- The new pair
-- ---------------------------------------------------------------------------

ALTER TABLE property_value
    ADD COLUMN value_text_fa text,
    ADD COLUMN value_text_en text;

COMMENT ON COLUMN property_value.value_text_fa IS
    'Persian rendering of a text-typed value. Pairs with value_text_en, matching the _fa/_en convention used by every other bilingual string in the schema (including note_fa/note_en on this table).';
COMMENT ON COLUMN property_value.value_text_en IS
    'English rendering of a text-typed value. Either half may be NULL -- a reader falls back to the other rather than rendering nothing (see computeDisplay in api/src/routes/materials.ts).';
COMMENT ON COLUMN property_value.value_text IS
    'DEPRECATED -- superseded by value_text_fa/value_text_en in 0030. Retained so existing readers keep working; drop once none reference it. Do not write to it from new seeds, ETL or curation code.';

-- ---------------------------------------------------------------------------
-- "A row must carry some value" now accepts the new pair
-- ---------------------------------------------------------------------------
--
-- Without this, a row populating only value_text_fa/value_text_en -- the shape
-- every new text-typed value takes -- would violate the original check.

ALTER TABLE property_value
    DROP CONSTRAINT property_value_has_a_value_chk;

ALTER TABLE property_value
    ADD CONSTRAINT property_value_has_a_value_chk CHECK (
        value_min IS NOT NULL OR value_max IS NOT NULL OR value_typical IS NOT NULL
        OR value_text IS NOT NULL OR value_text_fa IS NOT NULL OR value_text_en IS NOT NULL
        OR value_enum IS NOT NULL OR value_bool IS NOT NULL
    );

-- ---------------------------------------------------------------------------
-- Backfill, part 1: the known strings
-- ---------------------------------------------------------------------------
--
-- Keyed on the legacy string rather than on (material, property) because the
-- live values are not reproducible from the seeds alone -- curation tooling
-- has edited them since (unit_cell in the database reads 'orthorhombic,
-- a=7.42 A, ...', not the '7.4, 4.93, 2.55 Å (Orthorhombic)' that
-- db/seeds/0005 emits). Matching the string fixes the row wherever it came
-- from, and re-running is a no-op once value_text_fa is set.
--
-- Two kinds of pair. Language-neutral values (formulae, repeat units) repeat
-- the same string in both halves -- a formula is already correct in either
-- locale. Persian values drop the trailing English gloss from the fa half,
-- since the en half now carries it; inline English *terms* inside prose (e.g.
-- '(Chain Transfer)') stay put, being terminology aids a Persian reader
-- expects rather than a translation of the sentence.
--
-- These are translations of content already present, not new claims: no row's
-- status, confidence or evidence is touched.

UPDATE property_value pv
SET value_text_fa = t.fa,
    value_text_en = t.en
FROM (VALUES
    -- language-neutral
    ('C2H4', 'C2H4', 'C2H4'),
    ('[CH2 - CH2]n', '[CH2 - CH2]n', '[CH2 - CH2]n'),
    ('2.0-2.5', '2.0-2.5', '2.0-2.5'),
    ('No Break', 'بدون شکست', 'No Break'),
    -- labels
    ('اتیلن (Ethylene)', 'اتیلن', 'Ethylene'),
    ('نیمه‌شفاف (Translucent)', 'نیمه‌شفاف', 'Translucent'),
    ('کدر / کدر متمایل به سفید (Opaque)', 'کدر / کدر متمایل به سفید', 'Opaque / off-white opaque'),
    ('2:1 تا 4:1', '2:1 تا 4:1', '2:1 to 4:1'),
    ('2:1 تا 6:1', '2:1 تا 6:1', '2:1 to 6:1'),
    ('orthorhombic, a=7.42 A, b=4.94 A, c=2.55 A',
     'اورتورومبیک، a=7.42 آنگستروم، b=4.94 آنگستروم، c=2.55 آنگستروم',
     'Orthorhombic, a=7.42 Å, b=4.94 Å, c=2.55 Å'),
    ('7.4, 4.93, 2.55 Å (Orthorhombic)',
     '7.4، 4.93، 2.55 آنگستروم (اورتورومبیک)',
     '7.4, 4.93, 2.55 Å (Orthorhombic)'),
    ('7.42, 4.95, 2.55 Å (Orthorhombic)',
     '7.42، 4.95، 2.55 آنگستروم (اورتورومبیک)',
     '7.42, 4.95, 2.55 Å (Orthorhombic)'),
    -- prose
    ('رادیکال آزاد (فشار بالا 1000-3000 بار و دمای 200-300 °C با آغازگر پراکسید آلی)',
     'رادیکال آزاد (فشار بالا 1000-3000 بار و دمای 200-300 °C با آغازگر پراکسید آلی)',
     'Free radical (high pressure, 1000-3000 bar and 200-300 °C, with an organic peroxide initiator)'),
    ('کاتالیزوری (فشار 1-50 بار و دمای 70-120 °C با کاتالیزور زیگلر-ناتا، کروم فیلیپس یا متالوسن)',
     'کاتالیزوری (فشار 1-50 بار و دمای 70-120 °C با کاتالیزور زیگلر-ناتا، کروم فیلیپس یا متالوسن)',
     'Catalytic (1-50 bar and 70-120 °C, with a Ziegler-Natta, Phillips chromium or metallocene catalyst)'),
    ('وقوع مکرر واکنش‌های انتقال زنجیر (Chain Transfer) و Backbiting عامل اصلی ایجاد شاخه‌های کوتاه و بلند در زنجیر است.',
     'وقوع مکرر واکنش‌های انتقال زنجیر (Chain Transfer) و Backbiting عامل اصلی ایجاد شاخه‌های کوتاه و بلند در زنجیر است.',
     'Frequent chain transfer and backbiting reactions are the main cause of the short- and long-chain branches along the chain.'),
    ('کاهش شدید واکنش‌های انتقال زنجیر، منجر به تولید زنجیرهای کاملاً خطی با تراکم شاخه کمتر از 5 در هر 1000 کربن می‌شود.',
     'کاهش شدید واکنش‌های انتقال زنجیر، منجر به تولید زنجیرهای کاملاً خطی با تراکم شاخه کمتر از 5 در هر 1000 کربن می‌شود.',
     'Sharply reduced chain transfer yields fully linear chains with a branch density below 5 per 1000 carbons.'),
    ('رفتار ویسکوزیته مذاب از نوع شبه‌پلاستیک (Shear-Thinning) با استحکام مذاب (Melt Strength) بالا به دلیل گره‌خوردگی شاخه‌های بلند است.',
     'رفتار ویسکوزیته مذاب از نوع شبه‌پلاستیک (Shear-Thinning) با استحکام مذاب (Melt Strength) بالا به دلیل گره‌خوردگی شاخه‌های بلند است.',
     'Melt viscosity is pseudoplastic (shear-thinning), with high melt strength owing to long-chain-branch entanglement.'),
    ('رفتار ویسکوزیته مذاب شبه‌پلاستیک است. زمان خنک‌سازی آن در قالب به علت بلورینگی سریع، کوتاه است.',
     'رفتار ویسکوزیته مذاب شبه‌پلاستیک است. زمان خنک‌سازی آن در قالب به علت بلورینگی سریع، کوتاه است.',
     'Melt viscosity is pseudoplastic. In-mould cooling time is short because crystallisation is rapid.'),
    ('مقدار آنتالپی ذوب تجربی برای LDPE کاملاً بلوری (100% فرضی) برابر با 293 J/g می‌باشد که مبنای محاسبات تجربی بلورینگی است.',
     'مقدار آنتالپی ذوب تجربی برای LDPE کاملاً بلوری (100% فرضی) برابر با 293 J/g می‌باشد که مبنای محاسبات تجربی بلورینگی است.',
     'The experimental enthalpy of fusion for fully crystalline LDPE (a hypothetical 100%) is 293 J/g, the basis for empirical crystallinity calculations.'),
    ('به دلیل درصد بلورینگی بالاتر نسبت به LDPE، میزان کسر حجم آزاد کمتر است و نفوذپذیری گازها کاهش می‌یابد.',
     'به دلیل درصد بلورینگی بالاتر نسبت به LDPE، میزان کسر حجم آزاد کمتر است و نفوذپذیری گازها کاهش می‌یابد.',
     'Because crystallinity is higher than in LDPE, the free volume fraction is lower and gas permeability decreases.')
) AS t(legacy, fa, en)
WHERE pv.value_text = t.legacy
  AND pv.value_text_fa IS NULL
  AND pv.value_text_en IS NULL;

-- ---------------------------------------------------------------------------
-- Backfill, part 2: anything the table above did not cover
-- ---------------------------------------------------------------------------
--
-- Deliberately NOT parsing 'فارسی (English)' apart. The parenthetical is only
-- sometimes a translation -- in '1953 (Karl Ziegler)' and '(Chain Transfer)'
-- it is not -- so a mechanical split would corrupt as many rows as it fixed.
-- Unrecognised text is treated as Persian, which is what it predominantly is;
-- a reader falls back to the fa half when en is NULL, so the worst case is
-- today's behaviour rather than a blank field.

UPDATE property_value
SET value_text_fa = value_text
WHERE value_text IS NOT NULL
  AND value_text_fa IS NULL
  AND value_text_en IS NULL;

-- ---------------------------------------------------------------------------
-- Views deliberately untouched
-- ---------------------------------------------------------------------------
--
-- v_material_properties and v_unsourced_values both select pv.value_text, but
-- no caller reads that column from either view -- the API queries the base
-- tables directly (it needs sort_order, which the views omit), and the
-- curation tests use the views only for counts and property names. Adding the
-- pair would mean restating two large view definitions verbatim under CREATE
-- OR REPLACE for no reader. Update them in the migration that finally drops
-- value_text, where they have to be rewritten anyway.

INSERT INTO schema_migration (version) VALUES ('0030') ON CONFLICT DO NOTHING;

COMMIT;
