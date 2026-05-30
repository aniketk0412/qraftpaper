import { describe, expect, it } from "vitest";

import {
  STREAK_MILESTONES,
  currentMilestone,
  summariseStreak,
} from "@/lib/streaks";

const TODAY = "2026-05-30";
/** Build a list of YYYY-MM-DD keys offset back from TODAY. */
function daysAgo(...offsets: number[]): string[] {
  return offsets.map((n) => {
    const ms = Date.parse(`${TODAY}T00:00:00Z`) - n * 86_400_000;
    return new Date(ms).toISOString().slice(0, 10);
  });
}

describe("summariseStreak", () => {
  it("returns all-zero for no activity", () => {
    expect(summariseStreak([], TODAY)).toEqual({
      current: 0,
      longest: 0,
      totalDays: 0,
      practisedToday: false,
      daysSinceLast: null,
    });
  });

  it("counts a current streak ending today", () => {
    const s = summariseStreak(daysAgo(0, 1, 2), TODAY);
    expect(s.current).toBe(3);
    expect(s.practisedToday).toBe(true);
    expect(s.daysSinceLast).toBe(0);
  });

  it("keeps the streak alive when today is missing but yesterday isn't", () => {
    // The grace rule: a not-yet-practised today doesn't break the streak.
    const s = summariseStreak(daysAgo(1, 2, 3), TODAY);
    expect(s.current).toBe(3);
    expect(s.practisedToday).toBe(false);
    expect(s.daysSinceLast).toBe(1);
  });

  it("breaks the current streak once two days are missed", () => {
    // Latest activity was 2 days ago -> today AND yesterday both missing.
    const s = summariseStreak(daysAgo(2, 3, 4), TODAY);
    expect(s.current).toBe(0);
    expect(s.daysSinceLast).toBe(2);
  });

  it("finds the longest run even when it's in the middle, not current", () => {
    // current run = today only (1); a 4-day run sits earlier with gaps around.
    const s = summariseStreak(daysAgo(0, 3, 4, 5, 6, 10), TODAY);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(4);
  });

  it("counts distinct days only and ignores input order / duplicates", () => {
    const keys = [...daysAgo(2, 0, 1), ...daysAgo(0)]; // unordered + dup today
    const s = summariseStreak(keys, TODAY);
    expect(s.totalDays).toBe(3);
    expect(s.current).toBe(3);
  });

  it("treats a single day as a streak of 1", () => {
    const s = summariseStreak(daysAgo(0), TODAY);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
  });
});

describe("currentMilestone", () => {
  it("returns null for a streak of 0", () => {
    expect(currentMilestone(0)).toBeNull();
  });

  it("returns the exact milestone value when hit", () => {
    expect(currentMilestone(3)).toBe(3);
    expect(currentMilestone(7)).toBe(7);
    expect(currentMilestone(14)).toBe(14);
    expect(currentMilestone(30)).toBe(30);
    expect(currentMilestone(100)).toBe(100);
  });

  it("returns null when not exactly on a milestone", () => {
    expect(currentMilestone(2)).toBeNull();
    expect(currentMilestone(4)).toBeNull();
    expect(currentMilestone(15)).toBeNull();
    expect(currentMilestone(99)).toBeNull();
    expect(currentMilestone(101)).toBeNull();
  });

  it("uses the canonical milestone list", () => {
    expect([...STREAK_MILESTONES]).toEqual([3, 7, 14, 30, 50, 100]);
  });
});
