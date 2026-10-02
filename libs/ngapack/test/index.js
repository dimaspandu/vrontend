/**
 * Test entry for ngapack
 *
 * This file acts as an executable integration specification.
 * It validates ngapack behavior end-to-end by:
 *
 * - Running the bundler with concrete entry files
 * - Emitting output into static directories
 * - Simulating a remote microfrontend bundle
 * - Starting a local static server for manual inspection
 *
 * NOTE:
 * This is NOT a unit test.
 * Treat this file as runtime-level executable documentation.
 */

import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Import the bundler entry point
import bundler from "../src/index.js";

/**
 * Resolve __filename and __dirname for ESM.
 * Node.js does not provide these globals in ES modules.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ---------------------------------------------------------
 * Microfrontend bundle (external / remote simulation)
 * ---------------------------------------------------------
 *
 * This bundle simulates a remote microfrontend that will be
 * dynamically imported over HTTP by the main application.
 * 
 * namespace:
 *   Logical isolation boundary for the bundle.
 *
 *   The namespace is embedded into the output and used by the runtime
 *   to:
 *   - Avoid module identity collisions
 *   - Scope dynamic imports
 *   - Safely load multiple bundles into the same environment
 *
 *   In this test, the namespace "MicroFrontend" simulates a remote
 *   bundle that must not interfere with the main application graph.
 */
await bundler({
  entry: path.join(__dirname, "as-if-microfrontend", "entry.js"),
  outputDir: path.join(__dirname, "public_microfrontend"),
  namespace: "MicroFrontend",
  uglified: true // simulate production-like output
});

/**
 * ---------------------------------------------------------
 * Main application bundle
 * ---------------------------------------------------------
 *
 * This bundle exercises the full ngapack feature set:
 * - Static imports
 * - Dynamic imports (JS, JSON, CSS)
 * - CSS modules
 * - Shared internal dependencies
 * - Remote HTTP-based dynamic modules
 */
await bundler({
  entry: path.join(__dirname, "src", "entry.js"),
  outputDir: path.join(__dirname, "public"),
  outputFilename: "entry.js",
  uglified: true // helps surface production-only issues
});

/**
 * ---------------------------------------------------------
 * Static server startup
 * ---------------------------------------------------------
 *
 * The server is intentionally decoupled from the bundler.
 * It exists only for local testing and manual verification.
 */
await import("./serve.js");
