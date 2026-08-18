-- 0014_updated_at_triggers.sql
-- Polypedia: make updated_at actually mean something.
--
-- Found while auditing the schema on 2026-08-05. Twenty-five tables carry an
-- `updated_at timestamptz NOT NULL DEFAULT now()` column, several of them
-- added by explicit post-review defect fixes whose stated purpose was "this
-- is ongoing mutable data, so it gets an audit trail" (see the comments in
-- 0002, 0003, 0004, 0006). But nothing ever advanced the column. DEFAULT now()
-- fires on INSERT only, so updated_at was simply a second, slightly less
-- accurate copy of created_at on every row in the database:
--
--     UPDATE field SET sort_order = sort_order WHERE key = 'thermoplastics';
--     SELECT created_at = updated_at FROM field WHERE key = 'thermoplastics';
--      ?column?
--     ----------
--      t          <- after an UPDATE. It should be false.
--
-- Two of the curation tools (import_values.py, import_materials.py) do set
-- `updated_at = now()` by hand in their UPDATE statements, which is precisely
-- the problem: the invariant was being maintained by convention in the two
-- places someone remembered, and silently violated everywhere else -- the API,
-- psql, any future writer. Design principle 3 of the schema design says
-- invariants are enforced by constraints, not by convention. This is that,
-- applied to the one place it had been missed.
--
-- The hand-written `updated_at = now()` assignments in the Python tools are
-- left alone. They are now redundant rather than wrong: the trigger overwrites
-- the value with the same now(), so behaviour is unchanged and there is no
-- coordination needed between this migration and the tools.

BEGIN;

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    -- now() is the transaction timestamp, so every row touched by one
    -- statement gets an identical stamp -- which is the useful semantic for
    -- "when was this changed", as opposed to clock_timestamp()'s per-row drift.
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at() IS
    'Maintains updated_at on any table carrying that column. Attached by the DO block in 0014 to every base table that has one; a new table with an updated_at column must attach it too -- see that block for the one-liner.';

-- Attached by loop rather than by 25 hand-written CREATE TRIGGER statements:
-- the list is derived from the catalog, so it cannot drift out of step with
-- what the columns actually are, and a table added between writing and running
-- this migration is still covered.
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables tb
          ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
        WHERE c.table_schema = 'public'
          AND c.column_name = 'updated_at'
          AND tb.table_type = 'BASE TABLE'
        ORDER BY c.table_name
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
    END LOOP;
END
$$;

INSERT INTO schema_migration (version) VALUES ('0014') ON CONFLICT DO NOTHING;

COMMIT;
