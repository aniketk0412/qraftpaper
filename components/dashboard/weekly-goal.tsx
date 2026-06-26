import { CheckCircle2 } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
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
    <Panel
      label="Weekly goal"
      right={
        weekly.hit ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[2px] border border-accent/35 bg-accent/15 px-2 py-0.5 font-mono text-[0.56rem] uppercase tracking-[0.16em] text-accent">
            <CheckCircle2 className="h-3 w-3" />
            Hit
          </span>
        ) : undefined
      }
    >
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {weekly.done}
        <span className="ml-1 text-base font-medium text-fg-subtle">
          / {weekly.target} days
        </span>
      </p>

      {/* 7 grid cells, oldest first → today is the last. Practised days ink
          in solid; today gets an accent rule even when empty so the eye lands
          on it — ticked boxes on a chart rather than glowing dots. */}
      <div className="mt-5 flex items-end justify-between gap-1.5">
        {weekly.days.map((on, i) => {
          const isToday = i === weekly.days.length - 1;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "h-6 w-6 rounded-[2px] border transition-colors",
                  on ? "border-accent bg-accent" : "border-line bg-canvas",
                  isToday && !on && "border-violet-bright",
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

      <div className="mt-5">
        <div className="h-1.5 w-full overflow-hidden bg-line-strong/50">
          <div
            className={cn(
              "h-full transition-all duration-500",
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
    </Panel>
  );
}
