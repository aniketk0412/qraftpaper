import { and, eq, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { loadEffectivePlan } from "@/lib/billing/trial";
import { listUserSubjects, subjectsTagFor } from "@/lib/subjects";
import { assertCanCreateSubject, UsageLimitError } from "@/lib/usage";
import { sanitizeInline } from "@/lib/ai/safety";
import {
  badRequest,
  conflict,
  parseJson,
  paymentRequired,
  serverError,
  unauthorized,
} from "@/lib/api-responses";

// Optional name/code at the schema level — we apply sanitizeInline below to
// strip any control chars / fence markers a user could paste, and to clamp
// the length. Zod handles the obvious "is it a string of any sort" check.
const createSubjectSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
});

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  return NextResponse.json({
    subjects: await listUserSubjects(session.user.id),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const parsed = await parseJson(request, createSubjectSchema);
  if (!parsed.ok) return parsed.response;

  const name = parsed.data.name ? sanitizeInline(parsed.data.name, 120) : "";
  // Code is optional in the UI; auto-generate a short identifier when blank
  // so the DB constraint (notNull + unique-per-user) can still be satisfied.
  const code = parsed.data.code
    ? sanitizeInline(parsed.data.code, 40)
    : `SUBJ-${randomCode(5)}`;

  if (!name) return badRequest("Subject name is required");

  // Effective plan (lazily expires a lapsed 3-Day Pass before the gate).
  const plan = await loadEffectivePlan(session.user.id);

  try {
    await assertCanCreateSubject(session.user.id, plan);
  } catch (error) {
    if (error instanceof UsageLimitError) return paymentRequired(error.message);
    throw error;
  }

  const [duplicate] = await getDb()
    .select({ id: subjects.id })
    .from(subjects)
    .where(
      and(
        eq(subjects.userId, session.user.id),
        sql`lower(${subjects.code}) = lower(${code})`,
      ),
    )
    .limit(1);

  if (duplicate) return conflict("A subject with this code already exists");

  const [subject] = await getDb()
    .insert(subjects)
    .values({
      name,
      code,
      userId: session.user.id,
    })
    .returning();

  if (!subject) return serverError("Unable to create subject");

  const [ownedSubject] = await getDb()
    .select()
    .from(subjects)
    .where(eq(subjects.id, subject.id))
    .limit(1);

  // Bust the per-user subjects cache so the dashboard reflects the new row
  // on the next render without waiting out the 60 s revalidate window.
  updateTag(subjectsTagFor(session.user.id));

  // Activation event — creating a subject is the first real "I'm using this"
  // step in the funnel (signup -> subject_created -> generation). The single
  // most important number to watch for a pre-PMF product.
  try {
    await trackEvent({
      distinctId: session.user.id,
      event: "subject_created",
      properties: { code },
    });
  } catch {
    /* analytics must never block subject creation */
  }

  return NextResponse.json({ subject: ownedSubject }, { status: 201 });
}

// Short uppercase identifier without ambiguous I/O/0/1, suitable as a fallback
// subject code when the user hasn't supplied one.
function randomCode(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
