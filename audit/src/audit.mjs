#!/usr/bin/env node

import { readFile, readdir, realpath, lstat, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(scriptDir);
const configPath = process.argv[2] || path.join(projectDir, "audit.config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const siteRoot = path.resolve(config.siteRoot);
const reportDir = path.resolve(config.reportDir);
const siteOrigin = new URL(config.siteOrigin);
const acceptedHosts = new Set(config.acceptedHosts.map((host) => host.toLowerCase()));
const startedAt = new Date();

console.log(`Auditing ${siteRoot}`);
console.log("1/5 Inventorying files and symlinks...");

const inventory = await buildInventory(siteRoot);
const files = inventory.files;
const fileMap = new Map(files.map((file) => [file.key, file]));
const fileKeys = [...fileMap.keys()].sort(compareStrings);
const htmlKeys = files.filter((file) => file.ext === "html" || file.ext === "htm").map((file) => file.key).sort(compareStrings);
const lowerKeyMap = buildLowerKeyMap(fileKeys);
const aliases = inventory.symlinks
  .filter((link) => link.status === "internal")
  .flatMap((link) => link.isDirectory
    ? [[link.key, link.target], [`${link.key}/`, `${link.target}/`]]
    : [[link.key, link.target]])
  .sort((a, b) => b[0].length - a[0].length || compareStrings(a[0], b[0]));

console.log(`    ${formatInteger(files.length)} files, ${formatBytes(inventory.totalBytes)}, ${formatInteger(inventory.symlinks.length)} symlinks`);
console.log("2/5 Parsing HTML and CSS references...");

const htmlFiles = files.filter((file) => file.ext === "html" || file.ext === "htm");
const cssFiles = files.filter((file) => file.ext === "css");
const pages = new Map();
const allReferences = [];
const malformedUrls = [];
const parseErrors = [];
const technologyCounts = new Map();

let parsedCount = 0;
await mapLimit(htmlFiles, 32, async (file) => {
  const source = await readFile(file.path, "utf8");
  const page = parseHtml(file, source);
  pages.set(file.key, page);
  allReferences.push(...page.references);
  malformedUrls.push(...page.malformedUrls);
  parseErrors.push(...page.parseErrors);
  for (const [name, count] of page.technologies) increment(technologyCounts, name, count);
  parsedCount += 1;
  if (parsedCount % 5000 === 0) console.log(`    parsed ${formatInteger(parsedCount)} / ${formatInteger(htmlFiles.length)} HTML files`);
});

await mapLimit(cssFiles, 32, async (file) => {
  const source = await readFile(file.path, "utf8");
  allReferences.push(...parseCss(file, source));
});

console.log(`    ${formatInteger(allReferences.length)} references found`);
console.log("3/5 Resolving internal URLs and constructing the page graph...");

const brokenLinks = [];
const caseMismatches = [];
const backendReferences = [];
const externalHosts = new Map();
const pageGraph = new Map([...pages.keys()].map((key) => [key, new Set()]));
const listingGraph = new Map([...pages.keys()].map((key) => [key, new Set()]));
const referencedFiles = new Set();
const incomingPageLinks = new Map([...pages.keys()].map((key) => [key, 0]));
const idsByPage = new Map([...pages].map(([key, page]) => [key, page.ids]));

for (const reference of allReferences) {
  const interpreted = interpretReference(reference);
  reference.interpreted = interpreted;

  if (interpreted.type === "external") {
    const host = interpreted.host.toLowerCase();
    const item = externalHosts.get(host) || { host, count: 0, pages: new Set() };
    item.count += 1;
    item.pages.add(reference.sourceKey);
    externalHosts.set(host, item);
    continue;
  }
  if (interpreted.type === "ignored") continue;
  if (interpreted.type === "malformed") {
    malformedUrls.push(findingFrom(reference, { reason: interpreted.reason }));
    continue;
  }

  if (isBackendReference(reference, interpreted)) {
    backendReferences.push(findingFrom(reference, {
      target: interpreted.url,
      reason: backendReason(reference, interpreted),
    }));
  }

  const resolution = resolvePath(interpreted.pathname);
  reference.resolution = resolution;
  if (resolution.status === "object") {
    referencedFiles.add(resolution.key);
    if (pages.has(resolution.key)) {
      pageGraph.get(reference.sourceKey)?.add(resolution.key);
      incomingPageLinks.set(resolution.key, (incomingPageLinks.get(resolution.key) || 0) + 1);
      if (interpreted.fragment && !idsByPage.get(resolution.key)?.has(interpreted.fragment)) {
        brokenLinks.push(findingFrom(reference, {
          target: interpreted.url,
          reason: "missing-fragment",
          resolvedKey: resolution.key,
        }));
      }
    }
    continue;
  }
  if (resolution.status === "directory-redirect" || resolution.status === "directory-listing") {
    if (pages.has(reference.sourceKey)) listingGraph.get(reference.sourceKey).add(resolution.prefix);
    continue;
  }

  const caseMatch = findCaseMismatch(interpreted.pathname);
  if (caseMatch) {
    caseMismatches.push(findingFrom(reference, {
      target: interpreted.url,
      reason: "case-mismatch",
      suggestion: `/${caseMatch}`,
    }));
  } else {
    brokenLinks.push(findingFrom(reference, {
      target: interpreted.url,
      reason: "missing-target",
    }));
  }
}

for (const page of pages.values()) {
  for (const special of page.backendMarkers) backendReferences.push(special);
}

const homepageResolution = resolvePath("/");
const homepageKey = homepageResolution.status === "object" ? homepageResolution.key : null;
const entryPointResolutions = config.entryPoints.map((entry) => ({ entry, ...resolvePath(entry) }));
const configuredSeeds = entryPointResolutions
  .filter((result) => result.status === "object" && pages.has(result.key))
  .map((result) => result.key);
const configuredListingSeeds = entryPointResolutions
  .filter((result) => result.status === "directory-listing" || result.status === "directory-redirect")
  .map((result) => result.prefix);
const reachableFromHome = walkGraph(homepageKey ? [homepageKey] : [], [], pageGraph, listingGraph);
const reachableFromSeeds = walkGraph(configuredSeeds, configuredListingSeeds, pageGraph, listingGraph);

for (const finding of brokenLinks) {
  finding.homepageReachable = reachableFromHome.has(finding.sourceKey);
  finding.seedReachable = reachableFromSeeds.has(finding.sourceKey);
}
for (const finding of caseMismatches) {
  finding.homepageReachable = reachableFromHome.has(finding.sourceKey);
  finding.seedReachable = reachableFromSeeds.has(finding.sourceKey);
}

console.log("4/5 Computing storage, orphan, and duplicate summaries...");

const orphanPages = htmlFiles
  .filter((file) => !reachableFromSeeds.has(file.key))
  .map((file) => pageRow(file, pages.get(file.key), incomingPageLinks.get(file.key) || 0, reachableFromHome, reachableFromSeeds));
const unreferencedFiles = files
  .filter((file) => !referencedFiles.has(file.key) && !pages.has(file.key))
  .sort((a, b) => b.size - a.size || compareStrings(a.key, b.key));
const largestFiles = [...files].sort((a, b) => b.size - a.size || compareStrings(a.key, b.key)).slice(0, 2000);
const hardlinkGroups = buildHardlinkGroups(files);
const sections = buildSectionSummary(files, pages, allReferences, brokenLinks, reachableFromHome, reachableFromSeeds, referencedFiles);
const extensionSummary = buildExtensionSummary(files);
const directoryListings = findLinkedDirectoryListings(allReferences);

const summary = {
  generatedAt: new Date().toISOString(),
  durationSeconds: null,
  config: {
    siteRoot,
    siteOrigin: siteOrigin.origin,
    entryPoints: config.entryPoints,
    reportDir,
  },
  inventory: {
    files: files.length,
    bytes: inventory.totalBytes,
    htmlPages: htmlFiles.length,
    cssFiles: cssFiles.length,
    symlinks: inventory.symlinks.length,
    internalSymlinks: inventory.symlinks.filter((link) => link.status === "internal").length,
    brokenSymlinks: inventory.symlinks.filter((link) => link.status === "broken").length,
    outsideSymlinks: inventory.symlinks.filter((link) => link.status === "outside").length,
  },
  links: {
    references: allReferences.length,
    internalReferences: allReferences.filter((ref) => ref.interpreted?.type === "internal").length,
    externalReferences: allReferences.filter((ref) => ref.interpreted?.type === "external").length,
    broken: brokenLinks.length,
    brokenFromHomepageReachablePages: brokenLinks.filter((item) => item.homepageReachable).length,
    brokenFromSeedReachablePages: brokenLinks.filter((item) => item.seedReachable).length,
    missingTargets: brokenLinks.filter((item) => item.reason === "missing-target").length,
    missingFragments: brokenLinks.filter((item) => item.reason === "missing-fragment").length,
    caseMismatches: caseMismatches.length,
    malformed: malformedUrls.length,
    backendReferences: backendReferences.length,
    linkedDirectoryListings: directoryListings.length,
  },
  reachability: {
    homepageKey,
    entryPoints: entryPointResolutions.map((result) => ({
      entry: result.entry,
      status: result.status,
      key: result.key || "",
      prefix: result.prefix || "",
    })),
    fromHomepage: reachableFromHome.size,
    fromConfiguredSeeds: reachableFromSeeds.size,
    orphanPagesFromConfiguredSeeds: orphanPages.length,
    pagesWithNoIncomingHtmlLinks: [...incomingPageLinks.values()].filter((count) => count === 0).length,
  },
  storage: {
    unreferencedNonHtmlFiles: unreferencedFiles.length,
    unreferencedNonHtmlBytes: sum(unreferencedFiles, (file) => file.size),
    hardlinkGroups: hardlinkGroups.length,
    hardlinkPaths: sum(hardlinkGroups, (group) => group.files.length),
    hardlinkDuplicateBytesInObjectStorage: sum(hardlinkGroups, (group) => group.duplicateBytes),
  },
  parse: {
    htmlParseErrors: parseErrors.length,
  },
  technologies: [...technologyCounts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || compareStrings(a.name, b.name)),
};

console.log("5/5 Writing report...");
await rm(reportDir, { recursive: true, force: true });
await mkdir(reportDir, { recursive: true });

const pageRows = htmlFiles.map((file) => pageRow(
  file,
  pages.get(file.key),
  incomingPageLinks.get(file.key) || 0,
  reachableFromHome,
  reachableFromSeeds,
));
const pageFindingCounts = buildPageFindingCounts(allReferences, brokenLinks, caseMismatches, backendReferences);
for (const row of pageRows) Object.assign(row, pageFindingCounts.get(row.key) || emptyPageFindingCounts());
for (const row of orphanPages) Object.assign(row, pageFindingCounts.get(row.key) || emptyPageFindingCounts());
const problemPages = pageRows
  .filter((row) => row.brokenInternalLinks > 0 || row.backendReferences > 0 || row.caseMismatches > 0)
  .sort((a, b) => b.brokenInternalLinks - a.brokenInternalLinks || b.backendReferences - a.backendReferences || compareStrings(a.key, b.key));

await Promise.all([
  writeCsv("broken-internal-links.csv", brokenLinks, ["sourceKey", "sourceUrl", "line", "tag", "attribute", "raw", "target", "reason", "resolvedKey", "homepageReachable", "seedReachable"]),
  writeCsv("case-mismatches.csv", caseMismatches, ["sourceKey", "sourceUrl", "line", "tag", "attribute", "raw", "target", "suggestion", "homepageReachable", "seedReachable"]),
  writeCsv("backend-references.csv", backendReferences, ["sourceKey", "sourceUrl", "line", "tag", "attribute", "raw", "target", "reason"]),
  writeCsv("malformed-urls.csv", malformedUrls, ["sourceKey", "sourceUrl", "line", "tag", "attribute", "raw", "reason"]),
  writeCsv("orphan-pages.csv", orphanPages, pageColumns()),
  writeCsv("pages.csv", pageRows, pageColumns()),
  writeCsv("problem-pages.csv", problemPages, pageColumns()),
  writeCsv("unreferenced-files.csv", unreferencedFiles.map(fileRow), ["key", "bytes", "size", "modified", "extension"]),
  writeCsv("largest-files.csv", largestFiles.map(fileRow), ["key", "bytes", "size", "modified", "extension"]),
  writeCsv("symlinks.csv", inventory.symlinks, ["key", "rawTarget", "target", "status", "isDirectory"]),
  writeCsv("hardlink-duplicates.csv", hardlinkGroups.flatMap((group) => group.files.map((file, index) => ({
    group: group.id,
    key: file.key,
    bytes: file.size,
    size: formatBytes(file.size),
    copy: index + 1,
    duplicateBytesForGroup: group.duplicateBytes,
  }))), ["group", "key", "bytes", "size", "copy", "duplicateBytesForGroup"]),
  writeCsv("external-hosts.csv", [...externalHosts.values()].map((item) => ({
    host: item.host,
    references: item.count,
    pages: item.pages.size,
  })).sort((a, b) => b.references - a.references), ["host", "references", "pages"]),
  writeCsv("sections.csv", sections, ["section", "files", "bytes", "size", "htmlPages", "homepageReachablePages", "seedReachablePages", "referencedFiles", "brokenReferences"]),
  writeCsv("extensions.csv", extensionSummary, ["extension", "files", "bytes", "size"]),
  writeCsv("linked-directory-listings.csv", directoryListings, ["sourceKey", "sourceUrl", "line", "raw", "target"]),
  writeCsv("html-parse-errors.csv", parseErrors, ["sourceKey", "line", "column", "code"]),
]);

summary.durationSeconds = (Date.now() - startedAt.getTime()) / 1000;
await writeFile(path.join(reportDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(path.join(reportDir, "index.html"), renderReport({
  summary,
  sections,
  extensionSummary,
  brokenLinks,
  caseMismatches,
  backendReferences,
  orphanPages,
  unreferencedFiles,
  largestFiles,
  hardlinkGroups,
  externalHosts,
  directoryListings,
  problemPages,
}));

console.log(`Done in ${summary.durationSeconds.toFixed(1)}s`);
console.log(`Report: ${path.join(reportDir, "index.html")}`);

async function buildInventory(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const filesOut = [];
  const linksOut = [];
  let totalBytes = 0;

  await mapLimit(entries, 128, async (entry) => {
    if (!entry.isFile() && !entry.isSymbolicLink()) return;
    const absolute = path.join(entry.parentPath, entry.name);
    const key = toKey(path.relative(root, absolute));
    const stat = await lstat(absolute);

    if (entry.isFile()) {
      const file = {
        key,
        path: absolute,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        ino: stat.ino,
        dev: stat.dev,
        nlink: stat.nlink,
        ext: extension(key),
      };
      filesOut.push(file);
      totalBytes += stat.size;
      return;
    }

    const rawTarget = await readFileLink(absolute);
    try {
      const resolved = await realpath(absolute);
      const resolvedStat = await lstat(resolved);
      const relative = path.relative(root, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        linksOut.push({ key, rawTarget, target: resolved, status: "outside", isDirectory: resolvedStat.isDirectory() });
      } else {
        linksOut.push({ key, rawTarget, target: toKey(relative), status: "internal", isDirectory: resolvedStat.isDirectory() });
      }
    } catch (error) {
      linksOut.push({ key, rawTarget, target: "", status: "broken", isDirectory: false, error: error.code });
    }
  });

  filesOut.sort((a, b) => compareStrings(a.key, b.key));
  linksOut.sort((a, b) => compareStrings(a.key, b.key));
  return { files: filesOut, symlinks: linksOut, totalBytes };
}

async function readFileLink(filename) {
  const { readlink } = await import("node:fs/promises");
  return readlink(filename);
}

function parseHtml(file, source) {
  const errors = [];
  const document = parse(source, {
    sourceCodeLocationInfo: true,
    onParseError(error) {
      errors.push({ sourceKey: file.key, line: error.startLine, column: error.startCol, code: error.code });
    },
  });
  const nodes = flattenNodes(document);
  const baseNode = nodes.find((node) => node.tagName === "base" && attr(node, "href"));
  const canonicalUrl = publicUrlForKey(file.key);
  let baseUrl = `${siteOrigin.origin}${canonicalUrl}`;
  if (baseNode) {
    try {
      baseUrl = new URL(attr(baseNode, "href"), baseUrl).href;
    } catch {
      // The malformed base URL is also captured as a regular reference below.
    }
  }

  const references = [];
  const malformed = [];
  const ids = new Set();
  const technologies = new Map();
  const backendMarkers = [];
  let title = "";

  for (const node of nodes) {
    if (!node.tagName) continue;
    const nodeAttrs = new Map((node.attrs || []).map((item) => [item.name.toLowerCase(), item.value]));
    const id = nodeAttrs.get("id");
    const anchorName = node.tagName === "a" ? nodeAttrs.get("name") : null;
    if (id) ids.add(id);
    if (anchorName) ids.add(anchorName);
    if (node.tagName === "title" && !title) title = textContent(node).trim().replace(/\s+/g, " ");

    detectTechnologies(node, nodeAttrs, technologies);
    for (const [name] of nodeAttrs) {
      if (name.startsWith("on")) increment(technologies, "inline-event-handlers");
    }

    for (const spec of referenceSpecs(node.tagName, nodeAttrs)) {
      if (!spec.value) continue;
      for (const value of spec.multiple ? parseSrcset(spec.value) : [spec.value]) {
        references.push(makeReference(file, canonicalUrl, baseUrl, node, spec.attribute, value, spec.kind));
      }
    }
  }

  if (/<!--\s*#/i.test(source)) {
    backendMarkers.push({ sourceKey: file.key, sourceUrl: canonicalUrl, line: lineOf(source, /<!--\s*#/i), tag: "comment", attribute: "", raw: "server-side include", target: "", reason: "server-side-include" });
    increment(technologies, "server-side-includes");
  }

  return {
    key: file.key,
    url: canonicalUrl,
    title,
    ids,
    references,
    malformedUrls: malformed,
    parseErrors: errors,
    technologies,
    backendMarkers,
  };
}

function parseCss(file, source) {
  const references = [];
  const sourceUrl = publicUrlForKey(file.key);
  const baseUrl = `${siteOrigin.origin}${sourceUrl}`;
  const pattern = /url\(\s*(['"]?)(.*?)\1\s*\)|@import\s+(?:url\(\s*)?(['"])(.*?)\3/gi;
  for (const match of source.matchAll(pattern)) {
    const value = (match[2] ?? match[4] ?? "").trim();
    if (!value || value.startsWith("data:")) continue;
    references.push({
      sourceKey: file.key,
      sourceUrl,
      baseUrl,
      line: lineAtOffset(source, match.index),
      tag: "css",
      attribute: match[0].toLowerCase().startsWith("@import") ? "@import" : "url()",
      raw: value,
      kind: "asset",
    });
  }
  return references;
}

function referenceSpecs(tag, attrs) {
  const specs = [];
  const add = (attribute, kind = "asset", multiple = false) => {
    if (attrs.has(attribute)) specs.push({ attribute, value: attrs.get(attribute), kind, multiple });
  };
  if (tag === "a" || tag === "area") add("href", "navigation");
  if (tag === "base") add("href", "base");
  if (tag === "link") add("href", "asset");
  if (["img", "script", "iframe", "frame", "source", "video", "audio", "embed", "input"].includes(tag)) add("src", tag === "iframe" || tag === "frame" ? "navigation" : "asset");
  if (tag === "img" || tag === "source") add("srcset", "asset", true);
  if (tag === "video") add("poster", "asset");
  if (tag === "object") add("data", "asset");
  if (tag === "form") add("action", "form");
  if (tag === "applet") {
    add("code", "applet");
    add("archive", "applet", true);
  }
  if (tag === "body") add("background", "asset");
  return specs;
}

function detectTechnologies(node, attrs, technologies) {
  const tag = node.tagName;
  if (["font", "center", "frameset", "frame", "applet", "marquee"].includes(tag)) increment(technologies, `deprecated-${tag}`);
  if (tag === "table" && (attrs.has("bgcolor") || attrs.has("width") || attrs.has("cellpadding"))) increment(technologies, "layout-tables");
  if (tag === "script" && attrs.get("src")) {
    const src = attrs.get("src").toLowerCase();
    if (src.includes("jquery")) increment(technologies, "jquery-script");
    if (src.includes("bootstrap")) increment(technologies, "bootstrap-script");
  }
  if (tag === "link" && (attrs.get("href") || "").toLowerCase().includes("bootstrap")) increment(technologies, "bootstrap-stylesheet");
  if (attrs.has("style")) increment(technologies, "inline-style-attributes");
}

function makeReference(file, sourceUrl, baseUrl, node, attribute, raw, kind) {
  const location = node.sourceCodeLocation?.attrs?.[attribute] || node.sourceCodeLocation;
  return {
    sourceKey: file.key,
    sourceUrl,
    baseUrl,
    line: location?.startLine || "",
    tag: node.tagName,
    attribute,
    raw: raw.trim(),
    kind,
  };
}

function interpretReference(reference) {
  const raw = reference.raw.trim();
  if (!raw) return { type: "ignored", reason: "empty" };
  if (/^(mailto|tel|javascript|data|blob|about|news|irc):/i.test(raw)) return { type: "ignored", reason: raw.split(":", 1)[0].toLowerCase() };
  try {
    const url = new URL(raw, reference.baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { type: "ignored", reason: url.protocol };
    if (!acceptedHosts.has(url.hostname.toLowerCase())) return { type: "external", host: url.hostname, url: url.href };
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return { type: "malformed", reason: "invalid-percent-encoding" };
    }
    let fragment = "";
    if (url.hash.length > 1) {
      try {
        fragment = decodeURIComponent(url.hash.slice(1));
      } catch {
        fragment = url.hash.slice(1);
      }
    }
    return { type: "internal", pathname, fragment, url: `${pathname}${url.search}${url.hash}` };
  } catch (error) {
    return { type: "malformed", reason: error.message };
  }
}

function resolvePath(pathname) {
  let requestPath = pathname;
  try {
    requestPath = decodeURIComponent(pathname);
  } catch {
    return { status: "missing" };
  }
  let keyPath = requestPath.replace(/^\/+/, "");
  keyPath = applyAlias(keyPath);
  const candidates = keyPath === ""
    ? ["index.html"]
    : keyPath.endsWith("/")
      ? [keyPath, `${keyPath}index.html`]
      : [keyPath, `${keyPath}.html`];

  for (const candidate of candidates) {
    if (fileMap.has(candidate)) return { status: "object", key: candidate };
  }
  if (!requestPath.endsWith("/") && hasFilePrefix(`${keyPath}/`)) {
    return { status: "directory-redirect", target: `${requestPath}/`, prefix: `${keyPath}/` };
  }
  if (requestPath.endsWith("/") && hasFilePrefix(keyPath)) return { status: "directory-listing", prefix: keyPath };
  return { status: "missing" };
}

function applyAlias(keyPath) {
  for (const [from, to] of aliases) {
    if (from.endsWith("/")) {
      if (keyPath.startsWith(from)) return `${to}${keyPath.slice(from.length)}`;
    } else if (keyPath === from) {
      return to;
    }
  }
  return keyPath;
}

function hasFilePrefix(prefix) {
  const index = lowerBound(fileKeys, prefix);
  return index < fileKeys.length && fileKeys[index].startsWith(prefix);
}

function findCaseMismatch(pathname) {
  const keyPath = pathname.replace(/^\/+/, "");
  const candidates = keyPath === ""
    ? ["index.html"]
    : keyPath.endsWith("/")
      ? [`${keyPath}index.html`]
      : [keyPath, `${keyPath}.html`, `${keyPath}/index.html`];
  for (const candidate of candidates) {
    const matches = lowerKeyMap.get(candidate.toLowerCase());
    if (matches?.length === 1 && matches[0] !== candidate) return matches[0];
  }
  return null;
}

function isBackendReference(reference, interpreted) {
  if (reference.kind === "form") return true;
  return /(^|\/)(cgi-bin)(\/|$)|\.(cgi|php|pl|py)(\/|$)/i.test(interpreted.pathname);
}

function backendReason(reference, interpreted) {
  if (reference.kind === "form") return "form-action";
  if (/(^|\/)cgi-bin(\/|$)/i.test(interpreted.pathname)) return "cgi-bin-reference";
  return "backend-script-reference";
}

function buildSectionSummary(fileList, pageMap, refs, broken, fromHome, fromSeeds, referenced) {
  const rows = new Map();
  const get = (section) => {
    if (!rows.has(section)) rows.set(section, { section, files: 0, bytes: 0, htmlPages: 0, homepageReachablePages: 0, seedReachablePages: 0, referencedFiles: 0, brokenReferences: 0 });
    return rows.get(section);
  };
  for (const file of fileList) {
    const section = sectionFor(file.key);
    const row = get(section);
    row.files += 1;
    row.bytes += file.size;
    if (pageMap.has(file.key)) {
      row.htmlPages += 1;
      if (fromHome.has(file.key)) row.homepageReachablePages += 1;
      if (fromSeeds.has(file.key)) row.seedReachablePages += 1;
    }
    if (referenced.has(file.key)) row.referencedFiles += 1;
  }
  for (const finding of broken) get(sectionFor(finding.sourceKey)).brokenReferences += 1;
  return [...rows.values()].map((row) => ({ ...row, size: formatBytes(row.bytes) })).sort((a, b) => b.bytes - a.bytes || compareStrings(a.section, b.section));
}

function buildExtensionSummary(fileList) {
  const rows = new Map();
  for (const file of fileList) {
    const ext = file.ext || "[none]";
    const row = rows.get(ext) || { extension: ext, files: 0, bytes: 0 };
    row.files += 1;
    row.bytes += file.size;
    rows.set(ext, row);
  }
  return [...rows.values()].map((row) => ({ ...row, size: formatBytes(row.bytes) })).sort((a, b) => b.bytes - a.bytes || b.files - a.files);
}

function buildHardlinkGroups(fileList) {
  const groups = new Map();
  for (const file of fileList) {
    if (file.nlink < 2) continue;
    const id = `${file.dev}:${file.ino}`;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(file);
  }
  return [...groups]
    .filter(([, grouped]) => grouped.length > 1)
    .map(([id, grouped]) => ({ id, files: grouped, duplicateBytes: grouped[0].size * (grouped.length - 1) }))
    .sort((a, b) => b.duplicateBytes - a.duplicateBytes);
}

function findLinkedDirectoryListings(refs) {
  return refs
    .filter((ref) => ref.resolution?.status === "directory-listing")
    .map((ref) => ({ sourceKey: ref.sourceKey, sourceUrl: ref.sourceUrl, line: ref.line, raw: ref.raw, target: ref.interpreted?.url || "" }));
}

function walkGraph(pageSeeds, listingSeeds, graph, listings) {
  const seenPages = new Set();
  const seenListings = new Set();
  const pageQueue = [...new Set(pageSeeds)];
  const listingQueue = [...new Set(listingSeeds)];
  let pageIndex = 0;
  let listingIndex = 0;

  while (pageIndex < pageQueue.length || listingIndex < listingQueue.length) {
    while (listingIndex < listingQueue.length) {
      const prefix = listingQueue[listingIndex++];
      if (seenListings.has(prefix)) continue;
      seenListings.add(prefix);
      const start = lowerBound(htmlKeys, prefix);
      for (let index = start; index < htmlKeys.length && htmlKeys[index].startsWith(prefix); index += 1) {
        if (!seenPages.has(htmlKeys[index])) pageQueue.push(htmlKeys[index]);
      }
    }

    if (pageIndex >= pageQueue.length) continue;
    const key = pageQueue[pageIndex++];
    if (seenPages.has(key) || !graph.has(key)) continue;
    seenPages.add(key);
    for (const target of graph.get(key)) if (!seenPages.has(target)) pageQueue.push(target);
    for (const prefix of listings.get(key) || []) if (!seenListings.has(prefix)) listingQueue.push(prefix);
  }
  return seenPages;
}

function pageRow(file, page, incoming, fromHome, fromSeeds) {
  return {
    key: file.key,
    url: page?.url || publicUrlForKey(file.key),
    title: page?.title || "",
    bytes: file.size,
    size: formatBytes(file.size),
    modified: new Date(file.mtimeMs).toISOString(),
    incomingLinks: incoming,
    outgoingReferences: page?.references.length || 0,
    homepageReachable: fromHome.has(file.key),
    seedReachable: fromSeeds.has(file.key),
  };
}

function pageColumns() {
  return ["key", "url", "title", "bytes", "size", "modified", "incomingLinks", "outgoingReferences", "internalReferences", "externalReferences", "brokenInternalLinks", "backendReferences", "caseMismatches", "homepageReachable", "seedReachable"];
}

function buildPageFindingCounts(references, broken, caseItems, backendItems) {
  const counts = new Map();
  const get = (key) => {
    if (!counts.has(key)) counts.set(key, emptyPageFindingCounts());
    return counts.get(key);
  };
  for (const reference of references) {
    if (!pages.has(reference.sourceKey)) continue;
    if (reference.interpreted?.type === "internal") get(reference.sourceKey).internalReferences += 1;
    if (reference.interpreted?.type === "external") get(reference.sourceKey).externalReferences += 1;
  }
  for (const item of broken) get(item.sourceKey).brokenInternalLinks += 1;
  for (const item of backendItems) get(item.sourceKey).backendReferences += 1;
  for (const item of caseItems) get(item.sourceKey).caseMismatches += 1;
  return counts;
}

function emptyPageFindingCounts() {
  return { internalReferences: 0, externalReferences: 0, brokenInternalLinks: 0, backendReferences: 0, caseMismatches: 0 };
}

function fileRow(file) {
  return { key: file.key, bytes: file.size, size: formatBytes(file.size), modified: new Date(file.mtimeMs).toISOString(), extension: file.ext || "[none]" };
}

function findingFrom(reference, extra) {
  return {
    sourceKey: reference.sourceKey,
    sourceUrl: reference.sourceUrl,
    line: reference.line,
    tag: reference.tag,
    attribute: reference.attribute,
    raw: reference.raw,
    ...extra,
  };
}

function renderReport(data) {
  const { summary } = data;
  const cards = [
    ["Objects", formatInteger(summary.inventory.files), formatBytes(summary.inventory.bytes)],
    ["HTML pages", formatInteger(summary.inventory.htmlPages), `${formatInteger(summary.reachability.fromHomepage)} visitor-reachable from /`],
    ["Broken links", formatInteger(summary.links.broken), `${formatInteger(summary.links.brokenFromHomepageReachablePages)} on homepage-reachable pages`],
    ["Orphan pages", formatInteger(summary.reachability.orphanPagesFromConfiguredSeeds), "not reached from configured section roots"],
    ["Backend remnants", formatInteger(summary.links.backendReferences), "forms, CGI/scripts, and SSI"],
    ["Unreferenced payload", formatBytes(summary.storage.unreferencedNonHtmlBytes), `${formatInteger(summary.storage.unreferencedNonHtmlFiles)} non-HTML files`],
  ];
  const priorityBroken = data.brokenLinks.filter((item) => item.homepageReachable).slice(0, 100);
  const hardlinks = data.hardlinkGroups.slice(0, 50).map((group) => ({ paths: group.files.length, size: formatBytes(group.files[0].size), duplicateStorage: formatBytes(group.duplicateBytes), examples: group.files.slice(0, 3).map((file) => file.key).join(" | ") }));
  const external = [...data.externalHosts.values()].map((item) => ({ host: item.host, references: item.count, pages: item.pages.size })).sort((a, b) => b.references - a.references).slice(0, 50);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>wstein.org legacy site audit</title>
  <style>
    :root { color-scheme: light; --ink:#202124; --muted:#676b70; --line:#d9dcdf; --paper:#fff; --wash:#f3f5f6; --accent:#006b5f; --danger:#a33028; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--wash); font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    header { color:white; background:#163f3a; padding:32px max(24px,calc((100vw - 1400px)/2)); }
    h1 { margin:0 0 6px; font:700 30px/1.15 Georgia,serif; letter-spacing:0; }
    header p { margin:0; color:#d9e8e5; }
    main { max-width:1400px; margin:0 auto; padding:24px; }
    h2 { margin:34px 0 10px; font:700 21px/1.2 Georgia,serif; letter-spacing:0; }
    p { max-width:900px; }
    .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; }
    .card { background:var(--paper); border:1px solid var(--line); border-radius:6px; padding:15px; min-height:100px; }
    .card strong { display:block; font-size:25px; }
    .card span { color:var(--muted); }
    .downloads { display:flex; flex-wrap:wrap; gap:8px 16px; margin:10px 0 24px; }
    a { color:#00685e; }
    .table-wrap { overflow:auto; max-height:560px; border:1px solid var(--line); background:var(--paper); }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th { position:sticky; top:0; text-align:left; background:#e8ecec; z-index:1; }
    th,td { padding:7px 9px; border-bottom:1px solid #eceeef; vertical-align:top; }
    td.path { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; overflow-wrap:anywhere; }
    .danger { color:var(--danger); font-weight:600; }
    footer { color:var(--muted); margin:36px 0; }
    code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  </style>
</head>
<body>
<header><h1>wstein.org legacy site audit</h1><p>Generated ${escapeHtml(summary.generatedAt)} in ${summary.durationSeconds.toFixed(1)} seconds</p></header>
<main>
  <div class="cards">${cards.map(([label, value, note]) => `<div class="card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></div>`).join("")}</div>
  <h2>Full datasets</h2>
  <p>The tables below are intentionally abbreviated. The CSV files contain every finding.</p>
  <div class="downloads">${[
    "summary.json", "broken-internal-links.csv", "case-mismatches.csv", "backend-references.csv", "problem-pages.csv", "orphan-pages.csv", "pages.csv", "unreferenced-files.csv", "largest-files.csv", "symlinks.csv", "hardlink-duplicates.csv", "external-hosts.csv", "sections.csv", "extensions.csv", "linked-directory-listings.csv", "html-parse-errors.csv", "malformed-urls.csv",
  ].map((name) => `<a href="${name}">${name}</a>`).join("")}</div>
  <h2>Priority broken links</h2>
  <p>Broken references found on pages discoverable from the homepage, including generated directory listings.</p>
  ${htmlTable(priorityBroken, ["sourceKey", "line", "raw", "reason"], { pathColumns: new Set(["sourceKey", "raw"]), dangerColumn: "reason" })}
  <h2>Pages with the most breakage</h2>
  ${htmlTable(data.problemPages.slice(0, 100), ["key", "brokenInternalLinks", "backendReferences", "caseMismatches", "homepageReachable", "seedReachable"], { pathColumns: new Set(["key"]) })}
  <h2>Largest sections</h2>
  ${htmlTable(data.sections.slice(0, 100), ["section", "size", "files", "htmlPages", "homepageReachablePages", "brokenReferences"], { pathColumns: new Set(["section"]) })}
  <h2>Largest file types</h2>
  ${htmlTable(data.extensionSummary.slice(0, 60), ["extension", "size", "files"])}
  <h2>Largest files</h2>
  ${htmlTable(data.largestFiles.slice(0, 100).map(fileRow), ["key", "size", "modified"], { pathColumns: new Set(["key"]) })}
  <h2>Backend and non-static references</h2>
  ${htmlTable(data.backendReferences.slice(0, 100), ["sourceKey", "line", "raw", "reason"], { pathColumns: new Set(["sourceKey", "raw"]), dangerColumn: "reason" })}
  <h2>External dependencies</h2>
  ${htmlTable(external, ["host", "references", "pages"])}
  <h2>Exact hard-link duplicates</h2>
  <p>These are byte-identical paths because they share an inode locally. R2 stores each path as a separate object.</p>
  ${htmlTable(hardlinks, ["paths", "size", "duplicateStorage", "examples"], { pathColumns: new Set(["examples"]) })}
  <h2>Method and limitations</h2>
  <p>Internal URLs use the deployed Worker rules, including internal symlink aliases. Reachability follows links between stored HTML pages and expands valid generated directory listings through their subtrees. This may overestimate discoverability in a directory containing more than the Worker listing limit of 1,000 immediate entries. JavaScript-generated URLs, arbitrary source-code references, and live validation of external sites are not included. “Unreferenced” means not referenced by parsed HTML or CSS; it does not mean safe to delete.</p>
  <footer>Configuration: <code>${escapeHtml(configPath)}</code></footer>
</main>
</body>
</html>\n`;
}

function htmlTable(rows, columns, options = {}) {
  if (rows.length === 0) return "<p>None found.</p>";
  return `<div class="table-wrap"><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => {
    const classes = [options.pathColumns?.has(column) ? "path" : "", options.dangerColumn === column ? "danger" : ""].filter(Boolean).join(" ");
    return `<td${classes ? ` class="${classes}"` : ""}>${escapeHtml(row[column] ?? "")}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
}

async function writeCsv(filename, rows, columns) {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) lines.push(columns.map((column) => csvCell(row[column] ?? "")).join(","));
  await writeFile(path.join(reportDir, filename), `${lines.join("\n")}\n`);
}

function csvCell(value) {
  const text = value instanceof Set ? [...value].join("|") : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function publicUrlForKey(key) {
  if (key === "index.html") return "/";
  if (key.endsWith("/index.html")) return `/${key.slice(0, -"index.html".length)}`;
  return `/${key}`;
}

function buildLowerKeyMap(keys) {
  const result = new Map();
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (!result.has(lower)) result.set(lower, []);
    result.get(lower).push(key);
  }
  return result;
}

function sectionFor(key) {
  const parts = key.split("/");
  if (parts.length === 1) return "[root]";
  return parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0];
}

function extension(key) {
  const basename = key.split("/").at(-1) || "";
  const index = basename.lastIndexOf(".");
  return index <= 0 ? "" : basename.slice(index + 1).toLowerCase();
}

function flattenNodes(root) {
  const result = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    result.push(node);
    if (node.content) stack.push(node.content);
    if (node.childNodes) for (let index = node.childNodes.length - 1; index >= 0; index -= 1) stack.push(node.childNodes[index]);
  }
  return result;
}

function textContent(node) {
  let text = node.value || "";
  for (const child of node.childNodes || []) text += textContent(child);
  return text;
}

function attr(node, name) {
  return node.attrs?.find((item) => item.name.toLowerCase() === name)?.value || "";
}

function parseSrcset(value) {
  return value.split(",").map((part) => part.trim().split(/\s+/, 1)[0]).filter(Boolean);
}

function lineAtOffset(source, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) if (source.charCodeAt(index) === 10) line += 1;
  return line;
}

function lineOf(source, pattern) {
  const match = source.match(pattern);
  return match ? lineAtOffset(source, match.index) : "";
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function sum(items, getter) {
  return items.reduce((total, item) => total + getter(item), 0);
}

function toKey(value) {
  return value.split(path.sep).join("/");
}

function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function lowerBound(items, value) {
  let low = 0;
  let high = items.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (items[middle] < value) low = middle + 1;
    else high = middle;
  }
  return low;
}

async function mapLimit(items, limit, mapper) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unit = "B";
  for (const nextUnit of units) {
    value /= 1024;
    unit = nextUnit;
    if (value < 1024) break;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${unit}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
