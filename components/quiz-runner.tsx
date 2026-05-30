"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Clock,
  Loader2,
  RotateCcw,
  Share2,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/ui/confetti";
import { GlowButton } from "@/components/ui/glow-button";
import { MeterBar } from "@/components/ui/meter-bar";
import { easeOut } from "@/lib/motion";
import { difficultyDarkChip } from "@/lib/difficulty";
import { loadQuizHistory, saveQuizAttempt } from "@/lib/quiz-history";
import type { Quiz, QuizQuestion } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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

  const totalSeconds = Math.max(1, quiz.durationMins * 60);
  const [deadline, setDeadline] = useState(() => Date.now() + totalSeconds * 1000);
  const [remaining, setRemaining] = useState(totalSeconds);
  const savedRef = useRef(false);

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

  // Countdown — derived from a deadline so it survives tab throttling. Auto
  // submits when time runs out. (setState calls live in the timer callback, not
  // the effect body.)
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setFinished(true);
    }, 1000);
    return () => clearInterval(id);
  }, [finished, deadline]);

  // Record the attempt once when the quiz finishes — both locally (so the
  // taker sees previous attempts) and server-side (so the quiz owner can see
  // how many people tried their quiz, and so streaks bump for signed-in
  // takers).
  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    saveQuizAttempt({
      quizId: quiz.id,
      title: quiz.title,
      subjectCode: quiz.subjectCode,
      score,
      total,
      takenAt: Date.now(),
    });
    const durationSeconds = totalSeconds - remaining;
    void fetch(`/api/quiz/${quiz.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, total, durationSeconds }),
    }).catch(() => {
      /* analytics failures must never disrupt the user */
    });
  }, [finished, score, total, quiz, totalSeconds, remaining]);

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
    savedRef.current = false;
    setDeadline(Date.now() + totalSeconds * 1000);
    setRemaining(totalSeconds);
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const allPrev = (typeof window !== "undefined" ? loadQuizHistory() : [])
      .filter((h) => h.quizId === quiz.id);
    const previous = allPrev.slice(0, 5);

    // Personal-best detection: was this attempt strictly the best ever?
    // We compare PERCENT (not raw score) so re-takes of a different-length
    // version of the same quiz still surface a sensible "new best."
    //
    // allPrev already includes the attempt we just saved this render (the
    // save runs in an effect above), so we exclude it when comparing.
    const previousBest = allPrev
      .filter((a) => a.takenAt !== allPrev[0]?.takenAt) // drop just-saved
      .reduce(
        (best, a) => Math.max(best, (a.score / a.total) * 100),
        0,
      );
    const isPersonalBest =
      allPrev.length >= 2 && pct > previousBest && pct > 0;
    const isPerfect = score === total && total > 0;

    return (
      <div className="relative overflow-hidden rounded-2xl glass-strong">
        <span className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-tint/20 to-transparent" />
        {/* Confetti only on the celebration paths — perfect score or new
            personal best. Honours prefers-reduced-motion internally. */}
        {(isPerfect || isPersonalBest) && <Confetti />}
        <div className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
          <span
            className={cn(
              "grid h-14 w-14 place-items-center rounded-2xl ring-1",
              isPerfect || isPersonalBest
                ? "bg-gold/20 text-gold ring-gold/40"
                : "bg-violet/15 text-violet-bright ring-violet/25",
            )}
          >
            {isPerfect || isPersonalBest ? (
              <Trophy className="h-6 w-6" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </span>
          <p className="mt-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
            {isPerfect
              ? "Perfect score"
              : isPersonalBest
                ? "New personal best"
                : "Quiz complete"}
          </p>
          <p className="mt-3 text-display text-gradient">
            {score}
            <span className="text-fg-subtle">/{total}</span>
          </p>
          <p className="mt-2 text-sm text-fg-muted">
            You scored {pct}% on {quiz.subject}.
          </p>

          {isPersonalBest && previousBest > 0 && (
            // Small "you beat your old best of X%" subtitle — concrete proof
            // of progress is the cheapest dopamine in habit-app design.
            <p className="mt-1.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-gold">
              +{Math.round(pct - previousBest)} from your previous best of{" "}
              {Math.round(previousBest)}%
            </p>
          )}

          <div className="mt-6 w-full max-w-xs">
            <MeterBar pct={pct} height="h-2" />
          </div>

          {previous.length > 0 && (
            <div className="mt-8 w-full max-w-xs text-left">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
                Previous attempts
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {previous.map((attempt, i) => (
                  <li
                    key={`${attempt.takenAt}-${i}`}
                    className="flex items-center justify-between text-[0.8rem]"
                  >
                    <span className="text-fg-muted">
                      {new Date(attempt.takenAt).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-fg">
                      {attempt.score}/{attempt.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ShareScoreButton
            quizId={quiz.id}
            quizTitle={quiz.title}
            score={score}
            total={total}
          />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
                "flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider tabular-nums",
                remaining <= 30
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-line bg-tint/[0.03] text-fg-muted",
              )}
            >
              <Clock className="h-3 w-3" />
              {formatTime(remaining)}
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
                        state === "correct" && "bg-accent text-on-accent",
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

/**
 * Post-quiz "Share my score" card. Uses the native Web Share API on phones
 * (which lets you fling straight to WhatsApp / Instagram DMs), and falls
 * back to copy-link on desktop where Share isn't supported.
 *
 * The shared link always points back at QraftPaper — every share is a tiny
 * acquisition channel.
 */
function ShareScoreButton({
  quizId,
  quizTitle,
  score,
  total,
}: {
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof window === "undefined") return;
    // Demo quiz lives at /demo/quiz; everything else is a real shared quiz
    // at /take/<uuid>.
    const path = quizId === "demo" ? "/demo/quiz" : `/take/${quizId}`;
    const url = `${window.location.origin}${path}`;
    const text = `I scored ${score}/${total} on "${quizTitle}" — try beating me on QraftPaper:`;

    if (navigator.share) {
      try {
        await navigator.share({ title: quizTitle, text, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mt-8 w-full max-w-sm rounded-2xl border border-violet/25 bg-violet/[0.06] p-4 text-left">
      <p className="text-[0.86rem] font-medium">Beat your friends</p>
      <p className="mt-1 text-[0.76rem] leading-snug text-fg-muted">
        Send this exact quiz to your study group and compare scores.
      </p>
      <button
        type="button"
        onClick={handleShare}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[0.84rem] font-medium text-on-accent transition-colors hover:bg-[#247373]"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Link copied
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" />
            Share my score
          </>
        )}
      </button>
    </div>
  );
}
