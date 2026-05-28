import { describe, expect, it } from "vitest";

import { evaluateBlueprintMatch } from "@/lib/blueprint-match";
import type { PaperGenerationConfig } from "@/lib/ai/generate";
import type { Difficulty, QuestionPaper } from "@/lib/types";

function config(
  overrides: Partial<PaperGenerationConfig> = {},
): PaperGenerationConfig {
  return {
    totalMarks: 70,
    durationMins: 180,
    units: [],
    sections: [
      { title: "Section A", instruction: "x", marksPerQuestion: 2, count: 5 },
      { title: "Section B", instruction: "y", marksPerQuestion: 10, count: 6 },
    ],
    difficultyMix: { Easy: 30, Medium: 50, Hard: 20 },
    ...overrides,
  };
}

let qid = 0;
function q(marks: number, difficulty: Difficulty) {
  qid += 1;
  return {
    id: `q${qid}`,
    number: String(qid),
    text: "question",
    marks,
    unit: "Unit I",
    difficulty,
    bloom: "Apply",
  };
}

function paper(
  sections: { title: string; questions: ReturnType<typeof q>[] }[],
): QuestionPaper {
  return {
    id: "p1",
    subject: "Data Structures",
    subjectCode: "CS-204",
    course: "BE",
    examTitle: "End Sem",
    durationMins: 180,
    totalMarks: 70,
    sections: sections.map((s, i) => ({
      id: `s${i}`,
      title: s.title,
      instruction: "x",
      questions: s.questions,
    })),
  };
}

// A paper that perfectly matches config(): 5×2m + 6×10m = 70 marks, 11
// questions, 2 sections, difficulty split 3/6/2 ≈ 27/55/18.
function perfectPaper(): QuestionPaper {
  return paper([
    {
      title: "Section A",
      questions: [
        q(2, "Easy"),
        q(2, "Easy"),
        q(2, "Easy"),
        q(2, "Medium"),
        q(2, "Medium"),
      ],
    },
    {
      title: "Section B",
      questions: [
        q(10, "Medium"),
        q(10, "Medium"),
        q(10, "Medium"),
        q(10, "Medium"),
        q(10, "Hard"),
        q(10, "Hard"),
      ],
    },
  ]);
}

describe("evaluateBlueprintMatch", () => {
  it("scores a faithful paper near 100 with no flags", () => {
    const result = evaluateBlueprintMatch(config(), perfectPaper());
    expect(result.overall).toBeGreaterThanOrEqual(85);
    expect(result.flags).toHaveLength(0);
    expect(result.dimensions.every((d) => d.ok)).toBe(true);
  });

  it("flags a marks overshoot", () => {
    // Section B questions worth 20m each → 5×2 + 6×20 = 130 marks.
    const heavy = paper([
      {
        title: "Section A",
        questions: [
          q(2, "Easy"),
          q(2, "Easy"),
          q(2, "Easy"),
          q(2, "Medium"),
          q(2, "Medium"),
        ],
      },
      {
        title: "Section B",
        questions: [
          q(20, "Medium"),
          q(20, "Medium"),
          q(20, "Medium"),
          q(20, "Medium"),
          q(20, "Hard"),
          q(20, "Hard"),
        ],
      },
    ]);
    const result = evaluateBlueprintMatch(config(), heavy);
    const marks = result.dimensions.find((d) => d.key === "marks")!;
    expect(marks.actual).toBe("130");
    expect(marks.ok).toBe(false);
    expect(result.flags.some((f) => f.includes("over"))).toBe(true);
  });

  it("flags a missing section", () => {
    const oneSection = paper([
      {
        title: "Section A",
        questions: [q(2, "Easy"), q(2, "Easy"), q(2, "Easy")],
      },
    ]);
    const result = evaluateBlueprintMatch(config(), oneSection);
    const sections = result.dimensions.find((d) => d.key === "sections")!;
    expect(sections.target).toBe("2");
    expect(sections.actual).toBe("1");
    expect(sections.ok).toBe(false);
    expect(result.flags.some((f) => f.toLowerCase().includes("section"))).toBe(
      true,
    );
  });

  it("flags a skewed difficulty distribution", () => {
    // All-hard paper against a 30/50/20 target.
    const allHard = paper([
      {
        title: "Section A",
        questions: [q(2, "Hard"), q(2, "Hard"), q(2, "Hard"), q(2, "Hard"), q(2, "Hard")],
      },
      {
        title: "Section B",
        questions: [
          q(10, "Hard"),
          q(10, "Hard"),
          q(10, "Hard"),
          q(10, "Hard"),
          q(10, "Hard"),
          q(10, "Hard"),
        ],
      },
    ]);
    const result = evaluateBlueprintMatch(config(), allHard);
    const difficulty = result.dimensions.find((d) => d.key === "difficulty")!;
    expect(difficulty.ok).toBe(false);
    expect(difficulty.actual).toBe("0/0/100");
  });

  it("handles a zero-question paper without dividing by zero", () => {
    const empty = paper([{ title: "Section A", questions: [] }]);
    const result = evaluateBlueprintMatch(config(), empty);
    expect(Number.isFinite(result.overall)).toBe(true);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it("normalizes difficulty targets that do not sum to 100", () => {
    // Target 3/5/2 (sum 10) should be read as 30/50/20.
    const result = evaluateBlueprintMatch(
      config({ difficultyMix: { Easy: 3, Medium: 5, Hard: 2 } }),
      perfectPaper(),
    );
    const difficulty = result.dimensions.find((d) => d.key === "difficulty")!;
    expect(difficulty.target).toBe("30/50/20");
  });
});
