import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";

import type { Locale } from "@/lib/site-config";

const contentRoot = path.join(process.cwd(), "content");

type BaseFrontmatter = {
  title?: string;
  slug?: string;
  summary?: string;
  locale?: Locale;
  draft?: boolean;
  cover?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type PostFrontmatter = BaseFrontmatter & {
  date?: string;
  tags?: string[];
};

export type ToolFrontmatter = BaseFrontmatter & {
  toolStatus?: string;
  toolUrl?: string;
  repoUrl?: string;
  logo?: string;
  homeActionLabel?: string;
  homeFeatured?: boolean;
  homeOrder?: number;
};

export type PostEntry = PostFrontmatter & {
  content: string;
  type: "post";
};

export type ToolEntry = ToolFrontmatter & {
  content: string;
  type: "tool";
};

function ensureString(value: unknown, field: string, filePath: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid frontmatter: "${field}" is required in ${filePath}`);
  }

  return value.trim();
}

function ensureStringArray(value: unknown, field: string, filePath: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid frontmatter: "${field}" must be a string array in ${filePath}`);
  }

  return value;
}

function ensureDateString(value: unknown, field: string, filePath: string) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return ensureString(value, field, filePath);
}

function normalizeSharedFrontmatter(
  frontmatter: BaseFrontmatter,
  filePath: string,
  fallbackLocale: Locale,
  fallbackSlug: string
) {
  return {
    title: ensureString(frontmatter.title, "title", filePath),
    slug: ensureString(frontmatter.slug ?? fallbackSlug, "slug", filePath),
    summary: ensureString(frontmatter.summary, "summary", filePath),
    locale: (frontmatter.locale ?? fallbackLocale) as Locale,
    draft: Boolean(frontmatter.draft),
    cover: frontmatter.cover,
    seoTitle: frontmatter.seoTitle,
    seoDescription: frontmatter.seoDescription
  };
}

function normalizePostFrontmatter(
  frontmatter: PostFrontmatter,
  filePath: string,
  locale: Locale,
  fileName: string
) {
  const shared = normalizeSharedFrontmatter(frontmatter, filePath, locale, fileName.replace(/\.(md|mdx)$/, ""));

  return {
    ...shared,
    date: ensureDateString(frontmatter.date, "date", filePath),
    tags: ensureStringArray(frontmatter.tags ?? [], "tags", filePath)
  } satisfies PostFrontmatter;
}

function normalizeToolFrontmatter(
  frontmatter: ToolFrontmatter,
  filePath: string,
  locale: Locale,
  fileName: string
) {
  const shared = normalizeSharedFrontmatter(frontmatter, filePath, locale, fileName.replace(/\.(md|mdx)$/, ""));

  return {
    ...shared,
    toolStatus: typeof frontmatter.toolStatus === "string" ? frontmatter.toolStatus : "Live",
    toolUrl: frontmatter.toolUrl,
    repoUrl: frontmatter.repoUrl,
    logo: typeof frontmatter.logo === "string" ? frontmatter.logo : undefined,
    homeActionLabel: typeof frontmatter.homeActionLabel === "string" ? frontmatter.homeActionLabel : undefined,
    homeFeatured: Boolean(frontmatter.homeFeatured),
    homeOrder: typeof frontmatter.homeOrder === "number" ? frontmatter.homeOrder : 999
  } satisfies ToolFrontmatter;
}

async function readDirectoryFiles(dirPath: string) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.filter((entry) => entry.endsWith(".md") || entry.endsWith(".mdx"));
  } catch {
    return [];
  }
}

function ensureUniqueSlugs<T extends { slug?: string }>(items: T[], scope: string) {
  const seen = new Map<string, number>();

  for (const item of items) {
    if (!item.slug) {
      continue;
    }

    const count = seen.get(item.slug) ?? 0;
    seen.set(item.slug, count + 1);
  }

  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);

  if (duplicates.length) {
    throw new Error(`Duplicate slug(s) found in ${scope}: ${duplicates.join(", ")}`);
  }

  return items;
}

function ensureSlug(frontmatter: BaseFrontmatter, fileName: string) {
  return frontmatter.slug ?? fileName.replace(/\.(md|mdx)$/, "");
}

async function readPostFile(locale: Locale, fileName: string) {
  const fullPath = path.join(contentRoot, "posts", locale, fileName);
  const source = await fs.readFile(fullPath, "utf8");
  const { data, content } = matter(source);
  const frontmatter = normalizePostFrontmatter(data as PostFrontmatter, fullPath, locale, fileName);

  return {
    ...frontmatter,
    slug: ensureSlug(frontmatter, fileName),
    locale,
    content
  };
}

async function readToolFile(locale: Locale, fileName: string) {
  const fullPath = path.join(contentRoot, "tools", locale, fileName);
  const source = await fs.readFile(fullPath, "utf8");
  const { data, content } = matter(source);
  const frontmatter = normalizeToolFrontmatter(data as ToolFrontmatter, fullPath, locale, fileName);

  return {
    ...frontmatter,
    slug: ensureSlug(frontmatter, fileName),
    locale,
    content
  };
}

export async function getPosts(locale: Locale) {
  const dirPath = path.join(contentRoot, "posts", locale);
  const files = await readDirectoryFiles(dirPath);
  const items = (await Promise.all(files.map((file) => readPostFile(locale, file)))).filter(
    (item) => !item.draft
  );

  return ensureUniqueSlugs(
    items
    .filter((item) => item.title && item.date)
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()) as PostEntry[],
    `posts/${locale}`
  );
}

export async function getTools(locale: Locale) {
  const dirPath = path.join(contentRoot, "tools", locale);
  const files = await readDirectoryFiles(dirPath);
  const items = (await Promise.all(files.map((file) => readToolFile(locale, file)))).filter(
    (item) => !item.draft
  );

  return ensureUniqueSlugs(items.filter((item) => item.title) as ToolEntry[], `tools/${locale}`).sort(
    (a, b) => {
      if (a.homeFeatured !== b.homeFeatured) {
        return a.homeFeatured ? -1 : 1;
      }

      return (a.homeOrder ?? 999) - (b.homeOrder ?? 999);
    }
  );
}

export async function getPostBySlug(locale: Locale, slug: string) {
  const posts = await getPosts(locale);
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getToolBySlug(locale: Locale, slug: string) {
  const tools = await getTools(locale);
  return tools.find((tool) => tool.slug === slug) ?? null;
}

export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false
    }
  });

  return content;
}
