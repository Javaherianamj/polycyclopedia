-- 0023_publish_threshold_single_source_bypass.sql
-- Polypedia: U1 v2 -- publish threshold, single-source/override bypass.
--
-- Found while re-running the curation test suite against 0021: the existing
-- tools/curation/import_values.py workflow (the CSV importer that predates
-- this revision) attaches one citation to one row and immediately marks it
-- 'published' -- the exact single-citation model U1 v2 exists to move away
-- from for grade_dependent/process_dependent properties. Applying 0021's
-- threshold unconditionally to that path does not gently degrade it; it
-- permanently locks every grade_dependent/process_dependent property out of
-- 'published' through the legacy importer, because that importer never
-- creates the linked observation rows the threshold counts -- there would be
-- no way to ever satisfy it short of building the full multi-observation
-- workflow into the CSV importer, which is explicitly out of scope for this
-- unit (database-revision-requirements.md "Out of Scope").
--
-- The schema already has the right escape hatch for this, unused until now:
-- derivation_rule = 'single_source' ("only one observation exists, nothing
-- to merge" -- 0017's own comment) and 'manual_override' ("curator wrote a
-- different number, with a reason recorded in note_fa/note_en"). Both are
-- the curator (or, for now, the importer acting as curator) explicitly
-- asserting "I am publishing this on less than the full threshold, on
-- purpose" -- which is a real, named case, not a loophole. The threshold
-- trigger now trusts that assertion rather than overriding it.

BEGIN;

CREATE OR REPLACE FUNCTION property_value_check_publish_threshold() RETURNS trigger AS $$
DECLARE
    v_variance_class variance_class;
    v_citation_count integer;
    v_observation_count integer;
    v_has_driver_note boolean;
BEGIN
    IF NEW.value_role <> 'editorial' OR NEW.status <> 'published' THEN
        RETURN NEW;
    END IF;

    -- Explicit curator/importer assertion bypasses the count-based rule --
    -- see this migration's header. Deliberately does NOT also require
    -- evidence to already exist at trigger time: the standard write order
    -- (see import_values.py's execute_plan) sets status on the
    -- property_value row first and inserts its evidence row immediately
    -- after, in the same transaction -- requiring evidence to already be
    -- present here would make that ordering fail on every first citation.
    -- The derivation_rule marker itself is the assertion being trusted.
    IF NEW.derivation_rule IN ('single_source', 'manual_override') THEN
        RETURN NEW;
    END IF;

    SELECT pd.variance_class INTO v_variance_class
    FROM property_definition pd WHERE pd.id = NEW.property_id;

    SELECT COUNT(DISTINCT ev.citation_id) INTO v_citation_count
    FROM evidence ev
    WHERE ev.subject_type = 'property_value'
      AND ev.subject_id IN (
          NEW.id,
          (SELECT id FROM property_value WHERE editorial_value_id = NEW.id AND value_role = 'observation')
      );

    SELECT COUNT(*) INTO v_observation_count
    FROM property_value WHERE editorial_value_id = NEW.id AND value_role = 'observation';

    v_has_driver_note := (NEW.note_fa IS NOT NULL AND btrim(NEW.note_fa) <> '')
                       OR (NEW.note_en IS NOT NULL AND btrim(NEW.note_en) <> '');

    IF v_variance_class = 'intrinsic' THEN
        IF v_citation_count < 3 THEN
            RAISE EXCEPTION
                'property_value % (property_id %, variance_class intrinsic) cannot publish with only % distinct citation(s) -- 3 required (or set derivation_rule to single_source/manual_override to publish deliberately on less)',
                NEW.id, NEW.property_id, v_citation_count;
        END IF;

    ELSIF v_variance_class = 'grade_dependent' THEN
        IF v_observation_count < 2 THEN
            RAISE EXCEPTION
                'property_value % (property_id %, variance_class grade_dependent) cannot publish with only % linked observation(s) -- 2 required (or set derivation_rule to single_source/manual_override to publish deliberately on less)',
                NEW.id, NEW.property_id, v_observation_count;
        END IF;
        IF NEW.test_method_id IS NULL THEN
            RAISE EXCEPTION
                'property_value % (variance_class grade_dependent) cannot publish without test_method_id -- a grade-dependent number is meaningless without saying how it was measured',
                NEW.id;
        END IF;
        IF NOT v_has_driver_note THEN
            RAISE EXCEPTION
                'property_value % (variance_class grade_dependent) cannot publish without note_fa/note_en naming what drives the variation (e.g. MFI range, comonomer content)',
                NEW.id;
        END IF;

    ELSIF v_variance_class = 'process_dependent' THEN
        IF NEW.subject_type = 'material' THEN
            RAISE EXCEPTION
                'property_value % (variance_class process_dependent) cannot publish on subject_type material -- must be scoped to grade_class, grade, or material_process',
                NEW.id;
        END IF;
        IF v_observation_count < 2 THEN
            RAISE EXCEPTION
                'property_value % (variance_class process_dependent) cannot publish with only % linked observation(s) -- 2 required (or set derivation_rule to single_source/manual_override to publish deliberately on less)',
                NEW.id, v_observation_count;
        END IF;
        IF NEW.test_method_id IS NULL THEN
            RAISE EXCEPTION
                'property_value % (variance_class process_dependent) cannot publish without test_method_id',
                NEW.id;
        END IF;
        IF NOT v_has_driver_note THEN
            RAISE EXCEPTION
                'property_value % (variance_class process_dependent) cannot publish without note_fa/note_en naming the process/condition',
                NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

INSERT INTO schema_migration (version) VALUES ('0023') ON CONFLICT DO NOTHING;

COMMIT;
