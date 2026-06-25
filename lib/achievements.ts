/**
 * Achievements — a derived, stateless collection layer. We don't store an
 * "earned" flag; we recompute which badges are unlocked from stats the student
 * has already accumulated. That keeps it honest (no drift), needs no schema,
 * and still delivers the two things that make badges sticky: a sense of
 * collection ("4 of 8") and a visible NEXT target ("18 questions to Century").
 *
 * Pure — the UI passes stats in and renders what comes back. A future "just
 * unlocked!" celebration can layer on top by diffing against a stored set.
 */

export interface AchievementStats {
  totalPapers: number;
  totalQuizzes: number;
  totalQuestionsAnswered: number;
  /** Best single-quiz score %, or null if no quizzes taken. */
  bestQuizPct: number | null;
  longestStreak: number;
  subjectsWithProfile: number;
  /** Subjects currently at the "exam-ready" readiness band. */
  subjectsExamReady: number;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  earned: boolean;
  /** 0–1 progress toward earning (1 once earned). */
  progress: number;
  /** Current value and the goal, for "X of Y" hints. */
  current: number;
  goal: number;
}

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  value: (s: AchievementStats) => number;
  goal: number;
}

const DEFS: AchievementDef[] = [
  {
    key: "first-paper",
    title: "First draft",
    description: "Generate your first paper",
    value: (s) => s.totalPapers,
    goal: 1,
  },
  {
    key: "first-quiz",
    title: "Pop quiz",
    description: "Take your first quiz",
    value: (s) => s.totalQuizzes,
    goal: 1,
  },
  {
    key: "scholar",
    title: "Scholar",
    description: "Set up 3 subjects",
    value: (s) => s.subjectsWithProfile,
    goal: 3,
  },
  {
    key: "sharpshooter",
    title: "Sharpshooter",
    description: "Score 90%+ on a quiz",
    value: (s) => s.bestQuizPct ?? 0,
    goal: 90,
  },
  {
    key: "century",
    title: "Century",
    description: "Answer 100 questions",
    value: (s) => s.totalQuestionsAnswered,
    goal: 100,
  },
  {
    key: "consistent",
    title: "Consistent",
    description: "Reach a 7-day streak",
    value: (s) => s.longestStreak,
    goal: 7,
  },
  {
    key: "unstoppable",
    title: "Unstoppable",
    description: "Reach a 30-day streak",
    value: (s) => s.longestStreak,
    goal: 30,
  },
  {
    key: "battle-ready",
    title: "Battle-ready",
    description: "Get a subject to exam-ready",
    value: (s) => s.subjectsExamReady,
    goal: 1,
  },
];

function safe(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function computeAchievements(stats: AchievementStats): Achievement[] {
  return DEFS.map((d) => {
    const current = safe(d.value(stats));
    const earned = current >= d.goal;
    const progress = earned
      ? 1
      : d.goal > 0
        ? Math.min(1, current / d.goal)
        : 0;
    return {
      key: d.key,
      title: d.title,
      description: d.description,
      earned,
      progress,
      current: Math.min(current, d.goal),
      goal: d.goal,
    };
  });
}

export function achievementSummary(list: Achievement[]): {
  earned: number;
  total: number;
} {
  return { earned: list.filter((a) => a.earned).length, total: list.length };
}

/** The closest locked achievement — the "you're almost there" nudge. Null when
 *  everything is unlocked. Ties broken by definition order (stable). */
export function nextAchievement(list: Achievement[]): Achievement | null {
  return (
    list
      .filter((a) => !a.earned)
      .sort((a, b) => b.progress - a.progress)[0] ?? null
  );
}
