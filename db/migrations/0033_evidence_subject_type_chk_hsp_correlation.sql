-- 0033_evidence_subject_type_chk_hsp_correlation.sql
-- Polypedia: adds 'hsp_correlation' to evidence.subject_type's CHECK constraint.
--
-- WHY THIS IS NEEDED DESPITE 0031/0032 ALREADY TOUCHING "subject_type"
--
-- Same two-different-things trap 0028 documented for 'solvent', repeated
-- here verbatim because it is the same mistake waiting to happen again:
--
--   1. The `subject_type` ENUM (0001), used by property_value.subject_type.
--      0031 added 'hsp_correlation' to THIS enum.
--   2. evidence.subject_type, a plain `text` column (0020) constrained by
--      its own literal CHECK (evidence_subject_type_chk) -- NOT the enum
--      above. Adding a value to the ENUM never touches this constraint.
--
-- 0032 correctly taught evidence_check_subject() about 'hsp_correlation' and
-- added its cleanup trigger, but without this migration every attempt to
-- insert evidence with subject_type='hsp_correlation' would still be
-- rejected before the trigger even runs:
--
--   psycopg.errors.CheckViolation: new row for relation "evidence"
--   violates check constraint "evidence_subject_type_chk"
--
-- Fixing the constraint up front this time, rather than discovering it row
-- 1 of ~466 into tools/curation/import_hsp_correlations.py the way 0028 was
-- discovered.

BEGIN;

ALTER TABLE evidence DROP CONSTRAINT evidence_subject_type_chk;

ALTER TABLE evidence
    ADD CONSTRAINT evidence_subject_type_chk CHECK (
        subject_type IN (
            'property_value', 'material_section_note', 'chemical_resistance',
            'market_share_datum', 'material_organization', 'trade_name',
            'material_process', 'solvent', 'hsp_correlation'
        )
    );

INSERT INTO schema_migration (version) VALUES ('0033') ON CONFLICT DO NOTHING;

COMMIT;
