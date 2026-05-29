import { ArrowRight, BookOpen, FilePlus2, UploadCloud } from "lucide-react";

import { auth } from "@/auth";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { DeleteButton } from "@/components/ui/delete-button";
import { BackLink } from "@/components/dashboard/back-link";
import { ExamDatePicker } from "@/components/dashboard/exam-date-picker";
import { getDb } from "@/lib/db";
import { documents, subjects } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export default async function SubjectsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const subjectList = userId ? await listUserSubjects(userId) : [];
  const documentCounts = userId
    ? await getDb()
        .select({
          subjectId: documents.subjectId,
          count: sql<number>`count(${documents.id})::int`,
        })
        .from(documents)
        .innerJoin(subjects, eq(subjects.id, documents.subjectId))
        .where(eq(subjects.userId, userId))
        .groupBy(documents.subjectId)
    : [];
  const counts = new Map(
    documentCounts.map((row) => [row.subjectId, row.count] as const),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
              Subjects
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
              Your source material library
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
              Each subject stores its syllabus, sample paper and PYQs once, then
              reuses the compact profile for cheap paper and quiz generation.
            </p>
          </div>
          <GlowButton href="/dashboard/subjects/new" size="md">
            <FilePlus2 className="h-4 w-4" />
            New subject
          </GlowButton>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {subjectList.map((subject, index) => {
          const docs = counts.get(subject.id) ?? 0;
          return (
            <Reveal key={subject.id} delay={index * 0.05}>
              <GlassCard hover className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <IconTile icon={BookOpen} tone={subject.accent} />
                  {subject.daysToExam !== null && subject.daysToExam >= 0 ? (
                    <span
                      className={
                        subject.daysToExam <= 7
                          ? "rounded-full border border-gold/40 bg-gold/15 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-gold"
                          : "rounded-full border border-line bg-tint/[0.03] px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg-muted"
                      }
                    >
                      {subject.daysToExam === 0
                        ? "Exam today"
                        : `${subject.daysToExam}d to exam`}
                    </span>
                  ) : (
                    <span className="rounded-full border border-line bg-tint/[0.03] px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg-muted">
                      {subject.hasProfile ? "Ready" : "Needs docs"}
                    </span>
                  )}
                </div>
                <p className="mt-5 font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                  {subject.code}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {subject.name}
                </h2>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                  <MiniStat label="Docs" value={String(docs)} />
                  <MiniStat label="Papers" value={String(subject.papers)} />
                  <MiniStat label="Profile" value={subject.hasProfile ? "Yes" : "No"} />
                </div>
                <div className="mt-4 border-t border-line pt-3">
                  <ExamDatePicker
                    subjectId={subject.id}
                    currentValue={subject.examDate}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <GlowButton
                    href="/dashboard"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Generate
                  </GlowButton>
                  <DeleteButton
                    endpoint={`/api/subjects/${subject.id}`}
                    label="subject"
                  />
                </div>
              </GlassCard>
            </Reveal>
          );
        })}
      </div>

      {subjectList.length === 0 && (
        <Reveal>
          <GlassCard className="mt-8 flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <IconTile icon={UploadCloud} size="lg" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Create your first subject
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
                  Upload reference PDFs once. QraftPaper extracts text, builds a
                  reusable profile, and uses that profile for future generation.
                </p>
              </div>
            </div>
            <GlowButton href="/dashboard/subjects/new">
              Add subject <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </GlassCard>
        </Reveal>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-tint/[0.02] px-2 py-2">
      <p className="text-sm font-semibold text-fg">{value}</p>
      <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-fg-subtle">
        {label}
      </p>
    </div>
  );
}
