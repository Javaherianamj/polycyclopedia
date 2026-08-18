#!/usr/bin/env bash
#
# Sync web/dist to ArvanCloud Object Storage (ابر آروان) — FR-D12: a deploy
# is a single command that syncs the build output and removes files no
# longer present.
#
# Requires the AWS CLI (ArvanCloud's object storage is S3-compatible) and
# four values that never live in this repo — export them in your shell or
# put them in web/.env.deploy (gitignored) and `source` it first:
#
#   ARVAN_S3_ENDPOINT   e.g. https://s3.ir-thr-at1.arvanstorage.ir
#   ARVAN_BUCKET        the bucket name you created in the Arvan panel
#   AWS_ACCESS_KEY_ID       the access key from Object Storage -> Access Keys
#   AWS_SECRET_ACCESS_KEY   its secret (shown once at creation — save it then)
#
#   source web/.env.deploy && ./web/deploy.sh
#
# FR-D11: two sync passes, different cache policy. _astro/ filenames are
# content-hashed by the build -- a changed file gets a new name, so it is
# safe to cache forever. Everything else (HTML, robots.txt, sitemap.xml) can
# change without its filename changing, so it must be revalidated on every
# request or a redeploy would be invisible until the cache naturally expired.

set -euo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$WEB_DIR/dist"

: "${ARVAN_S3_ENDPOINT:?export ARVAN_S3_ENDPOINT (see this script's header)}"
: "${ARVAN_BUCKET:?export ARVAN_BUCKET (see this script's header)}"
: "${AWS_ACCESS_KEY_ID:?export AWS_ACCESS_KEY_ID (see this script's header)}"
: "${AWS_SECRET_ACCESS_KEY:?export AWS_SECRET_ACCESS_KEY (see this script's header)}"

if [[ ! -d "$DIST_DIR" ]]; then
    echo "error: $DIST_DIR does not exist. Run 'npm run build' in web/ first." >&2
    exit 1
fi

echo "==> syncing hashed assets (_astro/) with a 1-year immutable cache"
aws s3 sync "$DIST_DIR/_astro" "s3://$ARVAN_BUCKET/_astro" \
    --endpoint-url "$ARVAN_S3_ENDPOINT" \
    --cache-control "public, max-age=31536000, immutable" \
    --delete

echo "==> syncing everything else with a short, revalidate-on-every-request cache"
aws s3 sync "$DIST_DIR" "s3://$ARVAN_BUCKET" \
    --endpoint-url "$ARVAN_S3_ENDPOINT" \
    --exclude "_astro/*" \
    --cache-control "public, max-age=0, must-revalidate" \
    --delete

echo "==> done. If the CDN cloud is enabled, purge the cache for changed HTML paths"
echo "    (Arvan panel -> CDN -> Purge), or wait for max-age=0 to revalidate on next request."
