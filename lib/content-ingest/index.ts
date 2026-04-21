import crypto from "node:crypto";

import { copyAssets, discoverAssets } from "./assets";
import { validateFrontmatter } from "./frontmatter";
import { deletePortalContent, persistPortalContent, readManifest, writeManifest } from "./persist";
import { buildPortalContent } from "./rewrite";
import {
  buildSourceFilesFromProviderPayload,
  type ManualSyncPayload,
  type ProviderPayload
} from "./source";
import type { IngestChanges, Provider, SyncExecution, SyncResult } from "./types";

export type { ManualSyncPayload, ProviderPayload } from "./source";
export type { Provider, SyncResult } from "./types";
export { buildSourceFilesFromProviderPayload } from "./source";

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

async function syncUpsert(change: IngestChanges["upserts"][number], manifest: Awaited<ReturnType<typeof readManifest>>) {
  const unit = validateFrontmatter(change.sourcePath, change.content);
  const assets = discoverAssets(unit);
  await copyAssets(unit, assets, change.assetLoader);
  const finalContent = buildPortalContent(unit, assets);
  const persisted = await persistPortalContent(unit, finalContent, manifest);

  return {
    result: {
      sourcePath: unit.sourcePath,
      status: "synced",
      targetPath: persisted.targetPath
    } satisfies SyncResult,
    invalidation: persisted.invalidation
  };
}

async function syncDelete(sourcePath: string, manifest: Awaited<ReturnType<typeof readManifest>>) {
  const deleted = await deletePortalContent(sourcePath.trim().replace(/\\/g, "/"), manifest);

  if (!deleted) {
    return {
      result: {
        sourcePath,
        status: "not_found",
        reason: "No synced target found in manifest for this source file"
      } satisfies SyncResult
    };
  }

  return {
    result: {
      sourcePath,
      status: "deleted",
      targetPath: deleted.targetPath
    } satisfies SyncResult,
    invalidation: deleted.invalidation
  };
}

export async function syncContentChanges(changes: IngestChanges): Promise<SyncExecution> {
  const manifest = await readManifest();
  const results: SyncResult[] = [];
  const invalidations: SyncExecution["invalidations"] = [];

  for (const upsert of changes.upserts) {
    try {
      const synced = await syncUpsert(upsert, manifest);
      results.push(synced.result);
      invalidations.push(synced.invalidation);
    } catch (error) {
      results.push({
        sourcePath: upsert.sourcePath,
        status: "error",
        reason: error instanceof Error ? error.message : "Unknown ingest error"
      });
    }
  }

  for (const sourcePath of changes.deletedPaths) {
    try {
      const deleted = await syncDelete(sourcePath, manifest);
      results.push(deleted.result);
      if (deleted.invalidation) {
        invalidations.push(deleted.invalidation);
      }
    } catch (error) {
      results.push({
        sourcePath,
        status: "error",
        reason: error instanceof Error ? error.message : "Unknown delete ingest error"
      });
    }
  }

  await writeManifest(manifest);

  return {
    results,
    invalidations
  };
}
