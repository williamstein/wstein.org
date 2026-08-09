#!/usr/bin/env bash
set -euo pipefail

ROOT="${SITE_ROOT:-/home/user/www}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Site root: $ROOT"
du -sh "$ROOT"
find "$ROOT" -type f | wc -l | awk '{print "File count: " $1}'
find "$ROOT" -type f -size +25M | wc -l | awk '{print "Files over 25MiB: " $1}'

echo
echo "Tooling:"
node --version
npm --version
npx wrangler --version

echo
echo "Maintained pages:"
required_pages=(
  index.html
  about/index.html
  papers/index.html
  Tables/index.html
  sga/index.html
  cv/index.html
  books/ant/ant/index.html
)
for page in "${required_pages[@]}"; do
  [[ -s "$ROOT/$page" ]] || { echo "Missing maintained page: $page" >&2; exit 1; }
  echo "ok $page"
done

echo
echo "Overlay consistency:"
while IFS= read -r relative_path || [[ -n "$relative_path" ]]; do
  [[ -z "$relative_path" || "$relative_path" == \#* ]] && continue
  cmp -s "$REPO_ROOT/site/overlay/$relative_path" "$ROOT/$relative_path" || {
    echo "Overlay differs from published tree: $relative_path" >&2
    exit 1
  }
done < "$REPO_ROOT/site/overlay-files.txt"
echo "tracked overlay matches site tree"

if rg -l -i 'cgi-bin|<form|action=' "$ROOT/Tables" -g '*.html' -g '*.htm' --glob '!**/.hg/**' | grep -q .; then
  echo "Tables contains a retired server form or CGI reference" >&2
  exit 1
fi
echo "Tables contains no server-backed controls"

git -C "$REPO_ROOT" diff --check -- . ':(exclude)preserved/**'
git -C "$REPO_ROOT" diff --cached --check -- . ':(exclude)preserved/**'
echo "maintained-source whitespace checks passed"
