-- 0022_editorial_derivation_views.sql
-- Polypedia: U1 v2 FR-3, FR-8 -- derivation proposal and disagreement flag.
--
-- Answers database-revision-questions.md Q3 (A: computed by default, curator
-- may override) and Q8 (A: escalate, do not merge, when sources genuinely
-- disagree). Two views:
--
--   v_property_editorial_proposal  -- for each editorial row that has linked
--                                     observations, the envelope/median a
--                                     curator would get by accepting the
--                                     default rule, plus whether the
--                                     observations actually overlap.
--   v_property_value_disagreement  -- the subset of the above where they do
--                                     NOT overlap: the escalation work list
--                                     (split to grade_class/material_process
--                                     rather than merge).
--
-- Overlap test: n ranges (degenerate to a point when only value_typical is
-- given) share a common value iff MAX(range starts) <= MIN(range ends) --
-- the standard n-interval intersection test. Never averages; the proposal is
-- always (min of mins, max of maxes) for the range and median of the typicals
-- for the point estimate.

BEGIN;

CREATE VIEW v_property_editorial_proposal AS
WITH obs AS (
    SELECT
        editorial_value_id,
        COALESCE(value_min, value_typical) AS range_start,
        COALESCE(value_max, value_typical) AS range_end,
        value_typical
    FROM property_value
    WHERE value_role = 'observation' AND editorial_value_id IS NOT NULL
)
SELECT
    pv.id                                          AS editorial_value_id,
    pv.subject_type,
    pv.subject_id,
    pv.property_id,
    pd.key                                         AS property_key,
    pv.status                                      AS current_status,
    pv.value_min                                   AS current_value_min,
    pv.value_max                                   AS current_value_max,
    pv.value_typical                               AS current_value_typical,
    COUNT(o.*)                                      AS observation_count,
    MIN(o.range_start)                              AS proposed_value_min,
    MAX(o.range_end)                                AS proposed_value_max,
    (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY o2.value_typical)
       FROM obs o2 WHERE o2.editorial_value_id = pv.id AND o2.value_typical IS NOT NULL)
                                                     AS proposed_value_typical,
    (MAX(o.range_start) <= MIN(o.range_end))         AS observations_overlap
FROM property_value pv
JOIN property_definition pd ON pd.id = pv.property_id
JOIN obs o ON o.editorial_value_id = pv.id
WHERE pv.value_role = 'editorial'
GROUP BY pv.id, pv.subject_type, pv.subject_id, pv.property_id, pd.key,
         pv.status, pv.value_min, pv.value_max, pv.value_typical;

COMMENT ON VIEW v_property_editorial_proposal IS
    'For each editorial property_value with linked observations: the envelope/median a curator would get from the default derivation rule (U1 v2 FR-3), and whether the observations actually overlap. Never averages -- proposed_value_min/max is (min of mins, max of maxes); proposed_value_typical is the median of reported typicals.';
COMMENT ON COLUMN v_property_editorial_proposal.observations_overlap IS
    'true iff MAX(observation range starts) <= MIN(observation range ends) -- the standard n-interval intersection test. false means the sources genuinely disagree (U1 v2 FR-8): the editorial value should be withheld and the subject flagged for a grade_class/material_process split, not merged into a wider envelope.';

CREATE VIEW v_property_value_disagreement AS
SELECT * FROM v_property_editorial_proposal WHERE observations_overlap = false;

COMMENT ON VIEW v_property_value_disagreement IS
    'The escalation work list from database-revision-questions.md Q8: editorial values whose linked observations do not overlap at all. These should not be published as a wide envelope -- they need a grade_class or material_process split.';

INSERT INTO schema_migration (version) VALUES ('0022') ON CONFLICT DO NOTHING;

COMMIT;
