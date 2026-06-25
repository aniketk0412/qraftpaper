import {
  Award,
  BookOpen,
  FileText,
  Flame,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
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
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-4 w-4 text-gold" />
          <p className="text-sm font-medium">Achievements</p>
        </div>
        <span className="font-mono text-[0.72rem] tabular-nums text-fg-muted">
          {earned}/{total}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
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
                "grid aspect-square place-items-center rounded-xl ring-1 transition-colors",
                a.earned
                  ? "bg-gold/15 text-gold ring-gold/35"
                  : "bg-tint/[0.02] text-fg-subtle ring-line",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
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
    </GlassCard>
  );
}
