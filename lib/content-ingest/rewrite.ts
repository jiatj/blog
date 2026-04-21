import matter from "gray-matter";

import type { DiscoveredAsset, RawSyncFrontmatter, ValidatedContentUnit } from "./types";

const markdownImagePattern = /!\[[^\]]*]\((<[^>]+>|[^)\s]+)((?:\s+["'][^"']*["'])?)\)/g;
const htmlImagePattern = /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi;

function normalizeReference(reference: string) {
  return reference.trim().replace(/^<|>$/g, "");
}

function assetLookup(assets: DiscoveredAsset[]) {
  const map = new Map<string, string>();

  for (const asset of assets) {
    map.set(normalizeReference(asset.originalReference), asset.publicPath);
  }

  return map;
}

export function rewriteBodyAssetPaths(body: string, assets: DiscoveredAsset[]) {
  const lookup = assetLookup(assets);

  const rewrittenMarkdown = body.replace(markdownImagePattern, (full, target: string, suffix = "") => {
    const rewritten = lookup.get(normalizeReference(target));
    return rewritten ? full.replace(target, rewritten).replace(suffix, suffix) : full;
  });

  return rewrittenMarkdown.replace(htmlImagePattern, (full, prefix: string, target: string, suffix: string) => {
    const rewritten = lookup.get(normalizeReference(target));
    return rewritten ? `${prefix}${rewritten}${suffix}` : full;
  });
}

export function buildPortalContent(unit: ValidatedContentUnit, assets: DiscoveredAsset[]) {
  const rewrittenBody = rewriteBodyAssetPaths(unit.body, assets);
  const coverAsset = assets.find((asset) => asset.kind === "cover" && asset.originalReference === unit.cover);
  const nextFrontmatter: RawSyncFrontmatter = {
    ...unit.rawFrontmatter,
    type: unit.type,
    contentType: unit.type,
    locale: unit.locale,
    slug: unit.slug,
    title: unit.title,
    summary: unit.summary,
    status: unit.status,
    date: unit.date,
    updated: unit.updated,
    cover: coverAsset?.publicPath ?? unit.cover,
    draft: unit.draft
  };

  delete nextFrontmatter.syncToPortal;

  return matter.stringify(rewrittenBody, nextFrontmatter);
}
