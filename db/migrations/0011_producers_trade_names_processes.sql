-- 0011_producers_trade_names_processes.sql
-- Polypedia: DATA-GAPS G1 (material <-> organization), G2 (trade names),
-- G5 (processing as a fork of material and grade).
--
-- G1 and G2 are deliberately in one file because the owner's decision joins
-- them: a trade name is not merely "a brand string on a material", it is
-- "the brand *this producer* sells *this material* under". Modelling
-- material_organization first and hanging trade_name off that pair is what
-- makes "Lupolen (LyondellBasell)" storable as data rather than as a string
-- that happens to contain a company name in brackets.

BEGIN;

-- ---------------------------------------------------------------------------
-- G1. material_organization -- who makes this material
-- ---------------------------------------------------------------------------

CREATE TABLE material_organization (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id      bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    organization_id  bigint NOT NULL REFERENCES organization (id),
    role             text NOT NULL DEFAULT 'producer',
    note_fa          text,
    note_en          text,
    status           value_status NOT NULL DEFAULT 'unsourced',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (material_id, organization_id, role),
    CONSTRAINT material_organization_role_chk CHECK (
        role IN ('producer', 'compounder', 'distributor', 'licensor')
    )
);

COMMENT ON TABLE material_organization IS
    'Which organizations produce a material. Replaces the legacy iranianManufacturers[]/multinationalManufacturers[] string arrays. Deliberately has no is_iranian flag: organization.country_code = ''IR'' already carries that, and the prototype''s two-list split is a presentation choice, not data.';
COMMENT ON COLUMN material_organization.role IS
    'How this organization relates to the material. ''producer'' covers the prototype''s two manufacturer lists; the others exist so a supply chain can be described without a migration.';
COMMENT ON COLUMN material_organization.note_fa IS
    'Free text qualifying the relationship, e.g. the prototype''s parenthetical "(هموپلیمر و کوپلیمر)" or "(گرید S-65)" -- which grades/variants this producer actually makes.';

CREATE INDEX idx_material_organization_material_id ON material_organization (material_id);
CREATE INDEX idx_material_organization_organization_id ON material_organization (organization_id);

-- ---------------------------------------------------------------------------
-- G2. trade_name -- the producer's brand for a material
-- ---------------------------------------------------------------------------
--
-- organization_id is nullable and NOT folded into a FK on
-- material_organization.id, even though the pair is the point. Two reasons:
-- (a) a trade name is sometimes known before its owner is confirmed, or the
-- owner has since been acquired and the brand outlived the relationship;
-- (b) making it a hard FK to the join row would mean deleting a producer
-- link silently deletes brand history. The pair is instead kept honest by
-- trade_name_producer_is_linked_chk below, which requires that whenever an
-- organization IS named, that organization is on record as related to that
-- material -- so the two tables stay joint without being welded.

CREATE TABLE trade_name (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id      bigint NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    organization_id  bigint REFERENCES organization (id),
    name             text NOT NULL,
    note_fa          text,
    note_en          text,
    status           value_status NOT NULL DEFAULT 'unsourced',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (material_id, name, organization_id)
);

COMMENT ON TABLE trade_name IS
    'A producer''s brand for a material ("Lupolen" for LDPE, sold by LyondellBasell). Replaces the legacy tradeNames[] strings, which crammed the producer into the brand string in brackets. Kept out of material_identifier because a trade name belongs to a producer as well as a material -- the same shape grade will need, so this pre-stages U6.';
COMMENT ON COLUMN trade_name.organization_id IS
    'The producer selling under this brand. Nullable: a brand may be recorded before its owner is confirmed. When set, it must already be linked to this material in material_organization -- see trade_name_producer_is_linked_chk.';

CREATE INDEX idx_trade_name_material_id ON trade_name (material_id);
CREATE INDEX idx_trade_name_organization_id ON trade_name (organization_id);
CREATE INDEX idx_trade_name_name_trgm ON trade_name USING gist (name gist_trgm_ops);

