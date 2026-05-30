import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { parseJson, unauthorized } from "@/lib/api-responses";
import { applyReviewGrade } from "@/lib/reviews";
import { gradeSchema } from "@/lib/reviews-input";

export const runtime = "nodejs";

/**
 * POST /api/reviews/grade — apply one drill answer to a question's
 * spaced-repetition schedule. Scoped to the signed-in user (the helper only
 * touches rows owned by them), so a caller can't move someone else's schedule.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const parsed = await parseJson(request, gradeSchema);
  if (!parsed.ok) return parsed.response;

  const { quizId, questionId, correct } = parsed.data;
  const { graduated, found } = await applyReviewGrade(
    session.user.id,
    quizId,
    questionId,
    correct,
  );

  return NextResponse.json({ graduated, found });
}
