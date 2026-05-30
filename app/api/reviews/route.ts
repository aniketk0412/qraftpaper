import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { parseJson, unauthorized } from "@/lib/api-responses";
import { getDueReviewCount, recordMissedQuestions } from "@/lib/reviews";
import { cleanMissedQuestions, missedSchema } from "@/lib/reviews-input";

export const runtime = "nodejs";

/**
 * POST /api/reviews — record the questions a signed-in user just missed into
 * their cross-device spaced-repetition schedule. Fire-and-forget from the quiz
 * runner; anonymous takers (no session) are simply ignored (their drill stays
 * local). Always returns the current due-count so the client can refresh its
 * nudge without a second request.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const parsed = await parseJson(request, missedSchema);
  if (!parsed.ok) return parsed.response;

  // correctIndex must point inside the options array for this question.
  const clean = cleanMissedQuestions(parsed.data.questions);

  await recordMissedQuestions(session.user.id, clean);
  const due = await getDueReviewCount(session.user.id);
  return NextResponse.json({ recorded: clean.length, due });
}

/** GET /api/reviews — the current due-count for the dashboard nudge. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const due = await getDueReviewCount(session.user.id);
  return NextResponse.json({ due });
}
