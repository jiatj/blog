import fs from "node:fs/promises";
import path from "node:path";
import { parseLesson, renderLesson, assetUrl } from "./markdown.ts";
import type { Course, CoursePage, PublishedCourse } from "./types.ts";

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const attachmentExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
  ".pdf",
  ".zip",
  ".txt",
  ".csv",
  ".json",
]);
const imageExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
]);
const MAX_ASSET = 50 * 1024 * 1024;
const MAX_PACKAGE = 200 * 1024 * 1024;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function string(value: unknown, field: string) {
  assert(
    typeof value === "string" && value.trim(),
    `${field} 必须是非空字符串`,
  );
}
function stringList(value: unknown, field: string) {
  assert(
    Array.isArray(value) &&
      value.every((item) => typeof item === "string" && item.trim()),
    `${field} 必须是字符串数组`,
  );
}
function id(value: unknown, field: string) {
  assert(
    typeof value === "string" && value.length <= 80 && slugPattern.test(value),
    `${field} 只能包含小写字母、数字与单连字符，最多 80 字符`,
  );
}
function date(value: unknown, field: string) {
  assert(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    `${field} 必须是有效 YYYY-MM-DD 日期`,
  );
}

export function validateCourse(value: unknown): Course {
  assert(value && typeof value === "object", "course.json 必须是对象");
  const course = value as Course;
  assert(course.version === 1, "course.json version 必须为 1");
  id(course.slug, "slug");
  string(course.title, "title");
  string(course.summary, "summary");
  assert(course.locale === "zh", "第一版 locale 必须为 zh");
  assert(
    ["published", "draft"].includes(course.status),
    "课程 status 必须为 published 或 draft",
  );
  assert(
    ["updating", "complete"].includes(course.state),
    "state 必须为 updating 或 complete",
  );
  assert(Number.isFinite(course.order), "order 必须为数字");
  for (const field of ["audience", "preparation", "cover"] as const)
    if (course[field] !== undefined) string(course[field], field);
  if (course.outcomes !== undefined) stringList(course.outcomes, "outcomes");
  assert(
    Array.isArray(course.pages) && course.pages.length > 0,
    "pages 至少包含一个内容页",
  );
  const pages = new Map<string, CoursePage>();
  const sources = new Set<string>();
  for (const page of course.pages) {
    assert(page && typeof page === "object", "pages 内容必须是对象");
    id(page.slug, "page.slug");
    string(page.title, `${page.slug}.title`);
    assert(!pages.has(page.slug), `重复页面 slug: ${page.slug}`);
    assert(
      ["guide", "lesson", "reference"].includes(page.kind),
      `${page.slug}: 无效 kind`,
    );
    assert(
      ["published", "draft"].includes(page.status),
      `${page.slug}: 无效 status`,
    );
    string(page.source, `${page.slug}.source`);
    assert(
      page.source.startsWith("lessons/") &&
        page.source.endsWith(".md") &&
        !page.source.includes("\\") &&
        path.posix.normalize(page.source) === page.source,
      `${page.slug}: source 必须是 lessons/ 内的规范 .md 路径`,
    );
    const sourceKey = page.source.toLowerCase();
    assert(
      !sources.has(sourceKey),
      `源文件重复（含大小写冲突）: ${page.source}`,
    );
    sources.add(sourceKey);
    date(page.updated, `${page.slug}.updated`);
    for (const field of ["summary", "label"] as const)
      if (page[field] !== undefined)
        string(page[field], `${page.slug}.${field}`);
    for (const field of ["objectives", "related"] as const)
      if (page[field] !== undefined)
        stringList(page[field], `${page.slug}.${field}`);
    pages.set(page.slug, page);
  }
  assert(
    Array.isArray(course.groups) && course.groups.length > 0,
    "groups 至少包含一个分组",
  );
  const groupIds = new Set<string>();
  const ordered = new Set<string>();
  for (const group of course.groups) {
    assert(group && typeof group === "object", "分组必须是对象");
    id(group.id, "group.id");
    string(group.title, `${group.id}.title`);
    assert(!groupIds.has(group.id), `分组 id 重复: ${group.id}`);
    groupIds.add(group.id);
    stringList(group.lessons, `${group.id}.lessons`);
    if (group.guide !== undefined)
      assert(
        pages.get(group.guide)?.kind === "guide",
        `${group.id}: guide 必须指向导读页`,
      );
    for (const slug of [
      ...(group.guide ? [group.guide] : []),
      ...group.lessons,
    ]) {
      const page = pages.get(slug);
      assert(
        page && page.kind !== "reference",
        `${group.id}: 顺序目录中页面不存在或属于知识点: ${slug}`,
      );
      assert(!ordered.has(slug), `页面重复进入目录: ${slug}`);
      ordered.add(slug);
    }
  }
  for (const page of pages.values()) {
    assert(
      page.kind === "reference" || ordered.has(page.slug),
      `${page.slug}: 未加入分组目录`,
    );
    for (const related of page.related ?? []) {
      const target = pages.get(related);
      assert(
        target?.kind === "reference",
        `${page.slug}: related 必须指向知识点: ${related}`,
      );
      assert(
        page.status !== "published" || target.status === "published",
        `${page.slug}: 关联知识点尚未发布: ${related}`,
      );
    }
  }
  assert(ordered.has(course.start), "start 必须指向目录中的导读或讲义");
  assert(
    course.status !== "published" ||
      pages.get(course.start)?.status === "published",
    "课程起始页尚未发布",
  );
  return course;
}

