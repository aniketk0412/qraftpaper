import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { subjects, users } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { assertCanCreateSubject, UsageLimitError } from "@/lib/usage";
import { sanitizeInline } from "@/lib/ai/safety";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    subjects: await listUserSubjects(session.user.id),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; code?: string };
  const name = body.name ? sanitizeInline(body.name, 120) : "";
  const code = body.code ? sanitizeInline(body.code, 40) : "";

  if (!name || !code) {
    return NextResponse.json(
      { error: "Subject name and code are required" },
      { status: 400 },
    );
  }

  const [account] = await getDb()
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  try {
    await assertCanCreateSubject(session.user.id, account?.plan ?? "unpaid");
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const [subject] = await getDb()
    .insert(subjects)
    .values({
      name,
      code,
      userId: session.user.id,
    })
    .returning();

  if (!subject) {
    return NextResponse.json(
      { error: "Unable to create subject" },
      { status: 500 },
    );
  }

  const [ownedSubject] = await getDb()
    .select()
    .from(subjects)
    .where(eq(subjects.id, subject.id))
    .limit(1);

  return NextResponse.json({ subject: ownedSubject }, { status: 201 });
}
