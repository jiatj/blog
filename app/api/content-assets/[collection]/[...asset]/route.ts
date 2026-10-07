import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const imageTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function notFound() {
  // A missing image may be uploaded immediately after this request.
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collection: string; asset: string[] }> }
) {
  const { collection, asset } = await params;
  if (
    !["posts", "tools"].includes(collection) || asset.length < 2 ||
    asset.some((part) => !part || part.startsWith(".") || /[\\/\x00:]/.test(part))
  ) return notFound();

  const contentType = imageTypes[path.extname(asset[asset.length - 1]).toLowerCase()];
  if (!contentType) return notFound();

  try {
    // Permit a persistent collection directory, but prevent nested links escaping it.
    const root = await fs.realpath(path.join(process.cwd(), "public", collection));
    const target = await fs.realpath(path.join(root, ...asset));
    const relative = path.relative(root, target);
    if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      return notFound();
    }
    if (!(await fs.stat(target)).isFile()) return notFound();

    const bytes = await fs.readFile(target);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox"
      }
    });
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) {
      return notFound();
    }
    throw error;
  }
}
