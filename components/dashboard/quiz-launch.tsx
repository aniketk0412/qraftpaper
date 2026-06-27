"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Feather, Flame, Gauge } from "lucide-react";
import { useMemo, useState } from "react";

import { GlowButton } from "@/components/ui/glow-button";
import { SelectMenu } from "@/components/ui/select-menu";
import { Panel } from "@/components/dashboard/panel";
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
    <Panel label="Practice">
      <h2 className="text-lg font-semibold tracking-tight">Start a quiz</h2>
      <p className="mt-1 max-w-xl text-sm text-fg-muted">
        Pick an intensity, pick a subject, and get a fresh MCQ set built from
        your own material — graded the moment you finish.
      </p>

      {/* One unified intensity matrix — a single bordered panel divided by
          crisp internal rules (divide-y stacked on mobile, divide-x as 3
          columns on desktop). The selected cell inverts to flat ink-indigo
          rather than lifting on a shadow. */}
      <div className="mt-5 grid grid-cols-1 divide-y divide-line border border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {MODES.map((m) => {
          const active = m.id === modeId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModeId(m.id)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-2 p-3.5 text-left transition-colors",
                active
                  ? "bg-accent text-on-accent"
                  : "bg-transparent hover:bg-card-hi",
              )}
            >
              <m.icon
                className={cn(
                  "h-[18px] w-[18px]",
                  active ? "text-on-accent" : "text-fg-muted",
                )}
              />
              <span className="flex flex-col">
                <span className="text-[0.92rem] font-semibold">{m.label}</span>
                <span
                  className={cn(
                    "mt-0.5 font-mono text-[0.58rem] uppercase tracking-wider",
                    active ? "text-on-accent/75" : "text-fg-subtle",
                  )}
                >
                  {m.questionCount} Q · {m.durationMins} min
                </span>
              </span>
              <span
                className={cn(
                  "text-[0.74rem] leading-snug",
                  active ? "text-on-accent/85" : "text-fg-muted",
                )}
              >
                {m.tagline}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-subtle">
            Subject
          </span>
          <SelectMenu
            ariaLabel="Quiz subject"
            value={subjectId}
            onChange={setSubjectId}
            placeholder="Choose a subject"
            emptyLabel="No profiled subjects"
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
    </Panel>
    </>
  );
}
