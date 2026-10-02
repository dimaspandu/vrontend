/**
 * ngapack test entry
 *
 * This file serves as an integration and specification test for ngapack.
 * It exercises multiple module types and loading strategies to ensure:
 * - Static imports work correctly
 * - Dynamic imports are bundled and resolved properly
 * - Non-JS assets are emitted to the output directory
 * - Runtime behavior matches browser expectations
 */

/**
 * Asset-only imports.
 *
 * These imports exist solely to verify that non-JS assets
 * are copied (or processed) into the output directory.
 * They are not consumed by JavaScript at runtime.
 */
import "./assets/favicon.ico"; // copy assets/favicon.ico to public
import "./global.css";         // copy global.css to public
import "./index.html";         // copy index.html to public

/**
 * Test utilities and core modules.
 */
import runTest from "./tester.js";
import greetings from "./greetings.js";
import entryStyle from "./entry.module.css" with { type: "css" };
import appendStyleSheet from "./appendStyleSheet.js";
import sheetToCanonicalObject from "./sheetToCanonicalObject.js";
import Unnecessary from "./internal/unnecessary.js";

/**
 * Shared module imported statically by the entry.
 * (e.g. used directly here)
 */
import sharedMessage from "./shared/message.js";

/**
 * Attach the entry CSS module to the document.
 *
 * This call verifies that:
 * - CSS modules exported by ngapack can be consumed at runtime
 * - The exported value is either a native CSSStyleSheet (preferred),
 *   or a raw CSS string fallback in unsupported environments
 * - The stylesheet is successfully applied to the document
 *
 * This also serves as a smoke test for the CSS module runtime pipeline.
 */
appendStyleSheet(entryStyle);

/**
 * Execute all integration tests.
 *
 * Covered scenarios:
 * 1. Static ES module import
 * 2. Dynamic JavaScript module
 * 3. Dynamic JSON module
 * 4. Dynamic CSS module (with namespace)
 * 5. Multiple dynamic bundles sharing internal dependencies
 * 6. Remote microfrontend module over HTTP
 */
async function runAllTests() {
  /**
   * 1. Static synchronous module test.
   */
  runTest(
    "Greeting Module Default Export",
    greetings,
    "Hello, World!"
  );

  /**
   * 2. Dynamic JavaScript module test.
   */
  const rpc = await import("./dynamic/rpc.js");
  runTest(
    "RPC Module getMessage Output",
    rpc.getMessage(),
    "Hello, World! You alright, Mate?"
  );

  /**
   * 3. Dynamic JSON module test.
   */
  const colors = await import("./dynamic/colors.module.json", {
    with: { type: "json" }
  });
  runTest(
    "Colors Module Dynamic JSON",
    colors.default,
    {
      primary: "#2563eb",
      secondary: "#6b7280",
      accent: "#10b981"
    }
  );

  /**
   * 4. Dynamic CSS module test with explicit namespace.
   */
  const styles = await import("./dynamic/styles.module.css", {
    namespace: "DynamicCSS",
    with: { type: "css" }
  });

  const expectedCSSObject = {
    ":root": {
      "--accent": "#2563eb"
    },
    body: {
      "font-family": "sans-serif",
      background: "rgb(246, 247, 251)",
      padding: "20px"
    },
    h1: {
      color: "var(--accent)"
    },
    "p.styled": {
      color: "rgb(16, 185, 129)",
      "font-weight": "bold"
    }
  };

  /**
   * Prefer native CSSStyleSheet when supported.
   * Fallback to raw CSS string otherwise.
   */
  try {
    // Accessing CSSStyleSheet may throw in unsupported runtimes
    if (!(styles.default instanceof CSSStyleSheet)) {
      throw new Error("CSSStyleSheet not supported");
    }

    runTest(
      "Styles Module Dynamic CSS (native CSSStyleSheet)",
      sheetToCanonicalObject(styles.default),
      expectedCSSObject
    );
  } catch {
    runTest(
      "Styles Module Dynamic CSS (unsupported runtime)",
      styles.default,
      `
        :root {
          --accent: #2563eb;
        }

        body {
          font-family: sans-serif;
          background: #f6f7fb;
          padding: 20px;
        }

        h1 {
          color: var(--accent);
        }

        p.styled {
          color: #10b981;
          font-weight: bold;
        }
      `
    );
  }

  /**
   * 5. Dynamic bundle A.
   */
  const { twina } = await import("./dynamic/twina.js");
  runTest(
    "Twin A",
    twina(),
    "I'm used by A(1)!"
  );

  /**
   * 6. Dynamic bundle B.
   */
  const { twinb } = await import("./dynamic/twinb.js");
  runTest(
    "Twin B",
    twinb(),
    "I'm used by B(2)!"
  );

  /**
   * 7. Remote microfrontend module test.
   * 
   * The `namespace` option ensures that this remote bundle
   * is resolved within its own isolated module scope,
   * even though it is loaded dynamically over HTTP.
   */
  try {
    // This remote module is intentionally external and may be unavailable.
    const somewhere = await import(
      "http://localhost:2222/message.js",
      { namespace: "MicroFrontend" }
    );

    runTest(
      "Try => Somewhere Dynamic Module (Microfrontend)",
      somewhere.default,
      "Hello! I'm from somewhere!",
      true
    );
  } catch {
    runTest(
      "Catch => Somewhere Dynamic Module (Microfrontend)",
      "Error loading external dynamic module.",
      "Error loading external dynamic module.",
      true
    );
  }

  /**
   * 8. Shared dependency duplication test.
   *
   * This test verifies the bundler invariant introduced in v1.2.2:
   *
   * - A module that is imported statically by the entry bundle
   *   AND dynamically by multiple separated bundles
   *   must remain available in all contexts.
   *
   * This ensures:
   * - Dynamic bundles do NOT "steal" shared dependencies
   * - Entry bundle remains fully self-sufficient
   * - Duplicate module definitions across bundles are safe
   *   due to runtime execution caching
   */

  runTest(
    "Shared Dependency (Entry Context)",
    sharedMessage(),
    "Shared dependency is alive"
  );

  /**
   * The same shared module is also imported dynamically
   * through two different separated bundles.
   *
   * Each dynamic bundle contains its own copy of the dependency,
   * but runtime execution must resolve to a valid module instance.
   */
  const sharedA = await import("./dynamic/sharedA.js");
  const sharedB = await import("./dynamic/sharedB.js");

  runTest(
    "Shared Dependency (Dynamic Bundle A)",
    sharedA.default(),
    "Shared dependency is alive"
  );

  runTest(
    "Shared Dependency (Dynamic Bundle B)",
    sharedB.default(),
    "Shared dependency is alive"
  );
}

/**
 * Start integration test execution.
 */
runAllTests();
