import path from "path";
import fs from "fs";
import http from "http";
import { createMatcher } from "../libs/roution/src/roution.js";

const typeMap = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const contentType = (file) =>
  typeMap[path.extname(file).toLowerCase()] || "application/octet-stream";

// Resolve a model definition into a plain data object.
// A model may be a literal object or a factory that receives the request context.
export async function resolveModel(model, ctx) {
  if (typeof model === "function") return await model(ctx);
  return model || {};
}

// Substitute `{{ key }}` placeholders with values from the data object.
export function renderTemplate(content, data) {
  return content.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) =>
    key in data ? String(data[key]) : ""
  );
}

// Render a single route entry. An entry is either a plain file path (string)
// or an object of the shape { target, model, transform }. `ctx` is the request
// context. File contents are memoized in `fileCache` to avoid repeated disk
// reads. When the entry declares a `transform`, the rendered content is passed
// through it before it is returned.
export async function renderEntry(entry, ctx, baseDir, transforms = {}) {
  const target = targetOf(entry);
  const data = typeof entry === "string" ? {} : await resolveModel(entry.model, ctx);
  const filePath = path.join(baseDir, target);

  let content = fileCache.get(filePath);
  if (content === undefined) {
    content = await fs.promises.readFile(filePath, "utf8");
    fileCache.set(filePath, content);
  }

  return applyTransform(renderTemplate(content, data), entry, ctx, transforms);
}

const targetOf = (entry) =>
  typeof entry === "string" ? entry : entry.target;

const fileCache = new Map();

// Resolve an entry's `transform` into a function. A transform may be an inline
// function or the name of one registered in the `transforms` option, which
// keeps the route map flat. Returns null when the entry has no transform.
export function resolveTransform(transform, transforms = {}) {
  if (typeof transform === "function") return transform;
  if (typeof transform === "string") {
    const registered = transforms[transform];
    if (typeof registered !== "function") {
      throw new Error(`Unknown transform: "${transform}"`);
    }
    return registered;
  }
  return null;
}

// Apply an entry's `transform` to the already rendered content. The transform
// receives `(content, ctx, meta)`, where `ctx` is the request context
// (`{ params, query, pathname }`) and `meta` describes the source file
// (`{ target, ext, contentType }`). It returns the content to send and may be
// async. Content without a transform is passed through untouched.
export async function applyTransform(content, entry, ctx, transforms = {}) {
  const transform = resolveTransform(entry && entry.transform, transforms);
  if (!transform) return content;
  const target = targetOf(entry);
  const result = await transform(content, ctx, {
    target,
    ext: path.extname(target).toLowerCase(),
    contentType: contentType(target),
  });
  if (typeof result !== "string" && !Buffer.isBuffer(result)) {
    throw new TypeError(
      `Transform for "${target}" must return a string or Buffer, got ${typeof result}`
    );
  }
  return result;
}

/**
 * Create an HTTP server that resolves each request in three steps:
 *   1. Serve a matching static file from `publicDir` (path-traversal safe).
 *   2. Fall back to the route matcher (single file, composed chunks, or template).
 *   3. Serve the fallback file (default: `404.html`) when nothing matches.
 *
 * Steps 1 and 2 are both always available; `precedence` only decides which one
 * is consulted first, so a route can take over a path that also exists as a
 * static file without disabling static serving for everything else.
 *
 * @param {Object<string, any>} routes - Flat route map accepted by the matcher.
 * @param {Object} [options]
 * @param {string} [options.baseDir] - Base directory for resolving file paths (default: process.cwd()).
 * @param {string} [options.publicDir] - Directory for static files (default: ./public).
 * @param {number} [options.port] - Port to listen on (default: 7171).
 * @param {string} [options.host] - Host to bind (default: localhost).
 * @param {string} [options.fallback] - Fallback file served when no route or static file matches (default: 404.html).
 * @param {"static"|"routes"} [options.precedence] - Which resolver runs first (default: "static").
 * @param {Object<string, Function>} [options.transforms] - Named transforms that routes may reference by name.
 * @returns {import("http").Server}
 */
