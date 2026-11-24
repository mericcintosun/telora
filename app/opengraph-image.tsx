import { ImageResponse } from "next/og";

export const alt = "Telora: see your poster from across the hallway, before you print it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image generation cannot read CSS variables, so the IDENTITY.md palette is repeated here.
const GROUND = "#fff4ec";
const INK = "#24122e";
const ACCENT = "#c81f73";
const SECOND = "#ff9a62";
const LINE = "#f0c9b8";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 80,
          background: `radial-gradient(circle at 10% 0%, ${SECOND}, ${GROUND} 60%)`,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -3, color: ACCENT }}>Telora</div>
          <div style={{ fontSize: 40, lineHeight: 1.25, marginTop: 20 }}>
            Upload a poster, say where it hangs. See which line goes unreadable, and at how many metres.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 300,
            height: 424,
            borderRadius: 28,
            background: GROUND,
            border: `4px solid ${LINE}`,
            padding: 32,
            gap: 22,
          }}
        >
          <div style={{ display: "flex", height: 44, width: 236, borderRadius: 14, background: INK }} />
          <div style={{ display: "flex", height: 22, width: 170, borderRadius: 11, background: INK, opacity: 0.7 }} />
          <div style={{ display: "flex", height: 14, width: 120, borderRadius: 7, background: INK, opacity: 0.45 }} />
          <div style={{ display: "flex", height: 9, width: 70, borderRadius: 5, background: INK, opacity: 0.25 }} />
          <div style={{ display: "flex", marginTop: "auto", height: 60, width: 60, borderRadius: 16, background: ACCENT }} />
        </div>
      </div>
    ),
    size
  );
}
