import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { subjectsTagFor } from "@/lib/subjects";
import {
  badRequest,
  notFound,
  safeJson,
  unauthorized,
} from "@/lib/api-responses";

export const runtime = "nodejs";

/**
 * PATCH /api/subjects/[id] — update mutable fields on a subject the caller
 * owns. Today: just `examDate` (the dashboard countdown). Accepts an
 * ISO-date string ("2026-06-15") or null to clear.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Subject not found");

  const body = await safeJson<{ examDate?: string | null }>(request);
  if (!body) return badRequest();

  let examDate: Date | null = null;
  if (body.examDate) {
    const parsed = new Date(body.examDate);
    if (!Number.isFinite(parsed.getTime())) {
      return badRequest("Invalid exam date");
    }
    // Anchor to UTC midnight so the day-count math is timezone-stable.
    parsed.setUTCHours(0, 0, 0, 0);
    examDate = parsed;
  }

  const [updated] = await getDb()
    .update(subjects)
    .set({ examDate })
    .where(and(eq(subjects.id, id), eq(subjects.userId, session.user.id)))
    .returning({ id: subjects.id });

  if (!updated) return notFound("Subject not found");

  updateTag(subjectsTagFor(session.user.id));

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/subjects/[id] — remove a subject the caller owns.
 *
 * The FK cascades in lib/db/schema (documents, papers, quizzes, blueprints
 * and their *_versions all reference subjects.id ON DELETE CASCADE) do the
 * heavy lifting — a single row delete here clears the whole subject tree.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Subject not found");

  const deleted = await getDb()
    .delete(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, session.user.id)))
    .returning({ id: subjects.id });

  if (deleted.length === 0) return notFound("Subject not found");

  updateTag(subjectsTagFor(session.user.id));

  return NextResponse.json({ ok: true });
}
