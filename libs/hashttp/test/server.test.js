/**
 * Integration tests for createServerFromRoutes. Each test boots the engine on
 * an ephemeral port, makes a real request against it, and shuts it down again.
 * Run with: node --test test/*.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "url";
import { createServerFromRoutes } from "../src/hashttp.js";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

const transforms = {
  "pretty-json": (content) => JSON.stringify(JSON.parse(content), null, 2),
  "shout": (content) => content.trim().toUpperCase(),
  "boom": () => {
    throw new Error("transform exploded");
  },
};

const routes = {
  "/": "public/index.html",
  "/articles": { target: "public/index.html", model: { title: "Articles" } },
  "/greet/:name": {
    target: "templates/chunk.html",
    model: ({ params }) => ({ label: params.name }),
    transform: "shout",
  },
  "/composed": [
    { target: "templates/head.html", model: {} },
    { target: "templates/tail.html", model: {} },
  ],
  "/streamed": {
    stream: true,
    chunks: [
      { target: "templates/head.html" },
      { target: "templates/tail.html" },
    ],
  },
  // A route for a path that is also a real file in publicDir. This only wins
  // when the server is started with precedence: "routes".
  "/data.json": { target: "public/data.json", transform: "pretty-json" },
  "/text": {
    target: "public/index.html",
    transform: () => "plain body",
    type: "text/plain; charset=utf-8",
    headers: { "X-Fixture": "yes" },
  },
  "/broken": { target: "templates/chunk.html", transform: "boom" },
  "/unknown-transform": { target: "templates/chunk.html", transform: "nope" },
};

// Boot the engine on a free port and hand the caller both handles.
const startServer = (options = {}) =>
  new Promise((resolve) => {
    const server = createServerFromRoutes(routes, {
      baseDir: fixturesDir,
      port: 0,
      host: "127.0.0.1",
      transforms,
      ...options,
    });
    const done = () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    if (server.listening) done();
    else server.once("listening", done);
  });

const boot = async (t, options) => {
  const { server, base } = await startServer(options);
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  return base;
};

test("serves a static file when no route claims the path", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/style.css`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/css");
  assert.match(await res.text(), /color: #111;/);
});

test("a route is used when the static folder has no such file", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/articles`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<title>Articles<\/title>/);
});

test("static wins by default over a route for the same path", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/data.json`);
  const body = await res.text();
  assert.equal(body.trim().split("\n").length, 1, "expected the untouched one-line file");
});

test("precedence 'routes' lets a route take over a static path", async (t) => {
  const base = await boot(t, { precedence: "routes" });
  const res = await fetch(`${base}/data.json`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /\n {2}"message"/, "expected the pretty-printed body");
});

test("precedence 'routes' still falls back to the static folder", async (t) => {
  const base = await boot(t, { precedence: "routes" });
  const res = await fetch(`${base}/style.css`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/css");
});

test("unknown paths fall through to the 404 file", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
  assert.match(await res.text(), /Not found/);
});

test("a transform rewrites the served content", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/greet/world`);
  const body = await res.text();
  assert.equal(body, "<SPAN>WORLD</SPAN>");
});

test("type and headers overrides reach the response head", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/text`);
  assert.equal(res.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(res.headers.get("x-fixture"), "yes");
  assert.equal(await res.text(), "plain body");
});

test("a composed route is joined in order", async (t) => {
  const base = await boot(t);
  const body = await (await fetch(`${base}/composed`)).text();
  assert.match(body, /First chunk[\s\S]*Second chunk/);
});

test("a streaming route writes its chunks in order", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/streamed`);
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.match(body, /First chunk[\s\S]*Second chunk/);
});

test("a throwing transform answers with 500", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/broken`);
  assert.equal(res.status, 500);
});

test("an unregistered transform name answers with 500", async (t) => {
  const base = await boot(t);
  const res = await fetch(`${base}/unknown-transform`);
  assert.equal(res.status, 500);
});
