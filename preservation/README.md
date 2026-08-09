# Preserved website sources

This directory keeps a small, reviewable copy of high-value textual source
material from the historical `/home/user/www` archive. It is intentionally not
a mirror of that archive: generated documents, scans, photos, repository
metadata, correspondence, and other large or private working files remain out
of Git.

The allowlists in `text-files.txt` and `archive-members.txt` are the source of
truth. Run this command after intentionally changing an allowlisted source:

```sh
./bin/update-preserved-sources.sh
```

`./publish.sh` runs the script with `--check` and refuses to publish when a
tracked preservation copy is missing or stale. Files below `preserved/www/`
retain their original archive-relative paths where possible. The modular-forms
book sources are extracted from `books/modform/stein-modform.tar.gz` into a
clearly named `source` directory.
