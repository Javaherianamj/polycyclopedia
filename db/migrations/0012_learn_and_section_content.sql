-- 0012_learn_and_section_content.sql
-- Polypedia: DATA-GAPS G4 (quiz questions) and G7 (section-level narrative).
--
-- These two tables sit either side of a line worth stating explicitly,
-- because the schema has no other way to express it: quiz_question is
-- *authored* content and deliberately carries no citation chain, while
-- material_section_note is *claimed* content and carries the full one. A
-- quiz question is a teaching device its author is free to invent. The
-- sentence "PVC releases HCl above 140 °C, so Ca/Zn stabilizers are
-- mandatory" is a factual claim about the physical world that happens to be
-- written as prose instead of as a number, and the entire point of this
-- database is that such claims are traceable to a source.

BEGIN;

-- ---------------------------------------------------------------------------
-- G4. quiz_question
-- ---------------------------------------------------------------------------

CREATE TABLE quiz_question (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id    bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    prompt_fa      text NOT NULL,
    prompt_en      text,
    options_fa     jsonb NOT NULL,
    options_en     jsonb,
    correct_index  int NOT NULL,
    feedback_fa    text,
    feedback_en    text,
    difficulty     text NOT NULL DEFAULT 'intro',
    sort_order     int NOT NULL DEFAULT 0,
    status         material_status NOT NULL DEFAULT 'draft',
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT quiz_question_options_is_array_chk CHECK (
        jsonb_typeof(options_fa) = 'array' AND jsonb_array_length(options_fa) >= 2
    ),
    CONSTRAINT quiz_question_options_en_is_array_chk CHECK (
        options_en IS NULL OR (
            jsonb_typeof(options_en) = 'array'
            AND jsonb_array_length(options_en) = jsonb_array_length(options_fa)
        )
    ),
    -- The classic off-by-one in quiz data: an answer index pointing past the
    -- end of the options array. Caught structurally rather than left to the
    -- frontend to render "undefined" as the correct answer.
    CONSTRAINT quiz_question_correct_index_in_range_chk CHECK (
        correct_index >= 0 AND correct_index < jsonb_array_length(options_fa)
    ),
    CONSTRAINT quiz_question_difficulty_chk CHECK (
        difficulty IN ('intro', 'applied', 'advanced')
    )
);

COMMENT ON TABLE quiz_question IS
    'Multiple-choice questions for the Learn surface, replacing PolymerData.quiz[]. Deliberately NOT citation-tracked: a quiz question is authored teaching content, not a measured value. Contrast material_section_note in this same migration.';
COMMENT ON COLUMN quiz_question.options_fa IS
    'JSON array of answer strings. Kept as jsonb rather than a quiz_option child table: options are always read and written as a whole set, never queried individually, so normalising them would add a join for no gain.';
COMMENT ON COLUMN quiz_question.correct_index IS
    'Zero-based index into options_fa. options_en, when present, is required to be the same length, so one index addresses both languages.';
COMMENT ON COLUMN quiz_question.difficulty IS
    'Lets the Learn surface build a graded run rather than showing every question at once. ''intro'' matches the prototype''s existing questions.';

CREATE INDEX idx_quiz_question_material_id ON quiz_question (material_id);

-- ---------------------------------------------------------------------------
-- G7. material_section_note
-- ---------------------------------------------------------------------------
--
-- group_key is a FK to property_group.key rather than free text, so a note
-- cannot be attached to a section that does not exist, and so the datasheet
-- can render notes by joining on the same key it already orders sections by.
-- property_group.key is UNIQUE (0004), so it is a legal FK target.

CREATE TABLE material_section_note (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id  bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    group_key    text REFERENCES property_group (key) ON UPDATE CASCADE,
    kind         text NOT NULL DEFAULT 'note',
    title_fa     text,
    title_en     text,
    body_fa      text NOT NULL,
    body_en      text,
    sort_order   int NOT NULL DEFAULT 0,
    status       value_status NOT NULL DEFAULT 'unsourced',
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT material_section_note_kind_chk CHECK (
        kind IN ('note', 'intro', 'list_item')
    )
);

COMMENT ON TABLE material_section_note IS
    'Narrative prose attached to a datasheet *section* rather than to a single value. Covers the prototype''s processing.specialNote (kind=''note''), the mechanical block intro (kind=''intro'') and academic.reactorTypes[] (kind=''list_item'', one row each). Citation-tracked via evidence.material_section_note_id -- these are factual claims, they are just written as sentences instead of numbers.';
COMMENT ON COLUMN material_section_note.group_key IS
    'Which datasheet section this note belongs to (FK to property_group.key). NULL means the note is not section-scoped and renders at the top of the datasheet.';
COMMENT ON COLUMN material_section_note.kind IS
    '''note'' = a callout box (the prototype''s specialNote). ''intro'' = a paragraph introducing the section. ''list_item'' = one entry of a bulleted list, e.g. a reactor type; several rows share a group_key and are ordered by sort_order.';

CREATE INDEX idx_material_section_note_material_id ON material_section_note (material_id);
CREATE INDEX idx_material_section_note_group_key ON material_section_note (group_key);

-- ---------------------------------------------------------------------------
-- Extend evidence so a section note can be cited
-- ---------------------------------------------------------------------------
--
-- evidence was built in 0006 with property_value_id NOT NULL. Widening it to
-- an optional-subject shape (exactly one of property_value_id /
-- material_section_note_id) is preferred over a parallel
-- section_note_evidence table, so that "what does this source support?" stays
-- a single query, and so the coverage views keep one definition of "cited".

ALTER TABLE evidence
    ALTER COLUMN property_value_id DROP NOT NULL,
    ADD COLUMN material_section_note_id bigint REFERENCES material_section_note (id) ON DELETE CASCADE,
    ADD CONSTRAINT evidence_one_subject_chk CHECK (
        num_nonnulls(property_value_id, material_section_note_id) = 1
    );

COMMENT ON COLUMN evidence.material_section_note_id IS
    'Set instead of property_value_id when this evidence supports a narrative section note rather than a numeric value. Exactly one of the two is non-NULL (evidence_one_subject_chk).';

CREATE INDEX idx_evidence_material_section_note_id
    ON evidence (material_section_note_id);

-- The table's existing UNIQUE (property_value_id, citation_id, role) stops a
-- value being cited twice by the same citation in the same role. It cannot do
-- the same job for section notes, because property_value_id is NULL on those
-- rows and NULLs never collide in a UNIQUE constraint -- so the note side
-- needs its own partial unique index or it would silently have no protection
-- at all.
CREATE UNIQUE INDEX uq_evidence_section_note_citation_role
    ON evidence (material_section_note_id, citation_id, role)
    WHERE material_section_note_id IS NOT NULL;

INSERT INTO schema_migration (version) VALUES ('0012') ON CONFLICT DO NOTHING;

COMMIT;
