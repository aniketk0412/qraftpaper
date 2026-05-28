import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { papers } from "@/lib/db/schema";
import { renderPaperPdf } from "@/lib/export/render";
import { isUuid } from "@/lib/ids";

export const runtime = "nodejs";

export async function GET(
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

  const [paper] = await getDb()
    .select()
    .from(papers)
    .where(and(eq(papers.id, id), eq(papers.userId, session.user.id)))
    .limit(1);

  if (!paper?.content) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const buffer = await renderPaperPdf(paper.content);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(paper.title)}.pdf"`,
    },
  });
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "paper";
}
