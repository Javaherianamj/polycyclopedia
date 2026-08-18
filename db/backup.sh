#!/usr/bin/env bash
#
# Polypedia database backup — NFR-D4, the highest-severity gap flagged in
# deployment-requirements.md §6: the curated database is the entire asset
# (citation coverage, source metadata, everything tools/curation/ has
# entered), and until this script existed nothing produced a copy of it
# anywhere but the one local container.
#
#   ./db/backup.sh              dump to db/backups/, timestamped
#   ./db/backup.sh --verify     dump, then restore into a throwaway database
#                                and compare row counts — a backup that has
#                                never been restored is not a backup
#
# Output is a single pg_dump custom-format file (-Fc): compressed, and
# restorable with pg_restore regardless of the target's schema state.

set -euo pipefail

DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${POLYPEDIA_BACKUP_DIR:-$DB_DIR/backups}"

if [[ -f "$DB_DIR/.env" ]]; then
    set -a; source "$DB_DIR/.env"; set +a
else
    echo "error: $DB_DIR/.env not found. Copy .env.example to .env first." >&2
    exit 1
fi

: "${POSTGRES_USER:?not set in db/.env}"
: "${POSTGRES_DB:?not set in db/.env}"
: "${POSTGRES_PORT:?not set in db/.env}"
CONTAINER="${POSTGRES_CONTAINER:-polypedia-pg}"

VERIFY=0
for arg in "$@"; do
    case "$arg" in
        --verify) VERIFY=1 ;;
        *) echo "error: unknown option '$arg'" >&2; exit 2 ;;
    esac
done

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="$BACKUP_DIR/polypedia_${STAMP}.dump"

echo "==> dumping $POSTGRES_DB from container '$CONTAINER' -> $DUMP_FILE"
docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DUMP_FILE"

SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
echo "==> done ($SIZE)"

# Keep the most recent 14 dumps locally; object-storage retention (once the
# scheduled upload exists) is a separate, longer-lived policy.
ls -1t "$BACKUP_DIR"/polypedia_*.dump 2>/dev/null | tail -n +15 | xargs -r rm --
echo "==> $(ls -1 "$BACKUP_DIR"/polypedia_*.dump | wc -l) dump(s) retained in $BACKUP_DIR"

if [[ $VERIFY -eq 1 ]]; then
    VERIFY_DB="polypedia_backup_verify"
    echo "==> verifying: restoring into throwaway database '$VERIFY_DB'"
    docker exec "$CONTAINER" psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
        -c "DROP DATABASE IF EXISTS $VERIFY_DB;" \
        -c "CREATE DATABASE $VERIFY_DB OWNER $POSTGRES_USER;"
    docker exec -i "$CONTAINER" pg_restore -U "$POSTGRES_USER" -d "$VERIFY_DB" --no-owner < "$DUMP_FILE"

    echo "==> comparing row counts, source vs restored"
    for table in material property_value citation evidence source; do
        original="$(docker exec "$CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM $table")"
        restored="$(docker exec "$CONTAINER" psql -U "$POSTGRES_USER" -d "$VERIFY_DB" -tAc "SELECT count(*) FROM $table")"
        status="OK"
        [[ "$original" != "$restored" ]] && status="MISMATCH"
        printf "    %-16s original=%-6s restored=%-6s %s\n" "$table" "$original" "$restored" "$status"
        if [[ "$status" == "MISMATCH" ]]; then
            echo "error: restore verification failed for table '$table'" >&2
            exit 1
        fi
    done

    docker exec "$CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE $VERIFY_DB;" >/dev/null
    echo "==> verified: dump restores cleanly and every row count matches"
fi
