import { describe, expect, it } from "vitest";

import {
  GRADE_CHANGE_COOLDOWN_DAYS,
  canChangeGrade,
  describeGrade,
  isValidGrade,
  nextGradeChangeAt,
} from "@/lib/education";

const DAY = 86_400_000;

describe("isValidGrade", () => {
  it("accepts school classes 1–12", () => {
    expect(isValidGrade("school", "1")).toBe(true);
    expect(isValidGrade("school", "12")).toBe(true);
  });

  it("rejects out-of-range or malformed school classes", () => {
    expect(isValidGrade("school", "0")).toBe(false);
    expect(isValidGrade("school", "13")).toBe(false);
    expect(isValidGrade("school", "ten")).toBe(false);
    expect(isValidGrade("school", "")).toBe(false);
  });

  it("accepts known college departments and rejects unknown ones", () => {
    expect(isValidGrade("college", "cse")).toBe(true);
    expect(isValidGrade("college", "law")).toBe(true);
    expect(isValidGrade("college", "astrology")).toBe(false);
  });

  it("rejects a mismatched level/grade and missing input", () => {
    expect(isValidGrade("school", "cse")).toBe(false);
    expect(isValidGrade("college", "10")).toBe(false);
    expect(isValidGrade(null, "10")).toBe(false);
    expect(isValidGrade("school", null)).toBe(false);
  });
});

describe("describeGrade", () => {
  it("labels school classes and college departments", () => {
    expect(describeGrade("school", "10")).toBe("Class 10");
    expect(describeGrade("college", "cse")).toBe("Computer Science / IT");
  });

  it("returns null for an invalid pair", () => {
    expect(describeGrade("school", "99")).toBeNull();
    expect(describeGrade("college", "nope")).toBeNull();
  });
});

describe("canChangeGrade — the 6-month lock", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("allows the first set when never changed (null)", () => {
    expect(canChangeGrade(null, now)).toBe(true);
  });

  it("blocks a change within the cooldown window", () => {
    const justNow = new Date(now.getTime() - 1 * DAY);
    expect(canChangeGrade(justNow, now)).toBe(false);
    const almost = new Date(now.getTime() - (GRADE_CHANGE_COOLDOWN_DAYS - 1) * DAY);
    expect(canChangeGrade(almost, now)).toBe(false);
  });

  it("allows a change exactly at and beyond the cooldown", () => {
    const atThreshold = new Date(now.getTime() - GRADE_CHANGE_COOLDOWN_DAYS * DAY);
    expect(canChangeGrade(atThreshold, now)).toBe(true);
    const wayPast = new Date(now.getTime() - 400 * DAY);
    expect(canChangeGrade(wayPast, now)).toBe(true);
  });
});

describe("nextGradeChangeAt", () => {
  it("is the change date plus the cooldown window", () => {
    const changedAt = new Date("2026-01-01T00:00:00Z");
    const next = nextGradeChangeAt(changedAt);
    expect(next.getTime()).toBe(
      changedAt.getTime() + GRADE_CHANGE_COOLDOWN_DAYS * DAY,
    );
    // ...and a user who just changed cannot change again until then.
    expect(canChangeGrade(changedAt, new Date(next.getTime() - DAY))).toBe(false);
    expect(canChangeGrade(changedAt, next)).toBe(true);
  });
});
