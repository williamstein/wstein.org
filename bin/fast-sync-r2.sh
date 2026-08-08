#!/usr/bin/env bash
set -euo pipefail

cd /home/user/wstein-r2-worker
source /home/user/.cloudflare-r2.env

: "${R2_BUCKET:?R2_BUCKET is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone is required. Install with: sudo apt-get update && sudo apt-get install -y rclone" >&2
  exit 1
fi

ROOT="${FAST_SYNC_ROOT:-/home/user/www}"
STATE="${FAST_SYNC_STATE:-/home/user/wstein-r2-worker/.fast-sync-r2-state.json}"
MARKER="${FAST_SYNC_MARKER:-/home/user/wstein-r2-worker/.fast-sync-r2-marker}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="$R2_ENDPOINT"
export RCLONE_CONFIG_R2_REGION=auto

rclone_common=(
  --config /dev/null
  --s3-no-check-bucket
  --s3-no-head
  --stats "${RCLONE_STATS:-5s}"
)

if [[ "${DRY_RUN:-}" == "1" ]]; then
  rclone_common+=(--dry-run)
fi

if [[ "${DELETE_CHECK:-}" != "1" ]]; then
  if ! command -v fd >/dev/null 2>&1; then
    echo "fd is required for default fast mode. Use DELETE_CHECK=1 for the manifest scanner." >&2
    exit 1
  fi

  if [[ ! -s "$MARKER" ]]; then
    date '+%Y-%m-%d %H:%M:%S' > "$MARKER"
    echo "Initialized fast-sync mtime marker at $MARKER."
    echo "No upload was attempted. This assumes R2 already matches this checkout."
    echo "Use DELETE_CHECK=1 ./bin/fast-sync-r2.sh when you need deletions handled."
    exit 0
  fi

  SINCE="${SINCE:-$(cat "$MARKER")}"
  ABS_UPLOADS="$WORKDIR/uploads.abs"
  UPLOAD_LIST="$WORKDIR/uploads.txt"

  fd . "$ROOT" \
    --type f \
    --hidden \
    --exclude .git \
    --exclude .hg \
    --exclude .svn \
    --exclude CVS \
    --exclude .DS_Store \
    --exclude '*.sage-chat' \
    --exclude '*.sage-history' \
    --changed-after "$SINCE" \
    > "$ABS_UPLOADS"

  export ROOT ABS_UPLOADS UPLOAD_LIST
  python3 - <<'PY'
import os
import sys

root = os.environ["ROOT"].rstrip("/") + "/"
src = os.environ["ABS_UPLOADS"]
dst = os.environ["UPLOAD_LIST"]
seen = set()

with open(src, "r", encoding="utf-8") as f, open(dst, "w", encoding="utf-8") as out:
    for line in f:
        path = line.rstrip("\n")
        if not path.startswith(root):
            continue
        rel = path[len(root):]
        if "\n" in rel or "\r" in rel:
            print(f"unsupported newline in path: {rel!r}", file=sys.stderr)
            sys.exit(2)
        if rel not in seen:
            seen.add(rel)
            out.write(rel + "\n")
PY
  UPLOAD_COUNT="$(wc -l < "$UPLOAD_LIST" | tr -d ' ')"

  echo "Changed/new files since $SINCE: $UPLOAD_COUNT"

  if [[ "$UPLOAD_COUNT" == "0" ]]; then
    echo "Nothing to upload. Deletions are skipped in default fast mode."
    exit 0
  fi

  rclone copy "$ROOT" "R2:${R2_BUCKET}" \
    "${rclone_common[@]}" \
    --files-from-raw "$UPLOAD_LIST" \
    --ignore-times \
    --no-traverse \
    --transfers "${RCLONE_TRANSFERS:-16}" \
    "$@"

  if [[ "${DRY_RUN:-}" == "1" ]]; then
    echo "Dry run complete; marker was not updated."
  else
    if [[ -s "$STATE" ]]; then
      export ROOT STATE UPLOAD_LIST
      python3 - <<'PY'
import json
import os

root = os.environ["ROOT"]
state_path = os.environ["STATE"]
upload_list = os.environ["UPLOAD_LIST"]

with open(state_path, "r", encoding="utf-8") as f:
    state = json.load(f)

files = state.setdefault("files", {})
with open(upload_list, "r", encoding="utf-8") as f:
    for line in f:
        rel = line.rstrip("\n")
        full = os.path.join(root, rel.replace("/", os.sep))
        try:
            st = os.stat(full, follow_symlinks=False)
        except FileNotFoundError:
            continue
        files[rel] = [st.st_size, st.st_mtime_ns]

tmp = state_path + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump(state, f, separators=(",", ":"))
    f.write("\n")
os.replace(tmp, state_path)
PY
    fi
    date '+%Y-%m-%d %H:%M:%S' > "$MARKER"
    echo "Fast upload complete; marker updated at $MARKER."
    echo "Use DELETE_CHECK=1 ./bin/fast-sync-r2.sh when you need deletions handled."
  fi
  exit 0
