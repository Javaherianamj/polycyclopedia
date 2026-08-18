-- 0032_hsp_correlation.sql
-- Polypedia: the `hsp_correlation` table (Appendix A Table A.2 import).
--
-- Requires 0031, which added 'hsp_correlation' to the subject_type enum in
-- its own transaction. See that file for why the split is mandatory.
--
-- WHY A TABLE RATHER THAN MORE property_value ROWS (mirrors 0027 verbatim)
--
-- Table A.2 rows are 1980s-90s trade names (EXON 470 PVC, VINYLITE VYHH,
-- SARAN F-120, STYRON 475M-27) each carrying a published Hansen sphere fit
-- (centre dD/dP/dH plus an interaction radius r0) -- not a catalog material
-- in this schema's sense: no family, no grades, no processing routes, no
-- producers. And the four Hansen parameters are not one property among many
-- for a correlation -- they ARE the record, exactly as for `solvent`
-- (0027). Modelling ~466 of these as materials would put 466 near-empty
-- rows into the catalog, search index and compare picker (the R7 failure
-- 0027 already called out). So: columns, not property_values.
--
-- WHY A NULLABLE material_id, UNLIKE solvent
--
-- Unlike Table A.1's solvents, some Table A.2 rows genuinely correspond to
-- an existing catalog material -- e.g. a generic "PVC" or "PS" row is the
-- same substance as material.key = 'pvc' / 'ps'. `material_id` links a
-- correlation to that catalog material where a reviewed match exists (see
-- tools/curation/import_hsp_correlations.py's CATALOG_LINKS mapping -- an
-- explicit hand-reviewed dict, never fuzzy string matching, because a wrong
-- link would put a wrong solubility sphere on a real datasheet). Nullable
-- because most rows (trade-name-only products like "CELLIT BP-300") have no
-- catalog counterpart at all, and that is the normal case, not a gap to fix.
--
-- Where a correlation disagrees with an existing unsourced hansen_d/p/h
-- property_value (LDPE and HDPE both carry unsourced 16.0/0/0 and
-- 16.5/0/0), this migration does not touch or delete those rows -- the
-- import script prefers the sourced correlation for display and leaves the
-- unsourced property_value rows for editorial review, per the task's
-- explicit instruction not to silently overwrite.

BEGIN;

CREATE TABLE hsp_correlation (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key              text NOT NULL UNIQUE,
    -- Table A.2's own "Number" column (1-466 in this edition). Traceability
    -- only, never used as the DB key -- mirrors solvent.book_no's rationale
    -- (0027): the printed number is not guaranteed stable across editions.
    handbook_number  integer,
    -- Verbatim from the printed "Polymer" column, including any fused
    -- footnote letter or Hansen confidence marker ('?'/'??') -- never
    -- cleaned up, so the citation always matches what a reader can look up
    -- on the printed page. See `uncertainty` below for the parsed-out flag.
    name_raw         text NOT NULL,
    name_en          text,
    name_fa          text,
    -- The printed table groups rows under un-numbered section headings
    -- ("Cellulose Acetobutyrate", "Miscellaneous - Solvent Range", ...);
    -- carried through from the nearest preceding heading, never treated as
    -- a data field of the row itself.
    section          text,
    -- Nullable catalog link -- see header comment above.
    material_id      bigint REFERENCES material (id),
    -- Hansen solubility parameters of the correlation's centre, MPa^0.5.
    hansen_d         double precision NOT NULL,
    hansen_p         double precision NOT NULL,
    hansen_h         double precision NOT NULL,
    -- Interaction radius Ro, MPa^0.5 -- together with the three parameters
    -- above, defines the published solubility sphere for this correlation.
    r0               double precision NOT NULL,
    -- Hansen's own confidence flag on this correlation ('?' = questionable,
    -- '??' = more questionable), printed fused into the name column. Kept
    -- as its own field so a reader/consumer can filter on confidence
    -- without re-parsing name_raw.
    uncertainty      text,
    status           material_status NOT NULL DEFAULT 'draft',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT hsp_correlation_hansen_nonneg_chk
        CHECK (hansen_d >= 0 AND hansen_p >= 0 AND hansen_h >= 0),
    -- Sanity bound, mirrors solvent_hansen_plausible_chk (0027) exactly:
    -- real HSP sit well inside 0-60, so a value outside it means a parser
    -- error over the 466 auto-extracted rows, not a genuine outlier.
    CONSTRAINT hsp_correlation_hansen_plausible_chk
        CHECK (hansen_d <= 60 AND hansen_p <= 60 AND hansen_h <= 60),
    -- r0 must be strictly positive (a zero-or-negative radius is not a
    -- sphere) and shares the same upper plausibility bound.
    CONSTRAINT hsp_correlation_r0_chk
        CHECK (r0 > 0 AND r0 <= 60)
);

