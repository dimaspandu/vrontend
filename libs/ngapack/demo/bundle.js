/**
 * Bundle the demo with ngapack.
 *
 * Usage:
 *   node demo/bundle.js
 *
 * Output is written to demo/public/entry.js
 */

import path from "path";
import { fileURLToPath } from "url";

import bundler from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await bundler({
  entry: path.join(__dirname, "src", "entry.js"),
  jsxFactory: "elementBuilder",
  outputDir: path.join(__dirname, "public"),
  outputFilename: "entry.js",
  uglified: true
});

console.log("Demo bundled successfully → demo/public/entry.js");