import Link from "next/link";
import { ArrowRight, FilePlus2, UploadCloud } from "lucide-react";

import { auth } from "@/auth";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { DeleteButton } from "@/components/ui/delete-button";
import { BackLink } from "@/components/dashboard/back-link";
import { ExamDatePicker } from "@/components/dashboard/exam-date-picker";
import { getDb } from "@/lib/db";
import { documents, subjects } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { cn } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";

// Translate a 0-100 mastery percent into the same colour band used across the
// app (indigo ≥80, indigo-deep ≥55, exam-marker red below) so the figure
// carries the same meaning everywhere it appears.
function masteryClass(pct: number | null): string {
  if (pct === null) return "text-fg-muted";
  if (pct >= 80) return "text-accent";
  if (pct >= 55) return "text-violet-bright";
  return "text-gold";
}

function statusFor(subject: {
  daysToExam: number | null;
  hasProfile: boolean;
}): { label: string; urgent: boolean; ready: boolean } {
  if (subject.daysToExam !== null && subject.daysToExam >= 0) {
    return {
      label:
        subject.daysToExam === 0
          ? "Exam today"
          : `${subject.daysToExam}d to exam`,
      urgent: subject.daysToExam <= 7,
      ready: false,
    };
  }
  return {
    label: subject.hasProfile ? "Ready" : "Needs docs",
    urgent: false,
    ready: subject.hasProfile,
  };
}

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

  const hasSubjects = subjectList.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink label="Back to workspace" />

      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-fg-subtle">
              Source material · Index
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your source material library
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
              Each subject stores its syllabus, sample paper and PYQs once, then
              reuses the compact profile for cheap paper and quiz generation.
            </p>
          </div>
          {/* Top action shows only when the ledger has entries — in the empty
              state the folder canvas below is the single, unduplicated CTA. */}
          {hasSubjects && (
            <GlowButton href="/dashboard/subjects/new" size="md">
              <FilePlus2 className="h-4 w-4" />
              New subject
            </GlowButton>
          )}
        </div>
      </Reveal>

      {hasSubjects ? (
        <Reveal className="mt-9">
          <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
            {String(subjectList.length).padStart(2, "0")} entries on file
          </p>
          {/* Ledger index — a 1-column register framed top and bottom, rows
              ruled by hairlines. No cards, no badges: a numbered entry sheet. */}
          <div className="border-y border-line">
            {subjectList.map((subject, index) => {
              const docs = counts.get(subject.id) ?? 0;
              const status = statusFor(subject);
              const mastery =
                subject.masteryPct !== null ? `${subject.masteryPct}%` : "—";
              return (
                <div
                  key={subject.id}
                  className="group grid grid-cols-[2.25rem_1fr] gap-x-3 border-b border-line px-1 py-5 transition-colors last:border-b-0 hover:bg-card-hi sm:grid-cols-[2.75rem_1fr_auto] sm:items-center sm:gap-x-5"
                >
                  <span className="pt-0.5 font-mono text-[0.7rem] leading-tight text-fg-subtle sm:pt-0">
                    [ {String(index + 1).padStart(2, "0")} ]
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-violet-bright">
                        {subject.code}
                      </p>
                      <span
                        className={cn(
                          "rounded-[2px] border px-2 py-0.5 font-mono text-[0.54rem] uppercase tracking-[0.16em]",
                          status.urgent
                            ? "border-gold/40 bg-gold/10 text-gold"
                            : status.ready
                              ? "border-accent/35 bg-accent/10 text-accent"
                              : "border-line-strong bg-card-hi text-fg-muted",
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/subjects/${subject.id}`}
                      className="mt-1 block truncate text-lg font-semibold tracking-tight transition-colors hover:text-violet-bright"
                    >
                      {subject.name}
                    </Link>
                    <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-subtle">
                      {String(docs).padStart(2, "0")} docs ·{" "}
                      {String(subject.papers).padStart(2, "0")} papers · mastery{" "}
                      <span className={masteryClass(subject.masteryPct)}>
                        {mastery}
                      </span>
                    </p>
                  </div>

                  <div className="col-span-2 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-1 sm:mt-0 sm:justify-end">
                    <ExamDatePicker
                      subjectId={subject.id}
                      currentValue={subject.examDate}
                    />
                    <GlowButton href="/dashboard" variant="secondary" size="sm">
                      Generate
                    </GlowButton>
                    <DeleteButton
                      endpoint={`/api/subjects/${subject.id}`}
                      label="subject"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      ) : (
        <Reveal className="mt-9">
          <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
            00 entries on file
          </p>
          {/* Empty ledger — the index sheet with a single blank entry line
              waiting to be filled in. */}
          <div className="border-y border-line">
            <div className="grid grid-cols-[2.75rem_1fr] items-baseline gap-x-5 px-1 py-7">
              <span className="font-mono text-[0.7rem] text-fg-subtle">
                [ 01 ]
              </span>
              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
                  Awaiting first entry
                </p>
                <div className="mt-3 border-b border-dashed border-line-strong" />
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">
                  No subjects on file yet. Add your syllabus, sample paper and
                  PYQs to open the first entry in your library.
                </p>
              </div>
            </div>
          </div>

          {/* Add-subject canvas — an open blueprint folder: ruled border, faint
              drafting grid, square index mark, one flat letterpress CTA. */}
          <div className="relative mt-3 overflow-hidden border border-line bg-canvas">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--bg-grid-fine) 1px, transparent 1px)," +
                  "linear-gradient(to bottom, var(--bg-grid-fine) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
                maskImage: "linear-gradient(135deg, #000 0%, transparent 80%)",
                WebkitMaskImage: "linear-gradient(135deg, #000 0%, transparent 80%)",
              }}
            />
            <div className="relative flex flex-col items-start gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[2px] border border-line-strong bg-card-hi text-violet-bright">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Create your first subject
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
                    Upload reference PDFs once. QraftPaper extracts the text,
                    builds a reusable profile, and uses that profile for every
                    future generation.
                  </p>
                </div>
              </div>
              <GlowButton href="/dashboard/subjects/new" size="md">
                Add subject
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