fi

NEW_STATE="$WORKDIR/state.json"
UPLOAD_LIST="$WORKDIR/uploads.txt"
DELETE_LIST="$WORKDIR/deletes.txt"
SUMMARY="$WORKDIR/summary.env"

export ROOT STATE NEW_STATE UPLOAD_LIST DELETE_LIST SUMMARY

python3 - <<'PY'
import json
import os
import sys

root = os.environ["ROOT"]
state_path = os.environ["STATE"]
new_state_path = os.environ["NEW_STATE"]
uploads_path = os.environ["UPLOAD_LIST"]
deletes_path = os.environ["DELETE_LIST"]
summary_path = os.environ["SUMMARY"]

prune_dirs = {".git", ".hg", ".svn", "CVS"}
exclude_names = {".DS_Store"}
exclude_suffixes = (".sage-chat", ".sage-history")

def excluded_file(name):
    return name in exclude_names or name.endswith(exclude_suffixes)

def relpath(path):
    return os.path.relpath(path, root).replace(os.sep, "/")

files = {}
scanned = 0

for dirpath, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
    kept_dirs = []
    for name in dirnames:
        full = os.path.join(dirpath, name)
        if name in prune_dirs or os.path.islink(full):
            continue
        kept_dirs.append(name)
    dirnames[:] = kept_dirs

    for name in filenames:
        if excluded_file(name):
            continue
        full = os.path.join(dirpath, name)
        if os.path.islink(full):
            continue
        try:
            st = os.stat(full, follow_symlinks=False)
        except FileNotFoundError:
            continue
        if not os.path.isfile(full):
            continue
        path = relpath(full)
        if "\n" in path or "\r" in path:
            print(f"unsupported newline in path: {path!r}", file=sys.stderr)
            sys.exit(2)
        files[path] = [st.st_size, st.st_mtime_ns]
        scanned += 1

old_files = None
if os.path.exists(state_path):
    with open(state_path, "r", encoding="utf-8") as f:
        old = json.load(f)
    old_files = old.get("files", {})

if old_files is None:
    uploads = []
    deletes = []
    initialized = True
else:
    uploads = sorted(path for path, meta in files.items() if old_files.get(path) != meta)
    deletes = sorted(path for path in old_files if path not in files)
    initialized = False

with open(new_state_path, "w", encoding="utf-8") as f:
    json.dump({"version": 1, "root": root, "files": files}, f, separators=(",", ":"))
    f.write("\n")

with open(uploads_path, "w", encoding="utf-8") as f:
    for path in uploads:
        f.write(path + "\n")

with open(deletes_path, "w", encoding="utf-8") as f:
    for path in deletes:
        f.write(path + "\n")

with open(summary_path, "w", encoding="utf-8") as f:
    f.write(f"SCANNED={scanned}\n")
    f.write(f"UPLOAD_COUNT={len(uploads)}\n")
    f.write(f"DELETE_COUNT={len(deletes)}\n")
    f.write(f"INITIALIZED={1 if initialized else 0}\n")
PY

source "$SUMMARY"

if [[ "$INITIALIZED" == "1" ]]; then
  mkdir -p "$(dirname "$STATE")"
  mv "$NEW_STATE" "$STATE"
  echo "Initialized fast-sync manifest from $ROOT."
  echo "Tracked files: $SCANNED"
  echo "No upload was attempted. This assumes R2 already matches this checkout."
  exit 0
fi

echo "Scanned $SCANNED tracked files."
echo "Changed/new files: $UPLOAD_COUNT"
echo "Deleted files: $DELETE_COUNT"

if [[ "$UPLOAD_COUNT" == "0" && "$DELETE_COUNT" == "0" ]]; then
  echo "Nothing to sync."
  exit 0
fi

if [[ "$UPLOAD_COUNT" != "0" ]]; then
  echo "Uploading changed/new files..."
  rclone copy "$ROOT" "R2:${R2_BUCKET}" \
    "${rclone_common[@]}" \
    --files-from-raw "$UPLOAD_LIST" \
    --ignore-times \
    --no-traverse \
    --transfers "${RCLONE_TRANSFERS:-16}" \
    "$@"
fi

if [[ "$DELETE_COUNT" != "0" ]]; then
  echo "Deleting removed files..."
  rclone delete "R2:${R2_BUCKET}" \
    "${rclone_common[@]}" \
    --files-from-raw "$DELETE_LIST" \
    "$@"
fi

if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "Dry run complete; manifest was not updated."
else
  mkdir -p "$(dirname "$STATE")"
  mv "$NEW_STATE" "$STATE"
  date '+%Y-%m-%d %H:%M:%S' > "$MARKER"
  echo "Fast sync complete; manifest updated at $STATE."
fi
