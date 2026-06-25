import { ImageResponse } from "next/og";
import { getExamPaper } from "@/lib/exam-papers";
import { OG, ogGridUri, ogBackground, loadOgFonts, OgBrandHeader } from "@/lib/og";

export const alt = "QraftPaper exam paper";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-subject share card for the /exam-papers/[slug] SEO pages. Styled like the
// main share card (app/opengraph-image.tsx): light "ivory paper" theme,
// graph-paper grid, real Plus Jakarta Sans, and a mini paper card showing the
// subject's actual sample questions — so each exam-paper page previews
// distinctly when shared, instead of falling back to the generic site banner.

const { INK, MUTED, SUBTLE, TEAL, LINE } = OG;

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

  const fonts = await loadOgFonts();

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
          background: ogBackground,
          padding: "58px 64px",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <img width={1200} height={630} src={ogGridUri} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Header */}
        {OgBrandHeader()}

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
      fonts,
    },
  );
}
