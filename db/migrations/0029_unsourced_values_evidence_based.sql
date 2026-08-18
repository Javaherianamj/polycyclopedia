-- 0026_unsourced_values_evidence_based.sql
--
-- RENUMBERED 0026 -> 0029 on 2026-08-14. This file and
-- 0026_subject_type_solvent.sql were both authored as 0026 by concurrent
-- sessions. db/run.sh keys its "already applied" check on the numeric
-- prefix alone, so once '0026' was recorded BOTH files were skipped
-- forever -- and the API's /health check, which compares the applied count
-- against the file count, failed permanently (29 files, 28 versions).
-- Safe to renumber because the payload is CREATE OR REPLACE VIEW, which is
-- idempotent; re-running it changes nothing.
--
-- If you add a migration, check that its number is unused. The runner
-- cannot detect a collision and will silently skip the loser.
-- Polypedia: repair v_unsourced_values -- the curation work list had drifted
-- away from the schema it reports on.
--
-- v_unsourced_values (0008) is not a rendering view. It is the tool that tells
-- the owner what work remains: db/README.md calls it "the citation work list",
-- db/run.sh prints its row count after every migration run, and the curation
-- exporter's tests measure themselves against it. A read view that renders a
-- wrong number is a bug in a page; this one is a bug in the project's own
-- sense of how far along it is. It had two independent defects, both dating
-- from the U1 v2 revisions that landed after it.
--
-- ---------------------------------------------------------------------------
-- Defect 1: it predates the grade_class rung (0016) and material_process
-- values (0010), so two of the four subject_type values were unjoinable.
-- ---------------------------------------------------------------------------
--
-- The view was written when `subject_type` had two members. 0010 added
-- material_process and 0016 added grade_class, but the view's LEFT JOINs
-- were never widened. The failure mode was not the tidy one of omitting
-- those rows -- they still matched `WHERE status = 'unsourced'`, so they
-- appeared in the work list with subject_slug, subject_name_en and
-- subject_name_fa all NULL: an entry telling a curator that *something*
-- needs a citation without saying what. Four such rows were present when
-- this migration was written.
--
-- Widening the joins is more than one extra arm because neither new subject
-- carries a slug of its own:
--
--   * grade_class has (material_id, key) and no slug column -- 0016's own
--     comment names these populations "ldpe/film", "hdpe/blow_molding", so
--     that composition is what subject_slug reconstructs, rather than
--     inventing a new identifier or leaving the column NULL.
--   * material_process is a technique applied to one of three possible
--     owners (material / grade / grade_class -- 0016's
--     material_process_one_subject_chk guarantees exactly one), so its slug
--     is the owner's slug composed with the technique key, and resolving it
--     needs all three owner arms plus grade_class's own material.
--
-- Hence the join list below is long. It is deliberately explicit rather than
-- a CASE over subject_type: each arm is guarded by its own subject_type
-- predicate, so a future fifth subject_type produces a NULL slug that the
-- verification suite catches, not a silently mis-attributed row.
--
-- ---------------------------------------------------------------------------
-- Defect 2: it asked `status`, which stopped being the answer in 0020.
-- ---------------------------------------------------------------------------
--
-- `WHERE pv.status = 'unsourced'` was correct in 0008, when a value's status
-- was the only record of whether anything backed it. It is now a
-- hand-maintained label that nothing keeps in step with the `evidence` table:
-- attaching evidence does not update it, and 0020's step 7 explicitly decided
-- to keep the column for its other states rather than remove it. So the two
-- notions had diverged -- the four rows described above each had an evidence
-- row *and* still said 'unsourced', and were being reported as outstanding
-- work that was in fact already done.
--
-- Citedness is therefore computed from `evidence` here. Critically, this
-- migration does not invent a third definition of "cited": it restates the
-- one api/src/citations.ts already implements, which is that an editorial row
-- is cited by evidence attached either directly to it, or to any observation
-- row linked beneath it via editorial_value_id (0017 FR-2). An editorial
-- value cites all the observations underneath it without those citations
-- being physically re-inserted against the parent, and a work list that
-- ignored that would demand citations for values the site already shows as
-- sourced. The NOT EXISTS below is that rule, in the same shape.
--
-- The rule stays correct for observation rows without being special-cased:
-- observations have no children, so the inner subquery is empty for them and
-- the test collapses to "has its own evidence" -- which is exactly right,
-- since an uncited observation is a real gap and a parent's citation does not
-- vouch for it. Both roles remain in scope, as under the old status filter.
--
-- ---------------------------------------------------------------------------
-- Consequences
-- ---------------------------------------------------------------------------
--
-- Row count goes 106 -> 102: the four falsely-flagged grade_class rows leave
-- and nothing is added, because for material-level values the two definitions
-- happen to agree exactly today (102 either way). That agreement is luck, not
-- invariant -- it is what defect 2 would have silently eroded.
--
-- Dropping the status filter means "live" must now be stated: status =
-- 'unsourced' had implied `status <> 'superseded'` for free. The explicit
-- superseded_by IS NULL AND status <> 'superseded' pair below matches
-- v_material_properties (0008) and v_citation_coverage (0020); without it the
-- 17 superseded material rows, which are uncited and are meant to stay that
-- way, would be added to the work list.
--
-- CREATE OR REPLACE, not DROP + CREATE: the column list, order and types are
-- unchanged (this migration alters which rows appear and how two subject
-- types resolve their names, never the shape), so replacing in place keeps
-- the 0009 grants to polypedia_app that a DROP would silently revoke.

