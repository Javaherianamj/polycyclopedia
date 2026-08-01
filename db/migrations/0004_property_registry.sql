-- 0004_property_registry.sql
-- Polypedia database-core: property registry tables (schema-design.md section 6.1-6.3).
--
-- This is the extensibility mechanism the whole design is built around:
-- "the registry is the schema" (principle 1). property_group and
-- property_definition are metadata tables; adding a new property to the
-- catalog is an INSERT here, not a DDL change.

BEGIN;

-- ---------------------------------------------------------------------------
-- 6.1 property_group
-- ---------------------------------------------------------------------------

CREATE TABLE property_group (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         text NOT NULL UNIQUE,
    name_fa     text NOT NULL,
    name_en     text NOT NULL,
    ui_tab      text,
    sort_order  int NOT NULL DEFAULT 0,
    -- Defect fix (post-review): audit timestamps. property_group/
    -- property_definition are explicitly "the registry is the schema"
    -- (design principle 1) — ongoing mutable data by design, so they get
    -- the same audit trail as any other mutable table.
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE property_group IS
    'Seeded to exactly match the existing UI tab structure (processing, thermal, mechanical, physical, electrical, academic) so the frontend can keep its layout.';
COMMENT ON COLUMN property_group.ui_tab IS
    'ind / eng / aca — mirrors App.tsx''s tab keys.';

-- ---------------------------------------------------------------------------
-- 6.2 property_definition
-- ---------------------------------------------------------------------------

CREATE TABLE property_definition (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id            bigint NOT NULL REFERENCES property_group (id),
    key                 text NOT NULL UNIQUE,
    name_fa             text NOT NULL,
    name_en             text NOT NULL,
    description_fa      text,
    description_en      text,
    data_type           property_data_type NOT NULL,
    canonical_unit      text,
    allowed_units       text[] NOT NULL DEFAULT '{}',
    plausible_min       double precision,
    plausible_max       double precision,
    applies_to_fields   text[] NOT NULL DEFAULT '{}',
    is_searchable       boolean NOT NULL DEFAULT true,
    is_comparable       boolean NOT NULL DEFAULT true,
    always_review       boolean NOT NULL DEFAULT false,
    symbol              text,
    sort_order          int NOT NULL DEFAULT 0,
    -- Defect fix (post-review): audit timestamps, same reasoning as property_group above.
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT property_definition_unit_required_chk CHECK (
        data_type NOT IN ('numeric', 'range') OR canonical_unit IS NOT NULL
    )
);

COMMENT ON TABLE property_definition IS
    'The extensibility mechanism. ~55 rows seeded from src/types/polymer.ts. Adding a property for a new polymer field is an INSERT here, not a schema migration.';
COMMENT ON COLUMN property_definition.key IS
    'Stable identifier, e.g. tg, tensile_strength, hansen_d. Used by property_value.property_id (indirectly) and by the ETL/frontend to address a property.';
COMMENT ON COLUMN property_definition.applies_to_fields IS
    'Array of field.key values this property is relevant to. Empty array = applies to all fields.';
COMMENT ON CONSTRAINT property_definition_unit_required_chk ON property_definition IS
    'A numeric or range-typed property without a canonical unit is meaningless — enforced structurally rather than left to convention (design principle 3).';

CREATE INDEX idx_property_definition_group_id ON property_definition (group_id);

-- ---------------------------------------------------------------------------
-- 6.3 test_method
-- ---------------------------------------------------------------------------

CREATE TABLE test_method (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    standard_body   text NOT NULL,
    code            text NOT NULL,
    title           text,
    -- Defect fix (post-review): audit timestamps for this mutable data table.
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (standard_body, code)
);

COMMENT ON TABLE test_method IS
    'ASTM/ISO/DIN test methods already referenced in ResourcesModal.tsx (e.g. ASTM D1238).';
-- Defect fix (post-review): standard_body was originally a hard CHECK IN
-- ('ASTM','ISO','DIN'). Real polymer datasheets cite many more bodies
-- (JIS, GB, EN, BS, AATCC, UL, IEC, and others not yet catalogued). A
-- closed enum-style CHECK here would force a schema migration every time
-- ingestion hits a new standards body, which contradicts design principle
-- 1 ("the registry is the schema" / extensible by insert). The CHECK is
-- dropped entirely; standard_body is left as open-ended text, with the
-- (standard_body, code) UNIQUE constraint still preventing duplicates.
-- Data hygiene for the value set is a seed/ingestion-time concern, not a
-- DDL-time one.
COMMENT ON COLUMN test_method.standard_body IS
    'Open-ended text, deliberately not CHECK-constrained to a fixed list (see table comment history / migration note above) — new standards bodies (JIS, GB, EN, BS, AATCC, UL, IEC, ...) are added by seeding a row, never by migration.';

INSERT INTO schema_migration (version) VALUES ('0004') ON CONFLICT DO NOTHING;

COMMIT;
