"use client";

import { useRouter } from "next/navigation";
import { FilePlus2, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import type { DashboardSubject } from "@/lib/subjects";

export function GenerationPanel({ subjects }: { subjects: DashboardSubject[] }) {
  const router = useRouter();
  const readySubjects = useMemo(
    () => subjects.filter((subject) => subject.hasProfile),
    [subjects],
  );
  const [subjectId, setSubjectId] = useState(readySubjects[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<"paper" | "quiz" | null>(null);

  async function generatePaper() {
    if (!subjectId) return;
    setPending("paper");
    setStatus("Generating paper...");

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

    const body = (await response.json()) as {
      paper?: { id: string };
      error?: string;
    };

    if (!response.ok || !body.paper) {
      setPending(null);
      setStatus(body.error ?? "Unable to generate paper");
      return;
    }

    router.push(`/papers/${body.paper.id}`);
  }

  async function generateQuiz() {
    if (!subjectId) return;
    setPending("quiz");
    setStatus("Generating quiz...");

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

    const body = (await response.json()) as {
      quiz?: { id: string };
      error?: string;
    };

    if (!response.ok || !body.quiz) {
      setPending(null);
      setStatus(body.error ?? "Unable to generate quiz");
      return;
    }

    router.push(`/quiz/${body.quiz.id}`);
  }

  return (
    <GlassCard className="mt-10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
            Generate
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Create from a subject profile
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Choose a profiled subject, then generate a paper or MCQ quiz.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.72rem] font-medium text-fg-muted">
              Subject
            </span>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              disabled={readySubjects.length === 0}
              className="h-11 rounded-xl border border-line bg-canvas px-3.5 text-sm text-fg transition-all duration-200 focus:border-violet/50 focus:outline-none focus:ring-2 focus:ring-violet/20"
            >
              {readySubjects.length === 0 && (
                <option value="">No profiled subjects</option>
              )}
              {readySubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} — {subject.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <GlowButton
              type="button"
              variant="secondary"
              size="md"
              disabled={!subjectId || pending !== null}
              onClick={generateQuiz}
            >
              <IconTile icon={ListChecks} size="sm" tone="neutral" />
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
    </GlassCard>
  );
}
