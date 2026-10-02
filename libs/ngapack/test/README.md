# NGAPACK Test System

The `test/` directory is an **integration and behavioral specification suite**, not a traditional unit-test framework.

## Core idea

Tests describe **expected runtime semantics**, not implementation details. Bundled output is executed in a real browser-like environment, and success is determined by runtime behavior — not snapshots.

## What's inside

```
test/
├─ index.js                # Bundler runner + dev server starter
├─ serve.js                # Static server (main + microfrontend)
├─ serve-dev.js            # Static server (raw src, no bundle)
├─ as-if-microfrontend/    # Simulated remote microfrontend bundle
├─ public/                 # Generated: main app bundle output
├─ public_microfrontend/    # Generated: remote bundle output
└─ src/                    # Test application source
   ├─ entry.js             # Canonical integration entry point
   ├─ tester.js            # Test assertion helper
   ├─ index.html           # Entry HTML
   ├─ index.dev.html       # Dev-mode entry HTML
   ├─ entry.dev.js         # Dev-mode entry (no bundle)
   ├─ entry.module.css     # CSS module consumed by entry.js
   ├─ global.css           # Global CSS asset
   ├─ greetings.js         # Static import target
   ├─ rpc.js               # Dynamic import target
   ├─ appendStyleSheet.js  # Runtime CSS helper
   ├─ sheetToCanonicalObject.js  # Canonical CSS normalization spec
   ├─ shared/message.js    # Shared dependency (static + dynamic)
   ├─ internal/unnecessary.js    # Internal shared module
   ├─ assets/favicon.ico   # Static asset
   └─ dynamic/             # Dynamic import targets
      ├─ twina.js, twinb.js, twins.js
      ├─ styles.module.css
      ├─ colors.module.json
      ├─ rpc.js, hail.js
      └─ sharedA.js, sharedB.js
```

## Execution flow

1. `test/index.js` runs the bundler twice:
   - Builds the microfrontend bundle → `test/public_microfrontend/`
   - Builds the main app bundle → `test/public/`
2. `test/serve.js` starts two static servers:
   - `http://localhost:2121` — main bundle
   - `http://localhost:2222` — simulated remote microfrontend
3. Opening `http://localhost:2121` executes `test/src/entry.js`, which runs runtime-level specs.

## Scenarios covered by `test/src/entry.js`

1. Static ES module imports
2. Dynamic JavaScript imports
3. Dynamic JSON modules
4. Dynamic CSS modules (with namespace isolation)
5. Multiple dynamic bundles sharing internal dependencies
6. Remote microfrontend module loading over HTTP
7. Asset-only imports (HTML, CSS, images) for emission verification

These act as **executable specifications** of ngapack's runtime semantics, including namespace-based isolation and remote module loading behavior.

## Quick start

```bash
node test/index.js
```

Then open:
- `http://localhost:2121` — main bundle
- `http://localhost:2222` — simulated remote microfrontend bundle

## Dev serve (no bundle)

If you want to inspect raw `test/src` behavior without bundling:

```bash
node test/serve-dev.js
```

Then open `http://localhost:2131`.

Notes:
- Asset-only imports are not exercised in this mode.
- Your browser must support native ESM and import assertions for JSON/CSS modules.
- Live reload is focus-based: the page reloads only when the window/tab regains focus and files changed.

## Key files

### `test/index.js`

Builds both bundles and starts the dev servers. This is the canonical entry point for the integration spec.

### `test/serve.js`

A minimal static HTTP server. Serves files from `test/public` and `test/public_microfrontend`. Enables CORS for cross-port dynamic imports. Exists purely for manual runtime verification.

### `test/serve-dev.js`

Dev server that serves raw `test/src` without bundling. Exposes a lightweight change-check endpoint at `/__mtime` for focus-based reload.

### `test/src/entry.js`

The canonical integration entry point. Imports assets, runs dynamic imports, and validates runtime behavior.

### `test/src/sheetToCanonicalObject.js`

Defines the **semantic CSS contract** used by the test suite. Purpose:
- Remove CSSOM expansion noise
- Normalize shorthand properties
- Enforce deterministic property ordering

This file is **not a general-purpose CSS utility**. Any modification to its normalization rules is considered a **breaking semantic change** and requires corresponding test updates.

## Design rules

- Keep analyzer logic pure and side-effect free
- Do not introduce Node.js APIs into runtime code
- Treat canonical logic as a specification, not a helper
- Favor clarity over cleverness