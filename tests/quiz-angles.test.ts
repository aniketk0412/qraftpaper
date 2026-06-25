import { describe, expect, it } from "vitest";

import { QUIZ_ANGLES, pickQuizAngle } from "@/lib/quiz-angles";

describe("QUIZ_ANGLES", () => {
  it("has several well-formed, uniquely-keyed angles", () => {
    expect(QUIZ_ANGLES.length).toBeGreaterThanOrEqual(4);
    const keys = QUIZ_ANGLES.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length); // all unique
    for (const a of QUIZ_ANGLES) {
      expect(a.key.length).toBeGreaterThan(0);
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.guidance.length).toBeGreaterThan(20);
    }
  });
});

describe("pickQuizAngle", () => {
  it("rotates through every angle in order across successive quizzes", () => {
    const cycle = QUIZ_ANGLES.map((_, i) => pickQuizAngle(i).key);
    expect(cycle).toEqual(QUIZ_ANGLES.map((a) => a.key));
    // A student's first N quizzes for a subject get N DIFFERENT angles.
    expect(new Set(cycle).size).toBe(QUIZ_ANGLES.length);
  });

  it("wraps around after the list is exhausted", () => {
    const n = QUIZ_ANGLES.length;
    expect(pickQuizAngle(n).key).toBe(QUIZ_ANGLES[0].key);
    expect(pickQuizAngle(n + 1).key).toBe(QUIZ_ANGLES[1].key);
    expect(pickQuizAngle(2 * n - 1).key).toBe(QUIZ_ANGLES[n - 1].key);
  });

  it("is deterministic for a given count", () => {
    expect(pickQuizAngle(3).key).toBe(pickQuizAngle(3).key);
  });

  it("clamps negative / non-finite counts to the first angle (never throws)", () => {
    expect(pickQuizAngle(-1)).toBe(QUIZ_ANGLES[0]);
    expect(pickQuizAngle(Number.NaN)).toBe(QUIZ_ANGLES[0]);
    expect(pickQuizAngle(-99)).toBe(QUIZ_ANGLES[0]);
  });
});
