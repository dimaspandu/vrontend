# NGAPACK Bundler Core (`src/`)

This directory contains the **core bundler implementation** of NGAPACK.

It is organized by capability, not by language runtime. Each component is fully decoupled and can be used independently.

## Structure

```
src/
├─ analyzer.js              # Static analysis entry point
├─ helper.js                # Shared utility barrel
├─ index.js                 # Bundler orchestration entry point
│
├─ analyzer/                # Module analysis logic
│  ├─ CHANGELOG.md
│  ├─ README.md
│  ├─ test/                 # Analyzer test suite
│  ├─ utils/                # Shared parsing utilities
│  └─ lib/                  # Capability modules
│     ├─ tokenizer/         # JS, CSS, HTML, JSON tokenizers
│     ├─ stringifyTokens/   # Token → source stringifiers
│     ├─ minifier/          # JS, CSS, HTML, JSON minifiers
│     ├─ extractModules/    # Import/export detection
│     ├─ transpileImportTokensToCJS/
│     ├─ transpileExportTokensToCJS/
│     ├─ convertESMToCJSWithMeta/
│     └─ transpileJSX/      # JSX → JS compiler
│
├─ helper/                  # Shared bundler utilities
│  ├─ ensureJsExtension.js
│  ├─ escapeForDoubleQuote.js
│  ├─ isAssetExtension.js
│  ├─ isJSXExtension.js
│  ├─ isModuleAsset.js
│  ├─ logger.js
│  ├─ mapToDistPath.js
│  ├─ processAndCopyFile.js
│  ├─ uglifyJS.js
│  └─ unwrapNestedLiteral.js
│
└─ runtime/                 # Browser runtime helpers (injected into bundles)
   ├─ template.js          # Runtime bootstrap template
   ├─ runtime.js
   ├─ env.mock.js
   ├─ run.test.js
   ├─ test.html
   ├─ LICENSE
   ├─ README.md
   ├─ resources/somewhere.js
   └─ dynamic/             # Dynamic module test fixtures
      ├─ styles.js
      ├─ rpc.js
      ├─ colors.js
```

## Core files

### `src/index.js`

The **bundler entry point**. Orchestrates the full pipeline:

1. **Analyze** — parses entry modules and extracts dependency metadata.
2. **Graph** — builds the dependency graph and assigns module identities within a namespace boundary.
3. **Emit** — writes output chunks and asset files into the selected output directory.
4. **Runtime** — injects runtime helpers so the browser can resolve modules at runtime.

Design notes:

- Dependency graph construction is synchronous by design.
- Filesystem access is restricted to the emission phase.

### `src/analyzer.js`

Responsible for **static analysis only**.

Capabilities:

- Parses ES modules
- Extracts dependency metadata
- Distinguishes static vs dynamic imports
- Detects non-JS assets (CSS, JSON, HTML, images)
- Transpiles JSX to JavaScript via the `transpileJSX` module

Design constraints:

- No side effects
- No filesystem writes
- No runtime assumptions

### `src/helper.js`

Barrel re-export for shared bundler utilities. See `src/helper/` for individual implementations.

### `src/runtime/`

Browser-only runtime utilities injected into bundle output.

Includes:

- Module registry
- Dynamic loader helpers
- CSS module application logic
- JSON module handling

Rules:

- Must not rely on Node.js APIs
- Must work in plain browser environments
- Should degrade gracefully when features are unavailable

## How to use

Import the bundler directly:

```js
import bundler from "./src/index.js";

await bundler({
  entry: "./src/entry.js",
  outputDir: "./public",
  outputFilename: "entry.js",
  uglified: true
});
```

See [`../README.md`](../README.md) for full project documentation and [`../demo/`](../demo) for a minimal end-to-end example.