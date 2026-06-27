import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { OG, ogGridUri, ogBackground, loadOgFonts, OgBrandHeader } from "@/lib/og";

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

const { INK, MUTED, TEAL, LINE } = OG;

export default async function QuizOg({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let title = "Practice quiz";
  let subjectCode = "QraftPaper";
  let questionCount = 0;
  let duration = 0;

  if (isUuid(id)) {
    const [row] = await getDb()
      .select({ title: quizzes.title, content: quizzes.content })
      .from(quizzes)
      .where(eq(quizzes.id, id))
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

  const fonts = await loadOgFonts();

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
          background: ogBackground,
          padding: "58px 64px",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <img width={1200} height={630} src={ogGridUri} style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Header — Q mark + wordmark */}
        {OgBrandHeader()}

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
      fonts,
    },
  );
}
