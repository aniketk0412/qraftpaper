import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";
import { isQuiz } from "@/lib/content-validation";
import { generateQuizQuestions, type QuizGenerationConfig } from "@/lib/ai/generate";
import { reconcileQuiz } from "@/lib/quiz-reconcile";
import { shouldRetryQuiz } from "@/lib/generation-quality";
import { normalizeQuizConfig } from "@/lib/generation-config";
import { normalizeUuid } from "@/lib/ids";
import { getDb } from "@/lib/db";
import { generationJobs, quizzes, subjects, users } from "@/lib/db/schema";
import {
  assertCanGenerate,
  assertSubjectQuizLimit,
  assertWithinRateLimit,
  incrementGenerationUsage,
  RateLimitError,
  UsageLimitError,
} from "@/lib/usage";
import { recordStudyActivity } from "@/lib/streaks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subjectId?: string;
    config?: Partial<QuizGenerationConfig>;
  };
  try {
    body = (await request.json()) as {
      subjectId?: string;
      config?: Partial<QuizGenerationConfig>;
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const subjectId = normalizeUuid(body.subjectId);
  const config = normalizeQuizConfig(body.config);

  if (!subjectId || !config) {
    return NextResponse.json(
      { error: "subjectId and a valid quiz config are required" },
      { status: 400 },
    );
  }

  const [subject] = await getDb()
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, session.user.id)))
    .limit(1);

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  if (!subject.profile) {
    return NextResponse.json(
      { error: "Upload documents and build a subject profile first" },
      { status: 409 },
    );
  }
  // Const-capture so the generate closure below keeps the non-null narrowing.
  const profile = subject.profile;

  // Read the live plan from the DB — the session JWT can be stale after a
  // downgrade/cancellation, so we never trust it for entitlement checks.
  const [account] = await getDb()
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const plan = account?.plan ?? "unpaid";

  try {
    // No email-verification gate — see /api/generate/paper for rationale.
    await assertWithinRateLimit(session.user.id);
    await assertCanGenerate(session.user.id, plan);
    await assertSubjectQuizLimit(session.user.id, subjectId, plan);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }

    throw error;
  }

  const [job] = await getDb()
    .insert(generationJobs)
    .values({
      userId: session.user.id,
      subjectId,
      type: "quiz",
      status: "running",
      startedAt: new Date(),
      input: config,
    })
    .returning();

  const quizId = randomUUID();
  const title = `${subject.name} Practice Quiz`;

  // One generate+reconcile attempt. Reconcile drops malformed questions and
  // dedupes duplicate options, so a single bad question never wastes the
  // user's paid generation.
  const attemptOnce = async () => {
    const questions = await generateQuizQuestions({
      subjectName: subject.name,
      subjectCode: subject.code,
      profile,
      config,
    });
    return reconcileQuiz(
      {
        id: quizId,
        subject: subject.name,
        subjectCode: subject.code,
        title,
        durationMins: config.durationMins,
        questions,
      },
      config.questionCount,
    );
  };

  let quiz;
  let quizReport;
  let retried = false;
  try {
    let best = await attemptOnce();
    // Self-heal: if fewer than 60% of the requested questions survived
    // sanitising, the model produced a lot of junk — spend one more call and
    // keep whichever attempt kept more usable questions.
    if (shouldRetryQuiz(best.report, config.questionCount)) {
      retried = true;
      const second = await attemptOnce();
      if (second.report.kept > best.report.kept) best = second;
      console.info("[generate:quiz] retried for low survival", {
        kept: best.report.kept,
        requested: config.questionCount,
      });
    }
    quiz = best.quiz;
    quizReport = best.report;
  } catch (error) {
    if (job) {
      await getDb()
        .update(generationJobs)
        .set({
          status: "failed",
          error: error instanceof Error ? error.message : "Quiz generation failed",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    console.error("[generate:quiz] failed", error);
    return NextResponse.json(
      { error: "Quiz generation failed. Please try again." },
      { status: 502 },
    );
  }

  if (quizReport.dropped > 0 || quizReport.optionsDeduped > 0 || retried) {
    console.info("[generate:quiz] reconciled", quizReport);
    try {
      await trackEvent({
        distinctId: session.user.id,
        event: "quiz_reconciled",
        properties: { ...quizReport, retried },
      });
    } catch {
      /* telemetry must never break a real generation */
    }
  }

  // Fail only when nothing usable survived — a genuinely empty quiz is the
  // one case worth refunding-and-retrying.
  if (quiz.questions.length === 0 || !isQuiz(quiz)) {
    if (job) {
      await getDb()
        .update(generationJobs)
        .set({
          status: "failed",
          error: "Generated quiz failed validation",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    return NextResponse.json(
      { error: "Quiz generation returned invalid content. Please try again." },
      { status: 502 },
    );
  }

  const [created] = await getDb()
    .insert(quizzes)
    .values({
      id: quizId,
      subjectId,
      userId: session.user.id,
      title,
      content: quiz,
    })
    .returning();

  await incrementGenerationUsage(session.user.id);
  await recordStudyActivity(session.user.id);

  if (job && created) {
    await getDb()
      .update(generationJobs)
      .set({
        status: "succeeded",
        quizId: created.id,
        finishedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));
  }

  try {
    await trackEvent({
      distinctId: session.user.id,
      event: "quiz_generated",
      properties: {
        plan,
        subjectId,
        questionCount: config.questionCount,
        durationMins: config.durationMins,
      },
    });
  } catch {
    /* swallow */
  }

  return NextResponse.json({ quiz, record: created }, { status: 201 });
}

