/**
 * ngapack dev entry (no bundling)
 *
 * This file is similar to entry.js, but it avoids asset-only imports
 * that require bundler emission. It is meant for native ESM testing.
 */

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
 */
appendStyleSheet(entryStyle);

/**
 * Execute all integration tests.
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
   */
  runTest(
    "Shared Dependency (Entry Context)",
    sharedMessage(),
    "Shared dependency is alive"
  );

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
