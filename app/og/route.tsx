import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#eef3fa", color: "#17335c", padding: "68px 80px" }}>
      <div style={{ display: "flex", fontSize: 28, letterSpacing: 5 }}>THINK · BUILD · SHIP</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", fontSize: 82, fontWeight: 700 }}>AI Builder Lab</div>
        <div style={{ display: "flex", fontSize: 32 }}>AI Applications · AI Coding · Real Projects</div>
      </div>
      <div style={{ display: "flex", fontSize: 24 }}>T.J. Jia · tiejunjia.com</div>
    </div>,
    { width: 1200, height: 630 }
  );
}
