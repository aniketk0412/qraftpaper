"use client";

import Link from "next/link";
import { CalendarClock, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { computeReadiness, type ReadinessBand } from "@/lib/exam-readiness";
import type { DashboardSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

// Readiness band → chip tone, aligned with the app's colour language.
const BAND_TONE: Record<ReadinessBand, "accent" | "violet" | "gold" | "neutral"> = {
  ready: "accent",
  solid: "violet",
  building: "gold",
  starting: "gold",
  setup: "neutral",
};

function masteryClass(pct: number | null): string {
  if (pct === null) return "text-fg-subtle";
  if (pct >= 80) return "text-accent";
  if (pct >= 55) return "text-violet-bright";
  return "text-gold";
}

type Sort = "recent" | "papers" | "name";

const sorts: { key: Sort; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "papers", label: "Most papers" },
  { key: "name", label: "A–Z" },
];

export function SubjectsSection({
  subjects: initialSubjects,
}: {
  subjects: DashboardSubject[];
}) {
  const [sort, setSort] = useState<Sort>("recent");

  const subjects = useMemo(() => {
    const list = [...initialSubjects];
    if (sort === "papers") list.sort((a, b) => b.papers - a.papers);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [initialSubjects, sort]);

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Your subjects</h2>
        {/* Squared segmented control — a ruled mono matrix, not a pill. */}
        <div className="flex items-center self-start divide-x divide-line border border-line">
          {sorts.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={cn(
                "px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] transition-colors",
                sort === s.key
                  ? "bg-accent text-on-accent"
                  : "text-fg-muted hover:bg-card-hi hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="mt-4 border border-line bg-card-hi/40 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[0.95rem] font-medium tracking-tight">
                No subjects yet
              </h3>
              <p className="mt-1 text-sm text-fg-muted">
                Create a subject and upload the syllabus, sample paper and PYQs
                to build its profile.
              </p>
            </div>
            <Link
              href="/dashboard/subjects/new"
              className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-violet-bright transition-colors hover:text-violet"
            >
              New subject
            </Link>
          </div>
        </div>
      ) : (
        // Flat drawer-ledger: continuous ruled cells, no floating cards, no
        // circular dials. Mastery reads as a crisp mono figure.
        <div className="plate-grid mt-4 grid sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject) => {
            const readiness = computeReadiness({
              hasProfile: subject.hasProfile,
              masteryPct: subject.masteryPct,
              quizzesTaken: subject.quizzesTaken,
              papersGenerated: subject.papers,
            });
            const mastery =
              subject.masteryPct !== null ? `${subject.masteryPct}%` : "—";
            return (
              <Link
                key={subject.id}
                href={`/dashboard/subjects/${subject.id}`}
                className="flex h-full flex-col p-4 transition-colors hover:bg-card-hi"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
                    {subject.code}
                  </p>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-widest tabular-nums",
                      masteryClass(subject.masteryPct),
                    )}
                  >
                    {mastery}
                  </span>
                </div>
                <h3 className="mt-2 text-[0.95rem] font-medium leading-snug tracking-tight">
                  {subject.name}
                </h3>

                {(subject.hasProfile ||
                  (subject.daysToExam !== null && subject.daysToExam >= 0)) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {subject.hasProfile && (
                      <SubjectChip
                        icon={Target}
                        tone={BAND_TONE[readiness.band]}
                        label={readiness.label}
                      />
                    )}
                    {subject.daysToExam !== null && subject.daysToExam >= 0 && (
                      <SubjectChip
                        icon={CalendarClock}
                        tone={subject.daysToExam <= 3 ? "gold" : "neutral"}
                        label={
                          subject.daysToExam === 0
                            ? "Exam today"
                            : subject.daysToExam === 1
                              ? "1 day to exam"
                              : `${subject.daysToExam} days to exam`
                        }
                      />
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-line pt-3 font-mono text-[10px] uppercase tracking-widest text-fg-subtle">
                  <span>{subject.papers} papers</span>
                  <span>{subject.lastGenerated}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubjectChip({
  icon: Icon,
  tone,
  label,
}: {
  icon: typeof Target;
  tone: "accent" | "violet" | "gold" | "neutral";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 font-mono text-[0.54rem] uppercase tracking-[0.14em]",
        tone === "accent" && "border-accent/35 bg-accent/10 text-accent",
        tone === "violet" && "border-violet/35 bg-violet/10 text-violet-bright",
        tone === "gold" && "border-gold/35 bg-gold/10 text-gold",
        tone === "neutral" && "border-line-strong bg-card-hi text-fg-muted",
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
