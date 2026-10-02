# hashttp Source

`src/hashttp.js` is the core serving engine for hashttp. It provides two
primary functions and several utilities.

The engine itself is covered by the suite in `test/`, run with `npm test`.

## Exports

### `createServerFromRoutes(routes, options)`

Creates an HTTP server that resolves each request in three steps:

1. **Static file** — serves matching files from `publicDir` (path-traversal
   safe).
2. **Route match** — falls back to the route matcher (single file, composed
   chunks, or template).
3. **Fallback** — serves the fallback file (default: `404.html`) when nothing
   matches.

Steps 1 and 2 are always both available. `precedence` only decides which one is
consulted first, so a route can take over a path that also exists as a static
file without turning static serving off for everything else.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `baseDir` | `string` | `process.cwd()` | Base directory for resolving file paths. |
| `publicDir` | `string` | `<baseDir>/public` | Directory for static files. |
| `port` | `number` | `7171` | Port to listen on. |
| `host` | `string` | `"localhost"` | Host to bind. |
| `fallback` | `string` | `"404.html"` | Fallback file when no route matches. |
| `precedence` | `"static" \| "routes"` | `"static"` | Which resolver runs first. The other one still runs when the first finds nothing. |
| `transforms` | `Object<string, Function>` | `{}` | Named transforms that routes may reference by name via `transform`. |

Any error thrown while resolving a route (model factory, transform, …) is
logged and answered with a `500` response instead of leaving the request open.

### `createStaticFromRoutes(routes, paths, options)`

Generates static HTML files from route definitions without starting a server.

**Arguments:**

- `routes` — the route map object (same format as `createServerFromRoutes`).
- `paths` — array of URL paths to generate.
- `options` — `baseDir` (default `process.cwd()`), `outputDir` (default `"dist"`),
  `transforms`, and `extension` (default `".html"`).

**How routes are resolved:**

- **String target** — file is read and written as-is.
- **Object with `target` and `model`** — template is rendered with model data.
- **Array (composed)** — all chunks are rendered and concatenated into one file.
- **Object with `stream` and `chunks`** — all chunks are rendered and concatenated
  (streaming is ignored during static generation).
- **Factory/callback** — invoked with a synthetic context (`{ params, query: {}, pathname }`).

Any `transform` on those entries is applied during static generation too, using
the same registry passed as `options.transforms`.

**Output path mapping:**

| URL path | Output file |
|---|---|
| `/` | `dist/index.html` |
| `/articles` | `dist/articles.html` |
| `/articles/hello-world` | `dist/articles/hello-world.html` |

### `resolveModel(model, ctx)`

Resolves a model definition into a plain data object. A model may be a literal
object or a factory that receives the request context.

### `renderTemplate(content, data)`

Substitutes `{{ key }}` placeholders in `content` with values from `data`.
Missing keys render as an empty string.

### `renderEntry(entry, ctx, baseDir, transforms)`

Renders a single route entry (string path or `{ target, model, transform }`
object) to an HTML string. File contents are memoized in an in-memory cache, so
files read once are not re-read from disk on subsequent calls. When the entry
declares a `transform`, the rendered content is passed through it before it is
returned.

### `resolveTransform(transform, transforms)`

Resolves an entry's `transform` into a function. A transform may be an inline
function or the name of one registered in the `transforms` option. Returns
`null` when the entry has no transform, and throws when a named transform is
not registered.

### `applyTransform(content, entry, ctx, transforms)`

Applies an entry's `transform` to already rendered content. The transform is
called as `(content, ctx, meta)` where `ctx` is the request context
(`{ params, query, pathname }`) and `meta` describes the source file
(`{ target, ext, contentType }`). It must return a `string` or a `Buffer` and
may be async. Content without a transform is returned untouched.

### Per-entry `type` and `headers`

An entry may override the auto-detected content type with `type` and add
response headers with `headers`. For composed and streaming routes the response
head is written before any chunk is rendered, so only the first chunk is read.

```javascript
"/hello/:name": {
  target: "public/greetings.html",
  transform: "greet-plain-text",
  type: "text/plain; charset=utf-8",
  headers: { "Cache-Control": "no-store" },
}
```

## Architecture

hashttp follows a three-layer architecture:

1. **Matcher** (`libs/roution`) — resolves URL paths to route values using
   static lookup, dynamic segments (`:name`), and optional wildcard (`*`).
2. **Engine** (`src/hashttp.js`) — orchestrates request handling: static file
   serving, route matching, template rendering, transforms, and fallback.
3. **Templates** — uses `{{ key }}` placeholders with data from the `model`
   property (plain object or factory function).
4. **Transforms** — optional final step that rewrites rendered content before it
   is sent. Off unless an entry declares `transform`.

## Design Principles

- **Zero dependencies** — only built-in Node.js APIs.
- **Minimal code** — small, readable, maintainable.
- **Modular** — the matcher is isolated and unit-tested independently.
- **Flat config** — routes are a simple, serializable object.
- **Auto content-type** — MIME type is detected from the file extension.
- **Static first** — existing files win; routing is the fallback. Opt into
  `precedence: "routes"` when a route must take over a path that is also a
  static file.