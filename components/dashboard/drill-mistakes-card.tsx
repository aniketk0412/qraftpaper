"use client";

import Link from "next/link";
import { ArrowRight, BookmarkX } from "lucide-react";
import { useEffect, useState } from "react";
import { unrevisitedWrongCount } from "@/lib/quiz-history";

/**
 * Banner that nudges the user to revisit the questions they got wrong.
 *
 * Counts come from two stores that are kept in sync by dual-writes:
 *   - `serverCount` — the authoritative cross-device due-count, computed on
 *     the server (getDueReviewCount) and passed in. Survives across devices
 *     and browsers; this is what makes the drill loop follow a signed-in user.
 *   - localStorage (unrevisitedWrongCount) — the per-device fallback that also
 *     covers the anonymous demo quiz (which never hits the DB).
 *
 * We surface the larger of the two: on the same device they agree; on a fresh
 * device the server count carries, and for an anon taker the local count does.
 *
 * Self-hides below a threshold of 3 — a single missed question isn't worth
 * surfacing as a "you have X due" banner, but three+ is a real signal.
 */
export function DrillMistakesCard({
  serverCount = 0,
}: {
  serverCount?: number;
}) {
  // Server render shows just the server count (localStorage isn't available);
  // after hydration we blend in the per-device local count. No flash because
  // the server count is already correct for the cross-device case.
  const [localCount, setLocalCount] = useState<number>(() =>
    typeof window === "undefined" ? 0 : unrevisitedWrongCount(),
  );

  // Re-read whenever the tab regains focus — if the user finished a quiz
  // in another tab the count should refresh without a hard reload.
  useEffect(() => {
    function refresh() {
      setLocalCount(unrevisitedWrongCount());
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const count = Math.max(serverCount, localCount);
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
