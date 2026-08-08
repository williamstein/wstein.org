#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_root="${ANT_SOURCE_ROOT:-$repo_root/documents/ant/source}"
site_root="${SITE_ROOT:-/home/user/www}"
target_root="${ANT_HTML_ROOT:-$site_root/books/ant/ant}"

for command_name in pdflatex bibtex latexmlc; do
  command -v "$command_name" >/dev/null || {
    echo "$command_name is required" >&2
    exit 1
  }
done

[[ -f "$source_root/ant.tex" ]] || {
  echo "ANT source not found in $source_root" >&2
  exit 1
}

build_root="$(mktemp -d "${TMPDIR:-/tmp}/wstein-ant.XXXXXX")"
trap 'rm -rf "$build_root"' EXIT
work_root="$build_root/source"
output_root="$build_root/output"
cp -a "$source_root" "$work_root"
mkdir -p "$output_root"

cd "$work_root"

# The upstream document currently references a chapter that is not in Git.
# Generate BibTeX first, before adapting display-only code for LaTeXML.
sed -i '/\\include{computing}/d' ant.tex
sed -i '/^\\author{William Stein}$/d' ant.tex
pdflatex -interaction=nonstopmode ant.tex >pdf-build.log 2>&1 || [[ -f ant.aux ]]
bibtex ant >>pdf-build.log 2>&1

# LaTeXML does not interpret the custom Sage listings package. Its code and
# output blocks are static examples, so normalize them to verbatim displays.
sed -i -E \
  -e '/\\usepackage\{sage\}/d' \
  -e '/\\bibliographystyle/d' \
  -e 's/^\\bibliography\{biblio\}/\\input{ant.bbl}/' \
  -e 's/^([[:space:]]*)\\begin\{sagecode\}.*$/\1/' \
  -e 's/^([[:space:]]*)\\end\{sagecode\}.*$/\1/' \
  -e 's/^([[:space:]]*)\\begin\{sage(cell|out)\}(\[[^]]*\])?.*$/\1\\begin{verbatim}/' \
  -e 's/^([[:space:]]*)\\end\{sage(cell|out)\}.*$/\1\\end{verbatim}/' \
  -e 's/^([[:space:]]*)\\begin\{lstlisting\}(\[[^]]*\])?.*$/\1\\begin{verbatim}/' \
  -e 's/^([[:space:]]*)\\end\{lstlisting\}.*$/\1\\end{verbatim}/' \
  -- *.tex

set +e
latexmlc \
  --dest="$output_root/index.html" \
  --format=html5 \
  --presentationmathml \
  --mathtex \
  --navigationtoc=context \
  --splitat=chapter \
  --splitnaming=labelrelative \
  ant.tex 2>&1 | tee "$build_root/latexml.log"
latexml_status=${PIPESTATUS[0]}
set -e

if [[ ! -s "$output_root/index.html" ]]; then
  echo "LaTeXML failed with status $latexml_status and produced no index" >&2
  exit "${latexml_status:-1}"
fi
if (( latexml_status != 0 )); then
  echo "LaTeXML completed with parser warnings (status $latexml_status); using generated HTML" >&2
fi

cp "$repo_root/documents/ant/site.css" "$output_root/site.css"
find "$output_root" -maxdepth 1 -name '*.html' -print0 | xargs -0 sed -i \
  -e 's#</head>#<link rel="stylesheet" href="site.css" type="text/css">\n</head>#' \
  -e 's#<body>#<body><header class="ant-sitebar"><a href="/">William A. Stein</a><nav><a href="/books/">Books</a><a href="/books/ant/ant.pdf">PDF</a><a href="https://github.com/williamstein/ant">Source</a></nav></header>#'

mkdir -p "$target_root"
cp -a "$output_root/." "$target_root/"
echo "installed modern ANT web edition in $target_root"
