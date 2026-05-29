import { and, desc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { studyActivity } from "@/lib/db/schema";

/**
 * Record a study action against the streak — upsert one row per UTC day. Safe
 * to call as many times per day as you like; the unique index makes repeated
 * calls free no-ops.
 *
 * Called from generation routes after a successful generation, and from the
 * grade endpoint after a quiz attempt.
 */
export async function recordStudyActivity(userId: string): Promise<void> {
  const today = new Date();
  // Normalise to midnight UTC so all activity on the same calendar day
  // collapses to one row regardless of when in the day it fires.
  today.setUTCHours(0, 0, 0, 0);

  try {
    await getDb()
      .insert(studyActivity)
      .values({ userId, activityDate: today })
      .onConflictDoNothing();
  } catch {
    /* swallow — streak tracking must never break a real request */
  }
}

export interface StreakSummary {
  /** Consecutive UTC days up to and including today (or yesterday). */
  current: number;
  /** Longest streak ever for this user. */
  longest: number;
  /** Total distinct days the user has practised. */
  totalDays: number;
}

/**
 * Compute the user's streak summary. Pulls the most recent ~365 activity rows
 * and walks them — at one row per day per user, 365 rows is one academic year
 * which is plenty for a student-prep product. If somebody crosses that, the
 * older days are still in the table for analytics but don't affect the
 * displayed streak.
 */
export async function getStreakSummary(userId: string): Promise<StreakSummary> {
  const db = getDb();
  const oneYearAgo = new Date();
  oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 365);

  const rows = await db
    .select({ activityDate: studyActivity.activityDate })
    .from(studyActivity)
    .where(
      and(
        eq(studyActivity.userId, userId),
        gte(studyActivity.activityDate, oneYearAgo),
      ),
    )
    .orderBy(desc(studyActivity.activityDate));

  if (rows.length === 0) {
    const [{ total = 0 } = { total: 0 }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(studyActivity)
      .where(eq(studyActivity.userId, userId));
    return { current: 0, longest: 0, totalDays: total };
  }

  const dateSet = new Set(
    rows.map((row) => row.activityDate.toISOString().slice(0, 10)),
  );

  // Current streak: walk backwards from today (or yesterday — a missed today
  // doesn't break a streak until midnight of the next day).
  let current = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  if (!dateSet.has(cursor.toISOString().slice(0, 10))) {
    // Today missing — start from yesterday so the streak doesn't drop the
    // instant the calendar rolls over before the user has opened the app.
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Longest streak in the window: walk the sorted list and count consecutive
  // days.
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  // Iterate from oldest → newest so consecutive checks are forward.
  const orderedDates = Array.from(dateSet).sort();
  for (const dateStr of orderedDates) {
    const t = Date.parse(`${dateStr}T00:00:00Z`);
    if (prev !== null && t - prev === 86_400_000) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = t;
  }

  return { current, longest, totalDays: dateSet.size };
}
