-- 0031_subject_type_hsp_correlation.sql
-- Polypedia: adds 'hsp_correlation' to the evidence subject_type enum.
--
-- Split from 0032 (which creates the `hsp_correlation` table and teaches the
-- evidence trigger about it) for the exact reason 0026 was split from 0027:
-- PostgreSQL will not let a value added to an enum by ALTER TYPE be USED in
-- the same transaction that added it. Two migrations, in order.
--
-- Why hsp_correlation becomes an evidence subject at all: Appendix A Table
-- A.2 of the same Hansen handbook already cited for `solvent` (0026/0027)
-- publishes ~466 polymer/product Hansen-parameter correlations, each a
-- citable published sphere fit. Same contract as solvents: a number a
-- reader sees must trace to a page in a real source.

BEGIN;

ALTER TYPE subject_type ADD VALUE IF NOT EXISTS 'hsp_correlation';

INSERT INTO schema_migration (version) VALUES ('0031') ON CONFLICT DO NOTHING;

COMMIT;
