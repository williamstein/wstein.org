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
export RCLONE_CONFIG_R2_ACL=private

rclone sync /home/user/www "R2:${R2_BUCKET}" \
  --fast-list \
  --checksum \
  --transfers 16 \
  --checkers 32 \
  --progress
