import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";

export const runtime = "nodejs";

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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const deleted = await getDb()
    .delete(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, session.user.id)))
    .returning({ id: subjects.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
