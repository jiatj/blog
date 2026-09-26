import { prepareCourse } from "../lib/courses/package.ts";
import {
  publishCourse,
  rollbackCourse,
  courseRoot,
} from "../lib/courses/store.ts";

const [command, target, ...extra] = process.argv.slice(2);
try {
  if (
    !target ||
    extra.length ||
    !["check", "publish", "rollback"].includes(command)
  ) {
    throw new Error(
      "用法: npm run course:check -- <课程目录> | npm run course:publish -- <课程目录> | npm run course:rollback -- <课程slug>",
    );
  }
  const course =
    command === "check"
      ? (await prepareCourse(target, "0000000000000-000000000000")).course
      : command === "publish"
        ? await publishCourse(target)
        : await rollbackCourse(target);
  console.log(
    `${command === "check" ? "校验通过" : command === "publish" ? "发布成功" : "回退成功"}: ${course.title} (${course.slug})`,
  );
  console.log(
    `状态: ${course.status}；公开页面: ${course.pages.length}；资源: ${course.assets.length}`,
  );
  for (const page of course.pages) {
    console.log(`  /zh/courses/${course.slug}/${page.slug}`);
    if (command === "check")
      for (const heading of page.headings) console.log(`    #${heading.id}`);
  }
  if (command !== "check")
    console.log(
      `版本: ${course.revision}\n存储: ${courseRoot()}\n新请求立即读取当前版本，无需重启。`,
    );
} catch (error) {
  console.error(`${command ?? "course"} 失败: ${error.message}`);
  process.exitCode = 1;
}
