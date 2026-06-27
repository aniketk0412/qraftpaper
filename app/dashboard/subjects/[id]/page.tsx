import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { BookOpen, Brain, FilePlus2, ListChecks, UploadCloud } from "lucide-react";

import { auth } from "@/auth";
import { BackLink } from "@/components/dashboard/back-link";
import { ReadinessRing } from "@/components/dashboard/readiness-ring";
import { SubjectDocumentsUpload } from "@/components/dashboard/subject-documents-upload";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { MeterBar } from "@/components/ui/meter-bar";
import { Reveal } from "@/components/ui/reveal";
import { getDb } from "@/lib/db";
import { questionReviews, subjects } from "@/lib/db/schema";
import { computeReadiness } from "@/lib/exam-readiness";
import { normalizeUuid } from "@/lib/ids";
import { listUserSubjects } from "@/lib/subjects";
import {
  buildUnitMastery,
  masterySummary,
  type UnitMastery,
} from "@/lib/unit-mastery";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";

// Cards beyond this drill interval (days) count as mastered — matches
// GRADUATED_DAYS in lib/reviews so the map and the drill agree.
const GRADUATED_DAYS = 21;

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { id } = await params;
  const subjectId = normalizeUuid(id);
  if (!subjectId) notFound();

  const [subject] = await getDb()
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, session.user.id)))
    .limit(1);
  if (!subject) notFound();

  // Readiness comes from the already-cached subject list (no extra query).
  const card = (await listUserSubjects(session.user.id)).find(
    (s) => s.id === subjectId,
  );
  const readiness = computeReadiness({
    hasProfile: Boolean(subject.profile),
    masteryPct: card?.masteryPct ?? null,
    quizzesTaken: card?.quizzesTaken ?? 0,
    papersGenerated: card?.papers ?? 0,
  });

  // One grouped query for THIS subject (not N+1): per-unit drill signal.
  const reviewAggs = subject.profile
    ? await getDb()
        .select({
          unit: questionReviews.unit,
          total: sql<number>`count(*)::int`,
          due: sql<number>`count(*) filter (where ${questionReviews.dueAt} <= now() and ${questionReviews.intervalDays} < ${GRADUATED_DAYS})::int`,
          mastered: sql<number>`count(*) filter (where ${questionReviews.intervalDays} >= ${GRADUATED_DAYS})::int`,
        })
        .from(questionReviews)
        .where(
          and(
            eq(questionReviews.userId, session.user.id),
            eq(questionReviews.subjectCode, subject.code),
          ),
        )
        .groupBy(questionReviews.unit)
    : [];

  const units = subject.profile
    ? buildUnitMastery(subject.profile.units, reviewAggs)
    : [];
  const summary = masterySummary(units);
  const daysToExam = card?.daysToExam ?? null;

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink />

      <Reveal>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <IconTile icon={BookOpen} size="lg" tone={card?.accent ?? "violet"} />
            <div>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
                {subject.code}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {subject.name}
              </h1>
              {summary.units > 0 && (
                <p className="mt-1 text-[0.82rem] text-fg-muted">
                  {summary.mastered} of {summary.units} units mastered
                  {summary.weak > 0 && ` · ${summary.weak} need work`}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <ReadinessRing readiness={readiness} size={84} />
            <span className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-fg-subtle">
              exam ready
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassCard className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">{readiness.label}</p>
            <p className="mt-0.5 text-[0.84rem] leading-snug text-fg-muted">
              {readiness.message}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {daysToExam !== null && daysToExam >= 0 && (
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em]",
                  daysToExam <= 7
                    ? "border-gold/40 bg-gold/15 text-gold"
                    : "border-line bg-tint/[0.03] text-fg-muted",
                )}
              >
                {daysToExam === 0 ? "Exam today" : `${daysToExam}d to exam`}
              </span>
            )}
            <GlowButton href="/dashboard" variant="secondary" size="sm">
              <FilePlus2 className="h-3.5 w-3.5" />
              Generate
            </GlowButton>
          </div>
        </GlassCard>
      </Reveal>

      {units.length > 0 ? (
        <Reveal delay={0.1}>
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Mastery by unit
              </h2>
              <GlowButton href="/dashboard/drill" variant="secondary" size="sm">
                <Brain className="h-3.5 w-3.5" />
                Drill weak spots
              </GlowButton>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {units.map((u) => (
                <UnitRow key={u.unit} unit={u} />
              ))}
            </div>
            <p className="mt-3 text-[0.74rem] leading-relaxed text-fg-subtle">
              Units fill in as you drill the questions you miss. An untested unit
              just means you haven&apos;t been quizzed on it yet — take a quiz to
              put it on the map.
            </p>
          </section>
        </Reveal>
      ) : !subject.profile ? (
        <Reveal delay={0.1}>
          <section className="mt-8">
            <div className="flex items-start gap-3">
              <IconTile icon={UploadCloud} tone="violet" />
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Add your documents
                </h2>
                <p className="mt-1 max-w-xl text-[0.84rem] leading-relaxed text-fg-muted">
                  Upload the syllabus and a past paper so QraftPaper can build
                  this subject&apos;s profile — then you can generate papers and
                  quizzes from it.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <SubjectDocumentsUpload subjectId={subject.id} />
            </div>
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.1}>
          <GlassCard className="mt-8 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <IconTile icon={ListChecks} tone="violet" />
              <div>
                <h2 className="text-[0.98rem] font-medium tracking-tight">
                  No mastery data yet
                </h2>
                <p className="mt-1 max-w-md text-[0.84rem] leading-relaxed text-fg-muted">
                  Take a quiz and the units you miss will start filling in your
                  mastery map.
                </p>
              </div>
            </div>
            <GlowButton href="/dashboard" size="sm">
              Generate a quiz
            </GlowButton>
          </GlassCard>
        </Reveal>
      )}
    </div>
  );
}

const STATE_META: Record<
  UnitMastery["state"],
  { label: string; tone: "accent" | "violet" | "gold" | "neutral"; fill?: string }
> = {
  mastered: { label: "Mastered", tone: "accent" },
  improving: { label: "Improving", tone: "violet" },
  weak: { label: "Needs work", tone: "gold", fill: "bg-gold" },
  untested: { label: "Untested", tone: "neutral" },
};

function UnitRow({ unit }: { unit: UnitMastery }) {
  const meta = STATE_META[unit.state];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-tint/[0.02] p-3">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.86rem] font-medium">
          {unit.title}
        </span>
        {unit.total > 0 && (
          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-fg-subtle">
            {unit.due > 0
              ? `${unit.due} to revisit`
              : `${unit.total} card${unit.total === 1 ? "" : "s"} tracked`}
          </span>
        )}
      </span>
      <span className="hidden w-28 shrink-0 sm:block">
        <MeterBar pct={unit.pct} fill={meta.fill} height="h-1.5" />
      </span>
      <span
        className={cn(
          "w-20 shrink-0 text-right font-mono text-[0.56rem] uppercase tracking-[0.12em]",
          meta.tone === "accent" && "text-accent",
          meta.tone === "violet" && "text-violet-bright",
          meta.tone === "gold" && "text-gold",
          meta.tone === "neutral" && "text-fg-subtle",
        )}
      >
        {meta.label}
      </span>
    </div>
  );
}
