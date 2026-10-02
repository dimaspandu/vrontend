import path from "path";
import { fileURLToPath } from "url";
import { createServerFromRoutes } from "../src/hashttp.js";

const demoDir = path.dirname(fileURLToPath(import.meta.url));

const news = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras elementum neque quis scelerisque laoreet. Cras sollicitudin elit eu vulputate vehicula.",
  "Fusce pulvinar pulvinar elit vel egestas. Suspendisse potenti. Morbi quis dolor erat. Morbi nec turpis quis justo faucibus fringilla. Maecenas porta ante at orci varius sodales.",
];

// Transforms receive `(content, ctx, meta)`: the file content after `{{ key }}`
// substitution, the request context, and info about the source file. Each one
// returns the content that is actually sent, so the file on disk is never
// modified. Transforms are registered here and referenced by name in `routes`,
// which keeps the route map flat. They may be async and may read `ctx.params`
// or `ctx.query`, just like a `model` factory.
const transforms = {
  // Reformat the raw JSON file with indentation. The demo page fetches this
  // file and re-serializes it in the browser, so only the bytes on the wire
  // change, not what the page shows.
  "pretty-json": (content) => JSON.stringify(JSON.parse(content), null, 2),

  // Strip comments and collapse the formatting of the original CSS file.
  // Deliberately naive, just enough to show the idea.
  "minify-css": (content) =>
    content
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s*([{}:;,])\s*/g, "$1")
      .replace(/;}/g, "}")
      .replace(/\s+/g, " ")
      .trim(),

  // Turn an HTML chunk into a plain-text greeting. Shows an async transform
  // that uses route params, plus a `type` override so the `.html` target is
  // served as text.
  "greet-plain-text": async (content, { params }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `Hello, ${params.name}!\n\n${text}\n`;
  },
};

const routes = {
  "/": "public/index.html",
  "/articles": {
    target: "public/articles/index.html",
    model: { title: "Articles" },
  },
  "/articles/:slug": {
    target: "public/articles/[slug].html",
    // `model` can be a plain object or a factory that receives the request context.
    model: ({ params }) => ({
      slug: params.slug,
      title: params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }),
  },
  "/composed": [
    {
      target: "public/header.html",
      model: { title: "Hello, World!" },
    },
    "public/greetings.html",
    ...news.map(item => ({
      target: "public/section-item.html",
      model: {
        content: `<p>${item}</p>`
      },
    })),
    {
      target: "public/footer.html",
      model: { year: new Date().getFullYear() },
    },
  ],
  // Streaming mode: chunks are written sequentially (Transfer-Encoding: chunked)
  // instead of being joined into one full response first. Each chunk may carry
  // its own `delay` (ms) applied before it is written, for demonstration. The
  // first chunk has no delay so the response starts immediately.
  "/composed-stream": {
    stream: true,
    chunks: [
      {
        target: "public/header.html",
        model: { title: "Streaming" },
      },
      {
        target: "public/greetings.html",
        delay: 1000,
      },
      {
        target: "public/footer.html",
        model: { year: new Date().getFullYear() },
        delay: 2000,
      },
    ],
  },
  // Streaming mode with async model factories: each chunk's async work runs
  // sequentially (the for-loop awaits each chunk before the next one starts).
  // Hit this route and watch the server console: the log timestamps prove that
  // chunk N only begins after chunk N-1 has finished.
  "/streaming-async": {
    stream: true,
    chunks: [
      {
        target: "public/header.html",
        model: async () => {
          const t = Date.now();
          console.log(`[stream] chunk 0 start @ ${t}`);
          return { title: "Streaming Async" };
        },
      },
      {
        target: "public/greetings.html",
        delay: 500,
        model: async () => {
          const t = Date.now();
          console.log(`[stream] chunk 1 start @ ${t}`);
          await new Promise((r) => setTimeout(r, 1000));
          return { greeting: "Fetched after 1s" };
        },
      },
      {
        target: "public/footer.html",
        delay: 500,
        model: async () => {
          const t = Date.now();
          console.log(`[stream] chunk 2 start @ ${t}`);
          await new Promise((r) => setTimeout(r, 1500));
          return { year: new Date().getFullYear() };
        },
      },
    ],
  },
  // Async route callback: fetch data before resolving target/model
  "/async-fetch/:id": async ({ params }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${params.id}`);
    const todo = await res.json();
    return {
      target: "public/todo.html",
      model: { title: `Todo #${todo.id}`, completed: todo.completed ? "Yes" : "No" },
    };
  },
  // Route value as a factory/callback: invoked with the request context
  // ({ params, query, pathname }) and must return the real route shape
  // (string, object, or composed). Useful for deriving the target or model
  // at request time.
  "/factory/:name": ({ params, query }) => ({
    target: "public/factory.html",
    model: {
      name: params.name,
      lang: query.lang || "en",
    },
  }),

  // `transform` rewrites the file content on its way out. The target is read
  // and rendered as usual; only then does the transform get to change it.
  //
  // `/data.json` is also a real file in demo/public, so this route only wins
  // because the server is started with `precedence: "routes"` below. Without
  // that option the static file would be served untouched.
  "/data.json": {
    target: "public/data.json",
    transform: "pretty-json",
  },
  // Serve the same stylesheet under a new name, minified on the fly.
  "/style.min.css": {
    target: "public/style.css",
    transform: "minify-css",
    type: "text/css",
  },
  // Serve an HTML chunk as plain text, with the name taken from the route.
  // Note the route is `/hello/:name` and not `/hello/:name.txt`: a segment
  // starting with `:` is a parameter, so `:name.txt` would be captured under
  // the parameter name "name.txt". The `.txt` behaviour comes from `type`.
  "/hello/:name": {
    target: "public/greetings.html",
    transform: "greet-plain-text",
    type: "text/plain; charset=utf-8",
  },
};

createServerFromRoutes(routes, {
  baseDir: demoDir,
  fallback: "custom-404.html",
  // Consult the route table before the static folder, so a route can transform
  // a file that also exists in demo/public. The static folder still runs second,
  // so `/style.css` and every other existing file keep working.
  precedence: "routes",
  transforms,
});
