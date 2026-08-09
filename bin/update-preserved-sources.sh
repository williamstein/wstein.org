#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_root="${ARCHIVE_ROOT:-/home/user/www}"
destination_root="$repo_root/preserved/www"
mode="update"
max_bytes=$((2 * 1024 * 1024))

if [[ "${1:-}" == "--check" ]]; then
  mode="check"
  shift
fi
if (($#)); then
  echo "Usage: $0 [--check]" >&2
  exit 2
fi

validate_relative_path() {
  local path="$1"
  if [[ -z "$path" || "$path" == /* || "/$path/" == *"/../"* ]]; then
    echo "Unsafe manifest path: $path" >&2
    exit 1
  fi
}

validate_text_source() {
  local path="$1"
  local logical_path="$2"
  local name="${logical_path##*/}"
  local size

  case "$name" in
    README*|Makefile|makefile|*.bib|*.cls|*.md|*.py|*.rst|*.sage|*.sty|*.tex|*.txt) ;;
    *) echo "Disallowed preservation file type: $path" >&2; exit 1 ;;
  esac

  size="$(stat -c %s "$path")"
  if ((size > max_bytes)); then
    echo "Preservation source exceeds ${max_bytes} bytes: $path" >&2
    exit 1
  fi
  if [[ -s "$path" ]] && ! LC_ALL=C grep -Iq . "$path"; then
    echo "Preservation source appears to be binary: $path" >&2
    exit 1
  fi
}

store_or_compare() {
  local source="$1"
  local relative_destination="$2"
  local destination="$destination_root/$relative_destination"

  validate_relative_path "$relative_destination"
  validate_text_source "$source" "$relative_destination"
  if [[ "$mode" == "check" ]]; then
    if [[ ! -f "$destination" ]] || ! cmp -s "$source" "$destination"; then
      echo "Stale or missing preserved source: $relative_destination" >&2
      echo "Review the archive change, then run ./bin/update-preserved-sources.sh" >&2
      exit 1
    fi
  else
    install -D -m 0644 "$source" "$destination"
    echo "preserved $relative_destination"
  fi
}

count=0
while IFS= read -r relative_path || [[ -n "$relative_path" ]]; do
  [[ -z "$relative_path" || "$relative_path" == \#* ]] && continue
  validate_relative_path "$relative_path"
  source="$source_root/$relative_path"
  [[ -f "$source" ]] || { echo "Missing preservation source: $source" >&2; exit 1; }
  store_or_compare "$source" "$relative_path"
  ((count += 1))
done < "$repo_root/preservation/text-files.txt"

temporary_file="$(mktemp)"
trap 'rm -f "$temporary_file"' EXIT
while IFS='|' read -r archive member destination || [[ -n "${archive:-}" ]]; do
  [[ -z "$archive" || "$archive" == \#* ]] && continue
  validate_relative_path "$archive"
  validate_relative_path "$member"
  validate_relative_path "$destination"
  archive_path="$source_root/$archive"
  [[ -f "$archive_path" ]] || { echo "Missing preservation archive: $archive_path" >&2; exit 1; }
  tar -xOf "$archive_path" "$member" > "$temporary_file" || {
    echo "Could not extract $member from $archive" >&2
    exit 1
  }
  store_or_compare "$temporary_file" "$destination"
  ((count += 1))
done < "$repo_root/preservation/archive-members.txt"

if [[ "$mode" == "check" ]]; then
  echo "Preserved sources are current ($count files)."
else
  echo "Updated $count preserved source files."
fi
