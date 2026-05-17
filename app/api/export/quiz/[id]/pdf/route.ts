import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { renderQuizPdf } from "@/lib/export/render";

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
  const [quiz] = await getDb()
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, session.user.id)))
    .limit(1);

  if (!quiz?.content) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const buffer = await renderQuizPdf(quiz.content);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(quiz.title)}.pdf"`,
    },
  });
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "quiz";
}
