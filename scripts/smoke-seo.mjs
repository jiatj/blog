import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import matter from "gray-matter";

// Use the production build with isolated content; never write into the author's content directories.
const root = process.cwd();
await fs.access(path.join(root, ".next/BUILD_ID"));
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "portal-seo-http-"));
const env = { ...process.env, COURSE_CONTENT_DIR: path.join(temporary, "courses"), BUILD_CONTENT_DIR: path.join(temporary, "build"), PORTAL_DATA_DIR: path.join(temporary, "runtime") };
const canonical = "https://www.tiejunjia.com";
let server;
let output = "";
try {
  for (const directory of [".next", "node_modules", "public"]) {
    await fs.symlink(path.join(root, directory), path.join(temporary, directory), process.platform === "win32" ? "junction" : "dir");
  }
  for (const file of ["package.json", "next.config.ts", "tsconfig.json"]) await fs.copyFile(path.join(root, file), path.join(temporary, file));
  const write = async (collection, locale, slug, fields = {}) => {
    const directory = path.join(temporary, "content", collection, locale);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, `${slug}.mdx`), matter.stringify("A real test body.", {
      title: `SEO ${slug}`, slug, summary: "Isolated SEO fixture", locale, draft: false,
      ...(collection === "posts" ? { date: "2026-09-01", updated: "2026-10-01", tags: ["AI Coding"] } : {}), ...fields
    }));
  };
  for (const locale of ["zh", "en"]) {
    await write("posts", locale, "paired", { seoTitle: "Independent search title", cover: "/contact/gongzhonghao256.png" });
    await write("tools", locale, "paired-tool");
  }
  const hostileTitle = "Safe </script><script>alert(1)</script> title";
  await write("posts", "zh", "zh-only", { title: hostileTitle, updated: "invalid-date" });
  await write("posts", "en", "zh-only", { draft: true });
  await write("posts", "zh", "hidden-draft", { draft: true });
  await write("tools", "zh", "zh-only-tool");
  await fs.cp(path.join(root, "examples/build"), env.BUILD_CONTENT_DIR, { recursive: true });
  const publish = spawnSync(process.execPath, [path.join(root, "scripts/course.mjs"), "publish", path.join(root, "examples/courses/starter")], { cwd: root, env, windowsHide: true, encoding: "utf8" });
  assert.equal(publish.status, 0, publish.stderr || publish.stdout);
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: temporary, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
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
  const read = async (url) => {
    const response = await fetch(origin + url, { headers: { "User-Agent": "Googlebot" } });
    assert.equal(response.status, 200, `${url}\n${output}`);
    return response.text();
  };
  const schemas = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));
  const home = await read("/zh");
  assert.match(home, /<title>AI 应用开发、AI Coding 与项目实战 \| AI Builder Lab<\/title>/);
  assert.match(home, /property="og:type" content="website"/);
  assert.match(home, /hrefLang="en" href="https:\/\/www\.tiejunjia\.com\/en"/);
  assert.equal(schemas(home)[0]["@type"], "WebSite");
  assert.match(home, /926416f5c40e7214d27178212a62edbd/);
  const english = await read("/en");
  assert.match(english, /property="og:locale" content="en_US"/);
  const post = await read("/zh/blog/paired");
  assert.match(post, /<title>Independent search title \| AI Builder Lab<\/title>/);
  assert.match(post, /property="og:type" content="article"/);
  assert.match(post, /https:\/\/www\.tiejunjia\.com\/contact\/gongzhonghao256.png/);
  assert.match(post, /hrefLang="en" href="https:\/\/www\.tiejunjia\.com\/en\/blog\/paired"/);
  assert.equal(schemas(post)[0].dateModified, "2026-10-01T00:00:00.000Z");
  assert.equal(schemas(post)[0].author.name, "贾铁军");
  assert.match(post, /href="\/zh\/blog\/zh-only"/);
  const single = await read("/zh/blog/zh-only");
  assert.doesNotMatch(single, /hrefLang="en"/);
  assert.doesNotMatch(single, /<script>alert\(1\)<\/script>/);
  assert.equal(schemas(single)[0].headline, hostileTitle);
  assert.equal(schemas(single)[0].dateModified, undefined);
  assert.equal((await fetch(origin + "/en/blog/zh-only")).status, 404);
  const project = await read("/zh/tools/paired-tool");
  assert.equal(schemas(project)[0]["@type"], "SoftwareApplication");
  assert.match(project, /property="og:type" content="website"/);
  assert.doesNotMatch(await read("/zh/tools/zh-only-tool"), /hrefLang="en"/);
  const about = await read("/zh/about");
  assert.equal(schemas(about)[0].mainEntity["@type"], "Person");
  assert.doesNotMatch(about, /example\.com/);
  assert.equal(schemas(await read("/zh/courses/starter"))[0]["@type"], "Course");
  assert.doesNotMatch(await read("/zh/courses/starter/start"), /hrefLang="en"/);
  const buildPath = "/zh/build/desktop-ai-employee/logs/define-v1";
  assert.equal(schemas(await read(buildPath))[0]["@type"], "BlogPosting");
  const sitemap = await read("/sitemap.xml");
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(locations).size, locations.length);
  assert.ok(locations.every((url) => url.startsWith(canonical + "/")));
  assert.ok(locations.includes(canonical + "/zh/blog/zh-only"));
  assert.ok(locations.includes(canonical + "/zh/courses/starter/start"));
  assert.doesNotMatch(sitemap, /hidden-draft|\/en\/blog\/zh-only|\/en\/courses|\/en\/ai-builder-lab|Invalid Date|private-draft/);
  assert.match(sitemap, /2026-10-01T00:00:00.000Z/);
  assert.equal(sitemap, await read("/sitemap.xml"), "Sitemap dates must be stable between requests");
  const robots = await read("/robots.txt");
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Disallow: \/api\//);
  assert.ok(robots.includes(`Sitemap: ${canonical}/sitemap.xml`));
  // Native HTTP preserves Host exactly; fetch may replace this restricted header.
  const redirect = await new Promise((resolve, reject) => {
    const request = http.get(origin + "/zh/blog/paired?from=seo", { headers: { Host: "tiejunjia.com" } }, (response) => { response.resume(); resolve(response); });
    request.on("error", reject);
  });
  assert.equal(redirect.statusCode, 308);
  assert.equal(redirect.headers.location, canonical + "/zh/blog/paired?from=seo");
  const image = await fetch(origin + "/og");
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type"), /image\/png/);
  const png = Buffer.from(await image.arrayBuffer());
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  // New translations become visible in metadata and sitemap without rebuilding or restarting.
  await write("posts", "en", "zh-only");
  assert.match(await read("/zh/blog/zh-only"), /hrefLang="en"/);
  assert.match(await read("/sitemap.xml"), /\/en\/blog\/zh-only/);
  console.log("PASS: production metadata, canonical domain, real-language hreflang, dates, draft exclusion, JSON-LD escaping, author/course/project schemas, internal links, robots, 308 redirect, 1200x630 sharing image, and live translation publication. Isolated content only.");
} finally {
  if (server && server.exitCode === null) { const stopped = new Promise((resolve) => server.once("exit", resolve)); server.kill(); await stopped; }
  // Unlink only our junctions before removing the verified temporary directory.
  for (const directory of [".next", "node_modules", "public"]) await fs.unlink(path.join(temporary, directory)).catch((error) => { if (error.code !== "ENOENT") throw error; });
  const resolved = path.resolve(temporary);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("portal-seo-http-"));
  await fs.rm(resolved, { recursive: true, force: true });
}
