import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { papers, subjects } from "@/lib/db/schema";

export interface DashboardSubject {
  id: string;
  name: string;
  code: string;
  papers: number;
  lastGenerated: string;
  accent: "violet" | "gold";
  hasProfile: boolean;
}

export async function listUserSubjects(userId: string) {
  const rows = await getDb()
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      createdAt: subjects.createdAt,
      profileGeneratedAt: subjects.profileGeneratedAt,
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
    )
    .orderBy(desc(subjects.createdAt));

  return rows.map((row, index): DashboardSubject => {
    const date = row.profileGeneratedAt ?? row.createdAt;

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      papers: row.paperCount,
      lastGenerated: date ? formatRelativeDate(date) : "Just now",
      accent: index % 2 === 0 ? "violet" : "gold",
      hasProfile: Boolean(row.profileGeneratedAt),
    };
  });
}

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
