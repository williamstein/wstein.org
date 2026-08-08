import { readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.env.TALKS_ROOT || "/home/user/www/papers/talks";
const output = new URL("../modern/src/data/talks.json", import.meta.url);
const usefulExtensions = new Set([".pdf", ".html", ".htm", ".key", ".ppt", ".pptx"]);
const labels = new Map([
  ["acms", "ACMS"], ["ams", "AMS"], ["bsd", "BSD"], ["ccr", "CCR"],
  ["cnta", "CNTA"], ["ec", "elliptic curves"], ["ecc", "elliptic-curve cryptography"],
  ["focm", "FoCM"], ["ihp", "IHP"], ["issac", "ISSAC"], ["jmm", "JMM"],
  ["lmfdb", "LMFDB"], ["maa", "MAA"], ["magma", "Magma"], ["modabvar", "modular abelian varieties"],
  ["modform", "modular forms"], ["msri", "MSRI"], ["pyconn", "PyCon"], ["sage", "SageMath"],
  ["sagedays", "Sage Days"], ["sdsc", "SDSC"], ["sfu", "SFU"], ["sha", "Sha"],
  ["smc", "SageMathCloud"], ["sqrt5", "Q(sqrt(5))"], ["ucsd", "UCSD"], ["uiuc", "UIUC"], ["uw", "UW"],
]);

function titleFromSlug(slug) {
  const withoutDate = slug.replace(/^\d{4}(?:-?\d{2})?(?:-?\d{2})?[-_]?/, "");
  return withoutDate
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => labels.get(word.toLowerCase()) || (/^\d+$/.test(word) ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ") || slug;
}

function dateFromSlug(slug) {
  const match = slug.match(/^(\d{4})(?:-?(\d{2}))?(?:-?(\d{2}))?/);
  if (!match) return { date: "", year: "" };
  const [, year, month, day] = match;
  return { date: [year, month, day].filter(Boolean).join("-"), year };
}

const entries = await readdir(root, { withFileTypes: true });
const talks = [];
for (const entry of entries) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  const children = await readdir(path.join(root, entry.name), { withFileTypes: true });
  const formats = new Set();
  for (const child of children) {
    if (!child.isFile()) continue;
    const extension = path.extname(child.name).toLowerCase();
    if (!usefulExtensions.has(extension)) continue;
    formats.add(extension === ".htm" || extension === ".html" ? "HTML" : extension.slice(1).toUpperCase());
  }
  const { date, year } = dateFromSlug(entry.name);
  const title = titleFromSlug(entry.name);
  talks.push({
    slug: entry.name,
    title,
    date,
    year,
    href: `/talks/${encodeURIComponent(entry.name)}/`,
    formats: [...formats].sort(),
    search: `${title} ${entry.name} ${year}`.toLowerCase(),
  });
}

talks.sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.slug.localeCompare(b.slug));
await mkdir(new URL("../modern/src/data/", import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(talks, null, 2)}\n`);
console.log(`Wrote ${talks.length} talk entries to ${output.pathname}`);
