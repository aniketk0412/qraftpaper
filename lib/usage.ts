import { and, eq, gt, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { generationJobs, papers, quizzes, subjects, usage } from "@/lib/db/schema";
import { planLimits } from "@/lib/plans";

// Burst guard — flat across plans, just stops loops/scripts.
const RATE_WINDOW_MS = 60_000;
const MAX_AI_OPS_PER_WINDOW = 6;

// Strict hourly ceiling on paper generations, enforced independently per user
// account AND per client IP. The per-IP axis stops the limit being bypassed by
// spinning up fresh accounts from one host.
const PAPER_HOUR_WINDOW_MS = 60 * 60_000;
const MAX_PAPERS_PER_HOUR = 3;

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

/**
 * Atomically claim one generation against the plan's monthly allowance (the
 * real cost cap). Unlike a read-then-check, the cap is enforced inside a single
 * conditional upsert, so two concurrent requests can never both slip past the
 * limit — at most `cap` generations are ever claimed in a month. Throws
 * UsageLimitError when the allowance is already spent.
 *
 * Pair with refundGeneration() to release the slot if the generation ultimately
 * fails, so a failed attempt doesn't permanently burn the user's allowance.
 * Call this LAST among the pre-generation gates: the other guards (rate limit,
 * per-subject caps) don't consume anything, so a reservation must only happen
 * once every cheaper check has passed.
 *
 * `month` defaults to the current UTC month but callers that may later refund
 * should capture it once per request and pass the SAME value to both reserve
 * and refund — a generation spanning the UTC month rollover would otherwise
 * refund against the new month's row (matching nothing) and silently leak the
 * reserved slot from the old month.
 */
export async function reserveGeneration(
  userId: string,
  plan: string,
  month = currentUsageMonth(),
) {
  const cap = planLimits(plan).generationsPerMonth;

  if (cap === null) {
    return; // unlimited plan — nothing to meter
  }

  if (cap === 0) {
    throw new UsageLimitError(
      "Subscribe to a paid plan before generating papers or quizzes.",
    );
  }

  // INSERT the month's first generation (1 <= cap, since cap >= 1 here), or on
  // conflict bump the counter ONLY while it's still under the cap. When the row
  // is already at the cap the conditional UPDATE matches nothing and RETURNING
  // yields no row — that's the "allowance spent" signal, decided atomically by
  // Postgres instead of by a racy read-then-write.
  const claimed = await getDb()
    .insert(usage)
    .values({ userId, month, generations: 1 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.month],
      set: { generations: sql`${usage.generations} + 1` },
      setWhere: sql`${usage.generations} < ${cap}`,
    })
    .returning({ generations: usage.generations });

  if (claimed.length === 0) {
    throw new UsageLimitError(
      `You've used all ${cap} generations included in your plan this month.`,
    );
  }
}

/**
 * Release a generation slot claimed by reserveGeneration() when the attempt
 * ultimately failed, so a failed generation never permanently spends the user's
 * allowance. Floored at zero so a stray double-refund can't drive the counter
 * negative. Pass the same `month` the reservation was made against (see
 * reserveGeneration) so a refund crossing the UTC month rollover still hits
 * the right row.
 */
export async function refundGeneration(
  userId: string,
  month = currentUsageMonth(),
) {
  await getDb()
    .update(usage)
    .set({ generations: sql`GREATEST(${usage.generations} - 1, 0)` })
    .where(and(eq(usage.userId, userId), eq(usage.month, month)));
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

/**
 * Strict per-hour cap on paper generations: at most MAX_PAPERS_PER_HOUR paper
 * jobs in any rolling 60-minute window, checked separately for the user account
 * and the originating IP. We count generationJobs of type "paper" — one row is
 * inserted per request before generation runs, so this counts *requests*
 * (including failed attempts), which is the abuse-resistant interpretation.
 *
 * DB-backed on purpose: Postgres is shared across all serverless instances, so
 * the count is consistent without standing up Redis. ipAddress may be null in
 * local dev / off-request calls — we simply skip the IP axis then.
 */
export async function assertPaperHourlyLimit(
  userId: string,
  ipAddress: string | null,
) {
  const since = new Date(Date.now() - PAPER_HOUR_WINDOW_MS);

  const byUser = await countRows(
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.userId, userId),
          eq(generationJobs.type, "paper"),
          gt(generationJobs.createdAt, since),
        ),
      ),
  );

  if (byUser >= MAX_PAPERS_PER_HOUR) {
    throw new RateLimitError(
      `You can generate up to ${MAX_PAPERS_PER_HOUR} papers per hour. Please try again later.`,
    );
  }

  if (!ipAddress) {
    return;
  }

  const byIp = await countRows(
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(generationJobs)
      .where(
        and(
          eq(generationJobs.ipAddress, ipAddress),
          eq(generationJobs.type, "paper"),
          gt(generationJobs.createdAt, since),
        ),
      ),
  );

  if (byIp >= MAX_PAPERS_PER_HOUR) {
    throw new RateLimitError(
      `This network has reached the limit of ${MAX_PAPERS_PER_HOUR} paper generations per hour. Please try again later.`,
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
