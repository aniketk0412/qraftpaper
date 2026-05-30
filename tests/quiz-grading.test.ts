import { describe, expect, it } from "vitest";

import { gradeQuizAnswers } from "@/lib/quiz-grading";
import type { Quiz, QuizQuestion } from "@/lib/types";

function question(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    id: "q1",
    prompt: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    unit: "Unit I",
    difficulty: "Easy",
    explanation: "Two plus two is four.",
    ...overrides,
  };
}

function quiz(questions: QuizQuestion[]): Quiz {
  return {
    id: "quiz-1",
    subject: "Maths",
    subjectCode: "MA-101",
    title: "Test",
    durationMins: 10,
    questions,
  };
}

describe("gradeQuizAnswers", () => {
  it("scores a fully-correct submission", () => {
    const q = quiz([
      question({ id: "a", correctIndex: 1 }),
      question({ id: "b", correctIndex: 2 }),
    ]);
    const graded = gradeQuizAnswers(q, { a: 1, b: 2 });
    expect(graded.score).toBe(2);
    expect(graded.total).toBe(2);
    expect(graded.results.a.correct).toBe(true);
    expect(graded.results.b.correct).toBe(true);
  });

  it("marks a wrong pick incorrect but still reveals the answer key", () => {
    const q = quiz([question({ id: "a", correctIndex: 1 })]);
    const graded = gradeQuizAnswers(q, { a: 0 });
    expect(graded.score).toBe(0);
    expect(graded.results.a).toEqual({
      correctIndex: 1,
      explanation: "Two plus two is four.",
      correct: false,
    });
  });

  it("ignores unanswered questions — partial submissions score only what was attempted", () => {
    const q = quiz([
      question({ id: "a", correctIndex: 1 }),
      question({ id: "b", correctIndex: 2 }),
    ]);
    const graded = gradeQuizAnswers(q, { a: 1 });
    expect(graded.score).toBe(1);
    expect(graded.total).toBe(2); // total is the WHOLE quiz, not just answered
    expect(graded.results).not.toHaveProperty("b");
  });

  it("ignores phantom answers to ids not in the quiz (anti-tamper)", () => {
    const q = quiz([question({ id: "a", correctIndex: 1 })]);
    const graded = gradeQuizAnswers(q, { a: 1, ghost: 0, evil: 99 });
    expect(graded.score).toBe(1);
    expect(graded.total).toBe(1);
    expect(Object.keys(graded.results)).toEqual(["a"]);
  });

  it("treats an empty submission as zero score over the full total", () => {
    const q = quiz([question({ id: "a" }), question({ id: "b" })]);
    const graded = gradeQuizAnswers(q, {});
    expect(graded).toEqual({ results: {}, score: 0, total: 2 });
  });

  it("does not count an out-of-range pick as correct", () => {
    const q = quiz([question({ id: "a", correctIndex: 1 })]);
    const graded = gradeQuizAnswers(q, { a: 7 });
    expect(graded.score).toBe(0);
    expect(graded.results.a.correct).toBe(false);
  });
});
