import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isQuiz } from "@/lib/content-validation";
import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { renderQuizDocx } from "@/lib/export/render";
import { isUuid } from "@/lib/ids";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const [quiz] = await getDb()
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, session.user.id)))
    .limit(1);

  if (!quiz?.content) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }
  if (!isQuiz(quiz.content)) {
    return NextResponse.json(
      { error: "Quiz content is invalid. Regenerate the quiz and try again." },
      { status: 409 },
    );
  }

  const buffer = await renderQuizDocx(quiz.content);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeFileName(quiz.title)}.docx"`,
    },
  });
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "quiz";
}
