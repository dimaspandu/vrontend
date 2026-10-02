/**
 * Tests for createStaticFromRoutes, which writes generated pages to a real
 * (temporary) output directory so the files can be read back and asserted on.
 * Run with: node --test test/*.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { createStaticFromRoutes } from "../src/hashttp.js";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

const transforms = {
  "shout": (content) => content.trim().toUpperCase(),
};

const routes = {
  "/": "public/index.html",
  "/articles": { target: "public/index.html", model: { title: "Articles" } },
  "/articles/:slug": {
    target: "public/index.html",
    model: ({ params }) => ({ title: params.slug }),
  },
  "/composed": [
    { target: "templates/head.html" },
    { target: "templates/tail.html" },
  ],
  "/streamed": {
    stream: true,
    chunks: [
      { target: "templates/head.html" },
      { target: "templates/tail.html" },
    ],
  },
  "/factory/:name": ({ params }) => ({
    target: "public/index.html",
    model: { title: `from-${params.name}` },
  }),
  "/async-factory": async () => {
    await new Promise((r) => setTimeout(r, 5));
    return { target: "public/index.html", model: { title: "Awaited" } };
  },
  "/shouted": {
    target: "templates/chunk.html",
    model: { label: "x" },
    transform: "shout",
  },
  "/broken-value": 42,
};

const build = async (paths, options = {}) => {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "hashttp-test-"));
  const result = await createStaticFromRoutes(routes, paths, {
    baseDir: fixturesDir,
    outputDir,
    transforms,
    ...options,
  });
  return { ...result, outputDir };
};

test("writes a string target as-is with an empty model", async (t) => {
  const { outputDir } = await build(["/"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  assert.match(out, /<h1><\/h1>/);
});

test("renders a model into the generated file", async (t) => {
  const { outputDir } = await build(["/articles"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "articles.html"), "utf8");
  assert.match(out, /<title>Articles<\/title>/);
});

test("maps nested url paths to nested output files", async (t) => {
  const { generated, outputDir } = await build(["/articles/hello-world"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  assert.equal(generated.length, 1);
  const out = await fs.readFile(
    path.join(outputDir, "articles", "hello-world.html"),
    "utf8"
  );
  assert.match(out, /<title>hello-world<\/title>/);
});

test("concatenates composed chunks", async (t) => {
  const { outputDir } = await build(["/composed"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "composed.html"), "utf8");
  assert.match(out, /First chunk[\s\S]*Second chunk/);
});

test("flattens a streaming route into one file", async (t) => {
  const { outputDir } = await build(["/streamed"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "streamed.html"), "utf8");
  assert.match(out, /First chunk[\s\S]*Second chunk/);
});

test("resolves a factory route value", async (t) => {
  const { outputDir } = await build(["/factory/demo"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "factory", "demo.html"), "utf8");
  assert.match(out, /<title>from-demo<\/title>/);
});

test("awaits an async factory route value", async (t) => {
  const { outputDir } = await build(["/async-factory"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "async-factory.html"), "utf8");
  assert.match(out, /<title>Awaited<\/title>/, "the factory promise was not awaited");
});

test("applies a transform to the generated file", async (t) => {
  const { outputDir } = await build(["/shouted"]);
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "shouted.html"), "utf8");
  assert.equal(out, "<SPAN>X</SPAN>");
});

test("honours a custom output extension", async (t) => {
  const { outputDir } = await build(["/shouted"], { extension: ".txt" });
  t.after(() => fs.rm(outputDir, { recursive: true, force: true }));
  const out = await fs.readFile(path.join(outputDir, "shouted.txt"), "utf8");
  assert.equal(out, "<SPAN>X</SPAN>");
});

test("reports an unmatched path as an error", async () => {
  const { generated, errors } = await build(["/nope"]);
  assert.equal(generated.length, 0);
  assert.match(errors[0], /No route match for "\/nope"/);
});

test("reports an unresolvable route value as an error", async () => {
  const { generated, errors } = await build(["/broken-value"]);
  assert.equal(generated.length, 0);
  assert.match(errors[0], /Unresolved route value/);
});
