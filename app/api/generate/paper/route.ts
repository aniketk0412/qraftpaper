import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";
import { isQuestionPaper } from "@/lib/content-validation";
import { getDb } from "@/lib/db";
import { generationJobs, papers, subjects, users } from "@/lib/db/schema";
import { generatePaperSections, type PaperGenerationConfig } from "@/lib/ai/generate";
import { reconcilePaper } from "@/lib/paper-reconcile";
import {
  paperMarksErrorRatio,
  shouldRetryPaper,
} from "@/lib/generation-quality";
import { normalizePaperConfig } from "@/lib/generation-config";
import { normalizeUuid } from "@/lib/ids";
import { getClientIp } from "@/lib/request-ip";
import {
  assertCanGenerate,
  assertPaperHourlyLimit,
  assertSubjectPaperLimit,
  assertWithinRateLimit,
  incrementGenerationUsage,
  RateLimitError,
  UsageLimitError,
} from "@/lib/usage";
import { recordStudyActivity } from "@/lib/streaks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subjectId?: string;
    config?: Partial<PaperGenerationConfig>;
  };
  try {
    body = (await request.json()) as {
      subjectId?: string;
      config?: Partial<PaperGenerationConfig>;
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const subjectId = normalizeUuid(body.subjectId);
  const config = normalizePaperConfig(body.config);

  if (!subjectId || !config) {
    return NextResponse.json(
      { error: "subjectId and a valid paper config are required" },
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

  if (!subject.profile) {
    return NextResponse.json(
      { error: "Upload documents and build a subject profile first" },
      { status: 409 },
    );
  }
  // Capture the narrowed (non-null) profile in a const so the generate
  // closure below keeps the narrowing — a closure can't rely on the
  // narrowing of a mutable member access.
  const profile = subject.profile;

  // Read the live plan from the DB — the session JWT can be stale after a
  // downgrade/cancellation, so we never trust it for entitlement checks.
  const [account] = await getDb()
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const plan = account?.plan ?? "unpaid";

  const clientIp = getClientIp(request);

  try {
    // Email-verification gate intentionally OMITTED for the first paid
    // generation — onboarding wall was killing conversion. The banner on
    // the dashboard still nags unverified users to confirm; the paid plan
    // requirement + per-IP rate limit + captcha at signup already block
    // abuse meaningfully. Re-introduce later if we see verified-account
    // abuse signals in PostHog.
    await assertWithinRateLimit(session.user.id);
    await assertPaperHourlyLimit(session.user.id, clientIp);
    await assertCanGenerate(session.user.id, plan);
    await assertSubjectPaperLimit(session.user.id, subjectId, plan);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }

    throw error;
  }

  const [job] = await getDb()
    .insert(generationJobs)
    .values({
      userId: session.user.id,
      subjectId,
      type: "paper",
      status: "running",
      startedAt: new Date(),
      input: config,
      ipAddress: clientIp,
    })
    .returning();

  const paperId = randomUUID();
  const title = config.examTitle ?? `${subject.name} Question Paper`;

  // One generate+reconcile attempt. Reconcile forces the printed total to the
  // real sum and renumbers 1..N, so the paper can't contradict itself.
  const attemptOnce = async () => {
    const sections = await generatePaperSections({
      subjectName: subject.name,
      subjectCode: subject.code,
      profile,
      config,
    });
    return reconcilePaper(
      {
        id: paperId,
        subject: subject.name,
        subjectCode: subject.code,
        course: config.course ?? subject.name,
        examTitle: title,
        durationMins: config.durationMins,
        totalMarks: config.totalMarks,
        sections,
      },
      config.totalMarks,
    );
  };

  let paper;
  let report;
  let retried = false;
  try {
    let best = await attemptOnce();
    // Self-heal: if the model landed egregiously far from the requested mark
    // total (>25%), spend one more call and keep whichever attempt is closer.
    // Reconcile already guarantees internal consistency; this is about
    // honouring what the student actually asked for.
    if (shouldRetryPaper(best.report)) {
      retried = true;
      const second = await attemptOnce();
      if (
        paperMarksErrorRatio(second.report) < paperMarksErrorRatio(best.report)
      ) {
        best = second;
      }
      console.info("[generate:paper] retried for marks drift", {
        firstDelta: best.report.marksDelta,
      });
    }
    paper = best.paper;
    report = best.report;
  } catch (error) {
    if (job) {
      await getDb()
        .update(generationJobs)
        .set({
          status: "failed",
          error: error instanceof Error ? error.message : "Paper generation failed",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    console.error("[generate:paper] failed", error);
    return NextResponse.json(
      { error: "Paper generation failed. Please try again." },
      { status: 502 },
    );
  }

  if (report.marksAdjusted || report.renumbered || retried) {
    console.info("[generate:paper] reconciled", {
      requestedMarks: report.requestedMarks,
      actualMarks: report.actualMarks,
      marksDelta: report.marksDelta,
      renumbered: report.renumbered,
    });
    try {
      await trackEvent({
        distinctId: session.user.id,
        event: "paper_reconciled",
        properties: {
          requestedMarks: report.requestedMarks,
          actualMarks: report.actualMarks,
          marksDelta: report.marksDelta,
          renumbered: report.renumbered,
          retried,
        },
      });
    } catch {
      /* telemetry must never break a real generation */
    }
  }

  if (!isQuestionPaper(paper)) {
    if (job) {
      await getDb()
        .update(generationJobs)
        .set({
          status: "failed",
          error: "Generated paper failed validation",
          finishedAt: new Date(),
        })
        .where(eq(generationJobs.id, job.id));
    }

    return NextResponse.json(
      { error: "Paper generation returned invalid content. Please try again." },
      { status: 502 },
    );
  }

  const [created] = await getDb()
    .insert(papers)
    .values({
      id: paperId,
      subjectId,
      userId: session.user.id,
      title,
      config,
      content: paper,
    })
    .returning();

  await incrementGenerationUsage(session.user.id);
  await recordStudyActivity(session.user.id);

  if (job && created) {
    await getDb()
      .update(generationJobs)
      .set({
        status: "succeeded",
        paperId: created.id,
        finishedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.id));
  }

  try {
    await trackEvent({
      distinctId: session.user.id,
      event: "paper_generated",
      properties: {
        plan,
        subjectId,
        totalMarks: config.totalMarks,
        sections: config.sections.length,
      },
    });
  } catch {
    /* swallow */
  }

  return NextResponse.json({ paper, record: created }, { status: 201 });
}

