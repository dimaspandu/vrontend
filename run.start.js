/**
 * Production preview server.
 *
 * Serves the built output folder exactly as it would be served in production.
 * Run `node run.bundle.js` first: this script does not build anything.
 */
import { createServerFromRoutes } from "./libs/hashttp/src/hashttp.js";
import { clientRoutes } from "./app.routes.js";
import { config, baseDir, resolveFromBase } from "./env.js";

/**
 * Every client route resolves to the built shell, so a hard reload or a shared
 * deep link such as /task/12 still boots the SPA instead of returning 404.
 * Paths the SPA does not own fall through to static serving and, failing that,
 * to the 404 page.
 */
const routes = {};

for (const pattern of clientRoutes) {
  routes[pattern] = `${config.outputDir}/index.html`;
}

createServerFromRoutes(routes, {
  // Route targets are resolved against baseDir, static files against publicDir.
  baseDir,
  publicDir: resolveFromBase(config.outputDir),
  port: config.port,
  host: config.host,
  fallback: "404.html"
});