import { ImageResponse } from "next/og";
import { OG, ogGridUri, ogBackground, loadOgFonts, OgBrandHeader } from "@/lib/og";

export const alt = "QraftPaper — mock exams from your own syllabus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social card. Light "ivory paper" theme (the site's default) — a warm
// card reads brighter against the dark backgrounds of WhatsApp/iMessage/Discord
// than a dark card does. Mirrors the landing hero: graph-paper grid, headline
// on the left, and a stylised mock-paper card on the right, so a shared link
// previews what QraftPaper actually makes. Shared OG primitives (colours, grid,
// font loader, brand header) live in lib/og.tsx.

const { INK, MUTED, SUBTLE, TEAL, TEAL_SOFT, LINE } = OG;

const rows = [
  { n: "01", text: "Define an abstract data type with one example.", marks: "2m", unit: "Unit I" },
  { n: "02", text: "Construct an AVL tree for 30, 20, 40, 10, 25.", marks: "10m", unit: "Unit III" },
  { n: "03", text: "Compare separate chaining vs. open addressing.", marks: "10m", unit: "Unit IV" },
];

export default async function OpengraphImage() {
  const fonts = await loadOgFonts();

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
          background: ogBackground,
          padding: "60px 64px",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        {/* Graph-paper grid */}
        <img width={1200} height={630} src={ogGridUri} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Header — Q mark + wordmark */}
        {OgBrandHeader({ wordmarkSize: 34 })}

        {/* Body — headline left, mock-paper card right */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "44px" }}>
          {/* Left: copy */}
          <div style={{ display: "flex", flexDirection: "column", width: "600px" }}>
            <div
              style={{
                display: "flex",
                fontSize: "19px",
                fontWeight: 600,
                letterSpacing: "5px",
                textTransform: "uppercase",
                color: TEAL,
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
                color: INK,
              }}
            >
              <div style={{ display: "flex" }}>Practice on papers</div>
              <div style={{ display: "flex" }}>that feel like</div>
              <div style={{ display: "flex", color: TEAL }}>the real exam.</div>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "26px",
                fontSize: "23px",
                lineHeight: 1.4,
                color: MUTED,
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
              background: "#fbf8f1",
              border: `1px solid ${LINE}`,
              boxShadow: "0 34px 70px -28px rgba(20,32,46,0.4)",
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
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: "18px", fontWeight: 600, color: INK }}>
                  Data Structures &amp; Algorithms
                </div>
                <div style={{ display: "flex", fontSize: "12px", letterSpacing: "1px", color: SUBTLE, marginTop: "4px" }}>
                  CS-204 · END-SEM · 70 MARKS
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  borderRadius: "999px",
                  border: "1px solid rgba(31,125,125,0.35)",
                  background: "rgba(31,125,125,0.1)",
                  padding: "5px 11px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: TEAL,
                }}
              >
                <div style={{ display: "flex", width: "7px", height: "7px", borderRadius: "999px", background: TEAL_SOFT }} />
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
                    border: `1px solid ${LINE}`,
                    background: "#ffffff",
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
                      background: "rgba(31,125,125,0.12)",
                      color: TEAL,
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {r.n}
                  </div>
                  <div style={{ display: "flex", flex: 1, fontSize: "14px", color: "#2c3e4c", lineHeight: 1.3 }}>
                    {r.text}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", fontSize: "12px", fontWeight: 600, color: MUTED }}>{r.marks}</div>
                    <div style={{ display: "flex", fontSize: "10px", letterSpacing: "1px", color: SUBTLE, marginTop: "2px" }}>
                      {r.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* progress */}
            <div style={{ display: "flex", flexDirection: "column", marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, letterSpacing: "1px" }}>
                <span style={{ color: MUTED }}>FINALISING PAPER</span>
                <span style={{ color: TEAL }}>100%</span>
              </div>
              <div style={{ display: "flex", height: "6px", borderRadius: "999px", background: "rgba(26,35,50,0.08)", marginTop: "8px" }}>
                <div style={{ display: "flex", width: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #1f7d7d, #46b3b3)" }} />
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
            color: MUTED,
          }}
        >
          <div style={{ display: "flex" }}>
            Mock papers + MCQ quizzes · Matched to your blueprint · PDF &amp; Word export
          </div>
          <div style={{ display: "flex", fontWeight: 700, color: TEAL }}>qraftpaper.vercel.app</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
