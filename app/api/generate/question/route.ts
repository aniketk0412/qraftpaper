import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { regeneratePaperQuestion } from "@/lib/ai/generate";
import { getDb } from "@/lib/db";
import { papers, subjects } from "@/lib/db/schema";
import { normalizeUuid } from "@/lib/ids";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    paperId?: string;
    questionId?: string;
  };
  try {
    body = (await request.json()) as {
      paperId?: string;
      questionId?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const paperId = normalizeUuid(body.paperId);
  const questionId = body.questionId?.trim();

  if (!paperId || !questionId) {
    return NextResponse.json(
      { error: "paperId and questionId are required" },
      { status: 400 },
    );
  }

  const [paper] = await getDb()
    .select()
    .from(papers)
    .where(and(eq(papers.id, paperId), eq(papers.userId, session.user.id)))
    .limit(1);

  if (!paper?.content) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const [subject] = await getDb()
    .select()
    .from(subjects)
    .where(
      and(eq(subjects.id, paper.subjectId), eq(subjects.userId, session.user.id)),
    )
    .limit(1);

  if (!subject?.profile) {
    return NextResponse.json(
      { error: "Subject profile is missing" },
      { status: 409 },
    );
  }

  const question = paper.content.sections
    .flatMap((section) => section.questions)
    .find((candidate) => candidate.id === questionId);

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const regeneratedQuestion = await regeneratePaperQuestion({
    subjectName: subject.name,
    subjectCode: subject.code,
    profile: subject.profile,
    question,
  });

  return NextResponse.json({ question: regeneratedQuestion });
}
