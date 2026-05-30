import { describe, expect, it } from "vitest";

import { reconcilePaper } from "@/lib/paper-reconcile";
import type { PaperQuestion, QuestionPaper } from "@/lib/types";

function q(overrides: Partial<PaperQuestion>): PaperQuestion {
  return {
    id: "q",
    number: "1",
    text: "A question",
    marks: 2,
    unit: "Unit I",
    difficulty: "Easy",
    bloom: "Remember",
    ...overrides,
  };
}

function paper(sections: QuestionPaper["sections"]): QuestionPaper {
  return {
    id: "p1",
    subject: "Maths",
    subjectCode: "MA-101",
    course: "B.Sc",
    examTitle: "End Sem",
    durationMins: 180,
    totalMarks: 999, // intentionally wrong; reconcile must overwrite it
    sections,
  };
}

describe("reconcilePaper — marks honesty", () => {
  it("sets totalMarks to the actual sum of question marks", () => {
    const input = paper([
      {
        id: "a",
        title: "Section A",
        instruction: "",
        questions: [q({ marks: 2 }), q({ marks: 3 })],
      },
      {
        id: "b",
        title: "Section B",
        instruction: "",
        questions: [q({ marks: 10 })],
      },
    ]);
    const { paper: out, report } = reconcilePaper(input, 70);
    expect(out.totalMarks).toBe(15);
    expect(report.actualMarks).toBe(15);
    expect(report.requestedMarks).toBe(70);
    expect(report.marksAdjusted).toBe(true);
    expect(report.marksDelta).toBe(-55);
  });

  it("reports no adjustment when the sum already matches the request", () => {
    const input = paper([
      {
        id: "a",
        title: "A",
        instruction: "",
        questions: [q({ marks: 5 }), q({ marks: 5 })],
      },
    ]);
    const { report } = reconcilePaper(input, 10);
    expect(report.marksAdjusted).toBe(false);
    expect(report.marksDelta).toBe(0);
  });

  it("treats a non-finite or negative marks value as 0, never NaN", () => {
    const input = paper([
      {
        id: "a",
        title: "A",
        instruction: "",
        questions: [
          q({ marks: 5 }),
          q({ marks: Number.NaN as unknown as number }),
          q({ marks: -3 }),
        ],
      },
    ]);
    const { paper: out } = reconcilePaper(input, 5);
    expect(out.totalMarks).toBe(5);
    expect(Number.isNaN(out.totalMarks)).toBe(false);
  });
});

describe("reconcilePaper — sequential numbering", () => {
  it("renumbers 1..N across sections regardless of the model's numbering", () => {
    const input = paper([
      {
        id: "a",
        title: "A",
        instruction: "",
        // model numbered per-section starting at 1
        questions: [q({ number: "1" }), q({ number: "2" })],
      },
      {
        id: "b",
        title: "B",
        instruction: "",
        questions: [q({ number: "1" }), q({ number: "2" })],
      },
    ]);
    const { paper: out, report } = reconcilePaper(input, 8);
    const numbers = out.sections.flatMap((s) =>
      s.questions.map((x) => x.number),
    );
    expect(numbers).toEqual(["1", "2", "3", "4"]);
    expect(report.renumbered).toBe(true);
  });

  it("reports renumbered=false when numbering was already correct", () => {
    const input = paper([
      {
        id: "a",
        title: "A",
        instruction: "",
        questions: [q({ number: "1" }), q({ number: "2" })],
      },
    ]);
    const { report } = reconcilePaper(input, 4);
    expect(report.renumbered).toBe(false);
  });

  it("does not mutate the input paper", () => {
    const input = paper([
      {
        id: "a",
        title: "A",
        instruction: "",
        questions: [q({ number: "9", marks: 1 })],
      },
    ]);
    reconcilePaper(input, 1);
    expect(input.totalMarks).toBe(999);
    expect(input.sections[0].questions[0].number).toBe("9");
  });
});
