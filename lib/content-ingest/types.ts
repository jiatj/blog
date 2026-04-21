import type { Locale } from "@/lib/site-config";

export type IngestContentType = "post" | "tool";
export type Provider = "github" | "gitee" | "manual";

export type RawSyncFrontmatter = {
  title?: string;
  slug?: string;
  type?: IngestContentType;
  contentType?: IngestContentType;
  locale?: Locale;
  status?: string;
  summary?: string;
  date?: string | Date;
  updated?: string | Date;
  cover?: string;
  draft?: boolean;
  tags?: string[];
  toolStatus?: string;
  toolUrl?: string;
  repoUrl?: string;
  logo?: string;
  homeActionLabel?: string;
  homeFeatured?: boolean;
  homeOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  syncToPortal?: boolean;
};

export type SourceTextFile = {
  path: string;
  content: string;
};

export type SourceBinaryFile = {
  path: string;
  contentBase64: string;
};

export type SourceAssetLoader = {
  readText: (filePath: string) => Promise<string>;
  readBinary: (filePath: string) => Promise<Buffer>;
};

export type IngestUpsert = {
  sourcePath: string;
  content: string;
  assetLoader: SourceAssetLoader;
};

export type IngestChanges = {
  upserts: IngestUpsert[];
  deletedPaths: string[];
};

export type ProviderFileChanges = IngestChanges;

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

export type InvalidationRecord = {
  type: IngestContentType;
  locale: Locale;
  slug: string;
};

export type SyncManifestEntry = {
  contentPath: string;
  assetRoot: string;
  type: IngestContentType;
  locale: Locale;
  slug: string;
};

export type SyncManifest = {
  version: 2;
  entries: Record<string, SyncManifestEntry>;
};

export type SyncExecution = {
  results: SyncResult[];
  invalidations: InvalidationRecord[];
};

export type ValidatedContentUnit = {
  sourcePath: string;
  sourceDirectory: string;
  sourceFileBaseName: string;
  type: IngestContentType;
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
  status: string;
  date: string;
  updated: string;
  cover: string;
  body: string;
  rawFrontmatter: RawSyncFrontmatter;
  draft: boolean;
  targetContentPath: string;
  targetAssetRoot: string;
  publicBasePath: string;
};

export type DiscoveredAsset = {
  kind: "cover" | "markdown-image" | "html-image";
  originalReference: string;
  relativePath: string;
  publicPath: string;
  sourcePath: string;
  targetPath: string;
};
