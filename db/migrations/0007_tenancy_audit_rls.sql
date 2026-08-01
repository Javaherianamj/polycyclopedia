-- 0007_tenancy_audit_rls.sql
-- Polypedia database-core: tenancy, audit, row-level security (schema-design.md section 8).

BEGIN;

-- ---------------------------------------------------------------------------
-- 8.1 tenant
-- ---------------------------------------------------------------------------

CREATE TABLE tenant (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug        text NOT NULL UNIQUE,
    name        text NOT NULL,
    status      text NOT NULL DEFAULT 'active',
    -- Defect fix (post-review): tenant had no audit timestamps; status
    -- (active/suspended/...) is exactly the kind of field that mutates
    -- over a tenant's lifetime and should have a visible history.
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tenant IS
    'Seeded empty in this unit. grade and tenant_id cost one table and one nullable column today; retrofitting them after hundreds of materials exist would be a rewrite (design principle 4).';

-- Deferred FKs from 0003_materials.sql / 0005_property_values.sql: those
-- tables were created before `tenant` existed in the migration order, so the
-- tenant_id columns were added as plain bigint and the FK constraints are
-- attached now. See the header comment in 0003_materials.sql.
ALTER TABLE material
    ADD CONSTRAINT material_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant (id);

ALTER TABLE grade
    ADD CONSTRAINT grade_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant (id);

ALTER TABLE property_value
    ADD CONSTRAINT property_value_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenant (id);

-- ---------------------------------------------------------------------------
-- 8.2 audit_log
-- ---------------------------------------------------------------------------

CREATE TABLE audit_log (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor       text,
    entity      text,
    entity_id   bigint,
    action      text,
    before      jsonb,
    after       jsonb,
    at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_log IS
    'Generic before/after audit trail, keyed loosely by (entity, entity_id) rather than FK''d to every possible table — this is a cross-cutting log, not a per-table history.';

CREATE INDEX idx_audit_log_entity ON audit_log (entity, entity_id);
CREATE INDEX idx_audit_log_at ON audit_log (at);

-- ---------------------------------------------------------------------------
-- Row-level security on material, grade, property_value
-- ---------------------------------------------------------------------------
--
-- Policy: a row is visible when it is master data (tenant_id IS NULL) or
-- when it belongs to the tenant identified by the session-local setting
-- app.tenant_id. current_setting(..., true) is used (the "missing_ok"
-- form) so that a session which never sets app.tenant_id gets NULL instead
-- of an error; NULL = <anything> is NULL (not true) under three-valued
-- logic, so such a session sees only master data, which is the safe
-- default.
--
-- NOTE: PostgreSQL row-level security does NOT apply to the table owner
-- by default (see the BYPASSRLS attribute / "table owner" behavior in the
-- Postgres docs on CREATE POLICY). That is expected and fine here: this
-- migration runs as the `polypedia` superuser/owner role, and the
-- application will connect as a separate, non-owner role (created in a
-- later unit) for which these policies will actually take effect.

ALTER TABLE material ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_value ENABLE ROW LEVEL SECURITY;

CREATE POLICY material_tenant_isolation ON material
    USING (
        tenant_id IS NULL
        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint
    );

CREATE POLICY grade_tenant_isolation ON grade
    USING (
        tenant_id IS NULL
        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint
    );

CREATE POLICY property_value_tenant_isolation ON property_value
    USING (
        tenant_id IS NULL
        OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint
    );

COMMENT ON POLICY material_tenant_isolation ON material IS
    'Master data (tenant_id IS NULL) is visible to all tenants; tenant-owned rows are visible only within their own tenant session. Does not apply to the table owner role — see migration header comment.';
COMMENT ON POLICY grade_tenant_isolation ON grade IS
    'Same tenant-isolation rule as material_tenant_isolation; see that policy''s comment.';
COMMENT ON POLICY property_value_tenant_isolation ON property_value IS
    'Same tenant-isolation rule as material_tenant_isolation; see that policy''s comment.';

INSERT INTO schema_migration (version) VALUES ('0007') ON CONFLICT DO NOTHING;

COMMIT;
