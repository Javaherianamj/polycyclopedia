-- 0002_taxonomy.sql
-- Polypedia database-core: taxonomy tables (schema-design.md section 4).

BEGIN;

-- ---------------------------------------------------------------------------
-- 4.1 field
-- ---------------------------------------------------------------------------

CREATE TABLE field (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key                 text NOT NULL UNIQUE,
    name_fa             text NOT NULL,
    name_en             text NOT NULL,
    description_fa      text,
    description_en      text,
    sort_order          int NOT NULL DEFAULT 0,
    -- Defect fix (post-review): field is "extensible by insert" ongoing
    -- taxonomy data (names/descriptions/ordering get edited over time), so
    -- it gets the same audit timestamps as every other mutable data table.
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE field IS
    'Top-level polymer domain (Thermoplastics, Thermosets, Elastomers, ...). Extensible by insert.';

-- ---------------------------------------------------------------------------
-- 4.2 family
-- ---------------------------------------------------------------------------

CREATE TABLE family (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    field_id    bigint NOT NULL REFERENCES field (id),
    parent_id   bigint NULL REFERENCES family (id),
    key         text NOT NULL,
    name_fa     text NOT NULL,
    name_en     text NOT NULL,
    sort_order  int NOT NULL DEFAULT 0,
    UNIQUE (field_id, key),
    -- Defect fix (post-review): same audit-timestamp reasoning as field above.
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE family IS
    'Nested taxonomy under a field (self-referential via parent_id). Replaces the legacy free-text PolymerData.family.';
COMMENT ON COLUMN family.parent_id IS
    'Self-reference for nesting; NULL for a top-level family within its field.';

CREATE INDEX idx_family_field_id ON family (field_id);
CREATE INDEX idx_family_parent_id ON family (parent_id);

-- ---------------------------------------------------------------------------
-- 4.3 organization
-- ---------------------------------------------------------------------------

CREATE TABLE organization (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key           text NOT NULL UNIQUE,
    name_fa       text,
    name_en       text,
    country_code  char(2),
    kind          text NOT NULL,
    -- Defect fix (post-review): audit timestamps for this ongoing mutable
    -- reference table (organizations get renamed, re-classified, etc.).
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT organization_name_present_chk CHECK (name_fa IS NOT NULL OR name_en IS NOT NULL),
    CONSTRAINT organization_kind_chk CHECK (kind IN ('manufacturer', 'publisher', 'standards_body'))
);

COMMENT ON TABLE organization IS
    'Manufacturers, publishers, standards bodies. Replaces the legacy iranianManufacturers[]/multinationalManufacturers[] string arrays.';
COMMENT ON COLUMN organization.kind IS
    'Constrained to manufacturer/publisher/standards_body per spec section 4.3. Not modeled as an enum type because it is a lightweight, table-local classifier rather than a domain-wide type.';

-- ---------------------------------------------------------------------------
-- 4.4 application, processing_technique
-- ---------------------------------------------------------------------------

CREATE TABLE application (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         text NOT NULL UNIQUE,
    name_fa     text NOT NULL,
    name_en     text NOT NULL,
    -- Defect fix (post-review): audit timestamps, same reasoning as field/family.
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE application IS
    'Taxonomy replacing the legacy applications[] string array. Joined to materials via material_application (see 0003_materials.sql).';

CREATE TABLE processing_technique (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key         text NOT NULL UNIQUE,
    name_fa     text NOT NULL,
    name_en     text NOT NULL,
    -- Defect fix (post-review): audit timestamps, same reasoning as field/family.
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE processing_technique IS
    'Taxonomy replacing the legacy processing.techniques[] string array. Joined to materials via material_processing_technique (see 0003_materials.sql).';

INSERT INTO schema_migration (version) VALUES ('0002') ON CONFLICT DO NOTHING;

COMMIT;
