# vrontend

A boilerplate for building single page applications in vanilla JavaScript, with
**zero runtime dependencies** and no build-time framework.

No React, no virtual DOM, no compilation to a custom runtime. You write real
DOM elements, a real router, and a real HTTP server — the boilerplate only
supplies the wiring so a new project starts from a working app instead of an
empty folder.

## Libraries

vrontend is assembled from four independent libraries. Each one is developed
and documented separately, and all four are vendored into this repository as
git submodules — `libs/` for the Node-side tools, `src/assets/js/libs/` for the
browser-side ones. There is no `node_modules` and no install step.

| Concern | Library | Source | Documentation | Runs in |
| --- | --- | --- | --- | --- |
| Bundler + JSX transpiler | **ngapack** | [github](https://github.com/dimaspandu/ngapack) | — | Node |
| HTTP server | **hashttp** | [github](https://github.com/dimaspandu/hashttp) | — | Node |
| SPA router | **historypp** | [github](https://github.com/dimaspandu/historypp) | [historypp.digital](https://historypp.digital/) | browser |
| DOM + reactivity | **dompp** | [github](https://github.com/dimaspandu/dompp) | [dompp.digital](https://dompp.digital/) | browser |

**ngapack** — module bundler and the JSX transpiler. Walks the graph from
`src/pre-index.js`, emits an IIFE bundle plus one chunk per dynamically
imported view, and runs `terser` for minification.

**hashttp** — the HTTP server behind both `run.dev.js` and `run.start.js`. Static
file serving, a route table with per-route transforms, and pre-rendering support.

**historypp** — the client-side router. Matching (including `:param` segments),
`pushState` navigation, middleware, and lifecycle hooks. Patches `window.history`.

**dompp** — DOM helpers and reactivity. Adds `setText`, `setChildren`,
`setStyles`, `setAttributes`, `setEvents`, `setState`, `setEnhancement`, and
`setFineGrained` to `Element.prototype`, plus `createSignal` on `Document`.

The browser-side libraries keep version-pinned source folders, so upgrading one
is a single line change in its `src/index.js`:

```js
// src/assets/js/libs/dompp/src/index.js
import "./1.1.1/index.js";   // <- switch to the version you want
```

## Setup (first clone)

```bash
git clone --recurse-submodules https://github.com/dimaspandu/vrontend.git
cd vrontend
MINIFY=false npm run build
MINIFY=false npm run dev
```

`--recurse-submodules` is required because the four top-level submodules contain
three nested submodules (5 gitlinks total inside `libs/`). If you already cloned
without it, run:

```bash
git submodule update --init --recursive
```

The repo is zero-dependency: do **not** run `npm install`. Doing so creates a
`package-lock.json` that is not tracked by this repository.

### Vendored path mapping

| Former plain-file path | Current submodule path | Pinned tag |
| --- | --- | --- |
| `libs/hashttp/` | `libs/hashttp/` | `v2.0.0` |
| `libs/ngapack/` | `libs/ngapack/` | `v2.0.0` |
| `src/assets/js/libs/dompp/` | `src/assets/js/libs/dompp/` | `v1.5.0` |
| `src/assets/js/libs/historypp/` | `src/assets/js/libs/historypp/` | `v2.0.6` |

## Requirements

Node.js 22.7 or newer (for ESM syntax detection and `fs.readdirSync`). Verified
on Node 24.

## Getting started

```bash
node run.dev.js      # dev server on http://localhost:7200
node run.bundle.js   # production build into dist/
node run.start.js    # serve dist/ on http://localhost:7200
```

With the `package.json` in this repo the same commands are available as
`npm run dev`, `npm run build`, and `npm run start`.

The dev server serves `src/` unbundled, so the browser loads native ES modules
straight from disk. Edit any file and reload — no rebuild step in between.

All three commands read their configuration from `.env`; see
[Configuration](#configuration).

### Docker

The image is a two-stage build: the first stage runs `run.bundle.js`, the second
serves the result with `run.start.js`. Only hashttp and the built output reach
the final image — the bundler and the browser libraries stay in the build stage.

```bash
docker build -t vrontend .
docker run --rm -p 7200:7200 vrontend
```

The container listens on `0.0.0.0:7200` by default. `PORT` and `HOST` are read
from the process environment, so no `.env` file is needed inside the image:

```bash
docker run --rm -e PORT=8080 -p 8080:8080 vrontend
```

`.dockerignore` keeps the build context small and makes sure a local `.env`,
`dist/`, and editor state never reach the daemon.

The build stage installs `terser` for minification. If you would rather keep the
build fully offline, build with `-e MINIFY=false`:

```bash
docker build --build-arg MINIFY=false -t vrontend .
```

## How it fits together

```
run.dev.js ──────► hashttp :7200, publicDir = src/
                   serves .jsx compiled on the fly

run.bundle.js ───► ngapack
                   src/pre-index.js ──► dist/index.js (IIFE) + view chunks

run.start.js ─────► hashttp :7200, publicDir = dist/
```

Ports shown are the defaults; all three scripts take `PORT` and `HOST` from
`.env`.

In the browser:

```
src/index.js          route table, mount point, link interception
        │
        ├─ domain/<name>/handler.js   route lifecycle, dynamic import
        │        └─ view.jsx          the view itself (JSX)
        │
        ├─ store/                     plain data, no framework
        └─ factories/elementBuilder.js  the JSX factory
```

### The two halves of routing

The server only knows the app shell; the browser owns the real routes.

- **Server side** (`app.routes.js`): each client route pattern maps to the HTML
  shell, so a hard reload or a shared deep link such as `/task/12` still boots
  the app. Add a top-level route there when you add one to the router.
- **Client side** (`src/index.js`): historypp handles matching, navigation,
  and lifecycle hooks. Full API reference:
  [historypp.digital](https://historypp.digital/).

`src/index.js` also intercepts internal link clicks, so views can use ordinary
`<a href>` markup instead of wiring every link to a click handler.

## Project layout

```
.
├── app.routes.js            client route patterns shared by the dev/prod servers
├── env.js                   configuration loader, reads .env
├── .env.example             template for local configuration
├── Dockerfile               two-stage image: build, then serve
├── run.dev.js               dev server
├── run.bundle.js            production build
├── run.start.js             production preview
├── package.json             scripts + engine constraint
├── .gitmodules              submodule definitions (4 top-level + 3 nested)
└── src/
    ├── pre-index.js         bundler entry: lists every asset to emit
    ├── index.html           app shell: layout + #app mount point
    ├── 404.html             served when no route or file matches
    ├── index.js             runtime entry: router wiring
    └── assets/
        ├── css/
        │   ├── styles.css
        │   └── counter.module.css
        ├── images/
        └── js/
            ├── domain/      one folder per route
            │   ├── tasks/   /        list + form
            │   ├── task/    /task/:id  detail, dynamic param
            │   ├── counter/ /counter   uppercase component example
            │   └── notfound/
            ├── factories/
            │   └── elementBuilder.js
            ├── store/
            │   └── tasks.js
            └── libs/        browser-side submodules
                ├── dompp/
                └── historypp/
```

And inside `libs/` (Node-side submodules):

```
libs/
├── hashttp/
│   └── libs/roution/        nested submodule
└── ngapack/
    ├── libs/djs/            nested submodule
    └── libs/js-analyzer/    nested submodule
```

## Configuration

The `run.*.js` scripts read their settings from a `.env` file in the repository
root, loaded by `env.js` using Node's built-in `process.loadEnvFile`. There is
no dotenv dependency, and every key is optional.

Copy `.env.example` to `.env` to get started. `.env` is gitignored, so your
local settings stay out of the repository.

| Key | Default | Used by | Meaning |
| --- | --- | --- | --- |
| `PORT` | `7200` | dev, preview | Port the server binds to |
| `HOST` | `localhost` | dev, preview | Interface to bind; `0.0.0.0` exposes the dev server on your network |
| `MINIFY` | `true` | build | Minify the production build (needs `terser` on PATH) |
| `JSX_FACTORY` | `elementBuilder` | dev, build | Name of the JSX factory the transpiler emits calls to |
| `OUTPUT_DIR` | `dist` | build, preview | Build output folder, relative to the repository root |

A malformed value fails fast with a message naming the key, rather than
silently falling back. Note that changing `OUTPUT_DIR` changes the folder name,
so add it to `.gitignore` if you rename it.

### About `MINIFY`

`run.bundle.js` sets ngapack's `uglified` flag from `MINIFY`. With `MINIFY=true`
the build shells out to the `terser` CLI. **If `terser` is not installed, ngapack
falls back to posting your source code to a third-party minifier API**
(`libs/ngapack/src/helper/uglifyJS.js:106`). Set `MINIFY=false` to keep the
build entirely offline — the output is simply unminified.

## Conventions

### A route is a folder

Each route lives in `src/assets/js/domain/<name>/`:

- **`handler.js`** — a factory that receives the mount element and returns a
  historypp handler. It dynamically imports the view, so each route ships as its
  own chunk instead of landing in the main bundle.
- **`view.jsx`** — renders the DOM. It knows nothing about routing.

```js
// src/assets/js/domain/tasks/handler.js
export default function tasksHandler(app) {
  return {
    onMeet: async () => {
      const { default: view } = await import("./view.jsx");
      app.setChildren(view());
    }
  };
}
```

```js
// src/assets/js/domain/task/handler.js  — ctx.params carries :id
export default function taskHandler(app) {
  return {
    onMeet: async (ctx) => {
      const { default: view } = await import("./view.jsx");
      app.setChildren(view(ctx));
    }
  };
}
```

A view that lives outside `domain/` can follow the same shape, for example a
shared `components/` folder.

### Registering routes

```js
// src/index.js
const app = document.getElementById("app");

history.router("/", tasksHandler(app));
history.router("/task/:id", taskHandler(app));
history.notFound(notFoundHandler(app));
```

Historypp lifecycle hooks available on a handler: `onMeet`, `onArrive`,
`onExit`, `onReturn`, `onComeback`, `canLeave`, and `end`.

### Writing views with JSX

Every `.jsx` file must import the factory itself — the transpiler emits a bare
`elementBuilder(...)` call and never adds the import.

```jsx
import elementBuilder from "../../factories/elementBuilder.js";

export default function view(ctx) {
  return (
    <section class="panel">
      <h1 class="panel__title">Tasks</h1>
      <a href={`/task/${ctx.params.id}`}>Open</a>
    </section>
  );
}
```

The factory (`src/assets/js/factories/elementBuilder.js`) routes JSX props to
dompp setters:

| Prop | Applied as |
| --- | --- |
| `class` / `className` | `setAttributes` |
| `style` | `setStyles` |
| `on` | `setEvents` |
| anything else | `setAttributes` |

Fragments work both ways — `<>...</>` (compiled to `elementBuilder.fragment(...)`)
and `<fragment>`.

Uppercase tags are treated as function components. When the transpiler sees
`<Counter initial={0} />`, it emits `elementBuilder(Counter, { initial: 0 })`.
The factory detects that `tag` is a function and invokes it directly, so
components can return JSX instead of calling `elementBuilder` manually.

```jsx
import elementBuilder from "../../factories/elementBuilder.js";

function Counter(props) {
  const initial = (props && props.initial) || 0;
  let count = initial;

  const display = <span class="counter__value">{count}</span>;

  return (
    <div class="counter">
      {display}
      <button
        class="counter__dec"
        type="button"
        on={{ click() { count--; display.setText(count); } }}
      >
        −
      </button>
      <button
        class="counter__inc"
        type="button"
        on={{ click() { count++; display.setText(count); } }}
      >
        +
      </button>
    </div>
  );
}

export default function view() {
  return (
    <section class="panel">
      <h1 class="panel__title">Counter</h1>
      <p class="panel__subtitle">Uppercase component example</p>
      <Counter initial={0} />
    </section>
  );
}
```

### Reactivity with dompp

Full API reference: [dompp.digital](https://dompp.digital/).

dompp adds `setText`, `setChildren`, `setStyles`, `setAttributes`, `setEvents`,
`setState`, `setEnhancement`, and `setFineGrained` to `Element.prototype`, so
import it before any view runs. It also installs `Document.prototype.createSignal`.

**Stateful mode** — pair `setState` with a callback setter. The callback re-runs
whenever the state changes:

```jsx
const taskList = <ul class="task-list" />
  .setState({ tasks: list() })
  .setChildren(({ state }) => renderItems(state.tasks));

const refresh = () => taskList.setState({ tasks: list() });
```

**Fine-grained mode** — `createSignal` plus `.setFineGrained()`. Note that
signals take a value, not a functional updater: `setCount(count() + 1)`, never
`setCount(c => c + 1)`.

```jsx
const [count, setCount] = document.createSignal(0);

const label = <p class="counter__value" />
  .setFineGrained()
  .setText(() => count());
```

There is no virtual DOM and no diffing. A setter with a callback re-runs and
replaces the node's contents; a setter with a plain value writes directly.

### Styling

Plain CSS in `src/assets/css/styles.css`, imported by `src/pre-index.js` so the
bundler copies it to `dist/`. The example uses BEM-style class names
(`task-item__title`), but nothing in the boilerplate depends on that.

For route-specific styles, use a CSS module (`*.module.css`) and import it
dynamically inside the route handler. The `{ with: { type: "css" } }` assertion
causes ngapack to bundle the stylesheet as a module that resolves to a
`CSSStyleSheet`. The handler applies it to `document.adoptedStyleSheets` before
rendering the view, so the CSS is only loaded when that route is visited.

```js
// src/assets/js/domain/<name>/handler.js
export default function handler(app) {
  return {
    onMeet: async () => {
      const { default: stylesheet } = await import(
        "../../css/<name>.module.css",
        { with: { type: "css" } }
      );

      if (stylesheet instanceof CSSStyleSheet) {
        document.adoptedStyleSheets = [
          ...document.adoptedStyleSheets,
          stylesheet
        ];
      }

      const { default: view } = await import("./view.jsx");
      app.setChildren(view());
    }
  };
}
```

## Notes on the dev server

`run.dev.js` does two things worth knowing about:

- It scans `src/` and registers a route for every `.jsx` file it finds, because
  the browser requests those files as modules while the files on disk are not
  valid JavaScript. Adding a view needs no server change.
- Its `compile-jsx` transform re-reads each file from disk on every request.
  hashttp memoizes served files for the lifetime of the process, so without
  this a `.jsx` edit would not show up until the server was restarted.

Vendored library folders (`libs/`, `src/assets/js/libs/`) are skipped by that
scan. Submodule metadata (`.git/`, `.gitmodules`) is never bundled because
ngapack follows the import graph from its entry, not directory scans.

## License

[MIT](LICENSE) © 2026 dimaspandu

The four vendored libraries under `libs/` and `src/assets/js/libs/` are
tracked as git submodules and are copyrighted by their respective authors and
keep their own licenses.