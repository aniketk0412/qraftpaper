"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  ListChecks,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DrillRunner } from "@/components/drill-runner";
import { GlowButton } from "@/components/ui/glow-button";
import { loadDrillQuiz, loadWeakUnits } from "@/lib/quiz-history";
import type { WeakUnit } from "@/lib/quiz-history";
import type { Quiz } from "@/lib/types";

/**
 * Client shell for the drill page. Two sources feed the session, kept in sync
 * by dual-writes from the quiz/drill runners:
 *
 *   1. localStorage — this device's wrong-answer backlog, read synchronously
 *      via lazy useState so a returning user on the same device sees their
 *      drill instantly with no spinner.
 *   2. The server schedule (/api/reviews/due) — the cross-device source of
 *      truth. We pull it only when this device has no local backlog (e.g. a
 *      fresh browser or a second device), so the drill follows the user.
 *
 * Flow: start screen (weak-unit breakdown) -> runner. We surface the unit
 * breakdown BEFORE the first question because "you keep missing Unit III"
 * is the actionable insight; dropping the user straight into Q1 buries it.
 */
export function DrillClient() {
  const [quiz, setQuiz] = useState<Quiz | null>(() => loadDrillQuiz());
  const [weak] = useState<WeakUnit[]>(() => loadWeakUnits());
  const [started, setStarted] = useState(false);

  // Cross-device fallback: if this device's local backlog is empty, ask the
  // server for the user's due cards. Best-effort — on failure we keep the
  // (empty) local state and the empty-state UI shows. Skipped entirely when
  // local already has cards, so same-device drills never wait on the network.
  useEffect(() => {
    if (quiz) return;
    let cancelled = false;
    fetch("/api/reviews/due")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { quiz: Quiz | null } | null) => {
        if (!cancelled && data?.quiz) setQuiz(data.quiz);
      })
      .catch(() => {
        /* keep local state; empty-state UI handles the no-cards case */
      });
    return () => {
      cancelled = true;
    };
  }, [quiz]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="h-8 w-px bg-line" />
            <div className="leading-tight">
              <p className="text-sm font-medium">Drill your mistakes</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                {quiz
                  ? `${quiz.questions.length} question${quiz.questions.length === 1 ? "" : "s"} due for review`
                  : "Focused practice on questions you got wrong"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        {!quiz ? (
          <EmptyDrillState />
        ) : started ? (
          <DrillRunner quiz={quiz} />
        ) : (
          <DrillStartScreen
            count={quiz.questions.length}
            weak={weak}
            onStart={() => setStarted(true)}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Pre-drill summary. Shows the weak-unit breakdown so the user sees the
 * pattern in their misses, then a single Start button. The unit bars are
 * scaled to the heaviest unit so the worst offender is visually obvious.
 */
function DrillStartScreen({
  count,
  weak,
  onStart,
}: {
  count: number;
  weak: WeakUnit[];
  onStart: () => void;
}) {
  const peak = Math.max(1, ...weak.map((w) => w.count));
  return (
    <div className="overflow-hidden rounded-2xl glass-strong">
      <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet/15 text-violet-bright ring-1 ring-violet/25">
          <Target className="h-6 w-6" />
        </span>
        <p className="mt-5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
          Ready to drill
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {count} question{count === 1 ? "" : "s"} due for review
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[0.9rem] leading-relaxed text-fg-muted">
          Spaced repetition. No timer. Recall each one — the ones you get right
          come back later, spaced further out each time, until they retire. The
          ones you miss are due again right away.
        </p>
      </div>

      {weak.length > 0 && (
        <div className="border-t border-line px-6 py-6 sm:px-10">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
            Where you&apos;re losing marks
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {weak.map((w) => (
              <li key={w.unit} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate font-mono text-[0.7rem] uppercase tracking-wider text-fg-muted">
                  {w.unit}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-tint/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet to-gold"
                    style={{ width: `${(w.count / peak) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-mono text-[0.8rem] tabular-nums text-fg">
                  {w.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-center border-t border-line px-6 py-6">
        <GlowButton onClick={onStart} size="md">
          Start drilling
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </div>
    </div>
  );
}

/**
 * Shown when there's nothing to drill — either a brand-new user or someone
 * who has cleared their whole backlog. The "cleared it all" case is a real
 * achievement, so we frame it as a win rather than an empty void.
 */
function EmptyDrillState() {
  return (
    <div className="overflow-hidden rounded-2xl glass-strong p-8 text-center sm:p-12">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
        <BookmarkCheck className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">
        Nothing to drill right now
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[0.9rem] leading-relaxed text-fg-muted">
        Your mistake backlog is empty. Either you&apos;ve cleared everything —
        in which case, respect — or you haven&apos;t taken a quiz on this device
        yet. Take a quiz and the questions you miss will collect here for
        focused practice.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <GlowButton href="/dashboard" size="md">
          <ListChecks className="h-4 w-4" />
          Start a quiz
        </GlowButton>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full glass px-5 py-2.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          Back to dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
