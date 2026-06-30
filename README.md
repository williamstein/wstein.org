# wstein.org R2 Worker

Static site deployment for `/home/user/www`.

## Required Secrets

Create `/home/user/.cloudflare-r2.env` with:

```bash
export CLOUDFLARE_ACCOUNT_ID="..."
export CLOUDFLARE_API_TOKEN="..."
export R2_BUCKET="wstein-org"
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
```

`CLOUDFLARE_API_TOKEN` is for `wrangler deploy`.
`R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are S3-compatible R2 credentials for uploading site files.

## Deploy

```bash
cd /home/user/wstein-r2-worker
bin/check.sh
bin/sync-r2.sh
bin/deploy-worker.sh
```

The first deployment should go to `workers.dev` first. After verifying it, add the `wstein.org/*` route or custom domain in Cloudflare.
