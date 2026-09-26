import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const bytes = await readFile(path.join(process.cwd(), "public", "brand", "abl-icon.png"));
  const src = `data:image/png;base64,${bytes.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: 64, height: 64, borderRadius: 16, overflow: "hidden", background: "#0f0f12", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img alt="" src={src} style={{ width: 116, height: 116, flexShrink: 0 }} />
    </div>,
    size
  );
}
