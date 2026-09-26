import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { prepareCourse } from "../lib/courses/package.ts";
import { publishCourse, readCourse } from "../lib/courses/store.ts";

test("磁盘写入失败后保留旧版本，并释放发布锁", async (t) => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "portal-course-disk-"),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, "incoming");
  const store = path.join(temporary, "published");
  await fs.cp(path.resolve("examples/courses/starter"), source, {
    recursive: true,
  });
  const first = await publishCourse(source, store);
  const write = fs.writeFile;
  const mock = t.mock.method(fs, "writeFile", async (target, ...args) => {
    if (
      String(target).includes("releases") &&
      String(target).endsWith("course.json")
    )
      throw new Error("模拟磁盘写入失败");
    return write(target, ...args);
  });
  await assert.rejects(publishCourse(source, store), /模拟磁盘/);
  mock.mock.restore();
  assert.equal((await readCourse("starter", store)).revision, first.revision);
  const second = await publishCourse(source, store);
  assert.notEqual(second.revision, first.revision);
});

test("目录符号链接不能越出课程包", async (t) => {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), "portal-course-link-"),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, "incoming");
  await fs.cp(path.resolve("examples/courses/starter"), source, {
    recursive: true,
  });
  const outside = path.join(temporary, "outside");
  await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, "private.txt"), "private");
  try {
    await fs.symlink(
      outside,
      path.join(source, "assets/linked"),
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch (error) {
    if (error.code === "EPERM") return t.skip("当前用户无创建符号链接权限");
    throw error;
  }
  await fs.appendFile(
    path.join(source, "lessons/01.开始.md"),
    "\n[越界](../assets/linked/private.txt)\n",
  );
  await assert.rejects(
    prepareCourse(source, "0000000000000-000000000000"),
    /符号链接/,
  );
});
