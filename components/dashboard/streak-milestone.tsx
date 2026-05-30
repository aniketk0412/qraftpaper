"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Sparkles, X } from "lucide-react";
import { Confetti } from "@/components/ui/confetti";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StreakMilestoneProps {
  /** The day the user has just hit (3, 7, 14, 30, 50, 100). */
  milestone: number;
}

function hasSeenMilestone(milestone: number): boolean {
  if (typeof window === "undefined") return true; // SSR: hide until hydration
  try {
    return Boolean(
      window.localStorage.getItem(`qp-milestone-seen-${milestone}`),
    );
  } catch {
    return false;
  }
}

const COPY: Record<number, { title: string; sub: string }> = {
  3: {
    title: "Three days in. Habit forming.",
    sub: "The science says day 3 is when this starts to feel automatic. Keep showing up.",
  },
  7: {
    title: "One full week. Take a bow.",
    sub: "You just outlasted ~70% of people who download a study app. Keep it going.",
  },
  14: {
    title: "Two weeks. This is sticky now.",
    sub: "Reach day 30 and this becomes a default behaviour — like brushing your teeth.",
  },
  30: {
    title: "30 days. Default behaviour unlocked.",
    sub: "You're now in the rare 5% who actually finished the month. Subjects will start to crystallise.",
  },
  50: {
    title: "50 days straight. Unbothered.",
    sub: "You're closer to the 100-day badge than to giving up. Don't lose it now.",
  },
  100: {
    title: "100 days. Legend mode.",
    sub: "Take a screenshot. Send it to your group chat. You earned it.",
  },
};

/**
 * Celebration banner that appears at the top of the dashboard whenever the
 * user has exactly hit a streak milestone (3 / 7 / 14 / 30 / 50 / 100 days).
 *
 * Dismissable via the X. We store a single localStorage entry per (user-side,
 * milestone) so closing it once doesn't make it pop again on every refresh —
 * but a fresh milestone gets a fresh banner.
 *
 * Why client-side state instead of a DB column: a celebration banner is
 * intentionally ephemeral. If the user clears their browser and the banner
 * reappears the next day, that's fine — it's still real feedback about a
 * real achievement.
 */
export function StreakMilestone({ milestone }: StreakMilestoneProps) {
  // Lazy initializer reads localStorage exactly once during the first render
  // on the client. This avoids the React effect → setState anti-pattern flagged
  // by eslint-plugin-react-hooks while still ensuring the banner doesn't
  // re-appear after dismissal.
  const [open, setOpen] = useState<boolean>(
    () => !hasSeenMilestone(milestone),
  );

  const copy = COPY[milestone];
  if (!copy) return null;

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(`qp-milestone-seen-${milestone}`, "1");
    } catch {
      /* swallow */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: easeOut }}
          className={cn(
            "relative mb-6 overflow-hidden rounded-2xl",
            "border border-gold/35 bg-gradient-to-r from-gold/15 via-tint/[0.02] to-violet/10 p-5",
            "ring-1 ring-gold/20",
          )}
        >
          <div className="pointer-events-none absolute -top-12 left-12 h-32 w-32 rounded-full bg-gold/25 blur-2xl" />
          <div className="pointer-events-none absolute -top-12 right-12 h-32 w-32 rounded-full bg-violet/20 blur-2xl" />

          {/* Confetti burst — runs once on mount (per milestone). Honours
              prefers-reduced-motion via its own internal hook, so we can
              render it unconditionally here. */}
          <Confetti />

          <div className="relative flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/20 text-gold ring-1 ring-gold/40">
              <Flame className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-gold">
                <Sparkles className="h-3 w-3" />
                Day {milestone} unlocked
              </p>
              <p className="mt-1.5 text-lg font-semibold tracking-tight text-fg">
                {copy.title}
              </p>
              <p className="mt-0.5 text-[0.85rem] leading-relaxed text-fg-muted">
                {copy.sub}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-tint/[0.06] hover:text-fg"
              aria-label="Dismiss milestone banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
