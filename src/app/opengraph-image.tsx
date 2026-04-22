import { ImageResponse } from "next/og";

// Next.js 16 reads these named exports and wires OG meta automatically.
export const runtime = "nodejs";
export const alt = "랜덤한끼 — 지금 내 위치에서 한 집, 고민 없이";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori (the engine behind ImageResponse) requires every div with more than
// one child to set display:flex explicitly — it does not inherit browser
// defaults. Keep styles flat + flex-first below.
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5EFE6",
          backgroundImage:
            "radial-gradient(ellipse at 20% 10%, rgba(200,16,46,0.08), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(107,142,78,0.08), transparent 60%)",
          fontFamily: "'Noto Sans KR', sans-serif",
          padding: 80,
          position: "relative",
        }}
      >
        {/* Hanko corner mark — top-left */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 72,
            width: 56,
            height: 56,
            borderRadius: 10,
            backgroundColor: "#C8102E",
            color: "#FAF6EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          推
        </div>

        {/* Kicker tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 8,
            color: "rgba(200,16,46,0.78)",
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
ランダム · 旅メシ · 오늘의 한 집
        </div>

        {/* Giraffe + wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 120, lineHeight: 1 }}>
            🦒
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 180,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -4,
              color: "#2B2B2B",
            }}
          >
            랜덤
            <span style={{ color: "#C8102E" }}>한끼</span>
          </div>
        </div>

        {/* Hand-drawn rule */}
        <div
          style={{
            display: "flex",
            width: 360,
            height: 2,
            backgroundImage:
              "linear-gradient(90deg, transparent, rgba(43,43,43,0.35) 30%, rgba(43,43,43,0.35) 70%, transparent)",
            marginTop: 16,
            marginBottom: 28,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 38,
            fontWeight: 500,
            color: "#4A4A4A",
            letterSpacing: -1,
          }}
        >
          지금 내 위치에서{"  "}
          <span style={{ color: "#2B2B2B", fontWeight: 800, margin: "0 8px" }}>
            한 집만
          </span>
          {"  "}고민 없이.
        </div>

        {/* Footer URL + pill */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(43,43,43,0.08)",
              color: "#4A4A4A",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            🍽️ food · ☕ cafe · 🗺 한국 · 일본
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
