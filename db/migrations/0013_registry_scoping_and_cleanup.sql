-- 0013_registry_scoping_and_cleanup.sql
-- Polypedia: DATA-GAPS G3 (property scoping), G8 (unit_cell duplication),
-- G10 (retired ui_tab column).
--
-- G3, restated after the owner's decision: scoping properties by *field* is
-- too coarse to do the job it was added for. The job is the empty-state UI --
-- an absent property renders as "no data yet, add a source", so a property
-- offered to a material it cannot apply to becomes a permanent false to-do.
-- Field granularity cannot express the distinction that actually matters
-- here, because the distinction is not thermoplastic-vs-thermoset. Melting
-- temperature and crystallinity are meaningless for an *amorphous*
-- thermoplastic (polystyrene, PVC) and essential for a semi-crystalline one
-- (polyethylene, PP) -- and both are the same field. Family is the level at
-- which that call can actually be made, so applies_to_families is added
-- alongside applies_to_fields rather than replacing it.

BEGIN;

-- ---------------------------------------------------------------------------
-- G3. applies_to_families
-- ---------------------------------------------------------------------------

ALTER TABLE property_definition
    ADD COLUMN applies_to_families text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN property_definition.applies_to_families IS
    'Array of family.key values this property is relevant to. Empty array = applies to every family (subject to applies_to_fields). Finer-grained than applies_to_fields and evaluated as an AND with it: a property is offered for a material only if it passes both. Family is the level at which the semi-crystalline/amorphous distinction can be expressed, which field cannot -- see this migration''s header.';

COMMENT ON COLUMN property_definition.applies_to_fields IS
    'Array of field.key values this property is relevant to. Empty array = applies to all fields. Coarse scoping; see applies_to_families for the finer pass, which is ANDed with this one.';

-- ---------------------------------------------------------------------------
-- G10. Drop property_group.ui_tab
-- ---------------------------------------------------------------------------
--
-- ui_tab held 'ind'/'eng'/'aca', the prototype's three tabs. The rebuilt
-- datasheet is one scrolling page with section anchors and the interactive
-- tools live on a separate Learn surface, so the column describes a layout
-- that no longer exists. Owner decision (2026-08-05): remove it rather than
-- repurpose it, explicitly so nobody builds tabs *because* the column
-- implies them. Sections order by sort_order alone.
--
-- v_material_properties selects the column, so the view is dropped and
-- recreated. CASCADE is deliberately NOT used -- an unqualified DROP COLUMN
-- ... CASCADE would silently take any other dependent object with it.

DROP VIEW v_material_properties;

ALTER TABLE property_group DROP COLUMN ui_tab;

CREATE VIEW v_material_properties AS
SELECT
    m.id              AS material_id,
    m.slug            AS material_slug,
    m.name_en         AS material_name_en,
    m.name_fa         AS material_name_fa,
    pg_.id            AS property_group_id,
    pg_.key           AS property_group_key,
    pg_.name_en       AS property_group_name_en,
    pg_.name_fa       AS property_group_name_fa,
    pd.id             AS property_id,
    pd.key            AS property_key,
    pd.name_en        AS property_name_en,
    pd.name_fa        AS property_name_fa,
    pd.symbol         AS property_symbol,
    pd.data_type      AS property_data_type,
    pv.id             AS property_value_id,
    pv.value_min,
    pv.value_max,
    pv.value_typical,
    pv.value_text,
    pv.value_enum,
    pv.value_bool,
    pv.unit_display,
    pv.qualifier,
    pv.conditions,
    pv.confidence,
    pv.status         AS value_status,
    pv.test_method_id
FROM material m
JOIN property_value pv
    ON pv.subject_type = 'material' AND pv.subject_id = m.id
    AND pv.superseded_by IS NULL AND pv.status <> 'superseded'
JOIN property_definition pd ON pd.id = pv.property_id
JOIN property_group pg_ ON pg_.id = pd.group_id;

COMMENT ON VIEW v_material_properties IS
    'Flattened material + property + value + group, live rows only (not superseded). The read path a GET /materials/:slug endpoint uses. Recreated in 0013 without property_group_ui_tab (DATA-GAPS G10); sections order by property_group.sort_order alone.';

-- ---------------------------------------------------------------------------
-- G8. Drop material_structure.unit_cell
-- ---------------------------------------------------------------------------
--
-- The same fact was enterable in two unreconciled places:
-- material_structure.unit_cell (a plain text column) and the registry
-- property with key = 'unit_cell'. Owner decision: keep the registry
-- property, which gets citation tracking, plausibility and supersede
-- behaviour for free, and drop the column -- leaving material_structure
-- purely for the 3D atom coordinates the molecule viewer needs.
--
-- Any value already in the column is migrated into the registry property
-- first, so this is not a data loss. Rows that already have a live
-- unit_cell property value are skipped rather than duplicated.

INSERT INTO property_value (
    subject_type, subject_id, property_id, value_text, status, created_by
)
SELECT
    'material',
    ms.material_id,
    (SELECT id FROM property_definition WHERE key = 'unit_cell'),
    ms.unit_cell,
    'unsourced',
    'migration-0013'
FROM material_structure ms
WHERE ms.unit_cell IS NOT NULL
  AND btrim(ms.unit_cell) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM property_value pv
      WHERE pv.subject_type = 'material'
        AND pv.subject_id = ms.material_id
        AND pv.property_id = (SELECT id FROM property_definition WHERE key = 'unit_cell')
        AND pv.superseded_by IS NULL
        AND pv.status <> 'superseded'
  );

ALTER TABLE material_structure DROP COLUMN unit_cell;

COMMENT ON TABLE material_structure IS
    '3D atom coordinates for the molecule viewer. unit_cell was dropped in 0013 (DATA-GAPS G8) because the registry property with key = ''unit_cell'' holds the same fact with citation tracking; this table is now purely about atoms.';

INSERT INTO schema_migration (version) VALUES ('0013') ON CONFLICT DO NOTHING;

COMMIT;
