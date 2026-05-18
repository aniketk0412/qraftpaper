import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { usage } from "@/lib/db/schema";

const PLAN_CAPS: Record<string, number | null> = {
  unpaid: 0,
  educator: 40,
  department: 400,
  institution: null,
};

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

export function currentUsageMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function assertCanGenerate(userId: string, plan: string) {
  const cap = PLAN_CAPS[plan] ?? PLAN_CAPS.educator;

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
      `Monthly generation limit reached for the ${plan} plan (${cap}/month).`,
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
