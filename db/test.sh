#!/usr/bin/env bash
#
# Run the schema verification suite against the local development database.
# Everything runs in a rolled-back transaction, so this is safe against a
# seeded database.

set -euo pipefail

DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$DB_DIR/.env" ]]; then
    set -a; source "$DB_DIR/.env"; set +a
else
    echo "error: $DB_DIR/.env not found. Copy .env.example to .env first." >&2
    exit 1
fi

: "${POSTGRES_USER:?not set in db/.env}"
: "${POSTGRES_DB:?not set in db/.env}"
CONTAINER="${POSTGRES_CONTAINER:-polypedia-pg}"

fail=0
for f in "$DB_DIR"/tests/*.sql; do
    echo "==> $(basename "$f")"
    # RAISE NOTICE goes to stderr; fold it into stdout so PASS lines are visible.
    if ! docker exec -i "$CONTAINER" \
            psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q \
            < "$f" 2>&1 | grep -vE '^(NOTICE:  )?$'; then
        fail=1
    fi
    # psql's exit status, not grep's.
    if [[ ${PIPESTATUS[0]} -ne 0 ]]; then fail=1; fi
done

if [[ $fail -ne 0 ]]; then
    echo ""
    echo "SCHEMA VERIFICATION FAILED"
    exit 1
fi
echo ""
echo "Schema verification passed."
