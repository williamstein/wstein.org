#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/user/www"

echo "Site root: $ROOT"
du -sh "$ROOT"
find "$ROOT" -type f | wc -l | awk '{print "File count: " $1}'
find "$ROOT" -type f -size +25M | wc -l | awk '{print "Files over 25MiB: " $1}'

echo
echo "Tooling:"
node --version
npm --version
npx wrangler --version
