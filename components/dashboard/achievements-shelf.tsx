import {
  Award,
  BookOpen,
  FileText,
  Flame,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import {
  achievementSummary,
  nextAchievement,
  type Achievement,
} from "@/lib/achievements";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "first-paper": FileText,
  "first-quiz": ListChecks,
  scholar: BookOpen,
  sharpshooter: Target,
  century: Sparkles,
  consistent: Flame,
  unstoppable: Zap,
  "battle-ready": ShieldCheck,
};

/**
 * A glanceable badge shelf. Earned badges glow gold; locked ones sit muted so
 * the contrast itself is the pull ("I want to light those up"). The closest
 * locked badge is named below as the next target. Pure presentational.
 */
export function AchievementsShelf({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const { earned, total } = achievementSummary(achievements);
  const next = nextAchievement(achievements);

  return (
    <Panel
      label="Achievements"
      right={
        <span className="font-mono text-[0.72rem] tabular-nums text-fg-muted">
          {earned}/{total}
        </span>
      }
    >
      {/* Flat line-drawn badge matrix — the 8 slots are bare icons nested in a
          ruled plate-grid table, no rounded blocks or grey circles. Earned
          badges ink in (exam-marker), locked ones sit as faint thin-line
          vectors. */}
      <div className="plate-grid grid grid-cols-4">
        {achievements.map((a) => {
          const Icon = ICONS[a.key] ?? Award;
          return (
            <div
              key={a.key}
              title={
                a.earned
                  ? `${a.title} — ${a.description}`
                  : `${a.title} — ${a.description} (${a.current}/${a.goal})`
              }
              aria-label={`${a.title}: ${a.description}. ${
                a.earned ? "Unlocked" : `${a.current} of ${a.goal}`
              }`}
              className={cn(
                "grid aspect-square place-items-center transition-colors",
                a.earned ? "text-gold" : "text-fg-subtle/50",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={a.earned ? 2 : 1.5} />
            </div>
          );
        })}
      </div>

      {next ? (
        <p className="mt-4 text-[0.78rem] leading-snug text-fg-muted">
          <span className="font-medium text-fg">Next:</span> {next.title} —{" "}
          {next.current}/{next.goal}
        </p>
      ) : (
        <p className="mt-4 text-[0.78rem] text-fg-muted">
          Every badge unlocked. Legend.
        </p>
      )}
    </Panel>
  );
}
