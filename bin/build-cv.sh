#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_root="${CV_SOURCE_ROOT:-$repo_root/documents/cv}"
site_root="${SITE_ROOT:-/home/user/www}"
target_root="$site_root/cv"

for command_name in pdflatex latexmlc node; do
  command -v "$command_name" >/dev/null || {
    echo "$command_name is required" >&2
    exit 1
  }
done

build_root="$(mktemp -d "${TMPDIR:-/tmp}/wstein-cv.XXXXXX")"
trap 'rm -rf "$build_root"' EXIT

cp "$source_root/cv.tex" "$source_root/revnum.sty" "$build_root/"
(
  cd "$build_root"
  pdflatex -interaction=nonstopmode -halt-on-error cv.tex >pdf-build.log 2>&1
  pdflatex -interaction=nonstopmode -halt-on-error cv.tex >>pdf-build.log 2>&1
)

# LaTeXML does not support the small 1997 revnum package. The web edition does
# not display record numbers, so use ordinary semantic lists in a build copy.
sed -i -E \
  -e '/\\usepackage\{revnum\}/d' \
  -e 's#\\begin\{revnumerate\}\[[^]]*\]#\\begin{enumerate}#g' \
  -e 's#\\end\{revnumerate\}#\\end{enumerate}#g' \
  "$build_root/cv.tex"

latexmlc \
  --dest="$build_root/cv-raw.html" \
  --format=html5 \
  --presentationmathml \
  --mathtex \
  "$build_root/cv.tex" >"$build_root/html-build.log" 2>&1

node "$repo_root/tools/build-cv-page.mjs" \
  "$build_root/cv-raw.html" \
  "$build_root/index.html"

mkdir -p "$target_root"
install -m 0644 "$build_root/cv.pdf" "$target_root/cv.pdf"
install -m 0644 "$build_root/index.html" "$target_root/index.html"
install -m 0644 "$source_root/site.css" "$target_root/site.css"
install -m 0644 "$source_root/cv.tex" "$target_root/cv.tex"
install -m 0644 "$source_root/revnum.sty" "$target_root/revnum.sty"
echo "installed HTML, PDF, and TeX CV in $target_root"
