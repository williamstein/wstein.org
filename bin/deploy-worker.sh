#!/usr/bin/env bash
set -euo pipefail

cd /home/user/wstein-r2-worker

set -a
source /home/user/.cloudflare-r2.env
set +a

WORKERS_TOKEN_FILE="${WORKERS_TOKEN_FILE:-/run/secrets/cocalc/cloudflare-workers-token.txt}"
if [[ -s "$WORKERS_TOKEN_FILE" ]]; then
  CLOUDFLARE_API_TOKEN="$(tr -d '\r\n' < "$WORKERS_TOKEN_FILE")"
  export CLOUDFLARE_API_TOKEN
fi

./bin/generate-symlink-map.sh

node -e '
const fs = require("fs");
const path = "wrangler.jsonc";
const bucket = process.env.R2_BUCKET;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!bucket) throw new Error("R2_BUCKET is not set");
if (!account) throw new Error("CLOUDFLARE_ACCOUNT_ID is not set");
let s = fs.readFileSync(path, "utf8");
const config = JSON.parse(s);
config.account_id = account;
for (const binding of config.r2_buckets || []) {
  if (binding.binding === "SITE_BUCKET") binding.bucket_name = bucket;
}
fs.writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
'

npx wrangler deploy
