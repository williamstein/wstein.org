#!/usr/bin/env bash
set -euo pipefail

cd /home/user/wstein-r2-worker
source /home/user/.cloudflare-r2.env

node -e '
const fs = require("fs");
const path = "wrangler.jsonc";
const bucket = process.env.R2_BUCKET;
if (!bucket) throw new Error("R2_BUCKET is not set");
let s = fs.readFileSync(path, "utf8");
s = s.replace(/"bucket_name":\\s*"[^"]+"/, `"bucket_name": "${bucket}"`);
fs.writeFileSync(path, s);
'

npx wrangler deploy
