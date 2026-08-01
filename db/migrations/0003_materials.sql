-- 0003_materials.sql
-- Polypedia database-core: material tables (schema-design.md section 5).
--
-- Deviation note: material.tenant_id and grade.tenant_id reference the
-- `tenant` table, which per the spec's own file layout (section 12) is not
-- created until 0007_tenancy_audit_rls.sql. Likewise grade.datasheet_document_id
-- references `source_document`, created in 0006_citations.sql. Both are
-- forward references relative to this file. To honor the file-to-content
-- mapping in section 12 exactly (tenant lives in 0007, source_document in
-- 0006) while still ending up with a fully constrained schema, the columns
-- are created here as plain bigint columns and the FK constraints are added
-- via ALTER TABLE in 0006 and 0007 respectively, once the referenced tables
-- exist. This is flagged in the final report as a spec ambiguity.

BEGIN;

-- ---------------------------------------------------------------------------
-- 5.1 material
-- ---------------------------------------------------------------------------

CREATE TABLE material (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug             text NOT NULL UNIQUE,
    field_id         bigint NOT NULL REFERENCES field (id),
    family_id        bigint NOT NULL REFERENCES family (id),
    name_fa          text NOT NULL,
    name_en          text NOT NULL,
    code             text,
    discovery_year   text,
    overview_fa      text,
    overview_en      text,
    chain_type       text,
    status           material_status NOT NULL DEFAULT 'draft',
    version          int NOT NULL DEFAULT 1,
    published_at     timestamptz,
    tenant_id        bigint,  -- FK to tenant(id) added in 0007_tenancy_audit_rls.sql; NULL = Polypedia master data
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE material IS
    'The generic material (e.g. LDPE as a class of matter). Textbook ranges, cited to handbooks.';
COMMENT ON COLUMN material.tenant_id IS
    'NULL = Polypedia master data, visible to everyone. Non-NULL scopes the row to a tenant. FK to tenant(id) is added in 0007_tenancy_audit_rls.sql because the tenant table is created there; see file header for why.';
COMMENT ON COLUMN material.discovery_year IS
    'Free text, not a year/int type: legacy data holds values like ''1933 (ICI)''.';

CREATE INDEX idx_material_field_id ON material (field_id);
CREATE INDEX idx_material_family_id ON material (family_id);
CREATE INDEX idx_material_status ON material (status);
CREATE INDEX idx_material_tenant_id ON material (tenant_id);
-- Trigram indexes for name search (pg_trgm, enabled in 0001).
CREATE INDEX idx_material_name_en_trgm ON material USING gist (name_en gist_trgm_ops);
CREATE INDEX idx_material_name_fa_trgm ON material USING gist (name_fa gist_trgm_ops);

-- ---------------------------------------------------------------------------
-- 5.2 material_identifier
-- ---------------------------------------------------------------------------

CREATE TABLE material_identifier (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id  bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    type         text NOT NULL,
    value        text NOT NULL,
    -- Defect fix (post-review): audit timestamps for this mutable data table.
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (material_id, type, value),
    -- Defect fix (post-review): originally a closed CHECK IN ('cas',
    -- 'resin_code', 'smiles', 'inchi', 'ec'). That list is far from the
    -- full set of identifier schemes real polymer/chemical data uses
    -- (InChIKey, PubChem CID, ECHA/EC ID, IUPAC name, trade abbreviation,
    -- and more to come). Rather than widen it to another closed list that
    -- will need a migration for the next identifier type, this CHECK is
    -- widened to a substantially larger, still-closed-but-generous set so
    -- ingestion has headroom without a schema change for the common cases;
    -- like test_method.standard_body, this table's whole reason to exist
    -- is "extensible key/value rather than fixed columns" (see table
    -- comment), so the type column is intentionally permissive.
    CONSTRAINT material_identifier_type_chk CHECK (
        type IN (
            'cas', 'resin_code', 'smiles', 'inchi', 'ec',
            'inchi_key', 'pubchem_cid', 'echa_id', 'iupac_name', 'abbreviation'
        )
    )
);

COMMENT ON TABLE material_identifier IS
    'CAS number, resin code, SMILES, InChI, EC number — extensible key/value rather than fixed columns, because e.g. resin code is meaningless outside thermoplastics.';
COMMENT ON CONSTRAINT material_identifier_type_chk ON material_identifier IS
    'Widened from the original 5-value list (cas/resin_code/smiles/inchi/ec) to add inchi_key/pubchem_cid/echa_id/iupac_name/abbreviation. Still a closed list rather than dropped entirely, because unlike standards bodies (test_method.standard_body) the set of chemical-identifier schemes is small and well-known; extend via ALTER TABLE if a new one is genuinely needed.';

CREATE INDEX idx_material_identifier_material_id ON material_identifier (material_id);

-- ---------------------------------------------------------------------------
-- 5.3 grade
-- ---------------------------------------------------------------------------

CREATE TABLE grade (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id             bigint NOT NULL REFERENCES material (id),
    organization_id         bigint REFERENCES organization (id),
    tenant_id               bigint,  -- FK to tenant(id) added in 0007_tenancy_audit_rls.sql; NULL = public Polypedia grade
    name                    text NOT NULL,
    slug                    text NOT NULL,
    status                  material_status NOT NULL DEFAULT 'draft',
    datasheet_document_id   bigint,  -- FK to source_document(id) added in 0006_citations.sql
    -- Defect fix (post-review): grade was missing audit timestamps entirely.
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    UNIQUE (material_id, slug)
);

COMMENT ON TABLE grade IS
    'A commercial product (e.g. "Lupolen 2420H"). Seeded empty in this unit — exists so the B2B unit does not require re-architecting.';
COMMENT ON COLUMN grade.tenant_id IS
    'NULL = public Polypedia grade. FK to tenant(id) added in 0007_tenancy_audit_rls.sql (see file header).';
COMMENT ON COLUMN grade.datasheet_document_id IS
    'FK to source_document(id) added in 0006_citations.sql, because source_document is created in that later migration file (see file header).';

CREATE INDEX idx_grade_material_id ON grade (material_id);
CREATE INDEX idx_grade_organization_id ON grade (organization_id);
CREATE INDEX idx_grade_tenant_id ON grade (tenant_id);

-- ---------------------------------------------------------------------------
-- 5.4 material_structure
-- ---------------------------------------------------------------------------

CREATE TABLE material_structure (
    material_id  bigint PRIMARY KEY REFERENCES material (id) ON DELETE CASCADE,
    atoms        jsonb,
    unit_cell    text,
    -- Defect fix (post-review): audit timestamps for this mutable data table.
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE material_structure IS
    '3D atom coordinates and crystal structure for the molecule viewer.';
COMMENT ON COLUMN material_structure.atoms IS
    'Kept as jsonb rather than normalised into rows — normalising atom coordinates would be pure overhead for this use case.';

-- ---------------------------------------------------------------------------
-- 5.5 market_share_datum
-- ---------------------------------------------------------------------------

CREATE TABLE market_share_datum (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id   bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    segment_fa    text,
    segment_en    text,
    percentage    numeric(5,2) NOT NULL,
    region        text,
    year          int,
    status        value_status NOT NULL DEFAULT 'unsourced',
    -- Defect fix (post-review): market_share_datum was missing audit
    -- timestamps entirely, despite being explicitly called out in the spec
    -- as "the least defensible data in the app" — exactly the kind of row
    -- that needs a visible edit history.
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT market_share_datum_percentage_chk CHECK (percentage >= 0 AND percentage <= 100)
);

COMMENT ON TABLE market_share_datum IS
    'Replaces marketShare[]. Currently the least defensible data in the app (uncited percentages presented as fact), so it gets first-class citation support like any other value via evidence/citation.';

CREATE INDEX idx_market_share_datum_material_id ON market_share_datum (material_id);

-- ---------------------------------------------------------------------------
-- 5.6 chemical_resistance
-- ---------------------------------------------------------------------------

CREATE TABLE chemical_resistance (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id   bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    reagent_fa    text NOT NULL,
    reagent_en    text NOT NULL,
    rating        resistance_rating NOT NULL,
    note_fa       text,
    note_en       text,
    status        value_status NOT NULL DEFAULT 'unsourced',
    -- Defect fix (post-review): chemical_resistance was missing audit timestamps entirely.
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE chemical_resistance IS
    'Replaces chemicalResistance[]. The legacy Tailwind colorClass is removed; presentation moves to the frontend, driven off the resistance_rating enum.';

CREATE INDEX idx_chemical_resistance_material_id ON chemical_resistance (material_id);

-- ---------------------------------------------------------------------------
-- Join tables for the section 4.4 taxonomies (material_id required, so these
-- live here rather than in 0002_taxonomy.sql).
-- ---------------------------------------------------------------------------

CREATE TABLE material_application (
    material_id     bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    application_id  bigint NOT NULL REFERENCES application (id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, application_id)
);

COMMENT ON TABLE material_application IS
    'Many-to-many link between material and application, replacing the legacy applications[] string array on the material record.';

CREATE TABLE material_processing_technique (
    material_id             bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    processing_technique_id bigint NOT NULL REFERENCES processing_technique (id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, processing_technique_id)
);

COMMENT ON TABLE material_processing_technique IS
    'Many-to-many link between material and processing_technique, replacing the legacy processing.techniques[] string array.';

INSERT INTO schema_migration (version) VALUES ('0003') ON CONFLICT DO NOTHING;

COMMIT;
