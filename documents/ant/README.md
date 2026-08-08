# Algebraic Number Theory web edition

`bin/build-ant-html.sh` creates the public chapter-by-chapter HTML edition from
the tracked TeX source using LaTeXML. The source directory is a text-only
snapshot of <https://github.com/williamstein/ant> at commit
`97343f5d6c851aac0fdfd1af3818965ac27359fd`.

The script uses `documents/ant/source` by default and installs the result in
`/home/user/www/books/ant/ant`. Set `ANT_SOURCE_ROOT` to build another checkout.
It works around the currently missing upstream `computing.tex` include and
converts the custom Sage display environments to static verbatim blocks before
running LaTeXML.

Ubuntu prerequisites:

```bash
sudo apt-get install texlive-latex-extra texlive-fonts-recommended \
  texlive-extra-utils texlive-bibtex-extra latexml
```
