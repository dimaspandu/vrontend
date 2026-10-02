# NGAPACK Demo

A minimal, self-contained demo showing how ngapack bundles a simple web application.

## What it demonstrates

- Static ES module imports
- CSS modules (`.module.css`)
- Non-JS asset emission (`.css`, `.html`)
- Browser runtime injection
- JSX transpilation driven by the `.jsx` extension
- Dynamic import of a JSX module

## Project structure

```
demo/
├─ src/                 # Source application
│  ├─ entry.js          # Entry point (orchestrates)
│  ├─ greeting.js       # Plain ES module
│  ├─ factories/        # JSX factory implementations
│  │  └─ elementBuilder.js
│  ├─ components/       # JSX components (transpiled via extension)
│  │  ├─ Card.jsx
│  │  └─ DynamicCard.jsx
│  ├─ style.module.css  # CSS module (consumed by JS)
│  ├─ global.css        # Plain CSS asset
│  └─ index.html        # HTML asset
├─ public/              # Bundled output (generated)
├─ bundle.js            # Bundler runner
└─ serve.js             # Static server runner
```

## Usage

### 1. Bundle

```bash
node demo/bundle.js
```

Output is written to `demo/public/entry.js`.

### 2. Serve

```bash
node demo/serve.js
```

Then open: http://localhost:2121

## How it works

`demo/bundle.js` calls the ngapack bundler directly:

```js
import bundler from "../src/index.js";

await bundler({
  entry: path.join(__dirname, "src", "entry.js"),
  jsxFactory: "elementBuilder",
  outputDir: path.join(__dirname, "public"),
  outputFilename: "entry.js",
  uglified: true
});
```

### JSX transpilation

JSX is enabled by file extension. `entry.js` imports `Card.jsx` with a plain import:

```js
import Card from "./components/Card.jsx";
```

The bundler runs `compileJSX()` on every `.jsx` file before ESM→CJS conversion. The factory name is set once through the bundler option `jsxFactory`, which overrides the default `"d"` and any `/** @jsx */` pragma in the target file.

The factory implementation lives in `factories/elementBuilder.js` and is imported normally by `Card.jsx`.

It also shows the two call shapes the transpiler emits:

- `elementBuilder(tag, props, ...children)` for regular elements
- `elementBuilder.fragment(...children)` for `<></>`, backed by `document.createDocumentFragment()`
- SVG tags (`svg`, `path`, `circle`, ...) are routed to `document.createElementNS("http://www.w3.org/2000/svg", tag)`, with camelCase props such as `strokeWidth` written as kebab-case attributes and `viewBox`-style attributes kept verbatim

### Dynamic JSX import

`entry.js` also demonstrates a dynamic import of a JSX module:

```js
const mod = await import("./components/DynamicCard.jsx");
```

No assertion is involved. The component is loaded at runtime, not bundled statically. The bundler extracts the dependency and applies the same transpilation pipeline as static imports; the emitted chunk is written as `components/DynamicCard.js`.

## Notes

- The demo uses native ESM in the browser. Make sure your browser supports it.
- `demo/public/` is generated and ignored by git.