# hashttp Demo

This folder contains a minimal demo that showcases **hashttp** — a
dependency-free HTTP serving engine that maps request paths to files and
templates.

## Quick start

```bash
npm run demo
# or
node demo/server.js
```

Then open <http://localhost:7171/>.

## Generate static HTML

To generate static HTML files from the routes, run:

```bash
npm run build
# or
node demo/build.js
```

This creates a `demo/dist/` folder with one `.html` file per path:

```text
demo/dist/
├── index.html
├── articles.html
├── articles/
│   └── hello-world.html
├── composed.html
├── composed-stream.html
├── streaming-async.html
└── factory/
    └── anything.html
```

Each generated file contains the fully resolved HTML — composed chunks are flattened, streaming routes are rendered as a single file, and factory/callback routes are resolved with the matched params.

## What the demo covers

The demo (`server.js`) defines a `routes` object and passes it to
`createServerFromRoutes`. Each route value demonstrates a different
response shape that hashttp supports.

### 1. Static file (string target)

A plain string path serves the file directly with an auto-detected
`Content-Type`.

```javascript
"/": "public/index.html"
```

### 2. Template (object with `target` and `model`)

An object with `target` and `model` renders a template file, substituting
`{{ key }}` placeholders with values from the model.

```javascript
"/articles": {
  target: "public/articles/index.html",
  model: { title: "Articles" }
}
```

`model` may be a plain object or a **factory** that receives the request
context (`{ params, query, pathname }`) and returns the data object. This
is useful for dynamic segments:

```javascript
"/articles/:slug": {
  target: "public/articles/[slug].html",
  model: ({ params }) => ({
    slug: params.slug,
    title: params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  })
}
```

### 3. Composed page (array of chunks)

An array of entries is rendered in order and concatenated into one full
response. Each entry is either a file path (string) or an object with
`target` and `model`. The `...news.map(...)` spreads multiple entries
that reuse the same template file (`section-item.html`) with different
model data.

```javascript
const news = [
  "Lorem ipsum dolor sit amet, ...",
  "Fusce pulvinar pulvinar elit vel egestas. ...",
];

"/composed": [
  { target: "public/header.html", model: { title: "Hello, World!" } },
  "public/greetings.html",
  ...news.map(item => ({
    target: "public/section-item.html",
    model: { content: `<p>${item}</p>` }
  })),
  { target: "public/footer.html", model: { year: new Date().getFullYear() } }
]
```

### 4. Streaming composed page

An object with `stream: true` and a `chunks` array writes each chunk
sequentially using `Transfer-Encoding: chunked` instead of waiting for
the full page. A chunk may carry its own `delay` (milliseconds) applied
before it is written.

```javascript
"/composed-stream": {
  stream: true,
  chunks: [
    { target: "public/header.html", model: { title: "Streaming" } },
    { target: "public/greetings.html", delay: 1000 },
    { target: "public/footer.html", model: { year: 2026 }, delay: 2000 }
  ]
}
```

### 5. Streaming composed page with async model

An object with `stream: true` and a `chunks` array writes each chunk
sequentially using `Transfer-Encoding: chunked`. The `model` property of
each chunk can be an **async factory** that returns a `Promise` — for
example, after fetching data from an external API. The engine awaits each
chunk's model before writing it, so chunks are still sent in order.

```javascript
"/streaming-async": {
  stream: true,
  chunks: [
    {
      target: "public/header.html",
      model: async () => ({ title: "Streaming Async" })
    },
    {
      target: "public/greetings.html",
      delay: 500,
      model: async () => {
        const res = await fetch("https://api.example.com/data");
        const data = await res.json();
        return { greeting: data.message };
      }
    },
    {
      target: "public/footer.html",
      model: async () => ({ year: new Date().getFullYear() })
    }
  ]
}
```

### 6. Route value as a factory/callback

A route value may be a function. It is invoked with the request context
and must return the real route value (a string, an object with
`target`/`model`, or a composed shape). This is handy when the target or
model needs to be derived at request time.

```javascript
"/factory/:name": ({ params, query }) => ({
  target: "public/factory.html",
  model: { name: params.name, lang: query.lang || "en" }
})
```

### 7. Async route callback

A route-value factory may also be `async`. It is invoked with the request
context and can perform async work (for example, fetching data from an
external API) before returning the real route value. The engine awaits the
result before proceeding.

