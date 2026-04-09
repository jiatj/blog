import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { defaultLocale, locales, type Locale } from "@/lib/site-config";

const contentRoot = path.join(process.cwd(), "content");
const manifestPath = path.join(contentRoot, ".sync-manifest.json");

type SyncContentType = "post" | "tool";
type Provider = "github" | "gitee" | "manual";

type SyncFrontmatter = {
  title?: string;
  slug?: string;
  summary?: string;
  locale?: Locale;
  draft?: boolean;
  date?: string;
  contentType?: SyncContentType;
  syncToPortal?: boolean;
};

export type SourceFile = {
  path: string;
  content: string;
};

type SyncManifest = {
  version: 1;
  entries: Record<string, { targetPath: string }>;
};

export type SyncResult =
  | {
      sourcePath: string;
      status: "synced" | "deleted";
      targetPath: string;
      reason?: undefined;
    }
  | {
      sourcePath: string;
      status: "skipped" | "error" | "not_found";
      reason: string;
      targetPath?: undefined;
    };

type ResolvedTarget =
  | {
      status: "synced";
      targetPath: string;
      normalizedSource: string;
    }
  | {
      status: "skipped";
      reason: string;
      normalizedSource: string;
    };

type GithubRepository = {
  full_name?: string;
  name?: string;
  owner?: {
    login?: string;
    name?: string;
  };
};

type GiteeRepository = {
  full_name?: string;
  name?: string;
  namespace?: string;
  owner?: {
    login?: string;
    name?: string;
  };
};

type CommitPayload = {
  added?: string[];
  modified?: string[];
  removed?: string[];
};

type GithubPushPayload = {
  after?: string;
  commits?: CommitPayload[];
  repository?: GithubRepository;
};

type GiteePushPayload = {
  after?: string;
  commits?: CommitPayload[];
  repository?: GiteeRepository;
};

export type ProviderFileChanges = {
  upserts: SourceFile[];
  deletedPaths: string[];
};

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

function normalizeSourcePath(sourcePath: string) {
  const normalized = sourcePath.trim().replace(/\\/g, "/");

  if (!normalized || normalized.startsWith("/") || normalized.includes("..")) {
    throw new Error(`Invalid source path: ${sourcePath}`);
  }

  return normalized;
}

function sanitizeSegment(value: string) {
  const normalized = value.trim().replace(/\\/g, "/");

  if (!normalized || normalized.includes("..")) {
    throw new Error(`Invalid path segment: ${value}`);
  }

  return normalized.replace(/[^a-zA-Z0-9/_-]/g, "-");
}

function ensureSupportedFile(sourcePath: string) {
  const normalized = normalizeSourcePath(sourcePath);

  if (!normalized.endsWith(".md") && !normalized.endsWith(".mdx")) {
    throw new Error("Only .md and .mdx files can be synced");
  }

  return normalized;
}

function ensureString(value: unknown, field: string, sourcePath: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Frontmatter "${field}" is required in ${sourcePath}`);
  }

  return value.trim();
}

function getAllowedPrefixes() {
  return (process.env.CONTENT_SYNC_ALLOWED_PREFIXES ?? "")
    .split(",")
    .map((prefix) => prefix.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
}

function isSourcePathAllowed(sourcePath: string) {
  const normalizedSource = normalizeSourcePath(sourcePath);
  const allowedPrefixes = getAllowedPrefixes();

  if (!allowedPrefixes.length) {
    return true;
  }

  return allowedPrefixes.some((prefix) => {
    return normalizedSource === prefix || normalizedSource.startsWith(`${prefix}/`);
  });
}

function getWhitelistSkipReason() {
  const prefixes = getAllowedPrefixes();

  return prefixes.length
    ? `Source path is outside CONTENT_SYNC_ALLOWED_PREFIXES: ${prefixes.join(", ")}`
    : "Source path is not allowed";
}

function resolveTargetFile(sourcePath: string, rawContent: string): ResolvedTarget {
  const normalizedSource = ensureSupportedFile(sourcePath);
  const parsed = matter(rawContent);
  const frontmatter = parsed.data as SyncFrontmatter;

  if (!isSourcePathAllowed(normalizedSource)) {
    return {
      status: "skipped",
      reason: getWhitelistSkipReason(),
      normalizedSource
    };
  }

  if (!frontmatter.syncToPortal) {
    return {
      status: "skipped",
      reason: 'Frontmatter "syncToPortal" is not true',
      normalizedSource
    };
  }

  if (frontmatter.draft) {
    return {
      status: "skipped",
      reason: 'Frontmatter "draft" is true',
      normalizedSource
    };
  }

  const contentType = frontmatter.contentType;

  if (contentType !== "post" && contentType !== "tool") {
    throw new Error(`Frontmatter "contentType" must be "post" or "tool" in ${normalizedSource}`);
  }

  const sourceBaseName = path.basename(normalizedSource).replace(/\.(md|mdx)$/, "");
  const slug = ensureString(frontmatter.slug ?? sourceBaseName, "slug", normalizedSource);
  const locale = frontmatter.locale ?? defaultLocale;

  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale "${String(locale)}" in ${normalizedSource}`);
  }

  ensureString(frontmatter.title, "title", normalizedSource);
  ensureString(frontmatter.summary, "summary", normalizedSource);

  if (contentType === "post") {
    ensureString(frontmatter.date, "date", normalizedSource);
  }

  const ext = normalizedSource.endsWith(".mdx") ? ".mdx" : ".md";
  const fileName = `${sanitizeSegment(slug)}${ext}`;

  return {
    status: "synced",
    normalizedSource,
    targetPath: path.join(contentRoot, `${contentType}s`, locale, fileName)
  };
}

