import { ImageResponse } from "next/og";

export const alt = "QraftPaper - AI Question Paper Generation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social card: the QraftPaper "Q" mark + wordmark + tagline on deep navy.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(900px 500px at 78% -10%, rgba(45,139,139,0.35), transparent 60%), #14202e",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              width: "70px",
              height: "70px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "18px",
              background: "#0e1620",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "6px solid #f1faee",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "16px",
                bottom: "16px",
                width: "22px",
                height: "7px",
                borderRadius: "4px",
                background: "#5fb3b3",
                transform: "rotate(45deg)",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: "40px", fontWeight: 700, color: "#ffffff" }}>
            Qraft<span style={{ color: "#9db0bb" }}>Paper</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "#5fc4c4",
              marginBottom: "20px",
            }}
          >
            AI workspace for assessment design
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#eef3f5",
              maxWidth: "920px",
            }}
          >
            From syllabus to review-ready papers.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "26px", color: "#9db0bb" }}>
          Question papers and quizzes built for educator review.
        </div>
      </div>
    ),
    { ...size },
  );
}
