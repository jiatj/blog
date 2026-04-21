import path from "node:path";

import matter from "gray-matter";

import { defaultLocale, locales, type Locale } from "@/lib/site-config";

import type { IngestContentType, RawSyncFrontmatter, ValidatedContentUnit } from "./types";

const contentRoot = path.join(process.cwd(), "content");
const publicRoot = path.join(process.cwd(), "public");

function ensureString(value: unknown, field: string, sourcePath: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Frontmatter "${field}" is required in ${sourcePath}`);
  }

  return value.trim();
}

function ensureDateString(value: unknown, field: string, sourcePath: string) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return ensureString(value, field, sourcePath);
}

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function sanitizeSegment(value: string) {
  const normalized = value.trim().replace(/\\/g, "/");

  if (!normalized || normalized.includes("..")) {
    throw new Error(`Invalid path segment: ${value}`);
  }

  return normalized.replace(/[^a-zA-Z0-9/_-]/g, "-");
}

function resolveContentType(frontmatter: RawSyncFrontmatter, sourcePath: string): IngestContentType {
  const value = frontmatter.type ?? frontmatter.contentType;

  if (value === "post" || value === "tool") {
    return value;
  }

  throw new Error(`Frontmatter "type" must be "post" or "tool" in ${sourcePath}`);
}

function ensureRelativeReference(value: string, field: string, sourcePath: string) {
  if (!value.startsWith("./")) {
    throw new Error(`Frontmatter "${field}" must use a local relative path in ${sourcePath}`);
  }

  return value;
}

export function parseMarkdownUnit(sourcePath: string) {
  const normalized = sourcePath.trim().replace(/\\/g, "/");
  const segments = normalized.split("/");

  if (segments.length !== 4) {
    throw new Error(
      `Source markdown path must follow {posts|tools}/{locale}/{slug}/{slug}.md(x): ${sourcePath}`
    );
  }

  const [collection, localeSegment, directorySlug, fileName] = segments;

  if (collection !== "posts" && collection !== "tools") {
    throw new Error(`Source markdown path must start with posts/ or tools/: ${sourcePath}`);
  }

  if (!isLocale(localeSegment)) {
    throw new Error(`Unsupported locale "${localeSegment}" in ${sourcePath}`);
  }

  if (!fileName.endsWith(".md") && !fileName.endsWith(".mdx")) {
    throw new Error(`Only .md and .mdx files can be ingested: ${sourcePath}`);
  }

  return {
    normalizedSourcePath: normalized,
    collection,
    locale: localeSegment,
    directorySlug,
    fileName,
    fileBaseName: fileName.replace(/\.(md|mdx)$/, ""),
    sourceDirectory: `${collection}/${localeSegment}/${directorySlug}`
  };
}

export function validateFrontmatter(sourcePath: string, rawContent: string): ValidatedContentUnit {
  const parsed = parseMarkdownUnit(sourcePath);
  const { data, content } = matter(rawContent);
  const frontmatter = data as RawSyncFrontmatter;
  const type = resolveContentType(frontmatter, parsed.normalizedSourcePath);
  const locale = frontmatter.locale ?? parsed.locale ?? defaultLocale;

  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale "${String(locale)}" in ${parsed.normalizedSourcePath}`);
  }

  const slug = ensureString(frontmatter.slug, "slug", parsed.normalizedSourcePath);

  if (slug !== parsed.directorySlug) {
    throw new Error(
      `Frontmatter "slug" must match parent directory "${parsed.directorySlug}" in ${parsed.normalizedSourcePath}`
    );
  }

  if (parsed.fileBaseName !== slug) {
    throw new Error(
      `Source file name "${parsed.fileBaseName}" must match slug "${slug}" in ${parsed.normalizedSourcePath}`
    );
  }

  const title = ensureString(frontmatter.title, "title", parsed.normalizedSourcePath);
  const summary = ensureString(frontmatter.summary, "summary", parsed.normalizedSourcePath);
  const status = ensureString(frontmatter.status, "status", parsed.normalizedSourcePath);
  const date = ensureDateString(frontmatter.date, "date", parsed.normalizedSourcePath);
  const updated = ensureDateString(frontmatter.updated, "updated", parsed.normalizedSourcePath);
  const cover = ensureRelativeReference(
    ensureString(frontmatter.cover, "cover", parsed.normalizedSourcePath),
    "cover",
    parsed.normalizedSourcePath
  );
  const draft = frontmatter.draft === true || status !== "published";

  return {
    sourcePath: parsed.normalizedSourcePath,
    sourceDirectory: parsed.sourceDirectory,
    sourceFileBaseName: parsed.fileBaseName,
    type,
    locale,
    slug,
    title,
    summary,
    status,
    date,
    updated,
    cover,
    body: content,
    rawFrontmatter: frontmatter,
    draft,
    targetContentPath: path.join(contentRoot, `${type}s`, locale, `${sanitizeSegment(slug)}.mdx`),
    targetAssetRoot: path.join(publicRoot, `${type}s`, sanitizeSegment(slug)),
    publicBasePath: `/${type}s/${sanitizeSegment(slug)}`
  };
}
