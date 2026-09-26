import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { prepareCourse } from "../lib/courses/package.ts";
import {
  publishCourse,
  rollbackCourse,
  readCourse,
  listCourses,
  readCourseAsset,
  courseSequence,
} from "../lib/courses/store.ts";

const example = path.resolve("examples/courses/starter");
const revision = "0000000000000-000000000000";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "portal-course-test-"));
  const source = path.join(root, "incoming");
  const store = path.join(root, "published");
  await fs.cp(example, source, { recursive: true });
  // Only remove this test's own newly-created absolute temporary directory.
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const config = JSON.parse(
    await fs.readFile(path.join(source, "course.json"), "utf8"),
  );
  const save = () =>
    fs.writeFile(path.join(source, "course.json"), JSON.stringify(config));
  const body = (slug) =>
    path.join(source, config.pages.find((page) => page.slug === slug).source);
  return { root, source, store, config, save, body };
}

test("示例完整校验：GFM、中文源文件、锚点、下载链接", async (t) => {
  const f = await fixture(t);
  const { course, assets } = await prepareCourse(f.source, revision);
  assert.equal(course.pages.length, 3);
  const lesson = course.pages.find((page) => page.slug === "define-problem");
  assert.match(lesson.html, /<table>/);
  assert.match(lesson.html, /\/zh\/courses\/starter\/checklist#/);
  assert.match(lesson.html, /\/course-assets\/starter\//);
  assert(assets.has("assets/问题描述模板.txt"));
  assert.equal(
    courseSequence(course)
      .map((page) => page.slug)
      .join(","),
    "start,define-problem",
  );
});

test("重复 slug、重复文件、目录重复、起始草稿、无效日期被拒绝", async (t) => {
  const f = await fixture(t);
  const original = structuredClone(f.config);
  for (const [change, expected] of [
    [(c) => (c.pages[1].slug = c.pages[0].slug), /重复页面/],
    [(c) => (c.pages[1].source = c.pages[0].source), /源文件重复/],
    [(c) => c.groups[0].lessons.push("define-problem"), /重复进入目录/],
    [(c) => (c.pages[0].status = "draft"), /起始页/],
    [(c) => (c.pages[0].updated = "2026-02-30"), /有效 YYYY-MM-DD/],
  ]) {
    const config = structuredClone(original);
    change(config);
    await fs.writeFile(
      path.join(f.source, "course.json"),
      JSON.stringify(config),
    );
    await assert.rejects(prepareCourse(f.source, revision), expected);
  }
});

test("失败更新保留当前课程、资源和版本；完整更新可回退", async (t) => {
  const f = await fixture(t);
  const first = await publishCourse(f.source, f.store);
  const asset = await readCourseAsset(
    "starter",
    first.revision,
    ["assets", "问题描述模板.txt"],
    f.store,
  );
  const assetBytes = await fs.readFile(asset.path);
  await fs.appendFile(
    f.body("define-problem"),
    "\n[缺失附件](../assets/missing.pdf)\n",
  );
  await assert.rejects(publishCourse(f.source, f.store), /ENOENT/);
  assert.equal((await readCourse("starter", f.store)).revision, first.revision);
  assert.deepEqual(
    await fs.readFile(
      (
        await readCourseAsset(
          "starter",
          first.revision,
          ["assets", "问题描述模板.txt"],
          f.store,
        )
      ).path,
    ),
    assetBytes,
  );
  await fs.copyFile(
    path.join(example, "lessons/02.描述问题.md"),
    f.body("define-problem"),
  );
  f.config.title = "修改后的课程";
  await f.save();
  const second = await publishCourse(f.source, f.store);
  assert.notEqual(second.revision, first.revision);
  assert.equal((await readCourse("starter", f.store)).title, "修改后的课程");
  assert.equal(
    (await rollbackCourse("starter", f.store)).revision,
    first.revision,
  );
  assert.equal((await readCourse("starter", f.store)).title, first.title);
});

test("两门课程的同名页面与资源独立，排序由 order 决定", async (t) => {
  const f = await fixture(t);
  const first = await publishCourse(f.source, f.store);
  f.config.slug = "second-course";
  f.config.order = 1;
  await f.save();
  await fs.writeFile(
    path.join(f.source, "assets/问题描述模板.txt"),
    "另一门课程",
  );
  const second = await publishCourse(f.source, f.store);
  assert.deepEqual(
    (await listCourses(f.store)).map((c) => c.slug),
    ["second-course", "starter"],
  );
  const a = await readCourseAsset(
    first.slug,
    first.revision,
    ["assets", "问题描述模板.txt"],
    f.store,
  );
  const b = await readCourseAsset(
    second.slug,
    second.revision,
    ["assets", "问题描述模板.txt"],
    f.store,
  );
  assert.notDeepEqual(await fs.readFile(a.path), await fs.readFile(b.path));
});

test("草稿正文与资源不进入发布版本，整课下架后不可读取", async (t) => {
  const f = await fixture(t);
  f.config.pages.push({
    slug: "private-note",
    title: "草稿",
    kind: "reference",
    source: "lessons/草稿.md",
    status: "draft",
    updated: "2026-09-14",
  });
  await fs.writeFile(
    path.join(f.source, "lessons/草稿.md"),
    "## 草稿\n\nPRIVATE-SENTINEL\n[附件](../assets/草稿.txt)",
  );
  await fs.writeFile(path.join(f.source, "assets/草稿.txt"), "PRIVATE-ASSET");
  await f.save();
  const course = await publishCourse(f.source, f.store);
  assert(!course.pages.some((page) => page.slug === "private-note"));
  assert(!course.assets.includes("assets/草稿.txt"));
  assert.equal(
    await readCourseAsset(
      "starter",
      course.revision,
      ["assets", "草稿.txt"],
      f.store,
    ),
    null,
  );
  assert(!JSON.stringify(course).includes("PRIVATE-SENTINEL"));
  f.config.status = "draft";
  await f.save();
  await publishCourse(f.source, f.store);
  assert.equal(await readCourse("starter", f.store), null);
  assert.deepEqual(await listCourses(f.store), []);
  assert.equal(
    await readCourseAsset(
      "starter",
      course.revision,
      ["assets", "问题描述模板.txt"],
      f.store,
    ),
    null,
  );
});

test("断链、错误锚点、教师备注、HTML、外部图片和危险 URL 被拒绝", async (t) => {
  const f = await fixture(t);
  const original = await fs.readFile(f.body("start"), "utf8");
  for (const [extra, expected] of [
    ["[不存在](./missing.md)", /文档未登记/],
    ["[错误锚点](./03.检查清单.md#不存在)", /锚点不存在/],
    ["note: 教师提示", /教师备注/],
    ["<script>alert(1)</script>", /不支持 HTML/],
    ["![图片](https://example.com/image.png)", /外部图片/],
    ["![图][remote]\n\n[remote]: https://example.com/a.png", /外部图片/],
    ["[危险](javascript:alert%281%29)", /相对路径或 https/],
    ["[越界](../../outside.txt)", /越出课程目录/],
    ["[越界](..%2F..%2Foutside.txt)", /越出课程目录/],
  ]) {
    await fs.writeFile(f.body("start"), original + "\n\n" + extra);
    await assert.rejects(prepareCourse(f.source, revision), expected);
  }
  await fs.writeFile(f.body("start"), "---\nshowNotes: true\n---\n" + original);
  await assert.rejects(prepareCourse(f.source, revision), /frontmatter/);
});

test("已发布内容不能链接或关联草稿", async (t) => {
  const f = await fixture(t);
  f.config.pages[2].status = "draft";
  await f.save();
  await assert.rejects(prepareCourse(f.source, revision), /关联知识点尚未发布/);
  f.config.pages[1].related = [];
  await f.save();
  await assert.rejects(prepareCourse(f.source, revision), /链接指向草稿/);
});

test("重复中文标题生成唯一锚点，代码中的 note 不误判", async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    f.body("start"),
    "## 开始\n\n## 开始\n\n[第二处](#开始-1)\n\n```text\nnote: 代码示例\n<script>代码</script>\n```\n",
  );
  const { course } = await prepareCourse(f.source, revision);
  assert.deepEqual(
    course.pages[0].headings.map((h) => h.id),
    ["开始", "开始-1"],
  );
  assert.match(course.pages[0].html, /&#x3C;script>|&lt;script>/);
});

test("缺失图片、非法资源类型和路径穿越被拒绝", async (t) => {
  const f = await fixture(t);
  await fs.appendFile(f.body("start"), "\n![缺失](../assets/no.png)\n");
  await assert.rejects(prepareCourse(f.source, revision), /ENOENT/);
  await fs.writeFile(f.body("start"), "## 图片\n\n![图](../assets/a.svg)\n");
  await assert.rejects(prepareCourse(f.source, revision), /不支持的图片类型/);
  f.config.pages[0].source = "lessons/../../outside.md";
  await f.save();
  await assert.rejects(prepareCourse(f.source, revision), /规范 .md 路径/);
  assert.equal(await readCourse("../escape", f.store), null);
  assert.equal(
    await readCourseAsset(
      "starter",
      revision,
      ["assets", "..", "course.json"],
      f.store,
    ),
    null,
  );
});

test("发布锁阻止并发写入，源目录不允许与存储目录重叠", async (t) => {
  const f = await fixture(t);
  await publishCourse(f.source, f.store);
  const before = await readCourse("starter", f.store);
  await fs.writeFile(path.join(f.store, "starter/.publish.lock"), "test lock");
  await assert.rejects(publishCourse(f.source, f.store), /已有发布操作/);
  assert.equal(
    (await readCourse("starter", f.store)).revision,
    before.revision,
  );
  await assert.rejects(
    publishCourse(f.source, path.join(f.source, "store")),
    /不能重叠/,
  );
});

test("引用样式链接与本地图片正确处理", async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.source, "assets/pixel.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n1cAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  await fs.appendFile(
    f.body("start"),
    "\n![图][image]\n\n[image]: ../assets/pixel.png\n\n[练习][lesson]\n\n[lesson]: ./02.描述问题.md#操作\n",
  );
  const result = await prepareCourse(f.source, revision);
  assert(result.assets.has("assets/pixel.png"));
  assert.match(result.course.pages[0].html, /<img src="\/course-assets\//);
});
