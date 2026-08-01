-- =============================================================================
-- 0009: least-privilege application role grants
-- =============================================================================
-- NFR-3 (security extension enabled) requires that the role the application
-- connects with cannot run DDL. The migration/owner role and the runtime role
-- are therefore separate:
--
--   POSTGRES_USER  (owner)  -- owns the schema, runs migrations, can DDL
--   polypedia_app  (runtime) -- SELECT/INSERT/UPDATE/DELETE only, no DDL
--
-- The role itself is created by db/run.sh, which has access to APP_DB_PASSWORD
-- from db/.env. No password appears in this file or anywhere in git.
--
-- This migration is written to be safely re-runnable: it grants only if the
-- role exists, so applying it before run.sh has created the role is a no-op
-- rather than an error.
--
-- NOTE ON ROW-LEVEL SECURITY: the policies in 0007 do not apply to a table's
-- owner unless FORCE ROW LEVEL SECURITY is set. `polypedia_app` is deliberately
-- NOT the owner, so RLS genuinely constrains it. Verify with:
--   SET ROLE polypedia_app; SELECT count(*) FROM material;
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'polypedia_app') THEN

        GRANT USAGE ON SCHEMA public TO polypedia_app;

        -- Data access, but no DDL. Note the absence of TRUNCATE and REFERENCES.
        GRANT SELECT, INSERT, UPDATE, DELETE
            ON ALL TABLES IN SCHEMA public TO polypedia_app;

        -- Identity columns need sequence access to allocate ids.
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO polypedia_app;

        -- Tables created by future migrations must inherit the same grants,
        -- otherwise the app silently loses access to anything added later.
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO polypedia_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT USAGE, SELECT ON SEQUENCES TO polypedia_app;

        -- schema_migration is migration bookkeeping. The application has no
        -- business writing to it; read-only is enough for a version check.
        REVOKE INSERT, UPDATE, DELETE ON schema_migration FROM polypedia_app;

        RAISE NOTICE 'Granted least-privilege access to polypedia_app.';
    ELSE
        RAISE NOTICE 'Role polypedia_app does not exist; skipping grants. Run db/run.sh to create it.';
    END IF;
END
$$;

INSERT INTO schema_migration (version) VALUES ('0009') ON CONFLICT DO NOTHING;
