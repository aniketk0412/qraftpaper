import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import {
  documents,
  generationJobs,
  subjectProfileVersions,
  subjects,
} from "@/lib/db/schema";
import { buildSubjectProfile, extractPdfText } from "@/lib/ai/extract";
import {
  assertWithinRateLimit,
  RateLimitError,
  UsageLimitError,
} from "@/lib/usage";
import { normalizeUuid } from "@/lib/ids";

export const runtime = "nodejs";

const allowedDocumentTypes = ["combined", "syllabus", "sample", "pyq"] as const;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MIN_EXTRACTED_CHARS = 200; // below this it isn't real study material
const MAX_EXTRACTED_CHARS = 60_000; // cap tokens sent to the profile builder

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const subjectId = normalizeUuid(getString(formData, "subjectId"));

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

  try {
    // No email-verification gate — see /api/generate/paper for rationale.
    await assertWithinRateLimit(session.user.id);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const storedDocuments = [];

  for (const type of allowedDocumentTypes) {
    const file = formData.get(type);

    if (!(file instanceof File)) {
      continue;
    }

    if (file.size === 0) {
      continue;
    }

    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: `${file.name} must be a PDF` },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `${file.name} is too large — upload a PDF under 10 MB.` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Don't trust the client-supplied MIME type — verify the real file header.
    // Every PDF begins with "%PDF-"; anything else is a renamed/spoofed file.
    if (!buffer.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
      return NextResponse.json(
        { error: `${file.name} isn't a real PDF file.` },
        { status: 400 },
      );
    }

    let extractedText: string;
    try {
      extractedText = await extractPdfText(buffer);
    } catch {
      return NextResponse.json(
        {
          error: `${file.name} isn't a readable PDF. Upload a text-based PDF, not an image or scan.`,
        },
        { status: 400 },
      );
    }

    // Photos, scans and image-only PDFs yield little or no extractable text —
    // reject them here, before spending anything on the AI profile build.
    if (extractedText.trim().length < MIN_EXTRACTED_CHARS) {
      return NextResponse.json(
        {
          error: `We couldn't read enough text from ${file.name}. It looks like a scan, photo or image-only PDF — please upload a text-based PDF of your study material.`,
        },
        { status: 422 },
      );
    }

    if (extractedText.length > MAX_EXTRACTED_CHARS) {
      extractedText = extractedText.slice(0, MAX_EXTRACTED_CHARS);
    }

    // Replace-on-reupload: a fresh upload of a given type supersedes the old
    // one. Without this, re-uploading a syllabus left the previous rows
    // orphaned (still costing storage) and the table grew unbounded across
    // re-uploads. Per-type so uploading a new syllabus doesn't wipe the PYQ.
    await getDb()
      .delete(documents)
      .where(and(eq(documents.subjectId, subjectId), eq(documents.type, type)));

    const [document] = await getDb()
      .insert(documents)
      .values({
        subjectId,
        type,
        fileName: file.name,
        // contentBase64 intentionally not written — it's vestigial (never
        // read) and stored multi-MB blobs per row. See schema note.
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

  if (storedDocuments.length === 0) {
    return NextResponse.json(
      { error: "Upload at least one text-based PDF for this subject." },
      { status: 400 },
    );
  }

  const [job] = await getDb()
    .insert(generationJobs)
    .values({
      userId: session.user.id,
      subjectId,
      type: "profile",
      status: "running",
      startedAt: new Date(),
      input: {
        documents: storedDocuments.map((document) => ({
          type: document.type,
          fileName: document.fileName,
          extractedTextLength: document.extractedText.length,
        })),
      },
    })
    .returning();

  let profile;

  try {
    profile = await buildSubjectProfile({
      subjectName: subject.name,
      subjectCode: subject.code,
      documents: storedDocuments,
    });
  } catch (error) {
    if (job) {
      await getDb()
        .update(generationJobs)
        .set({
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Unable to build subject profile",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    console.error("[documents:upload] profile build failed", error);
    return NextResponse.json(
      {
        error:
          "We couldn't build a profile from these documents. Please try again or upload different source material.",
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

  await getDb().insert(subjectProfileVersions).values({
    subjectId,
    profile,
    sourceHash: String(
      storedDocuments.reduce(
        (sum, document) => sum + document.extractedText.length,
        0,
      ),
    ),
  });

  if (job) {
    await getDb()
      .update(generationJobs)
      .set({
        status: "succeeded",
        finishedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));
  }

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
