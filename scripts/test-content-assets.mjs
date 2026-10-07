import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { GET } from "../app/api/content-assets/[collection]/[...asset]/route.ts";

test("content images are read on demand within their public collection", async (t) => {
  const original = process.cwd();
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "portal-assets-"));
  process.chdir(temporary);
  t.after(async () => {
    process.chdir(original);
    await fs.rm(temporary, { recursive: true, force: true });
  });
  const read = (collection, asset) => GET(new Request("http://localhost/"), {
    params: Promise.resolve({ collection, asset })
  });

  for (const collection of ["posts", "tools"]) {
    const asset = ["new-post", "images", "封面 图.png"];
    const target = path.join(temporary, "public", collection, ...asset);
    const missing = await read(collection, asset);
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get("cache-control"), "no-store");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "first image");
    const first = await read(collection, asset);
    assert.equal(first.status, 200);
    assert.equal(first.headers.get("content-type"), "image/png");
    assert.equal(first.headers.get("cache-control"), "no-store");
    assert.equal(await first.text(), "first image");
    await fs.writeFile(target, "replacement");
    assert.equal(await (await read(collection, asset)).text(), "replacement");
  }

  await fs.writeFile(path.join(temporary, "private.png"), "private");
  for (const [collection, asset] of [
    ["other", ["new-post", "cover.png"]],
    ["posts", ["..", "..", "private.png"]],
    ["posts", ["new-post", "..\\..\\private.png"]],
    ["posts", ["new-post", "C:private.png"]],
    ["posts", ["new-post", "cover.png\0"]],
    ["posts", ["new-post", ".hidden.png"]],
    ["posts", ["new-post", "index.html"]]
  ]) assert.equal((await read(collection, asset)).status, 404);

  const outside = path.join(temporary, "outside");
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, "private.png"), "private");
  await fs.symlink(outside, path.join(temporary, "public/posts/linked"), process.platform === "win32" ? "junction" : "dir");
  assert.equal((await read("posts", ["linked", "private.png"])).status, 404);
});
