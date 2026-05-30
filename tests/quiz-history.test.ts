import { describe, expect, it } from "vitest";

import {
  buildDrillQuiz,
  dedupeWrongAnswers,
  distinctWrongCount,
  parseDrillQuestionId,
  wrongKey,
  type WrongAnswer,
} from "@/lib/quiz-history";

function wrong(overrides: Partial<WrongAnswer> = {}): WrongAnswer {
  return {
    quizId: "11111111-1111-1111-1111-111111111111",
    questionId: "q1",
    prompt: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    pickedIndex: 0,
    correctIndex: 1,
    unit: "Unit I",
    difficulty: "Easy",
    explanation: "Two plus two is four.",
    subjectCode: "MA-101",
    takenAt: 1000,
    ...overrides,
  };
}

describe("wrongKey", () => {
  it("combines quizId and questionId", () => {
    expect(wrongKey({ quizId: "a", questionId: "b" })).toBe("a::b");
  });
});

describe("distinctWrongCount", () => {
  it("counts distinct (quiz, question) pairs, not raw rows", () => {
    const list = [
      wrong({ questionId: "q1", takenAt: 1 }),
      wrong({ questionId: "q1", takenAt: 2 }), // dup question
      wrong({ questionId: "q2", takenAt: 3 }),
    ];
    expect(distinctWrongCount(list)).toBe(2);
  });

  it("is zero for an empty list", () => {
    expect(distinctWrongCount([])).toBe(0);
  });
});

describe("dedupeWrongAnswers", () => {
  it("keeps the most recent record per question", () => {
    const list = [
      wrong({ questionId: "q1", takenAt: 1, prompt: "old" }),
      wrong({ questionId: "q1", takenAt: 5, prompt: "new" }),
    ];
    const deduped = dedupeWrongAnswers(list);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].prompt).toBe("new");
  });

  it("returns newest-first across distinct questions", () => {
    const list = [
      wrong({ questionId: "q1", takenAt: 1 }),
      wrong({ questionId: "q2", takenAt: 9 }),
      wrong({ questionId: "q3", takenAt: 5 }),
    ];
    const order = dedupeWrongAnswers(list).map((w) => w.questionId);
    expect(order).toEqual(["q2", "q3", "q1"]);
  });
});

describe("buildDrillQuiz", () => {
  it("returns null for an empty backlog", () => {
    expect(buildDrillQuiz([])).toBeNull();
  });

  it("reconstructs a runnable quiz from wrong answers", () => {
    const quiz = buildDrillQuiz([wrong()]);
    expect(quiz).not.toBeNull();
    expect(quiz?.id).toBe("drill");
    expect(quiz?.questions).toHaveLength(1);
    const q = quiz!.questions[0];
    expect(q.options).toEqual(["3", "4", "5", "6"]);
    expect(q.correctIndex).toBe(1);
    expect(q.explanation).toBe("Two plus two is four.");
  });

  it("dedupes so a repeated question appears once", () => {
    const quiz = buildDrillQuiz([
      wrong({ questionId: "q1", takenAt: 1 }),
      wrong({ questionId: "q1", takenAt: 2 }),
    ]);
    expect(quiz?.questions).toHaveLength(1);
  });

  it("caps the question count at the limit", () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      wrong({ questionId: `q${i}`, takenAt: i }),
    );
    const quiz = buildDrillQuiz(many, 10);
    expect(quiz?.questions).toHaveLength(10);
  });

  it("encodes origin ids that round-trip through parseDrillQuestionId", () => {
    const quiz = buildDrillQuiz([
      wrong({ quizId: "aaaa-bbbb", questionId: "q7" }),
    ]);
    const id = quiz!.questions[0].id;
    expect(parseDrillQuestionId(id)).toEqual({
      quizId: "aaaa-bbbb",
      questionId: "q7",
    });
  });
});

describe("parseDrillQuestionId", () => {
  it("parses a well-formed drill id", () => {
    expect(parseDrillQuestionId("drill::quiz-1::q2")).toEqual({
      quizId: "quiz-1",
      questionId: "q2",
    });
  });

  it("returns null for a non-drill id", () => {
    expect(parseDrillQuestionId("q2")).toBeNull();
    expect(parseDrillQuestionId("drill::onlyone")).toBeNull();
    expect(parseDrillQuestionId("notdrill::a::b")).toBeNull();
  });

  it("handles a uuid quizId with hyphens correctly", () => {
    const uuid = "11111111-1111-1111-1111-111111111111";
    expect(parseDrillQuestionId(`drill::${uuid}::q3`)).toEqual({
      quizId: uuid,
      questionId: "q3",
    });
  });
});