BEGIN;

CREATE OR REPLACE VIEW v_unsourced_values AS
SELECT
    pv.id             AS property_value_id,
    pv.subject_type,
    pv.subject_id,
    COALESCE(
        m.slug,
        g.slug,
        gcm.slug || '/' || gc.key,
        COALESCE(mpm.slug, mpg.slug, mpgcm.slug || '/' || mpgc.key) || '/' || pt.key
    )                                                        AS subject_slug,
    COALESCE(m.name_en, g.name, gc.name_en, pt.name_en)      AS subject_name_en,
    COALESCE(m.name_fa, g.name, gc.name_fa, pt.name_fa)      AS subject_name_fa,
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

-- One arm per subject_type. grade exposes a single `name` column (not
-- name_en/name_fa), so it feeds both name columns -- unchanged from 0008.
LEFT JOIN material    m  ON pv.subject_type = 'material'    AND m.id  = pv.subject_id
LEFT JOIN grade       g  ON pv.subject_type = 'grade'       AND g.id  = pv.subject_id
LEFT JOIN grade_class gc ON pv.subject_type = 'grade_class' AND gc.id = pv.subject_id
LEFT JOIN material    gcm ON gcm.id = gc.material_id

-- material_process: the technique, plus whichever of the three owners it
-- hangs from, plus that owner's material when the owner is a grade_class.
LEFT JOIN material_process    mp    ON pv.subject_type = 'material_process' AND mp.id = pv.subject_id
LEFT JOIN processing_technique pt   ON pt.id    = mp.processing_technique_id
LEFT JOIN material            mpm   ON mpm.id   = mp.material_id
LEFT JOIN grade               mpg   ON mpg.id   = mp.grade_id
LEFT JOIN grade_class         mpgc  ON mpgc.id  = mp.grade_class_id
LEFT JOIN material            mpgcm ON mpgcm.id = mpgc.material_id

WHERE pv.superseded_by IS NULL
  AND pv.status <> 'superseded'
  AND NOT EXISTS (
      SELECT 1
      FROM evidence e
      WHERE e.subject_type = 'property_value'
        AND (
            e.subject_id = pv.id
            OR e.subject_id IN (
                SELECT o.id FROM property_value o
                WHERE o.value_role = 'observation'
                  AND o.editorial_value_id = pv.id
            )
        )
  );

COMMENT ON VIEW v_unsourced_values IS
    'The citation work list: every live property value that no evidence row supports, across all four subject types (material, grade, grade_class, material_process), joined to its subject and property names. Citedness is computed from `evidence`, never from property_value.status -- status is a hand-maintained label that attaching evidence does not update (0020 step 7), and the two had already diverged. Uses the same rule as api/src/citations.ts: an editorial row counts as cited when evidence is attached to it or to any observation linked beneath it via editorial_value_id (0017); an observation row counts as cited only by its own evidence. Rewritten in 0026 -- see that migration for why the join list is long and why status was abandoned.';

INSERT INTO schema_migration (version) VALUES ('0029') ON CONFLICT DO NOTHING;

COMMIT;