export function createServerFromRoutes(routes, options = {}) {
  const {
    baseDir = process.cwd(),
    publicDir = path.join(baseDir, "public"),
    port = 7171,
    host = "localhost",
    fallback = "404.html",
    precedence = "static",
    transforms = {},
  } = options;

  const matcher = createMatcher(routes);

  // Reject any target that escapes the public directory (path traversal guard).
  const isWithinPublic = (target) => {
    const resolved = path.resolve(target);
    return resolved === publicDir || resolved.startsWith(publicDir + path.sep);
  };

  const fileExists = async (filePath) => {
    try {
      return (await fs.promises.stat(filePath)).isFile();
    } catch {
      return false;
    }
  };

  // Response headers. An entry may override the auto-detected content type via
  // `type` and add more headers via `headers`; both sit on top of the defaults.
  const headers = (file, entry) => ({
    "Content-Type": (entry && entry.type) || contentType(file),
    "Access-Control-Allow-Origin": "*",
    ...(entry && entry.headers),
  });

  // 1. Try to serve the request directly from the public folder.
  //    Safe and existing files are streamed as-is based on their extension.
  const serveStatic = async (requestPath, res) => {
    const staticPath = path.join(publicDir, requestPath);
    if (!isWithinPublic(staticPath) || !(await fileExists(staticPath))) return false;
    res.writeHead(200, headers(staticPath));
    fs.createReadStream(staticPath).pipe(res);
    return true;
  };

  // 2. Otherwise match the request against the route table.
  const serveRoute = async (requestPath, query, res) => {
    const match = matcher.match(requestPath);
    if (!match.found) return false;

    // Request context passed to factories, model callbacks, and transforms.
    // Destructurable, e.g. `({ params, query }) => ...`.
    const ctx = { params: match.params, query, pathname: requestPath };

    // A route value may be a factory/callback: when it is a function, invoke
    // it with the request context to resolve the real value (string, object,
    // or composed shape) before serving.
    const routeValue =
      typeof match.value === "function"
        ? await match.value(ctx)
        : match.value;

    // 2a. Composed response. A route value can be:
    //     - an array (default concat) -> render all chunks, join, send once
    //     - an object { stream: true, chunks: [...] } -> render and write
    //       each chunk sequentially (Transfer-Encoding: chunked)
    const composed = Array.isArray(routeValue)
      ? { stream: false, chunks: routeValue }
      : routeValue;
    const isComposed = composed && Array.isArray(composed.chunks);
    if (isComposed) {
      // The response head is written before any chunk is rendered, so per-entry
      // `type`/`headers` are only read from the first chunk.
      const first = composed.chunks[0];
      res.writeHead(200, headers(targetOf(first), first));
      if (composed.stream) {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        // Stream each chunk as soon as it is rendered, in order. A chunk may
        // carry its own `delay` (ms) applied before it is written, which is
        // useful for demonstrating sequential streaming.
        for (let i = 0; i < composed.chunks.length; i++) {
          const entry = composed.chunks[i];
          const entryDelay = entry && typeof entry === "object" ? entry.delay : undefined;
          if (i > 0 && typeof entryDelay === "number") await sleep(entryDelay);
          const chunk = await renderEntry(entry, ctx, baseDir, transforms);
          res.write(chunk);
        }
        res.end();
        return true;
      }
      const parts = await Promise.all(
        composed.chunks.map((entry) => renderEntry(entry, ctx, baseDir, transforms))
      );
      res.end(parts.join(""));
      return true;
    }

    // 2b. Templated response: a single { target, model, transform } entry.
    if (typeof routeValue === "object") {
      const html = await renderEntry(routeValue, ctx, baseDir, transforms);
      res.writeHead(200, headers(routeValue.target, routeValue));
      res.end(html);
      return true;
    }

    // 2c. Plain file path: stream it directly based on its extension.
    const filePath = path.join(baseDir, routeValue);
    res.writeHead(200, headers(filePath));
    fs.createReadStream(filePath).pipe(res);
    return true;
  };

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host}`);
      const requestPath = requestUrl.pathname;
      const query = Object.fromEntries(requestUrl.searchParams);

      // Whichever resolver runs first, the other one still gets its turn when
      // the first finds nothing, so nothing becomes unreachable.
      const steps =
        precedence === "routes"
          ? [
              () => serveRoute(requestPath, query, res),
              () => serveStatic(requestPath, res),
            ]
          : [
              () => serveStatic(requestPath, res),
              () => serveRoute(requestPath, query, res),
            ];

      for (const step of steps) {
        if (await step()) return;
      }

      // 3. Nothing matched: serve the 404 page.
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(path.join(publicDir, fallback)).pipe(res);
    } catch (error) {
      // A throwing model factory or transform must not leave the request open.
      console.error("[hashttp] request failed:", error);
      if (res.headersSent) {
        res.end();
        return;
      }
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
    }
  });

  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}/`);
  });

  return server;
}

