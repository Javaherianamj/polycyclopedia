-- 0010_subject_type_material_process.sql
-- Polypedia: adds 'material_process' to the subject_type enum (DATA-GAPS G5).
--
-- Why this is a migration of its own, holding a single statement:
-- PostgreSQL will not let a new enum value be *used* in the same transaction
-- that adds it. 0011 creates material_process and rewrites the property_value
-- integrity trigger to recognise the new subject, both of which reference the
-- label -- so the label has to be committed first. Splitting the files is the
-- only way to get that ordering out of run.sh, which runs each file in its own
-- psql invocation.
--
-- Owner decision (2026-08-05): processing data is not a flat set of properties
-- on the material. A material is *processed* several different ways (blown
-- film, extrusion coating, injection moulding), each with its own melt window,
-- mould temperature and pressures, and the same is true of a grade. Processing
-- is therefore the fork: material -> many processes, grade -> many processes,
-- and each process is a subject that owns property values in its own right,
-- with the full citation/evidence chain behind it.

BEGIN;

ALTER TYPE subject_type ADD VALUE IF NOT EXISTS 'material_process';

INSERT INTO schema_migration (version) VALUES ('0010') ON CONFLICT DO NOTHING;

COMMIT;
