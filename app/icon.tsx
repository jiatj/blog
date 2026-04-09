import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "transparent",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#7898b8",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: "18px",
            color: "#f6f3ee",
            display: "flex",
            fontFamily: '"Arial Black", "Segoe UI", sans-serif',
            fontSize: 34,
            fontWeight: 900,
            height: 56,
            justifyContent: "center",
            letterSpacing: -2,
            lineHeight: 1,
            paddingBottom: 2,
            width: 56
          }}
        >
          <span>TJ.</span>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
