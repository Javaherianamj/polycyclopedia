#!/usr/bin/env bash
#
# Apply Polypedia migrations and seeds to the local development database.
#
#   ./db/run.sh            apply migrations, then seeds
#   ./db/run.sh --reset    drop and recreate the schema first (DESTRUCTIVE)
#   ./db/run.sh --migrate  migrations only, no seeds
#
# Migrations are forward-only and each records itself in `schema_migration`.
# Seeds are idempotent and safe to re-run.

set -euo pipefail

DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Credentials come from db/.env only. Nothing is defaulted to a real secret.
# ---------------------------------------------------------------------------
if [[ -f "$DB_DIR/.env" ]]; then
    set -a; source "$DB_DIR/.env"; set +a
else
    echo "error: $DB_DIR/.env not found. Copy .env.example to .env first." >&2
    exit 1
fi

: "${POSTGRES_USER:?not set in db/.env}"
: "${POSTGRES_DB:?not set in db/.env}"
CONTAINER="${POSTGRES_CONTAINER:-polypedia-pg}"

RESET=0
SEEDS=1
for arg in "$@"; do
    case "$arg" in
        --reset)   RESET=1 ;;
        --migrate) SEEDS=0 ;;
        *) echo "error: unknown option '$arg'" >&2; exit 2 ;;
    esac
done

psql_run() {
    docker exec -i "$CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 "$@"
}

# ---------------------------------------------------------------------------
# Wait for the container to accept connections rather than assuming it is up.
# ---------------------------------------------------------------------------
echo "==> waiting for postgres in container '$CONTAINER'"
for i in $(seq 1 30); do
    if docker exec "$CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        echo "    ready"
        break
    fi
    if [[ $i -eq 30 ]]; then
        echo "error: postgres did not become ready in 30s" >&2
        exit 1
    fi
    sleep 1
done

if [[ $RESET -eq 1 ]]; then
    echo "==> RESET: dropping and recreating schema public"
    psql_run -q -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
fi

# ---------------------------------------------------------------------------
# Least-privilege runtime role (see 0009_app_role_grants.sql).
# Created here because this is the only place with access to APP_DB_PASSWORD.
# ---------------------------------------------------------------------------
if [[ -n "${APP_DB_USER:-}" && -n "${APP_DB_PASSWORD:-}" ]]; then
    echo "==> ensuring application role '$APP_DB_USER'"
    psql_run -q <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_DB_USER}') THEN
        CREATE ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASSWORD}';
    ELSE
        ALTER ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASSWORD}';
    END IF;
END
\$\$;
SQL
fi

# ---------------------------------------------------------------------------
# Migrations are forward-only and immutable once applied, so the runner must
# skip versions already recorded in `schema_migration` rather than replaying
# them. Replaying is not merely wasteful -- CREATE TYPE and CREATE TABLE are
# not idempotent, so a blind re-run fails on the first enum it meets.
#
# On a fresh database `schema_migration` does not exist yet (0001 creates it),
# hence the fallback to an empty list.
# ---------------------------------------------------------------------------
APPLIED="$(psql_run -tAc \
    "SELECT version FROM schema_migration" 2>/dev/null || true)"

echo "==> applying migrations"
for f in "$DB_DIR"/migrations/*.sql; do
    base="$(basename "$f")"
    version="${base%%_*}"
    if grep -qx "$version" <<<"$APPLIED"; then
        echo "    $base (already applied, skipped)"
        continue
    fi
    echo "    $base"
    psql_run -q < "$f"
done

if [[ $SEEDS -eq 1 ]]; then
    echo "==> applying seeds"
    for f in "$DB_DIR"/seeds/*.sql; do
        echo "    $(basename "$f")"
        psql_run -q < "$f"
    done
fi

echo "==> done"
psql_run -c "
SELECT 'migrations applied' AS what, count(*)::text AS n FROM schema_migration
UNION ALL SELECT 'property definitions', count(*)::text FROM property_definition
UNION ALL SELECT 'materials',            count(*)::text FROM material
UNION ALL SELECT 'property values',      count(*)::text FROM property_value
UNION ALL SELECT 'sources',              count(*)::text FROM source
UNION ALL SELECT 'unsourced values',     count(*)::text FROM v_unsourced_values;"
