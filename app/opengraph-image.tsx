import { ImageResponse } from "next/og";

export const alt = "QraftPaper — mock exams from your own syllabus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social card. Light "ivory paper" theme (the site's default) — a warm
// card reads brighter against the dark backgrounds of WhatsApp/iMessage/Discord
// than a dark card does. Mirrors the landing hero: enhanced graph-paper grid,
// headline on the left, and a stylised mock-paper card on the right, so a
// shared link previews what QraftPaper actually makes.
//
// Built with next/og (Satori): every container sets display:flex, the grid
// ships as an inline SVG data URI (Satori doesn't tile CSS grids reliably), and
// the real brand font (Plus Jakarta Sans) is loaded from bundled TTFs since
// Satori has no access to the app's next/font.

const INK = "#1a2332";
const MUTED = "#4a5f6f";
const SUBTLE = "#5a6c7a";
const TEAL = "#1f7d7d";
const TEAL_SOFT = "#2f9a9a";
const LINE = "rgba(26,35,50,0.12)";

const gridSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
  <defs>
    <pattern id='minor' width='40' height='40' patternUnits='userSpaceOnUse'>
      <path d='M40 0H0V40' fill='none' stroke='rgba(26,35,50,0.06)' stroke-width='1'/>
    </pattern>
    <pattern id='major' width='200' height='200' patternUnits='userSpaceOnUse'>
      <path d='M200 0H0V200' fill='none' stroke='rgba(31,125,125,0.13)' stroke-width='1.2'/>
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

// Real brand font (Plus Jakarta Sans). Fetched from the Fontsource CDN at
// generation time — Satori can't see the app's next/font, and the bundled-asset
// pattern (fetch(new URL(..., import.meta.url))) isn't supported by Turbopack.
// The result is cached by Vercel after the card is first generated.
const FONT = "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest";
const font = (weight: number) =>
  fetch(`${FONT}/latin-${weight}-normal.ttf`).then((r) => r.arrayBuffer());

export default async function OpengraphImage() {
  const [pjs400, pjs600, pjs700] = await Promise.all([font(400), font(600), font(700)]);

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
            "radial-gradient(820px 520px at 88% -6%, rgba(31,125,125,0.16), transparent 60%), radial-gradient(620px 420px at -4% 104%, rgba(31,125,125,0.10), transparent 60%), #ece5d8",
          padding: "60px 64px",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        {/* Graph-paper grid */}
        <img width={1200} height={630} src={gridUri} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Header — Q mark + wordmark */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              width: "60px",
              height: "60px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              background: "#fbf8f1",
              border: `1px solid ${LINE}`,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="qtail" x1="14" y1="15" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#1f7d7d" />
                  <stop offset="1" stopColor="#b45309" />
                </linearGradient>
              </defs>
              <circle cx="10.8" cy="11" r="7" stroke={INK} strokeWidth="2.8" />
              <path d="M14.8 15.2 L19.2 19.6" stroke="url(#qtail)" strokeWidth="3.6" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 700, color: INK }}>
            Qraft<span style={{ color: SUBTLE }}>Paper</span>
          </div>
        </div>

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
    {
      ...size,
      fonts: [
        { name: "Plus Jakarta Sans", data: pjs400, weight: 400, style: "normal" },
        { name: "Plus Jakarta Sans", data: pjs600, weight: 600, style: "normal" },
        { name: "Plus Jakarta Sans", data: pjs700, weight: 700, style: "normal" },
      ],
    },
  );
}
