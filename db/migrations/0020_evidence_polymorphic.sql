-- 0020_evidence_polymorphic.sql
-- Polypedia: U1 v2 FR-5 -- evidence becomes polymorphic (closes DATA-GAPS N1).
--
-- Answers database-revision-questions.md Q5 (A, recommended). Before this,
-- evidence could only point at property_value or material_section_note
-- (0006, widened in 0012). Five tables -- chemical_resistance,
-- market_share_datum, material_organization, trade_name, material_process --
-- carry a value_status including 'unsourced' but had no mechanism that
-- could ever change it to sourced. market_share_datum's own table comment
-- claimed the opposite. This migration replaces the growing set of nullable
-- FK arms with subject_type/subject_id, mirroring the pattern
-- property_value_check_subject() already proved out (0005/0010/0011/0016):
-- one query answers "what does this source support?" for any citable table,
-- present or future.

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1: add the polymorphic columns, backfill from the old ones
-- ---------------------------------------------------------------------------

ALTER TABLE evidence
    ADD COLUMN subject_type text,
    ADD COLUMN subject_id bigint;

UPDATE evidence SET subject_type = 'property_value', subject_id = property_value_id
    WHERE property_value_id IS NOT NULL;
UPDATE evidence SET subject_type = 'material_section_note', subject_id = material_section_note_id
    WHERE material_section_note_id IS NOT NULL;

ALTER TABLE evidence
    ALTER COLUMN subject_type SET NOT NULL,
    ALTER COLUMN subject_id SET NOT NULL,
    ADD CONSTRAINT evidence_subject_type_chk CHECK (
        subject_type IN (
            'property_value', 'material_section_note', 'chemical_resistance',
            'market_share_datum', 'material_organization', 'trade_name',
            'material_process'
        )
    );

COMMENT ON COLUMN evidence.subject_type IS
    'Polymorphic discriminator, one of the seven citable tables. Deliberately equal to the target table''s literal name (not a separate enum) so the cleanup triggers below can use TG_TABLE_NAME directly instead of a lookup.';
COMMENT ON COLUMN evidence.subject_id IS
    'Polymorphic reference: the id of a row in the table named by subject_type. Cannot be a plain FOREIGN KEY (it targets seven different tables). Integrity is enforced by trg_evidence_check_subject (BEFORE INSERT/UPDATE) below; ON DELETE CASCADE is reproduced by seven AFTER DELETE cleanup triggers, one per subject table, since a plain FK''s cascade is unavailable to a polymorphic reference.';

-- ---------------------------------------------------------------------------
-- Step 2: drop the old nullable-FK-arm shape
-- ---------------------------------------------------------------------------

ALTER TABLE evidence DROP CONSTRAINT evidence_one_subject_chk;

DROP INDEX idx_evidence_property_value_id;
DROP INDEX idx_evidence_material_section_note_id;
DROP INDEX uq_evidence_section_note_citation_role;

-- v_citation_coverage joins on evidence.property_value_id; it is dropped
-- here (not CASCADE, per the 0013 precedent of never using an unqualified
-- CASCADE on a DROP COLUMN) and recreated in step 6 on the new shape.
DROP VIEW v_citation_coverage;

ALTER TABLE evidence
    DROP COLUMN property_value_id,
    DROP COLUMN material_section_note_id;

-- ---------------------------------------------------------------------------
-- Step 3: uniqueness and lookup index on the new shape
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX uq_evidence_subject_citation_role
    ON evidence (subject_type, subject_id, citation_id, role);

COMMENT ON INDEX uq_evidence_subject_citation_role IS
    'Replaces the old UNIQUE(property_value_id, citation_id, role) plus the section-note partial index -- one rule for all seven subject types: a citation cannot support the same thing twice in the same role.';

CREATE INDEX idx_evidence_subject ON evidence (subject_type, subject_id);

-- ---------------------------------------------------------------------------
-- Step 4: integrity trigger (existence check), mirroring
-- property_value_check_subject()
-- ---------------------------------------------------------------------------

