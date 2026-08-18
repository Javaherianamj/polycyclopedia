-- 0027_solvent.sql
-- Polypedia: the `solvent` table (FE-8 step 4).
--
-- Requires 0026, which added 'solvent' to the subject_type enum in its own
-- transaction. See that file for why the split is mandatory.
--
-- WHY A TABLE RATHER THAN MORE property_value ROWS
--
-- A solvent is not a material in this schema's sense. `material` carries a
-- family, processing routes, grade classes, market share, manufacturers --
-- none of which apply to acetone. And Hansen parameters are not one property
-- among many for a solvent; they ARE the record. Modelling ~700 solvents as
-- materials would put 700 rows with empty everything into the catalog, the
-- search index and the compare picker, which is exactly the "renders an
-- empty shell" failure R7 exists to prevent.
--
-- The three Hansen parameters are therefore columns, not property_values:
-- they are always present together, always in the same units, and a solvent
-- without them is not a useful row. `property_value` remains the right home
-- for anything measured ABOUT a solvent later (boiling point, flash point,
-- toxicity class) -- subject_type='solvent' now exists for precisely that,
-- and that is the growth path when this page is deepened.

BEGIN;

CREATE TABLE solvent (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key             text NOT NULL UNIQUE,
    name_en         text NOT NULL,
    name_fa         text,
    -- The handbook's second column: the systematic Autonom/ACD name, which
    -- often differs from the common name in column one (e.g. "Acetaldehyde
    -- oxime" for "Acetaldoxime"). Kept because it is the reliable key for
    -- cross-referencing other sources later.
    systematic_name text,
    cas_number      text,
    -- Hansen solubility parameters, MPa^0.5. NOT NULL: a solvent row without
    -- them has nothing to say.
    hansen_d        double precision NOT NULL,
    hansen_p        double precision NOT NULL,
    hansen_h        double precision NOT NULL,
    -- cm3/mol. Nullable -- the handbook omits it for a few entries.
    molar_volume    double precision,
    status          material_status NOT NULL DEFAULT 'draft',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT solvent_hansen_nonneg_chk
        CHECK (hansen_d >= 0 AND hansen_p >= 0 AND hansen_h >= 0),
    -- Sanity bound. Real HSP sit well inside 0-60; anything outside is a
    -- parse error, and a parse error over 700 auto-extracted rows is far more
    -- likely than a genuine outlier. Better to reject the row than to plot it.
    CONSTRAINT solvent_hansen_plausible_chk
        CHECK (hansen_d <= 60 AND hansen_p <= 60 AND hansen_h <= 60),
    CONSTRAINT solvent_molar_volume_chk
        CHECK (molar_volume IS NULL OR (molar_volume > 0 AND molar_volume < 2000))
);

COMMENT ON TABLE solvent IS
    'Solvents with Hansen solubility parameters (dD/dP/dH, MPa^0.5) and molar volume. Populated from a published handbook table; every row is expected to carry evidence via evidence.subject_type = ''solvent''. Distinct from `material`: solvents have no family, grades, processing routes or producers, and their HSP are the record rather than one property among many.';
COMMENT ON COLUMN solvent.systematic_name IS
    'Systematic (Autonom/ACD) name from the source table, which frequently differs from the common name and is the safer cross-reference key.';
COMMENT ON CONSTRAINT solvent_hansen_plausible_chk ON solvent IS
    'Guards against extraction errors, not against unusual chemistry: real HSP components sit far below 60 MPa^0.5, so a value above it means the parser picked up the wrong column.';

CREATE INDEX idx_solvent_hansen ON solvent (hansen_d, hansen_p, hansen_h);
CREATE INDEX idx_solvent_status ON solvent (status);

CREATE TRIGGER trg_solvent_set_updated_at
    BEFORE UPDATE ON solvent
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Teach the evidence integrity trigger about the new subject (0020 made
-- evidence polymorphic; every subject_type must be handled explicitly or the
-- trigger raises).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION evidence_check_subject() RETURNS trigger AS $$
BEGIN
    IF NEW.subject_type = 'property_value' THEN
        IF NOT EXISTS (SELECT 1 FROM property_value WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing property_value row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'material' THEN
        IF NOT EXISTS (SELECT 1 FROM material WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing material row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'grade' THEN
        IF NOT EXISTS (SELECT 1 FROM grade WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing grade row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'grade_class' THEN
        IF NOT EXISTS (SELECT 1 FROM grade_class WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing grade_class row', NEW.subject_id;
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

-- Cascade cleanup, matching the seven triggers 0020 installed for the other
-- evidence subjects: deleting a solvent must not orphan its evidence rows.
CREATE TRIGGER trg_evidence_cleanup_solvent
    AFTER DELETE ON solvent
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

INSERT INTO schema_migration (version) VALUES ('0027') ON CONFLICT DO NOTHING;

COMMIT;
