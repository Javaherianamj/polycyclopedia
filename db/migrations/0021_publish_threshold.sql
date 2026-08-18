-- 0021_publish_threshold.sql
-- Polypedia: U1 v2 FR-9 -- the publishing threshold, enforced.
--
-- Answers database-revision-questions.md Q9 (A, recommended). Depends on
-- value_role/editorial_value_id (0017), variance_class (0018), and evidence
-- polymorphism (0020) -- this is why it is its own, later migration rather
-- than folded into any of those three.
--
-- Rule, per the property's variance_class:
--   intrinsic          -- editorial row needs >=3 distinct citations
--                         (via itself or its linked observations).
--   grade_dependent     -- editorial row needs >=2 linked observations,
--                         a test_method_id, and a note (fa or en) naming
--                         the driver (what makes this value vary).
--   process_dependent   -- same as grade_dependent, and the subject must
--                         NOT be a bare material (it must be a grade_class,
--                         grade, or material_process -- a process-dependent
--                         number is meaningless without saying which
--                         process/grade it was measured on).
--
-- Only fires on editorial rows transitioning TO 'published'. Observation
-- rows, and any other status transition, are unaffected.

BEGIN;

CREATE FUNCTION property_value_check_publish_threshold() RETURNS trigger AS $$
DECLARE
    v_variance_class variance_class;
    v_citation_count integer;
    v_observation_count integer;
    v_has_driver_note boolean;
BEGIN
    IF NEW.value_role <> 'editorial' OR NEW.status <> 'published' THEN
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
                'property_value % (property_id %, variance_class intrinsic) cannot publish with only % distinct citation(s) -- 3 required',
                NEW.id, NEW.property_id, v_citation_count;
        END IF;

    ELSIF v_variance_class = 'grade_dependent' THEN
        IF v_observation_count < 2 THEN
            RAISE EXCEPTION
                'property_value % (property_id %, variance_class grade_dependent) cannot publish with only % linked observation(s) -- 2 required',
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
                'property_value % (variance_class process_dependent) cannot publish with only % linked observation(s) -- 2 required',
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

COMMENT ON FUNCTION property_value_check_publish_threshold() IS
    'Blocks status -> published on an editorial property_value row until its variance_class-appropriate sourcing threshold is met (U1 v2 FR-9). See migration header for the exact rule per class.';

-- UPDATE OF status only, not INSERT: an editorial row's linked observations
-- (editorial_value_id = this row's id) cannot exist before this row's id
-- does, so a same-statement "insert already published" can never legitimately
-- pass this check. The real workflow is insert as draft/unsourced, link
-- observations, then UPDATE status -> published -- which this trigger does
-- cover.
CREATE TRIGGER trg_property_value_check_publish_threshold
    BEFORE UPDATE OF status ON property_value
    FOR EACH ROW
    EXECUTE FUNCTION property_value_check_publish_threshold();

INSERT INTO schema_migration (version) VALUES ('0021') ON CONFLICT DO NOTHING;

COMMIT;
