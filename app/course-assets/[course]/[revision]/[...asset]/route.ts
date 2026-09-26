import path from "node:path";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { readCourseAsset } from "@/lib/courses/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const imageTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ course: string; revision: string; asset: string[] }> },
) {
  const { course, revision, asset } = await params;
  const file = await readCourseAsset(course, revision, asset);
  if (!file) return new Response("Not found", { status: 404 });
  const imageType = imageTypes[path.extname(file.name).toLowerCase()];
  const stream = Readable.toWeb(
    createReadStream(file.path),
  ) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: {
      "Content-Type": imageType || "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": `${imageType ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
