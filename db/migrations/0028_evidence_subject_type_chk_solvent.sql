-- 0028_evidence_subject_type_chk_solvent.sql
-- Polypedia: adds 'solvent' to evidence.subject_type's CHECK constraint.
--
-- WHY THIS IS NEEDED DESPITE 0026/0027 ALREADY TOUCHING "subject_type"
--
-- There are two independent things named subject_type in this schema:
--
--   1. The `subject_type` ENUM (0001), used by property_value.subject_type.
--      0026 added 'solvent' to THIS enum.
--   2. evidence.subject_type, a plain `text` column (0020) constrained by
--      its own literal CHECK (evidence_subject_type_chk) -- NOT the enum
--      above. 0020 picked text-with-a-CHECK deliberately (see that
--      migration's comment on evidence_cleanup triggers using
--      TG_TABLE_NAME), so adding a value to the ENUM never touches this
--      constraint.
--
-- 0027 correctly taught evidence_check_subject() (the trigger enforcing
-- referential integrity for evidence.subject_id) about 'solvent', and
-- correctly added a cleanup trigger on solvent deletes. But the CHECK
-- constraint gating which subject_type strings are even accepted was never
-- touched, so every attempt to insert evidence with subject_type='solvent'
-- was rejected before the trigger even ran:
--
--   psycopg.errors.CheckViolation: new row for relation "evidence"
--   violates check constraint "evidence_subject_type_chk"
--
-- Found while importing the ~1180-row Hansen Solubility Parameter dataset
-- (tools/curation/import_solvents.py), where every single row failed at
-- the evidence insert. Fixing the constraint, not routing around it.
--
-- SECOND, RELATED REGRESSION IN THE SAME 0027 STATEMENT
--
-- 0027's `CREATE OR REPLACE FUNCTION evidence_check_subject()` replaced the
-- whole function body instead of adding an ELSIF branch to the existing
-- one. The version 0020 shipped handled seven subject types
-- (property_value, material_section_note, chemical_resistance,
-- market_share_datum, material_organization, trade_name, material_process);
-- 0027's replacement kept only property_value and material_process, added
-- 'solvent', and -- apparently by confusing this function with the
-- unrelated `subject_type` ENUM used by property_value.subject_type (see
-- comment above) -- added dead branches for 'material'/'grade'/
-- 'grade_class', which evidence_subject_type_chk has never allowed and
-- never will (grade-level facts are cited via their property_value row,
-- not directly). Net effect: citing a chemical_resistance, market_share_
-- datum, material_organization, or trade_name row started raising
-- "evidence.subject_type X is not handled by the integrity trigger" on
-- every insert, silently, since nothing in the normal curation workflow
-- exercises those paths. Caught by db/test.sh's EVIDENCE POLYMORPHISM
-- section, not by anything solvent-specific -- restoring the function
-- fixes those four subject types too, not just this task's.

BEGIN;

ALTER TABLE evidence DROP CONSTRAINT evidence_subject_type_chk;

ALTER TABLE evidence
    ADD CONSTRAINT evidence_subject_type_chk CHECK (
        subject_type IN (
            'property_value', 'material_section_note', 'chemical_resistance',
            'market_share_datum', 'material_organization', 'trade_name',
            'material_process', 'solvent'
        )
    );

CREATE OR REPLACE FUNCTION evidence_check_subject() RETURNS trigger AS $$
BEGIN
    IF NEW.subject_type = 'property_value' THEN
        IF NOT EXISTS (SELECT 1 FROM property_value WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing property_value row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'material_section_note' THEN
        IF NOT EXISTS (SELECT 1 FROM material_section_note WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing material_section_note row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'chemical_resistance' THEN
        IF NOT EXISTS (SELECT 1 FROM chemical_resistance WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing chemical_resistance row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'market_share_datum' THEN
        IF NOT EXISTS (SELECT 1 FROM market_share_datum WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing market_share_datum row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'material_organization' THEN
        IF NOT EXISTS (SELECT 1 FROM material_organization WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing material_organization row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'trade_name' THEN
        IF NOT EXISTS (SELECT 1 FROM trade_name WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing trade_name row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'material_process' THEN
        IF NOT EXISTS (SELECT 1 FROM material_process WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing material_process row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'solvent' THEN
        IF NOT EXISTS (SELECT 1 FROM solvent WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing solvent row', NEW.subject_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'evidence.subject_type % is not handled by the integrity trigger', NEW.subject_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION evidence_check_subject() IS
    'Enforces evidence.subject_type/subject_id integrity that a plain FOREIGN KEY cannot express, across all eight citable tables (U1 v2 FR-5, extended for solvent in 0027/0028).';

INSERT INTO schema_migration (version) VALUES ('0028') ON CONFLICT DO NOTHING;

COMMIT;
