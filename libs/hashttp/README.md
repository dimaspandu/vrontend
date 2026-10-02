# Hashttp

Hashttp is a minimal, dependency-free routing engine that maps request paths to
files and templates. It is well suited for SEO-friendly static sites, vanilla
websites with dynamic routes, and small SPAs. The matching core is
[`roution`](libs/roution/README.md), a tiny route-resolution engine with zero
runtime dependencies.

This repository contains three parts:

- `src/hashttp.js` — the hashttp serving engine (HTTP server, static serving,
  templating, and the 404 fallback).
- `libs/roution` — the reusable route-resolution library (`createMatcher`).
- `demo/` — a minimal example with `server.js` (dev server) and `build.js` (static generation).

## How a request is resolved

The demo server (`demo/server.js`) resolves each request in three steps:

1. **Static file** — If a matching file exists under `demo/public` and stays
   within that directory (path-traversal safe), it is streamed directly with a
   `Content-Type` derived from its extension (`.html`, `.css`, `.json`, ...).
2. **Route match** — Otherwise the request path is matched against the route
   table. A match is served in one of three shapes:
   - a single file (string target),
   - a composed page (array of chunks), or
   - a template (object with `target` and `model`).
3. **Fallback** — If nothing matches, `demo/public/404.html` is served with a
   `404` status.

Steps 1 and 2 are both always available. The `precedence` option decides which
one is consulted first, so a route can take over a path that is also a real
file in `demo/public` without disabling static serving for everything else. The
demo server uses `precedence: "routes"`.

## Route definitions

Routes are a flat object of patterns to values. The matcher values used by the
demo server come in three shapes:

### String (single file)

```javascript
"/": "public/index.html"
```

### Array (page composition, concat)

A plain array of entries is rendered in order and concatenated into one full
response. Each entry is either a file path (string) or an object with its own
`model`.

```javascript
"/composed": [
  { "target": "public/header.html", "model": { "title": "Hello, World!" } },
  "public/greetings.html",
  { "target": "public/footer.html", "model": { "year": new Date().getFullYear() } }
]
```

### Object with `stream` (page composition, streaming)

An object with `stream: true` and a `chunks` array renders and writes each
chunk sequentially using `Transfer-Encoding: chunked` (like PHP `flush`),
instead of waiting for the whole page to be built. A chunk may carry its own
`delay` (milliseconds) applied before it is written, which is useful for
demonstrating sequential streaming. The first chunk has no delay so the
response starts immediately.

```javascript
"/composed-stream": {
  "stream": true,
  "chunks": [
    { "target": "public/header.html", "model": { "title": "Streaming" } },
    { "target": "public/greetings.html", "delay": 1000 },
    { "target": "public/footer.html", "model": { "year": 2026 }, "delay": 2000 }
  ]
}
```

### Object with `model` (templating)

```javascript
"/articles": {
  "target": "public/articles/index.html",
  "model": { "title": "Articles" }
}
```

`model` may be a plain object or a factory that receives the request context
and returns the data object, which makes it easy to derive values from dynamic
segments. The factory may also be `async` (returning a `Promise`) — for
example, when data is fetched from an external API. The engine awaits the
result before rendering the template.

```javascript
"/articles/:slug": {
  "target": "public/articles/[slug].html",
  "model": ({ params }) => ({
    "slug": params.slug,
    "title": params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  })
}
```

### Object with `stream` (page composition, streaming, async models supported)

An object with `stream: true` and a `chunks` array renders and writes each
chunk sequentially using `Transfer-Encoding: chunked` (like PHP `flush`),
instead of waiting for the whole page to be built. A chunk may carry its own
`delay` (milliseconds) applied before it is written, which is useful for
demonstrating sequential streaming. The first chunk has no delay so the
response starts immediately.

`model` in a streaming chunk may also be an async factory, and the engine
awaits it before writing the chunk.

```javascript
"/composed-stream": {
  "stream": true,
  "chunks": [
    { "target": "public/header.html", "model": { "title": "Streaming" } },
    { "target": "public/greetings.html", "delay": 1000 },
    { "target": "public/footer.html", "model": { "year": 2026 }, "delay": 2000 }
  ]
}
```

### Route value as a factory/callback

