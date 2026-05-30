"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BookmarkCheck,
  Check,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { GlowButton } from "@/components/ui/glow-button";
import { MeterBar } from "@/components/ui/meter-bar";
import { Confetti } from "@/components/ui/confetti";
import { easeOut } from "@/lib/motion";
import { difficultyDarkChip } from "@/lib/difficulty";
import { clearWrongAnswer, parseDrillQuestionId } from "@/lib/quiz-history";
import type { Quiz } from "@/lib/types";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

/**
 * Focused-practice runner for the "Drill your mistakes" loop.
 *
 * Distinct from QuizRunner in three deliberate ways:
 *   1. NO TIMER. Drilling is about getting it right, not racing.
 *   2. THE LOOP CLOSES. When the user answers a drill question correctly,
 *      we call clearWrongAnswer() to remove it from the localStorage
 *      backlog — so the dashboard "N to revisit" count actually goes down
 *      and a mastered question stops coming back.
 *   3. NO HISTORY POLLUTION. We don't write a QuizAttempt or new
 *      WrongAnswer records — a drill is practice over existing data, not a
 *      fresh quiz worth logging.
 *
 * Answer key is in-memory (the quiz was reconstructed client-side from the
 * wrong-answer log), so grading is instant with no network round-trip.
 */
export function DrillRunner({ quiz }: { quiz: Quiz }) {
  const total = quiz.questions.length;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [clearedCount, setClearedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = quiz.questions[step];
  const answered = picked !== null;
  const isCorrect = answered && picked === question.correctIndex;

  function pick(index: number) {
    if (answered) return;
    setPicked(index);
    if (index === question.correctIndex) {
      setCorrectCount((c) => c + 1);
      // Close the loop — this question is mastered, drop it from the
      // backlog so it doesn't resurface and the dashboard count falls.
      const origin = parseDrillQuestionId(question.id);
      if (origin) {
        clearWrongAnswer(origin.quizId, origin.questionId);
        setClearedCount((c) => c + 1);
      }
    }
    // Wrong answers stay in the backlog — the user sees them again next
    // drill until they get them right.
  }

  function next() {
    if (step + 1 >= total) {
      setFinished(true);
    } else {
      setStep(step + 1);
      setPicked(null);
    }
  }

  // Keyboard shortcuts: 1-4 picks an option, Enter advances once answered.
  // Mirrors QuizRunner so the muscle memory carries over between the two
  // surfaces. Skipped while focus is in an editable element.
  useEffect(() => {
    if (finished) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t?.tagName === "INPUT" ||
        t?.tagName === "TEXTAREA" ||
        t?.isContentEditable
      ) {
        return;
      }
      if (e.key === "Enter" && answered) {
        e.preventDefault();
        next();
        return;
      }
      if (!answered) {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= question.options.length) {
          e.preventDefault();
          pick(n - 1);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // pick/next close over the current question/step; rebind on what changes
    // the running question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, answered, step, question.id, question.options.length]);

  if (finished) {
    const pct = Math.round((correctCount / total) * 100);
    const allCleared = clearedCount === total;
    return (
      <div className="relative overflow-hidden rounded-2xl glass-strong">
        {allCleared && <Confetti />}
        <div className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
          <span
            className={cn(
              "grid h-14 w-14 place-items-center rounded-2xl ring-1",
              allCleared
                ? "bg-accent/20 text-accent ring-accent/40"
                : "bg-violet/15 text-violet-bright ring-violet/25",
            )}
          >
            {allCleared ? (
              <BookmarkCheck className="h-6 w-6" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </span>
          <p className="mt-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
            Drill complete
          </p>
          <p className="mt-3 text-display text-gradient">
            {correctCount}
            <span className="text-fg-subtle">/{total}</span>
          </p>
          <p className="mt-2 text-sm text-fg-muted">
            {clearedCount > 0
              ? `${clearedCount} question${clearedCount === 1 ? "" : "s"} cleared from your backlog.`
              : "None cleared this round — try them again."}
          </p>
          <div className="mt-6 w-full max-w-xs">
            <MeterBar pct={pct} height="h-2" />
          </div>
          <p className="mt-6 max-w-sm text-[0.82rem] leading-relaxed text-fg-muted">
            {allCleared
              ? "Backlog cleared. The ones you missed before are now the ones you know. That's the whole game."
              : "The questions you missed again are still saved. Come back and drill them until they stick."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <GlowButton href="/dashboard" size="md">
              Back to dashboard
              <ArrowRight className="h-4 w-4" />
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
            Drill {step + 1} of {total}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded border border-violet/40 bg-violet/10 px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-violet-bright">
              <Target className="h-3 w-3" />
              No timer
            </span>
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
          <MeterBar
            pct={((step + (answered ? 1 : 0)) / total) * 100}
            height="h-1"
          />
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
                const optionIsCorrect = i === question.correctIndex;
                const optionIsPicked = i === picked;
                const state = !answered
                  ? "idle"
                  : optionIsCorrect
                    ? "correct"
                    : optionIsPicked
                      ? "wrong"
                      : "dim";
                return (
                  <button
                    key={option}
                    onClick={() => pick(i)}
                    disabled={answered}
                    className={cn(
                      "group flex items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-200",
                      state === "idle" &&
                        "border-line bg-tint/[0.02] hover:border-line-strong hover:bg-tint/[0.05]",
                      state === "correct" &&
                        "border-accent/45 bg-accent/[0.1]",
                      state === "wrong" && "border-gold/45 bg-gold/[0.08]",
                      state === "dim" && "border-line opacity-45",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-[0.74rem] font-medium transition-colors",
                        state === "idle" &&
                          "bg-tint/[0.05] text-fg-muted group-hover:bg-tint/15 group-hover:text-fg",
                        state === "correct" && "bg-accent text-on-accent",
                        state === "wrong" && "bg-gold text-canvas",
                        state === "dim" && "bg-tint/[0.04] text-fg-subtle",
                      )}
                    >
                      {state === "correct" ? (
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
                  <div
                    className={cn(
                      "mt-5 rounded-xl border p-4",
                      isCorrect
                        ? "border-accent/30 bg-accent/[0.05]"
                        : "border-gold/30 bg-gold/[0.06]",
                    )}
                  >
                    <p
                      className={cn(
                        "font-mono text-[0.62rem] uppercase tracking-[0.18em]",
                        isCorrect ? "text-accent" : "text-gold",
                      )}
                    >
                      {isCorrect
                        ? "Correct — cleared from your backlog"
                        : "Still missed — kept for next time"}
                    </p>
                    <p className="mt-1.5 text-[0.86rem] leading-relaxed text-fg-muted">
                      {question.explanation}
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
