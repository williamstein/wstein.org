#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OVERLAY_ROOT="${OVERLAY_ROOT:-$REPO_ROOT/site/overlay}"
MANIFEST="${OVERLAY_MANIFEST:-$REPO_ROOT/site/overlay-files.txt}"
SITE_ROOT="${SITE_ROOT:-/home/user/www}"
GENERATED_ROOT="${GENERATED_ROOT:-$REPO_ROOT/site/generated}"

if [[ ! -d "$SITE_ROOT" || "$SITE_ROOT" == "/" ]]; then
  echo "Refusing unsafe SITE_ROOT: $SITE_ROOT" >&2
  exit 1
fi

if [[ "${BUILD_SITE:-1}" == "1" ]]; then
  npm --prefix "$REPO_ROOT" run build:site
fi

if [[ -d "$GENERATED_ROOT" ]]; then
  cp -a "$GENERATED_ROOT/." "$SITE_ROOT/"
  echo "applied generated Astro site"
fi

while IFS= read -r relative_path || [[ -n "$relative_path" ]]; do
  [[ -z "$relative_path" || "$relative_path" == \#* ]] && continue
  if [[ "$relative_path" == /* || "$relative_path" == *".."* ]]; then
    echo "Unsafe overlay path: $relative_path" >&2
    exit 1
  fi

  source_path="$OVERLAY_ROOT/$relative_path"
  target_path="$SITE_ROOT/$relative_path"
  if [[ ! -f "$source_path" ]]; then
    echo "Missing overlay source: $source_path" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$target_path")"
  cp --preserve=mode "$source_path" "$target_path"
  echo "applied $relative_path"
done < "$MANIFEST"
