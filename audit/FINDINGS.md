# Initial audit findings

Generated from `/home/user/www` on 2026-08-08. The detailed, reproducible
results are in `report/`; rerun them with `npm run audit`.

## What was scanned

- 275,994 regular files totaling 52.5 GiB
- 21,074 HTML pages and 453 CSS files
- 470,921 HTML/CSS references
- 4,541 symlinks, including the aliases used by the R2 Worker

URL checks reproduce the deployed Worker's exact-object, extensionless HTML,
directory index/listing, redirect, and internal-symlink behavior. Generated
directory listings are treated as visitor-discoverable.

## Main findings

1. The curated homepage, Research, Papers, Books, Talks, Courses, Projects,
   Grants, Photos, `Tables/` landing page, photo timeline, and repaired
   older-photo index now have no broken internal references. The broad archive
   is much less healthy: 25,143 internal references are broken.

2. Curated entry pages now expose 12,539 of 21,078 HTML pages from the major
   navigation seeds. Another 8,539 pages remain preserved but are no longer
   pulled into the visitor graph merely by a raw Books or Talks directory
   listing. This is an intentional distinction between preservation and
   navigation, not a deletion recommendation.

3. `Tables/` needs curation rather than blanket repair. Its modern landing page
   is clean, while the underlying archive has 261 broken references, 8
   form/backend references, 4 case-sensitive path errors, and 27
   broken symlinks. Many of those symlinks still point into the retired
   `/home/was/mfd`, `/home/was/magma`, and `/home/was/papers` layouts.

4. A few imported/generated historical trees dominate the global failure
   count. A saved MathSciNet results page contributes 2,156 broken links. Old
   SGA Apache indexes and mirrors contribute thousands more. The generated
   algebraic number theory book references image files that are absent while
   similarly named `.old` files remain. These should be labeled or quarantined
   as historical captures, regenerated when source material is sound, or
   removed from navigation; repairing every individual URL is low value.

5. There are 6,975 form/backend-style references. Most are forms embedded in
   saved copies of remote sites, while a smaller set points directly at CGI,
   PHP, Python, Perl, or server-side include behavior. The complete list is in
   `report/backend-references.csv`.

6. Storage is concentrated in media: 17.1 GiB of JPEGs, 7.55 GiB of AVI, 7.50
   GiB of MP3, 3.52 GiB of PDF, and 3.13 GiB of MPEG video. About 23.4 GiB of
   non-HTML content has no reference in parsed HTML or CSS. This is a review
   queue, not a deletion list: direct external links and intentionally
   downloadable datasets are invisible to a local link graph.

7. The filesystem contains 373 broken symlinks and one symlink outside the site
   root. Separately, 39 local hard-link groups represent about 1.98 GiB of
   duplicate object storage in R2 because each pathname is uploaded as its own
   object.

8. There are at least 9 internal case mismatches. Linux/R2 path matching makes
   these real failures, including `/SAGE` versus `/sage.html` and
   `/cremona/INDEX.html` versus `/cremona/index.html`.

## Modernization status

- The maintained source now lives in a small Git repository with an Astro
  static build layered over the 52.5 GiB archive.
- The homepage, Research, Papers, Books, Talks, Courses, Projects, Grants, and
  Photos are generated from Git-tracked source. Searchable catalogs preserve
  50 publications, 134 talk directories, 44 course records, 19 student-project
  records, and 24 grant records. Three curated research guides preserve durable
  entry points into the larger archive.
- Sage.js is presented as the active 2026 research program, connecting the
  historical number-theory work, the SageMath open-software mission, CoCalc's
  browser-based collaboration, and agent-verifiable mathematical software.
- `Tables/` and the repaired older-photo entry page remain in the explicit
  Git-tracked legacy overlay and can migrate into Astro incrementally.

## Recommended order

1. Continue the modern index work with selected teaching and research
   subcollections whose current entry pages remain especially weak.
2. Quarantine imported website captures and generated trees from normal search
   and navigation. Preserve them under their URLs unless there is a clear reason
   to delete them.
3. Review the 23.4 GiB unreferenced-content report by section and media type,
   starting with old video, duplicate audio paths, and large table output.

No website files were changed or deleted by this audit.
