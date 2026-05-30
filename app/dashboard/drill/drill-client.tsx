"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookmarkCheck, ListChecks } from "lucide-react";
import { useState } from "react";
import { DrillRunner } from "@/components/drill-runner";
import { GlowButton } from "@/components/ui/glow-button";
import { loadDrillQuiz } from "@/lib/quiz-history";
import type { Quiz } from "@/lib/types";

/**
 * Client shell for the drill page. The wrong-answer backlog lives in
 * localStorage, so the quiz can only be reconstructed on the client. We
 * read it once via a lazy useState initializer (returns null during SSR,
 * resolved on the first client render — the page renders a brief nothing
 * then the runner, no flash of wrong content because the whole subtree is
 * client-only).
 */
export function DrillClient() {
  const [quiz] = useState<Quiz | null>(() => loadDrillQuiz());

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
                  ? `${quiz.questions.length} question${quiz.questions.length === 1 ? "" : "s"} you missed before`
                  : "Focused practice on questions you got wrong"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        {quiz ? (
          <DrillRunner quiz={quiz} />
        ) : (
          <EmptyDrillState />
        )}
      </main>
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
