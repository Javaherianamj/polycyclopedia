-- 0016_grade_class.sql
-- Polypedia: U1 v2 FR-1 -- the grade-class rung.
--
-- Answers database-revision-questions.md Q1 (A, recommended): a material is
-- sold as several distinct resin populations for different end uses
-- (LDPE for film vs. LDPE for injection moulding), each with its own
-- density/MFI/tensile band. That population is neither the generic material
-- (too coarse -- flattens ten sources describing different populations into
-- one contradictory range) nor a specific commercial grade (too fine -- most
-- curation never reaches a named product) nor material_process (a machine
-- setting, not a resin property). grade_class sits between material and
-- grade for exactly this.

BEGIN;

CREATE TABLE grade_class (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id      bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    key              text NOT NULL,
    name_fa          text NOT NULL,
    name_en          text NOT NULL,
    description_fa   text,
    description_en   text,
    sort_order       int NOT NULL DEFAULT 0,
    status           material_status NOT NULL DEFAULT 'draft',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (material_id, key)
);

COMMENT ON TABLE grade_class IS
    'A named population of a material sold for a purpose (e.g. ldpe/film, ldpe/injection, hdpe/blow_molding), distinct from a specific commercial grade. Exists because "injection LDPE" and "film LDPE" have different density/MFI/tensile bands and were previously unrepresentable except by forcing every source into the generic material row (U1 v2 FR-1, database-revision-questions.md Q1). Property values attach via property_value.subject_type = ''grade_class''.';
COMMENT ON COLUMN grade_class.key IS
    'Slug, unique per material, e.g. ''film'', ''injection'', ''blow_molding'', ''rotational_molding'', ''extrusion_coating''.';

CREATE INDEX idx_grade_class_material_id ON grade_class (material_id);

-- material_process may also belong to a grade_class (a resin population can
-- itself be processed several ways), so it gains a third, still-optional arm.
ALTER TABLE material_process
    ADD COLUMN grade_class_id bigint REFERENCES grade_class (id) ON DELETE CASCADE,
    DROP CONSTRAINT material_process_one_subject_chk,
    ADD CONSTRAINT material_process_one_subject_chk CHECK (
        num_nonnulls(material_id, grade_id, grade_class_id) = 1
    );

COMMENT ON CONSTRAINT material_process_one_subject_chk ON material_process IS
    'Exactly one of material_id / grade_id / grade_class_id. A process belongs to a generic material, a specific commercial grade, or a named resin population -- never to more than one, never to none. grade_class_id added in 0016 (U1 v2 FR-1).';

CREATE UNIQUE INDEX uq_material_process_grade_class
    ON material_process (grade_class_id, processing_technique_id)
    WHERE grade_class_id IS NOT NULL;

CREATE INDEX idx_material_process_grade_class_id ON material_process (grade_class_id);

-- ---------------------------------------------------------------------------
-- Teach the property_value integrity trigger about the new subject
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION property_value_check_subject() RETURNS trigger AS $$
BEGIN
    IF NEW.subject_type = 'material' THEN
        IF NOT EXISTS (SELECT 1 FROM material WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing material row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'grade' THEN
        IF NOT EXISTS (SELECT 1 FROM grade WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing grade row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'material_process' THEN
        IF NOT EXISTS (SELECT 1 FROM material_process WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing material_process row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'grade_class' THEN
        IF NOT EXISTS (SELECT 1 FROM grade_class WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing grade_class row', NEW.subject_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'property_value.subject_type % is not handled by the integrity trigger', NEW.subject_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

INSERT INTO schema_migration (version) VALUES ('0016') ON CONFLICT DO NOTHING;

COMMIT;
