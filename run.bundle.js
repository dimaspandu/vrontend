/**
 * Production build.
 *
 * ngapack walks the module graph starting from src/pre-index.js and writes the
 * result to the output folder. Output: an IIFE bundle at <OUTPUT_DIR>/index.js
 * plus one chunk per dynamically imported view.
 */
import bundler from "./libs/ngapack/src/index.js";
import { config, resolveFromBase } from "./env.js";

await bundler({
  // pre-index.js is the bundler entry: it lists every file that must be
  // emitted, and pulls in the application through its ./index.js import.
  entry: resolveFromBase("src", "pre-index.js"),

  // Name of the JSX factory the transpiler emits calls to. Each .jsx file must
  // import that factory itself, since the transpiler never adds the import.
  jsxFactory: config.jsxFactory,

  outputDir: resolveFromBase(config.outputDir),

  // Requires the `terser` CLI on PATH. Set MINIFY=false in .env to skip
  // minification and keep the build fully offline.
  uglified: config.minify
});