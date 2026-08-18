-- 0019_contributors.sql
-- Polypedia: U1 v2 FR-6, FR-7 -- authorship.
--
-- Answers database-revision-questions.md Q6/Q7 (A, recommended). Until now,
-- property_value.created_by was free text with no table behind it and no
-- display path -- there was no way to answer "who supplied this number"
-- beyond an unstructured string. contributor + contribution give that a
-- real model: a contributor can be an author of some values, a curator of
-- others, and a reviewer of a third set, and the same shape works for
-- citations and section notes without a schema change per content type.

BEGIN;

CREATE TABLE contributor (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_name  text NOT NULL,
    email         text UNIQUE,
    created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE contributor IS
    'A person who supplies, curates, or reviews data. Seeded with the project owner as contributor #1 (U1 v2 FR-6). Deliberately not merged with any future login/auth identity table -- this is a citation-provenance concept, not an account.';

CREATE TYPE contribution_role AS ENUM ('author', 'curator', 'reviewer', 'importer');

COMMENT ON TYPE contribution_role IS
    'author = supplied the underlying data/source. curator = shaped it into the database (merged observations, wrote an editorial value). reviewer = checked it. importer = ran the tooling that inserted it (e.g. a CSV import), often distinct from who authored the source.';

CREATE TABLE contribution (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contributor_id      bigint NOT NULL REFERENCES contributor (id),
    contribution_target text NOT NULL,
    target_id           bigint NOT NULL,
    role                contribution_role NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT contribution_target_chk CHECK (
        contribution_target IN ('property_value', 'citation', 'material_section_note')
    ),
    UNIQUE (contributor_id, contribution_target, target_id, role)
);

COMMENT ON TABLE contribution IS
    'Links a contributor to something they authored, curated, reviewed, or imported. contribution_target/target_id is a lightweight polymorphic reference (text discriminator, not the subject_type enum -- deliberately smaller: this table only ever points at citable content, never at material/grade/grade_class/material_process). No integrity trigger: a dangling contribution (target row later deleted) is a harmless historical record, unlike property_value/evidence where a dangling polymorphic reference would silently break "what does this source support".';
COMMENT ON COLUMN contribution.contribution_target IS
    'Which table target_id points into: property_value, citation, or material_section_note -- the three tables a person actually authors/curates/reviews content on. Not evidence''s subject_type/subject_id (0020), which is a different, stricter-integrity concept.';

CREATE INDEX idx_contribution_contributor_id ON contribution (contributor_id);
CREATE INDEX idx_contribution_target ON contribution (contribution_target, target_id);

-- Seed the owner as contributor #1, per the owner's explicit request to be
-- credited as author of the data they supply.
INSERT INTO contributor (display_name, email)
VALUES ('Amirmahdi', 'amirmahdijavaherian1383@gmail.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO schema_migration (version) VALUES ('0019') ON CONFLICT DO NOTHING;

COMMIT;
