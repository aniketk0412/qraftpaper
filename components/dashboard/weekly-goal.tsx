import { CheckCircle2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeeklyActivity } from "@/lib/streaks";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Compact weekly-goal card for the dashboard. Surfaces "X / target days this
 * week" with seven coloured dots, oldest-first → today. The strongest non-
 * streak engagement loop: even users who miss a day can still hit the weekly
 * goal and feel rewarded. Modelled on Duolingo's Weekly Quest pattern.
 *
 * Implementation notes:
 *   - Pure server component (no client state). The data is computed by
 *     getWeeklyActivity() on the request.
 *   - We compute weekday labels from the actual current date so "today" is
 *     always the last dot — independent of timezone weirdness server-side.
 */
export function WeeklyGoalCard({ weekly }: { weekly: WeeklyActivity }) {
  // Build M/T/W labels anchored to the last seven UTC days, oldest first.
  // This makes the rightmost dot always represent "today" — the position
  // users instinctively check first.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    labels.push(DAY_LABELS[(d.getUTCDay() + 6) % 7]); // Mon-anchored
  }

  const pct = Math.min(100, Math.round((weekly.done / weekly.target) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-card-hi/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-fg-subtle">
            <Target className="h-3 w-3" />
            Weekly goal
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {weekly.done}
            <span className="ml-1 text-base font-medium text-fg-subtle">
              / {weekly.target} days
            </span>
          </p>
        </div>
        {weekly.hit && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/35 bg-accent/15 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-accent">
            <CheckCircle2 className="h-3 w-3" />
            Hit
          </span>
        )}
      </div>

      {/* 7 dots, oldest first → today is the last. Practised days light up
          accent; today specifically gets a ring even when unpractised so the
          eye lands on it. */}
      <div className="mt-5 flex items-end justify-between gap-1.5">
        {weekly.days.map((on, i) => {
          const isToday = i === weekly.days.length - 1;
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "h-6 w-6 rounded-full transition-colors",
                  on
                    ? "bg-accent text-on-accent ring-1 ring-accent/50"
                    : "bg-tint/[0.04] ring-1 ring-line",
                  isToday && !on && "ring-2 ring-violet/45",
                )}
                aria-label={
                  on
                    ? `Practised on day ${i + 1}`
                    : `Not practised on day ${i + 1}`
                }
              />
              <span
                className={cn(
                  "font-mono text-[0.58rem] uppercase tracking-[0.12em]",
                  isToday ? "text-violet-bright" : "text-fg-subtle",
                )}
              >
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Linear progress bar reinforces the dots — gives users two ways to
          read the same data, useful at glance. */}
      <div className="mt-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-tint/[0.06]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              weekly.hit ? "bg-accent" : "bg-violet-bright",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-[0.74rem] leading-snug text-fg-muted">
          {weekly.hit
            ? "Goal hit. Anything else this week is bonus."
            : weekly.done === 0
              ? "Practise any day to start the week."
              : `${weekly.target - weekly.done} more day${weekly.target - weekly.done === 1 ? "" : "s"} to hit your weekly goal.`}
        </p>
      </div>
    </div>
  );
}
