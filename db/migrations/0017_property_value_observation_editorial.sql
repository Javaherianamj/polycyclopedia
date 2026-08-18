-- 0017_property_value_observation_editorial.sql
-- Polypedia: U1 v2 FR-2, FR-3, FR-10 -- multi-source values.
--
-- Answers database-revision-questions.md Q2/Q3 (A, recommended). The old
-- uq_property_value_live allowed exactly one live value per (subject,
-- property, conditions) -- so ten disagreeing-but-overlapping density
-- sources could never coexist as rows, and reconciliation happened off the
-- record before anything reached the database. Two roles on the same table
-- fix this: every source becomes its own `observation` row with its own
-- evidence (no uniqueness constraint between them); one `editorial` row per
-- (subject, property, conditions) is what the site renders, linked from its
-- supporting observations and citing all of them.
--
-- Kept on one table (not a separate property_observation table) so the
-- unit/qualifier/conditions/test-method column set is not duplicated
-- (Q2 option C was rejected for this reason).

BEGIN;

CREATE TYPE value_role AS ENUM ('observation', 'editorial');

COMMENT ON TYPE value_role IS
    'observation = one source''s reported number, cited on its own. editorial = the single published value for (subject, property, conditions), derived from its linked observations. Added in 0017 (U1 v2 FR-2).';

ALTER TABLE property_value
    ADD COLUMN value_role value_role NOT NULL DEFAULT 'editorial',
    ADD COLUMN editorial_value_id bigint REFERENCES property_value (id),
    ADD COLUMN derivation_rule text,
    ADD CONSTRAINT property_value_editorial_no_parent_chk CHECK (
        value_role = 'observation' OR editorial_value_id IS NULL
    ),
    ADD CONSTRAINT property_value_derivation_rule_editorial_only_chk CHECK (
        value_role = 'editorial' OR derivation_rule IS NULL
    ),
    ADD CONSTRAINT property_value_derivation_rule_values_chk CHECK (
        derivation_rule IS NULL
        OR derivation_rule IN ('envelope_min_max_median_typical', 'manual_override', 'single_source')
    );

COMMENT ON COLUMN property_value.value_role IS
    'observation or editorial (value_role type). Existing rows default to editorial -- see this migration''s COMMENT ON TABLE for why that is correct, not just convenient.';
COMMENT ON COLUMN property_value.editorial_value_id IS
    'Set on an observation row: which editorial row it supports. NULL until a curator (or the derivation view) links it. Always NULL on an editorial row (property_value_editorial_no_parent_chk) -- editorial rows are not themselves observations of anything.';
COMMENT ON COLUMN property_value.derivation_rule IS
    'How an editorial row''s number was produced: envelope_min_max_median_typical (computed -- see v_property_editorial_proposal), manual_override (curator wrote a different number, with a reason recorded in note_fa/note_en), or single_source (only one observation exists, nothing to merge). NULL on observation rows (property_value_derivation_rule_editorial_only_chk). Averaging across sources is never a valid value here -- deliberately not offered as an option.';

CREATE INDEX idx_property_value_editorial_value_id ON property_value (editorial_value_id);
CREATE INDEX idx_property_value_role ON property_value (value_role);

-- ---------------------------------------------------------------------------
-- Narrow the "one live value" constraint to editorial rows only
-- ---------------------------------------------------------------------------
--
-- This is the structural fix: several observation rows may now share
-- (subject, property, conditions); only one editorial row may.

DROP INDEX uq_property_value_live;

CREATE UNIQUE INDEX uq_property_value_live_editorial
    ON property_value (subject_type, subject_id, property_id, conditions)
    WHERE value_role = 'editorial' AND superseded_by IS NULL AND status <> 'superseded';

COMMENT ON INDEX uq_property_value_live_editorial IS
    'One live EDITORIAL value per (subject, property, conditions). Replaces uq_property_value_live (0005), which unintentionally forbade several sources'' observations from coexisting -- the exact problem U1 v2 exists to fix. Observation rows are unconstrained here; jsonb (conditions) equality is well-defined for a unique index (see the 0005 comment this one supersedes).';

-- Non-unique index so a curator (or the derivation view) can find every
-- observation feeding one editorial row without a full table scan.
CREATE INDEX idx_property_value_observations_lookup
    ON property_value (subject_type, subject_id, property_id, conditions)
    WHERE value_role = 'observation';

-- FR-10: no data migration needed -- ADD COLUMN ... DEFAULT 'editorial'
-- already made every one of the 109 existing rows editorial, unchanged in
-- meaning (status stays 'unsourced', nothing invented). Recorded here so
-- the requirement has a visible answer in the migration that satisfies it.

INSERT INTO schema_migration (version) VALUES ('0017') ON CONFLICT DO NOTHING;

COMMIT;
