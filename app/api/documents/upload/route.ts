import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { documents, subjects } from "@/lib/db/schema";
import { buildSubjectProfile, extractPdfText } from "@/lib/ai/extract";

export const runtime = "nodejs";

const allowedDocumentTypes = new Set(["syllabus", "sample", "pyq"]);

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const subjectId = getString(formData, "subjectId");

  if (!subjectId) {
    return NextResponse.json(
      { error: "subjectId is required" },
      { status: 400 },
    );
  }

  const [subject] = await getDb()
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, session.user.id)))
    .limit(1);

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const storedDocuments = [];

  for (const type of allowedDocumentTypes) {
    const file = formData.get(type);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: `${type} PDF is required` },
        { status: 400 },
      );
    }

    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: `${file.name} must be a PDF` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractPdfText(buffer);

    const [document] = await getDb()
      .insert(documents)
      .values({
        subjectId,
        type,
        fileName: file.name,
        contentBase64: buffer.toString("base64"),
        extractedText,
      })
      .returning();

    if (document) {
      storedDocuments.push({
        type: document.type,
        fileName: document.fileName,
        extractedText: document.extractedText ?? "",
      });
    }
  }

  let profile;

  try {
    profile = await buildSubjectProfile({
      subjectName: subject.name,
      subjectCode: subject.code,
      documents: storedDocuments,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to build subject profile",
        documents: storedDocuments.map((document) => ({
          type: document.type,
          fileName: document.fileName,
          extractedTextLength: document.extractedText.length,
        })),
      },
      { status: 502 },
    );
  }

  const [updatedSubject] = await getDb()
    .update(subjects)
    .set({
      profile,
      profileGeneratedAt: new Date(),
    })
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, session.user.id)))
    .returning();

  return NextResponse.json({
    subject: updatedSubject,
    documents: storedDocuments.map((document) => ({
      type: document.type,
      fileName: document.fileName,
      extractedTextLength: document.extractedText.length,
    })),
    profile,
  });
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
