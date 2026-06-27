"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";

import { GlowButton } from "@/components/ui/glow-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { Panel } from "@/components/dashboard/panel";
import { GenerationProgress } from "@/components/dashboard/generation-progress";
import { FormError } from "@/components/ui/form-error";
import type { DashboardSubject } from "@/lib/subjects";

export function GenerationPanel({
  subjects,
  generationsUsed = 0,
  generationsCap = null,
}: {
  subjects: DashboardSubject[];
  /** How many generations the user has already burned this month. */
  generationsUsed?: number;
  /** Plan ceiling. 0 = unpaid. null is accepted defensively by shared callers. */
  generationsCap?: number | null;
}) {
  const router = useRouter();
  const readySubjects = useMemo(
    () => subjects.filter((subject) => subject.hasProfile),
    [subjects],
  );
  const [subjectId, setSubjectId] = useState(readySubjects[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"paper" | "quiz" | null>(null);

  async function generatePaper() {
    if (!subjectId) return;
    setPending("paper");
    setStatus("Generating paper...");
    setError(null);

    const subject = readySubjects.find((item) => item.id === subjectId);
    const response = await fetch("/api/generate/paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        config: {
          totalMarks: 70,
          durationMins: 180,
          course: subject?.name,
          examTitle: "End-Semester Examination",
          units: [],
          sections: [
            {
              title: "Section A — Short Answer",
              instruction: "Answer all questions. Each question carries 2 marks.",
              marksPerQuestion: 2,
              count: 5,
            },
            {
              title: "Section B — Descriptive",
              instruction: "Answer any three questions. Each question carries 10 marks.",
              marksPerQuestion: 10,
              count: 3,
            },
            {
              title: "Section C — Long Answer",
              instruction: "Answer any two questions. Each question carries 15 marks.",
              marksPerQuestion: 15,
              count: 2,
            },
          ],
          difficultyMix: { Easy: 30, Medium: 50, Hard: 20 },
        },
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      paper?: { id: string };
      error?: string;
    };

    if (!response.ok || !body.paper) {
      setPending(null);
      setStatus(null);
      setError(body.error ?? "Unable to generate paper");
      return;
    }

    router.push(`/papers/${body.paper.id}`);
  }

  async function generateQuiz() {
    if (!subjectId) return;
    setPending("quiz");
    setStatus("Generating quiz...");
    setError(null);

    const response = await fetch("/api/generate/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        config: {
          questionCount: 10,
          durationMins: 20,
          difficultyMix: { Easy: 30, Medium: 50, Hard: 20 },
        },
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      quiz?: { id: string };
      error?: string;
    };

    if (!response.ok || !body.quiz) {
      setPending(null);
      setStatus(null);
      setError(body.error ?? "Unable to generate quiz");
      return;
    }

    router.push(`/quiz/${body.quiz.id}`);
  }

  return (
    <>
      <GenerationProgress
        key={pending ?? "closed"}
        kind={pending ?? "paper"}
        open={pending !== null}
      />
    <Panel label="Generate">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Create from a subject profile
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Choose a profiled subject, then generate a paper or MCQ quiz.
          </p>
          {generationsCap !== null && generationsCap > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-[2px] border border-line bg-card-hi px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-muted">
              <span
                className={
                  generationsCap - generationsUsed <= 3
                    ? "text-gold"
                    : "text-violet-bright"
                }
              >
                {Math.max(0, generationsCap - generationsUsed)}
              </span>
              <span>of {generationsCap} generations left this cycle</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5 sm:w-60">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-subtle">
              Subject
            </span>
            <SelectMenu
              ariaLabel="Subject"
              value={subjectId}
              onChange={setSubjectId}
              placeholder="Choose a subject"
              emptyLabel={
                subjects.length > 0 ? "No subjects ready yet" : "No subjects yet"
              }
              emptyHint={
                // If they already have subjects, the blocker is missing
                // documents — point at the subject, not "create another one".
                subjects.length > 0 ? (
                  <Link
                    href="/dashboard/subjects"
                    className="text-accent transition-colors hover:text-accent-soft"
                  >
                    Add documents to a subject to start generating
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/subjects/new"
                    className="text-accent transition-colors hover:text-accent-soft"
                  >
                    Create a subject to get started
                  </Link>
                )
              }
              options={readySubjects.map((subject) => ({
                value: subject.id,
                label: `${subject.code} — ${subject.name}`,
              }))}
            />
          </div>

          <div className="flex gap-2">
            <GlowButton
              type="button"
              variant="secondary"
              size="md"
              disabled={!subjectId || pending !== null}
              onClick={generateQuiz}
            >
              <ListChecks className="h-4 w-4" />
              {pending === "quiz" ? "Generating..." : "Quiz"}
            </GlowButton>
            <GlowButton
              type="button"
              size="md"
              disabled={!subjectId || pending !== null}
              onClick={generatePaper}
            >
              <FilePlus2 className="h-4 w-4" />
              {pending === "paper" ? "Generating..." : "Paper"}
            </GlowButton>
          </div>
        </div>
      </div>

      {status && <p className="mt-3 text-[0.78rem] text-fg-subtle">{status}</p>}
      {error && <FormError className="mt-3">{error}</FormError>}
    </Panel>
    </>
  );
}
