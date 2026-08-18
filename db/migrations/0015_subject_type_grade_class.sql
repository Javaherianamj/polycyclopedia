-- 0015_subject_type_grade_class.sql
-- Polypedia: adds 'grade_class' to the subject_type enum (U1 v2 FR-1).
--
-- Same reason this is its own file as 0010: PostgreSQL will not let a new
-- enum value be *used* in the same transaction that adds it, and 0016
-- creates grade_class and rewrites the property_value integrity trigger to
-- recognise it -- both reference the label. The label has to be committed
-- first.
--
-- Owner decision (2026-08-05, database-revision-questions.md Q1): a resin
-- class sold for a purpose ("injection LDPE", "film LDPE") is not the same
-- thing as a processing route (material_process: melt temperature, mould
-- temperature) and not the same thing as a specific commercial product
-- (grade: "Lupolen 2420H"). It is a population of the material with its own
-- density/MFI/tensile band, and it needs its own rung.

BEGIN;

ALTER TYPE subject_type ADD VALUE IF NOT EXISTS 'grade_class';

INSERT INTO schema_migration (version) VALUES ('0015') ON CONFLICT DO NOTHING;

COMMIT;
