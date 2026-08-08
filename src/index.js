import { SYMLINK_ALIASES } from "./symlink-map.js";

const CACHE_SECONDS = 3600;
const IMMUTABLE_SECONDS = 31536000;

const TEXT_TYPES = new Set([
  "html", "htm", "css", "js", "json", "txt", "xml", "svg", "md", "tex",
]);

const CONTENT_TYPES = {
  avi: "video/x-msvideo",
  bz2: "application/x-bzip2",
  css: "text/css; charset=utf-8",
  dvi: "application/x-dvi",
  gif: "image/gif",
  gz: "application/gzip",
  htm: "text/html; charset=utf-8",
  html: "text/html; charset=utf-8",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  m4v: "video/mp4",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpg: "video/mpeg",
  pdf: "application/pdf",
  png: "image/png",
  ps: "application/postscript",
  svg: "image/svg+xml; charset=utf-8",
  tar: "application/x-tar",
  tex: "text/plain; charset=utf-8",
  tif: "image/tiff",
  tiff: "image/tiff",
  txt: "text/plain; charset=utf-8",
  webp: "image/webp",
  wmv: "video/x-ms-wmv",
  xml: "application/xml; charset=utf-8",
  zip: "application/zip",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const url = new URL(request.url);
    const aliasedPathname = applySymlinkAlias(url.pathname);
    const keyCandidates = candidatesForPath(aliasedPathname);
    const found = await firstObject(env.SITE_BUCKET, keyCandidates);

    if (!found) {
      if (!url.pathname.endsWith("/") && await directoryExists(env.SITE_BUCKET, `${aliasedPathname}/`)) {
        url.pathname = `${url.pathname}/`;
        return Response.redirect(url.toString(), 301);
      }

      if (url.pathname.endsWith("/")) {
        const listing = await directoryListing(env.SITE_BUCKET, aliasedPathname, url.pathname);
        if (listing) return listing;
      }
      const notFound = await env.SITE_BUCKET.get("404.html");
      if (notFound) {
        return objectResponse(notFound, "404.html", request, 404);
      }
      return new Response("Not Found", { status: 404 });
    }

    return objectResponse(found.object, found.key, request, 200);
  },
};

function candidatesForPath(pathname) {
  let path = decodeURIComponent(pathname);
  path = path.replace(/^\/+/, "");

  if (path === "") {
    return ["index.html"];
  }

  const candidates = [path];
  if (path.endsWith("/")) {
    candidates.push(`${path}index.html`);
  } else {
    candidates.push(`${path}.html`);
  }
  return [...new Set(candidates)];
}

function applySymlinkAlias(pathname) {
  let path = decodeURIComponent(pathname).replace(/^\/+/, "");
  for (const [from, to] of SYMLINK_ALIASES) {
    if (from.endsWith("/")) {
      if (path.startsWith(from)) return `/${to}${path.slice(from.length)}`;
    } else if (path === from) {
      return `/${to}`;
    }
  }
  return pathname;
}

async function firstObject(bucket, keys) {
  for (const key of keys) {
    const object = await bucket.get(key);
    if (object) return { key, object };
  }
  return null;
}

function objectResponse(object, key, request, status) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-type", contentType(key, headers.get("content-type")));
  headers.set("cache-control", cacheControl(key));

  if (request.method === "HEAD") {
    return new Response(null, { status, headers });
  }
  return new Response(object.body, { status, headers });
}

function contentType(key, existing) {
  if (existing && existing !== "application/octet-stream") return existing;
  const ext = extension(key);
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

function cacheControl(key) {
  const ext = extension(key);
  if (TEXT_TYPES.has(ext)) return `public, max-age=${CACHE_SECONDS}`;
  return `public, max-age=${IMMUTABLE_SECONDS}, immutable`;
}

function extension(key) {
  const basename = key.split("/").pop() || "";
  const dot = basename.lastIndexOf(".");
  return dot === -1 ? "" : basename.slice(dot + 1).toLowerCase();
}

async function directoryListing(bucket, storagePathname, displayPathname = storagePathname) {
  const prefix = storagePathname.replace(/^\/+/, "");
  const listed = await bucket.list({ prefix, delimiter: "/", limit: 1000 });
  const entries = [];

  for (const delimitedPrefix of listed.delimitedPrefixes) {
    const name = delimitedPrefix.slice(prefix.length).replace(/\/$/, "");
    if (name) entries.push({ name: `${name}/`, href: encodePathPart(name) + "/" });
  }

  for (const object of listed.objects) {
    const name = object.key.slice(prefix.length);
    if (name) entries.push({ name, href: encodePathPart(name) });
  }

  if (entries.length === 0) return null;
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const parent = displayPathname === "/" ? "" : `<li><a href="../">../</a></li>`;
  const body = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Index of ${escapeHtml(displayPathname)}</title>
</head>
<body>
  <h1>Index of ${escapeHtml(displayPathname)}</h1>
  <ul>
    ${parent}
    ${entries.map((entry) => `<li><a href="${entry.href}">${escapeHtml(entry.name)}</a></li>`).join("\n    ")}
  </ul>
</body>
</html>`;

  return new Response(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": `public, max-age=${CACHE_SECONDS}`,
    },
  });
}

async function directoryExists(bucket, storagePathname) {
  const prefix = storagePathname.replace(/^\/+/, "");
  const listed = await bucket.list({ prefix, delimiter: "/", limit: 1 });
  return listed.objects.length > 0 || listed.delimitedPrefixes.length > 0;
}

function encodePathPart(part) {
  return part.split("/").map(encodeURIComponent).join("/");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
