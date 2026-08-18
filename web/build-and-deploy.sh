#!/usr/bin/env bash
#
# One-command static deploy (v1 CD). Chains the three steps README documents
# separately, in the right order, with guards so a half-built or stale deploy
# can't happen silently:
#
#   1. build the search index   (npm run build:search-index)
#   2. build the static site    (npm run build  -> web/dist)
#   3. sync to Arvan storage     (./deploy.sh)
#
# WHY THIS EXISTS: the real curated data lives in the local Postgres, so the
# real site is built LOCALLY against the running API, then uploaded. CI cannot
# do this yet (it has no real data). See
# aidlc-docs/inception/plans/deployment-cicd-backup-plan.md §3.
#
# PREREQUISITES (this script checks them and fails loudly if missing):
#   - the local DB is up to date:      ./db/run.sh   (+ curation imports)
#   - the API is running:              cd api && npm run dev   (serves :3001)
#   - Arvan object-storage creds set:  web/.env.deploy (gitignored) with
#       ARVAN_S3_ENDPOINT, ARVAN_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
#
# USAGE:
#   ./web/build-and-deploy.sh              # build + deploy
#   ./web/build-and-deploy.sh --build-only # build, skip the upload (dry run of the build)

set -euo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WEB_DIR"

BUILD_ONLY=0
for arg in "$@"; do
    case "$arg" in
        --build-only) BUILD_ONLY=1 ;;
        *) echo "error: unknown option '$arg' (use --build-only)" >&2; exit 2 ;;
    esac
done

API_BASE="${PUBLIC_API_BASE_URL:-http://localhost:3001}"

# --- Guard 1: Arvan creds (only needed for the real upload) ------------------
if [[ $BUILD_ONLY -eq 0 ]]; then
    if [[ -f "$WEB_DIR/.env.deploy" ]]; then
        # shellcheck disable=SC1091
        set -a; source "$WEB_DIR/.env.deploy"; set +a
    fi
    missing=()
    for v in ARVAN_S3_ENDPOINT ARVAN_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
        [[ -n "${!v:-}" ]] || missing+=("$v")
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "error: missing deploy credentials: ${missing[*]}" >&2
        echo "       put them in web/.env.deploy (gitignored) — see web/deploy.sh header." >&2
        echo "       or run with --build-only to build without uploading." >&2
        exit 1
    fi
fi

# --- Guard 2: the API must be reachable, or the build produces an empty site -
echo "==> checking the API is reachable at $API_BASE"
if ! curl -fsS --max-time 5 "$API_BASE/health" >/dev/null 2>&1; then
    echo "error: the API at $API_BASE is not responding." >&2
    echo "       the static build reads the live API at build time; without it the" >&2
    echo "       site would build empty. Start it first:" >&2
    echo "         ./db/run.sh            # ensure the DB is loaded" >&2
    echo "         (cd api && npm run dev) # serve the API on :3001" >&2
    exit 1
fi
echo "    API OK"

# --- Step 1: search index ----------------------------------------------------
echo "==> building search index"
npm run build:search-index

# --- Step 2: static site -----------------------------------------------------
echo "==> building static site (PUBLIC_API_BASE_URL=$API_BASE)"
PUBLIC_API_BASE_URL="$API_BASE" npm run build

if [[ $BUILD_ONLY -eq 1 ]]; then
    echo "==> --build-only: web/dist is ready, skipping upload."
    exit 0
fi

# --- Step 3: deploy ----------------------------------------------------------
echo "==> deploying web/dist to Arvan object storage"
"$WEB_DIR/deploy.sh"

echo "==> done."
