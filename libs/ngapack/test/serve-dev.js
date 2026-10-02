/**
 * Dev server for serving raw test/src without bundling.
 *
 * This is intentionally minimal and only supports static files.
 * It is useful for quick local inspection of native ESM behavior.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve __filename and __dirname in ESM context.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createStaticServer(rootDir, port) {
  function getLatestMtimeMs(dir) {
    let latest = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        latest = Math.max(latest, getLatestMtimeMs(fullPath));
      } else {
        try {
          const stat = fs.statSync(fullPath);
          latest = Math.max(latest, stat.mtimeMs);
        } catch {
          // Ignore files that disappear during scan.
        }
      }
    }
    return latest;
  }

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/__mtime") {
      const latest = getLatestMtimeMs(rootDir);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(JSON.stringify({ mtimeMs: latest }));
      return;
    }

    const filePath = path.join(
      rootDir,
      urlPath === "/" ? "/index.dev.html" : urlPath
    );

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath);
      const typeMap = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".ico": "image/x-icon"
      };

      res.writeHead(200, {
        "Content-Type": typeMap[ext] || "application/octet-stream",
        "Access-Control-Allow-Origin": "*"
      });

      res.end(data);
    });
  });

  server.listen(port, () => {
    console.log(`✔ Dev server running at http://localhost:${port}`);
    console.log(`  Serving: ${rootDir}`);
  });
}

/**
 * ---------------------------------------------------------
 * Development server (raw src)
 * ---------------------------------------------------------
 */
createStaticServer(path.join(__dirname, "src"), 2131);
