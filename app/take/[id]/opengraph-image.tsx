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
 * link to friends, the preview shows the actual subject, question count and
 * "Take it on QraftPaper" — much better than a generic site banner.
 *
 * Falls back to a generic card if the id doesn't resolve, so we never throw
 * during link unfurling.
 */
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
              display: "flex",
              width: "70px",
              height: "70px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "18px",
              background: "#0e1620",
              border: "1px solid rgba(255,255,255,0.12)",
              position: "relative",
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
              marginBottom: "16px",
            }}
          >
            {subjectCode} · Practice quiz
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "72px",
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#eef3f5",
              maxWidth: "1000px",
            }}
          >
            {title.slice(0, 80)}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: "26px", color: "#9db0bb" }}>
            {questionCount > 0
              ? `${questionCount} questions · ${duration} min · instant scoring`
              : "Take it on QraftPaper"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "#5fc4c4",
              border: "1px solid rgba(95,196,196,0.4)",
              borderRadius: "999px",
              padding: "10px 22px",
            }}
          >
            Try it →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
