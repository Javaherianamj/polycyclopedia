-- 0006_citations.sql
-- Polypedia database-core: citation chain (schema-design.md section 7).

BEGIN;

-- ---------------------------------------------------------------------------
-- 7.1 source
-- ---------------------------------------------------------------------------

CREATE TABLE source (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind        source_kind NOT NULL,
    tier        source_tier NOT NULL,
    title       text NOT NULL,
    authors     text,
    publisher   text,
    edition     text,
    year        int,
    isbn        text,
    doi         text,
    url         text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    -- Defect fix (post-review): source had created_at but no updated_at;
    -- bibliographic entries do get corrected (typos in title/authors/year).
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE source IS
    'A work (book, standard, datasheet, ...). Seeded from ResourcesModal.tsx''s bibliography.';

-- ---------------------------------------------------------------------------
-- 7.2 source_document
-- ---------------------------------------------------------------------------

CREATE TABLE source_document (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id     bigint NOT NULL REFERENCES source (id),
    storage_key   text,
    sha256        char(64),
    mime_type     text,
    page_count    int,
    language      text,
    retrieved_at  timestamptz,
    -- Defect fix (post-review): source_document had no audit timestamps at
    -- all (storage_key/sha256 get filled in later, after the row exists —
    -- see storage_key comment above — which is itself a mutation history
    -- worth tracking).
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE source_document IS
    'A specific file/edition of a source.';
COMMENT ON COLUMN source_document.storage_key IS
    'Object-storage path; NULL until the file is actually held (a citation can exist against bibliographic metadata before the PDF is ingested).';
COMMENT ON COLUMN source_document.sha256 IS
    'Dedupe key for identical files uploaded more than once.';

CREATE INDEX idx_source_document_source_id ON source_document (source_id);

-- Natural key for a bibliographic work. Without this, re-running a seed or
-- re-importing a bibliography silently creates duplicate `source` rows, and
-- citations then scatter across several rows for the same book. Edition is
-- part of the key because the 4th and 5th editions of a handbook are genuinely
-- different works with different page numbers -- which matters precisely
-- because citations carry page locators.
CREATE UNIQUE INDEX uq_source_title_edition
    ON source (title, COALESCE(edition, ''));

-- Deferred FK from 0003_materials.sql: grade.datasheet_document_id references
-- source_document, but source_document could not exist until this file. See
-- the header comment in 0003_materials.sql for the full explanation.
ALTER TABLE grade
    ADD CONSTRAINT grade_datasheet_document_id_fkey
    FOREIGN KEY (datasheet_document_id) REFERENCES source_document (id);

CREATE INDEX idx_grade_datasheet_document_id ON grade (datasheet_document_id);

-- ---------------------------------------------------------------------------
-- 7.3 citation — where the src_default problem is structurally fixed
-- ---------------------------------------------------------------------------

CREATE TABLE citation (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_document_id    bigint NOT NULL REFERENCES source_document (id),
    locator               jsonb NOT NULL,
    snippet               text,
    snippet_lang          text,
    created_at            timestamptz NOT NULL DEFAULT now(),
    -- Defect fix (post-review): citation had created_at but no updated_at;
    -- a locator/snippet can be corrected after entry.
    updated_at            timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT citation_locator_present_chk CHECK (
        jsonb_typeof(locator) = 'object'
        AND (
            (locator ? 'page'    AND jsonb_typeof(locator -> 'page')    <> 'null')
            OR (locator ? 'table'   AND jsonb_typeof(locator -> 'table')   <> 'null')
            OR (locator ? 'figure'  AND jsonb_typeof(locator -> 'figure')  <> 'null')
            OR (locator ? 'section' AND jsonb_typeof(locator -> 'section') <> 'null')
        )
    )
);

COMMENT ON TABLE citation IS
    'A precise pointer into a source_document: page/table/figure/section. This is where the legacy src_default problem (an uncited number silently presented as fact) is structurally fixed — see citation_locator_present_chk.';
COMMENT ON COLUMN citation.locator IS
    'jsonb, e.g. {"page":412} or {"table":"3-2"}. Constrained by citation_locator_present_chk to always name at least one of page/table/figure/section with a non-null value — a citation that cannot say WHERE in the document is not a citation.';
COMMENT ON CONSTRAINT citation_locator_present_chk ON citation IS
    'The single most important constraint in the schema (design principle 3: "Every citation has a locator is a CHECK, not a code review rule."). Rejects: locator NOT NULL already rejects SQL NULL; this CHECK additionally rejects non-object JSON, {}, and objects that only carry unrelated keys (e.g. {"foo":"bar"}) or explicit JSON null values for the locator keys (e.g. {"page":null}). Accepts any object carrying a non-null page, table, figure, or section key, e.g. {"page":412} or {"table":"3-2"}.';

CREATE INDEX idx_citation_source_document_id ON citation (source_document_id);

-- ---------------------------------------------------------------------------
-- 7.4 evidence
-- ---------------------------------------------------------------------------

CREATE TABLE evidence (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_value_id    bigint NOT NULL REFERENCES property_value (id) ON DELETE CASCADE,
    citation_id          bigint NOT NULL REFERENCES citation (id),
    role                 evidence_role NOT NULL DEFAULT 'primary',
    extraction_method    extraction_method NOT NULL,
    confidence           numeric(3,2),
    formula_ref          text,
    created_by           text,
    created_at           timestamptz NOT NULL DEFAULT now(),
    -- Defect fix (post-review): evidence had created_at but no updated_at.
    updated_at           timestamptz NOT NULL DEFAULT now(),
    -- Defect fix (post-review): evidence.confidence had no range CHECK,
    -- while the structurally identical property_value.confidence does
    -- (0 <= confidence <= 1, see 0005_property_values.sql). Adding the
    -- symmetric constraint here for the same reason (design principle 3:
    -- invariants are enforced by constraints, not convention).
    CONSTRAINT evidence_confidence_chk CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    UNIQUE (property_value_id, citation_id, role)
);

COMMENT ON TABLE evidence IS
    'Many-to-many link between a property_value and its supporting citation(s).';
COMMENT ON COLUMN evidence.formula_ref IS
    'For role = derived_from: which formula produced this value.';
COMMENT ON CONSTRAINT evidence_confidence_chk ON evidence IS
    'Symmetric with property_value_confidence_chk on property_value (0005_property_values.sql) — added because evidence.confidence originally had no range CHECK at all.';

CREATE INDEX idx_evidence_property_value_id ON evidence (property_value_id);
CREATE INDEX idx_evidence_citation_id ON evidence (citation_id);

INSERT INTO schema_migration (version) VALUES ('0006') ON CONFLICT DO NOTHING;

COMMIT;
