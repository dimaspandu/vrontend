# Changelog

All notable changes to this project will be documented in this file.

## [1.9.1] - 2026-09-30
### Changed
- `package.json` version is now `1.9.1`, so the published package version and
  the release tags agree. It had been left at `0.1.0` since the initial commit,
  while the tags advanced to `v1.9.0`. No code changes in this release.

## [1.9.0] - 2026-09-30
### Added
- `test/` suite for the hashttp engine, run with `npm test`:
  - `test/hashttp.test.js` — unit tests for `renderTemplate`, `resolveModel`,
    `resolveTransform`, `applyTransform`, and `renderEntry`.
  - `test/server.test.js` — integration tests that boot the engine on an
    ephemeral port and assert over real requests: static/route precedence, the
    404 fallback, transforms, `type`/`headers`, composed and streaming routes,
    and 500 responses.
  - `test/static.test.js` — `createStaticFromRoutes` writing to a temporary
    directory, including async factories, transforms, and `extension`.
  - `test/fixtures/` — templates and static files used by the tests.
- Optional `transform` layer on route entries: a function that receives
  `(content, ctx, meta)` and returns the content actually sent, letting a route
  rewrite the file it serves without touching the file on disk. Applies to
  `{ target, … }` entries and to composed chunks.
- New `transforms` option on `createServerFromRoutes` and
  `createStaticFromRoutes`: a registry of named transforms that route entries
  reference by name, keeping the route map flat. Transforms may be async and may
  read `ctx.params` / `ctx.query`.
- New `precedence` option (`"static" | "routes"`, default `"static"`) on
  `createServerFromRoutes`. It only decides which resolver runs first — static
  serving still runs second — so a route can take over a path that is also a real
  file in `publicDir`.
- Per-entry `type` and `headers` overrides for the response head.
- `demo/server.js` demos: `/data.json` (reformatted JSON, and a `precedence`
  example), `/style.min.css` (minified stylesheet), and `/hello/:name` (HTML
  chunk served as plain text by an async transform that reads route params).
- `demo/public/index.html` links the three transform routes and `/style.css`.

### Changed
- `.gitignore` now ignores local AI agent and editor directories (`.kilo/`,
  `.opencode/`, `.claude/`, `.cursor/`, and friends).
- `npm test` now runs the hashttp suite (`node --test test/*.test.js`). It
  previously pointed at `test/matcher.test.js`, which was deleted in `2903ef5`
  when the matcher moved to `libs/roution`, so the script had been failing.
- `createServerFromRoutes` now answers with a `500` response when resolving a
  route throws, instead of leaving the request open.
- `createStaticFromRoutes` awaits async route-value factories, and accepts
  `transforms` plus a new `extension` option (default `".html"`).
- Root `README.md`, `src/README.md`, and `demo/README.md` document transforms,
  `precedence`, `type`/`headers`, the new options, and the test suite.

## [1.8.0] - 2026-08-24
### Added
- Async route-value callback support: `createServerFromRoutes` now awaits
  async route-value factories, enabling `fetch` and other async operations
  before resolving `target` and `model`.
- `/async-fetch/:id` demo route fetching from JSONPlaceholder and rendering
  `demo/public/todo.html`.
- `demo/public/todo.html` template for the async fetch demo.
- `demo/public/index.html` links to `/async-fetch/1`, `/async-fetch/5`, and
  `/async-fetch/10`.

### Changed
- Root `README.md` documents async route-value callbacks with example and
  output-path mapping.
- `demo/README.md` documents the async fetch route and adds the template to
  the project structure.

## [1.7.0] - 2026-08-18
### Added
- Async `model` and route-value factory support: `resolveModel` and `renderEntry`
  now await `async` factories, enabling dynamic data fetching before template
  rendering.
- `/streaming-async` demo route showcasing sequential streaming with async
  `model` factories that simulate data fetching delays.
- `demo/public/index.html` link to `/streaming-async`.

### Changed
- `demo/README.md` and root `README.md` updated to document async model
  factories and the new streaming-async route.
- `createStaticFromRoutes` awaits async model factories during static generation.

## [1.6.0] - 2026-08-01
### Added
- File content memoization in `renderEntry`: file contents are cached in an
  in-memory `Map` to avoid repeated disk reads across requests and routes.
- `demo/public/section-item.html` template reused across multiple composed
  chunks with different model data.

### Changed
- `createStaticFromRoutes` now routes string targets through `renderEntry`
  so generated files benefit from the same file cache.
- `demo/build.js` routes synced with `demo/server.js` (news array, section items).
- `demo/README.md` and `src/README.md` updated to document caching behavior.

## [1.5.0] - 2026-07-30
### Removed
- `dist/server.js` — replaced by using a live server extension to preview
  generated static files.

