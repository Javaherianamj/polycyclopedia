#!/usr/bin/env bash
#
# One-command ingestion of an extraction agent's CSV output.
#
#   ./ingest.sh data.csv              # validate only, write nothing (default)
#   ./ingest.sh data.csv --commit     # validate, then write
#   ./ingest.sh data.csv --sources my_sources.csv [--commit]
#
# Dry-run is the DEFAULT on purpose. Committing is the flag you have to type,
# not the thing that happens if you forget one. Read the dry-run output before
# you pass --commit: it tells you exactly which rows would be created, which
# would supersede an existing value, and which were rejected and why.
#
# The importer is transactional per row-group and validates every row before
# writing any of them, so a rejected row never half-lands. After a successful
# --commit run it rewrites your CSV: imported rows are deleted from it, and
# rejected rows stay with the reason in an `import_error` column. So you can
# fix and re-run the same file until it's empty.

set -euo pipefail

CURATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$CURATION_DIR/../.." && pwd)"
PYTHON="$REPO_ROOT/tools/etl/.venv/bin/python"

DATA_CSV=""
SOURCES_CSV="$REPO_ROOT/curation/sources.csv"
COMMIT=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --commit)  COMMIT=1; shift ;;
        --sources) SOURCES_CSV="$2"; shift 2 ;;
        -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'; exit 0 ;;
        -*)        echo "error: unknown option '$1'" >&2; exit 2 ;;
        *)         DATA_CSV="$1"; shift ;;
    esac
done

if [[ -z "$DATA_CSV" ]]; then
    echo "usage: ./ingest.sh <data.csv> [--sources <sources.csv>] [--commit]" >&2
    exit 2
fi
[[ -f "$DATA_CSV" ]]    || { echo "error: no such file: $DATA_CSV" >&2; exit 1; }
[[ -f "$SOURCES_CSV" ]] || { echo "error: no such file: $SOURCES_CSV" >&2; exit 1; }
[[ -x "$PYTHON" ]]      || { echo "error: venv python not found at $PYTHON" >&2; exit 1; }

# Fail early with a readable message rather than a psycopg stack trace.
if ! docker exec polypedia-pg pg_isready -U polypedia >/dev/null 2>&1; then
    echo "error: the database isn't running. Try:  docker start polypedia-pg" >&2
    exit 1
fi

cd "$CURATION_DIR"

echo "==> validating $DATA_CSV (nothing will be written)"
set +e
"$PYTHON" import_values.py --dry-run --gaps-csv "$DATA_CSV" --sources-csv "$SOURCES_CSV" 2>&1 \
    | grep -v 'RuntimeWarning\|sys.prefix\|sys.exec_prefix'
DRY_STATUS=${PIPESTATUS[0]}
set -e

if [[ $COMMIT -eq 0 ]]; then
    echo
    echo "==> DRY RUN ONLY. Nothing was written."
    echo "    Re-run with --commit once the above looks right."
    exit $DRY_STATUS
fi

# A non-zero dry run means at least one row was rejected. Committing anyway is
# legitimate -- valid rows still land and the rejects stay in the file with
# their reason -- so this is a warning, not a stop.
if [[ $DRY_STATUS -ne 0 ]]; then
    echo
    echo "==> NOTE: some rows were rejected above. Valid rows will still be"
    echo "    imported; rejected ones stay in $DATA_CSV with an import_error."
fi

echo
echo "==> committing"
set +e
"$PYTHON" import_values.py --gaps-csv "$DATA_CSV" --sources-csv "$SOURCES_CSV" 2>&1 \
    | grep -v 'RuntimeWarning\|sys.prefix\|sys.exec_prefix'
RUN_STATUS=${PIPESTATUS[0]}
set -e

echo
echo "==> post-import check: published values with no citation attached"
docker exec polypedia-pg psql -U polypedia -d polypedia -tAc \
  "select count(*) from property_value pv
    where pv.status = 'published'
      and not exists (select 1 from evidence e
                       where e.subject_type = 'property_value' and e.subject_id = pv.id);" \
  | awk '{ if ($1 == "0") print "    OK - 0 orphaned published values";
           else { print "    WARNING: " $1 " published value(s) have NO citation. Investigate before publishing."; } }'

exit $RUN_STATUS
