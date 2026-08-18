# Resume

`resume.tex` is the source of truth for the PDF at `public/MyResume.pdf`.

It mirrors the site content in `src/pages/` — `about/about.md`, `works/`, `projects/`,
`studies/`, and the skill list in `src/components/Skills.astro`. When you add or remove a
project on the site, change it here too.

## It has to stay one page

Bullets are written to land on a single line each wherever possible, which is what keeps
the page count down — a bullet that grows past ~110 characters wraps and costs a whole
line. There are only a few lines of slack, so recompile and check the page count whenever
you add anything. The fallback knobs, cheapest first, are noted at the top of `resume.tex`.

## Building

Only packages from a standard TeX distribution are used, so no `.cls` file needs to travel
with it. It targets `pdflatex` specifically (`\pdfgentounicode=1` makes the output text
selectable and ATS-parsable, and is a pdfTeX primitive — XeLaTeX will not accept it).

```bash
pdflatex resume.tex
```

Or paste it into a blank Overleaf project and set the compiler to pdfLaTeX.

To publish the result on the site:

```bash
cp resume.pdf ../public/MyResume.pdf
```
