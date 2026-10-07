import { readBuildOutput } from "@/lib/build/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; artifact: string; asset: string[] }> }) {
  const { locale, artifact, asset } = await params;
  if (locale !== "zh" && locale !== "en") return new Response(null, { status: 404 });
  const output = await readBuildOutput(locale, artifact, asset.join("/"));
  if (!output) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(output.data), { headers: {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(output.name).replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)}`,
    "Content-Length": String(output.data.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"
  } });
}
