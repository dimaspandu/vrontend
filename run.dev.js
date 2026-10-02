/**
 * Dev server.
 *
 * Serves src/ unbundled so the browser loads native ES modules straight from
 * disk. Edit any file and reload; there is no rebuild step in between.
 */
import fs from "fs";
import path from "path";
import { createServerFromRoutes } from "./libs/hashttp/src/hashttp.js";
import { compileJSX } from "./libs/ngapack/src/analyzer.js";
import { clientRoutes } from "./app.routes.js";
import { config, baseDir, resolveFromBase } from "./env.js";

const publicDir = resolveFromBase("src");
const ignoreDirs = new Set(["libs"]);

/**
 * Every .jsx file needs a route: the browser requests it as a module, but the
 * file on disk is not valid JavaScript. Scanning src/ keeps that list in sync
 * automatically instead of hand-maintaining one entry per view.
 */
function collectJsxRoutes(dir, routes = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) {
        collectJsxRoutes(full, routes);
      }
      continue;
    }

    if (!entry.name.endsWith(".jsx")) {
      continue;
    }

    const url = "/" + path.relative(publicDir, full).split(path.sep).join("/");

    routes[url] = {
      // hashttp resolves route targets against baseDir, not the cwd.
      target: path.relative(baseDir, full).split(path.sep).join("/"),
      transform: "compile-jsx",
      type: "text/javascript"
    };
  }

  return routes;
}

/**
 * hashttp memoizes served files for the lifetime of the process, which would
 * hide every edit made to a .jsx file. Reading from disk here instead of
 * trusting the passed-in content keeps hot edits working in dev.
 */
const transforms = {
  "compile-jsx": async (_content, _ctx, meta) => {
    const source = await fs.promises.readFile(resolveFromBase(meta.target), "utf8");
    return compileJSX(source, config.jsxFactory);
  }
};

const routes = collectJsxRoutes(publicDir);

for (const pattern of clientRoutes) {
  routes[pattern] = "src/index.html";
}

createServerFromRoutes(routes, {
  baseDir,
  publicDir,
  port: config.port,
  host: config.host,
  precedence: "routes",
  transforms
});