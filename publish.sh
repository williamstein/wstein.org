#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
site_root="${SITE_ROOT:-/home/user/www}"
sync_mode="fast"

usage() {
  cat <<'EOF'
Usage: ./publish.sh [--no-sync | --dry-run | --full]

Builds maintained content, applies the tracked site overlay, runs checks, and
uploads changed files to R2.

  --no-sync  Build and check locally without contacting R2.
  --dry-run  Show the R2 changes without uploading or advancing the marker.
  --full     Reconcile deletions using the manifest scanner (slower).

Environment:
  PUBLISH_FORCE_DOCUMENTS=1  Rebuild CV and ANT regardless of timestamps.
  PUBLISH_SKIP_DOCUMENTS=1   Skip CV and ANT rebuild checks.
EOF
}

while (($#)); do
  case "$1" in
    --no-sync) sync_mode="none" ;;
    --dry-run) sync_mode="dry-run" ;;
    --full) sync_mode="full" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

cd "$repo_root"
started_at=$SECONDS

step() {
  printf '\n==> %s\n' "$1"
}

sources_are_newer() {
  local source_path="$1"
  local target_path="$2"
  [[ ! -e "$target_path" ]] && return 0
  [[ -n "$(find "$source_path" -type f -newer "$target_path" -print -quit)" ]]
}

step "Build Astro site"
npm run build:site

if [[ "${PUBLISH_SKIP_DOCUMENTS:-0}" != "1" ]]; then
  if [[ "${PUBLISH_FORCE_DOCUMENTS:-0}" == "1" ]] || sources_are_newer "$repo_root/documents/cv" "$site_root/cv/cv.pdf"; then
    step "Rebuild CV"
    npm run build:cv
  else
    echo "CV sources unchanged; keeping current generated files."
  fi

  if [[ "${PUBLISH_FORCE_DOCUMENTS:-0}" == "1" ]] || sources_are_newer "$repo_root/documents/ant/source" "$site_root/books/ant/ant/index.html"; then
    step "Rebuild Algebraic Number Theory HTML"
    npm run build:ant
  else
    echo "ANT sources unchanged; keeping current generated files."
  fi
fi

step "Apply maintained site overlay"
BUILD_SITE=0 "$repo_root/bin/apply-site-overlay.sh"

step "Run publication checks"
"$repo_root/bin/check.sh"
"$repo_root/bin/update-preserved-sources.sh" --check

case "$sync_mode" in
  none)
    step "Skip R2 sync"
    echo "Local build and checks complete."
    ;;
  dry-run)
    step "Preview fast R2 sync"
    DRY_RUN=1 "$repo_root/bin/fast-sync-r2.sh"
    ;;
  full)
    step "Full R2 reconciliation"
    DELETE_CHECK=1 "$repo_root/bin/fast-sync-r2.sh"
    ;;
  fast)
    step "Fast R2 sync"
    "$repo_root/bin/fast-sync-r2.sh"
    ;;
esac

printf '\nPublish completed in %ss.\n' "$((SECONDS - started_at))"
