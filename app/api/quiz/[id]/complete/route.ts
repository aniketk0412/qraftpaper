import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";
import { captureException } from "@/lib/observability";
import { getDb } from "@/lib/db";
import { quizAttempts } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { recordStudyActivity } from "@/lib/streaks";
import { notFound, parseJson } from "@/lib/api-responses";

export const runtime = "nodejs";

/**
 * Schema for the quiz-complete payload. Zod handles all the bounds checking
 * the route used to do by hand:
 *
 *   - score and total must be finite, non-negative integers ≤1000 (clamps a
 *     hostile client that posts {"score": 1e9} to a sensible ceiling)
 *   - total must be ≥1 (a zero-question quiz can't have a meaningful score)
 *   - durationSeconds, when present, must fit in a single day
 *   - extra fields on the body are stripped (.strict not used because some
 *     older quiz-runner builds send a trailing camelCase property we'd
 *     rather ignore than 400 on)
 *
 * The schema doubles as the on-the-wire contract — if a client wants to
 * know what shape this endpoint expects, this is the source of truth.
 */
const completeQuizSchema = z
  .object({
    score: z.number().int().min(0).max(1000),
    total: z.number().int().min(1).max(1000),
    durationSeconds: z
      .number()
      .int()
      .min(0)
      .max(60 * 60 * 24)
      .optional(),
  })
  .refine((v) => v.score <= v.total, {
    message: "score cannot exceed total",
    path: ["score"],
  });

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

  const parsed = await parseJson(request, completeQuizSchema);
  if (!parsed.ok) return parsed.response;
  const { score, total, durationSeconds = null } = parsed.data;

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
      // Funnel: quiz_completed is the "felt the value" step between
      // generation and subscribe. Only fired for signed-in takers —
      // anonymous shared-link takers have no stable distinctId and aren't
      // part of the activation funnel. Score as a percent so funnels can
      // segment by performance without leaking raw counts.
      try {
        await trackEvent({
          distinctId: takerUserId,
          event: "quiz_completed",
          properties: {
            score,
            total,
            pct: total > 0 ? Math.round((score / total) * 100) : 0,
            durationSeconds,
          },
        });
      } catch {
        /* analytics must never break the user's experience */
      }
    }
  } catch (error) {
    // Logging failed analytics shouldn't break the user's experience.
    captureException(error, { scope: "quiz:complete" });
  }

  return NextResponse.json({ ok: true });
}
