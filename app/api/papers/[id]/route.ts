import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isQuestionPaper } from "@/lib/content-validation";
import { getDb } from "@/lib/db";
import { paperVersions, papers } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import type { QuestionPaper } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  let body: { content?: QuestionPaper };
  try {
    body = (await request.json()) as { content?: QuestionPaper };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isQuestionPaper(body.content) || body.content.id !== id) {
    return NextResponse.json(
      { error: "Valid paper content is required" },
      { status: 400 },
    );
  }

  if (JSON.stringify(body.content).length > 200_000) {
    return NextResponse.json(
      { error: "Paper content is too large to save." },
      { status: 413 },
    );
  }

  const [existing] = await getDb()
    .select()
    .from(papers)
    .where(and(eq(papers.id, id), eq(papers.userId, session.user.id)))
    .limit(1);

  if (!existing?.content) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  await getDb().insert(paperVersions).values({
    paperId: existing.id,
    userId: session.user.id,
    content: existing.content,
    reason: "manual_save",
  });

  const [updated] = await getDb()
    .update(papers)
    .set({
      content: body.content,
      title: body.content.examTitle,
      updatedAt: new Date(),
    })
    .where(and(eq(papers.id, id), eq(papers.userId, session.user.id)))
    .returning();

  return NextResponse.json({ paper: updated.content, record: updated });
}

/** DELETE /api/papers/[id] — remove a paper the caller owns. */
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
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const deleted = await getDb()
    .delete(papers)
    .where(and(eq(papers.id, id), eq(papers.userId, session.user.id)))
    .returning({ id: papers.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
