import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prepareCourse, slugPattern, packageFile } from "./package.ts";
import type { PublishedCourse } from "./types.ts";

const revisionPattern = /^\d{13}-[a-f0-9]{12}$/;
type Pointer = { current: string; previous?: string };

export function courseRoot() {
  const configured = process.env.COURSE_CONTENT_DIR;
  if (configured) {
    if (!path.isAbsolute(configured))
      throw new Error("COURSE_CONTENT_DIR 必须是绝对路径");
    return configured;
  }
  // Runtime content is published independently, never bundled into the build.
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".course-data");
}

function courseDirectory(root: string, slug: string) {
  if (!slugPattern.test(slug) || slug.length > 80)
    throw new Error("无效课程标识");
  return path.join(root, slug);
}

async function pointerAt(directory: string): Promise<Pointer | null> {
  try {
    const pointer = JSON.parse(
      await fs.readFile(path.join(directory, "current.json"), "utf8"),
    ) as Pointer;
    if (
      !revisionPattern.test(pointer.current) ||
      (pointer.previous && !revisionPattern.test(pointer.previous))
    )
      throw new Error("课程版本指针损坏");
    return pointer;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function readRevision(
  directory: string,
  revision: string,
): Promise<PublishedCourse> {
  if (!revisionPattern.test(revision)) throw new Error("无效课程版本");
  return JSON.parse(
    await fs.readFile(
      path.join(directory, "releases", revision, "course.json"),
      "utf8",
    ),
  );
}

export async function readCourse(slug: string, root = courseRoot()) {
  if (!slugPattern.test(slug) || slug.length > 80) return null;
  const directory = courseDirectory(root, slug);
  const pointer = await pointerAt(directory);
  if (!pointer) return null;
  const course = await readRevision(directory, pointer.current);
  return course.status === "published" ? course : null;
}

export async function listCourses(root = courseRoot()) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const courses = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && slugPattern.test(entry.name))
      .map((entry) => readCourse(entry.name, root)),
  );
  return courses
    .filter((course): course is PublishedCourse => course !== null)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

async function withLock<T>(directory: string, operation: () => Promise<T>) {
  await fs.mkdir(directory, { recursive: true });
  const lockPath = path.join(directory, ".publish.lock");
  let lock;
  try {
    lock = await fs.open(lockPath, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new Error(
        "该课程已有发布操作；若进程曾异常退出，请确认无发布进程后手工移除 .publish.lock",
      );
    throw error;
  }
  try {
    await lock.writeFile(
      JSON.stringify({ pid: process.pid, started: new Date().toISOString() }),
    );
    return await operation();
  } finally {
    await lock.close();
    await fs.unlink(lockPath);
  }
}

async function switchPointer(directory: string, pointer: Pointer) {
  const temporary = path.join(
    directory,
    `.pointer-${crypto.randomUUID()}.json`,
  );
  const file = await fs.open(temporary, "wx");
  try {
    await file.writeFile(JSON.stringify(pointer));
    await file.sync();
  } finally {
    await file.close();
  }
  await fs.rename(temporary, path.join(directory, "current.json"));
}

export async function publishCourse(
  sourceDirectory: string,
  root = courseRoot(),
) {
  const revision = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  // Validation and all resource reads finish before the published store changes.
  const prepared = await prepareCourse(sourceDirectory, revision);
  const directory = courseDirectory(root, prepared.course.slug);
  const source = await fs.realpath(sourceDirectory);
  const destination = path.resolve(root);
  if (
    source === destination ||
    source.startsWith(destination + path.sep) ||
    destination.startsWith(source + path.sep)
  ) {
    throw new Error("源目录与发布目录不能重叠，请上传到独立的待发布目录");
  }
  return withLock(directory, async () => {
    const previous = await pointerAt(directory);
    const release = path.join(directory, "releases", revision);
    await fs.mkdir(release, { recursive: true });
    for (const [relative, bytes] of prepared.assets) {
      const target = path.join(release, relative);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, bytes, { flag: "wx" });
    }
    await fs.writeFile(
      path.join(release, "course.json"),
      JSON.stringify(prepared.course),
      { flag: "wx" },
    );
    await switchPointer(directory, {
      current: revision,
      ...(previous ? { previous: previous.current } : {}),
    });
    return prepared.course;
  });
}

export async function rollbackCourse(slug: string, root = courseRoot()) {
  const directory = courseDirectory(root, slug);
  return withLock(directory, async () => {
    const pointer = await pointerAt(directory);
    if (!pointer?.previous) throw new Error("没有可回退的上一版本");
    const previous = await readRevision(directory, pointer.previous);
    await switchPointer(directory, {
      current: pointer.previous,
      previous: pointer.current,
    });
    return previous;
  });
}

export async function readCourseAsset(
  slug: string,
  revision: string,
  segments: string[],
  root = courseRoot(),
) {
  if (
    !slugPattern.test(slug) ||
    slug.length > 80 ||
    !revisionPattern.test(revision) ||
    segments.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        /[\\/:\u0000-\u001f]/.test(part),
    )
  )
    return null;
  const directory = courseDirectory(root, slug);
  const current = await readCourse(slug, root);
  if (!current) return null;
  try {
    const course = await readRevision(directory, revision);
    const relative = segments.join("/");
    if (course.status !== "published" || !course.assets.includes(relative))
      return null;
    const file = await packageFile(
      path.join(directory, "releases", revision),
      relative,
    );
    return { path: file.path, name: segments.at(-1)!, size: file.size };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function courseSequence(course: PublishedCourse) {
  const pages = new Map(course.pages.map((page) => [page.slug, page]));
  return course.groups
    .flatMap((group) => [
      ...(group.guide ? [group.guide] : []),
      ...group.lessons,
    ])
    .flatMap((slug) => (pages.has(slug) ? [pages.get(slug)!] : []));
}
