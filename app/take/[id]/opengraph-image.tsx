import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";

export const alt = "QraftPaper practice quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

/**
 * Dynamic OpenGraph card for shared quizzes. When a student WhatsApps a quiz
 * link to friends, the preview shows the actual subject, question count and a
 * "Take it" CTA — much better than a generic site banner.
 *
 * Styling matches the main share card (app/opengraph-image.tsx): light "ivory
 * paper" theme, graph-paper grid, real Plus Jakarta Sans, and a small MCQ
 * mini-card so the preview clearly reads as an interactive quiz. Falls back to
 * a generic card if the id doesn't resolve, so link unfurling never throws.
 */

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

const FONT = "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest";
const font = (weight: number) =>
  fetch(`${FONT}/latin-${weight}-normal.ttf`).then((r) => r.arrayBuffer());

export default async function QuizOg({
  params,
}: {
  params: { id: string };
}) {
  let title = "Practice quiz";
  let subjectCode = "QraftPaper";
  let questionCount = 0;
  let duration = 0;

  if (isUuid(params.id)) {
    const [row] = await getDb()
      .select({ title: quizzes.title, content: quizzes.content })
      .from(quizzes)
      .where(eq(quizzes.id, params.id))
      .limit(1);
    if (row?.content && typeof row.content === "object") {
      const content = row.content as {
        title?: string;
        subjectCode?: string;
        questions?: unknown[];
        durationMins?: number;
      };
      title = content.title ?? title;
      subjectCode = content.subjectCode ?? subjectCode;
      questionCount = Array.isArray(content.questions) ? content.questions.length : 0;
      duration = content.durationMins ?? 0;
    }
  }

  const [pjs400, pjs600, pjs700] = await Promise.all([font(400), font(600), font(700)]);

  // Long titles shrink so they always fit on two lines in the hero slot.
  const clean = title.slice(0, 90);
  const titleSize = clean.length > 52 ? 44 : clean.length > 34 ? 52 : 60;

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
          <div style={{ display: "flex", fontSize: "32px", fontWeight: 700, color: INK }}>
            Qraft<span style={{ color: SUBTLE }}>Paper</span>
          </div>
        </div>

        {/* Body — quiz title left, MCQ mini-card right */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "44px" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "640px" }}>
            <div
              style={{
                display: "flex",
                fontSize: "19px",
                fontWeight: 600,
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: TEAL,
                marginBottom: "20px",
              }}
            >
              {subjectCode} · Practice quiz
            </div>
            <div
              style={{
                display: "flex",
                fontSize: `${titleSize}px`,
                fontWeight: 700,
                lineHeight: 1.08,
                color: INK,
              }}
            >
              {clean}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "24px",
                fontSize: "22px",
                color: MUTED,
              }}
            >
              {questionCount > 0
                ? `${questionCount} questions · ${duration} min · instant scoring`
                : "Timed MCQs with instant scoring"}
            </div>
          </div>

          {/* MCQ mini-card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "372px",
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
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "16px",
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <div style={{ display: "flex", fontSize: "15px", fontWeight: 600, color: INK }}>
                Which is true of paging?
              </div>
              <div
                style={{
                  display: "flex",
                  borderRadius: "999px",
                  background: "rgba(31,125,125,0.1)",
                  border: "1px solid rgba(31,125,125,0.3)",
                  padding: "3px 9px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: TEAL,
                }}
              >
                Q3
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "16px" }}>
              {[
                { t: "Fixed-size frames", on: false },
                { t: "Avoids fragmentation", on: true },
                { t: "Requires contiguity", on: false },
              ].map((o) => (
                <div
                  key={o.t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                    borderRadius: "12px",
                    border: o.on ? `1px solid ${TEAL}` : `1px solid ${LINE}`,
                    background: o.on ? "rgba(31,125,125,0.08)" : "#ffffff",
                    padding: "11px 13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "18px",
                      height: "18px",
                      borderRadius: "999px",
                      border: o.on ? `5px solid ${TEAL}` : `2px solid ${LINE}`,
                      background: "#ffffff",
                    }}
                  />
                  <div style={{ display: "flex", fontSize: "14px", color: o.on ? INK : "#3c4d5a" }}>
                    {o.t}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — capability strip + CTA */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: "19px", color: MUTED }}>
            Instant scoring · review every answer · retry to improve
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              fontWeight: 700,
              color: "#ffffff",
              background: TEAL,
              borderRadius: "999px",
              padding: "11px 26px",
            }}
          >
            Take the quiz →
          </div>
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