async function readManifest() {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as SyncManifest;

    if (parsed.version !== 1 || typeof parsed.entries !== "object" || !parsed.entries) {
      return { version: 1, entries: {} } satisfies SyncManifest;
    }

    return parsed;
  } catch {
    return { version: 1, entries: {} } satisfies SyncManifest;
  }
}

async function writeManifest(manifest: SyncManifest) {
  await fs.mkdir(contentRoot, { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

async function removeFileIfExists(filePath: string) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function syncUpsertFile(file: SourceFile, manifest: SyncManifest) {
  const resolved = resolveTargetFile(file.path, file.content);

  if (resolved.status !== "synced") {
    return {
      sourcePath: resolved.normalizedSource,
      status: "skipped",
      reason: resolved.reason
    } satisfies SyncResult;
  }

  const previousTarget = manifest.entries[resolved.normalizedSource]?.targetPath;

  if (previousTarget && previousTarget !== resolved.targetPath) {
    await removeFileIfExists(previousTarget);
  }

  await fs.mkdir(path.dirname(resolved.targetPath), { recursive: true });
  await fs.writeFile(resolved.targetPath, file.content, "utf8");
  manifest.entries[resolved.normalizedSource] = { targetPath: resolved.targetPath };

  return {
    sourcePath: resolved.normalizedSource,
    status: "synced",
    targetPath: resolved.targetPath
  } satisfies SyncResult;
}

async function syncDeletedFile(sourcePath: string, manifest: SyncManifest) {
  const normalizedSource = ensureSupportedFile(sourcePath);

  if (!isSourcePathAllowed(normalizedSource)) {
    return {
      sourcePath: normalizedSource,
      status: "skipped",
      reason: getWhitelistSkipReason()
    } satisfies SyncResult;
  }

  const existingEntry = manifest.entries[normalizedSource];

  if (!existingEntry) {
    return {
      sourcePath: normalizedSource,
      status: "not_found",
      reason: "No synced target found in manifest for this source file"
    } satisfies SyncResult;
  }

  await removeFileIfExists(existingEntry.targetPath);
  delete manifest.entries[normalizedSource];

  return {
    sourcePath: normalizedSource,
    status: "deleted",
    targetPath: existingEntry.targetPath
  } satisfies SyncResult;
}

export async function syncContentChanges(changes: ProviderFileChanges) {
  const manifest = await readManifest();
  const results: SyncResult[] = [];

  for (const file of changes.upserts) {
    try {
      results.push(await syncUpsertFile(file, manifest));
    } catch (error) {
      results.push({
        sourcePath: file.path,
        status: "error",
        reason: error instanceof Error ? error.message : "Unknown sync error"
      });
    }
  }

  for (const sourcePath of changes.deletedPaths) {
    try {
      results.push(await syncDeletedFile(sourcePath, manifest));
    } catch (error) {
      results.push({
        sourcePath,
        status: "error",
        reason: error instanceof Error ? error.message : "Unknown delete sync error"
      });
    }
  }

  await writeManifest(manifest);
  return results;
}

function collectChangedPaths(commits: CommitPayload[] = []) {
  const upsertPaths = new Set<string>();
  const deletedPaths = new Set<string>();

  for (const commit of commits) {
    for (const file of [...(commit.added ?? []), ...(commit.modified ?? [])]) {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        upsertPaths.add(normalizeSourcePath(file));
      }
    }

    for (const file of commit.removed ?? []) {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        deletedPaths.add(normalizeSourcePath(file));
      }
    }
  }

  return {
    upsertPaths: [...upsertPaths],
    deletedPaths: [...deletedPaths]
  };
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "portal-content-sync"
  };
}