-- A CHECK cannot run a subquery, so the material_organization coherence rule
-- is a trigger. It is a data-quality rule rather than a structural one: it
-- stops "Lupolen, by Dow" being enterable for a material Dow is not recorded
-- as producing, which is exactly the kind of quiet wrongness the citation
-- architecture exists to prevent elsewhere.
CREATE FUNCTION trade_name_check_producer_link() RETURNS trigger AS $$
BEGIN
    IF NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM material_organization mo
        WHERE mo.material_id = NEW.material_id
          AND mo.organization_id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION
            'trade_name "%" names organization % as producing material %, but no material_organization row links them. Add the producer link first.',
            NEW.name, NEW.organization_id, NEW.material_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trade_name_check_producer_link() IS
    'Keeps trade_name and material_organization joint: a brand may only name a producer that is already on record as related to that material.';

CREATE TRIGGER trg_trade_name_check_producer_link
    BEFORE INSERT OR UPDATE OF material_id, organization_id ON trade_name
    FOR EACH ROW
    EXECUTE FUNCTION trade_name_check_producer_link();

-- ---------------------------------------------------------------------------
-- G5. material_process -- processing as a subtopic of material AND grade
-- ---------------------------------------------------------------------------
--
-- The fork. LDPE's melt window for blown film is not LDPE's melt window for
-- extrusion coating, and the prototype papered over that by storing one
-- process_temp per polymer. One row here per (subject, technique); the
-- numbers themselves live in property_value with subject_type =
-- 'material_process', so mould_temp/injection_pressure/process_temp get the
-- same citation, supersede and plausibility machinery as every other value.

CREATE TABLE material_process (
    id                       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id              bigint REFERENCES material (id) ON DELETE CASCADE,
    grade_id                 bigint REFERENCES grade (id) ON DELETE CASCADE,
    processing_technique_id  bigint NOT NULL REFERENCES processing_technique (id),
    note_fa                  text,
    note_en                  text,
    sort_order               int NOT NULL DEFAULT 0,
    status                   value_status NOT NULL DEFAULT 'unsourced',
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT material_process_one_subject_chk CHECK (
        num_nonnulls(material_id, grade_id) = 1
    )
);

COMMENT ON TABLE material_process IS
    'One way a material or grade is processed (blown film, extrusion coating, injection moulding, ...). Exists so processing data can fork: the melt window that belongs to extrusion coating is not the melt window that belongs to blown film. Property values attach to a row here via property_value.subject_type = ''material_process''.';
COMMENT ON CONSTRAINT material_process_one_subject_chk ON material_process IS
    'Exactly one of material_id / grade_id. A process belongs to a generic material or to a specific commercial grade, never to both and never to neither.';

-- Partial unique indexes rather than one UNIQUE constraint, because the
-- unused side of the fork is NULL and NULLs do not collide in a plain
-- UNIQUE -- which would let the same (material, technique) pair be entered
-- twice.
CREATE UNIQUE INDEX uq_material_process_material
    ON material_process (material_id, processing_technique_id)
    WHERE material_id IS NOT NULL;
CREATE UNIQUE INDEX uq_material_process_grade
    ON material_process (grade_id, processing_technique_id)
    WHERE grade_id IS NOT NULL;

CREATE INDEX idx_material_process_material_id ON material_process (material_id);
CREATE INDEX idx_material_process_grade_id ON material_process (grade_id);
CREATE INDEX idx_material_process_technique_id ON material_process (processing_technique_id);

-- ---------------------------------------------------------------------------
-- Teach the property_value integrity trigger about the new subject
-- ---------------------------------------------------------------------------
--
-- CREATE OR REPLACE rather than a new function: the trigger created in 0005
-- already points at this name, so replacing the body updates the existing
-- trigger in place. The ELSE branch is kept -- it is what makes a future
-- unhandled subject_type fail loudly instead of silently skipping the check.

CREATE OR REPLACE FUNCTION property_value_check_subject() RETURNS trigger AS $$
BEGIN
    IF NEW.subject_type = 'material' THEN
        IF NOT EXISTS (SELECT 1 FROM material WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing material row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'grade' THEN
        IF NOT EXISTS (SELECT 1 FROM grade WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing grade row', NEW.subject_id;
        END IF;
    ELSIF NEW.subject_type = 'material_process' THEN
        IF NOT EXISTS (SELECT 1 FROM material_process WHERE id = NEW.subject_id) THEN
            RAISE EXCEPTION 'property_value.subject_id % does not reference an existing material_process row', NEW.subject_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'property_value.subject_type % is not handled by the integrity trigger', NEW.subject_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

INSERT INTO schema_migration (version) VALUES ('0011') ON CONFLICT DO NOTHING;

COMMIT;
