import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { unauthorized } from "@/lib/api-responses";
import { getDueReviews } from "@/lib/reviews";

export const runtime = "nodejs";

/**
 * GET /api/reviews/due — the due spaced-repetition cards for the signed-in
 * user, shaped as a runnable drill quiz (most-overdue first, capped). The
 * drill page calls this to build the session from the server schedule instead
 * of per-device localStorage.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { questions, subjectCode } = await getDueReviews(session.user.id);

  if (questions.length === 0) {
    return NextResponse.json({ quiz: null });
  }

  return NextResponse.json({
    quiz: {
      id: "drill",
      subject: "Your missed questions",
      subjectCode,
      title: "Drill your mistakes",
      durationMins: questions.length,
      questions,
    },
  });
}
