import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { quizAttempts } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { recordStudyActivity } from "@/lib/streaks";
import { badRequest, notFound, safeJson } from "@/lib/api-responses";

export const runtime = "nodejs";

/**
 * Records a finished quiz attempt. Public — called by the quiz runner from
 * both the auth-gated /quiz/[id] view and the public /take/[id] view. We use
 * session.user.id when available so the quiz owner can see who their friends
 * are; anonymous takers (from a shared link) get a null taker_user_id.
 *
 * Each call also bumps the streak counter for signed-in takers — taking a
 * quiz IS practising, even if you didn't generate one today.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return notFound("Quiz not found");

  const body = await safeJson<{
    score?: number;
    total?: number;
    durationSeconds?: number;
  }>(request);
  if (!body) return badRequest();

  const score = Math.max(0, Math.min(1000, Math.round(Number(body.score ?? -1))));
  const total = Math.max(0, Math.min(1000, Math.round(Number(body.total ?? -1))));
  if (!Number.isFinite(score) || !Number.isFinite(total) || total === 0) {
    return badRequest("Invalid score");
  }
  const durationSeconds =
    typeof body.durationSeconds === "number" && Number.isFinite(body.durationSeconds)
      ? Math.max(0, Math.min(60 * 60 * 24, Math.round(body.durationSeconds)))
      : null;

  const session = await auth();
  const takerUserId = session?.user?.id ?? null;

  try {
    await getDb().insert(quizAttempts).values({
      quizId: id,
      takerUserId,
      score,
      total,
      durationSeconds,
    });

    if (takerUserId) {
      await recordStudyActivity(takerUserId);
    }
  } catch (error) {
    // Logging failed analytics shouldn't break the user's experience.
    console.error("[quiz:complete] failed to record attempt", error);
  }

  return NextResponse.json({ ok: true });
}
