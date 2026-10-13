#!/bin/bash
# Deploys the newest GitHub Release. Run from cPanel cron every few minutes.
# Outbound HTTPS only: no inbound SSH or IP whitelist needed.
set -euo pipefail

REPO="alexgrant20/Nutric"
DEPLOY_DIR="/home/USER/nutric/app"
# Optional. Leave empty to auto-detect ~/nodevenv/<app root>/<version>/bin/activate.
NODE_ACTIVATE=""

cd "$DEPLOY_DIR"
exec 9>.deploy.lock
flock -n 9 || exit 0

# /releases/latest redirects to /releases/tag/<tag>; no API call, no rate limit.
tag=$(curl -fsSI -o /dev/null -w '%{redirect_url}' "https://github.com/$REPO/releases/latest")
tag=${tag##*/}
[[ "$tag" == build-* ]] || { echo "No release found." >&2; exit 1; }
[[ "$tag" == "$(cat .release-tag 2>/dev/null || true)" ]] && exit 0

echo "$(date -u +%FT%TZ) deploying $tag"
rm -rf .incoming
mkdir .incoming
curl -fsSL "https://github.com/$REPO/releases/download/$tag/nutric-production.tar.gz" | tar -xz -C .incoming

# Only build/, drizzle/ and native/ are replaced; data, .env, node_modules and tmp/ stay.
rm -rf build drizzle native
mv .incoming/build .incoming/drizzle .incoming/native .
mv -f .incoming/package.json .incoming/package-lock.json .incoming/app.cjs .
rm -rf .incoming

set +u
if [[ -n "$NODE_ACTIVATE" ]]; then
	eval "$NODE_ACTIVATE"
else
	activate=$(ls -d "$HOME/nodevenv/${DEPLOY_DIR#$HOME/}"/*/bin/activate 2>/dev/null | sort -V | tail -n1 || true)
	if [[ -n "$activate" ]]; then source "$activate"; fi
fi
set -u
command -v npm >/dev/null || { echo "npm not found. Set NODE_ACTIVATE." >&2; exit 1; }

npm ci --omit=dev
# Replace the prebuild that needs a newer glibc than this host has.
cp native/better_sqlite3.node node_modules/better-sqlite3/prebuilds/linux-x64.node
mkdir -p tmp
touch tmp/restart.txt
echo "$tag" > .release-tag
echo "$(date -u +%FT%TZ) done $tag"