CREATE FUNCTION evidence_check_subject() RETURNS trigger AS $$
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
    ELSE
        RAISE EXCEPTION 'evidence.subject_type % is not handled by the integrity trigger', NEW.subject_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION evidence_check_subject() IS
    'Enforces evidence.subject_type/subject_id integrity that a plain FOREIGN KEY cannot express, across all seven citable tables (U1 v2 FR-5).';

CREATE TRIGGER trg_evidence_check_subject
    BEFORE INSERT OR UPDATE OF subject_type, subject_id ON evidence
    FOR EACH ROW
    EXECUTE FUNCTION evidence_check_subject();

-- ---------------------------------------------------------------------------
-- Step 5: cascade-delete cleanup, one trigger per subject table
-- ---------------------------------------------------------------------------
--
-- A plain FK's ON DELETE CASCADE is unavailable to a polymorphic reference,
-- so it is reproduced explicitly: deleting a citable row deletes the
-- evidence rows that pointed at it. One shared function, keyed off
-- TG_TABLE_NAME, which is exactly the subject_type string by construction
-- (see evidence.subject_type comment).

CREATE FUNCTION evidence_cleanup_on_subject_delete() RETURNS trigger AS $$
BEGIN
    DELETE FROM evidence WHERE subject_type = TG_TABLE_NAME AND subject_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION evidence_cleanup_on_subject_delete() IS
    'Reproduces ON DELETE CASCADE for evidence rows pointing at a polymorphic subject, since a plain FK cascade is unavailable across seven target tables. Relies on subject_type always equalling the deleted row''s table name (TG_TABLE_NAME).';

CREATE TRIGGER trg_evidence_cleanup_property_value
    AFTER DELETE ON property_value
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

CREATE TRIGGER trg_evidence_cleanup_material_section_note
    AFTER DELETE ON material_section_note
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

CREATE TRIGGER trg_evidence_cleanup_chemical_resistance
    AFTER DELETE ON chemical_resistance
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

CREATE TRIGGER trg_evidence_cleanup_market_share_datum
    AFTER DELETE ON market_share_datum
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

CREATE TRIGGER trg_evidence_cleanup_material_organization
    AFTER DELETE ON material_organization
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

CREATE TRIGGER trg_evidence_cleanup_trade_name
    AFTER DELETE ON trade_name
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

CREATE TRIGGER trg_evidence_cleanup_material_process
    AFTER DELETE ON material_process
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

-- ---------------------------------------------------------------------------
-- Step 6: fix the dependent view (was joining on the now-dropped column)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_citation_coverage AS
SELECT
    m.id      AS material_id,
    m.slug    AS material_slug,
    m.name_en AS material_name_en,
    m.name_fa AS material_name_fa,
    COUNT(DISTINCT pv.id)                                   AS total_values,
    COUNT(DISTINCT pv.id) FILTER (WHERE ev.id IS NOT NULL)  AS cited_values,
    ROUND(
        CASE WHEN COUNT(DISTINCT pv.id) = 0 THEN 0
             ELSE COUNT(DISTINCT pv.id) FILTER (WHERE ev.id IS NOT NULL)::numeric
                  / COUNT(DISTINCT pv.id) * 100
        END, 2
    ) AS coverage_pct
FROM material m
LEFT JOIN property_value pv
    ON pv.subject_type = 'material' AND pv.subject_id = m.id
    AND pv.superseded_by IS NULL AND pv.status <> 'superseded'
LEFT JOIN evidence ev ON ev.subject_type = 'property_value' AND ev.subject_id = pv.id
GROUP BY m.id, m.slug, m.name_en, m.name_fa;

COMMENT ON VIEW v_citation_coverage IS
    'Per material: total live values, cited values (have >=1 evidence row), and coverage percentage. Updated in 0020 for evidence''s polymorphic subject_type/subject_id shape.';

-- ---------------------------------------------------------------------------
-- Step 7: now that evidence can cite them, drop the value_status column no
-- longer needed by material_process/etc? -- NO. status stays: it still
-- distinguishes unsourced/draft/published/superseded once evidence exists.
-- This step intentionally does nothing; recorded so a future reader does not
-- wonder whether the five tables' status column was supposed to be removed.
-- ---------------------------------------------------------------------------

INSERT INTO schema_migration (version) VALUES ('0020') ON CONFLICT DO NOTHING;

COMMIT;
