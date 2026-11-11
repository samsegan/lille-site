#!/bin/bash
# Publishes the site to Cloudflare: https://lille-music.com (and www.lille-music.com).
#
#   tools/publish_cloudflare.sh             # lille-music.com itself
#   tools/publish_cloudflare.sh round-2     # a preview only: https://round-2-lille-site.<account>.workers.dev
#
# The site is a Cloudflare Worker named "lille-site" that only serves these
# files, as they are in this folder. A preview leaves lille-music.com as it was.
#
# Needs wrangler signed in once (it stays signed in):
#   npx wrangler login --scopes account:read user:read workers:write \
#     workers_scripts:write workers_routes:write zone:read
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"
NAME="lille-site"
DOMAIN="lille-music.com"
PREVIEW=""
for arg in "$@"; do
  case "$arg" in
    -*) echo "Unknown option: $arg" >&2; exit 2 ;;
    *) PREVIEW="$(tr '[:upper:]' '[:lower:]' <<<"$arg" | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')" ;;
  esac
done

export WRANGLER_SEND_METRICS=false
wrangler() { npx --yes wrangler@4.160.0 "$@"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
OUT="$WORK/out"
mkdir "$OUT"

# only what the page loads
cp "$SITE/index.html" "$OUT"/
cp -R "$SITE"/{css,js,art,img,fonts} "$OUT"/
if [ -n "$PREVIEW" ] && ! grep -q 'content="noindex"' "$OUT/index.html"; then
  sed -i '' 's|<meta charset="utf-8">|<meta charset="utf-8">\
<meta name="robots" content="noindex">|' "$OUT/index.html"
  grep -q 'content="noindex"' "$OUT/index.html"
fi

cat >"$WORK/wrangler.jsonc" <<JSON
{
  "name": "$NAME",
  "compatibility_date": "2026-11-01",
  "assets": { "directory": "./out" },
  "workers_dev": true,
  "preview_urls": true,
  "routes": [
    { "pattern": "$DOMAIN", "custom_domain": true },
    { "pattern": "www.$DOMAIN", "custom_domain": true }
  ]
}
JSON

cd "$WORK"
SOURCE="$(git -C "$SITE" rev-parse --short HEAD)"
[ -n "$(git -C "$SITE" status --porcelain -- .)" ] && SOURCE="$SOURCE + uncommitted changes"

if [ -n "$PREVIEW" ]; then
  log="$(wrangler versions upload --preview-alias "$PREVIEW" --message "Site at $SOURCE" 2>&1)" \
    || { echo "$log" >&2; exit 1; }
  ADDRESS="$(grep -oE "https://$PREVIEW-$NAME\.[a-z0-9-]+\.workers\.dev" <<<"$log" | head -1)/"
else
  log="$(wrangler deploy --message "Site at $SOURCE" 2>&1)" || { echo "$log" >&2; exit 1; }
  ADDRESS="https://$DOMAIN/"
fi
sed -E 's/\x1b\[[0-9;]*m//g' <<<"$log" | grep -E "Success|custom domain|workers\.dev|Version ID|Preview|$DOMAIN" | grep -v subdomain || true

WANT="$(shasum -a 256 "$OUT/js/app.js" | cut -d' ' -f1)"
for _ in $(seq 1 45); do
  GOT="$(curl -fsS "${ADDRESS}js/app.js?$(date +%s)" 2>/dev/null | shasum -a 256 | cut -d' ' -f1 || true)"
  if [ "$GOT" = "$WANT" ]; then echo "Live: $ADDRESS (site at $SOURCE)"; exit 0; fi
  sleep 4
done
echo "Published, but $ADDRESS does not show this version yet (a new domain can take a few minutes)." >&2
exit 1
