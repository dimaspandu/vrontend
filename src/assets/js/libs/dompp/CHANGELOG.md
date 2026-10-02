# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning principles.

---

## [1.5.0] - 2026-09-30

### Added

- JSX factory (`d(tag, props, ...children)`) now supports:
  - **Fragment**: `<fragment>` / `<Fragment>` creates `document.createDocumentFragment()`
  - **SVG elements**: `<svg>`, `<circle>`, `<path>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>`, `<ellipse>`, `<g>`, `<defs>`, `<use>`, `<symbol>`, `<text>`, `<tspan>`, `<textPath>`, `<image>`, `<foreignObject>`, `<mask>`, `<clipPath>`, `<pattern>`, `<linearGradient>`, `<radialGradient>`, `<stop>`, `<filter>`, `<feGaussianBlur>`, `<feColorMatrix>`, `<animate>`, `<animateTransform>`, `<animateMotion>`, `<marker>`, `<view>`, `<switch>`, `<a>`, `<script>`, `<style>`, `<title>`, `<desc>`, `<metadata>` create elements via `document.createElementNS("http://www.w3.org/2000/svg", tag)`
  - Updated `examples/21-jsx-integration/index.html` with enhanced factory

## Unreleased

## [1.4.0] - 2026-05-25

### Added

