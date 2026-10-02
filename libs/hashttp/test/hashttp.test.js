/**
 * Unit tests for the pure helpers in src/hashttp.js.
 * Run with: node --test test/*.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "url";
import {
  renderTemplate,
  resolveModel,
  resolveTransform,
  applyTransform,
  renderEntry,
} from "../src/hashttp.js";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const ctx = { params: { name: "world" }, query: { lang: "id" }, pathname: "/x" };

test("renderTemplate substitutes known keys", () => {
  assert.equal(renderTemplate("<p>{{title}}</p>", { title: "Hi" }), "<p>Hi</p>");
});

test("renderTemplate tolerates spaces inside the placeholder", () => {
  assert.equal(renderTemplate("{{  title  }}", { title: "Hi" }), "Hi");
});

test("renderTemplate renders missing keys as an empty string", () => {
  assert.equal(renderTemplate("[{{nope}}]", {}), "[]");
});

test("renderTemplate replaces every occurrence", () => {
  assert.equal(renderTemplate("{{a}}-{{a}}", { a: "1" }), "1-1");
});

test("renderTemplate leaves content without placeholders untouched", () => {
  const content = "no placeholders here";
  assert.equal(renderTemplate(content, { title: "unused" }), content);
});

test("resolveModel returns a plain object unwrapped", async () => {
  const model = { title: "static" };
  assert.deepEqual(await resolveModel(model, ctx), model);
});

test("resolveModel invokes a factory with the request context", async () => {
  const model = await resolveModel((c) => ({ name: c.params.name }), ctx);
  assert.deepEqual(model, { name: "world" });
});

test("resolveModel awaits an async factory", async () => {
  const model = await resolveModel(async () => {
    return { lang: "en" };
  }, ctx);
  assert.deepEqual(model, { lang: "en" });
});

test("resolveModel turns a missing model into an empty object", async () => {
  assert.deepEqual(await resolveModel(undefined, ctx), {});
  assert.deepEqual(await resolveModel(null, ctx), {});
});

test("resolveTransform returns null when the entry has no transform", () => {
  assert.equal(resolveTransform(undefined, {}), null);
  assert.equal(resolveTransform(null, {}), null);
});

test("resolveTransform passes an inline function through", () => {
  const fn = () => "x";
  assert.equal(resolveTransform(fn, {}), fn);
});

test("resolveTransform looks up a name in the registry", () => {
  const fn = () => "x";
  assert.equal(resolveTransform("noop", { noop: fn }), fn);
});

test("resolveTransform throws for an unregistered name", () => {
  assert.throws(() => resolveTransform("missing", {}), /Unknown transform: "missing"/);
});

test("applyTransform returns the content untouched without a transform", async () => {
  const out = await applyTransform("body", { target: "a.html" }, ctx, {});
  assert.equal(out, "body");
});

test("applyTransform passes content, ctx and meta to the transform", async () => {
  let seen;
  await applyTransform(
    "body",
    { target: "public/style.css", transform: (content, c, meta) => {
      seen = { content, c, meta };
      return content;
    } },
    ctx,
    {}
  );
  assert.equal(seen.content, "body");
  assert.equal(seen.c, ctx);
  assert.deepEqual(seen.meta, {
    target: "public/style.css",
    ext: ".css",
    contentType: "text/css",
  });
});

test("applyTransform awaits an async transform", async () => {
  const out = await applyTransform(
    "body",
    {
      target: "a.html",
      transform: async () => {
        await new Promise((r) => setTimeout(r, 5));
        return "later";
      },
    },
    ctx,
    {}
  );
  assert.equal(out, "later");
});

test("applyTransform accepts a Buffer result", async () => {
  const out = await applyTransform("body", { target: "a.bin", transform: () => Buffer.from("bytes") }, ctx, {});
  assert.equal(Buffer.isBuffer(out), true);
  assert.equal(out.toString(), "bytes");
});

test("applyTransform rejects a result that is not a string or Buffer", async () => {
  await assert.rejects(
    applyTransform("body", { target: "a.html", transform: () => 42 }, ctx, {}),
    /must return a string or Buffer, got number/
  );
});

test("renderEntry reads a string target and renders it with empty data", async () => {
  const out = await renderEntry("public/index.html", ctx, fixturesDir);
  assert.match(out, /<h1><\/h1>/);
});

test("renderEntry substitutes the model", async () => {
  const out = await renderEntry(
    { target: "public/index.html", model: { title: "Articles" } },
    ctx,
    fixturesDir
  );
  assert.match(out, /<title>Articles<\/title>/);
});

test("renderEntry awaits an async model factory", async () => {
  const out = await renderEntry(
    { target: "public/index.html", model: async () => ({ title: "Async" }) },
    ctx,
    fixturesDir
  );
  assert.match(out, /<title>Async<\/title>/);
});

test("renderEntry applies a transform after the model is rendered", async () => {
  const out = await renderEntry(
    {
      target: "templates/chunk.html",
      model: { label: "x" },
      transform: (content) => content.trim().toUpperCase(),
    },
    ctx,
    fixturesDir
  );
  assert.equal(out, "<SPAN>X</SPAN>");
});

test("renderEntry gives a transform the request context", async () => {
  const out = await renderEntry(
    {
      target: "templates/chunk.html",
      model: { label: "x" },
      transform: (content, { params }) => content.replace("x", params.name),
    },
    ctx,
    fixturesDir
  );
  assert.match(out, /world/);
});

test("renderEntry surfaces an unknown transform name", async () => {
  await assert.rejects(
    renderEntry({ target: "templates/chunk.html", transform: "nope" }, ctx, fixturesDir),
    /Unknown transform: "nope"/
  );
});
