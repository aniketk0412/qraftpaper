import { describe, expect, it } from "vitest";

import { STREAK_MILESTONES, currentMilestone } from "@/lib/streaks";

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
