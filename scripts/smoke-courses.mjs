// Integration check against an already-running LOCAL production server.
// Creates and removes only a uniquely named test course in COURSE_CONTENT_DIR.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import {
  courseRoot,
  publishCourse,
  rollbackCourse,
} from "../lib/courses/store.ts";

const origin = new URL(process.argv[2] || "http://localhost:3100");
assert(
  ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname),
  "仅对本机测试服务运行",
);
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), "portal-course-http-"),
);
const slug = `smoke-${crypto.randomBytes(8).toString("hex")}`;
const ownedStore = path.join(courseRoot(), slug);
assert(!(await fs.stat(ownedStore).catch(() => null)), "测试目录必须尚不存在");
const request = (route, options) => fetch(new URL(route, origin), options);

try {
  const source = path.join(temporary, "incoming");
  await fs.cp(path.resolve("examples/courses/starter"), source, {
    recursive: true,
  });
  const configPath = path.join(source, "course.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  config.slug = slug;
  config.title = "HTTP发布验收-第一版";
  await fs.writeFile(configPath, JSON.stringify(config));
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n1cAAAAASUVORK5CYII=",
    "base64",
  );
  await fs.writeFile(path.join(source, "assets/中文图片.png"), pixel);
  await fs.appendFile(
    path.join(source, "lessons/01.开始.md"),
    "\n![图片](../assets/中文图片.png)\n",
  );
  const first = await publishCourse(source);
  const url = `/zh/courses/${slug}`;
  const response = await request(url);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /HTTP发布验收-第一版/);
  assert.match(response.headers.get("cache-control") || "", /no-store|private/);
  assert.match(
    await (await request("/zh/courses")).text(),
    /HTTP发布验收-第一版/,
  );
  const page = await request(`${url}/define-problem`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<table>/);
  assert.match(
    await (await request("/sitemap.xml")).text(),
    new RegExp(`${slug}/define-problem`),
  );
  const download = await request(
    `/course-assets/${slug}/${first.revision}/assets/${encodeURIComponent("问题描述模板.txt")}`,
  );
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /^attachment;/);
  assert.match(await download.text(), /使用者/);
  const image = await request(
    `/course-assets/${slug}/${first.revision}/assets/${encodeURIComponent("中文图片.png")}`,
  );
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), pixel);
  assert.equal(
    (await request(`/course-assets/${slug}/${first.revision}/course.json`))
      .status,
    404,
  );
  const english = await request(`/en/courses/${slug}`, { redirect: "manual" });
  assert.equal(english.status, 307);
  assert.equal(english.headers.get("location"), url);
  config.title = "HTTP发布验收-第二版";
  await fs.writeFile(configPath, JSON.stringify(config));
  await publishCourse(source);
  assert.match(await (await request(url)).text(), /HTTP发布验收-第二版/);
  await fs.appendFile(
    path.join(source, "lessons/01.开始.md"),
    "\n[坏链接](./不存在.md)\n",
  );
  await assert.rejects(publishCourse(source), /未登记/);
  assert.match(await (await request(url)).text(), /HTTP发布验收-第二版/);
  await rollbackCourse(slug);
  assert.match(await (await request(url)).text(), /HTTP发布验收-第一版/);
  await fs.copyFile(
    path.resolve("examples/courses/starter/lessons/01.开始.md"),
    path.join(source, "lessons/01.开始.md"),
  );
  config.status = "draft";
  await fs.writeFile(configPath, JSON.stringify(config));
  await publishCourse(source);
  assert.equal((await request(url)).status, 404);
  assert(!(await (await request("/sitemap.xml")).text()).includes(slug));
  assert.equal(
    (
      await request(
        `/course-assets/${slug}/${first.revision}/assets/${encodeURIComponent("中文图片.png")}`,
      )
    ).status,
    404,
  );
  console.log(
    "PASS: 新增、更新、失败保留、回退、下架、中文图片、下载、站点地图、英文跳转；服务全程未重启。",
  );
} finally {
  // Both are absolute directories uniquely created by this test, never user courses.
  await fs.rm(temporary, { recursive: true, force: true });
  await fs.rm(ownedStore, { recursive: true, force: true });
}