- New JSX Integration example (example #21):
  - `examples/21-jsx-integration/`
  - Tiny custom JSX factory `d(tag, props, ...children)` using Babel Standalone (CDN) + `/** @jsx d */` pragma
  - Demonstrates full patterns with JSX:
    - Basic usage
    - Stateful panels with `setState` + reactive `setChildren`
    - Cross-element updates
    - **Fine-grained signals** (`document.createSignal` + `.setFineGrained()` on JSX-created nodes)
  - Production note: configure your bundler (Vite/esbuild/etc) to use the custom factory instead of `React.createElement`

### Fixed

- Signal updater in JSX example: signals do not accept functional updaters (`setCount(c => c + 1)`). Must compute new value explicitly using `count()` (e.g. `setCount(count() + 1)`), matching the rest of the signal examples.

## v1.3.1

### Fixed

- Fixed typo and wording inconsistencies across examples
- Fixed incorrect examples count on landing page
  - updated from 19 examples to 20 examples
- Improved examples landing page consistency

## v1.3.0

### Added

- New runtime semantics examples:
  - `16-state-equality-behavior/`
  - `17-nested-stateful-elements/`
  - `18-keyed-list-behavior/`
  - `19-dom-identity-preservation/`
  - `20-reactive-feed/`

- New runtime-focused educational examples for:
  - nested state ownership
  - DOM identity preservation
  - prepend vs append list mutation
  - reusable node identity
  - stateful feed mutations
  - keyed runtime behavior
  - state equality semantics

- New reactive feed demo with:
  - prepend post
  - append post
  - editable posts
  - removable posts
  - stateful reusable nodes

### Improved

- Expanded examples landing page structure
- Added direct navigation to all example pages
- Improved runtime-oriented documentation flow
- Improved educational progression across examples
- Improved syntax-highlighted runtime code previews
- Improved onboarding for runtime semantics concepts

### Documentation

- Repositioned DOMPP examples as runtime learning blocks
- Expanded runtime semantics explanations
- Improved browser-native runtime positioning
- Improved architecture exploration entry points

### Fixed

- Fixed reactive feed delete behavior
- Fixed missing DOM node reference during feed removal

## v1.2.2

### Improved
- Added SEO-friendly meta tags and Open Graph support to index.html for better social media sharing and search engine optimization

## v1.2.1

### Improved
- Modernized remaining examples with:
  - interactive documentation layouts
  - syntax-highlighted code previews
  - live preview panels
  - runtime explanation sections
- Improved educational structure for examples
- Improved onboarding experience for new developers

### Documentation
- Added architecture documentation landing page
- Added browser-accessible architecture gallery
- Improved GitHub Pages compatibility
- Improved static documentation navigation

## v1.2.0

### Added
- Root landing page for DOMPP
- Architecture documentation website
- Visual runtime architecture diagrams
- Interactive documentation-style examples
- GitHub Pages compatible static structure
- Dedicated architecture navigation
- Progressive example showcase layout

### Improved
- Modernized all examples with:
  - explanations
  - highlighted code snippets
  - live preview panels
  - important runtime notes
- Refined documentation structure
- Improved project discoverability
- Improved OSS presentation and onboarding

### Documentation
- Added architecture overview pages
- Added runtime flow diagrams
- Added DOMPP positioning and vision docs
- Updated README and CONTRIBUTING guides

### Infrastructure
- Moved local server to repository root
- Simplified static serving structure
- Improved static deployment compatibility

## [1.1.3] - 2026-05-13

### Added

- Root landing page (`index.html`)
- Repository homepage for:
  - examples
  - architecture docs
  - runtime overview

- Static-hosting-friendly repository structure

### Changed

- Moved `server.js` to repository root
- Simplified local development server structure
- Updated README.md local development instructions
- Updated CONTRIBUTING.md local development instructions

### Notes

- Repository can now function as a live documentation and examples site
- Structure is now compatible with static hosting platforms

## [1.1.2] - 2026-05-13

### Added

- Architecture documentation:
  - runtime architecture
  - stateful runtime flow
  - fine-grained signals flow
  - enhancement assimilation flow
  - children vs childNodes visualization
  - runtime positioning
  - DOMPP vision diagrams

- `docs/architecture/README.md`

- README runtime architecture sections with embedded diagrams

### Changed

- Improved contributor onboarding documentation
- Improved runtime and reactive flow explanations
- Expanded architectural documentation coverage

## [1.1.1] - 2026-05-13

### Added

- Native ESM modular architecture:
  - `context/`
  - `core/`
  - `install/`
  - `runtime/`
  - `setters/`
  - `utils/`

- Fine-grained signal runtime:
  - `document.createSignal(...)`
  - `createSignalEffect(...)`
  - `setFineGrained()`

- Existing DOM enhancement APIs:
  - `setEnhancement(...)`
  - hydration-like DOM assimilation patterns

- Native Node.js test infrastructure:
  - `node:test`
  - zero external test framework dependencies

- New examples:
  - `13-existing-dom-enhancement/`
  - `14-fine-grained-signals/`
  - `15-existing-dom-enhancement-signals/`

- New runtime examples for:
  - stateful mutation consistency
  - children vs childNodes
  - reusable stateful elements
  - cross-element state mutation

### Changed

- Refactored DOMPP into ESM-first architecture without breaking public APIs.
- `src/index.js` now re-exports the latest stable runtime.
- Internal setters are now isolated into independently testable modules.
- Runtime responsibilities separated into:
  - signals
  - state scheduling
  - wrappers
  - prototype installers

- README.md completely rewritten to reflect:
  - native DOM-first philosophy
  - fine-grained signals
  - enhancement-based hydration
  - ESM architecture
  - testing strategy

- CONTRIBUTING.md rewritten with:
  - architectural contribution guidelines
  - runtime philosophy
  - prototype safety rules
  - fine-grained runtime boundaries

### Notes

- Fine-grained signals remain fully optional.
- Existing `setState(...)` runtime behavior remains supported.
- DOMPP continues avoiding:
  - virtual DOM
  - template compilers
  - hidden reconciliation
  - framework-style abstractions

- Examples now function as browser integration demonstrations in addition to documentation.

## [1.1.0] - 2026-05-12

### Added

- Optional fine-grained signal runtime:
  - `document.createSignal(...)`
  - `createSignalEffect(...)`
  - `setFineGrained()`

- Signal-aware reactive setters:
  - `setText(...)`
  - `setStyles(...)`
  - `setChildren(...)`
  - `setAttributes(...)`
  - `setEvents(...)`

- Fine-grained signal example:
  - `14-fine-grained-signals/`

### Changed

- Reactive wrappers now support:
  - stateful runtime
  - fine-grained signal runtime

- Signals integrated incrementally into existing DOMPP architecture instead of replacing the stateful runtime.

### Notes

- Signals are completely optional.
- Existing `setState(...)` APIs remain fully supported.
- DOMPP still uses direct native DOM mutation without virtual DOM diffing.

## [1.0.1] - 2026-05-11

### Added

- Existing DOM enhancement support:
  - `setEnhancement(...)`

- Existing DOM enhancement example:
  - `13-existing-dom-enhancement/`

- New architecture-focused examples:
  - mutation consistency
  - children vs childNodes
  - reusable stateful elements
  - cross-element state

### Changed

- `setState(...)` rewritten into pure mutation runtime:
  - removed equality guards
  - removed automatic mutation skipping
  - direct mutation philosophy restored

- Setter callbacks now expose richer DOM contexts:
  - `children`
  - `childNodes`
  - `firstChild`
  - `lastChild`

- Examples redesigned into progressive educational structure:
  - basic setters
  - reactive state
  - enhancement
  - signals

### Notes

- Existing DOM nodes can now be enhanced without subtree recreation.
- DOMPP hydration direction shifted toward assimilation instead of virtual DOM hydration.

## [1.0.0] - 2026-05-10

Initial stable DOM++ browser runtime.

### Added

- Core chainable DOM setters:
  - `setText(...)`
  - `setChildren(...)`
  - `setStyles(...)`
  - `setAttributes(...)`
  - `setEvents(...)`

- Stateful local runtime:
  - `setState(...)`
  - reactive setter callbacks
  - microtask scheduling

- Fragment support:
  - `DocumentFragment.setText(...)`
  - `DocumentFragment.setChildren(...)`

- Vanilla browser examples:
  - basic text
  - styles
  - attributes
  - children
  - events
  - reactive counter
  - reactive children

### Design Principles

- Native DOM first
- No virtual DOM
- Direct deterministic mutation
- Chainable mutation ergonomics
- Minimal runtime overhead
- Explicit over magical behavior

## [0.1.16] - 2026-03-31

### Changed
- Moved index.html to root directory for direct deployment:
  - Updated all example links to use ./examples/ prefix
- Removed duplicate src/ folder from examples/ directory
- Cleaned up repository structure:
  - Removed articles/ directory
  - Removed docs/ directory

### Added
- CONTRIBUTING.md with contribution guidelines
- README.md files for example projects:
  - examples/dompp-state-reconcile-demo/README.md
  - examples/dompp-step-by-step-case-study/README.md
  - examples/dompp-step-by-step-case-study-jsx/README.md

## [0.1.15] - 2026-03-26\n\n### Added\n- Step-by-step DOM++ Medium-style article:\n  - rticles/dompp-step-by-step-case-study.md\n- Step-by-step DOM++ live demo:\n  - examples/dompp-step-by-step-case-study/\n\n### Changed\n- Updated DOM++ state/reconcile article to align examples with matchById usage and prepend/append behavior:\n  - rticles/dompp-state-reconcile-case-study.md\n\n## [0.1.14] - 2026-03-11

### Added
- Core setter callback example:
  - `examples/setter-callback-core/`
- Stateful setter callback example:
  - `examples/setter-callback-stateful/`
- Preprint final section writing template:
  - `docs/preprints/FINAL_SECTION_TEMPLATE.md`

### Changed
- Core DOM setters now support callback-style updates with previous values:
  - `setText`, `setStyles`, `setAttributes`, `setEvents`
  - `setChildren` now uses setter context instead of the plain DOM context
  - `createDomppSetterContext(...)` added to surface prior values and DOM context
- Stateful addon now merges setter context into reactive callbacks:
  - `src/reactive/stateful.js`
- DOM module documentation now clarifies `children` vs `childNodes` in setter callbacks:
  - `src/dom/README.md`
- Root ideation demo updated to showcase core setter callbacks:
  - `ideation.js`

## [0.1.13] - 2026-03-07

### Added
- New hydration addon:
  - `src/addons/hydration.addon.js`
  - `installDomppHydration(...)`
  - `hydrateChildren(recipe)` for hydration/assimilation flows.
- New hydration-focused examples:
  - `examples/hydration-assimilation-counter/`
  - `examples/hydration-assimilation-list/`
  - `examples/hydration-stateful-counter/`

### Changed
- `setChildren(...)` now supports callback-based hydration context in core DOM module:
  - callback context exposes `el`, `children`, `childNodes`, `firstChild`, `lastChild`.
- Stateful context now includes the same DOM hydration context for consistent callback ergonomics:
  - `src/reactive/stateful.js`.
- Addons documentation expanded with hydration addon usage:
  - `src/addons/README.md`.
- Root ideation script refocused into a hydration/assimilation runnable flow:
  - `ideation.js`.

### Notes
- Hydration can be authored either with `setChildren(...)` callback style or explicit `hydrateChildren(...)`.
- Reconcile/stateful composition is demonstrated in dedicated examples.

---

## [0.1.12] - 2026-02-28

### Removed
- Removed the experimental benchmark suite and all benchmark artifacts from the repository:
  - CDN-only harness apps, scripts, templates, and recorded results.

### Changed
- Documentation no longer links to the removed benchmark suite.

### Notes
- The paper direction is now demonstration- and complexity-analysis-driven; the JavaScript prototype remains an executable specification rather than a performance claim.

---

## [0.1.11] - 2026-02-28

### Changed
- Revised and refocused preprint outline:
  - simplified structure and evaluation framing
  - expanded Related Work with clearer citations to local reference PDFs
  - `docs/preprints/OUTLINE.md`

### Notes
- This release updates paper-facing documentation.

---

## [0.1.10] - 2026-02-23

### Added
- Experimental benchmarking scripts and recorded results (later removed).

### Changed
- Updated preprint outline with early runtime-results discussion (later replaced by demonstration + complexity framing).

### Notes
- This release primarily added experimental measurement tooling and paper artifacts.

---

## [0.1.9] - 2026-02-21

### Added
- Experimental benchmark harness apps and protocol artifacts (later removed).

### Changed
- Experimental paper/evaluation artifacts expanded (later revised).
- Proposal document strengthened with:
  - additional scientific references for comprehension/cognitive-load arguments
  - non-normative optimization expectations for setter semantics (`setChildren`, `setStyles`, `setAttributes`, `setEvents`)
  - performance-oriented expectation that implementations minimize unnecessary DOM mutations.

### Notes
- This release expands benchmark reproducibility artifacts and clarifies the proposal direction toward semantics-preserving, engine-level DOM mutation optimization.

---

## [0.1.8] - 2026-02-21

### Added
- New ordered-list reconcile demo with id-based matching:
  - `examples/reconcile-match-by-id-ordered-list/`
  - Stateful callback rendering with `setChildren(..., { matchById: true })`
  - Prepend-focused refresh flow and conditional `"(UPDATED!)"` marker behavior.

### Changed
- Reconcile stateful counter refactored to stable node references (no per-element `id` requirement):
  - `examples/reconcile-stateful-counter/counter.js`
- Reconcile stateful counter docs expanded with coding-style comparison and reconcile mechanics:
  - `examples/reconcile-stateful-counter/README.md`
- Reconcile match-by-id counter aligned to stateful callback style:
  - `examples/reconcile-match-by-id/counter.js`
  - `examples/reconcile-match-by-id/README.md`
- Root ideation script rewritten with runnable ordered-list flow and explanatory comments:
  - `ideation.js`
- Root README example index/structure/snippets updated for new ordered-list example:
  - `README.md`

### Removed
- Deprecated list-pattern demo:
  - `examples/reconcile-list-patterns/`

### Notes
- This release focuses on clarify-and-demonstrate reconcile behavior under two rendering styles:
  1. Fresh templates with `matchById`
  2. Stable node references without `matchById`

---

## [0.1.7] - 2026-02-20

### Changed
- Documentation language normalized to English (no emoji/emoticon style) across updated root/docs markdown files.
- Root README updated with:
  - explicit project identity note: `DOMPP = DOM++`
  - MDN-style native Web API proposal snippet aligned with the paper direction.
- Proposal document refined with repository-aligned implementation status and standardization pathway notes:
  - `docs/ECMASCRIPT_DOM_EXTENSION_PROPOSAL.md`
- Repository documentation clarified to reflect current implementation status.

### Notes
- This release is documentation-focused and introduces no runtime API changes.

---

## [0.1.6] - 2026-02-20

### Added
- New stateful + reconcile example:
  - `examples/reconcile-stateful-counter/`

### Changed
- Stateful callback context now exposes `setState` directly (while keeping `el`):
  - `src/reactive/stateful.js`
- Root ideation demo updated to local-state usage with callback context:
  - `ideation.js`
- Root README rewritten for current project scope and examples:
  - updated structure and addon overview
  - added concise code snippets for all examples under `examples/`.

### Notes
- This release improves API ergonomics for local state updates in callback render patterns.

---

## [0.1.5] - 2026-02-20

### Added
- New reconcile addon:
  - `src/addons/reconcile.addon.js`
  - opt-in patch APIs (`patchText`, `patchChildren`, `patchStyles`, `patchAttributes`, `patchEvents`)
  - optional setter override mode via `installDomppReconcile({ overrideSetters: true })`.
- `setChildren(..., { matchById: true })` support in reconcile mode for id-based child reuse.
- New examples:
  - `examples/reconcile-counter/`
  - `examples/reconcile-list-patterns/`
  - `examples/reconcile-match-by-id/`
- Root-level ideation demo script:
  - `ideation.js`

### Changed
- Root README now includes reconcile examples in the documentation index and examples list.
- Addons README now documents reconcile addon usage and `matchById` behavior.

### Notes
- Core DOMPP implementation in `src/dom/dompp.js` remains unchanged.
- Reconcile behavior is isolated in addons as an opt-in simulation/proposal layer.

---

## [0.1.4] - 2026-02-19

### Added
- Experimental evaluation artifacts scaffold (later removed).

### Changed
- Root README documentation index expanded for research artifacts (later revised).

### Notes
- This release focuses on research methodology and measurement tooling.
- No runtime API changes.

---

## [0.1.3] - 2026-02-19

### Added
- Documentation index in root README linking to module/example docs.
- New proposal document:
  - `docs/ECMASCRIPT_DOM_EXTENSION_PROPOSAL.md`
  - scientific-style structure with references to DOM standards and related research.

### Changed
- Root README expanded with:
  - "Proposed Advantages" section
  - consistent setter model explanation for initial and update phases
  - declarative tree authoring example.
- `src/addons/README.md` rewritten into full module documentation:
  - philosophy
  - API (`$`, `v`)
  - usage guidance
  - non-goals.
- `src/dom/README.md` clarified `DocumentFragment` support and limitations.

### Notes
- This release is documentation-focused and introduces no runtime API breakage.

---

## [0.1.2] - 2026-02-17

### Added
- DocumentFragment support for core mutation helpers:
  - setText
  - setChildren

### Changed
- Refactored DOM installer to support prototype-targeted definitions.
- Shared method implementations between Element and DocumentFragment to prevent behavioral drift.

### Design Notes
- Fragment intentionally supports only mutation primitives.
- Styling, attributes, and events remain Element-only to preserve platform semantics.

---

## [0.1.1] - 2026-02-17

First stabilization patch after the foundation release.

Focused on improving the stateful DOM addon, update scheduling behavior, and internal safety without introducing breaking API changes.

### Added

- Setter-level memoization to prevent unnecessary DOM mutations when computed values have not changed.
- Microtask-based batched flushing for stateful bindings, aligning DOM updates with modern reactive scheduling patterns.

### Improved

- Safer setter wrapping to avoid prototype reassignment errors.
- More predictable binding execution through snapshot-safe flushing.
- Internal guards to prevent double wrapping of DOM setters.
- Documentation clarity for the DOM module and stateful architecture.

### Fixed

- Resolved read-only prototype mutation error when enhancing setters.
- Eliminated redundant DOM writes caused by unchanged state values.

### Stability Notes

This release strengthens the internal mutation pipeline and prepares the engine for more advanced reactive features while keeping the runtime extremely small and deterministic.

No breaking changes were introduced.

---

## [0.1.0] - 2026-02-16

Initial public foundation of DOMPP.

### Added

- Core DOM prototype extensions
  - setText
  - setChildren
  - setStyles
  - setAttributes
  - setEvents

- Stateful DOM addon
  - setState
  - callback-based setters
  - element-local bindings
  - microtask-ready architecture

- Reactive primitives
  - scheduler
  - signal

- VQuery addon for optional ergonomic querying

- Example projects:
  - minimal counter
  - vquery counter
  - stateful counter

- Contributor-oriented documentation
  - root README
  - DOM module README
  - reactive module README

### Design Principles

- Zero virtual DOM
- No proxies
- Retained DOM architecture
- Fine-grained mutation model
- Extremely small runtime
- Explicit over magical behavior

