# Changelog

All notable changes to this project will be documented in this file.

---

## [1.4.1] - 2026-10-02

### Fixed
- Multiline `export const/let/var` assignments are no longer truncated when the initializer continues on the next line (`src/analyzer/utils/getExportBlockEndIndex.js`).
  - The statement-boundary scanner treated any line break as a terminator, so a break directly after an operator still awaiting its right-hand operand produced invalid output such as `const createDOMPP = ;() => installDOMPP();`.
  - The line-break heuristic is now skipped for continuation operators (assignment, `=>`, comma, arithmetic, logical/comparison, ternary, compound assignment).
  - Explicit `;` detection and balanced-bracket scanning are unchanged, so single-line statements and block-bodied arrows behave exactly as before.

### Added
- Regression tests for multiline export assignments in `src/analyzer/lib/transpileExportTokensToCJS/test/index.js`, including a guard that simple values still terminate at a line break.
- `runExportTranspileFromSource` test helper that tokenizes real source first, so tests carry `line` info and actually exercise the line-break heuristic.

### Changed
- Documented `getExportBlockEndIndex` and its statement-boundary rules in `src/analyzer/lib/transpileExportTokensToCJS/README.md`.
- Recorded the analyzer change in `src/analyzer/CHANGELOG.md` (1.2.7).

---

## [1.4.0] - 2026-10-01

### Changed (breaking)
- JSX is now enabled by file extension instead of import assertion.
  - Any dependency that resolves to a `.jsx` file is transpiled with `compileJSX()`.
  - `import x from "./foo.js" with { type: "jsx", factory: "h" }` no longer enables transpilation; the assertion is ignored and reported as a warning.
- The JSX factory is configured once through the new bundler-level `jsxFactory` option.

### Added
- `jsxFactory` bundler option, applied to every `.jsx` module in the graph.
  - Resolution order: bundler option > `/** @jsx name */` pragma > `"d"`.
- `src/helper/isJSXExtension.js` — single source of truth for JSX extension detection.
- `.jsx` added to the JavaScript module extension list in `src/index.js`.
- `.jsx` accepted by the runtime extension allowlist (`src/runtime/template.js`, `src/runtime/runtime.js`), so dynamically imported JSX chunks load with their emitted `.js` filename.

### Demo
- `demo/src/components/Card.js` → `Card.jsx`, `demo/src/components/DynamicCard.js` → `DynamicCard.jsx`.
- `demo/src/entry.js` uses plain `import Card from "./components/Card.jsx"` and `import("./components/DynamicCard.jsx")`.
- `demo/bundle.js` passes `jsxFactory: "elementBuilder"`.

---

## [1.3.6] - 2026-09-30

### Added
- `demo/src/factories/elementBuilder.js` now supports the full JSX surface emitted by the transpiler.
  - `elementBuilder.fragment(...children)` maps `<></>` to `document.createDocumentFragment()`.
  - A literal `fragment` tag is handled the same way.
  - SVG tags (`svg`, `path`, `circle`, `text`, ...) are created with `document.createElementNS("http://www.w3.org/2000/svg", tag)`.
  - On SVG nodes `className` and `style` are written as attributes, and camelCase props such as `strokeWidth` are converted to kebab-case attributes, while canonical camelCase attributes (`viewBox`, `preserveAspectRatio`, ...) are kept verbatim.

### Changed
- `demo/src/components/Card.js` exercises a fragment and an inline SVG icon.
- Documented the two factory call shapes (`factory(tag, props, ...children)` and `factory.fragment(...)`) in `README.md`.
- Corrected `demo/README.md` to show the supported dynamic import form `import(path, { type: "jsx", factory: "..." })` instead of the unsupported `import(path, with { ... })`.

---

## [1.3.5] - 2026-09-28

### Added
- Dynamic JSX import support in demo.
  - `entry.js` now demonstrates `import("./DynamicCard.js", { type: "jsx", factory: "elementBuilder" })`.
  - The bundler extracts the dependency and applies the same transpilation pipeline as static imports.
  - New `components/DynamicCard.js` component loaded at runtime.

### Changed
- Update `demo/README.md` to document dynamic JSX import.

---

## [1.3.4] - 2026-09-27

