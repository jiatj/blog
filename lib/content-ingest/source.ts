import type { Locale } from "@/lib/site-config";

import type {
  IngestChanges,
  IngestContentType,
  IngestUpsert,
  Provider,
  SourceAssetLoader,
  SourceBinaryFile,
  SourceTextFile
} from "./types";

type GithubRepository = {
  full_name?: string;
  name?: string;
  owner?: {
    login?: string;
  };
};

type GiteeRepository = {
  full_name?: string;
  name?: string;
  namespace?: string;
  owner?: {
    login?: string;
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

export type ProviderPayload = GithubPushPayload | GiteePushPayload;

export type ManualSyncPayload = {
  provider?: "manual";
  dryRun?: boolean;
  files?: SourceTextFile[];
  attachments?: SourceBinaryFile[];
  deletedPaths?: string[];
};

type ContentUnitLocation = {
  collection: "posts" | "tools";
  type: IngestContentType;
  locale: Locale;
  slug: string;
  sourceDirectory: string;
  markdownCandidates: string[];
};

function normalizeSourcePath(sourcePath: string) {
  const normalized = sourcePath.trim().replace(/\\/g, "/");

  if (!normalized || normalized.startsWith("/") || normalized.includes("..")) {
    throw new Error(`Invalid source path: ${sourcePath}`);
  }

  return normalized;
}

function getAllowedPrefixes() {
  return (process.env.CONTENT_SYNC_ALLOWED_PREFIXES ?? "")
    .split(",")
    .map((prefix) => prefix.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
}

function isSourcePathAllowed(sourcePath: string) {
  const normalized = normalizeSourcePath(sourcePath);
  const allowedPrefixes = getAllowedPrefixes();

  if (!allowedPrefixes.length) {
    return true;
  }

  return allowedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

function resolveUnitLocation(changedPath: string): ContentUnitLocation | null {
  const normalized = normalizeSourcePath(changedPath);
  const segments = normalized.split("/");

  if (segments.length < 4) {
    return null;
  }

  const [collection, locale, slug] = segments;

  if ((collection !== "posts" && collection !== "tools") || (locale !== "zh" && locale !== "en")) {
    return null;
  }

  const sourceDirectory = `${collection}/${locale}/${slug}`;

  return {
    collection,
    type: collection === "posts" ? "post" : "tool",
    locale,
    slug,
    sourceDirectory,
    markdownCandidates: [`${sourceDirectory}/${slug}.mdx`, `${sourceDirectory}/${slug}.md`]
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

async function fetchGithubFileBuffer(repository: GithubRepository, ref: string, filePath: string) {
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

  if (payload.encoding === "base64" && typeof payload.content === "string") {
    return Buffer.from(payload.content.replace(/\n/g, ""), "base64");
  }

  const rawResponse = await fetch(url, {
    headers: {
      ...githubHeaders(token),
      Accept: "application/vnd.github.raw"
    },
    cache: "no-store"
  });

  if (!rawResponse.ok) {
    throw new Error(`GitHub raw content fetch failed for ${filePath}: ${rawResponse.status}`);
  }

  const rawBuffer = Buffer.from(await rawResponse.arrayBuffer());

  if (!rawBuffer.length) {
    throw new Error(`GitHub content payload is invalid for ${filePath}`);
  }

  return rawBuffer;
}

async function fetchGiteeFileBuffer(repository: GiteeRepository, ref: string, filePath: string) {
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

  return Buffer.from(payload.content.replace(/\n/g, ""), "base64");
}

function createProviderAssetLoader(provider: "github" | "gitee", payload: ProviderPayload, ref: string): SourceAssetLoader {
  if (provider === "github") {
    return {
      readText: async (filePath) => (await fetchGithubFileBuffer((payload as GithubPushPayload).repository ?? {}, ref, filePath)).toString("utf8"),
      readBinary: async (filePath) => fetchGithubFileBuffer((payload as GithubPushPayload).repository ?? {}, ref, filePath)
    };
  }

  return {
    readText: async (filePath) => (await fetchGiteeFileBuffer((payload as GiteePushPayload).repository ?? {}, ref, filePath)).toString("utf8"),
    readBinary: async (filePath) => fetchGiteeFileBuffer((payload as GiteePushPayload).repository ?? {}, ref, filePath)
  };
}

function createManualAssetLoader(payload: ManualSyncPayload): SourceAssetLoader {
  const fileMap = new Map((payload.files ?? []).map((file) => [normalizeSourcePath(file.path), file.content]));
  const assetMap = new Map(
    (payload.attachments ?? []).map((file) => [normalizeSourcePath(file.path), Buffer.from(file.contentBase64, "base64")])
  );

  return {
    readText: async (filePath) => {
      const normalized = normalizeSourcePath(filePath);
      const text = fileMap.get(normalized);

      if (typeof text === "string") {
        return text;
      }

      const binary = assetMap.get(normalized);
      if (binary) {
        return binary.toString("utf8");
      }

      throw new Error(`Manual ingest payload is missing file ${normalized}`);
    },
    readBinary: async (filePath) => {
      const normalized = normalizeSourcePath(filePath);
      const binary = assetMap.get(normalized);

      if (binary) {
        return binary;
      }

      const text = fileMap.get(normalized);
      if (typeof text === "string") {
        return Buffer.from(text, "utf8");
      }

      throw new Error(`Manual ingest payload is missing attachment ${normalized}`);
    }
  };
}

function collectChangedUnits(commits: CommitPayload[] = []) {
  const deletedPaths = new Set<string>();
  const upsertUnits = new Map<string, ContentUnitLocation>();

  for (const commit of commits) {
    const addedAndModified = [...(commit.added ?? []), ...(commit.modified ?? [])];
    const removed = commit.removed ?? [];

    for (const filePath of removed) {
      const unit = resolveUnitLocation(filePath);

      if (!unit || !isSourcePathAllowed(filePath)) {
        continue;
      }

      const normalized = normalizeSourcePath(filePath);

      if (unit.markdownCandidates.includes(normalized)) {
        deletedPaths.add(normalized);
        continue;
      }

      upsertUnits.set(unit.sourceDirectory, unit);
    }

    for (const filePath of addedAndModified) {
      const unit = resolveUnitLocation(filePath);

      if (!unit || !isSourcePathAllowed(filePath)) {
        continue;
      }

      upsertUnits.set(unit.sourceDirectory, unit);
    }
  }

  for (const [key, unit] of upsertUnits.entries()) {
    if (unit.markdownCandidates.some((candidate) => deletedPaths.has(candidate))) {
      upsertUnits.delete(key);
    }
  }

  return {
    deletedPaths: [...deletedPaths],
    units: [...upsertUnits.values()]
  };
}

async function loadUnitMarkdown(unit: ContentUnitLocation, loader: SourceAssetLoader) {
  for (const candidate of unit.markdownCandidates) {
    try {
      return {
        path: candidate,
        content: await loader.readText(candidate)
      };
    } catch {
      continue;
    }
  }

  throw new Error(`Source markdown file not found for content unit ${unit.sourceDirectory}`);
}

export async function buildSourceFilesFromProviderPayload(
  provider: Provider,
  payload: ProviderPayload | ManualSyncPayload
): Promise<IngestChanges> {
  if (provider === "manual") {
    const manualPayload = payload as ManualSyncPayload;
    const assetLoader = createManualAssetLoader(manualPayload);

    const upserts: IngestUpsert[] = (manualPayload.files ?? [])
      .filter((file) => isSourcePathAllowed(file.path))
      .map((file) => ({
        sourcePath: normalizeSourcePath(file.path),
        content: file.content,
        assetLoader
      }));

    return {
      upserts,
      deletedPaths: (manualPayload.deletedPaths ?? []).filter(isSourcePathAllowed).map(normalizeSourcePath)
    };
  }

  const providerPayload = payload as ProviderPayload;
  const ref = providerPayload.after;

  if (!ref) {
    throw new Error("Push payload is missing commit sha");
  }

  const assetLoader = createProviderAssetLoader(provider, providerPayload, ref);
  const { units, deletedPaths } = collectChangedUnits(providerPayload.commits);
  const loaded = await Promise.all(units.map((unit) => loadUnitMarkdown(unit, assetLoader)));

  return {
    deletedPaths,
    upserts: loaded.map((file) => ({
      sourcePath: file.path,
      content: file.content,
      assetLoader
    }))
  };
}
