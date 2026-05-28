import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";
import { isQuestionPaper } from "@/lib/content-validation";
import { getDb } from "@/lib/db";
import { generationJobs, papers, subjects, users } from "@/lib/db/schema";
import { generatePaperSections, type PaperGenerationConfig } from "@/lib/ai/generate";
import { normalizePaperConfig } from "@/lib/generation-config";
import { normalizeUuid } from "@/lib/ids";
import {
  assertCanGenerate,
  assertSubjectPaperLimit,
  assertWithinRateLimit,
  incrementGenerationUsage,
  RateLimitError,
  UsageLimitError,
} from "@/lib/usage";
import type { QuestionPaper } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subjectId?: string;
    config?: Partial<PaperGenerationConfig>;
  };
  try {
    body = (await request.json()) as {
      subjectId?: string;
      config?: Partial<PaperGenerationConfig>;
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const subjectId = normalizeUuid(body.subjectId);
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

  if (!isQuestionPaper(paper)) {
    if (job) {
      await getDb()
        .update(generationJobs)
        .set({
          status: "failed",
          error: "Generated paper failed validation",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    return NextResponse.json(
      { error: "Paper generation returned invalid content. Please try again." },
      { status: 502 },
    );
  }

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

  try {
    await trackEvent({
      distinctId: session.user.id,
      event: "paper_generated",
      properties: {
        plan,
        subjectId,
        totalMarks: config.totalMarks,
        sections: config.sections.length,
      },
    });
  } catch {
    /* swallow */
  }

  return NextResponse.json({ paper, record: created }, { status: 201 });
}

