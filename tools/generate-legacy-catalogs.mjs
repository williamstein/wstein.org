import { readFile, writeFile } from "node:fs/promises";
import * as parse5 from "parse5";

const dataRoot = new URL("../modern/src/data/", import.meta.url);

function walk(node) {
  return [node, ...(node.childNodes || []).flatMap(walk)];
}

function text(node) {
  return walk(node)
    .filter((child) => child.nodeName === "#text")
    .map((child) => child.value)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(node, name) {
  return node?.attrs?.find((item) => item.name === name)?.value || "";
}

function firstYear(value) {
  return value.match(/(?:19|20)\d{2}/)?.[0] || "";
}

function normalizePaperHref(href) {
  const url = new URL(href, "https://wstein.org/papers/");
  if (url.hostname === "wstein.org" || url.hostname === "www.wstein.org") {
    return `${url.pathname}${url.search}${url.hash}`;
  }
  if (url.hostname === "arxiv.org") url.protocol = "https:";
  return url.href;
}

function paperTopic(title) {
  const value = title.toLowerCase();
  if (/sage|software|algorithm|computation|magma|matrix/.test(value)) return "Computation and software";
  if (/birch|swinnerton|shafarevich|heegner|iwasawa|elliptic/.test(value)) return "Elliptic curves and BSD";
  if (/modular|hecke|manin|newform|galois/.test(value)) return "Modular forms";
  return "Number theory";
}

async function generatePapers() {
  // Keep this as a reproducible legacy import. Editorial corrections and newer
  // records live in modern/src/data/papers.ts so regeneration preserves them.
  const source = await readFile(new URL("legacy/papers-index.html", dataRoot), "utf8");
  const document = parse5.parse(source);
  const list = walk(document).find((node) => node.tagName === "ol");
  const publications = (list?.childNodes || [])
    .filter((node) => node.tagName === "li")
    .map((item) => {
      const anchor = walk(item).find((node) => node.tagName === "a");
      const title = text(anchor);
      const full = text(item);
      const citation = full.startsWith(title) ? full.slice(title.length).replace(/^[\s,.-]+/, "") : full;
      const year = firstYear(citation);
      const topic = paperTopic(title);
      return {
        title,
        href: normalizePaperHref(attribute(anchor, "href")),
        citation,
        year,
        topic,
        search: `${title} ${citation} ${year} ${topic}`.toLowerCase(),
      };
    });
  await writeFile(new URL("papers.json", dataRoot), `${JSON.stringify(publications, null, 2)}\n`);
  return publications.length;
}

function normalizeCourseLink(href) {
  if (!href) return { href: "", status: "Record only" };
  const url = new URL(href, "https://wstein.org/courses/");
  if ((url.hostname === "wstein.org" || url.hostname === "www.wstein.org") && url.pathname.startsWith("/wiki/")) {
    return { href: "", status: "Retired wiki" };
  }
  if (url.hostname === "wstein.org" || url.hostname === "www.wstein.org") {
    const pathname = url.pathname.replace(/^\/courses\/edu\//, "/edu/");
    return { href: `${pathname}${url.search}${url.hash}`, status: "Site archive" };
  }
  if (url.hostname === "github.com") return { href: url.href, status: "GitHub" };
  if (/wiki\.sagemath\.org$|^modular\.math\.washington\.edu$|^(?:www\.)?math\.berkeley\.edu$|^odin\.math\.nau\.edu$/.test(url.hostname)) {
    return { href: "", status: "Record only" };
  }
  return { href: url.href, status: "External" };
}

function courseYear(title, href) {
  const explicit = firstYear(`${title} ${href}`);
  if (explicit) return explicit;
  const short = href.match(/(?:\/|^)(0[89]|1[01])(?:\(|\/)/)?.[1];
  return short ? `20${short}` : "";
}

function courseTopic(title) {
  const value = title.toLowerCase();
  if (/sage|software|programming/.test(value)) return "Software and computation";
  if (/algebraic number|number theory|galois|modular|elliptic|riemann|birch|congruent/.test(value)) return "Number theory";
  if (/linear algebra|calculus|college algebra/.test(value)) return "Core mathematics";
  return "Seminars and workshops";
}

async function generateCourses() {
  const source = await readFile(new URL("legacy/courses-index.html", dataRoot), "utf8");
  const document = parse5.parse(source);
  const nodes = walk(document);
  const classesHeading = nodes.find((node) => node.tagName === "h2" && /classes/i.test(text(node)));
  const list = nodes.slice(nodes.indexOf(classesHeading) + 1).find((node) => node.tagName === "ol");
  const courses = [];
  for (const item of (list?.childNodes || []).filter((node) => node.tagName === "li")) {
    const anchors = walk(item).filter((node) => node.tagName === "a");
    const splitAnchors = anchors.length > 1 && anchors.every((anchor) => attribute(anchor, "href").includes("github.com"));
    const entries = splitAnchors
      ? anchors.map((anchor) => ({ title: text(anchor), href: attribute(anchor, "href") }))
      : [{ title: text(item), href: attribute(anchors[0], "href") }];
    for (const entry of entries) {
      const title = entry.title.replace(/2007 Course:.*$/, "").replace(/\s+/g, " ").trim();
      const link = normalizeCourseLink(entry.href);
      const year = courseYear(title, entry.href);
      const topic = courseTopic(title);
      courses.push({
        title,
        year,
        topic,
        ...link,
        search: `${title} ${year} ${topic} ${link.status}`.toLowerCase(),
      });
    }
  }
  courses.sort((a, b) => (b.year || "0000").localeCompare(a.year || "0000"));
  await writeFile(new URL("courses.json", dataRoot), `${JSON.stringify(courses, null, 2)}\n`);
  return courses.length;
}

const [papers, courses] = await Promise.all([generatePapers(), generateCourses()]);
console.log(`Wrote ${papers} papers and ${courses} courses.`);
