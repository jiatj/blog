import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Nodes, Root } from "mdast";
import type { CoursePage, Heading } from "./types.ts";

const parser = unified().use(remarkParse).use(remarkGfm);
const renderer = unified().use(remarkRehype).use(rehypeStringify);

function walk(node: Nodes, callback: (node: Nodes) => void) {
  callback(node);
  if ("children" in node)
    node.children.forEach((child) => walk(child, callback));
}

function textOf(node: Nodes): string {
  if ("value" in node) return node.value;
  return "children" in node ? node.children.map(textOf).join("") : "";
}

export function parseLesson(source: string, file: string) {
  if (/^\uFEFF?---\s*\r?\n/.test(source)) {
    throw new Error(
      `${file}: 请移除 frontmatter / 幻灯片配置，元数据统一写入 course.json`,
    );
  }
  const tree = parser.parse(source) as Root;
  const headings: Heading[] = [];
  const ids = new Set<string>();
  walk(tree, (node) => {
    if (node.type === "html")
      throw new Error(`${file}: 不支持 HTML / JSX，请使用标准 Markdown`);
    if (node.type === "text" && /\[\[|!\[\[/.test(node.value)) {
      throw new Error(`${file}: 请将 Obsidian 双链转换为标准 Markdown 链接`);
    }
    if (node.type === "paragraph" && /^\s*note\s*:/i.test(textOf(node))) {
      throw new Error(`${file}: 检测到 note: 教师备注，请整理为学生版后发布`);
    }
    if (node.type !== "heading") return;
    if (node.depth === 1)
      throw new Error(`${file}: 标题由 course.json 提供，正文从 ## 开始`);
    const title = textOf(node);
    const base =
      title
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}_\s-]/gu, "")
        .replace(/\s+/g, "-") || "section";
    let id = base;
    let suffix = 1;
    while (ids.has(id)) id = `${base}-${suffix++}`;
    ids.add(id);
    node.data = { ...node.data, hProperties: { id } };
    headings.push({ id, title, depth: node.depth });
  });
  return { tree, headings };
}

export function localReference(source: string, reference: string) {
  const match = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(reference);
  if (!match) throw new Error(`无效链接: ${reference}`);
  const rawPath = decodeURIComponent(match[1]);
  const fragment = match[3] ? decodeURIComponent(match[3].slice(1)) : "";
  if (rawPath.includes("\\") || /[\u0000-\u001f]/.test(rawPath))
    throw new Error(`无效路径: ${reference}`);
  const resolved = rawPath
    ? path.posix.normalize(path.posix.join(path.posix.dirname(source), rawPath))
    : source;
  if (
    resolved === ".." ||
    resolved.startsWith("../") ||
    path.posix.isAbsolute(rawPath)
  ) {
    throw new Error(`链接越出课程目录: ${reference}`);
  }
  return { resolved, fragment, query: match[2] ?? "" };
}

export async function renderLesson(
  tree: Root,
  page: CoursePage,
  courseSlug: string,
  revision: string,
  documents: Map<string, { page: CoursePage; headings: Heading[] }>,
  addAsset: (relative: string, image: boolean) => Promise<void>,
) {
  const definitions = new Set<string>();
  const imageDefinitions = new Set<string>();
  walk(tree, (node) => {
    if (node.type === "definition") definitions.add(node.identifier);
    if (node.type === "imageReference") imageDefinitions.add(node.identifier);
  });
  const references: {
    node: Extract<Nodes, { url: string }>;
    image: boolean;
  }[] = [];
  walk(tree, (node) => {
    if (
      (node.type === "linkReference" || node.type === "imageReference") &&
      !definitions.has(node.identifier)
    ) {
      throw new Error(`${page.source}: 未定义引用 ${node.identifier}`);
    }
    if (
      node.type === "link" ||
      node.type === "image" ||
      node.type === "definition"
    ) {
      references.push({
        node,
        image:
          node.type === "image" ||
          (node.type === "definition" && imageDefinitions.has(node.identifier)),
      });
    }
  });
  for (const { node, image } of references) {
    const url = node.url;
    if (/^(https?:\/\/|mailto:)/i.test(url)) {
      if (image)
        throw new Error(
          `${page.source}: 图片请放入 assets/，不使用外部图片: ${url}`,
        );
      continue;
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("/")) {
      throw new Error(`${page.source}: 请使用相对路径或 https 链接: ${url}`);
    }
    const { resolved, fragment, query } = localReference(page.source, url);
    const document = documents.get(resolved);
    if (document) {
      if (image || query)
        throw new Error(`${page.source}: 无效文档引用: ${url}`);
      if (document.page.status !== "published")
        throw new Error(`${page.source}: 链接指向草稿: ${url}`);
      if (
        fragment &&
        !document.headings.some((heading) => heading.id === fragment)
      ) {
        throw new Error(`${page.source}: 标题锚点不存在: ${url}`);
      }
      const base = `/zh/courses/${courseSlug}/${document.page.slug}`;
      node.url = `${base}${fragment ? `#${encodeURIComponent(fragment)}` : ""}`;
    } else {
      if (/\.mdx?$/i.test(resolved))
        throw new Error(`${page.source}: 文档未登记在 course.json: ${url}`);
      if (!resolved.startsWith("assets/"))
        throw new Error(`${page.source}: 附件必须位于 assets/: ${url}`);
      if (query)
        throw new Error(`${page.source}: 本地附件不支持查询参数: ${url}`);
      await addAsset(resolved, image);
      node.url =
        assetUrl(courseSlug, revision, resolved) +
        (fragment ? `#${encodeURIComponent(fragment)}` : "");
    }
  }
  const result = await renderer.run(tree);
  return renderer.stringify(result);
}

export function assetUrl(slug: string, revision: string, relative: string) {
  return `/course-assets/${slug}/${revision}/${relative.split("/").map(encodeURIComponent).join("/")}`;
}
