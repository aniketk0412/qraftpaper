import { cache } from "react";
import { unstable_cache } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { papers, quizAttempts, quizzes, subjects } from "@/lib/db/schema";

/** Cache tag for a user's subject list — invalidated by routes that mutate
 *  subjects (POST /api/subjects, DELETE /api/subjects/[id]). Keep these in
 *  sync with the `revalidateTag` calls in those routes. */
export const subjectsTagFor = (userId: string) => `subjects:${userId}`;

export interface DashboardSubject {
  id: string;
  name: string;
  code: string;
  papers: number;
  lastGenerated: string;
  accent: "violet" | "gold";
  hasProfile: boolean;
  /** ISO date string for the upcoming exam, when set. */
  examDate: string | null;
  /** Whole days until the exam. Negative if already past. */
  daysToExam: number | null;
  /** Average percentage score across all quiz attempts in this subject —
   *  the "mastery" number on the card. null = no quizzes taken yet. */
  masteryPct: number | null;
  /** Distinct quizzes the user has taken at least once. */
  quizzesTaken: number;
}

async function fetchUserSubjects(userId: string): Promise<DashboardSubject[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      createdAt: subjects.createdAt,
      profileGeneratedAt: subjects.profileGeneratedAt,
      examDate: subjects.examDate,
      paperCount: sql<number>`count(${papers.id})::int`,
    })
    .from(subjects)
    .leftJoin(papers, eq(subjects.id, papers.subjectId))
    .where(eq(subjects.userId, userId))
    .groupBy(
      subjects.id,
      subjects.name,
      subjects.code,
      subjects.createdAt,
      subjects.profileGeneratedAt,
      subjects.examDate,
    )
    .orderBy(desc(subjects.createdAt));

  // Per-subject mastery aggregation across all quizzes the user owns in that
  // subject — and across all attempts on those quizzes. Calculated as
  // sum(score) / sum(total) per subject. Subjects with no quizzes drop out
  // of the result and the dashboard renders null.
  const masteryRows = await db
    .select({
      subjectId: quizzes.subjectId,
      totalScore: sql<number>`coalesce(sum(${quizAttempts.score}), 0)::int`,
      totalPossible: sql<number>`coalesce(sum(${quizAttempts.total}), 0)::int`,
      attempts: sql<number>`count(${quizAttempts.id})::int`,
    })
    .from(quizzes)
    .leftJoin(quizAttempts, eq(quizAttempts.quizId, quizzes.id))
    .where(eq(quizzes.userId, userId))
    .groupBy(quizzes.subjectId);

  const masteryBySubject = new Map<string, { pct: number | null; quizzes: number }>();
  for (const row of masteryRows) {
    if (!row.subjectId) continue;
    masteryBySubject.set(row.subjectId, {
      pct: row.totalPossible > 0
        ? Math.round((row.totalScore / row.totalPossible) * 100)
        : null,
      quizzes: row.attempts,
    });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return rows.map((row, index): DashboardSubject => {
    const date = row.profileGeneratedAt ?? row.createdAt;
    const examDate = row.examDate ?? null;
    const daysToExam =
      examDate !== null
        ? Math.ceil(
            (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

    const mastery = masteryBySubject.get(row.id);
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      papers: row.paperCount,
      lastGenerated: date ? formatRelativeDate(date) : "Just now",
      accent: index % 2 === 0 ? "violet" : "gold",
      hasProfile: Boolean(row.profileGeneratedAt),
      examDate: examDate ? examDate.toISOString().slice(0, 10) : null,
      daysToExam,
      masteryPct: mastery?.pct ?? null,
      quizzesTaken: mastery?.quizzes ?? 0,
    };
  });
}

/**
 * Per-request dedupe (React `cache`) wrapping a per-user Next data cache.
 * The data cache survives across navigations within the same dashboard
 * session — the dashboard layout no longer re-queries Postgres on every
 * route change. Cache is keyed and tagged by userId, so subject mutations
 * (see /api/subjects POST + /api/subjects/[id] DELETE) only invalidate the
 * caller's slice via `revalidateTag(subjectsTagFor(userId))`.
 */
export const listUserSubjects = cache(async (userId: string) => {
  const cached = unstable_cache(
    () => fetchUserSubjects(userId),
    [`subjects:list:${userId}`],
    { revalidate: 60, tags: [subjectsTagFor(userId)] },
  );
  return cached();
});

function formatRelativeDate(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}
