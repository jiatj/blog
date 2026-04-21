import fs from "node:fs/promises";
import path from "node:path";

import type { DiscoveredAsset, SourceAssetLoader, ValidatedContentUnit } from "./types";

const markdownImagePattern = /!\[[^\]]*]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
const htmlImagePattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

function normalizeRelativeAssetPath(reference: string) {
  const trimmed = reference.trim().replace(/^<|>$/g, "");

  if (!trimmed.startsWith("./")) {
    return null;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return null;
  }

  const relativePath = path.posix.normalize(trimmed.slice(2));

  if (!relativePath || relativePath.startsWith("../") || relativePath === "..") {
    throw new Error(`Asset reference "${reference}" escapes the content unit directory`);
  }

  return relativePath;
}

function makeDiscoveredAsset(
  unit: ValidatedContentUnit,
  originalReference: string,
  relativePath: string,
  kind: DiscoveredAsset["kind"]
) {
  return {
    kind,
    originalReference,
    relativePath,
    publicPath: `${unit.publicBasePath}/${relativePath}`,
    sourcePath: `${unit.sourceDirectory}/${relativePath}`,
    targetPath: path.join(unit.targetAssetRoot, relativePath)
  } satisfies DiscoveredAsset;
}

export function discoverAssets(unit: ValidatedContentUnit) {
  const assets = new Map<string, DiscoveredAsset>();
  const addAsset = (reference: string, kind: DiscoveredAsset["kind"]) => {
    const relativePath = normalizeRelativeAssetPath(reference);

    if (!relativePath) {
      return;
    }

    const key = `${kind}:${relativePath}`;

    if (!assets.has(key)) {
      assets.set(key, makeDiscoveredAsset(unit, reference, relativePath, kind));
    }
  };

  addAsset(unit.cover, "cover");

  for (const match of unit.body.matchAll(markdownImagePattern)) {
    const target = match[1];
    if (target) {
      addAsset(target, "markdown-image");
    }
  }

  for (const match of unit.body.matchAll(htmlImagePattern)) {
    const target = match[1];
    if (target) {
      addAsset(target, "html-image");
    }
  }

  return [...assets.values()];
}

async function ensureParentDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function replaceAssetDirectory(targetRoot: string) {
  await fs.rm(targetRoot, { recursive: true, force: true });
  await fs.mkdir(targetRoot, { recursive: true });
}

export async function copyAssets(
  unit: ValidatedContentUnit,
  assets: DiscoveredAsset[],
  loader: SourceAssetLoader
) {
  await replaceAssetDirectory(unit.targetAssetRoot);

  for (const asset of assets) {
    let binary: Buffer;

    try {
      binary = await loader.readBinary(asset.sourcePath);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown asset read error";
      throw new Error(`Asset "${asset.relativePath}" could not be loaded for ${unit.sourcePath}: ${reason}`);
    }

    await ensureParentDirectory(asset.targetPath);
    await fs.writeFile(asset.targetPath, binary);
  }
}
