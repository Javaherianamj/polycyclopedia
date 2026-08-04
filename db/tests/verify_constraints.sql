-- =============================================================================
-- Schema verification: proves the invariants the design claims to enforce.
-- =============================================================================
-- Run with:  ./db/test.sh
--
-- Everything happens inside a transaction that is rolled back, so this is safe
-- to run against a seeded database without disturbing it.
--
-- Each check RAISEs an exception on failure, so ON_ERROR_STOP=1 turns any
-- broken invariant into a non-zero exit.
-- =============================================================================

BEGIN;

\set ON_ERROR_STOP on

-- Helper: assert that a statement fails. Used for the negative tests -- the
-- whole point of several constraints is that certain inserts are impossible,
-- and a test that only checks the happy path would not notice their removal.
CREATE OR REPLACE FUNCTION pg_temp.assert_fails(stmt text, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE stmt;
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  PASS  %  (rejected: %)', label, left(SQLERRM, 70);
        RETURN;
    END;
    RAISE EXCEPTION 'FAIL  %  -- statement succeeded but should have been rejected', label;
END
$$;

CREATE OR REPLACE FUNCTION pg_temp.assert(cond boolean, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF cond THEN
        RAISE NOTICE '  PASS  %', label;
    ELSE
        RAISE EXCEPTION 'FAIL  %', label;
    END IF;
END
$$;


-- =============================================================================
-- CRITERION 6: a citation cannot exist without a locator
-- =============================================================================
-- This is the structural fix for the legacy `src_default` problem: 269 values
-- all pointed at one placeholder "source" with no page, table, or section, and
-- nothing prevented it. Now the database itself refuses.
\echo ''
\echo 'CRITERION 6 -- citation requires a locator'

INSERT INTO source (kind, tier, title) VALUES ('handbook', 'peer_reviewed_handbook', '__test_source__');
INSERT INTO source_document (source_id) VALUES ((SELECT id FROM source WHERE title = '__test_source__'));

SELECT pg_temp.assert_fails(
    $q$INSERT INTO citation (source_document_id, locator)
       VALUES ((SELECT id FROM source_document WHERE source_id =
                (SELECT id FROM source WHERE title='__test_source__')), '{}'::jsonb)$q$,
    'empty locator {} rejected');

SELECT pg_temp.assert_fails(
    $q$INSERT INTO citation (source_document_id, locator)
       VALUES ((SELECT id FROM source_document WHERE source_id =
                (SELECT id FROM source WHERE title='__test_source__')), 'null'::jsonb)$q$,
    'json null locator rejected');

SELECT pg_temp.assert_fails(
    $q$INSERT INTO citation (source_document_id, locator)
       VALUES ((SELECT id FROM source_document WHERE source_id =
                (SELECT id FROM source WHERE title='__test_source__')), '{"foo":"bar"}'::jsonb)$q$,
    'locator with no recognised key rejected');

INSERT INTO citation (source_document_id, locator)
VALUES ((SELECT id FROM source_document WHERE source_id =
         (SELECT id FROM source WHERE title='__test_source__')), '{"page":412}'::jsonb);
SELECT pg_temp.assert(
    (SELECT count(*) FROM citation WHERE locator @> '{"page":412}') >= 1,
    'valid locator {"page":412} accepted');


-- =============================================================================
-- CRITERION 3: adding a new property is an INSERT, not a migration
-- =============================================================================
-- The core extensibility claim. A property for a polymer class that does not
-- exist in the seeded data (a hydrogel swelling ratio) must be addable with no
-- DDL and no application change, and must immediately accept values.
\echo ''
\echo 'CRITERION 3 -- new property needs only an INSERT'

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, data_type, canonical_unit,
     allowed_units, plausible_min, plausible_max, applies_to_fields, symbol)
VALUES
    ((SELECT id FROM property_group WHERE key = 'physical'),
     '__test_swelling_ratio__', 'نسبت تورم', 'Swelling Ratio',
     'numeric', '%', ARRAY['%','g/g'], 0, 10000, ARRAY['biopolymers'], 'Q');

SELECT pg_temp.assert(
    (SELECT count(*) FROM property_definition WHERE key = '__test_swelling_ratio__') = 1,
    'new property definition inserted with zero DDL');

-- And a value against it, to prove the registry is actually wired up.
INSERT INTO material (slug, field_id, family_id, name_fa, name_en, status)
VALUES ('__test_hydrogel__',
        (SELECT id FROM field  WHERE key = 'biopolymers'),
        (SELECT id FROM family WHERE key = 'polyolefins'),
        'هیدروژل آزمایشی', 'Test Hydrogel', 'draft');

INSERT INTO property_value
    (subject_type, subject_id, property_id, value_min, value_max, unit_display, status)
VALUES
    ('material',
     (SELECT id FROM material WHERE slug = '__test_hydrogel__'),
     (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__'),
     150, 400, '%', 'unsourced');

SELECT pg_temp.assert(
    (SELECT count(*) FROM property_value pv
       JOIN property_definition pd ON pd.id = pv.property_id
      WHERE pd.key = '__test_swelling_ratio__') = 1,
    'value against the brand-new property accepted');


-- =============================================================================
-- Value integrity constraints
-- =============================================================================
\echo ''
\echo 'VALUE INTEGRITY'

SELECT pg_temp.assert_fails(
    $q$INSERT INTO property_value (subject_type, subject_id, property_id, status)
       VALUES ('material',
               (SELECT id FROM material WHERE slug='__test_hydrogel__'),
               (SELECT id FROM property_definition WHERE key='__test_swelling_ratio__'),
               'unsourced')$q$,
    'value row with no value at all rejected');

SELECT pg_temp.assert_fails(
    $q$INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max, status)
       VALUES ('material',
               (SELECT id FROM material WHERE slug='__test_hydrogel__'),
               (SELECT id FROM property_definition WHERE key='__test_swelling_ratio__'),
               500, 100, 'unsourced')$q$,
    'inverted range (min > max) rejected');

SELECT pg_temp.assert_fails(
    $q$INSERT INTO property_value (subject_type, subject_id, property_id, value_typical, status)
       VALUES ('material', 999999999,
               (SELECT id FROM property_definition WHERE key='__test_swelling_ratio__'),
               1, 'unsourced')$q$,
    'polymorphic subject_id pointing at a nonexistent material rejected');


-- =============================================================================
-- Citation-chain and provenance queries used by the product
-- =============================================================================
\echo ''
\echo 'PROVENANCE VIEWS'

SELECT pg_temp.assert(
    -- v_unsourced_values spans both materials and grades, so its slug column
    -- is subject_slug rather than material_slug.
    (SELECT count(*) FROM v_unsourced_values
      WHERE subject_slug = '__test_hydrogel__') = 1,
    'unsourced value appears in the citation work list');

SELECT pg_temp.assert(
    (SELECT count(*) FROM information_schema.views
      WHERE table_schema='public'
        AND table_name IN ('v_material_properties','v_unsourced_values','v_citation_coverage')) = 3,
    'all three read views exist');


-- =============================================================================
-- Registry completeness
-- =============================================================================
\echo ''
\echo 'REGISTRY'

-- A floor, not a fixed count: the registry is designed to grow by seed
-- insert (0006 added 6 thermoset-specific properties on top of the original
-- 55 from src/types/polymer.ts), so asserting an exact total here would
-- make this test fail every time the registry is legitimately extended --
-- the opposite of what it exists to guard.
SELECT pg_temp.assert(
    (SELECT count(*) FROM property_definition WHERE key <> '__test_swelling_ratio__') >= 55,
    'at least the original 55 property definitions from src/types/polymer.ts are present');

SELECT pg_temp.assert(
    (SELECT count(*) FROM property_definition WHERE key = 'hardness_barcol'
       AND 'thermosets' = ANY(applies_to_fields)) = 1,
    'thermoset-specific properties (e.g. hardness_barcol) are seeded and correctly scoped');

SELECT pg_temp.assert(
    (SELECT count(*) FROM property_group) = 6,
    '6 property groups matching the existing UI tab structure');

-- A numeric property without a unit is meaningless and must be impossible.
SELECT pg_temp.assert_fails(
    $q$INSERT INTO property_definition (group_id, key, name_fa, name_en, data_type)
       VALUES ((SELECT id FROM property_group WHERE key='thermal'),
               '__test_no_unit__', 'بدون واحد', 'No Unit', 'numeric')$q$,
    'numeric property without a canonical unit rejected');

SELECT pg_temp.assert(
    (SELECT count(*) FROM property_definition WHERE canonical_unit IS NULL
       AND data_type IN ('numeric','range')) = 0,
    'no seeded numeric property is missing its unit');

\echo ''
\echo 'All schema verification checks passed.'

ROLLBACK;
