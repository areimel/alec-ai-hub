import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.resolve(ENGINE, "..");
const SITE = path.join(WORK, "site");
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff", ".woff2": "font/woff2",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".wav": "audio/wav", ".mp4": "video/mp4", ".webmanifest": "application/manifest+json",
};

function resolveFile(root, rel) {
  const target = path.resolve(root, "." + path.posix.normalize("/" + rel));
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  let st;
  try { st = fs.statSync(target); } catch { return undefined; }
  if (st.isDirectory()) {
    const idx = path.join(target, "index.html");
    return fs.existsSync(idx) ? idx : undefined;
  }
  return target;
}

export function createServer(cutDir) {
  const CUT = path.resolve(cutDir);
  return http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400).end("bad request"); return; }
    if (p.includes("\0")) { res.writeHead(400).end("bad request"); return; }
    let root = SITE, rel = p;
    if (p === "/__comp" || p.startsWith("/__comp/")) { root = CUT; rel = p.slice("/__comp".length) || "/"; }
    else if (p === "/engine" || p.startsWith("/engine/")) { root = ENGINE; rel = p.slice("/engine".length) || "/"; }
    const file = resolveFile(root, rel);
    if (file === null) { res.writeHead(403).end("forbidden"); return; }
    if (!file) {
      const nf = path.join(SITE, "404.html");
      res.writeHead(404, { "content-type": MIME[".html"] });
      res.end(root === SITE && fs.existsSync(nf) ? fs.readFileSync(nf) : "not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
}

export function listen(port = 4599, cutDir) {
  return new Promise((resolve, reject) => {
    const s = createServer(cutDir);
    s.once("error", reject);
    s.listen(port, "127.0.0.1", () => resolve(s));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 4599);
  const cut = process.argv[3] || "briefing";
  listen(port, path.join(WORK, cut)).then(() => console.log(`serving http://127.0.0.1:${port}/engine/index.html (cut ${cut})`));
}
