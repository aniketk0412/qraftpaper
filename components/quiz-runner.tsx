"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { GlowButton } from "@/components/ui/glow-button";
import { MeterBar } from "@/components/ui/meter-bar";
import { easeOut } from "@/lib/motion";
import { difficultyDarkChip } from "@/lib/difficulty";
import type { Quiz, QuizQuestion } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

// When rendered for a shared (public) quiz the answer key is stripped, so
// correctIndex/explanation are optional and revealed by the grading API.
type RunnerQuestion = Omit<QuizQuestion, "correctIndex" | "explanation"> & {
  correctIndex?: number;
  explanation?: string;
};
type RunnerQuiz = Omit<Quiz, "questions"> & { questions: RunnerQuestion[] };

interface Reveal {
  correctIndex: number;
  explanation: string;
}

export function QuizRunner({
  quiz,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
  gradeUrl,
}: {
  quiz: RunnerQuiz;
  backHref?: string;
  backLabel?: string;
  /** When set, answers are graded server-side instead of from the local key. */
  gradeUrl?: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [reveals, setReveals] = useState<Record<string, Reveal>>({});
  const [grading, setGrading] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = quiz.questions.length;
  const question = quiz.questions[step];
  const picked = answers[question.id];
  const reveal = reveals[question.id];
  const answered = reveal !== undefined;
  const score = quiz.questions.reduce(
    (sum, q) =>
      sum + (reveals[q.id] && answers[q.id] === reveals[q.id].correctIndex ? 1 : 0),
    0,
  );

  async function pick(index: number) {
    if (answered || grading) return;
    setAnswers((a) => ({ ...a, [question.id]: index }));

    if (gradeUrl) {
      setGrading(true);
      try {
        const response = await fetch(gradeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: { [question.id]: index } }),
        });
        const data = (await response.json()) as {
          results?: Record<string, Reveal>;
        };
        const result = data.results?.[question.id];
        if (result) {
          setReveals((prev) => ({
            ...prev,
            [question.id]: {
              correctIndex: result.correctIndex,
              explanation: result.explanation,
            },
          }));
        }
      } catch {
        /* leave ungraded; user can retry next */
      }
      setGrading(false);
    } else {
      setReveals((prev) => ({
        ...prev,
        [question.id]: {
          correctIndex: question.correctIndex ?? -1,
          explanation: question.explanation ?? "",
        },
      }));
    }
  }

  function next() {
    if (step + 1 >= total) {
      setFinished(true);
    } else {
      setStep(step + 1);
    }
  }

  function restart() {
    setAnswers({});
    setReveals({});
    setStep(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="overflow-hidden rounded-2xl glass-strong">
        <span className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-tint/20 to-transparent" />
        <div className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet/15 text-violet-bright ring-1 ring-violet/25">
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="mt-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
            Quiz complete
          </p>
          <p className="mt-3 text-6xl font-semibold tracking-tight text-gradient">
            {score}
            <span className="text-fg-subtle">/{total}</span>
          </p>
          <p className="mt-2 text-sm text-fg-muted">
            You scored {pct}% on {quiz.subject}.
          </p>
          <div className="mt-6 w-full max-w-xs">
            <MeterBar pct={pct} height="h-2" />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-full glass-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-tint/[0.08]"
            >
              <RotateCcw className="h-4 w-4" />
              Retake quiz
            </button>
            <GlowButton href={backHref} size="md">
              {backLabel}
            </GlowButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl glass-strong">
      <div className="border-b border-line px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
            Question {step + 1} of {total}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider",
                difficultyDarkChip[question.difficulty],
              )}
            >
              {question.difficulty}
            </span>
            <span className="rounded border border-line bg-tint/[0.03] px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-fg-muted">
              {question.unit}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <MeterBar pct={((step + (answered ? 1 : 0)) / total) * 100} height="h-1" />
        </div>
      </div>

      <div className="px-6 py-7 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: easeOut }}
          >
            <h3 className="text-lg font-medium leading-snug tracking-tight sm:text-xl">
              {question.prompt}
            </h3>

            <div className="mt-5 flex flex-col gap-2.5">
              {question.options.map((option, i) => {
                const isCorrect = i === reveal?.correctIndex;
                const isPicked = i === picked;
                const state = !answered
                  ? "idle"
                  : isCorrect
                    ? "correct"
                    : isPicked
                      ? "wrong"
                      : "dim";
                return (
                  <button
                    key={option}
                    onClick={() => pick(i)}
                    disabled={answered || grading}
                    className={cn(
                      "group flex items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-200",
                      state === "idle" &&
                        "border-line bg-tint/[0.02] hover:border-line-strong hover:bg-tint/[0.05]",
                      state === "correct" && "border-white/45 bg-tint/[0.12]",
                      state === "wrong" && "border-white/20 bg-tint/[0.045]",
                      state === "dim" && "border-line opacity-45",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-[0.74rem] font-medium transition-colors",
                        state === "idle" &&
                          "bg-tint/[0.05] text-fg-muted group-hover:bg-tint/15 group-hover:text-fg",
                        state === "correct" && "bg-accent text-white",
                        state === "wrong" && "bg-tint/12 text-fg",
                        state === "dim" && "bg-tint/[0.04] text-fg-subtle",
                      )}
                    >
                      {grading && isPicked ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : state === "correct" ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : state === "wrong" ? (
                        <X className="h-4 w-4" strokeWidth={3} />
                      ) : (
                        LETTERS[i]
                      )}
                    </span>
                    <span className="text-[0.92rem] text-fg/90">{option}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 rounded-xl border border-line bg-tint/[0.02] p-4">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-violet-bright">
                      {picked === reveal?.correctIndex ? "Correct" : "Explanation"}
                    </p>
                    <p className="mt-1.5 text-[0.86rem] leading-relaxed text-fg-muted">
                      {reveal?.explanation}
                    </p>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <GlowButton onClick={next} size="md">
                      {step + 1 >= total ? "See results" : "Next question"}
                      <ArrowRight className="h-4 w-4" />
                    </GlowButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