// Reject symlinks as well as '..': a package may only read its own regular files.
export async function packageFile(root: string, relative: string) {
  assert(
    !relative.includes("\\") &&
      !relative.includes(":") &&
      !/[\u0000-\u001f]/.test(relative) &&
      relative
        .split("/")
        .every((segment) => segment && segment !== "." && segment !== ".."),
    `无效文件路径: ${relative}`,
  );
  let current = root;
  for (const segment of relative.split("/")) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current);
    assert(!stat.isSymbolicLink(), `不允许符号链接: ${relative}`);
  }
  const stat = await fs.stat(current);
  assert(stat.isFile(), `不是普通文件: ${relative}`);
  return { path: current, size: stat.size };
}

export async function prepareCourse(sourceDirectory: string, revision: string) {
  const root = await fs.realpath(sourceDirectory);
  const config = await packageFile(root, "course.json");
  assert(config.size < 1024 * 1024, "course.json 超过 1MB");
  const course = validateCourse(
    JSON.parse((await fs.readFile(config.path, "utf8")).replace(/^\uFEFF/, "")),
  );
  const documents = new Map<
    string,
    ReturnType<typeof parseLesson> & { page: CoursePage }
  >();
  for (const page of course.pages) {
    const file = await packageFile(root, page.source);
    assert(file.size <= 2 * 1024 * 1024, `${page.source}: Markdown 超过 2MB`);
    documents.set(page.source, {
      page,
      ...parseLesson(await fs.readFile(file.path, "utf8"), page.source),
    });
  }
  const assets = new Map<string, Buffer>();
  let size = 0;
  const addAsset = async (relative: string, image: boolean) => {
    const extension = path.posix.extname(relative).toLowerCase();
    assert(relative.startsWith("assets/"), `资源必须位于 assets/: ${relative}`);
    assert(
      (image ? imageExtensions : attachmentExtensions).has(extension),
      `不支持的${image ? "图片" : "附件"}类型: ${relative}`,
    );
    if (assets.has(relative)) return;
    assert(
      ![...assets.keys()].some(
        (key) => key.toLowerCase() === relative.toLowerCase(),
      ),
      `资源文件大小写冲突: ${relative}`,
    );
    const file = await packageFile(root, relative);
    assert(file.size <= MAX_ASSET, `附件超过 50MB: ${relative}`);
    size += file.size;
    assert(size <= MAX_PACKAGE, "课程附件总大小超过 200MB");
    assets.set(relative, await fs.readFile(file.path));
  };
  const pages = [];
  for (const document of documents.values()) {
    if (document.page.status !== "published" || course.status !== "published")
      continue;
    const html = await renderLesson(
      document.tree,
      document.page,
      course.slug,
      revision,
      documents,
      addAsset,
    );
    pages.push({ ...document.page, html, headings: document.headings });
  }
  let cover: string | undefined;
  if (course.cover && course.status === "published") {
    await addAsset(course.cover, true);
    cover = assetUrl(course.slug, revision, course.cover);
  }
  const published: PublishedCourse = {
    ...course,
    cover,
    pages,
    revision,
    publishedAt: new Date().toISOString(),
    assets: [...assets.keys()],
  };
  return { course: published, assets };
}