COMMENT ON TABLE hsp_correlation IS
    'Published Hansen solubility sphere correlations for named polymer products (Appendix A Table A.2 of the Hansen handbook) -- centre (hansen_d/p/h) and radius (r0), MPa^0.5. Populated from the same handbook already backing `solvent`; every row is expected to carry evidence via evidence.subject_type = ''hsp_correlation''. material_id links a correlation to an existing catalog material only where a hand-reviewed match exists -- most rows are trade-name-only and have no catalog counterpart.';
COMMENT ON COLUMN hsp_correlation.material_id IS
    'Nullable FK to the catalog material this correlation corresponds to, if any. Set only via an explicit hand-reviewed mapping (tools/curation/import_hsp_correlations.py CATALOG_LINKS) -- never by fuzzy name matching, since a wrong link would attach a wrong solubility sphere to a real datasheet.';
COMMENT ON COLUMN hsp_correlation.uncertainty IS
    'Hansen''s own confidence flag on this row (''?'' or ''??''), parsed out of the printed name but not removed from name_raw.';
COMMENT ON CONSTRAINT hsp_correlation_hansen_plausible_chk ON hsp_correlation IS
    'Guards against extraction errors, not against unusual chemistry: real HSP components sit far below 60 MPa^0.5, so a value above it means the parser picked up the wrong column.';

CREATE INDEX idx_hsp_correlation_material_id ON hsp_correlation (material_id);
CREATE INDEX idx_hsp_correlation_hansen ON hsp_correlation (hansen_d, hansen_p, hansen_h);
CREATE INDEX idx_hsp_correlation_status ON hsp_correlation (status);

CREATE TRIGGER trg_hsp_correlation_set_updated_at
    BEFORE UPDATE ON hsp_correlation
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Teach the evidence integrity trigger about the new subject (0020 made
-- evidence polymorphic; every subject_type must be handled explicitly or the
-- trigger raises). Adds an ELSIF branch to the full function 0028 restored --
-- does NOT replace it with a partial version. 0028's header explains at
-- length why a CREATE OR REPLACE that drops existing branches is a real
-- regression, not a style nit; that mistake is not repeated here.
-- ---------------------------------------------------------------------------
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
    ELSIF NEW.subject_type = 'hsp_correlation' THEN
        IF NOT EXISTS (SELECT 1 FROM hsp_correlation WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'evidence.subject_id % does not reference an existing hsp_correlation row', NEW.subject_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'evidence.subject_type % is not handled by the integrity trigger', NEW.subject_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION evidence_check_subject() IS
    'Enforces evidence.subject_type/subject_id integrity that a plain FOREIGN KEY cannot express, across all nine citable tables (U1 v2 FR-5, extended for solvent in 0027/0028 and hsp_correlation in 0032/0033).';

-- Cascade cleanup, matching the pattern for every other evidence subject:
-- deleting a correlation must not orphan its evidence rows.
CREATE TRIGGER trg_evidence_cleanup_hsp_correlation
    AFTER DELETE ON hsp_correlation
    FOR EACH ROW EXECUTE FUNCTION evidence_cleanup_on_subject_delete();

INSERT INTO schema_migration (version) VALUES ('0032') ON CONFLICT DO NOTHING;

COMMIT;
