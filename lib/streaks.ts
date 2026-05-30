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
  /** True if the user has logged activity today (in UTC). */
  practisedToday: boolean;
  /** Whole days since the user last did anything (or null if never). Drives
   *  the soft "we miss you" banner on the dashboard at 2+ days. */
  daysSinceLast: number | null;
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
    return {
      current: 0,
      longest: 0,
      totalDays: total,
      practisedToday: false,
      daysSinceLast: null,
    };
  }

  const dateSet = new Set(
    rows.map((row) => row.activityDate.toISOString().slice(0, 10)),
  );
  const todayKey = new Date().toISOString().slice(0, 10);
  const practisedToday = dateSet.has(todayKey);

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

  // Days since most recent activity (0 = today, 1 = yesterday, etc.)
  const todayMs = Date.parse(`${todayKey}T00:00:00Z`);
  const latestStr = rows[0].activityDate.toISOString().slice(0, 10);
  const latestMs = Date.parse(`${latestStr}T00:00:00Z`);
  const daysSinceLast = Math.max(
    0,
    Math.round((todayMs - latestMs) / 86_400_000),
  );

  return {
    current,
    longest,
    totalDays: dateSet.size,
    practisedToday,
    daysSinceLast,
  };
}

export interface WeeklyActivity {
  /** Boolean array, oldest first → today last (length 7). True = practised. */
  days: boolean[];
  /** Number of days in the last 7 with activity. */
  done: number;
  /** Configurable target — default 5 of 7 (Duolingo's "weekly goal" model). */
  target: number;
  /** True once `done >= target` for the current rolling week. */
  hit: boolean;
}

/**
 * Returns a 7-day boolean array representing whether the user practised on
 * each of the last seven UTC days (today inclusive). Drives the dashboard
 * weekly-goal ring — the strongest non-streak engagement loop because users
 * who miss a day can still hit the weekly goal and feel rewarded.
 */
export async function getWeeklyActivity(
  userId: string,
  target = 5,
): Promise<WeeklyActivity> {
  const db = getDb();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const rows = await db
    .select({ activityDate: studyActivity.activityDate })
    .from(studyActivity)
    .where(
      and(
        eq(studyActivity.userId, userId),
        gte(studyActivity.activityDate, sevenDaysAgo),
      ),
    );

  const set = new Set(
    rows.map((r) => r.activityDate.toISOString().slice(0, 10)),
  );

  const days: boolean[] = [];
  const cursor = new Date(sevenDaysAgo);
  for (let i = 0; i < 7; i++) {
    days.push(set.has(cursor.toISOString().slice(0, 10)));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const done = days.filter(Boolean).length;
  return { days, done, target, hit: done >= target };
}

/**
 * Which milestone (if any) the user is currently sitting on. Returns null
 * when nothing to celebrate. Tiers chosen to match what habit research
 * suggests works:
 *   3  — formed
 *   7  — first week
 *   14 — sticky
 *   30 — default behaviour
 *   50, 100 — badge of pride
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export function currentMilestone(streak: number): StreakMilestone | null {
  if (!streak) return null;
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (streak === STREAK_MILESTONES[i]) return STREAK_MILESTONES[i];
  }
  return null;
}
