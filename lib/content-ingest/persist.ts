import fs from "node:fs/promises";
import path from "node:path";

import type { InvalidationRecord, SyncManifest, SyncManifestEntry, ValidatedContentUnit } from "./types";

const contentRoot = path.join(process.cwd(), "content");
const manifestPath = path.join(contentRoot, ".sync-manifest.json");

async function removeFileIfExists(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function removeDirectoryIfExists(dirPath: string) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

export async function readManifest(): Promise<SyncManifest> {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SyncManifest>;

    if (parsed.version !== 2 || typeof parsed.entries !== "object" || !parsed.entries) {
      return { version: 2, entries: {} };
    }

    return {
      version: 2,
      entries: parsed.entries as SyncManifest["entries"]
    };
  } catch {
    return { version: 2, entries: {} };
  }
}

export async function writeManifest(manifest: SyncManifest) {
  await fs.mkdir(contentRoot, { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

export async function persistPortalContent(
  unit: ValidatedContentUnit,
  content: string,
  manifest: SyncManifest
) {
  const previous = manifest.entries[unit.sourcePath];

  if (previous && previous.contentPath !== unit.targetContentPath) {
    await removeFileIfExists(previous.contentPath);
  }

  if (previous && previous.assetRoot !== unit.targetAssetRoot) {
    await removeDirectoryIfExists(previous.assetRoot);
  }

  await fs.mkdir(path.dirname(unit.targetContentPath), { recursive: true });
  await fs.writeFile(unit.targetContentPath, content, "utf8");

  const entry: SyncManifestEntry = {
    contentPath: unit.targetContentPath,
    assetRoot: unit.targetAssetRoot,
    type: unit.type,
    locale: unit.locale,
    slug: unit.slug
  };

  manifest.entries[unit.sourcePath] = entry;

  return {
    targetPath: unit.targetContentPath,
    invalidation: {
      type: unit.type,
      locale: unit.locale,
      slug: unit.slug
    } satisfies InvalidationRecord
  };
}

export async function deletePortalContent(sourcePath: string, manifest: SyncManifest) {
  const entry = manifest.entries[sourcePath];

  if (!entry) {
    return null;
  }

  await removeFileIfExists(entry.contentPath);
  await removeDirectoryIfExists(entry.assetRoot);
  delete manifest.entries[sourcePath];

  return {
    targetPath: entry.contentPath,
    invalidation: {
      type: entry.type,
      locale: entry.locale,
      slug: entry.slug
    } satisfies InvalidationRecord
  };
}
