"use client";

import Link from "next/link";
import { ArrowRight, BookmarkX } from "lucide-react";
import { useEffect, useState } from "react";
import { unrevisitedWrongCount } from "@/lib/quiz-history";

/**
 * Tiny client-only banner that nudges the user to revisit the questions
 * they got wrong recently. Driven by per-device localStorage (set by the
 * QuizRunner on finish) so there's no DB cost.
 *
 * Self-hides when there are zero unrevisited wrongs OR when localStorage
 * is unavailable. Threshold of 3 — a single missed question isn't worth
 * surfacing as "you have X to revisit," but three+ is a real signal.
 *
 * The CTA points back at /dashboard (no dedicated drill page yet — the
 * server-side schema for per-question results is the gating work). Until
 * then, "Revisit" sends them to the dashboard where they can retake the
 * relevant quiz from QuizLaunch.
 */
export function DrillMistakesCard() {
  // Read localStorage once on mount via lazy useState. Server render
  // returns 0 so the card stays hidden until hydration — no flash.
  const [count, setCount] = useState<number>(() =>
    typeof window === "undefined" ? 0 : unrevisitedWrongCount(),
  );

  // Re-read whenever the tab regains focus — if the user finished a quiz
  // in another tab the count should refresh without a hard reload.
  useEffect(() => {
    function refresh() {
      setCount(unrevisitedWrongCount());
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  if (count < 3) return null;

  return (
    <Link
      href="/dashboard/drill"
      className="group relative mb-6 flex items-center gap-4 overflow-hidden rounded-2xl border border-violet/35 bg-violet/10 p-5 transition-all duration-200 hover:bg-violet/15"
    >
      <div className="pointer-events-none absolute -bottom-12 right-12 h-32 w-32 rounded-full bg-violet/25 blur-2xl" />
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet/20 text-violet-bright ring-1 ring-violet/40">
        <BookmarkX className="h-5 w-5" />
      </span>
      <div className="relative min-w-0 flex-1">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-violet-bright">
          Drill your mistakes
        </p>
        <p className="mt-1 text-[0.95rem] font-medium leading-snug text-fg">
          {count} question{count === 1 ? "" : "s"} due for review
        </p>
        <p className="mt-0.5 text-[0.82rem] leading-snug text-fg-muted">
          Spaced repetition over the questions you got wrong — it resurfaces
          each one right before you&apos;d forget it. The most effective way to
          make it stick.
        </p>
      </div>
      <ArrowRight className="relative h-5 w-5 shrink-0 text-violet-bright transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
