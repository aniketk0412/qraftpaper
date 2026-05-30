import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { notFound, unauthorized } from "@/lib/api-responses";

export const runtime = "nodejs";

/** DELETE /api/quizzes/[id] — remove a quiz the caller owns. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Quiz not found");

  const deleted = await getDb()
    .delete(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, session.user.id)))
    .returning({ id: quizzes.id });

  if (deleted.length === 0) return notFound("Quiz not found");

  return NextResponse.json({ ok: true });
}
