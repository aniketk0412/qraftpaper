import { describe, expect, it } from "vitest";

import {
  DEMO_LEVELS,
  DEMO_QUIZZES,
  demoQuizzesForLevel,
  findDemoQuiz,
} from "@/lib/demo-quizzes";

const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

describe("demo quiz catalog integrity", () => {
  it("has at least one quiz per declared level", () => {
    for (const level of DEMO_LEVELS) {
      expect(demoQuizzesForLevel(level.id).length).toBeGreaterThan(0);
    }
  });

  it("uses unique subjects within each level (so the picker has no dupes)", () => {
    for (const level of DEMO_LEVELS) {
      const subjects = demoQuizzesForLevel(level.id).map((e) => e.subject);
      expect(new Set(subjects).size).toBe(subjects.length);
    }
  });

  // The whole point of a demo is to look right — a malformed question or a
  // wrong answer key is worse than no demo. Validate every authored quiz.
  for (const entry of DEMO_QUIZZES) {
    describe(`${entry.level} · ${entry.subject}`, () => {
      it("has populated metadata and at least one question", () => {
        expect(entry.subject.trim()).not.toBe("");
        expect(entry.stage.trim()).not.toBe("");
        expect(entry.blurb.trim()).not.toBe("");
        expect(entry.quiz.questions.length).toBeGreaterThan(0);
        expect(entry.quiz.durationMins).toBeGreaterThan(0);
      });

      it("every question is well-formed with an in-range answer key", () => {
        const seenIds = new Set<string>();
        for (const q of entry.quiz.questions) {
          expect(q.id).toBeTruthy();
          expect(seenIds.has(q.id)).toBe(false);
          seenIds.add(q.id);

          expect(q.prompt.trim()).not.toBe("");
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          expect(q.options.length).toBeLessThanOrEqual(6);
          // No blank or duplicate options.
          expect(q.options.every((o) => o.trim() !== "")).toBe(true);
          expect(new Set(q.options).size).toBe(q.options.length);

          expect(Number.isInteger(q.correctIndex)).toBe(true);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(q.options.length);

          expect(q.unit.trim()).not.toBe("");
          expect(DIFFICULTIES.has(q.difficulty)).toBe(true);
          expect(q.explanation.trim()).not.toBe("");
        }
      });
    });
  }
});

describe("findDemoQuiz", () => {
  it("returns the matching entry for a known level + subject", () => {
    const entry = findDemoQuiz("school", "Mathematics");
    expect(entry?.subject).toBe("Mathematics");
    expect(entry?.level).toBe("school");
  });

  it("returns undefined for an unknown combination", () => {
    expect(findDemoQuiz("school", "Astrophysics")).toBeUndefined();
    // Right subject name, wrong level.
    expect(findDemoQuiz("school", "Computer Science")).toBeUndefined();
  });
});

describe("demoQuizzesForLevel", () => {
  it("returns only quizzes of the requested level", () => {
    const college = demoQuizzesForLevel("college");
    expect(college.every((e) => e.level === "college")).toBe(true);
  });
});
