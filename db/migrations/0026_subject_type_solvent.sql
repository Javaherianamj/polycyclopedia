-- 0026_subject_type_solvent.sql
-- Polypedia: adds 'solvent' to the subject_type enum (FE-8 step 4).
--
-- Split from 0027 (which creates the `solvent` table and teaches the evidence
-- trigger about it) for the same reason 0015 was split from 0016: PostgreSQL
-- will not let a value added to an enum by ALTER TYPE be USED in the same
-- transaction that added it. Two migrations, in order, is the established
-- pattern in this directory -- do not merge them.
--
-- Why solvents become an evidence subject at all: the site's whole contract
-- is that a number a reader sees can be traced to a page in a real source.
-- ~700 Hansen parameters are about to be imported from a published handbook,
-- and they must carry citations exactly like a material's tensile strength
-- does. An uncitable table of 700 numbers would be the single largest block
-- of unsourced data on the site.

BEGIN;

ALTER TYPE subject_type ADD VALUE IF NOT EXISTS 'solvent';

INSERT INTO schema_migration (version) VALUES ('0026') ON CONFLICT DO NOTHING;

COMMIT;
