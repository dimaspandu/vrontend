# NGAPACK

## Overview

NGAPACK is a **lightweight experimental JavaScript bundler** that focuses on **semantic correctness**, **deterministic output**, and **runtime-oriented module loading**.

Instead of aggressive build-time transformations, NGAPACK is designed to:

* preserve native ESM semantics as much as possible
* validate how code actually behaves in the browser
* make bundler internals easy to inspect and reason about

This makes NGAPACK suitable for:

* learning how modern ESM bundlers work internally
* experimenting with dynamic imports and non-JS assets
* prototyping microfrontend and runtime-loading concepts

---

## Project Structure

Based on the current codebase, NGAPACK is organized as follows:

```
ngapack/
├─ src/                    # Core bundler implementation
│  ├─ analyzer/            # Module analysis logic
│  ├─ helper/              # Shared bundler utilities
│  ├─ runtime/             # Browser runtime helpers
│  ├─ analyzer.js
│  ├─ helper.js
│  └─ index.js             # Bundler entry point
│
├─ demo/                   # Minimal end-to-end bundling demo
│  ├─ src/                 # Source application
│  │  ├─ entry.js          # Entry point
│  │  ├─ greeting.js       # Plain ES module
│  │  ├─ style.module.css  # CSS module
│  │  ├─ global.css        # Plain CSS asset
│  │  └─ index.html        # HTML asset
│  ├─ public/              # Generated bundle output
│  ├─ bundle.js            # Bundler runner
│  ├─ serve.js             # Static server runner
│  └─ README.md
│
├─ test/                   # Integration & spec-style tests
│  ├─ public/              # Static assets served by dev server
│  ├─ src/                 # Test application source
│  │  ├─ assets/           # Images / non-JS assets
│  │  ├─ dynamic/          # Dynamic import experiments
│  │  │  ├─ colors.module.json
│  │  │  ├─ styles.module.css
│  │  │  ├─ twina.js
│  │  │  ├─ twinb.js
│  │  │  └─ twins.js
│  │  ├─ internal/         # Internal shared test modules
│  │  ├─ appendStyleSheet.js
│  │  ├─ entry.js          # Canonical test entry
│  │  ├─ entry.module.css
│  │  ├─ global.css
│  │  ├─ greetings.js
│  │  ├─ index.html
│  │  ├─ index.js
│  │  ├─ rpc.js
│  │  ├─ hail.js
│  │  ├─ sheetToCanonicalObject.js
│  │  └─ tester.js
│  ├─ index.js             # Test runner
│  ├─ serve.js             # Minimal dev HTTP server
│  └─ README.md
│
├─ .gitignore
├─ CHANGELOG.md
├─ LICENSE
└─ README.md
```

---

## Core Components

