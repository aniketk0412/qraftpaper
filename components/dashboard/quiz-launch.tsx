"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Feather, Flame, Gauge, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { SelectMenu } from "@/components/ui/select-menu";
import { GenerationProgress } from "@/components/dashboard/generation-progress";
import type { DashboardSubject } from "@/lib/subjects";
import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

type ModeId = "easy" | "normal" | "hard";

interface QuizMode {
  id: ModeId;
  label: string;
  icon: typeof Feather;
  tagline: string;
  difficultyMix: Record<Difficulty, number>;
  questionCount: number;
  durationMins: number;
}

const MODES: QuizMode[] = [
  {
    id: "easy",
    label: "Easy",
    icon: Feather,
    tagline: "Warm up with recall-first questions and a gentle pace.",
    difficultyMix: { Easy: 70, Medium: 25, Hard: 5 },
    questionCount: 8,
    durationMins: 12,
  },
  {
    id: "normal",
    label: "Normal",
    icon: Gauge,
    tagline: "A fair spread across the difficulty curve — exam-like.",
    difficultyMix: { Easy: 30, Medium: 50, Hard: 20 },
    questionCount: 10,
    durationMins: 20,
  },
  {
    id: "hard",
    label: "Hard",
    icon: Flame,
    tagline: "Application-heavy questions that push past memorisation.",
    difficultyMix: { Easy: 10, Medium: 35, Hard: 55 },
    questionCount: 12,
    durationMins: 28,
  },
];

export function QuizLaunch({ subjects }: { subjects: DashboardSubject[] }) {
  const router = useRouter();
  const readySubjects = useMemo(
    () => subjects.filter((subject) => subject.hasProfile),
    [subjects],
  );
  const [subjectId, setSubjectId] = useState(readySubjects[0]?.id ?? "");
  const [modeId, setModeId] = useState<ModeId>("normal");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const mode = MODES.find((m) => m.id === modeId) ?? MODES[1];

  async function startQuiz() {
    if (!subjectId || pending) return;
    setPending(true);
    setStatus(`Building your ${mode.label.toLowerCase()} quiz...`);

    const response = await fetch("/api/generate/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        config: {
          questionCount: mode.questionCount,
          durationMins: mode.durationMins,
          difficultyMix: mode.difficultyMix,
        },
      }),
    });

    const body = (await response.json()) as {
      quiz?: { id: string };
      error?: string;
    };

    if (!response.ok || !body.quiz) {
      setPending(false);
      setStatus(body.error ?? "Unable to start quiz");
      return;
    }

    router.push(`/quiz/${body.quiz.id}`);
  }

  return (
    <>
      <GenerationProgress
        key={pending ? "open" : "closed"}
        kind="quiz"
        open={pending}
      />
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <IconTile icon={ListChecks} size="sm" tone="neutral" />
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
          Practice
        </p>
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-tight">
        Start a quiz
      </h2>
      <p className="mt-1 max-w-xl text-sm text-fg-muted">
        Pick an intensity, pick a subject, and get a fresh MCQ set built from
        your own material — graded the moment you finish.
      </p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {MODES.map((m) => {
          const active = m.id === modeId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModeId(m.id)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border p-3.5 text-left transition-all duration-200",
                active
                  ? "border-accent/40 bg-accent/[0.08] ring-1 ring-accent/30"
                  : "border-line bg-tint/[0.02] hover:border-line-strong hover:bg-tint/[0.04]",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl ring-1 transition-colors",
                  active
                    ? "bg-accent/15 text-accent ring-accent/30"
                    : "bg-tint/[0.04] text-fg-muted ring-line",
                )}
              >
                <m.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[0.92rem] font-semibold">{m.label}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-fg-subtle">
                  {m.questionCount} Q · {m.durationMins} min
                </span>
              </span>
              <span className="text-[0.76rem] leading-snug text-fg-muted">
                {m.tagline}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-[0.72rem] font-medium text-fg-muted">
            Subject
          </span>
          <SelectMenu
            ariaLabel="Quiz subject"
            value={subjectId}
            onChange={setSubjectId}
            placeholder="Choose a subject"
            emptyLabel={
              subjects.length > 0 ? "No subjects ready yet" : "No subjects yet"
            }
            emptyHint={
              subjects.length > 0 ? (
                <Link
                  href="/dashboard/subjects"
                  className="text-accent transition-colors hover:text-accent-soft"
                >
                  Add documents to a subject to start
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
        <GlowButton
          type="button"
          size="md"
          disabled={!subjectId || pending}
          onClick={startQuiz}
          className="shrink-0"
        >
          {pending ? "Generating..." : `Start ${mode.label} quiz`}
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>

      {status && <p className="mt-3 text-[0.78rem] text-fg-subtle">{status}</p>}
    </GlassCard>
    </>
  );
}
