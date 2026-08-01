-- 0008_views_and_indexes.sql
-- Polypedia database-core: remaining property_value indexes (schema-design.md
-- section 6.4 "Indexes:") and convenience views (section 9).

BEGIN;

-- ---------------------------------------------------------------------------
-- property_value indexes (section 6.4 "Indexes:" list; the partial unique
-- index under "Constraints:" was already created in 0005_property_values.sql)
-- ---------------------------------------------------------------------------

-- The material detail page's primary access path: "all live values for this
-- subject".
CREATE INDEX idx_property_value_subject ON property_value (subject_type, subject_id);

CREATE INDEX idx_property_value_property_id ON property_value (property_id);

-- GiST range index for roadmap Phase 2 range search ("find materials with
-- density between X and Y"), composed with property_id so a search can be
-- scoped to one property without a separate btree lookup first.
--
-- Immutability note: value_min/value_max are `double precision`. Casting a
-- double precision to numeric (float8_numeric) is marked IMMUTABLE in
-- PostgreSQL 16 (verified: `SELECT provolatile FROM pg_proc WHERE
-- proname='numeric' AND proargtypes[0]='float8'::regtype` returns 'i'), so
-- numrange(value_min::numeric, value_max::numeric, '[]') is itself an
-- immutable expression and can be indexed directly — no generated/stored
-- column was needed. The property_id column needs btree_gist (enabled in
-- 0001_extensions_and_enums.sql) to be combinable with a range column in a
-- single GiST index, since GiST does not natively support bigint equality.
CREATE INDEX idx_property_value_property_range
    ON property_value USING gist (property_id, numrange(value_min::numeric, value_max::numeric, '[]'));

COMMENT ON INDEX idx_property_value_property_range IS
    'GiST composite index: property_id (via btree_gist) + numrange(value_min, value_max, ''[]''). Rows where both value_min and value_max are NULL (text/enum/boolean-typed properties) produce an unbounded-empty range object, which the index still stores validly; they simply never match a bounded range query.';

-- The citation work list: every value that has never been sourced.
CREATE INDEX idx_property_value_unsourced ON property_value (id) WHERE status = 'unsourced';

-- ---------------------------------------------------------------------------
-- 9. Convenience views
-- ---------------------------------------------------------------------------

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
    pg_.ui_tab        AS property_group_ui_tab,
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
    'Flattened material + property + value + group, live rows only (not superseded). The read path a GET /materials/:slug endpoint uses.';

CREATE VIEW v_unsourced_values AS
SELECT
    pv.id             AS property_value_id,
    pv.subject_type,
    pv.subject_id,
    COALESCE(m.slug, g.slug)         AS subject_slug,
    COALESCE(m.name_en, g.name)      AS subject_name_en,
    COALESCE(m.name_fa, g.name)      AS subject_name_fa,
    pd.id             AS property_id,
    pd.key            AS property_key,
    pd.name_en        AS property_name_en,
    pd.name_fa        AS property_name_fa,
    pv.value_min,
    pv.value_max,
    pv.value_typical,
    pv.value_text,
    pv.value_enum,
    pv.value_bool,
    pv.created_at
FROM property_value pv
JOIN property_definition pd ON pd.id = pv.property_id
LEFT JOIN material m ON pv.subject_type = 'material' AND m.id = pv.subject_id
LEFT JOIN grade g ON pv.subject_type = 'grade' AND g.id = pv.subject_id
WHERE pv.status = 'unsourced';

COMMENT ON VIEW v_unsourced_values IS
    'Every value with status = unsourced, joined to its subject (material or grade) and property names. The citation campaign work list.';

CREATE VIEW v_citation_coverage AS
SELECT
    m.id      AS material_id,
    m.slug    AS material_slug,
    m.name_en AS material_name_en,
    m.name_fa AS material_name_fa,
    COUNT(DISTINCT pv.id)                                   AS total_values,
    COUNT(DISTINCT pv.id) FILTER (WHERE ev.id IS NOT NULL)  AS cited_values,
    ROUND(
        CASE WHEN COUNT(DISTINCT pv.id) = 0 THEN 0
             ELSE COUNT(DISTINCT pv.id) FILTER (WHERE ev.id IS NOT NULL)::numeric
                  / COUNT(DISTINCT pv.id) * 100
        END, 2
    ) AS coverage_pct
FROM material m
LEFT JOIN property_value pv
    ON pv.subject_type = 'material' AND pv.subject_id = m.id
    AND pv.superseded_by IS NULL AND pv.status <> 'superseded'
LEFT JOIN evidence ev ON ev.property_value_id = pv.id
GROUP BY m.id, m.slug, m.name_en, m.name_fa;

COMMENT ON VIEW v_citation_coverage IS
    'Per material: total live values, cited values (have >=1 evidence row), and coverage percentage. The roadmap''s data-quality dashboard in embryo.';

INSERT INTO schema_migration (version) VALUES ('0008') ON CONFLICT DO NOTHING;

COMMIT;
