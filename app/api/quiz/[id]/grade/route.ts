import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";

export const runtime = "nodejs";

// Public grading endpoint for shared quizzes. The answer key is never sent to
// the client up front; a taker submits an answer and only then learns whether
// it was right (plus the explanation). Stateless, so it raises the bar against
// "read the answers from the page source" without claiming to be tamper-proof.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const body = (await request.json()) as { answers?: Record<string, number> };
  const answers =
    body.answers && typeof body.answers === "object" ? body.answers : {};

  const [record] = await getDb()
    .select({ content: quizzes.content })
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);

  if (!record?.content) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const results: Record<
    string,
    { correctIndex: number; explanation: string; correct: boolean }
  > = {};
  let score = 0;

  for (const question of record.content.questions) {
    if (!(question.id in answers)) continue;
    const correct = answers[question.id] === question.correctIndex;
    if (correct) score += 1;
    results[question.id] = {
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      correct,
    };
  }

  return NextResponse.json({
    results,
    score,
    total: record.content.questions.length,
  });
}