### Changed
- Remove automatic `.jsx` transpilation.
  - Bundler no longer treats `.jsx` files as modules by default.
  - JSX transpilation is triggered only by import assertion:
    `import x from "./foo.js" with { type: "jsx", factory: "h" };`
  - This keeps behavior explicit and avoids surprising transpilation of files
    that merely happen to have a `.jsx` extension.

### Changed
- Refactor `demo/` to use a clearer structure:
  - `factories/` — JSX factory implementations
  - `components/` — JSX components (transpiled via assertion)
  - `entry.js` — orchestrator only, no inline logic
- Rename `components/Card.jsx` → `components/Card.js` to demonstrate that
  JSX transpilation works regardless of file extension.

---

## [1.3.3] - 2026-09-27

### Added
- Automatic JSX transpilation for `.jsx` files.
  - No import assertion required — any file with a `.jsx` extension is transpiled.
  - Factory name resolved via `/** @jsx */` pragma, or defaults to `"d"`.

### Changed
- Refactor `demo/` to use a clearer structure:
  - `factories/` — JSX factory implementations
  - `components/` — JSX components (transpiled)
  - `entry.js` — orchestrator only, no inline logic
- `createNode()` in `src/index.js` now transpiles `.jsx` files automatically.
- `createGraph()` forwards `true` for `.jsx` files, and the assertion `factory` value for `.js` files.

---

## [1.3.2] - 2026-09-27

### Added
- Custom JSX factory name support via import assertion.
  - `import x from "./foo.js" with { type: "jsx", factory: "elementBuilder" };`
  - The `factory` key overrides the default `"d"` and any `/** @jsx */` pragma in the target file.
  - Factory resolution order: assertion `factory` > `@jsx` pragma > default `"d"`.

### Changed
- `createNode()` in `src/index.js` now accepts a `jsxFactory` parameter (truthy string or `true`).
- `createGraph()` extracts `factory` from `dependency.assertions` and forwards it to child nodes.

---

## [1.3.1] - 2026-09-27

### Added
- JSX transpilation support via the `transpileJSX` module.
  - Triggered by import assertions: `import x from "./foo.js" with { type: "jsx" };`
  - The bundler runs `compileJSX()` on the target file before ESM→CJS conversion.
  - Factory name resolved via `/** @jsx name */` pragma, or defaults to `"d"`.
  - Exported `compileJSX` from `src/analyzer.js` for reuse.
  - Documented in `README.md` under "How It Works (Flow)".

### Changed
- `createNode()` in `src/index.js` now accepts an `isJSX` flag to pre-process files via `compileJSX()`.
- `createGraph()` detects `type: "jsx"` in import assertions and forwards the flag to child nodes.

### Internal
- Update `src/analyzer.js` barrel to re-export `compileJSX`.

---

## [1.3.0] - 2026-09-27

### Changed
- Rename the core `bundler/` directory to `src/` for a clearer, more conventional project layout.
  - All source files, the analyzer, helpers, and runtime are now under `src/`.
  - Updated all internal import paths (`../bundler/` → `../src/`) in `test/index.js` and `demo/bundle.js`.
  - Updated documentation references in `README.md` and `CHANGELOG.md`.

### Added
- New `src/README.md` documenting the core bundler implementation structure, subdirectories, and usage.

### Internal
- Add `demo/public/` to `.gitignore` to keep generated demo output out of version control.
- Add agent model directories (`.kilo/`, `.kilocode/`, `.opencode/`) to the root `.gitignore`.

---

## [1.2.9] - 2026-09-26

### Added
- New `transpileJSX` module in `src/analyzer` — minimal JSX-to-JS compiler that transforms JSX syntax into `d(tag, props, ...children)` call expressions.
  - Supports customizable factory name via `compileJSX(source, factory)` parameter or `/** @jsx name */` pragma in source.
  - Features: elements, self-closing tags, fragments (`<>...</>` → `factory.fragment(...)`), spread attributes, boolean attributes, expression containers, template literals in expressions.
- Comprehensive test suite (20 test cases) covering basic JSX, custom factory, pragma parsing, fragments, error handling, and demo-level components.

### Internal
- Update analyzer to version 1.2.6, including the new `transpileJSX` module and its test coverage.

---

## [1.2.8] - 2026-08-13

### Fixed
- Fixed HTML minifier to collapse newlines between text nodes and inline elements into a single space, matching standard HTML whitespace behavior.
- Removed unwanted leading/trailing spaces in minified output for multiline text content.

