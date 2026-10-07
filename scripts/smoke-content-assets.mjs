import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

// Isolated public directory: never overwrite or remove real post assets.
const root = process.cwd();
await fs.access(path.join(root, ".next/BUILD_ID"));
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "portal-assets-http-"));
let server;
let output = "";
try {
  for (const name of [".next", "node_modules"]) {
    await fs.symlink(path.join(root, name), path.join(temporary, name), process.platform === "win32" ? "junction" : "dir");
  }
  for (const name of ["package.json", "next.config.ts", "tsconfig.json"]) {
    await fs.copyFile(path.join(root, name), path.join(temporary, name));
  }
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1cAAAAASUVORK5CYII=", "base64");
  await fs.mkdir(path.join(temporary, "public/posts/existing"), { recursive: true });
  await fs.writeFile(path.join(temporary, "public/posts/existing/cover.png"), png);
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", temporary, "--hostname", "127.0.0.1", "--port", String(port)], { cwd: temporary, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { clearInterval(poll); reject(new Error(output)); }, 30000);
    const poll = setInterval(() => {
      if (output.includes("Ready in")) { clearInterval(poll); clearTimeout(timeout); resolve(); }
      else if (server.exitCode !== null) { clearInterval(poll); clearTimeout(timeout); reject(new Error(output)); }
    }, 100);
  });
  const origin = `http://127.0.0.1:${port}`;
  assert.equal((await fetch(`${origin}/posts/existing/cover.png`)).status, 200);
  // Control: ordinary public files uploaded after startup still reproduce the original 404.
  await fs.writeFile(path.join(temporary, "public/startup-scan-control.png"), png);
  assert.equal((await fetch(`${origin}/startup-scan-control.png`)).status, 404);
  for (const collection of ["posts", "tools"]) {
    const relative = `${collection}/new-post/images/封面 图.png`;
    const url = `${origin}/${relative.split("/").map(encodeURIComponent).join("/")}`;
    const missing = await fetch(url);
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get("cache-control"), "no-store");
    const file = path.join(temporary, "public", relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, png);
    const uploaded = await fetch(url);
    assert.equal(uploaded.status, 200);
    assert.equal(uploaded.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await uploaded.arrayBuffer()), png);
    const replacement = Buffer.concat([png, Buffer.from("replacement")]);
    await fs.writeFile(file, replacement);
    assert.deepEqual(Buffer.from(await (await fetch(url)).arrayBuffer()), replacement);
    const head = await fetch(url, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), String(replacement.length));
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
  console.log("PASS: existing images and post-start uploads/replacements for posts/tools, encoded paths, missing-file cache, HEAD; same production process, no restart.");
} finally {
  if (server && server.exitCode === null) {
    const stopped = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await stopped;
  }
  // temporary is the exact directory returned by mkdtemp above.
  await fs.rm(temporary, { recursive: true, force: true });
}
