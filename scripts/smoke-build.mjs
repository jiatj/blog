import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { spawn } from "node:child_process";

const root = process.cwd();
await fs.access(path.join(root, ".next/BUILD_ID"));
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "portal-build-http-"));
const content = path.join(temporary, "build");
await fs.mkdir(content);
let server; let output = "";
try {
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BUILD_CONTENT_DIR: content, COURSE_CONTENT_DIR: path.join(temporary, "courses"), PORTAL_DATA_DIR: path.join(temporary, "runtime") }
  });
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
  const html = async (url) => { const response = await fetch(origin + url); assert.equal(response.status, 200, url); return response.text(); };
  assert.match(await html("/zh/build"), /还没有公开的作品/);
  // Publish after the same production process has already started.
  await fs.cp(path.join(root, "examples/build"), content, { recursive: true });
  for (const locale of ["zh", "en"]) {
    const listing = await html(`/${locale}/build`);
    assert.match(listing, /desktop-ai-employee/);
    const detail = await html(`/${locale}/build/desktop-ai-employee`);
    assert.match(detail, /<progress value="25"/);
    assert.doesNotMatch(detail, /private-draft|private.txt/);
    const log = await html(`/${locale}/build/desktop-ai-employee/logs/define-v1`);
    assert.match(log, /spec-v1.txt/);
    assert.equal((await fetch(`${origin}/${locale}/build/desktop-ai-employee/logs/private-draft`)).status, 404);
    assert.equal((await fetch(`${origin}/${locale}/build/not-found`)).status, 404);
  }
  assert.doesNotMatch(await html("/sitemap.xml"), /private-draft/);
  assert.match(await html("/sitemap.xml"), /\/zh\/build\/desktop-ai-employee\/logs\/define-v1/);
  const file = path.join(content, "zh/desktop-ai-employee/artifact.json");
  const a = JSON.parse(await fs.readFile(file, "utf8"));
  a.title = "HTTP verified title";
  a.logs[0].outputs.push({ label: "中文输出", href: "outputs/中文 输出.txt" });
  await fs.writeFile(file, JSON.stringify(a));
  assert.match(await html("/zh/build"), /HTTP verified title/);
  const assetUrl = `${origin}/build-assets/zh/desktop-ai-employee/outputs/${encodeURIComponent("中文 输出.txt")}`;
  const missing = await fetch(assetUrl);
  assert.equal(missing.status, 404); assert.equal(missing.headers.get("cache-control"), "no-store");
  await fs.writeFile(path.join(content, "zh/desktop-ai-employee/outputs/中文 输出.txt"), "uploaded after startup");
  const uploaded = await fetch(assetUrl);
  assert.equal(uploaded.status, 200); assert.match(uploaded.headers.get("content-disposition"), /attachment; filename\*=UTF-8/);
  assert.equal(await uploaded.text(), "uploaded after startup");
  await fs.writeFile(path.join(content, "zh/desktop-ai-employee/outputs/中文 输出.txt"), "replaced after startup");
  assert.equal(await (await fetch(assetUrl)).text(), "replaced after startup");
  assert.equal((await fetch(`${origin}/build-assets/zh/desktop-ai-employee/outputs/private.txt`)).status, 404);
  assert.equal((await fetch(`${origin}/build-assets/zh/desktop-ai-employee/artifact.json`)).status, 404);
  a.publishState = "draft"; await fs.writeFile(file, JSON.stringify(a));
  assert.doesNotMatch(await html("/zh/build"), /HTTP verified title/);
  assert.equal((await fetch(`${origin}/zh/build/desktop-ai-employee`)).status, 404);
  assert.equal((await fetch(assetUrl)).status, 404);
  // Existing routes still resolve after moving their navigation entries.
  await html("/zh"); await html("/zh/tools"); await html("/zh/about"); await html("/zh/blog"); await html("/zh/courses");
  console.log("PASS: production Build zh/en pages, empty state, draft 404s, sitemap, post-start publish/update, output upload/replace, encoded downloads, existing routes; isolated content, same process.");
} finally {
  if (server && server.exitCode === null) { const stopped = new Promise((resolve) => server.once("exit", resolve)); server.kill(); await stopped; }
  // Exact mkdtemp result only; no user content is removed.
  await fs.rm(temporary, { recursive: true, force: true });
}
