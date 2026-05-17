import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateQuizQuestions, type QuizGenerationConfig } from "@/lib/ai/generate";
import { getDb } from "@/lib/db";
import { quizzes, subjects } from "@/lib/db/schema";
import {
  assertCanGenerate,
  incrementGenerationUsage,
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

  try {
    await assertCanGenerate(session.user.id, session.user.plan);
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }

    throw error;
  }

  const questions = await generateQuizQuestions({
    subjectName: subject.name,
    subjectCode: subject.code,
    profile: subject.profile,
    config,
  });

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
    questionCount,
    durationMins,
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
