# wstein.org site audit

This tool inventories the legacy static site and checks references using the same
resolution rules as the Cloudflare Worker: exact object, extensionless `.html`,
directory `index.html`, directory redirects/listings, and internal symlink aliases.

Run it with:

```bash
cd /home/user/wstein-site-audit
npm run audit
```

The browsable report is written to `report/index.html`. CSV files contain the full
finding sets; `report/summary.json` is intended for scripts and later migration work.

Reachability is reported both from `/` alone and from the configured major section
entry points. Valid generated R2 directory listings are expanded through their
subtrees. This deliberately treats listed content as visitor-discoverable, though a
directory with more than 1,000 immediate entries may be over-counted because of the
Worker's listing limit. JavaScript-generated URLs and references inside arbitrary
source/data formats are outside the audit.