```javascript
"/async-fetch/:id": async ({ params }) => {
  const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${params.id}`);
  const todo = await res.json();
  return {
    target: "public/todo.html",
    model: { title: `Todo #${todo.id}`, completed: todo.completed ? "Yes" : "No" }
  };
}
```

### 8. Static files / assets

Any file under the public directory is served as-is with the correct MIME
type, as long as no route claims the same path first (see section 10):

```
GET /style.css  →  serves demo/public/style.css
GET /404.html   →  serves demo/public/404.html
```

### 9. 404 fallback

When no route matches and no static file is found, `404.html` is served
with a `404` status.

### 10. Transform (manipulating the file that is sent back)

An entry may declare a `transform`: an extra layer between reading the file and
sending the response. The target is read and rendered exactly as usual, and only
then does the transform get to change the content. The file on disk is never
modified.

A transform is called as `(content, ctx, meta)`:

- `content` — the file content after `{{ key }}` substitution,
- `ctx` — the request context (`{ params, query, pathname }`),
- `meta` — info about the source file (`{ target, ext, contentType }`).

It must return a `string` or a `Buffer`, and it may be `async`. Transforms are
declared in the `transforms` option and referenced by name, so the route map
stays flat. An inline function also works.

```javascript
const transforms = {
  "pretty-json": (content) => JSON.stringify(JSON.parse(content), null, 2),

  "minify-css": (content) =>
    content
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s*([{}:;,])\s*/g, "$1")
      .replace(/;}/g, "}")
      .replace(/\s+/g, " ")
      .trim(),

  "greet-plain-text": async (content, { params }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `Hello, ${params.name}!\n\n${text}\n`;
  },
};
```

Three routes use them:

```javascript
// `demo/public/data.json` also exists as a static file, so this route only
// wins because the server is started with `precedence: "routes"`.
"/data.json": {
  target: "public/data.json",
  transform: "pretty-json",
},

// The same stylesheet under a different name, minified on the fly.
"/style.min.css": {
  target: "public/style.css",
  transform: "minify-css",
  type: "text/css",
},

// An HTML chunk served as plain text. `type` overrides the content type that
// would otherwise be derived from the `.html` target.
"/hello/:name": {
  target: "public/greetings.html",
  transform: "greet-plain-text",
  type: "text/plain; charset=utf-8",
},
```

Try it: `/data.json` returns indented JSON even though the file on disk is a
single line, and `/style.min.css` returns one long line even though
`demo/public/style.css` is indented. `/style.css` is still served untouched,
because no route claims it.

### 11. `precedence` (routes before static files)

By default the static folder is checked first, so a route whose path also
exists as a file in `publicDir` never runs. `precedence: "routes"` swaps the
order:

```javascript
createServerFromRoutes(routes, {
  baseDir: demoDir,
  fallback: "custom-404.html",
  precedence: "routes",
  transforms,
});
```

Static serving is not disabled: if no route matches, the static folder is still
checked before the 404 fallback. That is why `/style.css`, `/404.html`, and
every other existing file keep working in this demo.

`precedence` is per-server, not per-route. A route that is not shadowed by a
static file — such as `/style.min.css` — works with the default
`precedence: "static"` too.

## Options

`createServerFromRoutes` accepts an optional second argument for
configuration:

| Option | Type | Default | Description |
|---|---|---|---|
| `baseDir` | `string` | `process.cwd()` | Base directory used to resolve all file paths (route targets, static files, 404 page). All relative paths in routes and options are resolved relative to `baseDir`. |
| `publicDir` | `string` | `<baseDir>/public` | Directory that holds static files (HTML, CSS, JS, JSON, images …). Existing files here are served directly, before or after the route matcher depending on `precedence`. |
| `port` | `number` | `7171` | Port the HTTP server listens on. |
| `host` | `string` | `"localhost"` | Host the HTTP server binds to. |
| `fallback` | `string` | `"404.html"` | File served when no route or static file matches. Resolved relative to `publicDir`. |
| `precedence` | `"static" \| "routes"` | `"static"` | Which resolver runs first. Both always run, so nothing becomes unreachable. The demo uses `"routes"`. |
| `transforms` | `Object<string, Function>` | `{}` | Named transforms that route entries reference via `transform`. |

### Example with all options

```javascript
createServerFromRoutes(routes, {
  baseDir: import.meta.dirname,
  publicDir: path.join(import.meta.dirname, "public"),
  port: 3000,
  host: "0.0.0.0",
  fallback: "custom-404.html",
  precedence: "routes",
  transforms
});
```

### Custom fallback page

Set `fallback` to a different file name (relative to `publicDir`) to serve
a custom 404 page instead of the default `404.html`:

```javascript
createServerFromRoutes(routes, {
  baseDir: import.meta.dirname,
  fallback: "errors/not-found.html"
});
```

The file must exist under `publicDir`; otherwise the response will be
empty with a `404` status, just like the default behaviour when
`404.html` is missing.

## Using a different directory instead of `public`

By default hashttp looks for static files in `<baseDir>/public`. If your
project uses a different folder (for example `src`), you have two options:

### Option A: Point `publicDir` to the new folder

Set `publicDir` explicitly in the options so hashttp knows where to look
for static assets:

```javascript
createServerFromRoutes(routes, {
  baseDir: import.meta.dirname,
  publicDir: path.join(import.meta.dirname, "src")
});
```

With this setup, a request for `/style.css` will look for
`<baseDir>/src/style.css`. Route targets in the `routes` object still
resolve relative to `baseDir` (not `publicDir`), so you would write:

```javascript
"/": "src/index.html"
```

### Option B: Change `baseDir` and adjust route targets

Set `baseDir` to the folder that contains both your static assets and
your route templates, then adjust all route paths accordingly:

```javascript
createServerFromRoutes(routes, {
  baseDir: path.join(import.meta.dirname, "src")
});
```

Now every route target is resolved relative to `src/`:

```javascript
"/": "index.html",
"/articles": { target: "articles/index.html", model: { title: "Articles" } }
```

And `publicDir` defaults to `<baseDir>/public`, which would be
`src/public`. If you do **not** want a separate public directory at all,
set `publicDir` to `null` or point it to the same folder — but note that
the static-first fallback will then try to serve any file that matches
the request path directly out of that folder.

### Summary of directory layouts

```
# Default layout (publicDir = baseDir/public)
project/
├── baseDir/
│   ├── public/          ← static files served first
│   │   ├── index.html
│   │   └── style.css
│   └── templates/       ← route targets (optional sub-folders)
│       └── articles/
│           └── [slug].html

