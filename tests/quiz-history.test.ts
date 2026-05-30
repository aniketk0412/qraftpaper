import { describe, expect, it } from "vitest";

import {
  applyDrillResultTo,
  buildDrillQuiz,
  dedupeWrongAnswers,
  distinctWrongCount,
  dueDrillCount,
  dueWrongAnswers,
  parseDrillQuestionId,
  srOf,
  weakUnits,
  weakUnitsFromQuestions,
  wrongKey,
  type WrongAnswer,
} from "@/lib/quiz-history";
import { freshSrState } from "@/lib/spaced-repetition";

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

const NOW = Date.parse("2026-05-30T00:00:00Z");
const DAY = 86_400_000;

describe("spaced repetition over the wrong-answer store", () => {
  it("a freshly-missed question is due and appears in the drill", () => {
    const list = [wrong({ takenAt: NOW })];
    expect(dueDrillCount(list, NOW)).toBe(1);
    expect(buildDrillQuiz(list, 10, NOW)).not.toBeNull();
  });

  it("a correct drill answer schedules the card out and hides it from the drill", () => {
    const list = [wrong({ takenAt: NOW })];
    const { wrongs, graduated } = applyDrillResultTo(
      list,
      list[0].quizId,
      list[0].questionId,
      true,
      NOW,
    );
    expect(graduated).toBe(false); // one correct doesn't master it
    // Now scheduled 1 day out -> not due today -> not in the drill.
    expect(dueDrillCount(wrongs, NOW)).toBe(0);
    expect(buildDrillQuiz(wrongs, 10, NOW)).toBeNull();
    // ...but due again tomorrow.
    expect(dueDrillCount(wrongs, NOW + 1 * DAY)).toBe(1);
  });

  it("a wrong drill answer keeps the card due now", () => {
    const list = [wrong({ takenAt: NOW })];
    const { wrongs } = applyDrillResultTo(
      list,
      list[0].quizId,
      list[0].questionId,
      false,
      NOW,
    );
    expect(dueDrillCount(wrongs, NOW)).toBe(1);
    expect(srOf(wrongs[0]).ease).toBeLessThan(2.5); // got harder
  });

  it("a card reliably recalled eventually graduates and leaves the backlog", () => {
    let list = [wrong({ takenAt: NOW })];
    let now = NOW;
    let graduatedEver = false;
    for (let i = 0; i < 12 && !graduatedEver; i++) {
      const r = applyDrillResultTo(
        list,
        "11111111-1111-1111-1111-111111111111",
        "q1",
        true,
        now,
      );
      list = r.wrongs;
      graduatedEver = r.graduated;
      if (list[0]) now = srOf(list[0]).dueAt; // advance to next due date
    }
    expect(graduatedEver).toBe(true);
    expect(list).toHaveLength(0); // removed from the backlog
  });

  it("dueWrongAnswers orders the most-overdue card first", () => {
    const a = wrong({ questionId: "a", takenAt: NOW });
    const b = wrong({ questionId: "b", takenAt: NOW });
    // a scheduled to NOW-2d (very overdue), b to NOW-1d.
    a.sr = { ...freshSrState(NOW), dueAt: NOW - 2 * DAY };
    b.sr = { ...freshSrState(NOW), dueAt: NOW - 1 * DAY };
    const order = dueWrongAnswers([b, a], NOW).map((w) => w.questionId);
    expect(order).toEqual(["a", "b"]);
  });
});

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

describe("weakUnits", () => {
  it("aggregates distinct misses by unit, heaviest first", () => {
    const list = [
      wrong({ questionId: "q1", unit: "Unit III" }),
      wrong({ questionId: "q2", unit: "Unit III" }),
      wrong({ questionId: "q3", unit: "Unit I" }),
    ];
    expect(weakUnits(list)).toEqual([
      { unit: "Unit III", count: 2 },
      { unit: "Unit I", count: 1 },
    ]);
  });

  it("does not double-count a question missed twice", () => {
    const list = [
      wrong({ questionId: "q1", unit: "Unit II", takenAt: 1 }),
      wrong({ questionId: "q1", unit: "Unit II", takenAt: 2 }),
    ];
    expect(weakUnits(list)).toEqual([{ unit: "Unit II", count: 1 }]);
  });

  it("breaks ties alphabetically by unit name", () => {
    const list = [
      wrong({ questionId: "q1", unit: "Unit B" }),
      wrong({ questionId: "q2", unit: "Unit A" }),
    ];
    expect(weakUnits(list).map((w) => w.unit)).toEqual(["Unit A", "Unit B"]);
  });

  it("is empty for an empty backlog", () => {
    expect(weakUnits([])).toEqual([]);
  });
});

describe("weakUnitsFromQuestions", () => {
  it("tallies a server-built drill quiz's questions by unit, heaviest first", () => {
    const questions = [
      { unit: "Unit III" },
      { unit: "Unit III" },
      { unit: "Unit I" },
    ];
    expect(weakUnitsFromQuestions(questions)).toEqual([
      { unit: "Unit III", count: 2 },
      { unit: "Unit I", count: 1 },
    ]);
  });

  it("breaks ties alphabetically", () => {
    const questions = [{ unit: "Unit B" }, { unit: "Unit A" }];
    expect(weakUnitsFromQuestions(questions).map((w) => w.unit)).toEqual([
      "Unit A",
      "Unit B",
    ]);
  });

  it("is empty for no questions", () => {
    expect(weakUnitsFromQuestions([])).toEqual([]);
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