### Changed
- `.gitignore` updated to ignore entire `dist/` and `demo/dist/` folders.

## [1.4.0] - 2026-07-30
### Added
- `createStaticFromRoutes(routes, paths, options)` for generating static HTML files from route definitions.
- `demo/build.js` script demonstrating static generation.
- `.gitignore` for `node_modules/` and `dist/`.

## [1.3.0] - 2026-07-30
### Added
- `fallback` option for `createServerFromRoutes` to customize the 404 fallback file (default: `404.html`).
- `demo/README.md` with demo explanation, use case documentation, options table, and directory layout guidance.
- `demo/public/custom-404.html` for custom fallback demonstration.

## [1.2.0] - 2026-07-17
### Changed
- Callbacks (route value factory and `model` factory) now receive a single
  request context object `{ params, query, pathname }` instead of positional
  arguments. The context is destructurable, e.g. `({ params, query }) => ...`.
  This unifies both callbacks under one convention and is a breaking change
  for code using the previous `(params, query)` / `(params)` signatures.

## [1.1.1] - 2026-07-17
### Added
- Route value may be a factory/callback: when it is a function, it is invoked with the matched `params` and parsed `query` and must return the real route value (string, object, or composed shape).
- `demo/server.js` adds a `/factory/:name` example using a callback with params and query, plus `demo/public/factory.html` and a home-page link.

### Fixed
- Parsed query is now passed to route callbacks (the matcher received a query-stripped pathname, so `query` is parsed from the request URL instead).

## [1.1.0] - 2026-07-16
### Added
- Streaming composition mode: route value `{ stream: true, chunks: [...] }` writes each chunk sequentially with `Transfer-Encoding: chunked` instead of joining into one response first.
- Per-chunk `delay` (milliseconds) for composed routes, applied before the chunk is written, for demonstrating sequential streaming.

### Changed
- `demo/server.js` adds a `/composed-stream` example showcasing streaming with per-chunk delay.
- `demo/public/index.html` links to the `/composed-stream` example.

## [1.0.9] - 2026-07-16
### Changed
- Extracted the hashttp serving engine into `src/hashttp.js` (`createServerFromRoutes`) and moved the route matcher to `libs/roution`.
- Simplified `demo/server.js` to route definitions plus a single `createServerFromRoutes(routes)` call.
- Renamed the template data property from `struct` to `model` (object or `(params) => object` factory) across the engine, demo, and docs.
- Updated README structure and usage to reflect the engine/library split.

## [1.0.8] - 2026-07-15
### Changed
- Restructured the demo to run on the `roution` matcher (`helpers/roution`) instead of the removed `src/` library.
- Reworked `demo/server.js` resolution order: serve static files first, then match routes, then fall back to `404.html`.
- Replaced the `data` template property with `struct` (object or `(params) => object` factory) for template data injection.
- Tidied `demo/public`: removed unrouted files (`docs/`, `storage/`, `render-template.html`) and static article files that shadowed the dynamic `/articles/:slug` route.
- Updated `README.md` to describe the current structure, `struct` templating, and the static-first resolution flow.

### Added
- Page composition entries can carry their own per-chunk `struct`.

## [1.0.7] - 2026-07-05
### Added
- Page composition feature with array target support
- `compose()` utility function for combining multiple templates/files

## [1.0.6] - 2026-07-05
### Added
- Built-in template engine with `{{placeholder}}` syntax
- Dot notation support for nested values (e.g., `{{user.name}}`)
- Route `data` and `model` properties for template data injection
- `render(content, data)` method on router instance
- `hasPlaceholders(content)` utility function

## [1.0.5] - 2026-06-06
### Changed
- Simplified demo server to serve `demo/public` first, then fall back to dynamic routes and `*`.
- Updated README to describe the new demo behavior.
- Kept dynamic `/articles/:slug` and `/storage/:file` routes as router-only fallbacks.

## [1.0.5] - 2026-06-06
### Fixed
- Demo: serve extensionless paths by trying `<path>.html` before other checks (e.g., `/articles` → `public/articles.html`).


## [1.0.3] - 2026-06-06
### Changed
- Added explanatory comment for the unmatched-route guard in `demo/server.js`.

## [1.0.0] - 2026-06-06
### Added
- Initial release of Hashttp routing engine.
- Flat route object mapping with explicit targets.
- Dynamic route matching using `:param` placeholders.
- Automatic content-type detection by file extension.
- Route pointer object support with explicit `target` and `headers`.
- Smart matcher selection: hash + regex for small sets, trie support for larger route collections.
- ESM-compatible codebase with zero external dependencies.
- Demo server in `demo/server.js` showcasing static, dynamic, JSON, and folder-like routes.
- Unit test suite in `test/matcher.test.js` covering matcher and integration behavior.
