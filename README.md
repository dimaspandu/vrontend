# vrontend

A boilerplate for building single page applications in vanilla JavaScript, with
**zero runtime dependencies** and no build-time framework.

No React, no virtual DOM, no compilation to a custom runtime. You write real
DOM elements, a real router, and a real HTTP server — the boilerplate only
supplies the wiring so a new project starts from a working app instead of an
empty folder.

| Concern | Provided by | Type |
| --- | --- | --- |
| HTTP server | [hashttp](libs/hashttp) | vendored, Node |
| Bundler + JSX | [ngapack](libs/ngapack) | vendored, Node |
| Routing | [historypp](src/assets/js/libs/historypp) | vendored, browser |
| DOM + reactivity | [dompp](src/assets/js/libs/dompp) | vendored, browser |

All four are vendored in this repository. There is no `node_modules` and no
install step.

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

## How it fits together

```
run.dev.js ──────► hashttp :7200, publicDir = src/
                   serves .jsx compiled on the fly

run.bundle.js ───► ngapack
                   src/pre-index.js ──► dist/index.js (IIFE) + view chunks

run.start.js ─────► hashttp :7200, publicDir = dist/
```

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
- **Client side** (`src/index.js`): `historypp` handles matching, navigation,
  and lifecycle hooks.

`src/index.js` also intercepts internal link clicks, so views can use ordinary
`<a href>` markup instead of wiring every link to a click handler.

## Project layout

```
.
├── app.routes.js            client route patterns shared by the dev/prod servers
├── run.dev.js               dev server
├── run.bundle.js            production build
├── run.start.js             production preview
└── src/
    ├── pre-index.js         bundler entry: lists every asset to emit
    ├── index.html           app shell: layout + #app mount point
    ├── 404.html             served when no route or file matches
    ├── index.js             runtime entry: router wiring
    └── assets/
        ├── css/styles.css
        ├── images/
        └── js/
            ├── domain/      one folder per route
            │   ├── tasks/   /        list + form
            │   ├── task/    /task/:id  detail, dynamic param
            │   └── notfound/
            ├── factories/
            │   └── elementBuilder.js
            ├── store/
            │   └── tasks.js
            └── libs/        vendored browser libraries
```

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

### Reactivity with dompp

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

## Notes on the dev server

`run.dev.js` does two things worth knowing about:

- It scans `src/` and registers a route for every `.jsx` file it finds, because
  the browser requests those files as modules while the files on disk are not
  valid JavaScript. Adding a view needs no server change.
- Its `compile-jsx` transform re-reads each file from disk on every request.
  hashttp memoizes served files for the lifetime of the process, so without
  this a `.jsx` edit would not show up until the server was restarted.

Vendored library folders are skipped by that scan.

## License

MIT