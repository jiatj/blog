import { NextResponse } from "next/server";

import {
  buildSourceFilesFromProviderPayload,
  detectProvider,
  syncContentChanges,
  verifyWebhookSignature,
  type ManualSyncPayload,
  type ProviderPayload
} from "@/lib/content-ingest";
import { revalidateIngestPaths } from "@/lib/content-ingest/revalidate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    verifyWebhookSignature(request.headers, rawBody);

    const payload = rawBody ? (JSON.parse(rawBody) as ManualSyncPayload) : {};
    const provider = detectProvider(request.headers, payload);
    const dryRun = Boolean(payload.dryRun);

    const changes = await buildSourceFilesFromProviderPayload(
      provider,
      payload as ProviderPayload | ManualSyncPayload
    );

    if (!changes.upserts.length && !changes.deletedPaths.length) {
      return NextResponse.json({
        ok: true,
        provider,
        message: "No eligible markdown changes found in this request",
        results: []
      });
    }

    const execution = dryRun
      ? [
          ...changes.upserts.map((file) => ({
            sourcePath: file.sourcePath,
            status: "pending",
            reason: "dryRun enabled for upsert"
          })),
          ...changes.deletedPaths.map((filePath) => ({
            sourcePath: filePath,
            status: "pending",
            reason: "dryRun enabled for delete"
          }))
        ]
      : await syncContentChanges(changes);
    const results = Array.isArray(execution) ? execution : execution.results;
    const revalidatedPaths = Array.isArray(execution) ? [] : revalidateIngestPaths(execution.invalidations);

    return NextResponse.json({
      ok: true,
      provider,
      dryRun,
      total: changes.upserts.length + changes.deletedPaths.length,
      upserts: changes.upserts.length,
      deletions: changes.deletedPaths.length,
      synced: results.filter((item) => item.status === "synced").length,
      deleted: results.filter((item) => item.status === "deleted").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      notFound: results.filter((item) => item.status === "not_found").length,
      errors: results.filter((item) => item.status === "error").length,
      revalidatedPaths,
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Content sync failed"
      },
      { status: 400 }
    );
  }
}
