# wstein.org site core

This repository is the small, non-binary source of truth for the actively
maintained part of [wstein.org](https://wstein.org). The 52 GiB historical
archive remains in `/home/user/www` and Cloudflare R2; it is intentionally not
copied into Git.

## What belongs here

- `modern/`: Astro source for maintained entry pages. The static build is
  copied over the historical archive without deleting archive content.
- `documents/`: maintained TeX and presentation source for the CV and the
  generated Algebraic Number Theory web edition.
- `site/overlay/`: maintained legacy pages and shared styles that have not yet
  moved into Astro, stored at their public paths.
- `src/` and `bin/`: the Cloudflare Worker, R2 synchronization, symlink routing,
  and overlay workflow.
- `audit/`: the repeatable filesystem and link-graph audit.

Generated reports, credentials, R2 manifests, dependencies, and the generated
symlink map are ignored. Cloudflare credentials must remain in
`/run/secrets/cocalc` and `/home/user/.cloudflare-r2.env`, never in this repo.

## Edit and publish a page

Edit pages under `modern/src/` (or a remaining legacy page under
`site/overlay/`), then run:

```bash
cd /home/user/wstein-r2-worker
bin/apply-site-overlay.sh
/home/user/bin/start.sh
cd audit && npm install && npm run audit
cd ..
bin/fast-sync-r2.sh
```

`bin/apply-site-overlay.sh` builds Astro first, copies the generated static
pages into `/home/user/www`, and then applies the explicit legacy overlay
manifest. It never deletes historical files.

The Talks index is generated from the archive and committed so the high-value
catalog is preserved independently of the 52 GiB tree. Papers and Courses are
generated from tracked snapshots of their legacy indexes:

```bash
npm run generate:talks
npm run generate:catalogs
```

Astro emits it at `papers/talks/index.html`; the longstanding `/talks/` symlink
and Worker alias continue to expose it at `/talks/`.

The normalized catalogs and their legacy inputs live under `modern/src/data/`.
Regenerating the generated catalogs is deterministic and does not require the
large archive. The smaller Projects, Grants, and research-theme catalogs are
curated directly there so their high-value metadata is preserved in Git.
The maintained Research section also identifies Sage.js as the active 2026
research program and keeps that framing in the versioned site source.

The current CV and rebuilt Algebraic Number Theory web edition are also
reproducible from the tracked core:

```bash
npm run build:cv
npm run build:ant
```

The local preview is normally available at `http://127.0.0.1:8080/` and through
the CoCalc port proxy printed by `/home/user/bin/start.sh`.

If a remaining overlay file in `/home/user/www` was edited first, update the
tracked copy:

```bash
bin/capture-site-overlay.sh
```

Only paths listed in `site/overlay-files.txt` are copied in either direction.
Neither script deletes files.

## Full audit

```bash
cd /home/user/wstein-site-audit
npm install
npm run audit
./start-report.sh
```

The compatibility path `/home/user/wstein-site-audit` points into this repo.

## Deployment tooling

```bash
# Fast uploads after ordinary edits; does not delete remote files.
bin/fast-sync-r2.sh

# Full reconciliation, including remote deletion.
DELETE_CHECK=1 bin/fast-sync-r2.sh

# Regenerate aliases and deploy Worker routing changes.
bin/deploy-worker.sh
```

See `audit/FINDINGS.md` for the initial archive assessment. Before pushing to
GitHub, add the chosen empty repository as `origin`; no remote is configured by
this project automatically.
