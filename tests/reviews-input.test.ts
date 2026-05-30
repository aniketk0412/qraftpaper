import { describe, expect, it } from "vitest";

import type { MissedQuestion } from "@/lib/reviews";
import {
  cleanMissedQuestions,
  gradeSchema,
  missedSchema,
} from "@/lib/reviews-input";

function missed(overrides: Partial<MissedQuestion> = {}): MissedQuestion {
  return {
    quizId: "11111111-1111-1111-1111-111111111111",
    questionId: "q1",
    prompt: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    unit: "Unit I",
    difficulty: "Easy",
    explanation: "Two plus two is four.",
    subjectCode: "MA-101",
    ...overrides,
  };
}

describe("missedSchema", () => {
  it("accepts a well-formed batch", () => {
    const r = missedSchema.safeParse({ questions: [missed()] });
    expect(r.success).toBe(true);
  });

  it("rejects an empty batch", () => {
    const r = missedSchema.safeParse({ questions: [] });
    expect(r.success).toBe(false);
  });

  it("rejects a question with fewer than two options", () => {
    const r = missedSchema.safeParse({
      questions: [missed({ options: ["only one"] })],
    });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown difficulty", () => {
    const r = missedSchema.safeParse({
      questions: [missed({ difficulty: "Impossible" as never })],
    });
    expect(r.success).toBe(false);
  });

  it("caps the batch at 50 questions", () => {
    const many = Array.from({ length: 51 }, (_, i) =>
      missed({ questionId: `q${i}` }),
    );
    const r = missedSchema.safeParse({ questions: many });
    expect(r.success).toBe(false);
  });

  it("rejects an over-long prompt", () => {
    const r = missedSchema.safeParse({
      questions: [missed({ prompt: "x".repeat(2_001) })],
    });
    expect(r.success).toBe(false);
  });
});

describe("cleanMissedQuestions", () => {
  it("keeps questions whose correctIndex is inside options", () => {
    const list = [missed({ correctIndex: 0 }), missed({ correctIndex: 3 })];
    expect(cleanMissedQuestions(list)).toHaveLength(2);
  });

  it("drops a question whose correctIndex overflows its options", () => {
    const ok = missed({ questionId: "ok", correctIndex: 1 });
    const bad = missed({ questionId: "bad", options: ["a", "b"], correctIndex: 3 });
    const cleaned = cleanMissedQuestions([ok, bad]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].questionId).toBe("ok");
  });

  it("returns an empty array when every question is malformed", () => {
    const bad = missed({ options: ["a", "b"], correctIndex: 5 });
    expect(cleanMissedQuestions([bad])).toEqual([]);
  });
});

describe("gradeSchema", () => {
  it("accepts a valid grade", () => {
    const r = gradeSchema.safeParse({
      quizId: "quiz-1",
      questionId: "q2",
      correct: true,
    });
    expect(r.success).toBe(true);
  });

  it("requires correct to be a boolean", () => {
    const r = gradeSchema.safeParse({
      quizId: "quiz-1",
      questionId: "q2",
      correct: "yes",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty quizId", () => {
    const r = gradeSchema.safeParse({
      quizId: "",
      questionId: "q2",
      correct: false,
    });
    expect(r.success).toBe(false);
  });
});
