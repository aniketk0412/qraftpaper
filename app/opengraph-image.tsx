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
            {/* Same Q geometry as components/logo.tsx + app/icon.svg +
                app/apple-icon.tsx (ring cx10.8/cy11/r7, tail crossing the
                lower-right perimeter). A real SVG path so the tail extends
                OUTSIDE the ring and reads as a Q — the old div-rectangle
                tail sat inside and read as a stub. */}
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
              <circle
                cx="10.8"
                cy="11"
                r="7"
                stroke="#f1faee"
                strokeWidth="2.8"
              />
              <path
                d="M14.8 15.2 L19.2 19.6"
                stroke="#5fb3b3"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>
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
            AI exam-prep for college students
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
            Mock exams from your own syllabus.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "26px", color: "#9db0bb" }}>
          Mock papers + timed MCQ quizzes from your syllabus and PYQs.
        </div>
      </div>
    ),
    { ...size },
  );
}
