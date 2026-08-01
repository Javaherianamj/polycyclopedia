-- 0005_property_values.sql
-- Polypedia database-core: property_value table (schema-design.md section 6.4).
--
-- This table is the "numerics are primary, display strings are derived"
-- principle in concrete form (design principle 2). The legacy model stored
-- '0.910 - 0.925' as truth and minDensity/maxDensity as bolt-on shadow
-- fields; those shadow fields (tgValue, tmValue, degradationValue,
-- minDensity, maxDensity, minCrystallinity, maxCrystallinity,
-- mnDefaultValue) are deliberately NOT carried over into this schema
-- (spec section 10) — value_min/value_max/value_typical here ARE the
-- truth, and any display string is rendered from them at read time.
--
-- The subject_type/subject_id pair is a polymorphic reference to either
-- material or grade. A plain FK cannot span two tables, so referential
-- integrity is enforced by the BEFORE INSERT OR UPDATE trigger below
-- rather than by a FOREIGN KEY constraint (spec section 6.4, "Alternative
-- considered: separate material_property_value/grade_property_value
-- tables. Rejected — it doubles every query and every index for the same
-- guarantee.").
--
-- Note: only the constraints/indexes described under the spec's
-- "Constraints:" heading are created here (the table's own integrity
-- rules). The four items under the spec's "Indexes:" heading are created
-- in 0008_views_and_indexes.sql, alongside the read-path views, per the
-- file naming in section 12 ("0008_views_and_indexes.sql").

BEGIN;

CREATE TABLE property_value (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_type    subject_type NOT NULL,
    subject_id      bigint NOT NULL,
    property_id     bigint NOT NULL REFERENCES property_definition (id),
    value_min       double precision,
    value_max       double precision,
    value_typical   double precision,
    value_text      text,
    value_enum      text,
    value_bool      boolean,
    unit_display    text,
    qualifier       text,
    test_method_id  bigint REFERENCES test_method (id),
    conditions      jsonb NOT NULL DEFAULT '{}',
    note_fa         text,
    note_en         text,
    confidence      numeric(3,2),
    status          value_status NOT NULL DEFAULT 'draft',
    superseded_by   bigint REFERENCES property_value (id),
    tenant_id       bigint,  -- FK to tenant(id) added in 0007_tenancy_audit_rls.sql
    created_by      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT property_value_confidence_chk CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    CONSTRAINT property_value_has_a_value_chk CHECK (
        value_min IS NOT NULL OR value_max IS NOT NULL OR value_typical IS NOT NULL
        OR value_text IS NOT NULL OR value_enum IS NOT NULL OR value_bool IS NOT NULL
    ),
    CONSTRAINT property_value_min_le_max_chk CHECK (
        value_min IS NULL OR value_max IS NULL OR value_min <= value_max
    )
);

COMMENT ON TABLE property_value IS
    'The value store. One row per (subject, property, conditions) revision. value_min/value_max/value_typical are canonical-unit numerics and are the source of truth; any display string is rendered from them, not stored.';
COMMENT ON COLUMN property_value.subject_type IS
    'Polymorphic subject discriminator (material or grade). Paired with subject_id; see subject_id comment.';
COMMENT ON COLUMN property_value.subject_id IS
    'Polymorphic reference: the id of a row in material or grade, selected by subject_type. Cannot be a plain FOREIGN KEY because it targets two different tables. Integrity is enforced by the trg_property_value_check_subject trigger below, which raises an exception if the referenced material/grade row does not exist.';
COMMENT ON COLUMN property_value.value_min IS
    'Canonical-unit numeric. Deliberately replaces the legacy shadow fields (minDensity, tgValue, etc. — see spec section 10) which duplicated data already present in a display string.';
COMMENT ON COLUMN property_value.superseded_by IS
    'Append-with-supersede: an update creates a new row and points the old row here rather than mutating history in place.';
COMMENT ON COLUMN property_value.tenant_id IS
    'FK to tenant(id) added in 0007_tenancy_audit_rls.sql, because the tenant table is created there (see 0003_materials.sql header for the same pattern).';

-- ---------------------------------------------------------------------------
-- Polymorphic subject integrity trigger
-- ---------------------------------------------------------------------------

CREATE FUNCTION property_value_check_subject() RETURNS trigger AS $$
BEGIN
    IF NEW.subject_type = 'material' THEN
        IF NOT EXISTS (SELECT 1 FROM material WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing material row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'grade' THEN
        IF NOT EXISTS (SELECT 1 FROM grade WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing grade row', NEW.subject_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'property_value.subject_type % is not handled by the integrity trigger', NEW.subject_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION property_value_check_subject() IS
    'Enforces the polymorphic subject_type/subject_id integrity that a plain FOREIGN KEY cannot express (see property_value.subject_id comment).';

CREATE TRIGGER trg_property_value_check_subject
    BEFORE INSERT OR UPDATE OF subject_type, subject_id ON property_value
    FOR EACH ROW
    EXECUTE FUNCTION property_value_check_subject();

-- ---------------------------------------------------------------------------
-- Partial unique index: one live value per (subject, property, conditions)
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX uq_property_value_live
    ON property_value (subject_type, subject_id, property_id, conditions)
    WHERE superseded_by IS NULL AND status <> 'superseded';

COMMENT ON INDEX uq_property_value_live IS
    'One live value per (subject, property, conditions). jsonb (conditions) is usable directly in a unique index — equality comparison is well-defined for jsonb. Superseded/explicitly-superseded-status rows are excluded so history can accumulate without violating uniqueness.';

INSERT INTO schema_migration (version) VALUES ('0005') ON CONFLICT DO NOTHING;

COMMIT;
