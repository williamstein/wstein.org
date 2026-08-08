#!/usr/bin/env bash
set -euo pipefail

source /home/user/.cloudflare-r2.env

: "${R2_BUCKET:?R2_BUCKET is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone is required. Install with: sudo apt-get update && sudo apt-get install -y rclone" >&2
  exit 1
fi

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="$R2_ENDPOINT"
export RCLONE_CONFIG_R2_REGION=auto

args=()
if [[ "${DRY_RUN:-}" == "1" ]]; then
  args+=(--dry-run)
fi

if [[ "${NO_PROGRESS:-}" == "1" ]]; then
  args+=(--stats "${RCLONE_STATS:-30s}")
else
  args+=(--progress --stats "${RCLONE_STATS:-10s}")
fi

SYNC_LOG="${SYNC_LOG:-/home/user/r2-sync.log}"

echo "Syncing /home/user/www to R2 bucket ${R2_BUCKET}"
echo "Log file: ${SYNC_LOG}"
echo "Set NO_PROGRESS=1 for quieter output or RCLONE_STATS=30s to change the stats interval."

rclone sync /home/user/www "R2:${R2_BUCKET}" \
  --config /dev/null \
  --s3-no-check-bucket \
  --s3-no-head \
  --skip-links \
  --fast-list \
  --checksum \
  --transfers 16 \
  --checkers 32 \
  --exclude '.git/**' \
  --exclude '.hg/**' \
  --exclude '.svn/**' \
  --exclude 'CVS/**' \
  --exclude '.DS_Store' \
  --exclude '*.sage-chat' \
  --exclude '*.sage-history' \
  --delete-excluded \
  --log-file "$SYNC_LOG" \
  --log-level INFO \
  "${args[@]}" \
  "$@"