# Using src/ as the static folder
project/
├── baseDir/
│   ├── src/             ← publicDir points here
│   │   ├── index.html
│   │   └── style.css
│   └── templates/       ← route targets
│       └── articles/
│           └── [slug].html
```

## Project structure

```text
demo/
├── server.js            # demo server: routes + createServerFromRoutes
├── build.js             # static HTML generator
├── README.md            # this file
├── dist/              # generated static files (output of build.js)
└── public/              # static files served by the demo
    ├── index.html       # route "/"
    ├── 404.html         # fallback page
    ├── custom-404.html  # custom fallback used in demo/server.js
    ├── style.css        # static CSS, also minified by /style.min.css
    ├── data.json        # static JSON, reshaped by /data.json
    ├── factory.html     # template for the factory route
    ├── todo.html        # template for async fetch route
    ├── header.html      # composed chunk ({{title}})
    ├── footer.html      # composed chunk ({{year}})
    ├── greetings.html   # composed chunk, also served as text by /hello/:name
    ├── section-item.html  # composed chunk ({{content}})
    └── articles/
        ├── index.html   # route "/articles" ({{title}})
        └── [slug].html  # route "/articles/:slug" ({{slug}}, {{title}})
```

## Running the demo

```bash
npm run demo
```

Then try these paths in your browser:

- <http://localhost:7171/> — static home page
- <http://localhost:7171/articles> — route rendered with a `model`
- <http://localhost:7171/articles/hello-world> — dynamic route from `[slug].html`
- <http://localhost:7171/composed> — page composed from header + greetings + footer (concat)
- <http://localhost:7171/composed-stream> — same composition streamed sequentially with per-chunk `delay`
- <http://localhost:7171/streaming-async> — streaming composition with async `model` factories
- <http://localhost:7171/factory/hello?lang=id> — route value as a callback using params and query
- <http://localhost:7171/async-fetch/1> — async route callback fetching external data
- <http://localhost:7171/data.json> — the JSON file, reformatted by a transform
- <http://localhost:7171/style.css> — the stylesheet, served as-is
- <http://localhost:7171/style.min.css> — the same stylesheet, minified by a transform
- <http://localhost:7171/hello/hashttp> — an HTML chunk turned into plain text by a transform
- <http://localhost:7171/missing-route> — fallback `404.html` (or custom fallback if configured)