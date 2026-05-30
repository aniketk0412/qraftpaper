import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import type { DashboardSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/**
 * "Practise this next" recommendation card.
 *
 * Algorithm (simple, deterministic, no ML):
 *   1. Strongest signal: imminent exam (<=7 days). Pick the closest.
 *   2. Otherwise: weakest mastery (<70%) among subjects that have any quiz
 *      attempts at all.
 *   3. Fallback: any subject with no quiz attempts yet (push them to take
 *      their first quiz).
 *   4. If none of the above apply (no subjects, or all subjects already
 *      mastered with no exams), render null.
 *
 * The aim is one prescriptive recommendation, not a wall of options. The
 * single-card UX comes from research on Duolingo and Headspace: a daily
 * "do this one thing" is dramatically stickier than "here are 14 things you
 * could do."
 */
export function NextUpCard({ subjects }: { subjects: DashboardSubject[] }) {
  if (subjects.length === 0) return null;

  // 1. Imminent exam.
  const examSoon = subjects
    .filter((s) => s.daysToExam !== null && s.daysToExam >= 0 && s.daysToExam <= 7)
    .sort((a, b) => (a.daysToExam ?? 99) - (b.daysToExam ?? 99))[0];
  if (examSoon) {
    return (
      <RecommendationCard
        title={`Drill ${examSoon.code} — exam ${examSoon.daysToExam === 0 ? "today" : `in ${examSoon.daysToExam} days`}`}
        body="Run a hard-difficulty MCQ quiz on this subject right now. 10 questions, ~20 minutes."
        tone="gold"
        href="/dashboard"
      />
    );
  }

  // 2. Weakest mastery below 70%.
  const weakest = subjects
    .filter((s) => s.masteryPct !== null && s.masteryPct < 70)
    .sort((a, b) => (a.masteryPct ?? 100) - (b.masteryPct ?? 100))[0];
  if (weakest) {
    return (
      <RecommendationCard
        title={`Shore up ${weakest.code} (${weakest.masteryPct}% mastery)`}
        body={`Your weakest subject by quiz average. One easy-mode quiz first to rebuild confidence, then jump to normal.`}
        tone="violet"
        href="/dashboard"
      />
    );
  }

  // 3. Subjects ready but no quiz attempts yet → push to first quiz.
  const untested = subjects.filter(
    (s) => s.hasProfile && s.masteryPct === null,
  )[0];
  if (untested) {
    return (
      <RecommendationCard
        title={`Take your first ${untested.code} quiz`}
        body="You haven't measured yourself on this subject yet. One normal-mode quiz tells you exactly where the gaps are."
        tone="accent"
        href="/dashboard"
      />
    );
  }

  return null;
}

function RecommendationCard({
  title,
  body,
  tone,
  href,
}: {
  title: string;
  body: string;
  tone: "gold" | "violet" | "accent";
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-start gap-4 overflow-hidden rounded-2xl border p-5 transition-all duration-200",
        tone === "gold" &&
          "border-gold/40 bg-gold/10 hover:bg-gold/15",
        tone === "violet" &&
          "border-violet/35 bg-violet/10 hover:bg-violet/15",
        tone === "accent" &&
          "border-accent/35 bg-accent/[0.08] hover:bg-accent/[0.12]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -bottom-12 -right-8 h-32 w-32 rounded-full blur-2xl",
          tone === "gold" && "bg-gold/25",
          tone === "violet" && "bg-violet/25",
          tone === "accent" && "bg-accent/25",
        )}
      />
      <span
        className={cn(
          "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
          tone === "gold" && "bg-gold/20 text-gold ring-gold/40",
          tone === "violet" &&
            "bg-violet/20 text-violet-bright ring-violet/40",
          tone === "accent" && "bg-accent/20 text-accent ring-accent/40",
        )}
      >
        <Target className="h-[18px] w-[18px]" />
      </span>
      <div className="relative min-w-0 flex-1">
        <p
          className={cn(
            "font-mono text-[0.62rem] uppercase tracking-[0.18em]",
            tone === "gold" && "text-gold",
            tone === "violet" && "text-violet-bright",
            tone === "accent" && "text-accent",
          )}
        >
          Practise this next
        </p>
        <p className="mt-1 text-[0.95rem] font-medium leading-snug text-fg">
          {title}
        </p>
        <p className="mt-1 text-[0.82rem] leading-snug text-fg-muted">
          {body}
        </p>
      </div>
      <ArrowRight
        className={cn(
          "relative h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1",
          tone === "gold" && "text-gold",
          tone === "violet" && "text-violet-bright",
          tone === "accent" && "text-accent",
        )}
      />
    </Link>
  );
}
