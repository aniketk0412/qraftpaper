import { describe, expect, it } from "vitest";

import {
  achievementSummary,
  computeAchievements,
  nextAchievement,
  type AchievementStats,
} from "@/lib/achievements";

function stats(over: Partial<AchievementStats> = {}): AchievementStats {
  return {
    totalPapers: 0,
    totalQuizzes: 0,
    totalQuestionsAnswered: 0,
    bestQuizPct: null,
    longestStreak: 0,
    subjectsWithProfile: 0,
    subjectsExamReady: 0,
    ...over,
  };
}

const find = (list: ReturnType<typeof computeAchievements>, key: string) =>
  list.find((a) => a.key === key)!;

describe("computeAchievements", () => {
  it("earns nothing for a brand-new account", () => {
    const list = computeAchievements(stats());
    expect(list.every((a) => !a.earned)).toBe(true);
    expect(achievementSummary(list).earned).toBe(0);
  });

  it("unlocks the first-step badges on first paper/quiz", () => {
    const list = computeAchievements(stats({ totalPapers: 1, totalQuizzes: 1 }));
    expect(find(list, "first-paper").earned).toBe(true);
    expect(find(list, "first-quiz").earned).toBe(true);
  });

  it("reports partial progress toward a locked badge", () => {
    const list = computeAchievements(stats({ totalQuestionsAnswered: 40 }));
    const century = find(list, "century");
    expect(century.earned).toBe(false);
    expect(century.progress).toBeCloseTo(0.4, 5);
    expect(century.current).toBe(40);
    expect(century.goal).toBe(100);
  });

  it("treats a null best score as zero progress on sharpshooter", () => {
    const sharp = find(computeAchievements(stats()), "sharpshooter");
    expect(sharp.earned).toBe(false);
    expect(sharp.progress).toBe(0);
  });

  it("earns sharpshooter at 90%+", () => {
    expect(find(computeAchievements(stats({ bestQuizPct: 92 })), "sharpshooter").earned).toBe(true);
  });

  it("shares the streak value across both streak badges", () => {
    const list = computeAchievements(stats({ longestStreak: 7 }));
    expect(find(list, "consistent").earned).toBe(true);
    expect(find(list, "unstoppable").earned).toBe(false);
    expect(find(list, "unstoppable").progress).toBeCloseTo(7 / 30, 5);
  });

  it("caps current at the goal and progress at 1", () => {
    const list = computeAchievements(stats({ totalQuestionsAnswered: 500 }));
    const century = find(list, "century");
    expect(century.current).toBe(100);
    expect(century.progress).toBe(1);
  });
});

describe("nextAchievement", () => {
  it("points at the closest locked badge", () => {
    // 80/100 questions is closer than 1/3 subjects.
    const list = computeAchievements(
      stats({ totalQuestionsAnswered: 80, subjectsWithProfile: 1 }),
    );
    expect(nextAchievement(list)?.key).toBe("century");
  });

  it("is null when everything is unlocked", () => {
    const list = computeAchievements(
      stats({
        totalPapers: 5,
        totalQuizzes: 5,
        totalQuestionsAnswered: 200,
        bestQuizPct: 95,
        longestStreak: 40,
        subjectsWithProfile: 3,
        subjectsExamReady: 2,
      }),
    );
    expect(nextAchievement(list)).toBeNull();
  });
});