function giteeHeaders(token: string) {
  return {
    Accept: "application/json",
    Authorization: `token ${token}`,
    "User-Agent": "portal-content-sync"
  };
}

async function fetchGithubFileContent(repository: GithubRepository, ref: string, filePath: string) {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  const fullName =
    repository.full_name ??
    (repository.owner?.login && repository.name ? `${repository.owner.login}/${repository.name}` : undefined);

  if (!token || !fullName) {
    throw new Error("Missing GitHub repository info or GITHUB_CONTENT_TOKEN");
  }

  const url = new URL(`https://api.github.com/repos/${fullName}/contents/${filePath}`);
  url.searchParams.set("ref", ref);

  const response = await fetch(url, {
    headers: githubHeaders(token),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`GitHub content fetch failed for ${filePath}: ${response.status}`);
  }

  const payload = (await response.json()) as { content?: string; encoding?: string };

  if (payload.encoding !== "base64" || typeof payload.content !== "string") {
    throw new Error(`GitHub content payload is invalid for ${filePath}`);
  }

  return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8");
}

async function fetchGiteeFileContent(repository: GiteeRepository, ref: string, filePath: string) {
  const token = process.env.GITEE_CONTENT_TOKEN;
  const fullName =
    repository.full_name ??
    (repository.namespace && repository.name ? `${repository.namespace}/${repository.name}` : undefined) ??
    (repository.owner?.login && repository.name ? `${repository.owner.login}/${repository.name}` : undefined);

  if (!token || !fullName) {
    throw new Error("Missing Gitee repository info or GITEE_CONTENT_TOKEN");
  }

  const url = new URL(`https://gitee.com/api/v5/repos/${fullName}/contents/${filePath}`);
  url.searchParams.set("ref", ref);

  const response = await fetch(url, {
    headers: giteeHeaders(token),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Gitee content fetch failed for ${filePath}: ${response.status}`);
  }

  const payload = (await response.json()) as { content?: string; encoding?: string };

  if (payload.encoding !== "base64" || typeof payload.content !== "string") {
    throw new Error(`Gitee content payload is invalid for ${filePath}`);
  }

  return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8");
}

export async function buildSourceFilesFromProviderPayload(
  provider: Provider,
  payload: GithubPushPayload | GiteePushPayload
): Promise<ProviderFileChanges> {
  const ref = payload.after;
  const { upsertPaths, deletedPaths } = collectChangedPaths(payload.commits);

  if (!ref) {
    throw new Error("Push payload is missing commit sha");
  }

  if (provider === "github") {
    return {
      deletedPaths,
      upserts: await Promise.all(
        upsertPaths.map(async (filePath) => ({
          path: filePath,
          content: await fetchGithubFileContent((payload as GithubPushPayload).repository ?? {}, ref, filePath)
        }))
      )
    };
  }

  if (provider === "gitee") {
    return {
      deletedPaths,
      upserts: await Promise.all(
        upsertPaths.map(async (filePath) => ({
          path: filePath,
          content: await fetchGiteeFileContent((payload as GiteePushPayload).repository ?? {}, ref, filePath)
        }))
      )
    };
  }

  if (provider === "manual") {
    return {
      upserts: [],
      deletedPaths
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

export function detectProvider(headers: Headers, payload: unknown): Provider {
  if (headers.get("x-github-event")) {
    return "github";
  }

  if (headers.get("x-gitee-event")) {
    return "gitee";
  }

  if (payload && typeof payload === "object" && "provider" in payload) {
    const provider = (payload as { provider?: string }).provider;
    if (provider === "github" || provider === "gitee" || provider === "manual") {
      return provider;
    }
  }

  return "manual";
}

export function verifyWebhookSignature(headers: Headers, rawBody: string) {
  const sharedSecret = process.env.CONTENT_SYNC_SECRET;

  if (!sharedSecret) {
    return;
  }

  const safeCompare = (left: string, right: string) => {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
  };

  const manualSecret = headers.get("x-portal-secret");
  if (manualSecret && safeCompare(manualSecret, sharedSecret)) {
    return;
  }

  const githubSignature = headers.get("x-hub-signature-256");
  if (githubSignature) {
    const digest = `sha256=${crypto.createHmac("sha256", sharedSecret).update(rawBody).digest("hex")}`;
    if (safeCompare(githubSignature, digest)) {
      return;
    }
  }

  const giteeToken = headers.get("x-gitee-token");
  if (giteeToken && safeCompare(giteeToken, sharedSecret)) {
    return;
  }

  throw new Error("Webhook signature verification failed");
}
