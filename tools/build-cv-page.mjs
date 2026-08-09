import { readFile, writeFile } from "node:fs/promises";
import { parse, serializeOuter } from "parse5";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("usage: build-cv-page.mjs INPUT OUTPUT");
}

const document = parse(await readFile(inputPath, "utf8"));

function getAttr(node, name) {
  return node.attrs?.find((attr) => attr.name === name)?.value;
}

function setAttr(node, name, value) {
  node.attrs ??= [];
  const attr = node.attrs.find((entry) => entry.name === name);
  if (attr) attr.value = value;
  else node.attrs.push({ name, value });
}

function hasClass(node, className) {
  return getAttr(node, "class")?.split(/\s+/).includes(className) ?? false;
}

function addClass(node, className) {
  const classes = new Set((getAttr(node, "class") ?? "").split(/\s+/).filter(Boolean));
  classes.add(className);
  setAttr(node, "class", [...classes].join(" "));
}

function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes ?? []) {
    const result = find(child, predicate);
    if (result) return result;
  }
}

function textContent(node) {
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(textContent).join("");
}

function elementChildren(node, tagName) {
  return (node.childNodes ?? []).filter((child) => !tagName || child.tagName === tagName);
}

const article = find(document, (node) => hasClass(node, "ltx_document"));
if (!article) throw new Error("LaTeXML output contains no document article");
addClass(article, "cv-document");

const sectionList = find(article, (node) => {
  if (node.tagName !== "ul") return false;
  const firstItem = elementChildren(node, "li")[0];
  return firstItem && /Employment/.test(textContent(firstItem).slice(0, 100));
});
if (!sectionList) throw new Error("LaTeXML output contains no CV section list");
addClass(sectionList, "cv-sections");

const sectionIds = new Map([
  ["employment", "employment"],
  ["education", "education"],
  ["prizes", "prizes"],
  ["grants", "grants"],
  ["publications", "publications"],
  ["books", "books"],
  ["computation", "software"],
  ["selected teaching", "teaching"],
  ["ph.d. students", "students"],
  ["other activities", "activities"],
  ["personal", "personal"],
  ["references", "references"],
]);

for (const item of elementChildren(sectionList, "li")) {
  const label = elementChildren(item).find((child) => hasClass(child, "ltx_tag"));
  if (!label) continue;
  const title = textContent(label).replace(/\s+/g, " ").trim();
  const id = sectionIds.get(title.toLowerCase());
  if (!id) continue;

  addClass(item, "cv-section");
  setAttr(item, "id", id);
  setAttr(item, "aria-labelledby", `${id}-title`);

  label.nodeName = "h2";
  label.tagName = "h2";
  label.attrs = [{ name: "class", value: "cv-section__title" }, { name: "id", value: `${id}-title` }];
  label.childNodes = [{ nodeName: "#text", value: title, parentNode: label }];
}

const cvContent = serializeOuter(article);
const primaryNav = [
  ["/about/", "About"],
  ["/research/", "Research"],
  ["/software/", "Software"],
  ["/papers/", "Papers"],
  ["/books/", "Books"],
  ["/talks/", "Talks"],
  ["/courses/", "Courses"],
  ["/Tables/", "Data"],
  ["/pics/", "Photos"],
];
const sectionNav = [
  ["employment", "Employment"],
  ["education", "Education"],
  ["publications", "Publications"],
  ["books", "Books"],
  ["software", "Software"],
  ["teaching", "Teaching"],
  ["students", "Students"],
  ["activities", "Activities"],
];

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Curriculum vitae of William A. Stein, mathematician and software builder.">
    <link rel="icon" href="/favicon.ico">
    <link rel="stylesheet" href="/assets/site.css">
    <link rel="stylesheet" href="/cv/site.css">
    <title>Curriculum Vitae - William A. Stein</title>
  </head>
  <body>
    <header class="site-header">
      <div class="site-header__inner">
        <a class="site-identity" href="/" aria-label="William A. Stein, home">
          <span class="site-identity__mark" aria-hidden="true">W</span>
          <span>William A. Stein</span>
        </a>
        <nav class="site-nav" aria-label="Primary navigation">
          ${primaryNav.map(([href, label]) => `<a href="${href}">${label}</a>`).join("\n          ")}
        </nav>
      </div>
    </header>
    <main class="page-main cv-page">
      <header class="page-intro page-width cv-intro">
        <p class="breadcrumb"><a href="/">Home</a> / Curriculum vitae</p>
        <div class="cv-intro__layout">
          <div>
            <p class="eyebrow">Updated August 2026</p>
            <h1>Curriculum vitae</h1>
            <p class="lead">William A. Stein, software builder and mathematician. Founder of SageMath, CoCalc, and Sage.js.</p>
          </div>
          <div class="cv-actions" aria-label="CV formats">
            <a class="button button--primary" href="/cv/cv.pdf">PDF</a>
            <a class="button button--outline" href="/cv/cv.tex">TeX source</a>
          </div>
        </div>
      </header>
      <nav class="cv-jump" aria-label="Curriculum vitae sections">
        <div class="page-width">
          ${sectionNav.map(([id, label]) => `<a href="#${id}">${label}</a>`).join("\n          ")}
        </div>
      </nav>
      <div class="cv-content page-width">
        ${cvContent}
      </div>
    </main>
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div>
          <strong>William A. Stein</strong>
          <p>Software, mathematics, and a personal archive maintained since the 1990s.</p>
        </div>
        <div class="site-footer__links">
          <a href="mailto:wstein@sagemath.com">Email</a>
          <a href="https://github.com/williamstein">GitHub</a>
          <a href="/cv/cv.pdf">PDF CV</a>
        </div>
      </div>
    </footer>
  </body>
</html>
`;

await writeFile(outputPath, html);
