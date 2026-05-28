import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";

export const runtime = "nodejs";

/** DELETE /api/quizzes/[id] — remove a quiz the caller owns. */
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
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const deleted = await getDb()
    .delete(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, session.user.id)))
    .returning({ id: quizzes.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
