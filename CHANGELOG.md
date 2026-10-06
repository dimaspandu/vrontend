# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-10-06

### Added

- **Uppercase JSX component support.** `<Counter initial={0} />` now transpiles to
  `elementBuilder(Counter, { initial: 0 })`. The JSX factory detects function
  `tag` values and invokes them directly, so components can return JSX instead
  of calling `elementBuilder` manually.
- **`/counter` route** with a working counter example demonstrating the new
  uppercase component pattern and per-route CSS module loading.
- **`src/assets/css/counter.module.css`** scoped styles for the counter route,
  loaded dynamically only when `/counter` is visited.

### Changed

- `src/assets/js/factories/elementBuilder.js` now supports function components:
  when `tag` is a function, it calls `tag(props, ...children)` instead of
  `document.createElement(tag)`.
- Counter view rewritten from manual `elementBuilder(...)` calls to pure JSX.

### Documentation

- README updated with uppercase component examples and a guide for dynamic
  per-route CSS modules.

## [1.1.1] - 2026-10-06

### Changed

- Vendored libraries are now tracked as git submodules instead of plain files:
  `hashttp` (`v2.0.0`), `ngapack` (`v2.0.0`), `dompp` (`v1.5.0`), and
  `historypp` (`v2.0.6`). All import paths remain identical.

## [Unreleased]

## [1.1.0] - 2026-10-03

### Added

- **Docker support.** A two-stage `Dockerfile`: the build stage runs
  `run.bundle.js`, the runtime stage serves the output with `run.start.js` on
  `node:22-alpine`. Only hashttp and the built output reach the final image.
  `PORT` and `HOST` are read from the process environment, so no `.env` is
  baked in, and `MINIFY` can be passed as a build argument. A `.dockerignore`
  keeps the build context small and excludes local state.

## [1.0.0] - 2026-10-02

First stable release. The project is published as a complete, self-contained
boilerplate: four vendored libraries, no `node_modules`, no install step.

### Added

- **Zero-dependency toolchain.** [ngapack](https://github.com/dimaspandu/ngapack)
  (bundler + JSX transpiler), [hashttp](https://github.com/dimaspandu/hashttp)
  (HTTP server), [historypp](https://historypp.digital/) (SPA router), and
  [dompp](https://dompp.digital/) (DOM + reactivity), all vendored in-repo.
- **Three entry points.** `run.dev.js` (unbundled dev server over `src/`),
  `run.bundle.js` (production build into the output folder), and
  `run.start.js` (preview server for the build output).
- **`.env` configuration** via `env.js`, using Node's built-in
  `process.loadEnvFile`. Keys: `PORT`, `HOST`, `MINIFY`, `JSX_FACTORY`, and
  `OUTPUT_DIR`. Every key is optional and falls back to a default; malformed
  values fail fast with a message naming the key. `.env.example` documents them
  and `.env` is gitignored.
- **SPA-aware server routing.** `app.routes.js` holds the client route patterns,
  shared by the dev and preview servers, so deep links such as `/task/12` return
  the app shell instead of a server 404.
- **Auto-discovery of `.jsx` routes** in the dev server, so adding a view needs
  no server-side change.
- **Internal link interception** in `src/index.js`, letting views use ordinary
  `<a href>` markup instead of per-link click handlers.
- **Example application:** a task board with a list view (`/`), a detail view
  with a dynamic parameter (`/task/:id`), and a client-side 404 view. The
  layout lives in the HTML shell and survives navigation.
- **JSX factory** at `src/assets/js/factories/elementBuilder.js`, routing JSX
  props to dompp setters, with support for both `<>...</>` and `<fragment>`.
- **README.md** documenting setup, project layout, conventions, configuration,
  and the dev-server specifics.
- **MIT LICENSE** (© 2026 dimaspandu).

### Changed

- JSX factory tag handling: `a`, `script`, `style`, `title`, `desc`, and
  `metadata` are no longer forced into the SVG namespace, so `<a>` renders as
  a real HTML anchor instead of an invisible SVG element. Only SVG-exclusive
  tags use `createElementNS`.
- `run.start.js` now serves the built shell from the output folder. It
  previously served the unminified source HTML in preview mode.
- The dev server's `compile-jsx` transform re-reads each file from disk on
  every request, working around hashttp's process-lifetime file cache that
  otherwise hid `.jsx` edits until a server restart.
- Root `package.json` with `"type": "module"` and `dev` / `build` / `start`
  scripts, making ESM parsing explicit instead of relying on Node's syntax
  detection heuristic.

### Fixed

- Deep links now boot the app. `src/index.html` referenced the entry bundle
  relatively (`./index.js`), which the browser resolved to `/task/index.js` from
  a URL such as `/task/8`. That path matched the `/task/:id` route, so the
  server answered the JavaScript request with the HTML shell under
  `Content-Type: text/html` — producing an empty page and a `SyntaxError` in the
  console rather than an obvious 404. The reference is now absolute
  (`/index.js`).
- Toggling or removing a task no longer reloads the page. `renderItems` and
  `renderTask` live in module scope while `refresh` was declared inside
  `view()`, so the reference never resolved there; since `window.refresh()` is
  still a legacy alias for `location.reload()` in some browsers, the buttons
  silently triggered a full page reload. `refresh` is now passed in as a
  parameter.

### Removed

- The previous counter example (`domain/home`, `domain/about`, the duplicate
  `domain/404/handler.jsx` with its inlined copy of the stylesheet) and the
  unreferenced `components/Card.jsx`.

[1.2.0]: https://github.com/dimaspandu/vrontend/releases/tag/v1.2.0
[1.1.1]: https://github.com/dimaspandu/vrontend/releases/tag/v1.1.1