### Internal
- Update analyzer to version 1.2.5, including multiline text node collapsing and inline element whitespace handling.

---

## [1.2.7] - 2026-05-02

### Added
- Add boilerplate example demonstrating ngapack usage with polished structure and consistent naming.

### Internal
- Update analyzer to version 1.2.2, including test cases for export default async function (named and anonymous) in convertESMToCJSWithMeta module.

---

## [1.2.6] - 2026-04-28

### Changed
- Polish the `boilerplate` example with clearer naming, more consistent formatting,
  and more descriptive English comments across the browser entry files and Node.js runners.
- Refine the boilerplate HTML and global styles for cleaner structure and baseline layout consistency.

### Internal
- Standardize `node:` imports and helper naming in boilerplate runner scripts for better maintainability.
- Ignore every `dist` directory anywhere in the repository through the root `.gitignore`.

---

## [1.2.5] - 2026-04-26

### Internal
- Update analyzer to version 1.2.1, including improvements to transpileExportTokensToCJS and removal of old transpileImportTokensToCJS versions.

---

## [1.2.3] - 2026-03-30

### Added
- Add dev-only static server (`test/serve-dev.js`) to serve raw `test/src` without bundling.
- Add dev HTML entry (`test/src/index.dev.html`) and dev JS entry (`test/src/entry.dev.js`).
- Add lightweight on-focus reload using a change-check endpoint.

### Changed
- Expand README with execution flow, test system details, and dev workflow notes.

### Internal
- Expose `/__mtime` endpoint in the dev server for change detection.

---

## [1.2.2] - 2026-02-02

### Fixed
- Fix missing module errors when the same dependency is referenced by both
  static imports in the entry bundle and dynamic imports in separated bundles.
- Ensure dynamically separated bundles no longer “steal” shared dependencies
  from the entry bundle during bundle assignment.
- Prevent runtime `Module not found` errors caused by exclusive bundle ownership
  of shared modules.
- Ensure shared modules remain accessible from both entry and dynamic bundles
  when duplicated across outputs.

### Changed
- Revise `createBundle()` strategy to allow the same module to exist
  in multiple bundles when required.
- Entry bundle now always contains all non-separated (static) modules,
  guaranteeing it is fully self-sufficient.
- Each dynamic bundle now includes a full copy of its dependency subtree,
  even if those modules already exist in the entry bundle.

### Design Notes
- This release intentionally trades bundle size for correctness and determinism.
- Module deduplication is handled at runtime execution level, not during bundling.
- Cross-bundle dependency resolution is explicitly avoided to keep the runtime
  synchronous and stable.

### Internal
- Remove the assumption that a module can belong to only one bundle.
- Reframe bundle ownership as a per-bundle inclusion decision rather than
  a global module property.
- Align bundler behavior with documented runtime invariants regarding
  module registration and execution caching.
- Add integration coverage for shared dependencies duplicated across bundles.

---

## [1.2.1] - 2026-01-30

### Fixed
- Prevent bundler crash when encountering **dynamic imports with non-literal specifiers**
  (e.g. `import(variable)`).
- Safely skip unresolved dynamic dependencies whose `module` field is `null`
  during dependency graph construction.
- Ensure non-statically-resolvable dynamic imports do not participate in
  path resolution, graph expansion, or runtime module mapping.

### Internal
- Add explicit guard logic in `createGraph()` to defensively handle
  analyzer metadata that cannot be resolved at build time.
- Improve graph construction robustness without altering bundling
  or runtime semantics.

---

## [1.2.0] - 2026-01-28

### Added
- Formalize **microfrontend-style runtime loading** as a first-class
  integration scenario.
- Document **HTTP-based remote module loading** as a supported and
  intentional runtime behavior.
- Introduce explicit documentation for **bundle-level namespaces**
  as a module identity and isolation mechanism.
- Promote the integration test suite as **executable runtime specifications**.

### Changed
- Reframe the test system from example-based testing into
  **behavioral and semantic verification**.
- Clarify the relationship between:
  - independently built bundles
  - runtime module resolution
  - namespace-based isolation
- Refine test runner and development server roles to reflect
  their purpose in validating runtime semantics rather than tooling output.