A route value may also be a function. It is invoked with the request context
(`{ params, query, pathname }`) and must return the real route value (a string,
an object with `target`/`model`, or a composed shape). This is handy when the
target or model needs to be derived at request time. The context object is
destructurable, so a callback can take only what it needs.

```javascript
"/factory/:name": ({ params, query }) => ({
  "target": "public/factory.html",
  "model": { "name": params.name, "lang": query.lang || "en" }
})
```

### Async route callback

A route-value factory may also be `async`. It is invoked with the request
context (`{ params, query, pathname }`) and can perform async work (for
example, fetching data from an external API) before returning the real route
value. The engine awaits the result before proceeding.

```javascript
"/async-fetch/:id": async ({ params }) => {
  const res = await fetch(`https://api.example.com/items/${params.id}`);
  const item = await res.json();
  return {
    "target": "public/item.html",
    "model": { "title": item.name, "description": item.desc }
  };
}
```

### Object with `transform` (content rewriting)

An entry may add a `transform`, an optional extra layer that receives the file
content and returns what is actually sent. The file on disk is never modified.
The transform runs after `{{ key }}` substitution and receives
`(content, ctx, meta)`, where `ctx` is the request context
(`{ params, query, pathname }`) and `meta` describes the source file
(`{ target, ext, contentType }`). It must return a `string` or a `Buffer` and
may be async.

```javascript
const transforms = {
  // Strip comments and collapse the formatting of a CSS file.
  "minify-css": (content) =>
    content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim(),

  // Turn an HTML chunk into plain text, using a route param.
  "greet-plain-text": async (content, { params }) =>
    `Hello, ${params.name}!\n\n${content.replace(/<[^>]+>/g, " ").trim()}\n`,
};

const routes = {
  // `transform` may be a registered name...
  "/style.min.css": {
    "target": "public/style.css",
    "transform": "minify-css",
    "type": "text/css"
  },
  // ...or an inline function.
  "/hello/:name": {
    "target": "public/greetings.html",
    "transform": (content, ctx) => content.toUpperCase(),
    "type": "text/plain; charset=utf-8"
  }
};