> **Upstream references**
>
> * Analyzer concepts are adapted from:
>   [https://github.com/dimaspandu/js-analyzer](https://github.com/dimaspandu/js-analyzer)
> * Runtime loader & registry ideas are adapted from:
>   [https://github.com/dimaspandu/djs](https://github.com/dimaspandu/djs)
>
> These repositories act as conceptual references. NGAPACK intentionally simplifies and refactors the ideas to fit its experimental goals.

---

### `src/analyzer.js`

Responsible for **static analysis only**.

Capabilities:

* Parses ES modules
* Extracts dependency metadata
* Distinguishes static vs dynamic imports
* Detects non-JS assets (CSS, JSON, HTML, images)
* Transpiles JSX to JavaScript via the `transpileJSX` module

Design constraints:

* No side effects
* No filesystem writes
* No runtime assumptions

---

### `src/index.js`

The orchestration layer of NGAPACK.

Responsibilities:

* Builds the dependency graph
* Resolves module identities and namespaces
* Enforces namespace-based isolation boundaries
* Coordinates output generation
* Delegates runtime helpers and asset handling

Design notes:

* Dependency graph construction is synchronous by design
* Filesystem access is restricted to the emission phase

---

### `src/runtime/`

Browser-only runtime utilities injected into bundle output.

Includes:

* Module registry
* Dynamic loader helpers
* CSS module application logic
* JSON module handling

Rules:

* Must not rely on Node.js APIs
* Must work in plain browser environments
* Should degrade gracefully when features are unavailable

---

## Namespace & Module Isolation

NGAPACK introduces the concept of **bundle-level namespaces** to provide
explicit logical isolation between independently built module graphs.

A namespace represents a **module identity boundary**, not just a label.

Namespaces are used to:

* Prevent module identity collisions across bundles
* Scope dynamic imports at runtime
* Enable safe microfrontend-style loading
* Allow multiple independent bundles to coexist in the same environment

A namespace must match between the **bundle producer** and the **bundle consumer**.
If a dynamic import references a bundle with a different namespace, it is treated
as an isolated module graph.

This mechanism is a foundational design choice in NGAPACK and is exercised
extensively by the integration test suite.

---

## Test System (`test/`)

The `test` directory functions as an **integration and behavioral specification suite**, not unit tests.

### Key ideas

* Tests describe **expected semantics**, not implementation details
* Bundled output is executed in a real browser-like environment
* Success is determined by runtime behavior, not snapshots

---

## Test System Details

The test flow is designed to validate ngapack end-to-end in a browser-like runtime.

### Execution flow

1. `test/index.js` runs the bundler twice.
2. Outputs are written into `test/public` (main app) and `test/public_microfrontend` (simulated remote bundle).
3. `test/serve.js` starts two static servers with CORS enabled.
4. Opening `http://localhost:2121` executes `test/src/entry.js`, which runs runtime-level specs.

### What each file does

* `test/index.js` builds both bundles and then starts the dev servers.
* `test/serve.js` is a minimal static server. It exists only for manual runtime verification.
* `test/src/entry.js` imports assets, runs dynamic imports, and validates runtime behavior.
* `test/src/sheetToCanonicalObject.js` defines the canonical CSS normalization used for assertions.

### Scenarios covered by `test/src/entry.js`

1. Static ES module imports
2. Dynamic JavaScript imports
3. Dynamic JSON modules
4. Dynamic CSS modules (with namespace isolation)
5. Multiple dynamic bundles sharing internal dependencies
6. Remote microfrontend module loading over HTTP
7. Asset-only imports (HTML, CSS, images) for emission verification

These are meant to act as executable specifications of ngapack’s runtime semantics.

---

### `test/src/entry.js`

Acts as the canonical integration entry point.

Validates:

1. Static ES module imports
2. Dynamic JavaScript imports
3. Dynamic JSON modules
4. Dynamic CSS modules (including namespace isolation)
5. Multiple dynamic chunks sharing internal dependencies
6. Runtime-loaded modules over HTTP (microfrontend-style)

Non-JS imports (HTML, CSS, images) are intentionally imported **for side effects**, to validate correct asset emission and runtime behavior.

These tests act as executable specifications for NGAPACK's runtime semantics,
including namespace-based isolation and remote module loading behavior.

---

### Canonical CSS Normalization

`sheetToCanonicalObject.js` defines the **semantic CSS contract** used by the test suite.

Purpose:

* Remove CSSOM expansion noise
* Normalize shorthand properties
* Enforce deterministic property ordering

This file is **not a general-purpose CSS utility**.

Any modification to its normalization rules is considered a **breaking semantic change** and requires corresponding test updates.

---

### `serve.js`

A minimal static HTTP server used for development and manual testing.

Features:

* Serves files from `test/public`
* Adds permissive CORS headers
* Avoids external dependencies

This server exists purely for demonstration and debugging purposes.

---

## How It Works (Flow)

At a high level, NGAPACK runs in four explicit phases:

1. **Analyze**: `src/analyzer.js` parses entry modules and extracts dependency metadata (static, dynamic, and non-JS assets).
2. **Graph**: `src/index.js` builds the dependency graph and assigns module identities within a namespace boundary.
3. **Emit**: the bundler writes output chunks and asset files into the selected output directory.
4. **Runtime**: `src/runtime/` helpers are injected so the browser can resolve modules, apply CSS/JSON modules, and load dynamic chunks at runtime.

### JSX Transpilation

NGAPACK transpiles JSX via the `transpileJSX` module. JSX is enabled by file extension: any dependency that resolves to a `.jsx` file is compiled with `compileJSX()` before ESM→CJS conversion.

```js
import Card from "./components/Card.jsx";        // transpiled
import Card from "./components/Card.js";         // plain JavaScript
```

The factory name is configured once, at the bundler level:

```js
await bundler({
  entry,
  outputDir,
  jsxFactory: "elementBuilder"
});
```

The factory name is resolved in this order:

1. The bundler-level `jsxFactory` option (highest priority)
2. `/** @jsx name */` pragma at the top of the target file
3. Default `"d"`

A legacy `with { type: "jsx" }` import assertion no longer enables transpilation and is ignored with a warning; use the `.jsx` extension instead.

The factory must be available at runtime — typically defined in the application code itself. It is called in two forms:

```js
factory(tag, props, ...children)   // elements
factory.fragment(...children)      // <>...</>
```

A fragment (`<>...</>`) is compiled into a call to `factory.fragment()`, so the factory must expose it as a property of the exported function. SVG and other namespaced elements are passed as a normal `tag` string — it is the factory's job to route them to `document.createElementNS()` if required. See `demo/src/factories/elementBuilder.js` for a reference implementation.

If you want to trace the full end-to-end behavior, use `test/index.js` - it is executable documentation that exercises all core behaviors.

---

## Quick Start (Manual Spec Run)

Prerequisite: a recent Node.js version with native ESM support.

Run the integration spec and start the dev servers:

```bash
node test/index.js
```

Then open:

* `http://localhost:2121` - main bundle
* `http://localhost:2222` - simulated remote microfrontend bundle

The console output of `test/index.js` should describe what was bundled and where outputs were emitted.

---

## Dev Serve (No Bundle)

If you want to inspect raw `test/src` behavior without bundling, use the dev server.
This avoids npm and external dependencies entirely.

Run:

```bash
node test/serve-dev.js
```

Then open:

* `http://localhost:2131` - raw `test/src` served directly

Notes:

* Asset-only imports are not exercised in this mode.
* Your browser must support native ESM and import assertions for JSON/CSS modules.
* Live reload is focus-based: the page reloads only when the window/tab regains focus and files changed.
* If you also want the microfrontend test to succeed, run the bundled server separately on port 2222.

---

## Dev Workflow Notes

* The dev server exposes a lightweight change-check endpoint at `/__mtime` for focus-based reload.
* Reload only happens when the browser regains focus, so edits in your IDE do not trigger extra background activity.

---

## Design Principles

* Prefer semantic correctness over aggressive optimization
* Avoid hidden magic or implicit behavior
* Keep runtime behavior explicit and inspectable
* Clearly separate analysis, bundling, and runtime concerns

NGAPACK is intentionally small so contributors can understand the entire system end-to-end.

---

## Contribution Notes

* Keep analyzer logic pure and side-effect free
* Do not introduce Node.js APIs into runtime code
* Treat canonical logic as a specification, not a helper
* Favor clarity over cleverness
