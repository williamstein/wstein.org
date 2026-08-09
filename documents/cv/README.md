# Curriculum vitae

The maintained TeX source for William Stein's CV lives here so the document is
preserved with the rest of the site's high-value text source.

Build and install the public HTML, PDF, and source files with:

```bash
bin/build-cv.sh
```

The script requires `pdflatex` and `latexmlc` and writes to
`/home/user/www/cv` by default. LaTeXML converts a temporary normalized copy;
`cv.tex` remains the single source for both editions.
