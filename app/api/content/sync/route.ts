import { NextResponse } from "next/server";

import {
  buildSourceFilesFromProviderPayload,
  detectProvider,
  syncContentChanges,
  verifyWebhookSignature
} from "@/lib/content-sync";

export const runtime = "nodejs";

type ProviderPayload = {
  after?: string;
  commits?: Array<{
    added?: string[];
    modified?: string[];
    removed?: string[];
  }>;
  repository?: Record<string, unknown>;
};

type ManualSyncPayload = {
  provider?: "manual";
  dryRun?: boolean;
  files?: Array<{
    path?: string;
    content?: string;
  }>;
  deletedPaths?: string[];
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    verifyWebhookSignature(request.headers, rawBody);

    const payload = rawBody ? (JSON.parse(rawBody) as ManualSyncPayload) : {};
    const provider = detectProvider(request.headers, payload);
    const dryRun = Boolean(payload.dryRun);

    const changes =
      provider === "manual"
        ? {
            upserts: (payload.files ?? [])
              .filter((file): file is { path: string; content: string } => {
                return typeof file.path === "string" && typeof file.content === "string";
              })
              .map((file) => ({
                path: file.path,
                content: file.content
              })),
            deletedPaths: (payload.deletedPaths ?? []).filter(
              (filePath): filePath is string => typeof filePath === "string"
            )
          }
        : await buildSourceFilesFromProviderPayload(provider, payload as ProviderPayload);

    if (!changes.upserts.length && !changes.deletedPaths.length) {
      return NextResponse.json({
        ok: true,
        provider,
        message: "No eligible markdown changes found in this request",
        results: []
      });
    }

    const results = dryRun
      ? [
          ...changes.upserts.map((file) => ({
            sourcePath: file.path,
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
