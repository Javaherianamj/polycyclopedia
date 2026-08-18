-- 0024_application_property_polarity.sql
-- Polypedia: FE-6 (compare) -- application-conditional property polarity.
--
-- FE-6's business rules (aidlc-docs/construction/fe-6/functional-design/
-- business-rules.md, CR4/CR5/CR6) draw a hard line between two different
-- questions a comparison table can answer:
--
--   1. "Which value is bigger?"   -- a fact. Always true, needs no context.
--   2. "Which value is better?"   -- a judgement, and only meaningful once an
--      application is chosen (higher density is neither good nor bad in the
--      abstract; it is good *for a pipe* and largely irrelevant *for a film*).
--
-- (1) is typography (FE-6's pure-logic/UI concern, not this migration). (2)
-- is this table: one row of editorial judgement per (application, property).
--
-- CR6 is the constraint this migration exists to protect, structurally:
-- polarity is an editorial call an owner/curator makes ("we judge higher
-- ESCR better for chemical tanks"), never a sourced measurement ("a handbook
-- says ESCR is 400 hours"). Conflating the two would corrupt the one
-- distinction this whole database is built to preserve (see 0006's citation
-- model, 0017's observation/editorial split, 0020's evidence polymorphism --
-- all in service of never letting an assertion outrun what a source actually
-- supports). Concretely, application_property_polarity:
--   * is not one of the seven subject_type values evidence_check_subject()
--     (0020) recognises, and never will be -- adding it there is exactly the
--     mistake this migration is designed to make impossible. A citation
--     attached to a polarity row is not a schema violation to catch after
--     the fact; it is a table that structurally cannot be pointed at by
--     `evidence` in the first place.
--   * carries its own rationale_fa/rationale_en columns instead, printed on
--     demand (CR6) -- reasoning, not a locator into a source document.
--   * has no citation_id, source_id, or evidence-shaped column of any kind.
--
-- polarity itself is a first-class three-value enum (not a text/CHECK column
-- the way organization.kind or material_status started, per 0001's pattern
-- for domain-wide fixed vocabularies): `not_relevant` is a real editorial
-- answer ("this property does not bear on this application") distinct from
-- an absent row ("nobody has judged this yet") -- CR5. The application/UI
-- layers must not be able to typo a fourth value past a CHECK; the enum
-- makes that a parse-time error.

BEGIN;

-- ---------------------------------------------------------------------------
-- polarity enum
-- ---------------------------------------------------------------------------

CREATE TYPE polarity AS ENUM (
    'higher_is_better', 'lower_is_better', 'not_relevant'
);

COMMENT ON TYPE polarity IS
    'CR5 (FE-6 business-rules.md). not_relevant is a deliberate editorial answer ("this property does not bear on this application"), not a stand-in for "undecided" -- undecided is simply the absence of a row in application_property_polarity.';

-- ---------------------------------------------------------------------------
-- application_property_polarity
-- ---------------------------------------------------------------------------

CREATE TABLE application_property_polarity (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id  bigint NOT NULL REFERENCES application (id) ON DELETE CASCADE,
    property_id     bigint NOT NULL REFERENCES property_definition (id) ON DELETE CASCADE,
    polarity        polarity NOT NULL,
    -- CR6: reasoning, never a citation. NOT NULL -- an editorial judgement
    -- with no stated reason is exactly the kind of confident-sounding,
    -- unaccountable assertion this project exists to prevent (see the seed
    -- file's header for how this is enforced in practice, not just in DDL).
    rationale_fa    text NOT NULL,
    rationale_en    text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_application_property_polarity UNIQUE (application_id, property_id)
);

COMMENT ON TABLE application_property_polarity IS
    'FE-6 CR4/CR5/CR6. Per (application, property) editorial judgement of which direction is "better" for that use case. Deliberately outside the citation/evidence graph -- see this migration''s header. An absent row means "not yet decided" (honest); seeding one for every application x property pair would mean "someone judged this", which is false for most pairs and is exactly what the seed file avoids doing.';
COMMENT ON COLUMN application_property_polarity.polarity IS
    'higher_is_better / lower_is_better / not_relevant (CR5). Rendered as colour only when the reader has selected this application (CR4) -- with no application selected, this table is never consulted.';
COMMENT ON COLUMN application_property_polarity.rationale_fa IS
    'CR6 -- editorial reasoning in Persian, shown on demand. Required: a polarity judgement with no stated reason is not distinguishable from a guess.';
COMMENT ON COLUMN application_property_polarity.rationale_en IS
    'CR6 -- editorial reasoning in English, shown on demand. Required, same reasoning as rationale_fa.';
COMMENT ON CONSTRAINT uq_application_property_polarity ON application_property_polarity IS
    'One judgement per (application, property) pair -- a second, conflicting row for the same pair would just be an unresolved disagreement sitting in the data.';

CREATE INDEX idx_application_property_polarity_application_id
    ON application_property_polarity (application_id);
CREATE INDEX idx_application_property_polarity_property_id
    ON application_property_polarity (property_id);

-- updated_at trigger, same mechanism as every other mutable table (0014).
CREATE TRIGGER trg_application_property_polarity_updated_at
    BEFORE UPDATE ON application_property_polarity
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO schema_migration (version) VALUES ('0024') ON CONFLICT DO NOTHING;

COMMIT;
