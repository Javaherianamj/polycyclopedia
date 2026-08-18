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

-- ---------------------------------------------------------------------------
-- 0026: the work list covers every subject_type, and reads `evidence`
-- ---------------------------------------------------------------------------
-- Two regressions are guarded here, both of which shipped silently once
-- before. Until 0026 the view knew only material and grade, so a grade_class
-- value (0016) appeared with a NULL subject_slug -- a work-list entry that
-- named no subject -- and its citedness was read off property_value.status,
-- which attaching evidence never updates.

INSERT INTO grade_class (material_id, key, name_fa, name_en)
VALUES ((SELECT id FROM material WHERE slug = '__test_hydrogel__'),
        '__test_film__', 'فیلم آزمایشی', 'Test Film');

INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max, status)
VALUES ('grade_class',
        (SELECT id FROM grade_class WHERE key = '__test_film__'),
        (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__'),
        200, 300, 'unsourced');

SELECT pg_temp.assert(
    (SELECT count(*) FROM v_unsourced_values
      WHERE subject_type = 'grade_class'
        AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')) = 1,
    'an uncited grade_class value appears in the citation work list');

-- grade_class has no slug column of its own; 0016 names these populations
-- "<material>/<key>", which is what the view must reconstruct rather than
-- leaving the curator with a nameless row.
SELECT pg_temp.assert(
    (SELECT subject_slug FROM v_unsourced_values
      WHERE subject_type = 'grade_class'
        AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__'))
    = '__test_hydrogel__/__test_film__',
    'grade_class work-list row is identified as <material_slug>/<grade_class_key>');

SELECT pg_temp.assert(
    (SELECT subject_name_en IS NOT NULL AND subject_name_fa IS NOT NULL
       FROM v_unsourced_values
      WHERE subject_type = 'grade_class'
        AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')),
    'grade_class work-list row carries both subject names, not NULLs');

-- A subject the view cannot resolve to a name is the exact failure 0026
-- fixed; assert it for every row, so adding a fifth subject_type without
-- widening the joins fails here instead of shipping nameless work items.
SELECT pg_temp.assert(
    (SELECT count(*) FROM v_unsourced_values WHERE subject_slug IS NULL) = 0,
    'no work-list row has an unresolved (NULL) subject_slug');

-- Citedness must follow `evidence`, not status: this row keeps
-- status = 'unsourced' throughout and must still leave the list.
INSERT INTO evidence (subject_type, subject_id, citation_id, extraction_method)
VALUES ('property_value',
        (SELECT id FROM property_value WHERE subject_type = 'grade_class'
           AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')),
        (SELECT id FROM citation WHERE locator @> '{"page":412}' LIMIT 1),
        'manual');

SELECT pg_temp.assert(
    (SELECT count(*) FROM v_unsourced_values
      WHERE subject_type = 'grade_class'
        AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')) = 0,
    'evidence removes the value from the work list even though status is still unsourced');

SELECT pg_temp.assert(
    (SELECT status FROM property_value WHERE subject_type = 'grade_class'
       AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__'))::text = 'unsourced',
    'and status really was never updated -- the view no longer depends on it');

-- The other half of the citations.ts rule (0017): an editorial row is also
-- cited by evidence on an observation linked beneath it, without the citation
-- being re-inserted against the parent.
DELETE FROM evidence WHERE subject_type = 'property_value'
  AND subject_id = (SELECT id FROM property_value WHERE subject_type = 'grade_class'
      AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
      AND value_role = 'editorial');

SELECT pg_temp.assert(
    (SELECT count(*) FROM v_unsourced_values
      WHERE subject_type = 'grade_class'
        AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')) = 1,
    'removing the evidence puts the grade_class value back on the work list');

INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max,
                            value_role, editorial_value_id, status)
VALUES ('grade_class',
        (SELECT id FROM grade_class WHERE key = '__test_film__'),
        (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__'),
        210, 290, 'observation',
        (SELECT id FROM property_value WHERE subject_type = 'grade_class'
           AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
           AND value_role = 'editorial'),
        'unsourced');

INSERT INTO evidence (subject_type, subject_id, citation_id, extraction_method)
VALUES ('property_value',
        (SELECT id FROM property_value WHERE subject_type = 'grade_class'
           AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
           AND value_role = 'observation'),
        (SELECT id FROM citation WHERE locator @> '{"page":412}' LIMIT 1),
        'manual');

SELECT pg_temp.assert(
    (SELECT count(*) FROM v_unsourced_values
      WHERE subject_type = 'grade_class'
        AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
        AND property_value_id = (SELECT id FROM property_value WHERE subject_type = 'grade_class'
            AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
            AND value_role = 'editorial')) = 0,
    'evidence on a linked observation also clears its editorial parent (citations.ts rule)');

-- ...but the observation itself is only vouched for by its own evidence, so
-- an uncited sibling observation stays on the list.
INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max,
                            value_role, editorial_value_id, status)
VALUES ('grade_class',
        (SELECT id FROM grade_class WHERE key = '__test_film__'),
        (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__'),
        205, 295, 'observation',
        (SELECT id FROM property_value WHERE subject_type = 'grade_class'
           AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
           AND value_role = 'editorial'),
        'unsourced');

SELECT pg_temp.assert(
    (SELECT count(*) FROM v_unsourced_values uv
       JOIN property_value pv ON pv.id = uv.property_value_id
      WHERE uv.subject_type = 'grade_class'
        AND uv.subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
        AND pv.value_role = 'observation') = 1,
    'an uncited observation stays on the list; its cited sibling does not');

-- Cleanup: the suite rolls back, but leaving the fixture in place would let
-- later assertions in this file count rows they did not create.
DELETE FROM property_value WHERE subject_type = 'grade_class'
  AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__')
  AND value_role = 'observation';
DELETE FROM property_value WHERE subject_type = 'grade_class'
  AND subject_id = (SELECT id FROM grade_class WHERE key = '__test_film__');
DELETE FROM grade_class WHERE key = '__test_film__';

SELECT pg_temp.assert(
    (SELECT count(*) FROM v_unsourced_values WHERE subject_type = 'grade_class'
      AND subject_id NOT IN (SELECT id FROM grade_class)) = 0,
    'grade_class fixture cleaned up, no dangling work-list rows');


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

-- =============================================================================
-- U1 v2: grade_class rung
-- =============================================================================
\echo ''
\echo 'GRADE CLASS (U1 v2 FR-1)'

INSERT INTO grade_class (material_id, key, name_fa, name_en)
VALUES ((SELECT id FROM material WHERE slug = '__test_hydrogel__'),
        'injection', 'تزریقی', 'Injection');

SELECT pg_temp.assert(
    (SELECT count(*) FROM grade_class WHERE key = 'injection'
       AND material_id = (SELECT id FROM material WHERE slug = '__test_hydrogel__')) = 1,
    'grade_class row inserted under a material');

INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max, status)
VALUES ('grade_class',
        (SELECT id FROM grade_class WHERE key = 'injection'
           AND material_id = (SELECT id FROM material WHERE slug = '__test_hydrogel__')),
        (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__'),
        100, 200, 'unsourced');

-- Scoped to the property this test itself created (__test_swelling_ratio__),
-- not "any grade_class row in the database" -- real curated data (U1 v2
-- FR-12) legitimately creates many grade_class rows named 'injection' across
-- different materials, and an unscoped count would break every time more is
-- curated.
SELECT pg_temp.assert(
    (SELECT count(*) FROM property_value pv
       JOIN property_definition pd ON pd.id = pv.property_id
      WHERE pv.subject_type = 'grade_class' AND pd.key = '__test_swelling_ratio__') = 1,
    'property_value accepted with subject_type = grade_class');

SELECT pg_temp.assert_fails(
    $q$INSERT INTO property_value (subject_type, subject_id, property_id, value_typical, status)
       VALUES ('grade_class', 999999999,
               (SELECT id FROM property_definition WHERE key='__test_swelling_ratio__'),
               1, 'unsourced')$q$,
    'polymorphic subject_id pointing at a nonexistent grade_class rejected');


-- =============================================================================
-- U1 v2: observation/editorial value_role, narrowed unique index
-- =============================================================================
\echo ''
\echo 'OBSERVATION / EDITORIAL (U1 v2 FR-2)'

-- Two observations for the same (subject, property, conditions) must be able
-- to coexist -- the entire point of this revision. Under the old
-- uq_property_value_live (one live value, full stop) the second insert here
-- would have been rejected.
INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max, value_role, status)
VALUES ('material', (SELECT id FROM material WHERE slug = '__test_hydrogel__'),
        (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__'),
        150, 380, 'observation', 'unsourced');

INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max, value_role, status)
VALUES ('material', (SELECT id FROM material WHERE slug = '__test_hydrogel__'),
        (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__'),
        160, 420, 'observation', 'unsourced');

SELECT pg_temp.assert(
    (SELECT count(*) FROM property_value
      WHERE subject_type = 'material'
        AND subject_id = (SELECT id FROM material WHERE slug = '__test_hydrogel__')
        AND property_id = (SELECT id FROM property_definition WHERE key = '__test_swelling_ratio__')
        AND value_role = 'observation') = 2,
    'two observation rows coexist for the same (subject, property, conditions)');

-- A second EDITORIAL row for the same (subject, property, conditions) must
-- still be rejected -- the narrowed index protects editorial rows only.
SELECT pg_temp.assert_fails(
    $q$INSERT INTO property_value (subject_type, subject_id, property_id, value_min, value_max, value_role, status)
       VALUES ('material', (SELECT id FROM material WHERE slug='__test_hydrogel__'),
               (SELECT id FROM property_definition WHERE key='__test_swelling_ratio__'),
               150, 400, 'editorial', 'unsourced')$q$,
    'second live editorial row for the same (subject, property, conditions) rejected');

-- An editorial row cannot itself point at another editorial row.
SELECT pg_temp.assert_fails(
    $q$UPDATE property_value SET editorial_value_id =
        (SELECT id FROM property_value WHERE subject_type='material'
           AND subject_id=(SELECT id FROM material WHERE slug='__test_hydrogel__')
           AND property_id=(SELECT id FROM property_definition WHERE key='__test_swelling_ratio__')
           AND value_role='editorial')
      WHERE subject_type='material'
        AND subject_id=(SELECT id FROM material WHERE slug='__test_hydrogel__')
        AND property_id=(SELECT id FROM property_definition WHERE key='__test_swelling_ratio__')
        AND value_role='editorial'$q$,
    'editorial row cannot set editorial_value_id (not an observation)');


-- =============================================================================
-- U1 v2: variance_class
-- =============================================================================
\echo ''
\echo 'VARIANCE CLASS (U1 v2 FR-4)'

SELECT pg_temp.assert(
    (SELECT variance_class FROM property_definition WHERE key = 'density') = 'intrinsic',
    'density classified intrinsic');
SELECT pg_temp.assert(
    (SELECT variance_class FROM property_definition WHERE key = 'tensile_strength') = 'grade_dependent',
    'tensile_strength classified grade_dependent');
SELECT pg_temp.assert(
    (SELECT variance_class FROM property_definition WHERE key = 'hdt') = 'process_dependent',
    'hdt classified process_dependent');


-- =============================================================================
-- U1 v2: evidence polymorphism (closes DATA-GAPS N1)
-- =============================================================================
\echo ''
\echo 'EVIDENCE POLYMORPHISM (U1 v2 FR-5 / N1)'

INSERT INTO chemical_resistance (material_id, reagent_fa, reagent_en, rating)
VALUES ((SELECT id FROM material WHERE slug = '__test_hydrogel__'), 'آب', 'Water', 'excellent');

INSERT INTO evidence (subject_type, subject_id, citation_id, extraction_method)
VALUES ('chemical_resistance',
        (SELECT id FROM chemical_resistance WHERE material_id = (SELECT id FROM material WHERE slug = '__test_hydrogel__')),
        (SELECT id FROM citation WHERE locator @> '{"page":412}' LIMIT 1),
        'manual');

SELECT pg_temp.assert(
    (SELECT count(*) FROM evidence WHERE subject_type = 'chemical_resistance') = 1,
    'evidence accepted against chemical_resistance -- a table that could never be cited before U1 v2');

SELECT pg_temp.assert_fails(
    $q$INSERT INTO evidence (subject_type, subject_id, citation_id, extraction_method)
       VALUES ('chemical_resistance', 999999999,
               (SELECT id FROM citation WHERE locator @> '{"page":412}' LIMIT 1), 'manual')$q$,
    'evidence rejects a subject_id that does not exist in the named subject_type table');

-- Deleting the chemical_resistance row must clean up its evidence (the
-- polymorphic reference cannot rely on a FK's ON DELETE CASCADE).
DELETE FROM chemical_resistance WHERE material_id = (SELECT id FROM material WHERE slug = '__test_hydrogel__');

SELECT pg_temp.assert(
    (SELECT count(*) FROM evidence WHERE subject_type = 'chemical_resistance') = 0,
    'evidence cleanup trigger removed the orphaned row on chemical_resistance delete');


-- =============================================================================
-- U1 v2: publish threshold
-- =============================================================================
\echo ''
\echo 'PUBLISH THRESHOLD (U1 v2 FR-9)'

-- The editorial row from the OBSERVATION/EDITORIAL block above has 0 linked
-- observations (they were never explicitly linked) and __test_swelling_ratio__
-- defaults to grade_dependent (variance_class default) -- so promoting it
-- must fail on the observation-count rule.
SELECT pg_temp.assert_fails(
    $q$UPDATE property_value SET status = 'published'
      WHERE subject_type='material'
        AND subject_id=(SELECT id FROM material WHERE slug='__test_hydrogel__')
        AND property_id=(SELECT id FROM property_definition WHERE key='__test_swelling_ratio__')
        AND value_role='editorial'$q$,
    'publish rejected: grade_dependent editorial row with 0 linked observations');

-- =============================================================================
-- FE-6: application_property_polarity (CR4/CR5/CR6)
-- =============================================================================
-- CR6 is the load-bearing rule: polarity is editorial judgement and must
-- never be reachable from the citation/evidence machinery. The strongest
-- proof is structural -- evidence_check_subject() (0020) does not recognise
-- 'application_property_polarity' as a subject_type at all, so no citation
-- can ever be attached to a polarity row, not even by mistake.
\echo ''
\echo 'APPLICATION PROPERTY POLARITY (FE-6 CR4/CR5/CR6)'

-- Fresh, value-free test fixtures for this section -- deliberately NOT
-- __test_swelling_ratio__, which by this point in the suite has real
-- property_value rows referencing it (property_value.property_id has no
-- ON DELETE CASCADE); deleting it here to exercise the polarity cascade
-- would fail on that unrelated FK rather than proving anything about
-- application_property_polarity.
INSERT INTO application (key, name_fa, name_en)
VALUES ('__test_application__', 'کاربرد آزمایشی', 'Test Application');

INSERT INTO property_definition
    (group_id, key, name_fa, name_en, data_type, canonical_unit, allowed_units)
VALUES
    ((SELECT id FROM property_group WHERE key = 'physical'),
     '__test_polarity_property__', 'ویژگی آزمایشی', 'Test Property',
     'numeric', '%', ARRAY['%']);

SELECT pg_temp.assert_fails(
    $q$INSERT INTO application_property_polarity
        (application_id, property_id, polarity, rationale_fa, rationale_en)
       VALUES
        ((SELECT id FROM application WHERE key = '__test_application__'),
         (SELECT id FROM property_definition WHERE key = '__test_polarity_property__'),
         '__bogus_polarity__', 'دلیل آزمایشی', 'test rationale')$q$,
    'enum rejects a polarity value outside higher_is_better/lower_is_better/not_relevant');

INSERT INTO application_property_polarity
    (application_id, property_id, polarity, rationale_fa, rationale_en)
VALUES
    ((SELECT id FROM application WHERE key = '__test_application__'),
     (SELECT id FROM property_definition WHERE key = '__test_polarity_property__'),
     'higher_is_better', 'دلیل آزمایشی', 'test rationale');

SELECT pg_temp.assert(
    (SELECT count(*) FROM application_property_polarity
       WHERE application_id = (SELECT id FROM application WHERE key = '__test_application__')
         AND property_id = (SELECT id FROM property_definition WHERE key = '__test_polarity_property__')) = 1,
    'valid polarity row accepted');

SELECT pg_temp.assert_fails(
    $q$INSERT INTO application_property_polarity
        (application_id, property_id, polarity, rationale_fa, rationale_en)
       VALUES
        ((SELECT id FROM application WHERE key = '__test_application__'),
         (SELECT id FROM property_definition WHERE key = '__test_polarity_property__'),
         'lower_is_better', 'دلیل دوم', 'second rationale')$q$,
    'unique constraint rejects a second row for the same (application, property) pair');

-- CR6, enforced structurally: application_property_polarity is not one of
-- the subject_type values evidence_check_subject() knows about, so pointing
-- a citation at a polarity row is impossible, not merely disallowed by
-- convention.
SELECT pg_temp.assert_fails(
    $q$INSERT INTO evidence (subject_type, subject_id, citation_id, extraction_method)
       VALUES ('application_property_polarity',
               (SELECT id FROM application_property_polarity
                  WHERE application_id = (SELECT id FROM application WHERE key = '__test_application__')
                    AND property_id = (SELECT id FROM property_definition WHERE key = '__test_polarity_property__')),
               (SELECT id FROM citation WHERE locator @> '{"page":412}' LIMIT 1),
               'manual')$q$,
    'a polarity row cannot be attached to a citation -- application_property_polarity is not a recognised evidence subject_type');

SELECT pg_temp.assert(
    NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'evidence_subject_type_chk'
          AND pg_get_constraintdef(oid) LIKE '%application_property_polarity%'
    ),
    'evidence.subject_type CHECK constraint does not list application_property_polarity as a valid subject');

-- Cascade on deleting the property_definition side.
DELETE FROM property_definition WHERE key = '__test_polarity_property__';

SELECT pg_temp.assert(
    NOT EXISTS (SELECT 1 FROM application_property_polarity
                  WHERE application_id = (SELECT id FROM application WHERE key = '__test_application__')),
    'deleting property_definition cascades to remove its polarity rows (no orphans left behind)');

-- Cascade on deleting the application side.
INSERT INTO property_definition
    (group_id, key, name_fa, name_en, data_type, canonical_unit, allowed_units)
VALUES
    ((SELECT id FROM property_group WHERE key = 'physical'),
     '__test_polarity_property_2__', 'ویژگی آزمایشی دو', 'Test Property Two',
     'numeric', '%', ARRAY['%']);

INSERT INTO application_property_polarity
    (application_id, property_id, polarity, rationale_fa, rationale_en)
VALUES
    ((SELECT id FROM application WHERE key = '__test_application__'),
     (SELECT id FROM property_definition WHERE key = '__test_polarity_property_2__'),
     'not_relevant', 'دلیل آزمایشی', 'test rationale');

DELETE FROM application WHERE key = '__test_application__';

SELECT pg_temp.assert(
    NOT EXISTS (SELECT 1 FROM application_property_polarity
                  WHERE property_id = (SELECT id FROM property_definition WHERE key = '__test_polarity_property_2__')),
    'deleting application cascades to remove its polarity rows');

DELETE FROM property_definition WHERE key = '__test_polarity_property_2__';


\echo ''
\echo 'All schema verification checks passed.'

ROLLBACK;
