-- 0001_extensions_and_enums.sql
-- Polypedia database-core: extensions, enumerated types, migration bookkeeping.
-- See aidlc-docs/construction/database-core/functional-design/schema-design.md section 3.

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- Trigram search on names / trade names (material.name_en, organization.name_en, etc).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Provides GiST operator classes for scalar (btree-indexable) types so a GiST
-- index can combine an equality column (e.g. property_id) with a range
-- expression (numrange) in a single composite index. Required by the
-- property_value range index created in 0008_views_and_indexes.sql.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- Enumerated types (schema-design.md section 3)
-- ---------------------------------------------------------------------------

CREATE TYPE material_status AS ENUM (
    'draft', 'in_review', 'published', 'archived'
);

CREATE TYPE value_status AS ENUM (
    'draft', 'in_review', 'published', 'superseded', 'unsourced'
);

CREATE TYPE property_data_type AS ENUM (
    'numeric', 'range', 'text', 'enum', 'boolean'
);

CREATE TYPE evidence_role AS ENUM (
    'primary', 'corroborating', 'conflicting', 'derived_from'
);

CREATE TYPE extraction_method AS ENUM (
    'manual', 'llm', 'table_parser', 'computed', 'legacy_import'
);

CREATE TYPE source_kind AS ENUM (
    'handbook', 'textbook', 'standard', 'datasheet', 'journal_article',
    'encyclopedia', 'website', 'internal'
);

CREATE TYPE source_tier AS ENUM (
    'peer_reviewed_handbook', 'standard', 'manufacturer_datasheet',
    'vendor_marketing', 'community'
);

CREATE TYPE subject_type AS ENUM (
    'material', 'grade'
);

CREATE TYPE resistance_rating AS ENUM (
    'excellent', 'very_good', 'good', 'fair', 'poor', 'not_recommended'
);

-- ---------------------------------------------------------------------------
-- Migration bookkeeping (schema-design.md section 8.3)
-- ---------------------------------------------------------------------------

CREATE TABLE schema_migration (
    version     text PRIMARY KEY,
    applied_at  timestamptz NOT NULL DEFAULT now(),
    checksum    text
);

COMMENT ON TABLE schema_migration IS
    'Forward-only migration ledger. Each migration file inserts its own version number at the end of its transaction.';

INSERT INTO schema_migration (version) VALUES ('0001') ON CONFLICT DO NOTHING;

COMMIT;
