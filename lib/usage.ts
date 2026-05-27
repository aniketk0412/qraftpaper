import { and, eq, gt, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { generationJobs, papers, quizzes, subjects, usage } from "@/lib/db/schema";
import { planLimits } from "@/lib/plans";

// Burst guard — flat across plans, just stops loops/scripts.
const RATE_WINDOW_MS = 60_000;
const MAX_AI_OPS_PER_WINDOW = 6;

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

/** Burst/loop guard — thrown when too many AI ops happen in a short window. */
export class RateLimitError extends UsageLimitError {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function currentUsageMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function countRows(query: Promise<{ n: number }[]>): Promise<number> {
  const [row] = await query;
  return row?.n ?? 0;
}

/** Monthly generation allowance for the user's plan (the real cost cap). */
export async function assertCanGenerate(userId: string, plan: string) {
  const cap = planLimits(plan).generationsPerMonth;

  if (cap === null) {
    return;
  }

  const month = currentUsageMonth();
  const [row] = await getDb()
    .select({ generations: usage.generations })
    .from(usage)
    .where(and(eq(usage.userId, userId), eq(usage.month, month)))
    .limit(1);

  if ((row?.generations ?? 0) >= cap) {
    if (cap === 0) {
      throw new UsageLimitError(
        "Subscribe to a paid plan before generating papers or quizzes.",
      );
    }

    throw new UsageLimitError(
      `You've used all ${cap} generations included in your plan this month.`,
    );
  }
}

export async function incrementGenerationUsage(userId: string) {
  const month = currentUsageMonth();

  await getDb()
    .insert(usage)
    .values({ userId, month, generations: 1 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.month],
      set: {
        generations: sql`${usage.generations} + 1`,
      },
    });
}

/**
 * Caps how many AI operations (paper, quiz or profile builds — all logged in
 * generationJobs) a user can trigger per minute. Stops runaway loops, rapid
 * back-to-back generation and scripted abuse.
 */
export async function assertWithinRateLimit(userId: string) {
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const recent = await countRows(
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(generationJobs)
      .where(
        and(eq(generationJobs.userId, userId), gt(generationJobs.createdAt, since)),
      ),
  );

  if (recent >= MAX_AI_OPS_PER_WINDOW) {
    throw new RateLimitError(
      "You're generating too quickly. Please wait a minute and try again.",
    );
  }
}

/** Per-subject paper cap for the plan (a guardrail; null = unlimited). */
export async function assertSubjectPaperLimit(
  userId: string,
  subjectId: string,
  plan: string,
) {
  const cap = planLimits(plan).papersPerSubject;
  if (cap === null) return;

  const existing = await countRows(
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(papers)
      .where(and(eq(papers.userId, userId), eq(papers.subjectId, subjectId))),
  );

  if (existing >= cap) {
    throw new UsageLimitError(
      `Your plan allows up to ${cap} papers per subject. Delete an existing paper or pick another subject.`,
    );
  }
}

/** Per-subject quiz cap for the plan (null = unlimited). */
export async function assertSubjectQuizLimit(
  userId: string,
  subjectId: string,
  plan: string,
) {
  const cap = planLimits(plan).quizzesPerSubject;
  if (cap === null) return;

  const existing = await countRows(
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(quizzes)
      .where(and(eq(quizzes.userId, userId), eq(quizzes.subjectId, subjectId))),
  );

  if (existing >= cap) {
    throw new UsageLimitError(
      `Your plan allows up to ${cap} quizzes per subject.`,
    );
  }
}

/** Total subjects per account for the plan (null = unlimited). */
export async function assertCanCreateSubject(userId: string, plan: string) {
  const cap = planLimits(plan).maxSubjects;
  if (cap === null) return;

  const existing = await countRows(
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(subjects)
      .where(eq(subjects.userId, userId)),
  );

  if (existing >= cap) {
    throw new UsageLimitError(
      cap === 0
        ? "Subscribe to a paid plan to add subjects."
        : `Your plan includes up to ${cap} subjects. Delete one to add another.`,
    );
  }
}