createServerFromRoutes(routes, { baseDir: import.meta.dirname, transforms });
```

Notes:

- A `transform` only applies to entries shaped like `{ target, … }`, including
  composed chunks. A plain string target is still streamed straight from disk,
  because the engine never holds its content in memory.
- The response head is written before composed chunks are rendered, so `type`
  and `headers` are only read from the first chunk.
- Named transforms keep the route map flat. An unregistered name throws, and any
  error while resolving a route is answered with a `500` response.
- Because the content is rewritten in memory, a route with a `transform` buffers
  its file instead of streaming it.
- For a route to rewrite a file that is *also* a static file, start the server
  with `precedence: "routes"`.

## Dynamic routes

Use `:name` placeholders (for example `:slug`). Captured values are available as
`match.params` and can be passed into a `model` factory.

## Template syntax

Templates use `{{ key }}` placeholders. Missing keys render as an empty string.

```html
<title>{{title}}</title>
<h1>{{title}}</h1>
<p>Slug: {{slug}}</p>
```

## Project structure

```text
hashttp/
├── libs/
│   └── roution/            # route matcher engine (createMatcher)
│       ├── src/            # matcher implementation
│       ├── tests/          # node:test unit tests
│       └── README.md       # matcher API and usage
├── src/
│   ├── hashttp.js           # hashttp serving engine
│   └── README.md            # source documentation
├── demo/
│   ├── server.js            # demo: routes + createServerFromRoutes
│   ├── build.js             # static HTML generator
│   ├── public/              # files served by the demo
│   │   ├── index.html      # route "/"
│   │   ├── 404.html        # fallback page (unused, replaced by custom-404.html)
│   │   ├── custom-404.html  # custom fallback (demo/server.js uses this)
│   │   ├── style.css       # static asset
│   │   ├── data.json       # static JSON
│   │   ├── factory.html    # template for the factory route
│   │   ├── todo.html       # template for async fetch route
│   │   ├── header.html     # composed chunk ({{title}})
│   │   ├── footer.html     # composed chunk ({{year}})
│   │   ├── greetings.html  # composed chunk
│   │   ├── section-item.html # composed chunk ({{content}})
│   │   └── articles/
│   │       ├── index.html   # route "/articles" ({{title}})
│   │       └── [slug].html  # route "/articles/:slug" ({{slug}}, {{title}})
│   └── dist/                # generated static output (gitignored)
├── test/
│   ├── hashttp.test.js      # unit tests for the pure helpers
│   ├── server.test.js       # integration tests over real HTTP requests
│   ├── static.test.js       # tests for createStaticFromRoutes
│   └── fixtures/            # templates and static files used by the tests
├── package.json
├── .gitignore
├── README.md
├── LICENSE.md
└── CHANGELOG.md
```

## Running the demo

The demo uses `createServerFromRoutes(routes)` from `src/hashttp.js`. The engine
serves `demo/public` first, then falls back to the route table, and finally to
`custom-404.html`.

```bash
npm run demo
# or
node demo/server.js
```

### Static generation

To generate static HTML files from the routes:

```bash
npm run build
# or
node demo/build.js
```

This creates a `demo/dist/` folder with one `.html` file per path.

Then open <http://localhost:7171/>. Try these paths:

- `/` — static home page
- `/articles` — route rendered with a `model`
- `/articles/hello-world` — dynamic route rendered from `[slug].html`
- `/composed` — page composed from header + greetings + news items + footer chunks
- `/composed-stream` — same composition streamed sequentially with per-chunk `delay`
- `/streaming-async` — streaming composition with async `model` factories
- `/factory/hello?lang=id` — route value as a callback using params and query
- `/async-fetch/1` — async route callback fetching external data
- `/data.json` — the JSON file, reformatted by a transform
- `/style.min.css` — the same stylesheet, minified by a transform
- `/hello/hashttp` — an HTML chunk turned into plain text by a transform
- `/missing-route` — fallback `custom-404.html` (custom fallback)

## Tests

The engine is covered by `node:test`, using the built-in runner and no test
dependencies:

```bash
npm test
# or
node --test test/*.test.js
```

| File | What it covers |
|---|---|
| `test/hashttp.test.js` | Pure helpers: `renderTemplate`, `resolveModel`, `resolveTransform`, `applyTransform`, `renderEntry`. No server involved. |
| `test/server.test.js` | `createServerFromRoutes` over real HTTP requests on an ephemeral port: static vs. route precedence, the 404 fallback, transforms, `type`/`headers`, composed and streaming routes, and 500 responses. |
| `test/static.test.js` | `createStaticFromRoutes` writing to a temporary directory, including async factories, transforms, and the custom `extension`. |

`libs/roution` is a vendored copy of a separate project and is tested in its own
repository, so it is not part of `npm test` here.

The demo in `demo/` doubles as manual QA and as living documentation of every
response shape. The tests cover what the demo cannot: they fail on their own.

## The roution matcher

The hashttp engine uses `createMatcher` from
`libs/roution/src/roution.js` for route resolution. The matcher is framework
agnostic and runtime independent, and supports static lookup, dynamic segments,
query parsing, and an optional `*` wildcard. See
[`libs/roution/README.md`](libs/roution/README.md) for the full API, or the
dedicated repository for deeper detail and cross-language ports:
<https://github.com/dimaspandu/roution>.

```javascript
import { createMatcher } from "./libs/roution/src/roution.js";

const matcher = createMatcher({
  "/": "public/index.html",
  "/articles/:slug": "public/articles/[slug].html",
  "*": "public/404.html"
});

matcher.match("/articles/javascript?page=1");
// { found: true, pathname: "/articles/javascript", route: "/articles/:slug",
//   params: { slug: "javascript" }, query: { page: "1" },
//   value: "public/articles/[slug].html" }
```

## Using the engine

```javascript
import { createServerFromRoutes } from "./src/hashttp.js";

const routes = {
  "/": "public/index.html",
  "/articles/:slug": {
    target: "public/articles/[slug].html",
    model: ({ params }) => ({ slug: params.slug, title: params.slug })
  },
  "/composed": [
    { target: "public/header.html", model: { title: "Hello" } },
    "public/greetings.html",
    { target: "public/footer.html", model: { year: 2026 } }
  ]
};

createServerFromRoutes(routes, { baseDir: import.meta.dirname, port: 7171 });
```

## Options

`createServerFromRoutes` accepts an optional second argument for
configuration:

| Option | Type | Default | Description |
|---|---|---|---|
| `baseDir` | `string` | `process.cwd()` | Base directory used to resolve all file paths (route targets, static files, fallback). All relative paths are resolved relative to `baseDir`. |
| `publicDir` | `string` | `<baseDir>/public` | Directory that holds static files (HTML, CSS, JS, JSON, images …). Existing files here are served directly before the route matcher is consulted. |
| `port` | `number` | `7171` | Port the HTTP server listens on. |
| `host` | `string` | `"localhost"` | Host the HTTP server binds to. |
| `fallback` | `string` | `"404.html"` | File served when no route or static file matches. Resolved relative to `publicDir`. |
| `precedence` | `"static" \| "routes"` | `"static"` | Which resolver runs first. Both always run; this only decides who goes first, so `"routes"` lets a route take over a path that also exists in `publicDir`. |
| `transforms` | `Object<string, Function>` | `{}` | Named transforms that route entries reference via `transform`. |

### Custom fallback

Set `fallback` to a different file name (relative to `publicDir`) to
serve a custom 404 page:

```javascript
createServerFromRoutes(routes, {
  baseDir: import.meta.dirname,
  fallback: "errors/not-found.html"
});
```

## Static generation

`createStaticFromRoutes` generates static HTML files from the same route
definitions without starting a server. It is useful for pre-rendering
sites for deployment or for creating template packages.

```javascript
import { createStaticFromRoutes } from "./src/hashttp.js";

const routes = {
  "/": "public/index.html",
  "/articles/:slug": {
    target: "public/articles/[slug].html",
    model: ({ params }) => ({ slug: params.slug, title: params.slug })
  },
  "/composed": [
    { target: "public/header.html", model: { title: "Hello" } },
    "public/greetings.html",
    { target: "public/footer.html", model: { year: 2026 } }
  ]
};

await createStaticFromRoutes(routes, ["/", "/articles/hello-world", "/composed"], {
  baseDir: import.meta.dirname,
  outputDir: "dist"
});
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `baseDir` | `string` | `process.cwd()` | Base directory for resolving file paths. |
| `outputDir` | `string` | "dist" | Output directory for generated files. |
| `transforms` | `Object<string, Function>` | `{}` | Named transforms that route entries reference via `transform`. |
| `extension` | `string` | `".html"` | Extension used for the generated files. |

### How routes are resolved

- **String target** — the file is read and written as-is.
- **Object with `target` and `model`** — the template is rendered with the model data. `model` may be an async factory; `createStaticFromRoutes` awaits the result.
- **Array (composed)** — all chunks are rendered and concatenated into one file.
- **Object with `stream` and `chunks`** — all chunks are rendered and concatenated (streaming is ignored during static generation). Chunk `model` factories may be async and are awaited.
- **Factory/callback** — invoked with a synthetic context (`{ params, query: {}, pathname }`) and the result is resolved the same way. The factory may return a Promise.

Any `transform` on an entry is applied here too, using the same
`options.transforms` registry, so a build and a dev server can share one set of
transform definitions.

### Output path mapping

URL paths are mapped to file paths by stripping the leading `/` and appending `.html`:

| URL path | Output file |
|---|---|
| `/` | `dist/index.html` |
| `/articles` | `dist/articles.html` |
| `/articles/hello-world` | `dist/articles/hello-world.html` |
| `/composed` | `dist/composed.html` |
| `/composed-stream` | `dist/composed-stream.html` |
| `/streaming-async` | `dist/streaming-async.html` |

## Source documentation

See `src/README.md` for detailed documentation of the hashttp
engine, its exports, architecture, and design principles.

## Design principles

- **Zero dependencies** — only built-in Node.js APIs.
- **Minimal code** — small, readable, maintainable.
- **Modular** — the matcher is isolated and unit-tested on its own.
- **Flat config** — routes are a simple, serializable object.
- **Auto content-type** — MIME type is detected from the file extension.
- **Static first** — existing files win; routing is the fallback. Use
  `precedence: "routes"` when a route must take over a path that is also a
  static file.
