import { describe, expect, it } from "vitest";

import { reconcileQuiz } from "@/lib/quiz-reconcile";
import type { Quiz, QuizQuestion } from "@/lib/types";

function qq(overrides: Partial<QuizQuestion>): QuizQuestion {
  return {
    id: "q",
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
    id: "quiz1",
    subject: "Maths",
    subjectCode: "MA-101",
    title: "Practice",
    durationMins: 20,
    questions,
  };
}

describe("reconcileQuiz — salvage", () => {
  it("keeps good questions and drops only the broken one", () => {
    const input = quiz([
      qq({ id: "ok1" }),
      qq({ id: "bad", correctIndex: 9 }), // out of bounds -> unsalvageable
      qq({ id: "ok2" }),
    ]);
    const { quiz: out, report } = reconcileQuiz(input);
    expect(out.questions.map((q) => q.id)).toEqual(["ok1", "ok2"]);
    expect(report.generated).toBe(3);
    expect(report.kept).toBe(2);
    expect(report.dropped).toBe(1);
  });

  it("drops a question with fewer than two options", () => {
    const input = quiz([qq({ id: "one", options: ["only"], correctIndex: 0 })]);
    expect(reconcileQuiz(input).quiz.questions).toHaveLength(0);
  });

  it("drops a negative correctIndex", () => {
    const input = quiz([qq({ correctIndex: -1 })]);
    expect(reconcileQuiz(input).quiz.questions).toHaveLength(0);
  });
});

describe("reconcileQuiz — duplicate options + answer remap", () => {
  it("dedupes options and keeps the answer pointing at the right value", () => {
    // "10" is the answer at index 2; a duplicate "5" precedes it.
    const input = quiz([
      qq({ options: ["5", "5", "10", "15"], correctIndex: 2 }),
    ]);
    const { quiz: out, report } = reconcileQuiz(input);
    const q = out.questions[0];
    expect(q.options).toEqual(["5", "10", "15"]);
    expect(q.options[q.correctIndex]).toBe("10");
    expect(report.optionsDeduped).toBe(1);
  });

  it("survives when the ANSWER itself was the duplicated option", () => {
    // Both "4"s; correctIndex points at the second "4".
    const input = quiz([
      qq({ options: ["4", "4", "5"], correctIndex: 1 }),
    ]);
    const q = reconcileQuiz(input).quiz.questions[0];
    expect(q.options).toEqual(["4", "5"]);
    expect(q.options[q.correctIndex]).toBe("4");
  });

  it("drops blank options and the question if too few remain", () => {
    const input = quiz([qq({ options: ["7", "  ", "7"], correctIndex: 0 })]);
    // -> only "7" survives -> < 2 distinct -> dropped
    expect(reconcileQuiz(input).quiz.questions).toHaveLength(0);
  });

  it("does not count a question as deduped when options were already clean", () => {
    const { report } = reconcileQuiz(quiz([qq({})]));
    expect(report.optionsDeduped).toBe(0);
  });
});

describe("reconcileQuiz — count cap + immutability", () => {
  it("trims questions the model over-produced past the requested count", () => {
    const input = quiz([
      qq({ id: "1" }),
      qq({ id: "2" }),
      qq({ id: "3" }),
    ]);
    const { quiz: out, report } = reconcileQuiz(input, 2);
    expect(out.questions.map((q) => q.id)).toEqual(["1", "2"]);
    expect(report.trimmed).toBe(1);
  });

  it("does not mutate the input quiz", () => {
    const input = quiz([qq({ options: ["5", "5", "10"], correctIndex: 2 })]);
    reconcileQuiz(input);
    expect(input.questions[0].options).toEqual(["5", "5", "10"]);
  });
});
