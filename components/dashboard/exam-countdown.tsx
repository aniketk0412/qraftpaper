import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { DashboardSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

/** Window (in days) within which an exam is considered "urgent" — drives both
 *  the banner and the dashboard's banner-priority logic. Single source of
 *  truth so the page can ask "is an urgent exam showing?" without re-deriving
 *  the threshold and drifting from the banner. */
export const URGENT_EXAM_DAYS = 4;

/** Subjects with an exam inside the urgent window, nearest first. */
function urgentExams(subjects: DashboardSubject[]): DashboardSubject[] {
  return subjects
    .filter(
      (s) =>
        s.daysToExam !== null &&
        s.daysToExam >= 0 &&
        s.daysToExam <= URGENT_EXAM_DAYS,
    )
    .sort((a, b) => (a.daysToExam ?? 99) - (b.daysToExam ?? 99));
}

/** True when at least one subject has an exam in the urgent window. The
 *  dashboard uses this to suppress lower-priority nudges (the drill card)
 *  so a cramming student isn't pulled toward old mistakes instead of the
 *  exam in front of them. */
export function hasUrgentExam(subjects: DashboardSubject[]): boolean {
  return urgentExams(subjects).length > 0;
}

/**
 * Renders the most urgent exam reminder at the top of the dashboard whenever
 * any subject has an exam in 4 days or fewer. Picks the nearest by daysToExam.
 *
 * Rationale: students who set an exam date are signalling intent. Surfacing
 * "3 days to Microeconomics" at the top of every dashboard load is the
 * single most reliable behaviour-change cue in the app — it bypasses every
 * other distraction and gets them straight to "open the subject and grind."
 */
export function ExamCountdownBanner({
  subjects,
}: {
  subjects: DashboardSubject[];
}) {
  const upcoming = urgentExams(subjects);

  if (upcoming.length === 0) return null;
  const target = upcoming[0];
  const days = target.daysToExam ?? 0;

  const headline =
    days === 0
      ? `${target.code} is today.`
      : days === 1
        ? `${target.code} is tomorrow.`
        : `${days} days to ${target.code}.`;

  const sub =
    days === 0
      ? "Last chance — knock out a final mock or a focused MCQ drill."
      : days === 1
        ? "One night, one paper, one quiz. Sleep on it. You're ready."
        : days <= 3
          ? "Cram window. Generate one mock a day until then."
          : "Within striking distance. Practise daily and you won't be cramming on day-of.";

  return (
    <Link
      href={`/dashboard/subjects`}
      className={cn(
        "group relative mb-6 flex items-center gap-4 overflow-hidden rounded-2xl border p-5 transition-all duration-200",
        days <= 1
          ? "border-gold/45 bg-gold/15 hover:bg-gold/20"
          : "border-violet/35 bg-violet/12 hover:bg-violet/18",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-12 right-12 h-32 w-32 rounded-full blur-2xl",
          days <= 1 ? "bg-gold/30" : "bg-violet/30",
        )}
      />

      <span
        className={cn(
          "relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
          days <= 1
            ? "bg-gold/20 text-gold ring-gold/40"
            : "bg-violet/20 text-violet-bright ring-violet/40",
        )}
      >
        <CalendarClock className="h-6 w-6" />
      </span>

      <div className="relative min-w-0 flex-1">
        <p
          className={cn(
            "font-mono text-[0.62rem] uppercase tracking-[0.2em]",
            days <= 1 ? "text-gold" : "text-violet-bright",
          )}
        >
          Upcoming exam
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-fg">
          {headline}
        </p>
        <p className="mt-0.5 text-[0.84rem] leading-snug text-fg-muted">
          {sub}
        </p>
      </div>

      <ArrowRight
        className={cn(
          "relative h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1",
          days <= 1 ? "text-gold" : "text-violet-bright",
        )}
      />
    </Link>
  );
}
