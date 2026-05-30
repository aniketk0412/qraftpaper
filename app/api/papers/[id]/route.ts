import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isQuestionPaper } from "@/lib/content-validation";
import { getDb } from "@/lib/db";
import { paperVersions, papers } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { reconcilePaper } from "@/lib/paper-reconcile";
import {
  badRequest,
  notFound,
  safeJson,
  unauthorized,
} from "@/lib/api-responses";
import type { QuestionPaper } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Paper not found");

  const body = await safeJson<{ content?: QuestionPaper }>(request);
  if (!body) return badRequest();

  if (!isQuestionPaper(body.content) || body.content.id !== id) {
    return badRequest("Valid paper content is required");
  }

  // Server-authoritative marks total: the editor sends whatever totalMarks it
  // loaded, but a manual edit (changed marks, deleted question) leaves that
  // header stale. Recompute it from the questions here so a saved paper can
  // never claim a total its questions don't add up to. We do NOT renumber on
  // a manual save — the user controls question order/numbering.
  const { paper: content } = reconcilePaper(
    body.content,
    body.content.totalMarks,
    { renumber: false },
  );

  if (JSON.stringify(content).length > 200_000) {
    // 413 Payload Too Large — kept inline since we don't use this status
    // anywhere else and would just be adding a one-call helper to api-responses.
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

  if (!existing?.content) return notFound("Paper not found");

  await getDb().insert(paperVersions).values({
    paperId: existing.id,
    userId: session.user.id,
    content: existing.content,
    reason: "manual_save",
  });

  const [updated] = await getDb()
    .update(papers)
    .set({
      content,
      title: content.examTitle,
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
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Paper not found");

  const deleted = await getDb()
    .delete(papers)
    .where(and(eq(papers.id, id), eq(papers.userId, session.user.id)))
    .returning({ id: papers.id });

  if (deleted.length === 0) return notFound("Paper not found");

  return NextResponse.json({ ok: true });
}
