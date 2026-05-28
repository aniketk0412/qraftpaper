import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { regeneratePaperQuestion } from "@/lib/ai/generate";
import { getDb } from "@/lib/db";
import { generationJobs, papers, subjects, users } from "@/lib/db/schema";
import { normalizeUuid } from "@/lib/ids";
import {
  assertCanGenerate,
  assertWithinRateLimit,
  incrementGenerationUsage,
  RateLimitError,
  UsageLimitError,
} from "@/lib/usage";
import {
  assertEmailVerified,
  EmailNotVerifiedError,
} from "@/lib/verification-gate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    paperId?: string;
    questionId?: string;
  };
  try {
    body = (await request.json()) as {
      paperId?: string;
      questionId?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const paperId = normalizeUuid(body.paperId);
  const questionId = body.questionId?.trim();

  if (!paperId || !questionId) {
    return NextResponse.json(
      { error: "paperId and questionId are required" },
      { status: 400 },
    );
  }

  const [paper] = await getDb()
    .select()
    .from(papers)
    .where(and(eq(papers.id, paperId), eq(papers.userId, session.user.id)))
    .limit(1);

  if (!paper?.content) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const [subject] = await getDb()
    .select()
    .from(subjects)
    .where(
      and(eq(subjects.id, paper.subjectId), eq(subjects.userId, session.user.id)),
    )
    .limit(1);

  if (!subject?.profile) {
    return NextResponse.json(
      { error: "Subject profile is missing" },
      { status: 409 },
    );
  }

  const question = paper.content.sections
    .flatMap((section) => section.questions)
    .find((candidate) => candidate.id === questionId);

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const [account] = await getDb()
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const plan = account?.plan ?? "unpaid";

  try {
    await assertEmailVerified(session.user.id);
    await assertWithinRateLimit(session.user.id);
    await assertCanGenerate(session.user.id, plan);
  } catch (error) {
    if (error instanceof EmailNotVerifiedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
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
      subjectId: subject.id,
      paperId: paper.id,
      type: "question",
      status: "running",
      startedAt: new Date(),
      input: { paperId, questionId },
    })
    .returning();

  let regeneratedQuestion;

  try {
    regeneratedQuestion = await regeneratePaperQuestion({
      subjectName: subject.name,
      subjectCode: subject.code,
      profile: subject.profile,
      question,
    });
  } catch (error) {
    if (job) {
      await getDb()
        .update(generationJobs)
        .set({
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Question regeneration failed",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    console.error("[generate:question] failed", error);
    return NextResponse.json(
      { error: "Question regeneration failed. Please try again." },
      { status: 502 },
    );
  }

  await incrementGenerationUsage(session.user.id);

  if (job) {
    await getDb()
      .update(generationJobs)
      .set({
        status: "succeeded",
        finishedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));
  }

  return NextResponse.json({ question: regeneratedQuestion });
}