### Improved
- Improve conceptual alignment between:
  - analyzer responsibilities
  - bundler orchestration
  - runtime execution model
  - microfrontend loading behavior
- Improve documentation clarity around dynamic imports, remote modules,
  and isolated bundle graphs.
- Strengthen project positioning as a runtime-oriented bundler experiment.

### Docs
- Add dedicated documentation covering:
  - microfrontend-style loading
  - namespace isolation semantics
  - executable test specifications
- Improve README structure and wording without altering runtime behavior.

### Internal
- No changes to bundling or runtime logic.
- This release focuses on **design clarity, documentation, and specification fidelity**.

---

## [1.1.0] - 2026-01-26

### Added
- Introduce explicit `.module.*` convention for asset modules (CSS, SVG, HTML, XML, JSON)
- Add helper utilities to clearly distinguish module assets from plain static assets
- Add integration specification covering:
  - Static and dynamic JS modules
  - Dynamic JSON and CSS modules
  - CSSStyleSheet runtime fallback behavior
  - Remote HTTP microfrontend modules

### Changed
- Non-module assets (`.css`, `.svg`, `.html`, `.xml`, `.json` without `.module.`)
  are no longer bundled as JavaScript modules and are emitted as static assets instead
- Asset handling logic is now centralized and consistent across:
  - dependency graph construction
  - runtime module mapping
  - output emission
- Non-module CSS assets are minified using SAFE CSS minification before emission

### Improved
- Make module graph construction deterministic by ensuring only bundled modules
  are registered in runtime mappings
- Clarify and document asset vs module behavior throughout the bundler pipeline
- Improve code readability with explicit decision points and defensive comments

### Internal
- Refactor asset handling paths to eliminate implicit behavior
- Add helper abstractions for asset detection and module qualification
- Improve maintainability and future-proofing of the bundler core

---

## [1.0.5] - 2026-01-25

### Improved
- Improve internal CSS minification behavior via analyzer updates:
  - Normalize excessive whitespace in SAFE CSS minification mode.
  - Ensure deterministic and clean CSS output without altering grammar.
- Improve CSS token re-stringification reliability in DEEP mode by enforcing
  required spacing between adjacent values (e.g. `1px #fff`).

### Internal
- Update analyzer CSS minifier to fix token adjacency edge cases.
- Add regression coverage for CSS whitespace normalization and value boundaries.
- Align analyzer output consistency with ngapack’s deterministic bundling goals.

---

## [1.0.4] - 2026-01-20

### Fixed
- Ensure output directories are created before writing or copying non-JS assets
- Prevent ENOENT errors when emitting HTML or static assets into nested output paths

### Improved
- Make asset emission behavior consistent with JS bundle output handling
- Improve robustness of bundler when `outputDir` does not yet exist

### Internal
- Add defensive directory creation (`recursive: true`) for asset write paths
- Align asset pipeline expectations with Node.js filesystem semantics

---

## [1.0.3] - 2026-01-13

### Fixed
- Prevent bundler crash when no dynamic imports are present
- Fix incorrect bundle attachment logic where static modules could reference non-existent parent bundles
- Safely handle missing parent modules (e.g. external HTTP imports or non-bundled assets) during bundle assignment

### Refactored
- Rewrite `createBundle()` to use explicit `bundleId` propagation instead of implicit parent lookup
- Decouple module dependency relationships from bundle ownership
- Make bundling logic robust against incomplete or non-topological dependency graphs

### Internal
- Improve defensive handling of edge cases in dependency graph to avoid runtime `undefined` access
- Clarify conceptual separation between module graph construction and bundle generation

---

## [1.0.2] - 2026-01-12

### Added
- Document upstream references for analyzer and runtime in README
- Explicit attribution to `js-analyzer` and `djs` as conceptual foundations

### Improved
- Clarify separation of concerns between analyzer, bundler, and runtime
- Improve contributor-facing documentation and project positioning

### Docs
- Enhance README with upstream reference notes for better transparency

---

## [1.0.1] - 2026-01-08

### Fixed
- Correct asset output paths to avoid leaking `src/` into `public`
- Ensure HTML assets are minified before being emitted

### Refactored
- Extract CSS canonicalization logic into `sheetToCanonicalObject`
- Improve code readability and contributor-oriented comments
- Minor internal cleanup without changing runtime behavior

### Docs
- Update README with clearer architecture and design rules
