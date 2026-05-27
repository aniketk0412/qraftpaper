import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { generationJobs, papers, subjects, users } from "@/lib/db/schema";
import { generatePaperSections, type PaperGenerationConfig } from "@/lib/ai/generate";
import {
  assertCanGenerate,
  assertSubjectPaperLimit,
  assertWithinRateLimit,
  incrementGenerationUsage,
  RateLimitError,
  UsageLimitError,
} from "@/lib/usage";
import type { Difficulty, QuestionPaper } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    subjectId?: string;
    config?: Partial<PaperGenerationConfig>;
  };
  const subjectId = body.subjectId?.trim();
  const config = normalizePaperConfig(body.config);

  if (!subjectId || !config) {
    return NextResponse.json(
      { error: "subjectId and a valid paper config are required" },
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
    await assertSubjectPaperLimit(session.user.id, subjectId, plan);
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
      type: "paper",
      status: "running",
      startedAt: new Date(),
      input: config,
    })
    .returning();

  let sections;

  try {
    sections = await generatePaperSections({
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
          error: error instanceof Error ? error.message : "Paper generation failed",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    console.error("[generate:paper] failed", error);
    return NextResponse.json(
      { error: "Paper generation failed. Please try again." },
      { status: 502 },
    );
  }

  const paperId = randomUUID();
  const title = config.examTitle ?? `${subject.name} Question Paper`;
  const paper: QuestionPaper = {
    id: paperId,
    subject: subject.name,
    subjectCode: subject.code,
    course: config.course ?? subject.name,
    examTitle: title,
    durationMins: config.durationMins,
    totalMarks: config.totalMarks,
    sections,
  };

  const [created] = await getDb()
    .insert(papers)
    .values({
      id: paperId,
      subjectId,
      userId: session.user.id,
      title,
      config,
      content: paper,
    })
    .returning();

  await incrementGenerationUsage(session.user.id);

  if (job && created) {
    await getDb()
      .update(generationJobs)
      .set({
        status: "succeeded",
        paperId: created.id,
        finishedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));
  }

  return NextResponse.json({ paper, record: created }, { status: 201 });
}

function normalizePaperConfig(
  config: Partial<PaperGenerationConfig> | undefined,
): PaperGenerationConfig | null {
  if (!config) return null;

  const totalMarks = numberOrNull(config.totalMarks);
  const durationMins = numberOrNull(config.durationMins);

  if (!totalMarks || !durationMins || totalMarks <= 0 || durationMins <= 0) {
    return null;
  }

  // Clamp so a crafted request can't ask the model for an enormous paper.
  const MAX_SECTIONS = 8;
  const MAX_QUESTIONS_PER_SECTION = 25;

  const sections = (
    Array.isArray(config.sections)
      ? config.sections
          .map((section) => ({
            title: String(section.title ?? "").trim().slice(0, 200),
            instruction: String(section.instruction ?? "").trim().slice(0, 400),
            marksPerQuestion: Math.min(
              numberOrNull(section.marksPerQuestion) ?? 0,
              100,
            ),
            count: Math.min(
              numberOrNull(section.count) ?? 0,
              MAX_QUESTIONS_PER_SECTION,
            ),
          }))
          .filter(
            (section) =>
              section.title &&
              section.instruction &&
              section.marksPerQuestion > 0 &&
              section.count > 0,
          )
      : []
  ).slice(0, MAX_SECTIONS);

  if (sections.length === 0) return null;

  return {
    totalMarks: Math.min(totalMarks, 1000),
    durationMins: Math.min(durationMins, 600),
    course: config.course?.trim(),
    examTitle: config.examTitle?.trim(),
    units: Array.isArray(config.units)
      ? config.units.map((unit) => ({
          unit: String(unit.unit ?? "").trim(),
          weight: numberOrNull(unit.weight) ?? 0,
        }))
      : [],
    sections,
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
