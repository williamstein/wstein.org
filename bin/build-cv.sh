#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_root="${CV_SOURCE_ROOT:-$repo_root/documents/cv}"
site_root="${SITE_ROOT:-/home/user/www}"
target_root="$site_root/cv"

command -v pdflatex >/dev/null || {
  echo "pdflatex is required (Ubuntu package: texlive-latex-extra)" >&2
  exit 1
}

build_root="$(mktemp -d "${TMPDIR:-/tmp}/wstein-cv.XXXXXX")"
trap 'rm -rf "$build_root"' EXIT

cp "$source_root/cv.tex" "$source_root/revnum.sty" "$build_root/"
(
  cd "$build_root"
  pdflatex -interaction=nonstopmode -halt-on-error cv.tex
  pdflatex -interaction=nonstopmode -halt-on-error cv.tex
)

mkdir -p "$target_root"
install -m 0644 "$build_root/cv.pdf" "$target_root/cv.pdf"
install -m 0644 "$source_root/cv.tex" "$target_root/cv.tex"
install -m 0644 "$source_root/revnum.sty" "$target_root/revnum.sty"
echo "installed $target_root/cv.pdf"
