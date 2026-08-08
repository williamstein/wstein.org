# Maintained site output

`generated/` is the ignored Astro build output from `modern/`. The apply script
copies it into `/home/user/www` without deleting anything.

`overlay/` holds maintained pages that have not yet moved to Astro. Only paths
listed in `overlay-files.txt` are copied.

Files below `overlay/` have the same relative paths as their published files in
`/home/user/www`. This is the Git-tracked, actively maintained layer of the
website. Historical files remain in `www` until they are deliberately promoted
into this overlay.

Add every promoted path to `overlay-files.txt`. Then use:

```bash
bin/capture-site-overlay.sh  # www -> Git overlay
bin/apply-site-overlay.sh    # Git overlay -> www
```

Both operations are additive and path-scoped. They do not delete archive data.
