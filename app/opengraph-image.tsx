import { ImageResponse } from "next/og";

export const alt = "QraftPaper — mock exams from your own syllabus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social card. Mirrors the landing hero so a shared link previews the
// actual product: the enhanced graph-paper grid, headline on the left, and a
// stylised "mock paper" card on the right. Built with next/og (Satori), so
// every container sets display:flex and the grid ships as an inline SVG data
// URI (Satori doesn't tile CSS background grids reliably).
const gridSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
  <defs>
    <pattern id='minor' width='40' height='40' patternUnits='userSpaceOnUse'>
      <path d='M40 0H0V40' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/>
    </pattern>
    <pattern id='major' width='200' height='200' patternUnits='userSpaceOnUse'>
      <path d='M200 0H0V200' fill='none' stroke='rgba(95,196,196,0.12)' stroke-width='1.2'/>
    </pattern>
  </defs>
  <rect width='1200' height='630' fill='url(#minor)'/>
  <rect width='1200' height='630' fill='url(#major)'/>
</svg>`;
const gridUri = `data:image/svg+xml;utf8,${encodeURIComponent(gridSvg)}`;

const rows = [
  { n: "01", text: "Define an abstract data type with one example.", marks: "2m", unit: "Unit I" },
  { n: "02", text: "Construct an AVL tree for 30, 20, 40, 10, 25.", marks: "10m", unit: "Unit III" },
  { n: "03", text: "Compare separate chaining vs. open addressing.", marks: "10m", unit: "Unit IV" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(820px 520px at 86% 0%, rgba(45,139,139,0.35), transparent 60%), radial-gradient(640px 420px at 0% 100%, rgba(70,179,179,0.14), transparent 60%), #0b121a",
          padding: "60px 64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Graph-paper grid */}
        <img
          width={1200}
          height={630}
          src={gridUri}
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {/* Header — Q mark + wordmark */}
        <div
          style={{ position: "relative", display: "flex", alignItems: "center", gap: "18px" }}
        >
          <div
            style={{
              display: "flex",
              width: "60px",
              height: "60px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              background: "#0e1620",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="qtail" x1="14" y1="15" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#5fc4c4" />
                  <stop offset="1" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <circle cx="10.8" cy="11" r="7" stroke="#f1faee" strokeWidth="2.8" />
              <path d="M14.8 15.2 L19.2 19.6" stroke="url(#qtail)" strokeWidth="3.6" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 700, color: "#ffffff" }}>
            Qraft<span style={{ color: "#9db0bb" }}>Paper</span>
          </div>
        </div>

        {/* Body — headline left, mock-paper card right */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "44px",
          }}
        >
          {/* Left: copy */}
          <div style={{ display: "flex", flexDirection: "column", width: "600px" }}>
            <div
              style={{
                display: "flex",
                fontSize: "19px",
                letterSpacing: "5px",
                textTransform: "uppercase",
                color: "#5fc4c4",
                marginBottom: "22px",
              }}
            >
              AI exam-prep platform
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: "58px",
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#eef3f5",
              }}
            >
              <div style={{ display: "flex" }}>Practice on papers</div>
              <div style={{ display: "flex" }}>that feel like</div>
              <div style={{ display: "flex", color: "#5fc4c4" }}>the real exam.</div>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "26px",
                fontSize: "23px",
                lineHeight: 1.4,
                color: "#9db0bb",
                maxWidth: "560px",
              }}
            >
              Upload your syllabus + last year&apos;s paper. Get a mock paper in under a minute.
            </div>
          </div>

          {/* Right: mock-paper card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "416px",
              borderRadius: "20px",
              background: "#0e1620",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 34px 70px -24px rgba(0,0,0,0.7)",
              padding: "22px",
            }}
          >
            {/* card header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: "18px", fontWeight: 600, color: "#eef3f5" }}>
                  Data Structures &amp; Algorithms
                </div>
                <div style={{ display: "flex", fontSize: "12px", letterSpacing: "1px", color: "#6e8390", marginTop: "4px" }}>
                  CS-204 · END-SEM · 70 MARKS
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  borderRadius: "999px",
                  border: "1px solid rgba(95,196,196,0.4)",
                  background: "rgba(70,179,179,0.12)",
                  padding: "5px 11px",
                  fontSize: "12px",
                  color: "#8ad8d8",
                }}
              >
                <div style={{ display: "flex", width: "7px", height: "7px", borderRadius: "999px", background: "#5fc4c4" }} />
                Generating
              </div>
            </div>

            {/* question rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              {rows.map((r) => (
                <div
                  key={r.n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.015)",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "30px",
                      height: "30px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      background: "rgba(70,179,179,0.18)",
                      color: "#8ad8d8",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {r.n}
                  </div>
                  <div style={{ display: "flex", flex: 1, fontSize: "14px", color: "#cdd9df", lineHeight: 1.3 }}>
                    {r.text}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", fontSize: "12px", color: "#9db0bb" }}>{r.marks}</div>
                    <div style={{ display: "flex", fontSize: "10px", letterSpacing: "1px", color: "#6e8390", marginTop: "2px" }}>
                      {r.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* progress */}
            <div style={{ display: "flex", flexDirection: "column", marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", letterSpacing: "1px" }}>
                <span style={{ color: "#9db0bb" }}>FINALISING PAPER</span>
                <span style={{ color: "#8ad8d8" }}>100%</span>
              </div>
              <div style={{ display: "flex", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", marginTop: "8px" }}>
                <div style={{ display: "flex", width: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #2d8b8b, #5fc4c4)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer — capability strip + URL */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "19px",
            color: "#9db0bb",
          }}
        >
          <div style={{ display: "flex" }}>
            Mock papers + MCQ quizzes · Matched to your blueprint · PDF &amp; Word export
          </div>
          <div style={{ display: "flex", fontWeight: 600, color: "#5fc4c4" }}>qraftpaper.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
