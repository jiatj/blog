import fs from "node:fs/promises";
import path from "node:path";
import { isId, isOutputPath, parseArtifact, publicArtifact } from "./model.ts";
import type { Artifact, BuildLocale } from "./types.ts";

export function buildContentRoot() {
  const configured = process.env.BUILD_CONTENT_DIR?.trim();
  if (configured) {
    if (!path.isAbsolute(configured)) throw new Error("BUILD_CONTENT_DIR 必须为绝对路径");
    return configured;
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), "content", "build");
}

function isMissing(error: unknown) { return (error as NodeJS.ErrnoException).code === "ENOENT"; }

// Files must remain inside the real root; reject links so outputs cannot expose other data.
async function regularPath(root: string, parts: string[], directory = false) {
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    current = path.join(/* turbopackIgnore: true */ current, parts[i]);
    const stat = await fs.lstat(/* turbopackIgnore: true */ current);
    if (stat.isSymbolicLink() || (i < parts.length - 1 || directory ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error(`${current}: 必须为普通${directory ? "目录" : "文件"}，不支持符号链接`);
    }
  }
  return current;
}

export async function readBuildArtifacts(locale: BuildLocale, root = buildContentRoot(), includeDrafts = false): Promise<Artifact[]> {
  if (locale !== "zh" && locale !== "en") throw new Error("不支持的造物语言");
  let entries;
  try {
    const dir = await regularPath(root, [locale], true);
    entries = await fs.readdir(/* turbopackIgnore: true */ dir, { withFileTypes: true });
  } catch (error) { if (isMissing(error)) return []; throw error; }
  const items: Artifact[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) throw new Error(`造物目录不支持符号链接: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    if (!isId(entry.name)) throw new Error(`无效作品目录 ID: ${entry.name}`);
    const file = await regularPath(root, [locale, entry.name, "artifact.json"]);
    const stat = await fs.stat(/* turbopackIgnore: true */ file);
    if (stat.size > 2 * 1024 * 1024) throw new Error(`${file}: 元数据不得超过 2 MiB`);
    const artifact = parseArtifact(JSON.parse((await fs.readFile(/* turbopackIgnore: true */ file, "utf8")).replace(/^\uFEFF/, "")), file);
    if (artifact.id !== entry.name) throw new Error(`${file}: 作品 ID 必须等于目录名`);
    if (includeDrafts) items.push(artifact);
    else if (artifact.publishState === "published") items.push(publicArtifact(artifact));
  }
  return items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export async function getBuildArtifact(locale: BuildLocale, id: string) {
  if (!isId(id)) return null;
  return (await readBuildArtifacts(locale)).find((a) => a.id === id) ?? null;
}

export async function readBuildOutput(locale: BuildLocale, id: string, href: string, root = buildContentRoot()) {
  if (!isId(id) || !isOutputPath(href)) return null;
  const artifact = (await readBuildArtifacts(locale, root)).find((a) => a.id === id);
  if (!artifact?.logs.some((l) => l.outputs.some((o) => o.href === href))) return null;
  try {
    const file = await regularPath(root, [locale, id, ...href.split("/")]);
    if ((await fs.stat(/* turbopackIgnore: true */ file)).size > 64 * 1024 * 1024) throw new Error("产出文件不得超过 64 MiB；大文件请使用 HTTPS 外链");
    return { data: await fs.readFile(/* turbopackIgnore: true */ file), name: path.basename(file) };
  } catch (error) { if (isMissing(error)) return null; throw error; }
}
