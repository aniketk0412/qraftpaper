import { ImageResponse } from "next/og";
import { getExamPaper } from "@/lib/exam-papers";

export const alt = "QraftPaper exam paper";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-subject share card for the /exam-papers/[slug] SEO pages. Styled like the
// main share card (app/opengraph-image.tsx): light "ivory paper" theme,
// graph-paper grid, real Plus Jakarta Sans, and a mini paper card showing the
// subject's actual sample questions — so each exam-paper page previews
// distinctly when shared, instead of falling back to the generic site banner.

const INK = "#1a2332";
const MUTED = "#4a5f6f";
const SUBTLE = "#5a6c7a";
const TEAL = "#1f7d7d";
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

const FONT = "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest";
const font = (weight: number) =>
  fetch(`${FONT}/latin-${weight}-normal.ttf`).then((r) => r.arrayBuffer());

export default async function ExamPaperOg({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const paper = getExamPaper(slug);

  const subject = paper?.subject ?? "Previous year question paper";
  const code = paper?.code ?? "QraftPaper";
  const exam = paper?.exam ?? "End-Semester Examination";
  const marks = paper?.marks ?? 70;
  const durationHrs = paper?.durationHrs ?? 3;
  const unitCount = paper?.units.length ?? 5;
  const rows = (paper?.sampleQuestions ?? []).slice(0, 2);

  const [pjs400, pjs600, pjs700] = await Promise.all([font(400), font(600), font(700)]);

  const titleSize = subject.length > 40 ? 46 : subject.length > 26 ? 54 : 62;

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
          padding: "58px 64px",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <img width={1200} height={630} src={gridUri} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Header */}
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
          <div style={{ display: "flex", fontSize: "32px", fontWeight: 700, color: INK }}>
            Qraft<span style={{ color: SUBTLE }}>Paper</span>
          </div>
        </div>

        {/* Body — subject left, sample-paper card right */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "44px" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "620px" }}>
            <div
              style={{
                display: "flex",
                fontSize: "19px",
                fontWeight: 600,
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: TEAL,
                marginBottom: "18px",
              }}
            >
              {code} · Previous year paper
            </div>
            <div
              style={{
                display: "flex",
                fontSize: `${titleSize}px`,
                fontWeight: 700,
                lineHeight: 1.07,
                color: INK,
              }}
            >
              {subject}
            </div>
            <div style={{ display: "flex", marginTop: "24px", fontSize: "22px", color: MUTED }}>
              {marks} marks · {durationHrs}h · {unitCount} units
            </div>
          </div>

          {/* Sample-paper mini-card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "392px",
              borderRadius: "20px",
              background: "#fbf8f1",
              border: `1px solid ${LINE}`,
              boxShadow: "0 34px 70px -28px rgba(20,32,46,0.4)",
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                paddingBottom: "14px",
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <div style={{ display: "flex", fontSize: "16px", fontWeight: 600, color: INK }}>
                {code} · {exam}
              </div>
              <div style={{ display: "flex", fontSize: "12px", letterSpacing: "1px", color: SUBTLE, marginTop: "4px" }}>
                SAMPLE QUESTIONS
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
              {rows.map((q, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "11px",
                    borderRadius: "12px",
                    border: `1px solid ${LINE}`,
                    background: "#ffffff",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "28px",
                      height: "28px",
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      background: "rgba(31,125,125,0.12)",
                      color: TEAL,
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {`Q${i + 1}`}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", fontSize: "13px", color: "#2c3e4c", lineHeight: 1.3 }}>
                      {q.text.length > 96 ? `${q.text.slice(0, 96)}…` : q.text}
                    </div>
                    <div style={{ display: "flex", fontSize: "11px", color: SUBTLE, marginTop: "5px" }}>
                      {q.marks} marks · {q.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
            Real exam format · generate unlimited mock papers that match it
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
