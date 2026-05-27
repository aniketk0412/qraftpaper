import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateQuizQuestions, type QuizGenerationConfig } from "@/lib/ai/generate";
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
import type { Difficulty, Quiz } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    subjectId?: string;
    config?: Partial<QuizGenerationConfig>;
  };
  const subjectId = body.subjectId?.trim();
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

  // Read the live plan from the DB — the session JWT can be stale after a
  // downgrade/cancellation, so we never trust it for entitlement checks.
  const [account] = await getDb()
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const plan = account?.plan ?? "unpaid";

  try {
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

  let questions;

  try {
    questions = await generateQuizQuestions({
      subjectName: subject.name,
      subjectCode: subject.code,
      profile: subject.profile,
      config,
    });
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

  const quizId = randomUUID();
  const title = `${subject.name} Practice Quiz`;
  const quiz: Quiz = {
    id: quizId,
    subject: subject.name,
    subjectCode: subject.code,
    title,
    durationMins: config.durationMins,
    questions,
  };

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

  return NextResponse.json({ quiz, record: created }, { status: 201 });
}

function normalizeQuizConfig(
  config: Partial<QuizGenerationConfig> | undefined,
): QuizGenerationConfig | null {
  if (!config) return null;

  const questionCount = numberOrNull(config.questionCount);
  const durationMins = numberOrNull(config.durationMins);

  if (
    !questionCount ||
    !durationMins ||
    questionCount <= 0 ||
    durationMins <= 0
  ) {
    return null;
  }

  return {
    // Clamp so a crafted request can't ask the model for a huge quiz.
    questionCount: Math.min(Math.round(questionCount), 30),
    durationMins: Math.min(Math.round(durationMins), 300),
    difficultyMix: normalizeDifficultyMix(config.difficultyMix),
  };
}

function normalizeDifficultyMix(value: unknown) {
  const input = value as Partial<Record<Difficulty, unknown>> | undefined;
  return {
    Easy: numberOrNull(input?.Easy) ?? 30,
    Medium: numberOrNull(input?.Medium) ?? 50,
    Hard: numberOrNull(input?.Hard) ?? 20,
  };
}

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