export default createServerFromRoutes;

// Convert a URL path to a file path inside the output directory.
// "/" -> "dist/index.html", "/articles" -> "dist/articles.html",
// "/articles/hello-world" -> "dist/articles/hello-world.html".
const urlPathToFilePath = (urlPath, outputDir, extension = ".html") => {
  const stripped = urlPath.replace(/^\//, "");
  const fileName = stripped === "" ? `index${extension}` : stripped + extension;
  return path.join(outputDir, fileName);
};

/**
 * Generate static HTML files from routes for each specified path.
 *
 * Unlike `createServerFromRoutes`, this function does not start an HTTP
 * server. It resolves every route value into a complete HTML string and
 * writes it to the output directory. Composed and streaming routes are
 * flattened into a single file; factory/callback routes are invoked with
 * a synthetic context derived from the matched params.
 *
 * @param {Object<string, any>} routes - Flat route map accepted by the matcher.
 * @param {string[]} paths - Array of URL paths to generate static HTML for.
 * @param {Object} [options]
 * @param {string} [options.baseDir] - Base directory for resolving file paths (default: process.cwd()).
 * @param {string} [options.outputDir] - Output directory for generated files (default: "dist").
 * @param {Object<string, Function>} [options.transforms] - Named transforms that routes may reference by name.
 * @param {string} [options.extension] - Extension used for generated files (default: ".html").
 * @returns {Promise<{generated: string[], errors: string[]}>}
 */
export async function createStaticFromRoutes(routes, paths, options = {}) {
  const {
    baseDir = process.cwd(),
    outputDir = "dist",
    transforms = {},
    extension = ".html",
  } = options;

  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  const matcher = createMatcher(routes);
  const generated = [];
  const errors = [];

  for (const urlPath of paths) {
    const match = matcher.match(urlPath);
    if (!match.found) {
      errors.push(`No route match for "${urlPath}"`);
      continue;
    }

    const ctx = { params: match.params, query: {}, pathname: urlPath };
    const routeValue =
      typeof match.value === "function"
        ? await match.value(ctx)
        : match.value;

    let html;

    if (typeof routeValue === "string") {
      html = await renderEntry(routeValue, ctx, baseDir, transforms);
    } else if (Array.isArray(routeValue)) {
      const chunks = await Promise.all(
        routeValue.map((entry) => renderEntry(entry, ctx, baseDir, transforms))
      );
      html = chunks.join("");
    } else if (routeValue && typeof routeValue === "object" && Array.isArray(routeValue.chunks)) {
      const chunks = await Promise.all(
        routeValue.chunks.map((entry) => renderEntry(entry, ctx, baseDir, transforms))
      );
      html = chunks.join("");
    } else if (typeof routeValue === "object" && routeValue.target) {
      html = await renderEntry(routeValue, ctx, baseDir, transforms);
    } else {
      errors.push(`Unresolved route value for "${urlPath}"`);
      continue;
    }

    const outputPath = urlPathToFilePath(urlPath, outputDir, ext);
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, html, "utf8");
    generated.push(outputPath);
  }

  return { generated, errors };
}
